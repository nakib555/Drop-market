import {
  MockMarketplaceDb,
  type ServerUserRecord,
} from '../../server/mockDb';
import { updateCurrencyState } from '../../server/services/currencyService';
import {
  buildAuthoritativeCheckoutQuote,
  buildVerifiedOrderFromSession,
  createPaymentSession,
  getCheckoutChannelStatus,
  getGatewayConfigStatus,
  resolveActivePromo,
  resolveAuthoritativeItems,
  type CheckoutItemRequest,
  type PendingSessionContext,
} from '../../server/services/paymentService';
import {
  calculateShippingQuote,
  type ShippingQuoteItemInput,
} from '../../server/services/shippingService';
import {
  buildActiveCookieInventory,
  buildPolicyChecklistSummary,
  buildPublicFactsSummary,
  buildValidatedAcceptanceRecord,
  getPublicPublishedPolicies,
  projectPublicPolicyDocument,
  savePolicyDraft,
  transitionPolicyStatus,
} from '../../server/services/policyService';
import {
  fetchLiveDummyJsonCatalog,
  getCachedDummyJsonProductsSync,
  getDummyJsonAuthoritativeSkus,
} from '../../server/shared/dummyJsonCatalog';
import {
  AUTHORITATIVE_CATALOG_SKUS,
  BANGLADESH_GEO_TREE,
  type BangladeshDivisionEntry,
} from '../../server/shared/marketplaceSchema';
import type {
  AccountDirectoryEntry,
  Address,
  AdminDashboardData,
  AdminSystemReadiness,
  ApiSellerProductRecord,
  AvailabilityStatus,
  CartItem,
  CartMergeReport,
  CategoryFacetConfig,
  CategoryNode,
  CheckoutQuoteResponse,
  CookieInventoryItem,
  CurrencyCode,
  CurrencyRateState,
  DeliveryMethodId,
  DynamicCategoryRecord,
  LanguageCode,
  LegalAcceptanceRecord,
  LegalReviewChecklistItem,
  ManagedPromoRecord,
  NewsletterSubscriptionRecord,
  Order,
  OrderStage,
  PasswordResetRequestResult,
  PaymentMethodId,
  PaymentMethodRecord,
  PaymentSession,
  PlatformSettingsState,
  PolicyAcceptanceLedgerEntry,
  PolicyChecklistSummary,
  PolicyDocumentRecord,
  PolicyFactsConfig,
  PolicyFactsPublicSummary,
  PolicySection,
  PolicyVersionRecord,
  Product,
  ProductOverride,
  ProductReview,
  SellerApplicationRecord,
  SellerDashboardData,
  SellerStoreSettings,
  ShippingQuoteResponse,
  ShippingRuleConfig,
  ShippingZoneId,
  ShippingZoneRule,
  StoreNotification,
  StorePolicyConfig,
  SupportInquiryRecord,
  UserRole,
} from '../types/commerce';
import { ApiError } from './apiError';
import { buildCartMergeProducts, mergeGuestAndServerCarts } from '../utils/cartMerge';

const STATIC_DB_STORAGE_KEY = 'kinto-static-db-v2';

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
  sellerStoreSettings: SellerStoreSettings;
  promotions: ManagedPromoRecord[];
  platformSettings: PlatformSettingsState;
  sessions: Array<[string, string]>;
  sessionExpiry?: Array<[string, number]>;
  userCarts?: Array<[string, CartItem[]]>;
  wishlists?: Array<[string, string[]]>;
  userAddresses?: Array<[string, Address[]]>;
  userPaymentMethods?: Array<[string, PaymentMethodRecord[]]>;
  productReviews?: Array<[string, ProductReview[]]>;
  paymentSessions: Array<[string, PendingSessionContext]>;
  policyFacts?: PolicyFactsConfig;
  policies?: PolicyDocumentRecord[];
  policyAcceptanceLedger?: PolicyAcceptanceLedgerEntry[];
  legalReviewChecklist?: LegalReviewChecklistItem[];
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
        if (parsed.sellerStoreSettings) {
          instance.sellerStoreSettings = parsed.sellerStoreSettings;
        }
        if (Array.isArray(parsed.promotions)) {
          instance.promotions = parsed.promotions;
        }
        if (parsed.platformSettings) {
          instance.platformSettings = parsed.platformSettings;
        }
        if (Array.isArray(parsed.sessions)) {
          instance.sessions = new Map(parsed.sessions);
        }
        if (Array.isArray(parsed.sessionExpiry)) {
          instance.sessionExpiry = new Map(parsed.sessionExpiry);
        }
        if (Array.isArray(parsed.userCarts)) {
          instance.userCarts = new Map(parsed.userCarts);
        }
        if (Array.isArray(parsed.wishlists)) {
          instance.wishlists = new Map(
            parsed.wishlists.map(([uid, ids]) => [uid, new Set(ids)])
          );
        }
        if (Array.isArray(parsed.userAddresses)) {
          instance.userAddresses = new Map(parsed.userAddresses);
        }
        if (Array.isArray(parsed.userPaymentMethods)) {
          instance.userPaymentMethods = new Map(parsed.userPaymentMethods);
        }
        if (Array.isArray(parsed.productReviews)) {
          instance.productReviews = new Map(parsed.productReviews);
        }
        if (Array.isArray(parsed.paymentSessions)) {
          instance.paymentSessions = new Map(parsed.paymentSessions);
        }
        if (parsed.policyFacts) {
          instance.policyFacts = parsed.policyFacts;
        }
        if (Array.isArray(parsed.policies) && parsed.policies.length > 0) {
          instance.policies = parsed.policies;
        }
        if (Array.isArray(parsed.policyAcceptanceLedger)) {
          instance.policyAcceptanceLedger = parsed.policyAcceptanceLedger;
        }
        if (Array.isArray(parsed.legalReviewChecklist) && parsed.legalReviewChecklist.length > 0) {
          instance.legalReviewChecklist = parsed.legalReviewChecklist;
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
      sellerStoreSettings: db.sellerStoreSettings,
      promotions: db.promotions,
      platformSettings: db.platformSettings,
      sessions: Array.from(db.sessions.entries()),
      sessionExpiry: Array.from(db.sessionExpiry.entries()),
      userCarts: Array.from(db.userCarts.entries()),
      wishlists: Array.from(db.wishlists.entries()).map(([uid, set]) => [uid, Array.from(set)]),
      userAddresses: Array.from(db.userAddresses.entries()),
      userPaymentMethods: Array.from(db.userPaymentMethods.entries()),
      productReviews: Array.from(db.productReviews.entries()),
      paymentSessions: Array.from(db.paymentSessions.entries()),
      policyFacts: db.policyFacts,
      policies: db.policies,
      policyAcceptanceLedger: db.policyAcceptanceLedger,
      legalReviewChecklist: db.legalReviewChecklist,
    };
    window.localStorage.setItem(STATIC_DB_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or restricted-storage errors silently
  }
}

