import {
  MockMarketplaceDb,
  type ServerUserRecord,
} from '../../server/mockDb';
import { updateCurrencyState } from '../../server/services/currencyService';
import {
  buildAuthoritativeCheckoutQuote,
  buildVerifiedOrderFromSession,
  createPaymentSession,
  resolveAuthoritativeItems,
  type CheckoutItemRequest,
  type PendingSessionContext,
} from '../../server/services/paymentService';
import {
  calculateShippingQuote,
  type ShippingQuoteItemInput,
} from '../../server/services/shippingService';
import {
  fetchLiveDummyJsonCatalog,
  getDummyJsonAuthoritativeSkus,
} from '../../server/shared/dummyJsonCatalog';
import {
  BANGLADESH_GEO_TREE,
  type BangladeshDivisionEntry,
} from '../../server/shared/marketplaceSchema';
import type {
  AccountDirectoryEntry,
  AdminDashboardData,
  ApiSellerProductRecord,
  AvailabilityStatus,
  CategoryFacetConfig,
  CategoryNode,
  CheckoutQuoteResponse,
  CurrencyCode,
  CurrencyRateState,
  DeliveryMethodId,
  DynamicCategoryRecord,
  LegalAcceptanceRecord,
  Order,
  OrderStage,
  PaymentMethodId,
  PaymentSession,
  Product,
  ProductOverride,
  SellerApplicationRecord,
  SellerDashboardData,
  ShippingQuoteResponse,
  ShippingRuleConfig,
  ShippingZoneId,
  ShippingZoneRule,
  StoreNotification,
  UserRole,
} from '../types/commerce';
import { ApiError } from './apiError';

const STATIC_DB_STORAGE_KEY = 'kinto-static-db-v1';

interface SerializedStaticDb {
  users: ServerUserRecord[];
  sellerApplications: SellerApplicationRecord[];
  sellerInventory: MockMarketplaceDb['sellerInventory'];
  sellerCreatedProducts: ApiSellerProductRecord[];
  categoryTree: CategoryNode[];
  customCategories: DynamicCategoryRecord[];
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
  productOverrides: Record<string, ProductOverride>;
  orders: Order[];
  notifications: StoreNotification[];
  sessions: Array<[string, string]>;
  paymentSessions: Array<[string, PendingSessionContext]>;
}

let cachedDb: MockMarketplaceDb | null = null;

function formatOrderNotificationAmount(order: Order): string {
  const snap = order.currencySnapshot;
  if (snap?.transactionCurrency === 'BDT') {
    return `৳${Math.round(snap.chargedTotal).toLocaleString('en-US')} BDT`;
  }
  const usd = snap?.chargedTotal ?? order.total;
  return `$${usd.toFixed(2)} USD`;
}

function getStaticDb(): MockMarketplaceDb {
  if (cachedDb) return cachedDb;

  const instance = new MockMarketplaceDb();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STATIC_DB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SerializedStaticDb>;
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          instance.users = parsed.users;
        }
        if (Array.isArray(parsed.sellerApplications)) {
          instance.sellerApplications = parsed.sellerApplications;
        }
        if (Array.isArray(parsed.sellerInventory)) {
          instance.sellerInventory = parsed.sellerInventory;
        }
        if (Array.isArray(parsed.sellerCreatedProducts)) {
          instance.sellerCreatedProducts = parsed.sellerCreatedProducts;
        }
        if (Array.isArray(parsed.categoryTree) && parsed.categoryTree.length > 0) {
          instance.categoryTree = parsed.categoryTree;
        }
        if (Array.isArray(parsed.customCategories)) {
          instance.customCategories = parsed.customCategories;
        }
        if (parsed.currencyConfig) {
          instance.currencyConfig = parsed.currencyConfig;
        }
        if (parsed.shippingConfig) {
          instance.shippingConfig = parsed.shippingConfig;
        }
        if (parsed.productOverrides && typeof parsed.productOverrides === 'object') {
          instance.productOverrides = parsed.productOverrides;
        }
        if (Array.isArray(parsed.orders)) {
          instance.orders = parsed.orders;
        }
        if (Array.isArray(parsed.notifications)) {
          instance.notifications = parsed.notifications;
        }
        if (Array.isArray(parsed.sessions)) {
          instance.sessions = new Map(parsed.sessions);
        }
        if (Array.isArray(parsed.paymentSessions)) {
          instance.paymentSessions = new Map(parsed.paymentSessions);
        }
      }
    }
  } catch {
    // Fall back to cleanly seeded in-memory MockMarketplaceDb if storage is blocked or corrupt
  }

  cachedDb = instance;
  return cachedDb;
}

