import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/mockDb.ts';
import type {
  ApiSellerProductRecord,
  AvailabilityStatus,
  DynamicCategoryRecord,
  Order,
  OrderStage,
  UserRole,
} from './src/types/commerce.ts';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'kinto-studio-marketplace-api', timestamp: new Date().toISOString() });
  });

  // Public account directory for Quick Switcher / Sign In selector (no passwords exposed)
  app.get('/api/auth/accounts', (_req, res) => {
    res.json({
      accounts: db.users.map((u) => db.toPublicAccount(u)),
    });
  });

  // Authenticate by email/password OR quick-switch accountId
  app.post('/api/auth/login', (req, res) => {
    const { email, password, accountId } = (req.body || {}) as {
      email?: string;
      password?: string;
      accountId?: string;
    };

    const user = accountId
      ? db.users.find((u) => u.id === accountId)
      : db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'No marketplace account matches that email address.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'This account is currently suspended. Contact platform admin.' });
      return;
    }

    if (!accountId && password && user.password !== password) {
      res.status(401).json({ error: `Invalid credentials. Hint: ${user.demoPasswordHint}` });
      return;
    }

    const token = db.issueSession(user.id);
    res.json({
      token,
      user: db.toPublicAccount(user),
    });
  });

  // Register a new Customer or Seller account
  app.post('/api/auth/register', (req, res) => {
    const { fullName, email, phone, password, role, studioName } = (req.body || {}) as {
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: UserRole;
      studioName?: string;
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!fullName?.trim() || !cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Valid full name and email address are required.' });
      return;
    }

    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with that email already exists.' });
      return;
    }

    const chosenRole: UserRole = role === 'seller' ? 'seller' : 'customer';
    const newId = `usr-${chosenRole}-${Date.now().toString(36)}`;
    const newUser = {
      id: newId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone?.trim() || '+1 (415) 555-0100',
      role: chosenRole,
      roleLabel: chosenRole === 'seller' ? 'Seller Studio Partner' : 'Marketplace Member',
      studioName: chosenRole === 'seller' ? studioName?.trim() || `${fullName.trim()} Studio` : undefined,
      status: 'active' as const,
      joinedAt: new Date().toISOString().slice(0, 10),
      location: 'San Francisco & Dhaka',
      demoPasswordHint: password?.trim() || 'studio2026',
      password: password?.trim() || 'studio2026',
    };

    db.users.unshift(newUser);
    if (chosenRole === 'seller') {
      db.sellerApplications.unshift({
        id: `app-${Date.now().toString(36)}`,
        studioName: newUser.studioName || `${newUser.fullName} Studio`,
        ownerName: newUser.fullName,
        email: newUser.email,
        department: 'Multi-Department',
        origin: 'Partner Network',
        submittedAt: new Date().toISOString().slice(0, 10),
        status: 'approved',
        productCount: 0,
        monthlyRevenue: 0,
      });
    }

    const token = db.issueSession(newUser.id);
    res.status(201).json({
      token,
      user: db.toPublicAccount(newUser),
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization;
    const user = db.getUserByToken(token) || db.users[0];
    res.json({ user: db.toPublicAccount(user) });
  });

  app.patch('/api/auth/profile', (req, res) => {
    const token = req.headers.authorization;
    const user = db.getUserByToken(token);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { fullName, email, phone, studioName } = req.body || {};
    if (typeof fullName === 'string' && fullName.trim()) user.fullName = fullName.trim();
    if (typeof email === 'string' && email.includes('@')) user.email = email.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof studioName === 'string' && user.role === 'seller') user.studioName = studioName.trim();
    res.json({ user: db.toPublicAccount(user) });
  });

  // Live Storefront Sync: Overrides, Seller Created Products, Dynamic Categories
  app.get('/api/storefront/state', (_req, res) => {
    res.json({
      productOverrides: db.productOverrides,
      sellerProducts: db.sellerCreatedProducts,
      customCategories: db.customCategories,
    });
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    const role = (req.query.role as UserRole | undefined) || 'customer';
    const filtered = db.notifications.filter(
      (n) => n.roleScope === 'all' || n.roleScope === role || (role === 'admin' && n.roleScope !== 'customer')
    );
    res.json({ notifications: filtered });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const target = db.notifications.find((n) => n.id === req.params.id);
    if (target) target.read = true;
    res.json({ ok: true, id: req.params.id });
  });

  // Orders API
  app.get('/api/orders', (_req, res) => {
    res.json({ orders: db.orders });
  });

  app.post('/api/orders', (req, res) => {
    const order = req.body as Order;
    if (!order || !order.id || !Array.isArray(order.items)) {
      res.status(400).json({ error: 'Invalid order payload' });
      return;
    }
    db.orders = [order, ...db.orders.filter((o) => o.id !== order.id)];
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Order Confirmed · #${order.id}`,
      message: `${order.customerName} placed an order totaling $${order.total.toFixed(2)}.`,
      category: 'order',
      createdAt: 'Just now',
      read: false,
      roleScope: 'all',
      orderId: order.id,
    });
    res.status(201).json({ order });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const { stage, note } = (req.body || {}) as { stage?: OrderStage; note?: string };
    const found = db.orders.find((o) => o.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (!stage) {
      res.status(400).json({ error: 'Target stage required' });
      return;
    }
    const updated = db.advanceOrderTimeline(found, stage, note);
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Order #${updated.id} → ${updated.currentStage}`,
      message: `Fulfillment status updated to ${updated.currentStage}.`,
      category: 'order',
      createdAt: 'Just now',
      read: false,
      roleScope: 'customer',
      orderId: updated.id,
    });
    res.json({ order: updated });
  });

  app.post('/api/orders/:id/action', (req, res) => {
    const { action, reason } = (req.body || {}) as {
      action?: 'cancel' | 'return';
      reason?: string;
    };
    const found = db.orders.find((o) => o.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (action === 'cancel') {
      if (!['Confirmed', 'Processing'].includes(found.currentStage)) {
        res.status(400).json({ error: 'Orders already packed or shipped cannot be cancelled.' });
        return;
      }
      const updated = db.advanceOrderTimeline(found, 'Cancelled', reason);
      res.json({ order: updated });
      return;
    }
    if (action === 'return') {
      if (found.currentStage !== 'Delivered') {
        res.status(400).json({ error: 'Returns may only be requested after delivery.' });
        return;
      }
      const updated = db.advanceOrderTimeline(found, 'Return Requested', reason);
      res.json({ order: updated });
      return;
    }
    res.status(400).json({ error: 'Unsupported customer order action' });
  });

  // Seller Dashboard & Product Management APIs
  app.get('/api/seller/dashboard', (req, res) => {
    const token = req.headers.authorization;
    const user = db.getUserByToken(token);
    const activeStudio = user?.studioName || 'Aeterna & Loom Collective';
    const ownerName = user?.fullName || 'Elena Vance';

    const combinedInventory = [
      ...db.sellerCreatedProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel,
        price: p.price,
        stockCount: p.stockCount,
        availability: p.availability,
        imagePresetKey: p.imagePresetKey,
        monthlyUnitsSold: 4,
      })),
      ...db.sellerInventory,
    ];

    const pendingOrders = db.orders.filter(
      (o) => !['Delivered', 'Cancelled', 'Return Requested'].includes(o.currentStage)
    );

    const monthlyGmv = combinedInventory.reduce(
      (sum, item) => sum + item.price * item.monthlyUnitsSold,
      0
    );

    res.json({
      studioName: activeStudio,
      ownerName,
      kpis: {
        monthlyGmv,
        pendingFulfillment: pendingOrders.length,
        lowStockSkus: combinedInventory.filter((i) => i.stockCount <= 8).length,
        activeListings: combinedInventory.length,
        avgRating: 4.88,
      },
      revenueSeries: [
        { month: 'Jun', gmv: 34200, orders: 68 },
        { month: 'Jul', gmv: 38900, orders: 74 },
        { month: 'Aug', gmv: 41600, orders: 82 },
        { month: 'Sep', gmv: 44100, orders: 89 },
        { month: 'Oct', gmv: 46800, orders: 95 },
        { month: 'Nov', gmv: monthlyGmv, orders: 102 + pendingOrders.length },
      ],
      inventory: combinedInventory,
      fulfillmentQueue: db.orders.slice(0, 8),
    });
  });

  app.post('/api/seller/products', (req, res) => {
    const token = req.headers.authorization;
    const user = db.getUserByToken(token);
    const body = (req.body || {}) as {
      name?: string;
      brand?: string;
      category?: string;
      categoryLabel?: string;
      subcategory?: string;
      subcategoryLabel?: string;
      price?: number;
      stockCount?: number;
      shortDescription?: string;
      imagePresetKey?: string;
      highlightOne?: string;
      highlightTwo?: string;
    };

    if (!body.name?.trim() || typeof body.price !== 'number' || body.price <= 0) {
      res.status(400).json({ error: 'Product name and valid positive price are required.' });
      return;
    }

    const stock = Math.max(1, Number(body.stockCount) || 15);
    const availability: AvailabilityStatus = stock <= 8 ? 'low-stock' : 'in-stock';
    const slugBase = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = `prod-seller-${Date.now().toString(36)}`;
    const sku = `SEL-${Math.floor(1000 + Math.random() * 8999)}`;

    const newProduct: ApiSellerProductRecord = {
      id,
      slug: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
      sku,
      name: body.name.trim(),
      subtitle: 'Seller Studio Release',
      brand: body.brand?.trim() || user?.studioName || 'Kinto Partner Studio',
      category: body.category || 'electronics-tech',
      categoryLabel: body.categoryLabel || 'Electronics & Tech',
      subcategory: body.subcategory || 'headphones',
      subcategoryLabel: body.subcategoryLabel || 'Studio Release',
      price: Number(body.price.toFixed(2)),
      rating: 4.9,
      reviewCount: 1,
      stockCount: stock,
      availability,
      badgeText: 'New Seller Listing',
      shortDescription:
        body.shortDescription?.trim() ||
        'Direct marketplace release published through the verified Seller Studio portal.',
      description:
        body.shortDescription?.trim() ||
        'Manufactured and fulfilled directly through an approved Kinto Studio Seller Partner with verified warranty coverage.',
      imagePresetKey: body.imagePresetKey || 'headphones',
      colors: [{ name: 'Studio Finish', hex: '#2D2C2A' }],
      sizes: ['Standard Edition'],
      cardHighlights: [
        body.highlightOne?.trim() || 'Direct Studio Ship',
        body.highlightTwo?.trim() || 'Verified Partner',
      ],
      attributes: {
        material: 'Anodized & Natural Finish',
        warranty: '2-Year Partner Warranty',
      },
      specifications: [
        { label: 'Seller Fulfillment', value: user?.studioName || 'Verified Seller Studio' },
        { label: 'SKU Reference', value: sku },
        { label: 'Warranty', value: '2 Years Standard Coverage' },
      ],
      deliveryEstimate: 'Dispatches within 24–48 hours via Insured Courier',
      returnPolicy: '30-Day Studio Return Policy',
      warranty: '2-Year Partner Warranty',
      tags: ['seller listing', 'new arrival', body.categoryLabel || 'marketplace'],
      sellerId: user?.id || 'usr-seller-elena',
      isNewArrival: true,
    };

    db.sellerCreatedProducts.unshift(newProduct);
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/seller/products/:id', (req, res) => {
    const { price, stockCount, availability } = (req.body || {}) as {
      price?: number;
      stockCount?: number;
      availability?: AvailabilityStatus;
    };
    const override = db.updateInventoryItem(req.params.id, {
      price: typeof price === 'number' && price > 0 ? price : undefined,
      stockCount: typeof stockCount === 'number' && stockCount >= 0 ? stockCount : undefined,
      availability,
    });
    res.json({ override });
  });

  // Admin Console APIs
  app.get('/api/admin/dashboard', (_req, res) => {
    const orderGmv = db.orders
      .filter((o) => o.currentStage !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const activeSellers = db.sellerApplications.filter((s) => s.status === 'approved').length;
    const pendingSellers = db.sellerApplications.filter((s) => s.status === 'pending').length;

    res.json({
      kpis: {
        totalGmv: 142850 + Math.round(orderGmv),
        totalOrders: db.orders.length + 148,
        activeSellers,
        pendingSellers,
        registeredUsers: db.users.length,
        activeCategories: 8 + db.customCategories.length,
      },
      departmentShare: [
        { category: 'home-living', label: 'Home & Living', gmv: 46200, sharePercent: 32 },
        { category: 'electronics-tech', label: 'Electronics & Tech', gmv: 34800, sharePercent: 24 },
        { category: 'fashion-apparel', label: 'Fashion & Apparel', gmv: 25900, sharePercent: 18 },
        { category: 'beauty-care', label: 'Beauty & Personal Care', gmv: 15400, sharePercent: 11 },
        { category: 'grocery-food', label: 'Grocery & Gourmet', gmv: 11200, sharePercent: 8 },
        { category: 'sports-outdoor', label: 'Sports & Outdoor', gmv: 9350, sharePercent: 7 },
      ],
      users: db.users.map((u) => db.toPublicAccount(u)),
      sellerApplications: db.sellerApplications,
      orders: db.orders,
      categories: db.customCategories,
    });
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    const { role, status } = (req.body || {}) as {
      role?: UserRole;
      status?: 'active' | 'pending' | 'suspended';
    };
    const updated = db.updateUserRoleAndStatus(req.params.id, { role, status });
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: updated });
  });

  app.patch('/api/admin/sellers/:id/approve', (req, res) => {
    const { status } = (req.body || {}) as { status?: 'approved' | 'pending' | 'suspended' };
    const appRec = db.sellerApplications.find((s) => s.id === req.params.id);
    if (!appRec) {
      res.status(404).json({ error: 'Seller application not found' });
      return;
    }
    appRec.status = status || 'approved';
    const linkedUser = db.users.find((u) => u.email.toLowerCase() === appRec.email.toLowerCase());
    if (linkedUser) {
      linkedUser.status = appRec.status === 'suspended' ? 'suspended' : 'active';
      if (appRec.status === 'approved') {
        linkedUser.role = 'seller';
        linkedUser.roleLabel = 'Verified Seller Studio';
      }
    }
    res.json({ application: appRec });
  });

  app.post('/api/admin/categories', (req, res) => {
    const { name, shortName, description, subcategoryName, imagePresetKey } = (req.body || {}) as {
      name?: string;
      shortName?: string;
      description?: string;
      subcategoryName?: string;
      imagePresetKey?: string;
    };
    if (!name?.trim()) {
      res.status(400).json({ error: 'Department name is required.' });
      return;
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (db.customCategories.some((c) => c.slug === slug)) {
      res.status(409).json({ error: 'Department slug already exists.' });
      return;
    }
    const sub = subcategoryName?.trim() || 'Featured Editions';
    const created: DynamicCategoryRecord = {
      id: `cat-custom-${Date.now().toString(36)}`,
      slug,
      name: name.trim(),
      shortName: shortName?.trim() || name.trim(),
      description:
        description?.trim() ||
        'Dynamically published marketplace department managed by Platform Operations.',
      bannerTagline: 'Admin-curated marketplace department',
      imagePresetKey: imagePresetKey || 'clock',
      countLabel: 'Dynamic Department',
      subcategories: [
        {
          slug: sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: sub,
        },
      ],
      featuredBrands: ['Kinto Atelier'],
      filterFacets: [{ key: 'material', label: 'Primary Material' }],
    };
    db.customCategories.push(created);
    res.status(201).json({ category: created });
  });

  app.delete('/api/admin/categories/:slug', (req, res) => {
    db.customCategories = db.customCategories.filter((c) => c.slug !== req.params.slug);
    res.json({ ok: true });
  });

  // Vite dev middleware OR static production dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinto Studio marketplace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
