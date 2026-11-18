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
import type { BangladeshDivisionEntry } from '../../server/shared/marketplaceSchema';
import { ApiError } from './apiError';

export { ApiError };

const LEGACY_TOKEN_STORAGE_KEY = 'kinto-api-token';
const STATIC_FALLBACK_STATUSES = new Set([404, 405, 501, 502, 503]);

// In-memory only token used strictly when running offline static fallback mode (never written to localStorage)
let memoryFallbackToken = '';

if (typeof window !== 'undefined' && window.localStorage) {
  try {
    if (window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) !== null) {
      window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export function getStoredToken(): string {
  return memoryFallbackToken;
}

export function setStoredToken(token: string): void {
  memoryFallbackToken = token;
}

export function clearStoredToken(): void {
  memoryFallbackToken = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
  }
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Kinto-Request': '1',
    ...(options.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : 'Unable to reach marketplace server.',
      0,
      true
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (!res.ok) {
    const errBody = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};
    const message =
      (errBody as { error?: string }).error || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, STATIC_FALLBACK_STATUSES.has(res.status));
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError('API endpoint returned non-JSON response', res.status, true);
    }
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data !== 'object') {
    throw new ApiError('Invalid JSON payload from API', res.status, true);
  }
  return data as T;
}

async function withStaticFallback<T>(
  apiCall: () => Promise<T>,
  fallbackCall: (mod: typeof import('./staticFallbackApi')) => Promise<T> | T
): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    if (err instanceof ApiError && err.isStaticFallbackEligible) {
      const mod = await import('./staticFallbackApi');
      return await fallbackCall(mod);
    }
    throw err;
  }
}

export async function fetchAuthAccounts(): Promise<AccountDirectoryEntry[]> {
  return withStaticFallback(
    async () => {
      const data = await requestJson<{ accounts?: AccountDirectoryEntry[] }>('/api/auth/accounts');
      if (!Array.isArray(data.accounts)) {
        throw new ApiError('Invalid accounts payload', 502, true);
      }
      return data.accounts;
    },
    (mod) => mod.staticFetchAuthAccounts(getStoredToken())
  );
}

export async function loginWithApi(payload: {
  email: string;
  password: string;
}): Promise<{ token?: string; user: AccountDirectoryEntry }> {
  let usedFallback = false;
  const res = await withStaticFallback(
    () =>
      requestJson<{ token?: string; user: AccountDirectoryEntry }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => {
      usedFallback = true;
      return mod.staticLogin(payload);
    }
  );
  if (usedFallback && res.token) {
    setStoredToken(res.token);
  } else {
    clearStoredToken();
  }
  return res;
}

export async function registerWithApi(payload: {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'seller';
  studioName?: string;
  acceptedPolicies: LegalAcceptanceRecord;
}): Promise<{ token?: string; user: AccountDirectoryEntry }> {
  let usedFallback = false;
  const res = await withStaticFallback(
    () =>
      requestJson<{ token?: string; user: AccountDirectoryEntry }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => {
      usedFallback = true;
      return mod.staticRegister(payload);
    }
  );
  if (usedFallback && res.token) {
    setStoredToken(res.token);
  } else {
    clearStoredToken();
  }
  return res;
}

export async function fetchAuthSession(): Promise<{
  authenticated: boolean;
  user: AccountDirectoryEntry | null;
  policy?: StorePolicyConfig;
}> {
  return withStaticFallback(
    () =>
      requestJson<{
        authenticated: boolean;
        user: AccountDirectoryEntry | null;
        policy?: StorePolicyConfig;
      }>('/api/auth/session'),
    (mod) => mod.staticFetchAuthSession(getStoredToken())
  );
}

export async function logoutWithApi(): Promise<void> {
  clearStoredToken();
  try {
    await withStaticFallback(
      () =>
        requestJson<{ ok: boolean }>('/api/auth/logout', {
          method: 'POST',
        }),
      (mod) => mod.staticLogout(getStoredToken())
    );
  } catch {
    // Best-effort cookie clearing
  }
}

