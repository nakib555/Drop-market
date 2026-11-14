import type {
  AccountDirectoryEntry,
  AdminDashboardData,
  ApiSellerProductRecord,
  AvailabilityStatus,
  DynamicCategoryRecord,
  Order,
  OrderStage,
  ProductOverride,
  SellerApplicationRecord,
  SellerDashboardData,
  StoreNotification,
  UserRole,
} from '../types/commerce';
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
  customCategories: DynamicCategoryRecord[];
}> {
  return requestJson('/api/storefront/state');
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

export async function createCategoryApi(payload: {
  name: string;
  shortName?: string;
  description?: string;
  subcategoryName?: string;
  imagePresetKey?: string;
}): Promise<DynamicCategoryRecord> {
  const res = await requestJson<{ category: DynamicCategoryRecord }>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.category;
}

export async function deleteCategoryApi(slug: string): Promise<void> {
  await requestJson(`/api/admin/categories/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}