function persistStaticDb(db: MockMarketplaceDb): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const payload: SerializedStaticDb = {
      users: db.users,
      sellerApplications: db.sellerApplications,
      sellerInventory: db.sellerInventory,
      sellerCreatedProducts: db.sellerCreatedProducts,
      categoryTree: db.categoryTree,
      customCategories: db.customCategories,
      currencyConfig: db.currencyConfig,
      shippingConfig: db.shippingConfig,
      productOverrides: db.productOverrides,
      orders: db.orders,
      notifications: db.notifications,
      sessions: Array.from(db.sessions.entries()),
      paymentSessions: Array.from(db.paymentSessions.entries()),
    };
    window.localStorage.setItem(STATIC_DB_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or restricted-storage errors silently
  }
}

export function staticFetchAuthAccounts(): AccountDirectoryEntry[] {
  const db = getStaticDb();
  return db.users.map((u) => db.toPublicAccount(u));
}

export function staticLogin(payload: {
  email?: string;
  password?: string;
  accountId?: string;
}): { token: string; user: AccountDirectoryEntry } {
  const db = getStaticDb();
  const { email, password, accountId } = payload || {};

  let user = accountId ? db.users.find((u) => u.id === accountId) : undefined;
  const cleanInput = (email || '').trim();
  const lowerInput = cleanInput.toLowerCase();

  if (!user) {
    if (!cleanInput) {
      user =
        db.users.find((u) => u.role === 'customer' && u.status === 'active') ||
        db.users[0];
    } else {
      user = db.users.find(
        (u) =>
          u.email.toLowerCase() === lowerInput ||
          u.fullName.toLowerCase() === lowerInput
      );
    }
  }

  if (!user) {
    const looksLikeEmail = cleanInput.includes('@');
    const localPart = (looksLikeEmail ? cleanInput.split('@')[0] : cleanInput)
      .replace(/[^a-zA-Z0-9._-]+/g, ' ')
      .trim();
    const derivedName =
      localPart
        .split(/[.\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Marketplace Member';

    const emailSlug =
      (localPart || 'guest')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/(^\.|\.$)/g, '') || 'guest';

    const normalizedEmail = looksLikeEmail
      ? lowerInput
      : `${emailSlug}@guest.kintostudio.local`;

    const existingByNormalized = db.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (existingByNormalized) {
      user = existingByNormalized;
    } else {
      const newUser: ServerUserRecord = {
        id: `usr-guest-${Date.now().toString(36)}`,
        fullName: looksLikeEmail ? derivedName : cleanInput,
        email: normalizedEmail,
        phone: '+880 1711-000100',
        role: 'customer',
        roleLabel: 'Marketplace Member',
        status: 'active',
        joinedAt: new Date().toISOString().slice(0, 10),
        location: 'Dhaka & Global Hub',
        demoPasswordHint: password?.trim() || 'studio2026',
        password: password?.trim() || 'studio2026',
      };
      db.users.unshift(newUser);
      user = newUser;
    }
  }

  const token = db.issueSession(user.id);
  persistStaticDb(db);
  return {
    token,
    user: db.toPublicAccount(user),
  };
}

export function staticRegister(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'seller';
  studioName?: string;
  acceptedPolicies: LegalAcceptanceRecord;
}): { token: string; user: AccountDirectoryEntry } {
  const db = getStaticDb();
  const cleanEmail = (payload.email || '').trim().toLowerCase();

  if (!payload.fullName?.trim() || !cleanEmail || !cleanEmail.includes('@')) {
    throw new ApiError('Valid full name and email address are required.', 400, false);
  }

  if (!payload.acceptedPolicies?.accepted || !payload.acceptedPolicies.version) {
    throw new ApiError(
      'You must accept the Terms of Service and Privacy Policy to create an account.',
      400,
      false
    );
  }

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new ApiError('An account with that email already exists.', 409, false);
  }

  const chosenRole: UserRole = payload.role === 'seller' ? 'seller' : 'customer';
  const newId = `usr-${chosenRole}-${Date.now().toString(36)}`;
  const newUser: ServerUserRecord = {
    id: newId,
    fullName: payload.fullName.trim(),
    email: cleanEmail,
    phone: payload.phone?.trim() || '+880 1711-000100',
    role: chosenRole,
    roleLabel: chosenRole === 'seller' ? 'Seller Studio Partner' : 'Marketplace Member',
    studioName:
      chosenRole === 'seller'
        ? payload.studioName?.trim() || `${payload.fullName.trim()} Studio`
        : undefined,
    status: 'active',
    joinedAt: new Date().toISOString().slice(0, 10),
    location: 'Dhaka & Global Hub',
    demoPasswordHint: payload.password?.trim() || 'studio2026',
    password: payload.password?.trim() || 'studio2026',
    policyAcceptance: {
      ...payload.acceptedPolicies,
      acceptedAt: payload.acceptedPolicies.acceptedAt || new Date().toISOString(),
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
  persistStaticDb(db);
  return {
    token,
    user: db.toPublicAccount(newUser),
  };
}

export function staticFetchCurrentUser(token?: string): AccountDirectoryEntry {
  const db = getStaticDb();
  const user = db.getUserByToken(token) || db.users[0];
  return db.toPublicAccount(user);
}

export function staticUpdateProfile(
  token: string,
  updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    studioName?: string;
  }
): AccountDirectoryEntry {
  const db = getStaticDb();
  const user = db.getUserByToken(token) || db.users[0];
  if (typeof updates.fullName === 'string' && updates.fullName.trim()) {
    user.fullName = updates.fullName.trim();
  }
  if (typeof updates.email === 'string' && updates.email.includes('@')) {
    user.email = updates.email.trim();
  }
  if (typeof updates.phone === 'string') {
    user.phone = updates.phone.trim();
  }
  if (typeof updates.studioName === 'string' && user.role === 'seller') {
    user.studioName = updates.studioName.trim();
  }
  persistStaticDb(db);
  return db.toPublicAccount(user);
}