export async function fetchCurrentUser(): Promise<AccountDirectoryEntry> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ user?: AccountDirectoryEntry }>('/api/auth/me');
      if (!res.user || typeof res.user !== 'object') {
        throw new ApiError('Invalid current user payload', 502, true);
      }
      return res.user;
    },
    (mod) => mod.staticFetchCurrentUser(getStoredToken())
  );
}

export async function updateProfileApi(updates: {
  fullName?: string;
  email?: string;
  phone?: string;
  studioName?: string;
}): Promise<AccountDirectoryEntry> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ user: AccountDirectoryEntry }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.user;
    },
    (mod) => mod.staticUpdateProfile(getStoredToken(), updates)
  );
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  return withStaticFallback(
    () =>
      requestJson<{ ok: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    (mod) => mod.staticChangePassword(getStoredToken(), currentPassword, newPassword)
  );
}

export async function fetchCatalogProductsApi(): Promise<Product[]> {
  return withStaticFallback(
    async () => {
      const data = await requestJson<{ products?: Product[] }>('/api/catalog');
      if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new ApiError('Invalid catalog payload', 502, true);
      }
      return data.products;
    },
    (mod) => mod.staticFetchCatalogProducts()
  );
}

export async function fetchStorefrontSync(): Promise<{
  productOverrides: Record<string, ProductOverride>;
  sellerProducts: ApiSellerProductRecord[];
  categoryTree: CategoryNode[];
  customCategories: DynamicCategoryRecord[];
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
  promotions?: ManagedPromoRecord[];
  publishedPolicies?: PolicyDocumentRecord[];
  policyFactsPublic?: PolicyFactsPublicSummary;
  cookieInventory?: CookieInventoryItem[];
  enabledPaymentMethods?: import('../types/commerce').PaymentMethodId[];
}> {
  return withStaticFallback(
    () => requestJson('/api/storefront/state'),
    (mod) => mod.staticFetchStorefrontSync()
  );
}

export async function fetchPublicPoliciesApi(): Promise<{
  policies: PolicyDocumentRecord[];
  policyFactsPublic: PolicyFactsPublicSummary;
  cookieInventory: CookieInventoryItem[];
}> {
  return withStaticFallback(
    () => requestJson('/api/policies'),
    (mod) => mod.staticFetchPublicPolicies()
  );
}

export async function fetchPolicyBySlugApi(
  slug: string,
  version?: string
): Promise<{
  policy: PolicyDocumentRecord;
  historicalVersionRequested: string | null;
  isHistoricalSnapshot: boolean;
  policyFactsPublic: PolicyFactsPublicSummary;
}> {
  const qs = version ? `?version=${encodeURIComponent(version)}` : '';
  return withStaticFallback(
    () => requestJson(`/api/policies/${encodeURIComponent(slug)}${qs}`),
    (mod) => mod.staticFetchPolicyBySlug(slug, version)
  );
}

export async function fetchCurrencyRatesApi(): Promise<CurrencyRateState> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ currencyConfig: CurrencyRateState }>('/api/currency/rates');
      return res.currencyConfig;
    },
    (mod) => mod.staticFetchCurrencyRates()
  );
}

export async function updateAdminCurrencyApi(updates: {
  bdtRate?: number;
  defaultCurrency?: CurrencyCode;
  source?: string;
  updateFrequencyMinutes?: number;
}): Promise<CurrencyRateState> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ currencyConfig: CurrencyRateState }>('/api/admin/currency', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.currencyConfig;
    },
    (mod) => mod.staticUpdateAdminCurrency(updates, getStoredToken())
  );
}

export async function fetchCategoriesTreeApi(): Promise<CategoryNode[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ categories?: CategoryNode[] }>('/api/categories');
      if (!Array.isArray(res.categories)) {
        throw new ApiError('Invalid categories payload', 502, true);
      }
      return res.categories;
    },
    (mod) => mod.staticFetchCategoriesTree()
  );
}

