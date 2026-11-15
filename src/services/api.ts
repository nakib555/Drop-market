import type {
  AccountDirectoryEntry,
  AdminDashboardData,
  AdminSystemReadiness,
  ApiSellerProductRecord,
  AvailabilityStatus,
  CategoryFacetConfig,
  CategoryNode,
  CheckoutQuoteResponse,
  CurrencyCode,
  CurrencyRateState,
  DeliveryMethodId,
  DynamicCategoryRecord,
  LanguageCode,
  LegalAcceptanceRecord,
  ManagedPromoRecord,
  NewsletterSubscriptionRecord,
  Order,
  OrderStage,
  PasswordResetRequestResult,
  PaymentMethodId,
  PaymentSession,
  PlatformSettingsState,
  Product,
  ProductOverride,
  SellerApplicationRecord,
  SellerDashboardData,
  SellerStoreSettings,
  ShippingQuoteResponse,
  ShippingRuleConfig,
  ShippingZoneId,
  ShippingZoneRule,
  StoreNotification,
  SupportInquiryRecord,
  UserRole,
} from '../types/commerce';
import type { BangladeshDivisionEntry } from '../../server/shared/marketplaceSchema';
import { ApiError } from './apiError';
import { readStorage, writeStorage } from './storage';

export { ApiError };

const TOKEN_STORAGE_KEY = 'kinto-api-token';
const STATIC_FALLBACK_STATUSES = new Set([404, 405, 501, 502, 503]);

export function getStoredToken(): string {
  return readStorage<string>(TOKEN_STORAGE_KEY, '');
}

export function setStoredToken(token: string): void {
  writeStorage<string>(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  writeStorage<string>(TOKEN_STORAGE_KEY, '');
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
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
}): Promise<{ token: string; user: AccountDirectoryEntry }> {
  const res = await withStaticFallback(
    () =>
      requestJson<{ token: string; user: AccountDirectoryEntry }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticLogin(payload)
  );
  setStoredToken(res.token);
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
}): Promise<{ token: string; user: AccountDirectoryEntry }> {
  const res = await withStaticFallback(
    () =>
      requestJson<{ token: string; user: AccountDirectoryEntry }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    (mod) => mod.staticRegister(payload)
  );
  setStoredToken(res.token);
  return res;
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
}> {
  return withStaticFallback(
    () => requestJson('/api/storefront/state'),
    (mod) => mod.staticFetchStorefrontSync()
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