export async function staticFetchCatalogProducts(): Promise<Product[]> {
  const { products } = await fetchLiveDummyJsonCatalog();
  return products;
}

export function staticFetchStorefrontSync(): {
  productOverrides: Record<string, ProductOverride>;
  sellerProducts: ApiSellerProductRecord[];
  categoryTree: CategoryNode[];
  customCategories: DynamicCategoryRecord[];
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
} {
  const db = getStaticDb();
  return {
    productOverrides: db.productOverrides,
    sellerProducts: db.sellerCreatedProducts,
    categoryTree: db.categoryTree,
    customCategories: db.customCategories,
    currencyConfig: db.currencyConfig,
    shippingConfig: db.shippingConfig,
  };
}

export function staticFetchCurrencyRates(): CurrencyRateState {
  return getStaticDb().currencyConfig;
}

export function staticUpdateAdminCurrency(updates: {
  bdtRate?: number;
  defaultCurrency?: CurrencyCode;
  source?: string;
  updateFrequencyMinutes?: number;
}): CurrencyRateState {
  const db = getStaticDb();
  db.currencyConfig = updateCurrencyState(db.currencyConfig, updates);
  persistStaticDb(db);
  return db.currencyConfig;
}

export function staticFetchCategoriesTree(): CategoryNode[] {
  return getStaticDb().categoryTree;
}