export async function fetchShippingLocationsApi(): Promise<{
  divisions: BangladeshDivisionEntry[];
  restrictedAreaKeywords: string[];
}> {
  return withStaticFallback(
    () => requestJson('/api/shipping/locations'),
    (mod) => mod.staticFetchShippingLocations()
  );
}

export async function quoteShippingApi(payload: {
  items: Array<{ productId: string; quantity: number }>;
  address: { country?: string; state?: string; city?: string; upazila?: string; area?: string };
  promoCode?: string;
  currency?: CurrencyCode;
}): Promise<ShippingQuoteResponse> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ quote: ShippingQuoteResponse }>('/api/shipping/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.quote;
    },
    (mod) => mod.staticQuoteShipping(payload)
  );
}

export async function updateAdminShippingRulesApi(payload: {
  zoneId?: ShippingZoneId;
  updates?: Partial<ShippingZoneRule>;
  restrictedAreaKeywords?: string[];
}): Promise<ShippingRuleConfig> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ shippingConfig: ShippingRuleConfig }>(
        '/api/admin/shipping-rules',
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );
      return res.shippingConfig;
    },
    (mod) => mod.staticUpdateAdminShippingRules(payload, getStoredToken())
  );
}

export async function quoteCheckoutApi(payload: {
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
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ quote: CheckoutQuoteResponse }>('/api/checkout/quote', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.quote;
    },
    (mod) => mod.staticQuoteCheckout(payload)
  );
}

export async function initiatePaymentApi(payload: {
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
  return withStaticFallback(
    () =>
      requestJson('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticInitiatePayment(payload)
  );
}

export async function verifyPaymentApi(payload: {
  sessionId: string;
  outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed';
  walletNumber?: string;
  failureReason?: string;
}): Promise<{ session: PaymentSession; order?: Order }> {
  return withStaticFallback(
    () =>
      requestJson('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticVerifyPayment(payload)
  );
}

export async function fetchNotificationsApi(_role?: UserRole): Promise<StoreNotification[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ notifications?: StoreNotification[] }>('/api/notifications');
      if (!Array.isArray(res.notifications)) {
        throw new ApiError('Invalid notifications payload', 502, true);
      }
      return res.notifications;
    },
    (mod) => mod.staticFetchNotifications(getStoredToken())
  );
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await withStaticFallback(
    () => requestJson(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
    (mod) => mod.staticMarkNotificationRead(id)
  );
}

export async function fetchOrdersApi(): Promise<Order[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ orders?: Order[] }>('/api/orders');
      if (!Array.isArray(res.orders)) {
        throw new ApiError('Invalid orders payload', 502, true);
      }
      return res.orders;
    },
    (mod) => mod.staticFetchOrders(getStoredToken())
  );
}

export async function trackOrderApi(id: string, contact?: string): Promise<Order> {
  return withStaticFallback(
    async () => {
      const params = new URLSearchParams({ id });
      if (contact?.trim()) params.set('contact', contact.trim());
      const res = await requestJson<{ order: Order }>(`/api/orders/track?${params.toString()}`);
      return res.order;
    },
    (mod) => mod.staticTrackOrder(id, contact, getStoredToken())
  );
}


