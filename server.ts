import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/mockDb.ts';
import { BANGLADESH_GEO_TREE } from './server/shared/marketplaceSchema.ts';
import { updateCurrencyState } from './server/services/currencyService.ts';
import { calculateShippingQuote, type ShippingQuoteItemInput } from './server/services/shippingService.ts';
import {
  buildAuthoritativeCheckoutQuote,
  buildVerifiedOrderFromSession,
  createPaymentSession,
  resolveAuthoritativeItems,
  type CheckoutItemRequest,
  type CheckoutQuoteRequest,
} from './server/services/paymentService.ts';
import type {
  ApiSellerProductRecord,
  AvailabilityStatus,
  CategoryFacetConfig,
  CategoryNode,
  CurrencyCode,
  DeliveryMethodId,
  LegalAcceptanceRecord,
  Order,
  OrderStage,
  PaymentMethodId,
  ShippingZoneId,
  ShippingZoneRule,
  UserRole,
} from './src/types/commerce.ts';

const PORT = Number(process.env.PORT) || 3000;

function formatOrderNotificationAmount(order: Order): string {
  const snap = order.currencySnapshot;
  if (snap?.transactionCurrency === 'BDT') {
    return `৳${Math.round(snap.chargedTotal).toLocaleString('en-US')} BDT`;
  }
  const usd = snap?.chargedTotal ?? order.total;
  return `$${usd.toFixed(2)} USD`;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
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
    const { fullName, email, phone, password, role, studioName, acceptedPolicies } =
      (req.body || {}) as {
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        role?: UserRole;
        studioName?: string;
        acceptedPolicies?: LegalAcceptanceRecord;
      };

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!fullName?.trim() || !cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Valid full name and email address are required.' });
      return;
    }

    if (!acceptedPolicies?.accepted || !acceptedPolicies.version) {
      res.status(400).json({
        error: 'You must accept the Terms of Service and Privacy Policy to create an account.',
      });
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
      phone: phone?.trim() || '+880 1711-000100',
      role: chosenRole,
      roleLabel: chosenRole === 'seller' ? 'Seller Studio Partner' : 'Marketplace Member',
      studioName: chosenRole === 'seller' ? studioName?.trim() || `${fullName.trim()} Studio` : undefined,
      status: 'active' as const,
      joinedAt: new Date().toISOString().slice(0, 10),
      location: 'Dhaka & Global Hub',
      demoPasswordHint: password?.trim() || 'studio2026',
      password: password?.trim() || 'studio2026',
      policyAcceptance: {
        ...acceptedPolicies,
        acceptedAt: acceptedPolicies.acceptedAt || new Date().toISOString(),
      },
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

  // Live Storefront Sync: Overrides, Seller Created Products, Dynamic Category Tree, Currency & Shipping
  app.get('/api/storefront/state', (_req, res) => {
    res.json({
      productOverrides: db.productOverrides,
      sellerProducts: db.sellerCreatedProducts,
      categoryTree: db.categoryTree,
      customCategories: db.customCategories,
      currencyConfig: db.currencyConfig,
      shippingConfig: db.shippingConfig,
    });
  });

  // Currency Rates & Config APIs
  app.get('/api/currency/rates', (_req, res) => {
    res.json({ currencyConfig: db.currencyConfig });
  });

  app.patch('/api/admin/currency', (req, res) => {
    const { bdtRate, defaultCurrency, source, updateFrequencyMinutes } = (req.body || {}) as {
      bdtRate?: number;
      defaultCurrency?: CurrencyCode;
      source?: string;
      updateFrequencyMinutes?: number;
    };
    db.currencyConfig = updateCurrencyState(db.currencyConfig, {
      bdtRate,
      defaultCurrency,
      source,
      updateFrequencyMinutes,
    });
    res.json({ currencyConfig: db.currencyConfig });
  });

  // Hierarchical Category Tree APIs
  app.get('/api/categories', (_req, res) => {
    res.json({ categories: db.categoryTree });
  });

  // Bangladesh Hierarchical Geo & Shipping APIs
  app.get('/api/shipping/locations', (_req, res) => {
    res.json({
      divisions: BANGLADESH_GEO_TREE,
      restrictedAreaKeywords: db.shippingConfig.restrictedAreaKeywords,
    });
  });

  app.post('/api/shipping/quote', (req, res) => {
    try {
      const {
        items,
        address,
        promoCode,
        currency,
      } = (req.body || {}) as {
        items?: CheckoutItemRequest[];
        address?: { country?: string; state?: string; city?: string; upazila?: string; area?: string };
        promoCode?: string;
        currency?: CurrencyCode;
      };

      const itemList = Array.isArray(items) && items.length > 0 ? items : [];
      let subtotalUsd = 0;
      let shippingInputs: ShippingQuoteItemInput[] = itemList.map((i) => ({
        quantity: Math.max(1, i.quantity || 1),
        weightKg: 1.0,
        sizeTier: 'small',
        codEligible: true,
      }));

      if (itemList.length > 0) {
        const resolved = resolveAuthoritativeItems(
          itemList,
          db.sellerCreatedProducts,
          db.productOverrides
        );
        subtotalUsd = resolved.subtotalUsd;
        shippingInputs = resolved.shippingInputs;
      }

      const activeCurrency: CurrencyCode =
        currency === 'USD' && (address?.country || 'Bangladesh').toLowerCase() !== 'bangladesh'
          ? 'USD'
          : currency === 'USD' || currency === 'BDT'
          ? currency
          : db.currencyConfig.defaultCurrency;

      const quote = calculateShippingQuote({
        address: address || { country: 'Bangladesh' },
        subtotalUsd,
        items: shippingInputs,
        promoCode,
        currency: activeCurrency,
        currencyState: db.currencyConfig,
        config: db.shippingConfig,
      });

      res.json({ quote });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to compute shipping quote.',
      });
    }
  });

  app.patch('/api/admin/shipping-rules', (req, res) => {
    const { zoneId, updates, restrictedAreaKeywords } = (req.body || {}) as {
      zoneId?: ShippingZoneId;
      updates?: Partial<ShippingZoneRule>;
      restrictedAreaKeywords?: string[];
    };

    if (Array.isArray(restrictedAreaKeywords)) {
      db.shippingConfig.restrictedAreaKeywords = restrictedAreaKeywords
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
    }

    if (zoneId && updates) {
      db.shippingConfig.zones = db.shippingConfig.zones.map((z) => {
        if (z.zoneId !== zoneId) return z;
        return {
          ...z,
          standardFeeUsd:
            typeof updates.standardFeeUsd === 'number' && updates.standardFeeUsd >= 0
              ? updates.standardFeeUsd
              : z.standardFeeUsd,
          expressFeeUsd:
            typeof updates.expressFeeUsd === 'number' && updates.expressFeeUsd >= 0
              ? updates.expressFeeUsd
              : z.expressFeeUsd,
          expressAvailable:
            typeof updates.expressAvailable === 'boolean' ? updates.expressAvailable : z.expressAvailable,
          whiteGloveFeeUsd:
            typeof updates.whiteGloveFeeUsd === 'number' && updates.whiteGloveFeeUsd >= 0
              ? updates.whiteGloveFeeUsd
              : z.whiteGloveFeeUsd,
          whiteGloveAvailable:
            typeof updates.whiteGloveAvailable === 'boolean'
              ? updates.whiteGloveAvailable
              : z.whiteGloveAvailable,
          freeThresholdUsd:
            typeof updates.freeThresholdUsd === 'number' && updates.freeThresholdUsd >= 0
              ? updates.freeThresholdUsd
              : z.freeThresholdUsd,
          perExtraKgUsd:
            typeof updates.perExtraKgUsd === 'number' && updates.perExtraKgUsd >= 0
              ? updates.perExtraKgUsd
              : z.perExtraKgUsd,
          bulkySurchargeUsd:
            typeof updates.bulkySurchargeUsd === 'number' && updates.bulkySurchargeUsd >= 0
              ? updates.bulkySurchargeUsd
              : z.bulkySurchargeUsd,
          freightSurchargeUsd:
            typeof updates.freightSurchargeUsd === 'number' && updates.freightSurchargeUsd >= 0
              ? updates.freightSurchargeUsd
              : z.freightSurchargeUsd,
          standardEta: updates.standardEta?.trim() || z.standardEta,
          expressEta: updates.expressEta?.trim() || z.expressEta,
          codEligible: typeof updates.codEligible === 'boolean' ? updates.codEligible : z.codEligible,
          codMaxOrderUsd:
            typeof updates.codMaxOrderUsd === 'number' && updates.codMaxOrderUsd >= 0
              ? updates.codMaxOrderUsd
              : z.codMaxOrderUsd,
          isRestricted: typeof updates.isRestricted === 'boolean' ? updates.isRestricted : z.isRestricted,
          restrictionReason:
            typeof updates.restrictionReason === 'string'
              ? updates.restrictionReason
              : z.restrictionReason,
        };
      });
    }

    db.shippingConfig.updatedAt = new Date().toISOString();
    res.json({ shippingConfig: db.shippingConfig });
  });

  // Authoritative Checkout Quote + Provider Payment Session Endpoints
  app.post('/api/checkout/quote', (req, res) => {
    try {
      const payload = (req.body || {}) as CheckoutQuoteRequest;
      const { quote } = buildAuthoritativeCheckoutQuote({
        request: payload,
        sellerCreatedProducts: db.sellerCreatedProducts,
        productOverrides: db.productOverrides,
        currencyState: db.currencyConfig,
        shippingConfig: db.shippingConfig,
      });
      res.json({ quote });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to verify checkout quote.',
      });
    }
  });

  app.post('/api/payments/initiate', (req, res) => {
    try {
      const body = (req.body || {}) as {
        idempotencyKey?: string;
        paymentMethod?: PaymentMethodId;
        customerName?: string;
        email?: string;
        phone?: string;
        shippingAddress?: Order['shippingAddress'];
        deliveryMethod?: DeliveryMethodId;
        items?: CheckoutItemRequest[];
        promoCode?: string;
        requestedCurrency?: CurrencyCode;
        allowInternationalUsd?: boolean;
        acceptedPolicies?: LegalAcceptanceRecord;
      };

      if (!body.acceptedPolicies?.accepted || !body.acceptedPolicies.version) {
        res.status(400).json({
          error:
            'Please confirm the Terms of Service, Return Policy, and Product Disclaimers before proceeding.',
        });
        return;
      }

      if (!body.customerName?.trim() || !body.email?.includes('@') || !body.shippingAddress?.streetAddress?.trim()) {
        res.status(400).json({ error: 'Complete customer name, email, and delivery address are required.' });
        return;
      }
      if (!body.paymentMethod) {
        res.status(400).json({ error: 'Payment method selection is required.' });
        return;
      }

      const idempotencyKey =
        body.idempotencyKey?.trim() ||
        `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const ctx = createPaymentSession({
        idempotencyKey,
        paymentMethod: body.paymentMethod,
        customer: {
          customerName: body.customerName.trim(),
          email: body.email.trim(),
          phone: body.phone?.trim() || '+880 1700-000000',
          shippingAddress: body.shippingAddress,
          deliveryMethod: body.deliveryMethod || 'standard',
        },
        quoteRequest: {
          items: body.items || [],
          address: {
            country: body.shippingAddress.country,
            state: body.shippingAddress.state,
            city: body.shippingAddress.city,
            upazila: body.shippingAddress.upazila,
            area: body.shippingAddress.area,
          },
          deliveryMethod: body.deliveryMethod || 'standard',
          promoCode: body.promoCode,
          requestedCurrency: body.requestedCurrency,
          allowInternationalUsd: body.allowInternationalUsd,
        },
        sellerCreatedProducts: db.sellerCreatedProducts,
        productOverrides: db.productOverrides,
        currencyState: db.currencyConfig,
        shippingConfig: db.shippingConfig,
        existingSessions: db.paymentSessions,
        policyAcceptance: body.acceptedPolicies,
      });

      res.status(201).json({
        session: ctx.session,
        quote: ctx.quote,
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to initiate payment session.',
      });
    }
  });

  app.post('/api/payments/verify', (req, res) => {
    const { sessionId, outcome, walletNumber, failureReason } = (req.body || {}) as {
      sessionId?: string;
      outcome?: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed';
      walletNumber?: string;
      failureReason?: string;
    };

    if (!sessionId) {
      res.status(400).json({ error: 'Payment session ID is required.' });
      return;
    }

    const ctx = db.paymentSessions.get(sessionId);
    if (!ctx) {
      res.status(404).json({ error: 'Payment session expired or not found.' });
      return;
    }

    if (ctx.session.orderId && ['paid', 'cod_pending'].includes(ctx.session.status)) {
      const existingOrder = db.orders.find((o) => o.id === ctx.session.orderId);
      res.json({ session: ctx.session, order: existingOrder });
      return;
    }

    const chosenOutcome =
      outcome || (ctx.session.paymentMethod === 'cod' ? 'cod_confirmed' : 'paid');

    const { session, order } = buildVerifiedOrderFromSession(ctx, chosenOutcome, {
      walletNumber,
      failureReason,
    });

    if (order) {
      // Server-side inventory deduction & authoritative order persistence
      for (const line of order.items) {
        const inv = db.sellerInventory.find((i) => i.id === line.productId);
        if (inv) {
          const nextStock = Math.max(0, inv.stockCount - line.quantity);
          db.updateInventoryItem(line.productId, { stockCount: nextStock });
        }
      }
      db.orders = [order, ...db.orders.filter((o) => o.id !== order.id)];
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title:
          order.paymentStatus === 'cod_pending'
            ? `COD Order Confirmed · #${order.id}`
            : `Payment Verified · #${order.id}`,
        message: `${order.customerName} placed an order totaling ${formatOrderNotificationAmount(order)} (${order.paymentLabel}).`,
        category: 'order',
        createdAt: 'Just now',
        read: false,
        roleScope: 'all',
        orderId: order.id,
      });
    }

    res.json({ session, order });
  });

  app.post('/api/payments/callback/:provider', (req, res) => {
    const { sessionId, status, failureReason } = (req.body || {}) as {
      sessionId?: string;
      status?: 'VALID' | 'FAILED' | 'CANCELLED';
      failureReason?: string;
    };
    const ctx = sessionId ? db.paymentSessions.get(sessionId) : undefined;
    if (!ctx) {
      res.status(404).json({ error: 'Unknown callback payment session.' });
      return;
    }
    const mappedOutcome =
      status === 'FAILED' ? 'failed' : status === 'CANCELLED' ? 'cancelled' : 'paid';
    const result = buildVerifiedOrderFromSession(ctx, mappedOutcome, { failureReason });
    if (result.order) {
      db.orders = [result.order, ...db.orders.filter((o) => o.id !== result.order!.id)];
    }
    res.json({ provider: req.params.provider, ...result });
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
    const safeOrder: Order = {
      ...order,
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'cod' ? 'cod_pending' : 'paid'),
    };
    db.orders = [safeOrder, ...db.orders.filter((o) => o.id !== safeOrder.id)];
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Order Confirmed · #${safeOrder.id}`,
      message: `${safeOrder.customerName} placed an order totaling ${formatOrderNotificationAmount(safeOrder)}.`,
      category: 'order',
      createdAt: 'Just now',
      read: false,
      roleScope: 'all',
      orderId: safeOrder.id,
    });
    res.status(201).json({ order: safeOrder });
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
    if (stage === 'Delivered' && updated.paymentStatus === 'cod_pending') {
      updated.paymentStatus = 'paid';
    }
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
      weightKg?: number;
      sizeTier?: 'small' | 'medium' | 'bulky' | 'freight';
      codEligible?: boolean;
      shortDescription?: string;
      imagePresetKey?: string;
      highlightOne?: string;
      highlightTwo?: string;
      acceptedPolicies?: LegalAcceptanceRecord;
    };

    if (!body.acceptedPolicies?.accepted || !body.acceptedPolicies.version) {
      res.status(400).json({
        error:
          'Seller Marketplace Agreement & Prohibited Items Policy attestation is required before publishing.',
      });
      return;
    }

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
      categoryLabel: body.categoryLabel || 'Electronics & Technology',
      subcategory: body.subcategory || 'audio-sound',
      subcategoryLabel: body.subcategoryLabel || 'Studio Release',
      weightKg: typeof body.weightKg === 'number' && body.weightKg > 0 ? body.weightKg : 1.2,
      sizeTier: body.sizeTier || 'small',
      codEligible: typeof body.codEligible === 'boolean' ? body.codEligible : true,
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
      policyAcceptance: body.acceptedPolicies,
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
    const activeTopDepartments = db.categoryTree.filter((c) => c.depth === 0 && c.isActive).length;

    res.json({
      kpis: {
        totalGmv: 184600 + Math.round(orderGmv),
        totalOrders: db.orders.length + 148,
        activeSellers,
        pendingSellers,
        registeredUsers: db.users.length,
        activeCategories: activeTopDepartments,
      },
      departmentShare: [
        { category: 'home-furniture-kitchen', label: 'Home, Furniture & Kitchen', gmv: 46200, sharePercent: 25 },
        { category: 'electronics-tech', label: 'Electronics & Technology', gmv: 34800, sharePercent: 19 },
        { category: 'fashion-accessories', label: 'Fashion & Accessories', gmv: 25900, sharePercent: 14 },
        { category: 'beauty-care', label: 'Beauty & Personal Care', gmv: 18400, sharePercent: 10 },
        { category: 'grocery-food-household', label: 'Grocery, Food & Household', gmv: 14200, sharePercent: 8 },
        { category: 'sports-outdoors-travel', label: 'Sports, Outdoors & Travel', gmv: 12900, sharePercent: 7 },
        { category: 'automotive-tools-industrial', label: 'Automotive, Tools & Industrial', gmv: 11000, sharePercent: 6 },
        { category: 'books-stationery-office', label: 'Books, Stationery & Office', gmv: 7400, sharePercent: 4 },
        { category: 'baby-kids-toys-hobbies', label: 'Baby, Kids, Toys & Hobbies', gmv: 7400, sharePercent: 4 },
        { category: 'health-wellness-pets', label: 'Health, Wellness & Pets', gmv: 6400, sharePercent: 3 },
      ],
      users: db.users.map((u) => db.toPublicAccount(u)),
      sellerApplications: db.sellerApplications,
      orders: db.orders,
      categories: db.categoryTree,
      currencyConfig: db.currencyConfig,
      shippingConfig: db.shippingConfig,
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

  // Hierarchical Category Node Create / Update / Delete
  app.post('/api/admin/categories', (req, res) => {
    const {
      name,
      shortName,
      parentId,
      description,
      bannerTagline,
      iconName,
      imagePresetKey,
      sortOrder,
      seoTitle,
      seoDescription,
      collectionIds,
      featuredBrands,
      filterFacets,
      subcategoryName,
    } = (req.body || {}) as {
      name?: string;
      shortName?: string;
      parentId?: string | null;
      description?: string;
      bannerTagline?: string;
      iconName?: string;
      imagePresetKey?: string;
      sortOrder?: number;
      seoTitle?: string;
      seoDescription?: string;
      collectionIds?: string[];
      featuredBrands?: string[];
      filterFacets?: CategoryFacetConfig[];
      subcategoryName?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = db.categoryTree.some((c) => c.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString(36).slice(-3)}`
      : baseSlug;

    const parentNode = parentId ? db.categoryTree.find((c) => c.id === parentId) : null;
    const depth = parentNode ? parentNode.depth + 1 : 0;
    const pathSlugs = parentNode ? [...parentNode.pathSlugs, slug] : [slug];
    const siblings = db.categoryTree.filter((c) => (c.parentId || null) === (parentNode?.id || null));
    const nodeId = `cat-${slug}-${Date.now().toString(36).slice(-3)}`;

    const created: CategoryNode = {
      id: nodeId,
      slug,
      name: name.trim(),
      shortName: shortName?.trim() || name.trim(),
      parentId: parentNode?.id || null,
      depth,
      pathSlugs,
      description:
        description?.trim() ||
        'Dynamically curated category node managed through Kinto Studio Platform Operations.',
      bannerTagline: bannerTagline?.trim() || 'Admin-curated marketplace collection',
      iconName: iconName?.trim() || parentNode?.iconName || 'Tag',
      imagePresetKey: imagePresetKey || parentNode?.imagePresetKey || 'clock',
      countLabel: parentNode ? `Under ${parentNode.shortName}` : 'Dynamic Department',
      sortOrder: typeof sortOrder === 'number' ? sortOrder : siblings.length + 1,
      isActive: true,
      seoTitle: seoTitle?.trim() || `${name.trim()} — Kinto Studio`,
      seoDescription: seoDescription?.trim() || `Explore ${name.trim()} on Kinto Studio Marketplace.`,
      collectionIds: Array.isArray(collectionIds) && collectionIds.length > 0 ? collectionIds : ['featured'],
      featuredBrands:
        Array.isArray(featuredBrands) && featuredBrands.length > 0
          ? featuredBrands
          : ['Kinto Atelier'],
      filterFacets:
        Array.isArray(filterFacets) && filterFacets.length > 0
          ? filterFacets
          : parentNode
          ? []
          : [{ key: 'materials', label: 'Primary Material', type: 'text', filterable: true }],
    };

    db.categoryTree.push(created);

    // Optional immediate child node creation from quick form
    if (subcategoryName?.trim()) {
      const childSlugBase = subcategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const childSlug = db.categoryTree.some((c) => c.slug === childSlugBase)
        ? `${childSlugBase}-${Date.now().toString(36).slice(-3)}`
        : childSlugBase;
      const childNode: CategoryNode = {
        id: `cat-${childSlug}-${Date.now().toString(36).slice(-3)}`,
        slug: childSlug,
        name: subcategoryName.trim(),
        shortName: subcategoryName.trim(),
        parentId: created.id,
        depth: created.depth + 1,
        pathSlugs: [...created.pathSlugs, childSlug],
        description: `Curated ${subcategoryName.trim()} selection within ${created.name}.`,
        bannerTagline: created.bannerTagline,
        iconName: created.iconName,
        imagePresetKey: created.imagePresetKey,
        countLabel: `Under ${created.shortName}`,
        sortOrder: 1,
        isActive: true,
        seoTitle: `${subcategoryName.trim()} — ${created.name}`,
        seoDescription: `Shop ${subcategoryName.trim()} in ${created.name}.`,
        collectionIds: created.collectionIds,
        featuredBrands: created.featuredBrands,
        filterFacets: [],
      };
      db.categoryTree.push(childNode);
    }

    res.status(201).json({ category: created, categoryTree: db.categoryTree });
  });

  app.patch('/api/admin/categories/:id', (req, res) => {
    const target = db.categoryTree.find(
      (c) => c.id === req.params.id || c.slug === req.params.id
    );
    if (!target) {
      res.status(404).json({ error: 'Category node not found.' });
      return;
    }

    const updates = (req.body || {}) as Partial<CategoryNode>;
    if (typeof updates.name === 'string' && updates.name.trim()) target.name = updates.name.trim();
    if (typeof updates.shortName === 'string' && updates.shortName.trim()) {
      target.shortName = updates.shortName.trim();
    }
    if (typeof updates.description === 'string') target.description = updates.description;
    if (typeof updates.bannerTagline === 'string') target.bannerTagline = updates.bannerTagline;
    if (typeof updates.isActive === 'boolean') target.isActive = updates.isActive;
    if (typeof updates.sortOrder === 'number') target.sortOrder = updates.sortOrder;
    if (typeof updates.seoTitle === 'string') target.seoTitle = updates.seoTitle;
    if (typeof updates.seoDescription === 'string') target.seoDescription = updates.seoDescription;
    if (Array.isArray(updates.collectionIds)) target.collectionIds = updates.collectionIds;
    if (typeof updates.imagePresetKey === 'string') target.imagePresetKey = updates.imagePresetKey;

    res.json({ category: target, categoryTree: db.categoryTree });
  });

  app.delete('/api/admin/categories/:idOrSlug', (req, res) => {
    const target = db.categoryTree.find(
      (c) => c.id === req.params.idOrSlug || c.slug === req.params.idOrSlug
    );
    if (!target) {
      res.status(404).json({ error: 'Category node not found.' });
      return;
    }

    // Collect node + all recursive descendants so no orphaned nodes remain
    const toRemoveIds = new Set<string>([target.id]);
    let added = true;
    while (added) {
      added = false;
      for (const node of db.categoryTree) {
        if (node.parentId && toRemoveIds.has(node.parentId) && !toRemoveIds.has(node.id)) {
          toRemoveIds.add(node.id);
          added = true;
        }
      }
    }

    db.categoryTree = db.categoryTree.filter((c) => !toRemoveIds.has(c.id));
    res.json({ ok: true, removedCount: toRemoveIds.size, categoryTree: db.categoryTree });
  });

  // Vite dev middleware OR static production dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinto Studio marketplace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
