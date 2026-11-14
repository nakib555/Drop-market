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
  Order,
  OrderStage,
  PaymentMethodId,
  PaymentSession,
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
import type { BangladeshDivisionEntry } from '../../server/shared/marketplaceSchema';
import { readStorage, writeStorage } from './storage';

const TOKEN_STORAGE_KEY = 'kinto-api-token';

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

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchAuthAccounts(): Promise<AccountDirectoryEntry[]> {
  const data = await requestJson<{ accounts: AccountDirectoryEntry[] }>('/api/auth/accounts');
  return data.accounts;
}

export async function loginWithApi(payload: {
  email?: string;
  password?: string;
  accountId?: string;
}): Promise<{ token: string; user: AccountDirectoryEntry }> {
  const res = await requestJson<{ token: string; user: AccountDirectoryEntry }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
}): Promise<{ token: string; user: AccountDirectoryEntry }> {
  const res = await requestJson<{ token: string; user: AccountDirectoryEntry }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setStoredToken(res.token);
  return res;
}

export async function fetchCurrentUser(): Promise<AccountDirectoryEntry> {
  const res = await requestJson<{ user: AccountDirectoryEntry }>('/api/auth/me');
  return res.user;
}

export async function updateProfileApi(updates: {
  fullName?: string;
  email?: string;
  phone?: string;
  studioName?: string;
}): Promise<AccountDirectoryEntry> {
  const res = await requestJson<{ user: AccountDirectoryEntry }>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return res.user;
}

export async function fetchStorefrontSync(): Promise<{
  productOverrides: Record<string, ProductOverride>;
  sellerProducts: ApiSellerProductRecord[];
  categoryTree: CategoryNode[];
  customCategories: DynamicCategoryRecord[];
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
}> {
  return requestJson('/api/storefront/state');
}

export async function fetchCurrencyRatesApi(): Promise<CurrencyRateState> {
  const res = await requestJson<{ currencyConfig: CurrencyRateState }>('/api/currency/rates');
  return res.currencyConfig;
}

export async function updateAdminCurrencyApi(updates: {
  bdtRate?: number;
  defaultCurrency?: CurrencyCode;
  source?: string;
  updateFrequencyMinutes?: number;
}): Promise<CurrencyRateState> {
  const res = await requestJson<{ currencyConfig: CurrencyRateState }>('/api/admin/currency', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return res.currencyConfig;
}

export async function fetchCategoriesTreeApi(): Promise<CategoryNode[]> {
  const res = await requestJson<{ categories: CategoryNode[] }>('/api/categories');
  return res.categories;
}

export async function fetchShippingLocationsApi(): Promise<{
  divisions: BangladeshDivisionEntry[];
  restrictedAreaKeywords: string[];
}> {
  return requestJson('/api/shipping/locations');
}

export async function quoteShippingApi(payload: {
  items: Array<{ productId: string; quantity: number }>;
  address: { country?: string; state?: string; city?: string; upazila?: string; area?: string };
  promoCode?: string;
  currency?: CurrencyCode;
}): Promise<ShippingQuoteResponse> {
  const res = await requestJson<{ quote: ShippingQuoteResponse }>('/api/shipping/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.quote;
}

export async function updateAdminShippingRulesApi(payload: {
  zoneId?: ShippingZoneId;
  updates?: Partial<ShippingZoneRule>;
  restrictedAreaKeywords?: string[];
}): Promise<ShippingRuleConfig> {
  const res = await requestJson<{ shippingConfig: ShippingRuleConfig }>(
    '/api/admin/shipping-rules',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return res.shippingConfig;
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
  const res = await requestJson<{ quote: CheckoutQuoteResponse }>('/api/checkout/quote', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.quote;
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
}): Promise<{ session: PaymentSession; quote: CheckoutQuoteResponse }> {
  return requestJson('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyPaymentApi(payload: {
  sessionId: string;
  outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed';
  walletNumber?: string;
  failureReason?: string;
}): Promise<{ session: PaymentSession; order?: Order }> {
  return requestJson('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchNotificationsApi(role: UserRole): Promise<StoreNotification[]> {
  const res = await requestJson<{ notifications: StoreNotification[] }>(
    `/api/notifications?role=${encodeURIComponent(role)}`
  );
  return res.notifications;
}

export async function markNotificationReadApi(id: string): Promise<void> {
  await requestJson(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
}

export async function fetchOrdersApi(): Promise<Order[]> {
  const res = await requestJson<{ orders: Order[] }>('/api/orders');
  return res.orders;
}

export async function createOrderApi(order: Order): Promise<Order> {
  const res = await requestJson<{ order: Order }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
  return res.order;
}

export async function updateOrderStatusApi(
  orderId: string,
  stage: OrderStage,
  note?: string
): Promise<Order> {
  const res = await requestJson<{ order: Order }>(
    `/api/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ stage, note }),
    }
  );
  return res.order;
}

export async function performOrderCustomerActionApi(
  orderId: string,
  action: 'cancel' | 'return',
  reason?: string
): Promise<Order> {
  const res = await requestJson<{ order: Order }>(
    `/api/orders/${encodeURIComponent(orderId)}/action`,
    {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }
  );
  return res.order;
}

export async function fetchSellerDashboardApi(): Promise<SellerDashboardData> {
  return requestJson<SellerDashboardData>('/api/seller/dashboard');
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
}): Promise<ApiSellerProductRecord> {
  const res = await requestJson<{ product: ApiSellerProductRecord }>('/api/seller/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.product;
}

export async function updateSellerProductApi(
  id: string,
  updates: { price?: number; stockCount?: number; availability?: AvailabilityStatus }
): Promise<ProductOverride> {
  const res = await requestJson<{ override: ProductOverride }>(
    `/api/seller/products/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
  return res.override;
}

export async function fetchAdminDashboardApi(): Promise<AdminDashboardData> {
  return requestJson<AdminDashboardData>('/api/admin/dashboard');
}

export async function updateAdminUserApi(
  id: string,
  updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' }
): Promise<AccountDirectoryEntry> {
  const res = await requestJson<{ user: AccountDirectoryEntry }>(
    `/api/admin/users/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
  return res.user;
}

export async function updateSellerStatusApi(
  id: string,
  status: 'approved' | 'pending' | 'suspended'
): Promise<SellerApplicationRecord> {
  const res = await requestJson<{ application: SellerApplicationRecord }>(
    `/api/admin/sellers/${encodeURIComponent(id)}/approve`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }
  );
  return res.application;
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
  return requestJson('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryNodeApi(
  id: string,
  updates: Partial<CategoryNode>
): Promise<{ category: CategoryNode; categoryTree: CategoryNode[] }> {
  return requestJson(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteCategoryNodeApi(
  idOrSlug: string
): Promise<{ ok: boolean; removedCount: number; categoryTree: CategoryNode[] }> {
  return requestJson(`/api/admin/categories/${encodeURIComponent(idOrSlug)}`, {
    method: 'DELETE',
  });
}