export async function updateOrderStatusApi(
  orderId: string,
  stage: OrderStage,
  note?: string
): Promise<Order> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ order: Order }>(
        `/api/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ stage, note }),
        }
      );
      return res.order;
    },
    (mod) => mod.staticUpdateOrderStatus(orderId, stage, note, getStoredToken())
  );
}

export async function performOrderCustomerActionApi(
  orderId: string,
  action: 'cancel' | 'return',
  reason?: string
): Promise<Order> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ order: Order }>(
        `/api/orders/${encodeURIComponent(orderId)}/action`,
        {
          method: 'POST',
          body: JSON.stringify({ action, reason }),
        }
      );
      return res.order;
    },
    (mod) => mod.staticPerformOrderCustomerAction(orderId, action, reason, getStoredToken())
  );
}

export async function fetchSellerDashboardApi(): Promise<SellerDashboardData> {
  return withStaticFallback(
    () => requestJson<SellerDashboardData>('/api/seller/dashboard'),
    (mod) => mod.staticFetchSellerDashboard(getStoredToken())
  );
}

export async function updateSellerSettingsApi(
  updates: Partial<SellerStoreSettings>
): Promise<SellerStoreSettings> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ storeSettings: SellerStoreSettings }>(
        '/api/seller/settings',
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );
      return res.storeSettings;
    },
    (mod) => mod.staticUpdateSellerSettings(getStoredToken(), updates)
  );
}

export async function resolveSellerReturnApi(
  orderId: string,
  decision: 'approve_refund' | 'restore_delivered',
  note?: string
): Promise<Order> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ order: Order }>(
        `/api/seller/returns/${encodeURIComponent(orderId)}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({ decision, note }),
        }
      );
      return res.order;
    },
    (mod) => mod.staticResolveSellerReturn(getStoredToken(), orderId, decision, note)
  );
}

export async function createSellerProductApi(payload: {
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
}): Promise<ApiSellerProductRecord> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ product: ApiSellerProductRecord }>('/api/seller/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.product;
    },
    (mod) => mod.staticCreateSellerProduct(getStoredToken(), payload)
  );
}

export async function updateSellerProductApi(
  id: string,
  updates: { price?: number; stockCount?: number; availability?: AvailabilityStatus }
): Promise<ProductOverride> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ override: ProductOverride }>(
        `/api/seller/products/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );
      return res.override;
    },
    (mod) => mod.staticUpdateSellerProduct(id, updates, getStoredToken())
  );
}

export async function fetchAdminDashboardApi(): Promise<AdminDashboardData> {
  return withStaticFallback(
    () => requestJson<AdminDashboardData>('/api/admin/dashboard'),
    (mod) => mod.staticFetchAdminDashboard(getStoredToken())
  );
}

export async function updateAdminUserApi(
  id: string,
  updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' }
): Promise<AccountDirectoryEntry> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ user: AccountDirectoryEntry }>(
        `/api/admin/users/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );
      return res.user;
    },
    (mod) => mod.staticUpdateAdminUser(id, updates, getStoredToken())
  );
}

export async function updateSellerStatusApi(
  id: string,
  status: 'approved' | 'pending' | 'suspended'
): Promise<SellerApplicationRecord> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ application: SellerApplicationRecord }>(
        `/api/admin/sellers/${encodeURIComponent(id)}/approve`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      return res.application;
    },
    (mod) => mod.staticUpdateSellerStatus(id, status, getStoredToken())
  );
}

export async function updateAdminPromotionsApi(payload: {
  code: string;
  active?: boolean;
  value?: number;
}): Promise<ManagedPromoRecord[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ promotions: ManagedPromoRecord[] }>('/api/admin/promotions', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      return res.promotions;
    },
    (mod) => mod.staticUpdateAdminPromotions(payload, getStoredToken())
  );
}

export async function processAdminRefundApi(
  orderId: string,
  action: 'approve_refund' | 'decline_return',
  note?: string
): Promise<Order> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ order: Order }>(
        `/api/admin/refunds/${encodeURIComponent(orderId)}`,
        {
          method: 'POST',
          body: JSON.stringify({ action, note }),
        }
      );
      return res.order;
    },
    (mod) => mod.staticProcessAdminRefund(orderId, action, note, getStoredToken())
  );
}

export async function updateAdminPlatformSettingsApi(
  updates: Partial<{
    storefrontName: string;
    supportEmail: string;
    defaultLanguage: LanguageCode;
    maintenanceNoticeEnabled: boolean;
  }>
): Promise<PlatformSettingsState> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ platformSettings: PlatformSettingsState }>(
        '/api/admin/settings',
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );
      return res.platformSettings;
    },
    (mod) => mod.staticUpdateAdminPlatformSettings(updates, getStoredToken())
  );
}