export function staticFetchShippingLocations(): {
  divisions: BangladeshDivisionEntry[];
  restrictedAreaKeywords: string[];
} {
  const db = getStaticDb();
  return {
    divisions: BANGLADESH_GEO_TREE,
    restrictedAreaKeywords: db.shippingConfig.restrictedAreaKeywords,
  };
}

export async function staticQuoteShipping(payload: {
  items: Array<{ productId: string; quantity: number }>;
  address: { country?: string; state?: string; city?: string; upazila?: string; area?: string };
  promoCode?: string;
  currency?: CurrencyCode;
}): Promise<ShippingQuoteResponse> {
  const db = getStaticDb();
  const itemList: CheckoutItemRequest[] = Array.isArray(payload.items) ? payload.items : [];
  let subtotalUsd = 0;
  let shippingInputs: ShippingQuoteItemInput[] = itemList.map((i) => ({
    quantity: Math.max(1, i.quantity || 1),
    weightKg: 1.0,
    sizeTier: 'small',
    codEligible: true,
  }));

  if (itemList.length > 0) {
    const dynamicCatalogSkus = await getDummyJsonAuthoritativeSkus();
    const resolved = resolveAuthoritativeItems(
      itemList,
      db.sellerCreatedProducts,
      db.productOverrides,
      dynamicCatalogSkus
    );
    subtotalUsd = resolved.subtotalUsd;
    shippingInputs = resolved.shippingInputs;
  }

  const activeCurrency: CurrencyCode =
    payload.currency === 'USD' && (payload.address?.country || 'Bangladesh').toLowerCase() !== 'bangladesh'
      ? 'USD'
      : payload.currency === 'USD' || payload.currency === 'BDT'
      ? payload.currency
      : db.currencyConfig.defaultCurrency;

  return calculateShippingQuote({
    address: payload.address || { country: 'Bangladesh' },
    subtotalUsd,
    items: shippingInputs,
    promoCode: payload.promoCode,
    currency: activeCurrency,
    currencyState: db.currencyConfig,
    config: db.shippingConfig,
  });
}

export function staticUpdateAdminShippingRules(payload: {
  zoneId?: ShippingZoneId;
  updates?: Partial<ShippingZoneRule>;
  restrictedAreaKeywords?: string[];
}): ShippingRuleConfig {
  const db = getStaticDb();
  const { zoneId, updates, restrictedAreaKeywords } = payload;

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
  persistStaticDb(db);
  return db.shippingConfig;
}

export async function staticQuoteCheckout(payload: {
  items: Array<{
    productId: string;
    quantity: number;
    color?: string;
    colorHex?: string;
    size?: string;
  }>;
  address: { country: string; state: string; city: string; upazila?: string; area: string };
  deliveryMethod: DeliveryMethodId;
  promoCode?: string;
  requestedCurrency?: CurrencyCode;
  allowInternationalUsd?: boolean;
}): Promise<CheckoutQuoteResponse> {
  const db = getStaticDb();
  const dynamicCatalogSkus = await getDummyJsonAuthoritativeSkus();
  const { quote } = buildAuthoritativeCheckoutQuote({
    request: payload,
    sellerCreatedProducts: db.sellerCreatedProducts,
    productOverrides: db.productOverrides,
    currencyState: db.currencyConfig,
    shippingConfig: db.shippingConfig,
    dynamicCatalogSkus,
  });
  return quote;
}