function assertStaticAuth(db: MockMarketplaceDb, token?: string): ServerUserRecord {
  const user = db.getUserByToken(token);
  if (!user) {
    throw new ApiError('Authentication required. Please sign in.', 401, false);
  }
  if (user.status === 'suspended') {
    throw new ApiError('This account is suspended. Contact marketplace support.', 403, false);
  }
  return user;
}

function assertStaticRole(
  db: MockMarketplaceDb,
  token: string | undefined,
  allowed: UserRole[]
): ServerUserRecord {
  const user = assertStaticAuth(db, token);
  if (!allowed.includes(user.role)) {
    throw new ApiError(`Access denied. Required role: ${allowed.join(' or ')}.`, 403, false);
  }
  return user;
}

export function staticFetchAuthAccounts(token?: string): AccountDirectoryEntry[] {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  return db.users.map((u) => db.toPublicAccount(u));
}

export function staticLogin(payload: {
  email?: string;
  password?: string;
}): { token: string; user: AccountDirectoryEntry } {
  const db = getStaticDb();
  const cleanEmail = (payload?.email || '').trim().toLowerCase();
  const cleanPassword = (payload?.password || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@') || !cleanPassword) {
    throw new ApiError('Email address and password are required.', 400, false);
  }

  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user || user.password !== cleanPassword) {
    throw new ApiError('Invalid email address or password.', 401, false);
  }

  if (user.status === 'suspended') {
    throw new ApiError('This account is currently suspended.', 403, false);
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
  const cleanPassword = (payload.password || '').trim();

  if (!payload.fullName?.trim() || !cleanEmail || !cleanEmail.includes('@')) {
    throw new ApiError('Valid full name and email address are required.', 400, false);
  }
  if (cleanPassword.length < 6) {
    throw new ApiError('Password must be at least 6 characters.', 400, false);
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

  const validatedAcceptance = buildValidatedAcceptanceRecord({
    policies: db.policies,
    requestedPolicyIds:
      Array.isArray(payload.acceptedPolicies.scope) && payload.acceptedPolicies.scope.length > 0
        ? payload.acceptedPolicies.scope
        : payload.role === 'seller'
        ? ['terms', 'privacy-policy', 'marketplace-terms', 'seller-agreement']
        : ['terms', 'privacy-policy', 'marketplace-terms'],
    requestedVersion: payload.acceptedPolicies.version,
    jurisdiction: payload.acceptedPolicies.jurisdiction,
    marketingOptIn: Boolean(payload.acceptedPolicies.marketingOptIn),
  });

  const chosenRole: UserRole = payload.role === 'seller' ? 'seller' : 'customer';
  const newId = `usr-${chosenRole}-${Date.now().toString(36)}`;
  const newUser: ServerUserRecord = {
    id: newId,
    fullName: payload.fullName.trim(),
    email: cleanEmail,
    phone: payload.phone?.trim() || '',
    role: chosenRole,
    roleLabel: chosenRole === 'seller' ? 'Seller Studio Partner' : 'Member Account',
    studioName:
      chosenRole === 'seller'
        ? payload.studioName?.trim() || `${payload.fullName.trim()} Studio`
        : undefined,
    status: 'active',
    joinedAt: new Date().toISOString().slice(0, 10),
    location: 'Dhaka, Bangladesh',
    password: cleanPassword,
    policyAcceptance: validatedAcceptance,
  };

  db.users.unshift(newUser);
  db.recordPolicyAcceptance('registration', `user:${newId}`, validatedAcceptance);
  if (chosenRole === 'seller') {
    db.sellerApplications.unshift({
      id: `app-${Date.now().toString(36)}`,
      studioName: newUser.studioName || `${newUser.fullName} Studio`,
      ownerName: newUser.fullName,
      email: newUser.email,
      department: 'Multi-Department',
      origin: 'Dhaka Partner Network',
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
  const user = assertStaticAuth(db, token);
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
  const user = assertStaticAuth(db, token);
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

export function staticChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): { ok: boolean; message: string } {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  if (!currentPassword || user.password !== currentPassword.trim()) {
    throw new ApiError('Current password is incorrect.', 400, false);
  }
  const cleanNew = (newPassword || '').trim();
  if (cleanNew.length < 8) {
    throw new ApiError('New password must be at least 8 characters.', 400, false);
  }
  user.password = cleanNew;
  persistStaticDb(db);
  return { ok: true, message: 'Password updated successfully.' };
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
  promotions: ManagedPromoRecord[];
  publishedPolicies: PolicyDocumentRecord[];
  policyFactsPublic: PolicyFactsPublicSummary;
  cookieInventory: CookieInventoryItem[];
  enabledPaymentMethods: PaymentMethodId[];
} {
  const db = getStaticDb();
  const candidates: PaymentMethodId[] = [
    'cod',
    'bkash',
    'nagad',
    'rocket',
    'visa',
    'mastercard',
    'sslcommerz',
    'bank-transfer',
  ];
  return {
    productOverrides: db.productOverrides,
    sellerProducts: db.sellerCreatedProducts,
    categoryTree: db.categoryTree,
    customCategories: db.customCategories,
    currencyConfig: db.currencyConfig,
    shippingConfig: db.shippingConfig,
    promotions: db.promotions,
    publishedPolicies: getPublicPublishedPolicies(db.policies),
    policyFactsPublic: buildPublicFactsSummary(db.policyFacts),
    cookieInventory: buildActiveCookieInventory(),
    enabledPaymentMethods: candidates.filter((id) => getCheckoutChannelStatus(id).enabled),
  };
}

export function staticFetchPublicPolicies(): {
  policies: PolicyDocumentRecord[];
  policyFactsPublic: PolicyFactsPublicSummary;
  cookieInventory: CookieInventoryItem[];
} {
  const db = getStaticDb();
  return {
    policies: getPublicPublishedPolicies(db.policies),
    policyFactsPublic: buildPublicFactsSummary(db.policyFacts),
    cookieInventory: buildActiveCookieInventory(),
  };
}

export function staticFetchPolicyBySlug(
  slug: string,
  version?: string
): {
  policy: PolicyDocumentRecord;
  historicalVersionRequested: string | null;
  isHistoricalSnapshot: boolean;
  policyFactsPublic: PolicyFactsPublicSummary;
} {
  const db = getStaticDb();
  const cleanSlug = slug.trim().toLowerCase();
  const found = db.policies.find((p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug);
  if (!found) {
    throw new ApiError('Policy document not found.', 404, false);
  }
  const projected = projectPublicPolicyDocument(found, version);
  if (!projected) {
    throw new ApiError('This policy is not published for public viewing.', 404, false);
  }
  return {
    policy: projected,
    historicalVersionRequested: version || null,
    isHistoricalSnapshot: Boolean(version && version !== found.currentVersion),
    policyFactsPublic: buildPublicFactsSummary(db.policyFacts),
  };
}

export function staticFetchCurrencyRates(): CurrencyRateState {
  return getStaticDb().currencyConfig;
}

export function staticUpdateAdminCurrency(
  updates: {
    bdtRate?: number;
    defaultCurrency?: CurrencyCode;
    source?: string;
    updateFrequencyMinutes?: number;
  },
  token?: string
): CurrencyRateState {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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

  const promoObj = resolveActivePromo(payload.promoCode, db.promotions);
  const promoApplied =
    promoObj && subtotalUsd >= promoObj.minSubtotal ? promoObj.code : undefined;

  return calculateShippingQuote({
    address: payload.address || { country: 'Bangladesh' },
    subtotalUsd,
    items: shippingInputs,
    promoCode: promoApplied,
    currency: activeCurrency,
    currencyState: db.currencyConfig,
    config: db.shippingConfig,
  });
}

export function staticUpdateAdminShippingRules(
  payload: {
    zoneId?: ShippingZoneId;
    updates?: Partial<ShippingZoneRule>;
    restrictedAreaKeywords?: string[];
  },
  token?: string
): ShippingRuleConfig {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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
    promotions: db.promotions,
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
    !payload.phone?.trim() ||
    !payload.shippingAddress?.streetAddress?.trim()
  ) {
    throw new ApiError(
      'Complete customer name, email, phone number, and delivery address are required.',
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
      phone: payload.phone.trim(),
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
    policyAcceptance: buildValidatedAcceptanceRecord({
      policies: db.policies,
      requestedPolicyIds:
        Array.isArray(payload.acceptedPolicies.scope) && payload.acceptedPolicies.scope.length > 0
          ? payload.acceptedPolicies.scope
          : ['terms', 'return-policy', 'cancellation-policy', 'shipping-policy', 'payment-policy', 'product-safety'],
      requestedVersion: payload.acceptedPolicies.version,
      jurisdiction: payload.acceptedPolicies.jurisdiction,
    }),
    dynamicCatalogSkus,
    promotions: db.promotions,
  });

  persistStaticDb(db);
  return { session: ctx.session, quote: ctx.quote };
}

export function staticVerifyPayment(payload: {
  sessionId: string;
  outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed';
  walletNumber?: string;
  cardLast4?: string;
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

  if (chosenOutcome === 'paid' && ctx.session.paymentMethod === 'cod') {
    throw new ApiError(
      'Cash on Delivery sessions must complete with cod_confirmed status, never prepaid paid.',
      400,
      false
    );
  }

  if (chosenOutcome === 'paid') {
    const gatewayStatus = getCheckoutChannelStatus(ctx.session.paymentMethod);
    if (!gatewayStatus.enabled) {
      throw new ApiError(
        gatewayStatus.reason || 'Payment gateway credentials are not configured.',
        400,
        false
      );
    }
  }

  const { session, order } = buildVerifiedOrderFromSession(ctx, chosenOutcome, {
    walletNumber: payload.walletNumber,
    cardLast4: payload.cardLast4,
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
    if (order.policyAcceptance) {
      db.recordPolicyAcceptance('checkout', `order:${order.id}`, order.policyAcceptance);
    }
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

export function staticFetchNotifications(token?: string): StoreNotification[] {
  const db = getStaticDb();
  const user = db.getUserByToken(token);
  const role: UserRole = user?.role || 'customer';
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

export function staticFetchOrders(token?: string): Order[] {
  const db = getStaticDb();
  const user = db.getUserByToken(token);
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'seller') return db.orders;
  return db.orders.filter((o) => o.email.toLowerCase() === user.email.toLowerCase());
}

export function staticTrackOrder(id: string, contact?: string, token?: string): Order {
  const db = getStaticDb();
  const cleanId = (id || '').trim().toLowerCase();
  if (!cleanId) {
    throw new ApiError('Order reference ID is required.', 400, false);
  }
  const found = db.orders.find((o) => o.id.toLowerCase() === cleanId);
  if (!found) {
    throw new ApiError(`No order found matching reference ${id.toUpperCase()}.`, 404, false);
  }
  const user = db.getUserByToken(token);
  const isStaff = user?.role === 'admin' || user?.role === 'seller';
  const isOwner = Boolean(user && user.email.toLowerCase() === found.email.toLowerCase());
  const cleanContact = (contact || '').trim().toLowerCase();
  if (!isStaff && !isOwner) {
    if (!cleanContact) {
      throw new ApiError(
        'Sign in or enter the matching email address or phone number used at checkout to track this order.',
        401,
        false
      );
    }
    const emailMatch = found.email.toLowerCase() === cleanContact;
    const contactDigits = cleanContact.replace(/\D/g, '');
    const phoneMatch =
      contactDigits.length >= 6 &&
      found.phone.replace(/\D/g, '').endsWith(contactDigits);
    if (!emailMatch && !phoneMatch) {
      throw new ApiError('Verification email or phone number does not match this order.', 403, false);
    }
  }
  return found;
}

export function staticCreateOrder(_order: Order): Order {
  throw new ApiError(
    'Direct order creation is disabled. Complete checkout through verified payment initiation and verification.',
    403,
    false
  );
}

export function staticUpdateOrderStatus(
  orderId: string,
  stage: OrderStage,
  note?: string,
  token?: string
): Order {
  const db = getStaticDb();
  assertStaticRole(db, token, ['seller', 'admin']);
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
  reason?: string,
  token?: string
): Order {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const found = db.orders.find((o) => o.id === orderId);
  if (!found) {
    throw new ApiError('Order not found', 404, false);
  }
  if (user.role === 'customer' && found.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ApiError('You may only modify your own orders.', 403, false);
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
  const user = assertStaticRole(db, token, ['seller', 'admin']);
  const activeStudio = user.studioName || db.sellerStoreSettings.studioName;
  const ownerName = user.fullName;

  const combinedInventory = db.getCombinedInventory();
  const pendingOrders = db.orders.filter(
    (o) => !['Delivered', 'Cancelled', 'Return Requested'].includes(o.currentStage)
  );
  const returnsQueue = db.orders.filter(
    (o) => o.currentStage === 'Return Requested' || o.currentStage === 'Cancelled'
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
      avgRating: 0,
      returnRequestsCount: returnsQueue.length,
    },
    revenueSeries: db.buildDynamicRevenueSeries(monthlyGmv, pendingOrders.length),
    inventory: combinedInventory,
    fulfillmentQueue: db.orders.slice(0, 12),
    returnsQueue,
    authorizedCustomers: db.getAuthorizedCustomersForSeller(),
    storeSettings: {
      ...db.sellerStoreSettings,
      studioName: activeStudio,
    },
  };
}

export function staticUpdateSellerSettings(
  token: string,
  updates: Partial<SellerStoreSettings>
): SellerStoreSettings {
  const db = getStaticDb();
  assertStaticRole(db, token, ['seller', 'admin']);
  db.sellerStoreSettings = {
    ...db.sellerStoreSettings,
    ...(typeof updates.studioName === 'string' && updates.studioName.trim()
      ? { studioName: updates.studioName.trim() }
      : {}),
    ...(typeof updates.contactEmail === 'string' && updates.contactEmail.includes('@')
      ? { contactEmail: updates.contactEmail.trim() }
      : {}),
    ...(typeof updates.dispatchLeadTime === 'string' && updates.dispatchLeadTime.trim()
      ? { dispatchLeadTime: updates.dispatchLeadTime.trim() }
      : {}),
    ...(typeof updates.pickupDivision === 'string' && updates.pickupDivision.trim()
      ? { pickupDivision: updates.pickupDivision.trim() }
      : {}),
    ...(typeof updates.codSupported === 'boolean' ? { codSupported: updates.codSupported } : {}),
    ...(Array.isArray(updates.preferredCouriers)
      ? { preferredCouriers: updates.preferredCouriers.filter(Boolean) }
      : {}),
    ...(typeof updates.payoutChannel === 'string' && updates.payoutChannel.trim()
      ? { payoutChannel: updates.payoutChannel.trim() }
      : {}),
    ...(typeof updates.payoutSchedule === 'string' && updates.payoutSchedule.trim()
      ? { payoutSchedule: updates.payoutSchedule.trim() }
      : {}),
    ...(typeof updates.payoutAccountMasked === 'string' && updates.payoutAccountMasked.trim()
      ? { payoutAccountMasked: updates.payoutAccountMasked.trim() }
      : {}),
  };
  persistStaticDb(db);
  return db.sellerStoreSettings;
}

export function staticResolveSellerReturn(
  token: string,
  orderId: string,
  decision: 'approve_refund' | 'restore_delivered',
  note?: string
): Order {
  const db = getStaticDb();
  assertStaticRole(db, token, ['seller', 'admin']);
  const found = db.orders.find((o) => o.id === orderId);
  if (!found) {
    throw new ApiError('Order not found.', 404, false);
  }
  const nextStage: OrderStage = decision === 'restore_delivered' ? 'Delivered' : 'Cancelled';
  const updated = db.advanceOrderTimeline(
    found,
    nextStage,
    note ||
      (decision === 'restore_delivered'
        ? 'Return inspection closed · order confirmed delivered'
        : 'Seller approved return · refund settlement queued')
  );
  if (decision === 'approve_refund' && updated.paymentStatus === 'paid') {
    updated.paymentStatus = 'cancelled';
  }
  persistStaticDb(db);
  return updated;
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
  const user = assertStaticRole(db, token, ['seller', 'admin']);

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
    rating: 0,
    reviewCount: 0,
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
    returnPolicy: `${db.policyFacts.returnWindowDays}-Day Return Policy (see Return & Refund Policy)`,
    warranty: '2-Year Partner Warranty',
    tags: ['seller listing', 'new arrival', payload.categoryLabel || 'marketplace'],
    sellerId: user?.id || 'usr-seller-elena',
    isNewArrival: true,
    policyAcceptance: buildValidatedAcceptanceRecord({
      policies: db.policies,
      requestedPolicyIds: ['seller-agreement', 'marketplace-terms', 'prohibited-items'],
      requestedVersion: payload.acceptedPolicies.version,
      jurisdiction: payload.acceptedPolicies.jurisdiction,
    }),
  };

  db.sellerCreatedProducts.unshift(newProduct);
  if (newProduct.policyAcceptance) {
    db.recordPolicyAcceptance('seller_listing', `sku:${newProduct.sku}`, newProduct.policyAcceptance);
  }
  persistStaticDb(db);
  return newProduct;
}

export function staticUpdateSellerProduct(
  id: string,
  updates: { price?: number; stockCount?: number; availability?: AvailabilityStatus },
  token?: string
): ProductOverride {
  const db = getStaticDb();
  assertStaticRole(db, token, ['seller', 'admin']);
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

export function staticFetchAdminDashboard(token?: string): AdminDashboardData {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  const orderGmv = db.orders
    .filter((o) => o.currentStage !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const activeSellers = db.sellerApplications.filter((s) => s.status === 'approved').length;
  const pendingSellers = db.sellerApplications.filter((s) => s.status === 'pending').length;
  const activeTopDepartments = db.categoryTree.filter((c) => c.depth === 0 && c.isActive).length;
  const combinedInventory = db.getCombinedInventory();
  const openReturnsCount = db.orders.filter((o) => o.currentStage === 'Return Requested').length;
  const lowStockCount = combinedInventory.filter((i) => i.stockCount <= 8).length;

  return {
    kpis: {
      totalGmv: 184600 + Math.round(orderGmv),
      totalOrders: db.orders.length + 148,
      activeSellers,
      pendingSellers,
      registeredUsers: db.users.length,
      activeCategories: activeTopDepartments,
      openReturnsCount,
      lowStockCount,
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
    inventory: combinedInventory,
    promotions: db.promotions,
    categories: db.categoryTree,
    currencyConfig: db.currencyConfig,
    shippingConfig: db.shippingConfig,
    platformSettings: db.platformSettings,
    supportInquiries: db.supportInquiries,
    newsletterSubscribersCount: db.newsletterSubscribers.length,
    policies: db.policies,
    policyFacts: db.policyFacts,
    policyAcceptanceLedger: db.policyAcceptanceLedger.slice(0, 100),
    legalReviewChecklist: db.legalReviewChecklist,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticUpdateAdminUser(
  id: string,
  updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' },
  token?: string
): AccountDirectoryEntry {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  const updated = db.updateUserRoleAndStatus(id, updates);
  if (!updated) {
    throw new ApiError('User not found', 404, false);
  }
  persistStaticDb(db);
  return updated;
}

export function staticUpdateSellerStatus(
  id: string,
  status: 'approved' | 'pending' | 'suspended',
  token?: string
): SellerApplicationRecord {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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

export function staticUpdateAdminPromotions(
  payload: { code: string; active?: boolean; value?: number },
  token?: string
): ManagedPromoRecord[] {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  const promo = db.promotions.find((p) => p.code === payload.code);
  if (!promo) {
    throw new ApiError('Promo code not found.', 404, false);
  }
  if (typeof payload.active === 'boolean') promo.active = payload.active;
  if (typeof payload.value === 'number' && payload.value >= 0 && payload.value <= 90) {
    promo.value = payload.value;
  }
  persistStaticDb(db);
  return db.promotions;
}

export function staticProcessAdminRefund(
  orderId: string,
  action: 'approve_refund' | 'decline_return',
  note?: string,
  token?: string
): Order {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  const found = db.orders.find((o) => o.id === orderId);
  if (!found) {
    throw new ApiError('Order not found.', 404, false);
  }
  const nextStage: OrderStage = action === 'decline_return' ? 'Delivered' : 'Cancelled';
  const updated = db.advanceOrderTimeline(
    found,
    nextStage,
    note ||
      (action === 'decline_return'
        ? 'Admin compliance closed return · original delivery stands'
        : 'Admin processed verified refund & reversed gateway settlement')
  );
  if (action !== 'decline_return') {
    updated.paymentStatus = 'cancelled';
  }
  persistStaticDb(db);
  return updated;
}

export function staticUpdateAdminPlatformSettings(
  updates: Partial<{
    storefrontName: string;
    supportEmail: string;
    defaultLanguage: LanguageCode;
    maintenanceNoticeEnabled: boolean;
  }>,
  token?: string
): PlatformSettingsState {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  db.platformSettings = {
    ...db.platformSettings,
    ...(typeof updates.storefrontName === 'string' && updates.storefrontName.trim()
      ? { storefrontName: updates.storefrontName.trim() }
      : {}),
    ...(typeof updates.supportEmail === 'string' && updates.supportEmail.includes('@')
      ? { supportEmail: updates.supportEmail.trim() }
      : {}),
    ...(updates.defaultLanguage &&
    ['en', 'bn', 'hi', 'ar', 'es', 'fr'].includes(updates.defaultLanguage)
      ? { defaultLanguage: updates.defaultLanguage }
      : {}),
    ...(typeof updates.maintenanceNoticeEnabled === 'boolean'
      ? { maintenanceNoticeEnabled: updates.maintenanceNoticeEnabled }
      : {}),
  };
  persistStaticDb(db);
  return db.platformSettings;
}

export function staticCreateCategoryNode(
  payload: {
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
  },
  token?: string
): { category: CategoryNode; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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
  updates: Partial<CategoryNode>,
  token?: string
): { category: CategoryNode; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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
  idOrSlug: string,
  token?: string
): { ok: boolean; removedCount: number; categoryTree: CategoryNode[] } {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
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

export function staticRequestPasswordReset(email: string): PasswordResetRequestResult {
  const db = getStaticDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new ApiError('Enter a valid registered email address.', 400, false);
  }
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  const expiresInMinutes = 15;
  if (!user) {
    return {
      ok: true,
      deliveryMode: 'in-app-preview',
      expiresInMinutes,
      message: 'No matching account found or SMTP is unconfigured. Verify your email address and try again.',
    };
  }
  const code = String(Math.floor(100000 + Math.random() * 899999));
  db.passwordResetTokens.set(cleanEmail, {
    email: cleanEmail,
    userId: user.id,
    code,
    expiresAt: Date.now() + expiresInMinutes * 60_000,
    used: false,
  });
  persistStaticDb(db);
  return {
    ok: true,
    deliveryMode: 'in-app-preview',
    previewCode: code,
    expiresInMinutes,
    message:
      'Offline/static mode: SMTP email transport is unavailable. Use the verification code shown below within 15 minutes.',
  };
}

export function staticConfirmPasswordReset(payload: {
  email: string;
  code: string;
  newPassword: string;
}): { ok: boolean; message: string } {
  const db = getStaticDb();
  const cleanEmail = (payload.email || '').trim().toLowerCase();
  const cleanCode = (payload.code || '').trim();
  const cleanNew = (payload.newPassword || '').trim();
  if (!cleanEmail || !cleanCode) {
    throw new ApiError('Email address and 6-digit verification code are required.', 400, false);
  }
  if (cleanNew.length < 6) {
    throw new ApiError('New password must be at least 6 characters long.', 400, false);
  }
  const record = db.passwordResetTokens.get(cleanEmail);
  if (!record || record.used || record.code !== cleanCode || Date.now() > record.expiresAt) {
    throw new ApiError('Verification code is invalid or expired. Request a new code.', 400, false);
  }
  const user = db.users.find((u) => u.id === record.userId);
  if (!user) {
    throw new ApiError('Account record could not be located.', 404, false);
  }
  user.password = cleanNew;
  record.used = true;
  db.invalidateUserSessions(user.id);
  persistStaticDb(db);
  return {
    ok: true,
    message: 'Password has been reset and existing sessions cleared. Sign in with your new password.',
  };
}

export function staticSubmitSupportInquiry(
  payload: {
    name: string;
    email: string;
    phone?: string;
    topic: string;
    orderId?: string;
    message: string;
  },
  token?: string
): SupportInquiryRecord {
  const db = getStaticDb();
  const cleanName = (payload.name || '').trim();
  const cleanEmail = (payload.email || '').trim().toLowerCase();
  const cleanMessage = (payload.message || '').trim();
  if (!cleanName || !cleanEmail || !cleanEmail.includes('@') || cleanMessage.length < 5) {
    throw new ApiError(
      'Name, valid email address, and a brief inquiry message (5+ chars) are required.',
      400,
      false
    );
  }
  const actor = db.getUserByToken(token);
  const ticketRef = `KS-TKT-${Math.floor(10000 + Math.random() * 89999)}`;
  const inquiry: SupportInquiryRecord = {
    id: `inq-${Date.now().toString(36)}`,
    ticketRef,
    name: cleanName,
    email: cleanEmail,
    phone: payload.phone?.trim() || undefined,
    topic: payload.topic?.trim() || 'client-care',
    orderId: payload.orderId?.trim() || undefined,
    message: cleanMessage,
    userId: actor?.id,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  db.supportInquiries.unshift(inquiry);
  persistStaticDb(db);
  return inquiry;
}

export function staticSubscribeNewsletter(
  email: string,
  source = 'footer'
): {
  ok: boolean;
  alreadySubscribed: boolean;
  subscription: NewsletterSubscriptionRecord;
  message: string;
} {
  const db = getStaticDb();
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new ApiError('Please enter a valid email address.', 400, false);
  }
  const existing = db.newsletterSubscribers.find((s) => s.email === cleanEmail);
  if (existing) {
    return {
      ok: true,
      alreadySubscribed: true,
      subscription: existing,
      message: 'This email address is already subscribed to Kinto Studio updates.',
    };
  }
  const subscription: NewsletterSubscriptionRecord = {
    id: `sub-${Date.now().toString(36)}`,
    email: cleanEmail,
    source: source || 'footer',
    subscribedAt: new Date().toISOString(),
  };
  db.newsletterSubscribers.unshift(subscription);
  persistStaticDb(db);
  return {
    ok: true,
    alreadySubscribed: false,
    subscription,
    message: 'Subscribed to Kinto Studio product & release updates.',
  };
}

export function staticFetchAdminReadiness(token?: string): AdminSystemReadiness {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  return db.buildSystemReadiness(getGatewayConfigStatus);
}

export function staticFetchAuthSession(token?: string): {
  authenticated: boolean;
  user: AccountDirectoryEntry | null;
  policy: StorePolicyConfig;
} {
  const db = getStaticDb();
  const user = db.getUserByToken(token);
  if (!user || user.status === 'suspended') {
    return { authenticated: false, user: null, policy: db.storePolicy };
  }
  return { authenticated: true, user: db.toPublicAccount(user), policy: db.storePolicy };
}

export function staticLogout(token?: string): { ok: boolean } {
  const db = getStaticDb();
  if (token) {
    db.revokeSession(token);
    persistStaticDb(db);
  }
  return { ok: true };
}

export function staticFetchAccountCart(token?: string): CartItem[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  return db.getUserCart(user.id);
}

export function staticSyncAccountCart(items: CartItem[], token?: string): CartItem[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const saved = db.setUserCart(user.id, items);
  persistStaticDb(db);
  return saved;
}

export function staticMergeAccountCart(
  guestItems: CartItem[],
  token?: string
): { items: CartItem[]; report: CartMergeReport } {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const products = buildCartMergeProducts({
    cachedProducts: getCachedDummyJsonProductsSync(),
    authoritativeSkus: AUTHORITATIVE_CATALOG_SKUS,
    sellerInventory: db.sellerInventory,
    sellerCreatedProducts: db.sellerCreatedProducts,
  });
  const { mergedCart, report } = mergeGuestAndServerCarts({
    guestCart: guestItems,
    serverCart: db.getUserCart(user.id),
    products,
    productOverrides: db.productOverrides,
  });
  const saved = db.setUserCart(user.id, mergedCart);
  persistStaticDb(db);
  return { items: saved, report };
}

export function staticFetchAccountWishlist(token?: string): string[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  return db.getWishlist(user.id);
}

export function staticToggleAccountWishlist(
  productId: string,
  token?: string
): { wishlistIds: string[]; added: boolean } {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const result = db.toggleWishlistItem(user.id, productId);
  persistStaticDb(db);
  return result;
}

export function staticMergeAccountWishlist(productIds: string[], token?: string): string[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const result = db.mergeWishlistItems(user.id, productIds);
  persistStaticDb(db);
  return result;
}

export function staticFetchAccountAddresses(token?: string): Address[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  return db.getAddresses(user.id);
}

export function staticSaveAccountAddress(
  address: Omit<Address, 'id'> & { id?: string },
  token?: string
): Address[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const addresses = db.saveAddress(user.id, address);
  persistStaticDb(db);
  return addresses;
}

export function staticDeleteAccountAddress(id: string, token?: string): Address[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const addresses = db.deleteAddress(user.id, id);
  persistStaticDb(db);
  return addresses;
}

export function staticSetDefaultAccountAddress(id: string, token?: string): Address[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const addresses = db.setDefaultAddress(user.id, id);
  persistStaticDb(db);
  return addresses;
}

export function staticFetchAccountPaymentMethods(token?: string): PaymentMethodRecord[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  return db.getPaymentMethods(user.id);
}

export function staticSaveAccountPaymentMethod(
  method: Omit<PaymentMethodRecord, 'id'>,
  token?: string
): PaymentMethodRecord[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const paymentMethods = db.savePaymentMethod(user.id, method);
  persistStaticDb(db);
  return paymentMethods;
}

export function staticDeleteAccountPaymentMethod(
  id: string,
  token?: string
): PaymentMethodRecord[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const paymentMethods = db.deletePaymentMethod(user.id, id);
  persistStaticDb(db);
  return paymentMethods;
}

export function staticSetDefaultAccountPaymentMethod(
  id: string,
  token?: string
): PaymentMethodRecord[] {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const paymentMethods = db.setDefaultPaymentMethod(user.id, id);
  persistStaticDb(db);
  return paymentMethods;
}

export function staticClaimGuestOrders(
  orderIds?: string[],
  token?: string
): { claimedCount: number; orders: Order[] } {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const claimedCount = db.claimOrdersForUser(user, orderIds);
  persistStaticDb(db);
  return { claimedCount, orders: db.getUserOrders(user) };
}

export function staticFetchProductReviews(productId: string): ProductReview[] {
  const db = getStaticDb();
  return db.getProductReviews(productId);
}

export function staticSubmitProductReview(
  productId: string,
  payload: { rating: number; title: string; comment: string },
  token?: string
): { review: ProductReview; reviews: ProductReview[] } {
  const db = getStaticDb();
  const user = assertStaticAuth(db, token);
  const userOrders = db.getUserOrders(user);
  const hasDeliveredPurchase = userOrders.some(
    (order) =>
      order.currentStage === 'Delivered' &&
      order.items.some((item) => item.productId === productId)
  );
  if (db.storePolicy.reviewsRequireDeliveredPurchase && !hasDeliveredPurchase) {
    throw new ApiError(
      'Verified delivery is required to publish a review for this item.',
      403,
      false
    );
  }
  const review: ProductReview = {
    id: `rev-${Date.now().toString(36)}`,
    author: user.fullName,
    location: user.location || 'Dhaka, Bangladesh',
    rating: Math.round(payload.rating),
    title: payload.title.trim() || 'Verified Customer Review',
    comment: payload.comment.trim(),
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    verified: hasDeliveredPurchase || user.role !== 'customer',
  };
  const reviews = db.addProductReview(productId, review);
  persistStaticDb(db);
  return { review, reviews };
}

export function staticFetchAdminPolicies(token?: string): {
  policies: PolicyDocumentRecord[];
  policyFacts: PolicyFactsConfig;
  policyAcceptanceLedger: PolicyAcceptanceLedgerEntry[];
  legalReviewChecklist: LegalReviewChecklistItem[];
  policyChecklistSummary: PolicyChecklistSummary;
} {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  return {
    policies: db.policies,
    policyFacts: db.policyFacts,
    policyAcceptanceLedger: db.policyAcceptanceLedger.slice(0, 100),
    legalReviewChecklist: db.legalReviewChecklist,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticSaveAdminPolicyDraft(
  slug: string,
  payload: {
    title: string;
    shortTitle?: string;
    subtitle?: string;
    summary: string;
    effectiveDate?: string;
    sections: PolicySection[];
    changeNote?: string;
    materialChange?: boolean;
  },
  token?: string
): {
  policy: PolicyDocumentRecord;
  policyChecklistSummary: PolicyChecklistSummary;
} {
  const db = getStaticDb();
  const admin = assertStaticRole(db, token, ['admin']);
  const cleanSlug = slug.trim().toLowerCase();
  const targetIdx = db.policies.findIndex((p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug);
  if (targetIdx === -1) {
    throw new ApiError('Policy document not found.', 404, false);
  }
  const updated = savePolicyDraft(db.policies[targetIdx], {
    ...payload,
    updatedBy: admin.fullName,
  });
  db.policies[targetIdx] = updated;
  persistStaticDb(db);
  return {
    policy: updated,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticTransitionAdminPolicy(
  slug: string,
  payload: {
    action: 'submit_review' | 'schedule' | 'publish' | 'archive';
    scheduledFor?: string;
    forceAllowPlaceholders?: boolean;
  },
  token?: string
): {
  policy: PolicyDocumentRecord;
  newVersionPublished?: PolicyVersionRecord;
  policyChecklistSummary: PolicyChecklistSummary;
} {
  const db = getStaticDb();
  const admin = assertStaticRole(db, token, ['admin']);
  const cleanSlug = slug.trim().toLowerCase();
  const targetIdx = db.policies.findIndex((p) => p.slug.toLowerCase() === cleanSlug || p.id === cleanSlug);
  if (targetIdx === -1) {
    throw new ApiError('Policy document not found.', 404, false);
  }
  const { updated, newVersionPublished } = transitionPolicyStatus(
    db.policies[targetIdx],
    payload.action,
    admin.fullName,
    {
      scheduledFor: payload.scheduledFor,
      forceAllowPlaceholders: payload.forceAllowPlaceholders,
    }
  );
  db.policies[targetIdx] = updated;
  if (newVersionPublished && newVersionPublished.materialChange) {
    db.notifications.unshift({
      id: `notif-pol-${Date.now().toString(36)}`,
      title: `Policy Update Notice · ${updated.shortTitle} (${updated.currentVersion})`,
      message: `Material update to ${updated.title} effective ${updated.effectiveDate}. Review updated terms in Policies & Legal.`,
      category: 'system',
      createdAt: 'Just now',
      read: false,
      roleScope: 'all',
    });
  }
  persistStaticDb(db);
  return {
    policy: updated,
    newVersionPublished,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticUpdateAdminPolicyFacts(
  updates: Partial<PolicyFactsConfig>,
  token?: string
): {
  policyFacts: PolicyFactsConfig;
  policyChecklistSummary: PolicyChecklistSummary;
} {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  db.policyFacts = {
    ...db.policyFacts,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persistStaticDb(db);
  return {
    policyFacts: db.policyFacts,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticUpdateAdminLegalChecklist(
  id: string,
  updates: Partial<LegalReviewChecklistItem>,
  token?: string
): {
  item: LegalReviewChecklistItem;
  legalReviewChecklist: LegalReviewChecklistItem[];
  policyChecklistSummary: PolicyChecklistSummary;
} {
  const db = getStaticDb();
  assertStaticRole(db, token, ['admin']);
  const item = db.legalReviewChecklist.find((c) => c.id === id);
  if (!item) {
    throw new ApiError('Checklist entry not found.', 404, false);
  }
  Object.assign(item, updates);
  persistStaticDb(db);
  return {
    item,
    legalReviewChecklist: db.legalReviewChecklist,
    policyChecklistSummary: buildPolicyChecklistSummary(
      db.policies,
      db.policyFacts,
      db.legalReviewChecklist
    ),
  };
}

export function staticNotifyMaterialPolicyChange(
  payload: { title: string; summary: string; policyIds?: string[] },
  token?: string
): { ok: boolean; entry: PolicyAcceptanceLedgerEntry } {
  const db = getStaticDb();
  const admin = assertStaticRole(db, token, ['admin']);
  const ids = Array.isArray(payload.policyIds) && payload.policyIds.length > 0 ? payload.policyIds : ['terms', 'privacy-policy'];
  const acceptance = buildValidatedAcceptanceRecord({
    policies: db.policies,
    requestedPolicyIds: ids,
  });
  const entry = db.recordPolicyAcceptance('material_notice', `broadcast:${admin.id}`, acceptance);
  db.notifications.unshift({
    id: `notif-mat-${Date.now().toString(36)}`,
    title: payload.title.trim(),
    message: payload.summary.trim(),
    category: 'system',
    createdAt: 'Just now',
    read: false,
    roleScope: 'all',
  });
  persistStaticDb(db);
  return { ok: true, entry };
}