export async function createCategoryNodeApi(payload: {
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
}): Promise<{ category: CategoryNode; categoryTree: CategoryNode[] }> {
  return withStaticFallback(
    () =>
      requestJson('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticCreateCategoryNode(payload, getStoredToken())
  );
}

export async function updateCategoryNodeApi(
  id: string,
  updates: Partial<CategoryNode>
): Promise<{ category: CategoryNode; categoryTree: CategoryNode[] }> {
  return withStaticFallback(
    () =>
      requestJson(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    (mod) => mod.staticUpdateCategoryNode(id, updates, getStoredToken())
  );
}

export async function deleteCategoryNodeApi(
  idOrSlug: string
): Promise<{ ok: boolean; removedCount: number; categoryTree: CategoryNode[] }> {
  return withStaticFallback(
    () =>
      requestJson(`/api/admin/categories/${encodeURIComponent(idOrSlug)}`, {
        method: 'DELETE',
      }),
    (mod) => mod.staticDeleteCategoryNode(idOrSlug, getStoredToken())
  );
}

export async function requestPasswordResetApi(
  email: string
): Promise<PasswordResetRequestResult> {
  return withStaticFallback(
    () =>
      requestJson<PasswordResetRequestResult>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    (mod) => mod.staticRequestPasswordReset(email)
  );
}

export async function confirmPasswordResetApi(payload: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  return withStaticFallback(
    () =>
      requestJson<{ ok: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticConfirmPasswordReset(payload)
  );
}

export async function submitSupportInquiryApi(payload: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  orderId?: string;
  message: string;
}): Promise<SupportInquiryRecord> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ inquiry: SupportInquiryRecord }>('/api/support/inquiries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.inquiry;
    },
    (mod) => mod.staticSubmitSupportInquiry(payload, getStoredToken())
  );
}

export async function subscribeNewsletterApi(
  email: string,
  source = 'footer'
): Promise<{
  ok: boolean;
  alreadySubscribed: boolean;
  subscription: NewsletterSubscriptionRecord;
  message: string;
}> {
  return withStaticFallback(
    () =>
      requestJson('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, source }),
      }),
    (mod) => mod.staticSubscribeNewsletter(email, source)
  );
}

export async function fetchAdminReadinessApi(): Promise<AdminSystemReadiness> {
  return withStaticFallback(
    () => requestJson<AdminSystemReadiness>('/api/admin/readiness'),
    (mod) => mod.staticFetchAdminReadiness(getStoredToken())
  );
}

export async function fetchAccountCartApi(): Promise<CartItem[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ items?: CartItem[] }>('/api/account/cart');
      return Array.isArray(res.items) ? res.items : [];
    },
    (mod) => mod.staticFetchAccountCart(getStoredToken())
  );
}

export async function syncAccountCartApi(items: CartItem[]): Promise<CartItem[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ items: CartItem[] }>('/api/account/cart', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      });
      return Array.isArray(res.items) ? res.items : [];
    },
    (mod) => mod.staticSyncAccountCart(items, getStoredToken())
  );
}

export async function mergeAccountCartApi(
  guestItems: CartItem[]
): Promise<{ items: CartItem[]; report: CartMergeReport }> {
  return withStaticFallback(
    () =>
      requestJson<{ items: CartItem[]; report: CartMergeReport }>('/api/account/cart/merge', {
        method: 'POST',
        body: JSON.stringify({ guestItems }),
      }),
    (mod) => mod.staticMergeAccountCart(guestItems, getStoredToken())
  );
}

export async function fetchAccountWishlistApi(): Promise<string[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ wishlistIds?: string[] }>('/api/account/wishlist');
      return Array.isArray(res.wishlistIds) ? res.wishlistIds : [];
    },
    (mod) => mod.staticFetchAccountWishlist(getStoredToken())
  );
}