export async function staticInitiatePayment(payload: {
  idempotencyKey: string;
  paymentMethod: PaymentMethodId;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: Order['shippingAddress'];
  deliveryMethod: DeliveryMethodId;
  items: Array<{
    productId: string;
    quantity: number;
    color?: string;
    colorHex?: string;
    size?: string;
    name?: string;
    brand?: string;
    category?: string;
    slug?: string;
  }>;
  promoCode?: string;
  requestedCurrency?: CurrencyCode;
  allowInternationalUsd?: boolean;
  acceptedPolicies: LegalAcceptanceRecord;
}): Promise<{ session: PaymentSession; quote: CheckoutQuoteResponse }> {
  const db = getStaticDb();
  if (!payload.acceptedPolicies?.accepted || !payload.acceptedPolicies.version) {
    throw new ApiError(
      'Please confirm the Terms of Service, Return Policy, and Product Disclaimers before proceeding.',
      400,
      false
    );
  }
  if (
    !payload.customerName?.trim() ||
    !payload.email?.includes('@') ||
    !payload.shippingAddress?.streetAddress?.trim()
  ) {
    throw new ApiError(
      'Complete customer name, email, and delivery address are required.',
      400,
      false
    );
  }

  const dynamicCatalogSkus = await getDummyJsonAuthoritativeSkus();
  const ctx = createPaymentSession({
    idempotencyKey:
      payload.idempotencyKey?.trim() ||
      `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    paymentMethod: payload.paymentMethod,
    customer: {
      customerName: payload.customerName.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || '+880 1700-000000',
      shippingAddress: payload.shippingAddress,
      deliveryMethod: payload.deliveryMethod || 'standard',
    },
    quoteRequest: {
      items: payload.items || [],
      address: {
        country: payload.shippingAddress.country,
        state: payload.shippingAddress.state,
        city: payload.shippingAddress.city,
        upazila: payload.shippingAddress.upazila,
        area: payload.shippingAddress.area,
      },
      deliveryMethod: payload.deliveryMethod || 'standard',
      promoCode: payload.promoCode,
      requestedCurrency: payload.requestedCurrency,
      allowInternationalUsd: payload.allowInternationalUsd,
    },
    sellerCreatedProducts: db.sellerCreatedProducts,
    productOverrides: db.productOverrides,
    currencyState: db.currencyConfig,
    shippingConfig: db.shippingConfig,
    existingSessions: db.paymentSessions,
    policyAcceptance: payload.acceptedPolicies,
    dynamicCatalogSkus,
  });

  persistStaticDb(db);
  return { session: ctx.session, quote: ctx.quote };
}

export function staticVerifyPayment(payload: {
  sessionId: string;
  outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed';
  walletNumber?: string;
  failureReason?: string;
}): { session: PaymentSession; order?: Order } {
  const db = getStaticDb();
  const ctx = db.paymentSessions.get(payload.sessionId);
  if (!ctx) {
    throw new ApiError('Payment session expired or not found.', 404, false);
  }

  if (ctx.session.orderId && ['paid', 'cod_pending'].includes(ctx.session.status)) {
    const existingOrder = db.orders.find((o) => o.id === ctx.session.orderId);
    return { session: ctx.session, order: existingOrder };
  }

  const chosenOutcome =
    payload.outcome || (ctx.session.paymentMethod === 'cod' ? 'cod_confirmed' : 'paid');

  const { session, order } = buildVerifiedOrderFromSession(ctx, chosenOutcome, {
    walletNumber: payload.walletNumber,
    failureReason: payload.failureReason,
  });

  if (order) {
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

  persistStaticDb(db);
  return { session, order };
}

export function staticFetchNotifications(role: UserRole): StoreNotification[] {
  const db = getStaticDb();
  return db.notifications.filter(
    (n) => n.roleScope === 'all' || n.roleScope === role || (role === 'admin' && n.roleScope !== 'customer')
  );
}

export function staticMarkNotificationRead(id: string): void {
  const db = getStaticDb();
  const target = db.notifications.find((n) => n.id === id);
  if (target) {
    target.read = true;
    persistStaticDb(db);
  }
}

export function staticFetchOrders(): Order[] {
  return getStaticDb().orders;
}

export function staticCreateOrder(order: Order): Order {
  const db = getStaticDb();
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
  persistStaticDb(db);
  return safeOrder;
}

export function staticUpdateOrderStatus(
  orderId: string,
  stage: OrderStage,
  note?: string
): Order {
  const db = getStaticDb();
  const found = db.orders.find((o) => o.id === orderId);
  if (!found) {
    throw new ApiError('Order not found', 404, false);
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
  persistStaticDb(db);
  return updated;
}

export function staticPerformOrderCustomerAction(
  orderId: string,
  action: 'cancel' | 'return',
  reason?: string
): Order {
  const db = getStaticDb();
  const found = db.orders.find((o) => o.id === orderId);
  if (!found) {
    throw new ApiError('Order not found', 404, false);
  }
  if (action === 'cancel') {
    if (!['Confirmed', 'Processing'].includes(found.currentStage)) {
      throw new ApiError('Orders already packed or shipped cannot be cancelled.', 400, false);
    }
    const updated = db.advanceOrderTimeline(found, 'Cancelled', reason);
    persistStaticDb(db);
    return updated;
  }
  if (action === 'return') {
    if (found.currentStage !== 'Delivered') {
      throw new ApiError('Returns may only be requested after delivery.', 400, false);
    }
    const updated = db.advanceOrderTimeline(found, 'Return Requested', reason);
    persistStaticDb(db);
    return updated;
  }
  throw new ApiError('Unsupported customer order action', 400, false);
}

export function staticFetchSellerDashboard(token?: string): SellerDashboardData {
  const db = getStaticDb();
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

  return {
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
  };
}

export function staticCreateSellerProduct(
  token: string,
  payload: {
    name: string;
    brand?: string;
    category: string;
    categoryLabel: string;
    subcategory?: string;
    subcategoryLabel?: string;
    price: number;
    stockCount: number;
    weightKg?: number;
    sizeTier?: 'small' | 'medium' | 'bulky' | 'freight';
    codEligible?: boolean;
    shortDescription: string;
    imagePresetKey: string;
    highlightOne?: string;
    highlightTwo?: string;
    acceptedPolicies: LegalAcceptanceRecord;
  }
): ApiSellerProductRecord {
  const db = getStaticDb();
  const user = db.getUserByToken(token);

  if (!payload.acceptedPolicies?.accepted || !payload.acceptedPolicies.version) {
    throw new ApiError(
      'Seller Marketplace Agreement & Prohibited Items Policy attestation is required before publishing.',
      400,
      false
    );
  }
  if (!payload.name?.trim() || typeof payload.price !== 'number' || payload.price <= 0) {
    throw new ApiError('Product name and valid positive price are required.', 400, false);
  }

  const stock = Math.max(1, Number(payload.stockCount) || 15);
  const availability: AvailabilityStatus = stock <= 8 ? 'low-stock' : 'in-stock';
  const slugBase = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const id = `prod-seller-${Date.now().toString(36)}`;
  const sku = `SEL-${Math.floor(1000 + Math.random() * 8999)}`;

  const newProduct: ApiSellerProductRecord = {
    id,
    slug: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
    sku,
    name: payload.name.trim(),
    subtitle: 'Seller Studio Release',
    brand: payload.brand?.trim() || user?.studioName || 'Kinto Partner Studio',
    category: payload.category || 'electronics-tech',
    categoryLabel: payload.categoryLabel || 'Electronics & Technology',
    subcategory: payload.subcategory || 'audio-sound',
    subcategoryLabel: payload.subcategoryLabel || 'Studio Release',
    weightKg: typeof payload.weightKg === 'number' && payload.weightKg > 0 ? payload.weightKg : 1.2,
    sizeTier: payload.sizeTier || 'small',
    codEligible: typeof payload.codEligible === 'boolean' ? payload.codEligible : true,
    price: Number(payload.price.toFixed(2)),
    rating: 4.9,
    reviewCount: 1,
    stockCount: stock,
    availability,
    badgeText: 'New Seller Listing',
    shortDescription:
      payload.shortDescription?.trim() ||
      'Direct marketplace release published through the verified Seller Studio portal.',
    description:
      payload.shortDescription?.trim() ||
      'Manufactured and fulfilled directly through an approved Kinto Studio Seller Partner with verified warranty coverage.',
    imagePresetKey: payload.imagePresetKey || 'headphones',
    colors: [{ name: 'Studio Finish', hex: '#2D2C2A' }],
    sizes: ['Standard Edition'],
    cardHighlights: [
      payload.highlightOne?.trim() || 'Direct Studio Ship',
      payload.highlightTwo?.trim() || 'Verified Partner',
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
    tags: ['seller listing', 'new arrival', payload.categoryLabel || 'marketplace'],
    sellerId: user?.id || 'usr-seller-elena',
    isNewArrival: true,
    policyAcceptance: payload.acceptedPolicies,
  };

  db.sellerCreatedProducts.unshift(newProduct);
  persistStaticDb(db);
  return newProduct;
}

export function staticUpdateSellerProduct(
  id: string,
  updates: { price?: number; stockCount?: number; availability?: AvailabilityStatus }
): ProductOverride {
  const db = getStaticDb();
  const override = db.updateInventoryItem(id, {
    price: typeof updates.price === 'number' && updates.price > 0 ? updates.price : undefined,
    stockCount:
      typeof updates.stockCount === 'number' && updates.stockCount >= 0
        ? updates.stockCount
        : undefined,
    availability: updates.availability,
  });
  persistStaticDb(db);
  return override;
}

export function staticFetchAdminDashboard(): AdminDashboardData {
  const db = getStaticDb();
  const orderGmv = db.orders
    .filter((o) => o.currentStage !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const activeSellers = db.sellerApplications.filter((s) => s.status === 'approved').length;
  const pendingSellers = db.sellerApplications.filter((s) => s.status === 'pending').length;
  const activeTopDepartments = db.categoryTree.filter((c) => c.depth === 0 && c.isActive).length;

  return {
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
  };
}

export function staticUpdateAdminUser(
  id: string,
  updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' }
): AccountDirectoryEntry {
  const db = getStaticDb();
  const updated = db.updateUserRoleAndStatus(id, updates);
  if (!updated) {
    throw new ApiError('User not found', 404, false);
  }
  persistStaticDb(db);
  return updated;
}

export function staticUpdateSellerStatus(
  id: string,
  status: 'approved' | 'pending' | 'suspended'
): SellerApplicationRecord {
  const db = getStaticDb();
  const appRec = db.sellerApplications.find((s) => s.id === id);
  if (!appRec) {
    throw new ApiError('Seller application not found', 404, false);
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
  persistStaticDb(db);
  return appRec;
}

export function staticCreateCategoryNode(payload: {
  name: string;
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
}): { category: CategoryNode; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  if (!payload.name?.trim()) {
    throw new ApiError('Category name is required.', 400, false);
  }

  const baseSlug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = db.categoryTree.some((c) => c.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString(36).slice(-3)}`
    : baseSlug;

  const parentNode = payload.parentId
    ? db.categoryTree.find((c) => c.id === payload.parentId)
    : null;
  const depth = parentNode ? parentNode.depth + 1 : 0;
  const pathSlugs = parentNode ? [...parentNode.pathSlugs, slug] : [slug];
  const siblings = db.categoryTree.filter(
    (c) => (c.parentId || null) === (parentNode?.id || null)
  );
  const nodeId = `cat-${slug}-${Date.now().toString(36).slice(-3)}`;

  const created: CategoryNode = {
    id: nodeId,
    slug,
    name: payload.name.trim(),
    shortName: payload.shortName?.trim() || payload.name.trim(),
    parentId: parentNode?.id || null,
    depth,
    pathSlugs,
    description:
      payload.description?.trim() ||
      'Dynamically curated category node managed through Kinto Studio Platform Operations.',
    bannerTagline: payload.bannerTagline?.trim() || 'Admin-curated marketplace collection',
    iconName: payload.iconName?.trim() || parentNode?.iconName || 'Tag',
    imagePresetKey: payload.imagePresetKey || parentNode?.imagePresetKey || 'clock',
    countLabel: parentNode ? `Under ${parentNode.shortName}` : 'Dynamic Department',
    sortOrder: typeof payload.sortOrder === 'number' ? payload.sortOrder : siblings.length + 1,
    isActive: true,
    seoTitle: payload.seoTitle?.trim() || `${payload.name.trim()} — Kinto Studio`,
    seoDescription:
      payload.seoDescription?.trim() || `Explore ${payload.name.trim()} on Kinto Studio Marketplace.`,
    collectionIds:
      Array.isArray(payload.collectionIds) && payload.collectionIds.length > 0
        ? payload.collectionIds
        : ['featured'],
    featuredBrands:
      Array.isArray(payload.featuredBrands) && payload.featuredBrands.length > 0
        ? payload.featuredBrands
        : ['Kinto Atelier'],
    filterFacets:
      Array.isArray(payload.filterFacets) && payload.filterFacets.length > 0
        ? payload.filterFacets
        : parentNode
        ? []
        : [{ key: 'materials', label: 'Primary Material', type: 'text', filterable: true }],
  };

  db.categoryTree.push(created);

  if (payload.subcategoryName?.trim()) {
    const childSlugBase = payload.subcategoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const childSlug = db.categoryTree.some((c) => c.slug === childSlugBase)
      ? `${childSlugBase}-${Date.now().toString(36).slice(-3)}`
      : childSlugBase;
    const childNode: CategoryNode = {
      id: `cat-${childSlug}-${Date.now().toString(36).slice(-3)}`,
      slug: childSlug,
      name: payload.subcategoryName.trim(),
      shortName: payload.subcategoryName.trim(),
      parentId: created.id,
      depth: created.depth + 1,
      pathSlugs: [...created.pathSlugs, childSlug],
      description: `Curated ${payload.subcategoryName.trim()} selection within ${created.name}.`,
      bannerTagline: created.bannerTagline,
      iconName: created.iconName,
      imagePresetKey: created.imagePresetKey,
      countLabel: `Under ${created.shortName}`,
      sortOrder: 1,
      isActive: true,
      seoTitle: `${payload.subcategoryName.trim()} — ${created.name}`,
      seoDescription: `Shop ${payload.subcategoryName.trim()} in ${created.name}.`,
      collectionIds: created.collectionIds,
      featuredBrands: created.featuredBrands,
      filterFacets: [],
    };
    db.categoryTree.push(childNode);
  }

  persistStaticDb(db);
  return { category: created, categoryTree: db.categoryTree };
}

export function staticUpdateCategoryNode(
  id: string,
  updates: Partial<CategoryNode>
): { category: CategoryNode; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  const target = db.categoryTree.find((c) => c.id === id || c.slug === id);
  if (!target) {
    throw new ApiError('Category node not found.', 404, false);
  }

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

  persistStaticDb(db);
  return { category: target, categoryTree: db.categoryTree };
}

export function staticDeleteCategoryNode(
  idOrSlug: string
): { ok: boolean; removedCount: number; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  const target = db.categoryTree.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  if (!target) {
    throw new ApiError('Category node not found.', 404, false);
  }

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
  persistStaticDb(db);
  return { ok: true, removedCount: toRemoveIds.size, categoryTree: db.categoryTree };
}