export async function toggleAccountWishlistApi(
  productId: string
): Promise<{ wishlistIds: string[]; added: boolean }> {
  return withStaticFallback(
    () =>
      requestJson<{ wishlistIds: string[]; added: boolean }>('/api/account/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
    (mod) => mod.staticToggleAccountWishlist(productId, getStoredToken())
  );
}

export async function mergeAccountWishlistApi(productIds: string[]): Promise<string[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ wishlistIds?: string[] }>('/api/account/wishlist/merge', {
        method: 'POST',
        body: JSON.stringify({ productIds }),
      });
      return Array.isArray(res.wishlistIds) ? res.wishlistIds : [];
    },
    (mod) => mod.staticMergeAccountWishlist(productIds, getStoredToken())
  );
}

export async function fetchAccountAddressesApi(): Promise<Address[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ addresses?: Address[] }>('/api/account/addresses');
      return Array.isArray(res.addresses) ? res.addresses : [];
    },
    (mod) => mod.staticFetchAccountAddresses(getStoredToken())
  );
}

export async function saveAccountAddressApi(
  address: Omit<Address, 'id'> & { id?: string }
): Promise<Address[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ addresses: Address[] }>('/api/account/addresses', {
        method: 'POST',
        body: JSON.stringify(address),
      });
      return res.addresses;
    },
    (mod) => mod.staticSaveAccountAddress(address, getStoredToken())
  );
}

export async function deleteAccountAddressApi(id: string): Promise<Address[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ addresses: Address[] }>(
        `/api/account/addresses/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      return res.addresses;
    },
    (mod) => mod.staticDeleteAccountAddress(id, getStoredToken())
  );
}

export async function setDefaultAccountAddressApi(id: string): Promise<Address[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ addresses: Address[] }>(
        `/api/account/addresses/${encodeURIComponent(id)}/default`,
        { method: 'PATCH' }
      );
      return res.addresses;
    },
    (mod) => mod.staticSetDefaultAccountAddress(id, getStoredToken())
  );
}

export async function fetchAccountPaymentMethodsApi(): Promise<PaymentMethodRecord[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ paymentMethods?: PaymentMethodRecord[] }>(
        '/api/account/payment-methods'
      );
      return Array.isArray(res.paymentMethods) ? res.paymentMethods : [];
    },
    (mod) => mod.staticFetchAccountPaymentMethods(getStoredToken())
  );
}

export async function saveAccountPaymentMethodApi(
  method: Omit<PaymentMethodRecord, 'id'>
): Promise<PaymentMethodRecord[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ paymentMethods: PaymentMethodRecord[] }>(
        '/api/account/payment-methods',
        {
          method: 'POST',
          body: JSON.stringify(method),
        }
      );
      return res.paymentMethods;
    },
    (mod) => mod.staticSaveAccountPaymentMethod(method, getStoredToken())
  );
}

export async function deleteAccountPaymentMethodApi(id: string): Promise<PaymentMethodRecord[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ paymentMethods: PaymentMethodRecord[] }>(
        `/api/account/payment-methods/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      return res.paymentMethods;
    },
    (mod) => mod.staticDeleteAccountPaymentMethod(id, getStoredToken())
  );
}

export async function setDefaultAccountPaymentMethodApi(id: string): Promise<PaymentMethodRecord[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ paymentMethods: PaymentMethodRecord[] }>(
        `/api/account/payment-methods/${encodeURIComponent(id)}/default`,
        { method: 'PATCH' }
      );
      return res.paymentMethods;
    },
    (mod) => mod.staticSetDefaultAccountPaymentMethod(id, getStoredToken())
  );
}

export async function claimGuestOrdersApi(
  orderIds?: string[]
): Promise<{ claimedCount: number; orders: Order[] }> {
  return withStaticFallback(
    () =>
      requestJson<{ claimedCount: number; orders: Order[] }>('/api/account/claim-orders', {
        method: 'POST',
        body: JSON.stringify({ orderIds }),
      }),
    (mod) => mod.staticClaimGuestOrders(orderIds, getStoredToken())
  );
}

export async function fetchProductReviewsApi(productId: string): Promise<ProductReview[]> {
  return withStaticFallback(
    async () => {
      const res = await requestJson<{ reviews?: ProductReview[] }>(
        `/api/products/${encodeURIComponent(productId)}/reviews`
      );
      return Array.isArray(res.reviews) ? res.reviews : [];
    },
    (mod) => mod.staticFetchProductReviews(productId)
  );
}

export async function submitProductReviewApi(
  productId: string,
  payload: { rating: number; title: string; comment: string }
): Promise<{ review: ProductReview; reviews: ProductReview[] }> {
  return withStaticFallback(
    () =>
      requestJson<{ review: ProductReview; reviews: ProductReview[] }>(
        `/api/products/${encodeURIComponent(productId)}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),
    (mod) => mod.staticSubmitProductReview(productId, payload, getStoredToken())
  );
}

export async function fetchAdminPoliciesApi(): Promise<{
  policies: PolicyDocumentRecord[];
  policyFacts: PolicyFactsConfig;
  policyAcceptanceLedger: PolicyAcceptanceLedgerEntry[];
  legalReviewChecklist: LegalReviewChecklistItem[];
  policyChecklistSummary: PolicyChecklistSummary;
}> {
  return withStaticFallback(
    () => requestJson('/api/admin/policies'),
    (mod) => mod.staticFetchAdminPolicies(getStoredToken())
  );
}

export async function saveAdminPolicyDraftApi(
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
  }
): Promise<{
  policy: PolicyDocumentRecord;
  policyChecklistSummary: PolicyChecklistSummary;
}> {
  return withStaticFallback(
    () =>
      requestJson(`/api/admin/policies/${encodeURIComponent(slug)}/draft`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticSaveAdminPolicyDraft(slug, payload, getStoredToken())
  );
}

export async function transitionAdminPolicyApi(
  slug: string,
  payload: {
    action: 'submit_review' | 'schedule' | 'publish' | 'archive';
    scheduledFor?: string;
    forceAllowPlaceholders?: boolean;
  }
): Promise<{
  policy: PolicyDocumentRecord;
  newVersionPublished?: PolicyVersionRecord;
  policyChecklistSummary: PolicyChecklistSummary;
}> {
  return withStaticFallback(
    () =>
      requestJson(`/api/admin/policies/${encodeURIComponent(slug)}/transition`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticTransitionAdminPolicy(slug, payload, getStoredToken())
  );
}

export async function updateAdminPolicyFactsApi(
  updates: Partial<PolicyFactsConfig>
): Promise<{
  policyFacts: PolicyFactsConfig;
  policyChecklistSummary: PolicyChecklistSummary;
}> {
  return withStaticFallback(
    () =>
      requestJson('/api/admin/policies/facts', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    (mod) => mod.staticUpdateAdminPolicyFacts(updates, getStoredToken())
  );
}

export async function updateAdminLegalChecklistApi(
  id: string,
  updates: Partial<LegalReviewChecklistItem>
): Promise<{
  item: LegalReviewChecklistItem;
  legalReviewChecklist: LegalReviewChecklistItem[];
  policyChecklistSummary: PolicyChecklistSummary;
}> {
  return withStaticFallback(
    () =>
      requestJson(`/api/admin/policies/checklist/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    (mod) => mod.staticUpdateAdminLegalChecklist(id, updates, getStoredToken())
  );
}

export async function notifyMaterialPolicyChangeApi(payload: {
  title: string;
  summary: string;
  policyIds?: string[];
}): Promise<{ ok: boolean; entry: PolicyAcceptanceLedgerEntry }> {
  return withStaticFallback(
    () =>
      requestJson('/api/admin/policies/notify-material-change', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticNotifyMaterialPolicyChange(payload, getStoredToken())
  );
}



