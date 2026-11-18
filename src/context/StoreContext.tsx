import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  INITIAL_CATEGORY_TREE,
  PROMO_CODES,
  buildCategoryMetasFromNodes,
  getDescendantCategorySlugs,
} from '../data/catalog';
import {
  computeVerifiedReviewStats,
  getCachedDummyJsonProductsSync,
} from '../../server/shared/dummyJsonCatalog';
import {
  ApiError,
  changePasswordApi,
  claimGuestOrdersApi,
  clearStoredToken,
  deleteAccountAddressApi,
  deleteAccountPaymentMethodApi,
  fetchAccountAddressesApi,
  fetchAccountCartApi,
  fetchAccountPaymentMethodsApi,
  fetchAccountWishlistApi,
  fetchAuthSession,
  fetchCatalogProductsApi,
  fetchNotificationsApi,
  fetchOrdersApi,
  fetchPublicPoliciesApi,
  fetchStorefrontSync,
  loginWithApi,
  logoutWithApi,
  markNotificationReadApi,
  mergeAccountCartApi,
  performOrderCustomerActionApi,
  registerWithApi,
  saveAccountAddressApi,
  saveAccountPaymentMethodApi,
  setDefaultAccountAddressApi,
  setDefaultAccountPaymentMethodApi,
  submitProductReviewApi,
  syncAccountCartApi,
  toggleAccountWishlistApi,
  updateProfileApi,
} from '../services/api';
import { readStorage, writeStorage } from '../services/storage';
import {
  AccountDirectoryEntry,
  Address,
  ApiSellerProductRecord,
  AuthPrefill,
  AuthPromptContext,
  CartItem,
  CategoryMeta,
  CategoryNode,
  CookieConsentState,
  CookieInventoryItem,
  CurrencyCode,
  CurrencyRateState,
  CustomerProfile,
  LanguageCode,
  LegalAcceptanceRecord,
  LegalDocumentId,
  ManagedPromoRecord,
  NotificationPrefs,
  Order,
  PaymentMethodId,
  PaymentMethodRecord,
  PendingAction,
  PolicyDocumentRecord,
  PolicyFactsPublicSummary,
  PrivacyPrefs,
  Product,
  ProductOverride,
  ProductQuestion,
  ProductReview,
  PromoCode,
  ProtectedActionId,
  ShippingRuleConfig,
  StoreNotification,
  StorePolicyConfig,
} from '../types/commerce';
import {
  DEFAULT_STORE_POLICY,
  PENDING_ACTION_STORAGE_KEY,
  buildAuthPromptContext,
  evaluateActionAccess,
  parsePendingAction,
  serializePendingAction,
} from '../policy/authPolicy';
import { LEGAL_VERSION } from '../data/legalPolicies';
import {
  buildActiveCookieInventory,
  buildDefaultPolicyRecords,
  buildPublicFactsSummary,
  createInitialPolicyFacts,
  getPublicPublishedPolicies,
} from '../../server/services/policyService';
import {
  canPersonalizeCatalog,
  canTrackSearchHistory,
  clearGatedStorage,
  recordOptionalEvent,
} from '../utils/consentGate';
import {
  getLanguageOption,
  isSupportedLanguage,
  LANGUAGE_OPTIONS,
  t,
} from '../utils/i18n';
import {
  DEFAULT_BDT_RATE,
  formatCurrency,
  isProductOutOfStock,
  setGlobalBdtRate,
} from '../utils/format';
import { resolveImagePreset } from '../utils/imagePresets';
import {
  NavigationDirection,
  RouteState,
  resolveRedirectRoute,
  serializeRouteToPath,
  useNavigationController,
} from './navigationController';

export type { NavigationDirection, RouteState };

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}

export interface RegisterAccountResult {
  user: AccountDirectoryEntry | null;
  error?: {
    message: string;
    status?: number;
  };
}

export interface RunProtectedActionOptions {
  productId?: string;
  itemName?: string;
  orderId?: string;
  reason?: string;
  address?: Omit<Address, 'id'>;
  paymentMethod?: Omit<PaymentMethodRecord, 'id'>;
  review?: {
    productId: string;
    rating: number;
    title: string;
    comment: string;
  };
  accountTab?: string;
  preferredTab?: 'signin' | 'register';
  prefill?: AuthPrefill;
  returnRoute?: PendingAction['returnRoute'];
}

const GUEST_ORDER_IDS_KEY = 'kinto-guest-order-ids';
const AUTH_BROADCAST_CHANNEL = 'kinto-auth-sync';

function createGuestProfile(): CustomerProfile {
  return {
    id: 'guest',
    fullName: '',
    email: '',
    phone: '',
    role: 'customer',
    studioRole: 'Guest',
    studioName: undefined,
    isAuthenticated: false,
  };
}

function readGuestOrderIds(): string[] {
  if (typeof window === 'undefined' || !window.sessionStorage) return [];
  try {
    const raw = window.sessionStorage.getItem(GUEST_ORDER_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeGuestOrderIds(ids: string[]): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (ids.length === 0) {
      window.sessionStorage.removeItem(GUEST_ORDER_IDS_KEY);
    } else {
      window.sessionStorage.setItem(GUEST_ORDER_IDS_KEY, JSON.stringify(ids.slice(0, 20)));
    }
  } catch {
    // Ignore storage errors
  }
}

function readPendingActionFromSession(ttlMs: number): PendingAction | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_ACTION_STORAGE_KEY);
    const parsed = parsePendingAction(raw, Date.now(), ttlMs);
    if (!parsed && raw !== null) {
      window.sessionStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePendingActionToSession(action: PendingAction | null, ttlMs: number): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    if (!action) {
      window.sessionStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(PENDING_ACTION_STORAGE_KEY, serializePendingAction(action, ttlMs));
    }
  } catch {
    // Ignore storage errors
  }
}

const DEFAULT_CURRENCY_STATE: CurrencyRateState = {
  baseCurrency: 'USD',
  defaultCurrency: 'BDT',
  rates: { USD: 1, BDT: DEFAULT_BDT_RATE },
  source: 'Bangladesh Bank & OpenFX Studio Reference Feed',
  updateFrequencyMinutes: 30,
  updatedAt: new Date().toISOString(),
  roundingRules: {
    BDT: { decimals: 0, mode: 'ceil_integer_taka' },
    USD: { decimals: 2, mode: 'half_even_cents' },
  },
};

const DEFAULT_SHIPPING_CONFIG: ShippingRuleConfig = {
  zones: [
    {
      zoneId: 'dhaka_metro',
      label: 'Dhaka Metro (North & South City)',
      standardFeeUsd: 0.7,
      expressFeeUsd: 1.65,
      expressAvailable: true,
      whiteGloveFeeUsd: 12,
      whiteGloveAvailable: true,
      freeThresholdUsd: 120,
      baseWeightAllowanceKg: 3,
      perExtraKgUsd: 0.25,
      bulkySurchargeUsd: 3.5,
      freightSurchargeUsd: 15,
      standardEta: '24–48 Hours (Next-Day Metro)',
      expressEta: 'Same-Day / 4–8 Hours Dispatch',
      whiteGloveEta: 'Scheduled 2-Person Room Assembly',
      codEligible: true,
      codMaxOrderUsd: 650,
      isRestricted: false,
    },
  ],
  restrictedAreaKeywords: ['sandwip', 'saint martin', 'st. martin', 'monpura'],
  updatedAt: new Date().toISOString(),
};

interface StoreContextValue {
  route: RouteState;
  navigationDirection: NavigationDirection;
  canGoBack: boolean;
  navigate: (next: RouteState) => void;
  goBack: () => void;
  storefrontLoading: boolean;
  catalogError: string | null;
  retryCatalogLoad: () => Promise<void>;
  categoryNodes: CategoryNode[];
  categories: CategoryMeta[];
  getCategoryNodeBySlug: (slug: string) => CategoryNode | undefined;
  getDescendantSlugs: (slug: string) => string[];
  products: Product[];
  language: LanguageCode;
  setLanguage: (next: LanguageCode) => void;
  toggleLanguage: () => void;
  currency: CurrencyCode;
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
  setCurrency: (next: CurrencyCode) => void;
  toggleCurrency: () => void;
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlistIds: string[];
  compareIds: string[];
  recentlyViewedIds: string[];
  recentSearches: string[];
  appliedPromo: PromoCode | null;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;
  addToCart: (
    product: Product,
    color: string,
    colorHex: string,
    size: string,
    quantity?: number,
    openDrawer?: boolean
  ) => void;
  updateCartQty: (key: string, quantity: number) => void;
  removeFromCart: (key: string, options?: { silent?: boolean }) => void;
  restoreCartItem: (item: CartItem, index?: number) => void;
  saveItemForLater: (key: string) => void;
  moveSavedToCart: (key: string) => void;
  removeSavedItem: (key: string) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => { ok: boolean; message: string };
  removePromoCode: () => void;
  cartSubtotal: number;
  cartDiscount: number;
  cartTax: number;
  estimatedShipping: number;
  cartTotal: number;
  cartItemCount: number;
  toggleWishlist: (product: Product) => void;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  recordProductView: (productId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  submitProductReview: (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => void;
  submitProductQuestion: (productId: string, author: string, question: string) => void;
  orders: Order[];
  commitVerifiedOrder: (order: Order) => void;
  reorderFromOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  requestOrderReturn: (orderId: string, reason?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshStorefrontSync: () => Promise<void>;
  storePolicy: StorePolicyConfig;
  pendingAction: PendingAction | null;
  authPromptContext: AuthPromptContext | null;
  authPrefill: AuthPrefill | undefined;
  wishlistPendingIds: string[];
  profile: CustomerProfile;
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'register';
  setAuthModalTab: (tab: 'signin' | 'register') => void;
  authModalStayOnPage: boolean;
  openAuthModal: (
    tab?: 'signin' | 'register',
    options?: { context?: AuthPromptContext | null; prefill?: AuthPrefill; stayOnPage?: boolean }
  ) => void;
  cancelAuthPrompt: () => void;
  runProtectedAction: (
    actionId: ProtectedActionId,
    executor: () => Promise<void> | void,
    options?: RunProtectedActionOptions
  ) => Promise<boolean>;
  resumePendingActionAfterAuth: (user: AccountDirectoryEntry) => Promise<boolean>;
  claimOrders: (orderIds?: string[]) => Promise<number>;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  signIn: (email: string, password: string) => Promise<AccountDirectoryEntry | null>;
  registerAccount: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'customer' | 'seller';
    studioName?: string;
    acceptedPolicies: LegalAcceptanceRecord;
  }) => Promise<RegisterAccountResult>;
  notifications: StoreNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  addresses: Address[];
  saveAddress: (address: Omit<Address, 'id'> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  paymentMethods: PaymentMethodRecord[];
  addPaymentMethod: (card: Omit<PaymentMethodRecord, 'id'>) => void;
  deletePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: (prefs: NotificationPrefs) => void;
  privacyPrefs: PrivacyPrefs;
  setPrivacyPrefs: (prefs: PrivacyPrefs) => void;
  cookieConsent: CookieConsentState;
  cookieModalOpen: boolean;
  openCookiePreferences: () => void;
  closeCookiePreferences: () => void;
  acceptAllCookies: () => void;
  rejectNonEssentialCookies: () => void;
  saveCookiePreferences: (prefs: PrivacyPrefs) => void;
  previewPolicyId: LegalDocumentId | null;
  openPolicyPreview: (id: LegalDocumentId) => void;
  closePolicyPreview: () => void;
  publishedPolicies: PolicyDocumentRecord[];
  policyFactsPublic: PolicyFactsPublicSummary;
  cookieInventory: CookieInventoryItem[];
  enabledPaymentMethods: PaymentMethodId[];
  refreshPublishedPolicies: () => Promise<void>;
  trackOptionalEvent: (name: string, meta?: { route?: string; category?: string }) => boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = readStorage<unknown>('kinto-language', 'en');
    return isSupportedLanguage(saved) ? saved : 'en';
  });
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    readStorage<CurrencyCode>('kinto-currency', 'BDT')
  );
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyRateState>(DEFAULT_CURRENCY_STATE);
  const [shippingConfig, setShippingConfig] = useState<ShippingRuleConfig>(DEFAULT_SHIPPING_CONFIG);
  const [promotions, setPromotions] = useState<ManagedPromoRecord[]>(() =>
    PROMO_CODES.map((p) => ({ ...p, active: true }))
  );

  const [cart, setCart] = useState<CartItem[]>(() => readStorage('kinto-cart', []));
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() =>
    readStorage('kinto-saved', [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStorage('kinto-wishlist', [])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() => readStorage('kinto-compare', []));
  const [cookieConsent, setCookieConsent] = useState<CookieConsentState>(() =>
    readStorage<CookieConsentState>('kinto-cookie-consent', {
      version: LEGAL_VERSION,
      status: 'unset',
      necessary: true,
      saveSearchHistory: true,
      personalizedCatalog: true,
      analyticsOptIn: false,
    })
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    canPersonalizeCatalog(
      readStorage<CookieConsentState>('kinto-cookie-consent', {
        version: LEGAL_VERSION,
        status: 'unset',
        necessary: true,
        saveSearchHistory: true,
        personalizedCatalog: true,
        analyticsOptIn: false,
      })
    )
      ? readStorage('kinto-recent-views', [])
      : []
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    canTrackSearchHistory(
      readStorage<CookieConsentState>('kinto-cookie-consent', {
        version: LEGAL_VERSION,
        status: 'unset',
        necessary: true,
        saveSearchHistory: true,
        personalizedCatalog: true,
        analyticsOptIn: false,
      })
    )
      ? readStorage('kinto-recent-searches', [])
      : []
  );
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(() =>
    readStorage('kinto-promo', null)
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [customReviews, setCustomReviews] = useState<Record<string, ProductReview[]>>(() =>
    readStorage('kinto-reviews', {})
  );
  const [customQuestions, setCustomQuestions] = useState<Record<string, ProductQuestion[]>>(() =>
    readStorage('kinto-questions', {})
  );

  // API-driven auth, policy gate, notifications, and live catalog sync
  const [storePolicy, setStorePolicy] = useState<StorePolicyConfig>(DEFAULT_STORE_POLICY);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [storefrontLoading, setStorefrontLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [authModalStayOnPage, setAuthModalStayOnPage] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(() =>
    readPendingActionFromSession(DEFAULT_STORE_POLICY.pendingActionTtlMs)
  );
  const [authPromptContext, setAuthPromptContext] = useState<AuthPromptContext | null>(null);
  const [authPrefill, setAuthPrefill] = useState<AuthPrefill | undefined>(undefined);
  const [wishlistPendingIds, setWishlistPendingIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<CustomerProfile>(createGuestProfile);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>(() =>
    getCachedDummyJsonProductsSync()
  );
  const [productOverrides, setProductOverrides] = useState<Record<string, ProductOverride>>({});
  const [sellerProducts, setSellerProducts] = useState<ApiSellerProductRecord[]>([]);
  const [categoryNodes, setCategoryNodes] = useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [notificationPrefs, setNotificationPrefsState] = useState<NotificationPrefs>(() =>
    readStorage('kinto-notif-prefs', {
      orderUpdates: true,
      restockAlerts: true,
      studioJournal: true,
      privateOffers: false,
    })
  );
  const [privacyPrefs, setPrivacyPrefsState] = useState<PrivacyPrefs>(() =>
    readStorage('kinto-privacy-prefs', {
      personalizedCatalog: true,
      saveSearchHistory: true,
      analyticsOptIn: false,
    })
  );
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [previewPolicyId, setPreviewPolicyId] = useState<LegalDocumentId | null>(null);
  const [publishedPolicies, setPublishedPolicies] = useState<PolicyDocumentRecord[]>(() =>
    getPublicPublishedPolicies(
      buildDefaultPolicyRecords({ facts: createInitialPolicyFacts() })
    )
  );
  const [policyFactsPublic, setPolicyFactsPublic] = useState<PolicyFactsPublicSummary>(() =>
    buildPublicFactsSummary(createInitialPolicyFacts())
  );
  const [cookieInventory, setCookieInventory] = useState<CookieInventoryItem[]>(() =>
    buildActiveCookieInventory()
  );
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<PaymentMethodId[]>(['cod']);

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const apiProductsRef = React.useRef<Product[]>(apiProducts);
  useEffect(() => {
    apiProductsRef.current = apiProducts;
  }, [apiProducts]);

  const hydrateOrderImages = useCallback(
    (apiOrders: Order[], catalogList: Product[] = apiProductsRef.current): Order[] => {
      if (!Array.isArray(apiOrders)) return [];
      return apiOrders.map((ord) => ({
        ...ord,
        paymentStatus: ord.paymentStatus || (ord.paymentMethod === 'cod' ? 'cod_pending' : 'paid'),
        items: (Array.isArray(ord.items) ? ord.items : []).map((item) => {
          if (item.image) return item;
          const matched = catalogList.find((p) => p.id === item.productId);
          return {
            ...item,
            image: matched?.images[0] || resolveImagePreset(undefined, item.category),
          };
        }),
      }));
    },
    []
  );

  const applySyncPayload = useCallback(
    (sync: Awaited<ReturnType<typeof fetchStorefrontSync>>) => {
      if (!sync || typeof sync !== 'object') return;
      if (sync.productOverrides && typeof sync.productOverrides === 'object') {
        setProductOverrides(sync.productOverrides);
      }
      if (Array.isArray(sync.sellerProducts)) {
        setSellerProducts(sync.sellerProducts);
      }
      if (Array.isArray(sync.categoryTree) && sync.categoryTree.length > 0) {
        setCategoryNodes(sync.categoryTree);
      }
      if (sync.currencyConfig?.rates?.BDT) {
        setCurrencyConfig(sync.currencyConfig);
        setGlobalBdtRate(sync.currencyConfig.rates.BDT);
      }
      if (sync.shippingConfig && Array.isArray(sync.shippingConfig.zones)) {
        setShippingConfig(sync.shippingConfig);
      }
      if (Array.isArray(sync.promotions) && sync.promotions.length > 0) {
        setPromotions(sync.promotions);
      }
      if (Array.isArray(sync.publishedPolicies) && sync.publishedPolicies.length > 0) {
        setPublishedPolicies(sync.publishedPolicies);
      }
      if (sync.policyFactsPublic) {
        setPolicyFactsPublic(sync.policyFactsPublic);
      }
      if (Array.isArray(sync.cookieInventory) && sync.cookieInventory.length > 0) {
        setCookieInventory(sync.cookieInventory);
      }
      if (Array.isArray(sync.enabledPaymentMethods)) {
        setEnabledPaymentMethods(sync.enabledPaymentMethods);
      }
    },
    []
  );

  const refreshStorefrontSync = useCallback(async () => {
    try {
      const sync = await fetchStorefrontSync();
      applySyncPayload(sync);
    } catch {
      // Static deploy fallback uses base bundled catalog
    }
  }, [applySyncPayload]);

  const refreshPublishedPolicies = useCallback(async () => {
    try {
      const res = await fetchPublicPoliciesApi();
      if (Array.isArray(res.policies) && res.policies.length > 0) {
        setPublishedPolicies(res.policies);
      }
      if (res.policyFactsPublic) {
        setPolicyFactsPublic(res.policyFactsPublic);
      }
      if (Array.isArray(res.cookieInventory) && res.cookieInventory.length > 0) {
        setCookieInventory(res.cookieInventory);
      }
    } catch {
      // Keep active fallback policies
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const apiOrders = await fetchOrdersApi();
      if (Array.isArray(apiOrders)) {
        setOrders(hydrateOrderImages(apiOrders));
      }
    } catch {
      // Keep local cached orders
    }
  }, [hydrateOrderImages]);

  const refreshNotifications = useCallback(async (role: CustomerProfile['role']) => {
    try {
      const list = await fetchNotificationsApi(role);
      if (Array.isArray(list)) {
        setNotifications(list);
      }
    } catch {
      // Ignore if offline or static deployment
    }
  }, []);

  const suppressCartSyncRef = useRef(false);
  const cartRef = useRef<CartItem[]>(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const broadcastAuthSync = useCallback(
    (event: { type: 'auth:login' | 'auth:logout' | 'cart:sync' | 'wishlist:sync'; userId?: string }) => {
      if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
      try {
        const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
        ch.postMessage(event);
        ch.close();
      } catch {
        // Ignore BroadcastChannel errors
      }
    },
    []
  );

  const hydrateAuthenticatedAccountData = useCallback(
    async (
      user: AccountDirectoryEntry,
      options?: { mergeGuestBag?: boolean; catalogList?: Product[]; claimGuestOrders?: boolean }
    ): Promise<{ wishlistIds: string[] }> => {
      const catalogList = options?.catalogList ?? apiProductsRef.current;
      const guestBag = cartRef.current;
      const guestIds = readGuestOrderIds();

      const cartTask =
        options?.mergeGuestBag && guestBag.length > 0
          ? mergeAccountCartApi(guestBag).then((res) => ({ kind: 'merged' as const, ...res }))
          : fetchAccountCartApi().then((items) => ({ kind: 'fetched' as const, items }));

      const [ordersRes, wishlistRes, addressesRes, pmRes, cartRes] = await Promise.allSettled([
        options?.claimGuestOrders && guestIds.length > 0
          ? claimGuestOrdersApi(guestIds).then((r) => {
              writeGuestOrderIds([]);
              return r.orders;
            })
          : fetchOrdersApi(),
        fetchAccountWishlistApi(),
        fetchAccountAddressesApi(),
        fetchAccountPaymentMethodsApi(),
        cartTask,
      ]);

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setOrders(hydrateOrderImages(ordersRes.value, catalogList));
      }
      const nextWishlist =
        wishlistRes.status === 'fulfilled' && Array.isArray(wishlistRes.value)
          ? wishlistRes.value
          : [];
      setWishlistIds(nextWishlist);

      if (addressesRes.status === 'fulfilled' && Array.isArray(addressesRes.value)) {
        setAddresses(addressesRes.value);
      }
      if (pmRes.status === 'fulfilled' && Array.isArray(pmRes.value)) {
        setPaymentMethods(pmRes.value);
      }

      if (cartRes.status === 'fulfilled') {
        suppressCartSyncRef.current = true;
        setCart(cartRes.value.items);
        window.setTimeout(() => {
          suppressCartSyncRef.current = false;
        }, 0);
      }

      await refreshNotifications(user.role);
      return { wishlistIds: nextWishlist };
    },
    [hydrateOrderImages, refreshNotifications]
  );

  useEffect(() => {
    let active = true;
    const hasExistingCatalog = apiProductsRef.current.length > 0;
    async function initApi() {
      setAuthLoading(true);
      if (!hasExistingCatalog) {
        setStorefrontLoading(true);
      }
      try {
        clearStoredToken();
        const [catalogRes, syncRes, sessionRes] = await Promise.allSettled([
          fetchCatalogProductsApi(),
          fetchStorefrontSync(),
          fetchAuthSession(),
        ]);

        if (!active) return;

        const loadedCatalog =
          catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value)
            ? catalogRes.value
            : getCachedDummyJsonProductsSync();

        if (loadedCatalog.length > 0) {
          setApiProducts(loadedCatalog);
          setCatalogError(null);
        } else if (catalogRes.status === 'rejected') {
          setCatalogError(
            'Unable to load the product catalog right now. Please check your connection and try again.'
          );
        }

        if (syncRes.status === 'fulfilled' && syncRes.value) {
          applySyncPayload(syncRes.value);
        }

        const activePolicy =
          sessionRes.status === 'fulfilled' && sessionRes.value.policy
            ? sessionRes.value.policy
            : DEFAULT_STORE_POLICY;
        setStorePolicy(activePolicy);

        if (sessionRes.status === 'fulfilled' && sessionRes.value.authenticated && sessionRes.value.user) {
          const u = sessionRes.value.user;
          setProfile({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            role: u.role,
            studioRole: u.roleLabel,
            studioName: u.studioName,
            isAuthenticated: true,
          });
          await hydrateAuthenticatedAccountData(u, {
            mergeGuestBag: false,
            catalogList: loadedCatalog,
          });
        } else {
          setProfile(createGuestProfile());
          setOrders([]);
          setAddresses([]);
          setPaymentMethods([]);
          if (activePolicy.wishlistAuthRequired) {
            setWishlistIds([]);
          }
        }
      } finally {
        if (active) {
          setAuthLoading(false);
          setStorefrontLoading(false);
        }
      }
    }
    initApi();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySyncPayload, hydrateAuthenticatedAccountData]);

  const retryCatalogLoad = useCallback(async () => {
    setStorefrontLoading(true);
    setCatalogError(null);
    try {
      const [catalogRes, syncRes] = await Promise.allSettled([
        fetchCatalogProductsApi(),
        fetchStorefrontSync(),
      ]);
      const loadedCatalog =
        catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value)
          ? catalogRes.value
          : getCachedDummyJsonProductsSync();
      if (loadedCatalog.length > 0) {
        setApiProducts(loadedCatalog);
        setCatalogError(null);
      } else {
        setCatalogError(
          'Unable to load the product catalog right now. Please check your connection and try again.'
        );
      }
      if (syncRes.status === 'fulfilled' && syncRes.value) {
        applySyncPayload(syncRes.value);
      }
    } finally {
      setStorefrontLoading(false);
    }
  }, [applySyncPayload]);

  useEffect(() => {
    refreshNotifications(profile.role || 'customer');
  }, [profile.role, refreshNotifications]);

  // Derive 10-Department Metadata Tree with nested subcategories & active flags
  const categories = useMemo<CategoryMeta[]>(
    () => buildCategoryMetasFromNodes(categoryNodes),
    [categoryNodes]
  );

  const getCategoryNodeBySlug = useCallback(
    (slug: string) => categoryNodes.find((c) => c.slug === slug),
    [categoryNodes]
  );

  const getDescendantSlugs = useCallback(
    (slug: string) => getDescendantCategorySlugs(categoryNodes, slug),
    [categoryNodes]
  );

  // Merge base catalog + live API seller overrides + API-created seller products
  const products = useMemo(() => {
    const mappedSellerProducts: Product[] = sellerProducts.map((sp) => {
      const img = resolveImagePreset(sp.imagePresetKey, sp.category);
      return {
        id: sp.id,
        slug: sp.slug,
        sku: sp.sku,
        name: sp.name,
        subtitle: sp.subtitle,
        brand: sp.brand,
        category: sp.category,
        categoryLabel: sp.categoryLabel,
        subcategory: sp.subcategory,
        subcategoryLabel: sp.subcategoryLabel,
        weightKg: sp.weightKg ?? 1.2,
        sizeTier: sp.sizeTier ?? 'small',
        codEligible: sp.codEligible ?? true,
        price: sp.price,
        originalPrice: sp.originalPrice,
        rating: sp.rating,
        reviewCount: sp.reviewCount,
        stockCount: sp.stockCount,
        availability: sp.availability,
        badgeText: sp.badgeText,
        shortDescription: sp.shortDescription,
        description: sp.description,
        images: [img],
        colors: sp.colors,
        sizes: sp.sizes,
        cardHighlights: sp.cardHighlights,
        attributes: sp.attributes,
        typedAttributes: sp.typedAttributes,
        specifications: sp.specifications,
        deliveryEstimate: sp.deliveryEstimate,
        returnPolicy: sp.returnPolicy,
        warranty: sp.warranty,
        tags: sp.tags,
        isNewArrival: sp.isNewArrival ?? true,
        isTrending: false,
        isBestSeller: false,
        reviews: [],
        questions: [],
      };
    });

    const hydratedApiProducts = apiProducts.map((p) =>
      p.images && p.images.length > 0
        ? p
        : { ...p, images: [resolveImagePreset(undefined, p.category)] }
    );

    const combinedRaw = [...mappedSellerProducts, ...hydratedApiProducts];
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const combinedBase: Product[] = [];

    for (const item of combinedRaw) {
      if (seenIds.has(item.id) || seenSlugs.has(item.slug)) continue;
      seenIds.add(item.id);
      seenSlugs.add(item.slug);
      combinedBase.push(item);
    }

    return combinedBase.map((p) => {
      const override = productOverrides[p.id];
      const baseWithOverride: Product = override
        ? {
            ...p,
            price: override.price ?? p.price,
            stockCount: override.stockCount ?? p.stockCount,
            availability: override.availability ?? p.availability,
          }
        : p;

      const extraReviews = customReviews[p.id] || [];
      const extraQuestions = customQuestions[p.id] || [];
      const mergedQuestions = [...extraQuestions, ...(baseWithOverride.questions || [])];
      const combinedReviews = [...extraReviews, ...(baseWithOverride.reviews || [])];
      const { verifiedReviews, rating, reviewCount } = computeVerifiedReviewStats(combinedReviews);

      return {
        ...baseWithOverride,
        reviews: verifiedReviews,
        reviewCount,
        rating,
        questions: mergedQuestions,
      };
    });
  }, [apiProducts, customReviews, customQuestions, productOverrides, sellerProducts]);

  useEffect(() => {
    writeStorage('kinto-language', language);
    if (typeof document !== 'undefined') {
      const opt = getLanguageOption(language);
      document.documentElement.lang = opt.code;
      document.documentElement.dir = opt.dir;
    }
  }, [language]);
  useEffect(() => writeStorage('kinto-currency', currency), [currency]);
  useEffect(() => {
    writeStorage('kinto-cart', cart);
    if (profile.isAuthenticated && !suppressCartSyncRef.current) {
      const timer = window.setTimeout(() => {
        syncAccountCartApi(cart)
          .then(() => broadcastAuthSync({ type: 'cart:sync' }))
          .catch(() => {});
      }, 220);
      return () => window.clearTimeout(timer);
    }
  }, [broadcastAuthSync, cart, profile.isAuthenticated]);
  useEffect(() => writeStorage('kinto-saved', savedForLater), [savedForLater]);
  useEffect(() => {
    if (!storePolicy.wishlistAuthRequired) {
      writeStorage('kinto-wishlist', wishlistIds);
    }
  }, [storePolicy.wishlistAuthRequired, wishlistIds]);
  useEffect(() => writeStorage('kinto-compare', compareIds), [compareIds]);
  useEffect(() => {
    if (canPersonalizeCatalog(cookieConsent)) {
      writeStorage('kinto-recent-views', recentlyViewedIds);
    }
  }, [cookieConsent, recentlyViewedIds]);
  useEffect(() => {
    if (canTrackSearchHistory(cookieConsent)) {
      writeStorage('kinto-recent-searches', recentSearches);
    }
  }, [cookieConsent, recentSearches]);
  useEffect(() => {
    clearGatedStorage(cookieConsent);
    if (!canPersonalizeCatalog(cookieConsent)) {
      setRecentlyViewedIds([]);
    }
    if (!canTrackSearchHistory(cookieConsent)) {
      setRecentSearches([]);
    }
  }, [cookieConsent]);
  useEffect(() => writeStorage('kinto-promo', appliedPromoCode), [appliedPromoCode]);
  useEffect(() => writeStorage('kinto-reviews', customReviews), [customReviews]);
  useEffect(() => writeStorage('kinto-questions', customQuestions), [customQuestions]);
  useEffect(() => writeStorage('kinto-notif-prefs', notificationPrefs), [notificationPrefs]);
  useEffect(() => writeStorage('kinto-privacy-prefs', privacyPrefs), [privacyPrefs]);
  useEffect(() => writeStorage('kinto-cookie-consent', cookieConsent), [cookieConsent]);

  const { route, navigationDirection, canGoBack, navigate, goBack } = useNavigationController(
    products,
    categories
  );

  // Sync login / logout / cart / wishlist across browser tabs via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    ch.onmessage = async (evt: MessageEvent<{ type?: string }>) => {
      const msgType = evt.data?.type;
      if (msgType === 'auth:logout') {
        suppressCartSyncRef.current = true;
        setProfile(createGuestProfile());
        setOrders([]);
        setAddresses([]);
        setPaymentMethods([]);
        setWishlistIds([]);
        setCart([]);
        setPendingAction(null);
        setAuthPromptContext(null);
        setAuthPrefill(undefined);
        writePendingActionToSession(null, storePolicy.pendingActionTtlMs);
        window.setTimeout(() => {
          suppressCartSyncRef.current = false;
        }, 0);
      } else if (msgType === 'auth:login') {
        try {
          const session = await fetchAuthSession();
          if (session.authenticated && session.user) {
            const u = session.user;
            setProfile({
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              phone: u.phone,
              role: u.role,
              studioRole: u.roleLabel,
              studioName: u.studioName,
              isAuthenticated: true,
            });
            await hydrateAuthenticatedAccountData(u, { mergeGuestBag: false });
          }
        } catch {
          // Ignore sync failure
        }
      } else if (msgType === 'cart:sync' && profile.isAuthenticated) {
        try {
          const remoteCart = await fetchAccountCartApi();
          suppressCartSyncRef.current = true;
          setCart(remoteCart);
          window.setTimeout(() => {
            suppressCartSyncRef.current = false;
          }, 0);
        } catch {
          // Ignore
        }
      } else if (msgType === 'wishlist:sync' && profile.isAuthenticated) {
        try {
          const remoteWl = await fetchAccountWishlistApi();
          setWishlistIds(remoteWl);
        } catch {
          // Ignore
        }
      }
    };
    return () => ch.close();
  }, [hydrateAuthenticatedAccountData, profile.isAuthenticated, storePolicy.pendingActionTtlMs]);

  const openAuthModal = useCallback(
    (
      tab: 'signin' | 'register' = 'signin',
      options?: { context?: AuthPromptContext | null; prefill?: AuthPrefill; stayOnPage?: boolean }
    ) => {
      setCartDrawerOpen(false);
      setQuickViewProduct(null);
      setAuthModalOpen(false);
      setPendingAction(null);
      writePendingActionToSession(null, storePolicy.pendingActionTtlMs);
      setAuthPromptContext(options?.context ?? null);
      setAuthPrefill(options?.prefill);
      setAuthModalStayOnPage(Boolean(options?.stayOnPage));
      setAuthModalTab(tab);

      const currentPath =
        route.name === 'login' ? route.redirectTo : serializeRouteToPath(route);
      const redirectTo =
        currentPath && currentPath !== '/' && !currentPath.startsWith('/login')
          ? currentPath
          : options?.stayOnPage
          ? '/'
          : undefined;

      navigate({
        name: 'login',
        accountTab: tab,
        ...(redirectTo ? { redirectTo } : {}),
      });
    },
    [navigate, route, storePolicy.pendingActionTtlMs]
  );

  const cancelAuthPrompt = useCallback(() => {
    setAuthModalOpen(false);
    setAuthModalStayOnPage(false);
    setPendingAction(null);
    setAuthPromptContext(null);
    setAuthPrefill(undefined);
    writePendingActionToSession(null, storePolicy.pendingActionTtlMs);
  }, [storePolicy.pendingActionTtlMs]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, description?: string, variant: ToastMessage['variant'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const setLanguage = useCallback(
    (next: LanguageCode) => {
      setLanguageState(next);
      showToast(t(next, 'languageChangedToast'), undefined, 'info');
    },
    [showToast]
  );

  const toggleLanguage = useCallback(() => {
    const idx = LANGUAGE_OPTIONS.findIndex((o) => o.code === language);
    const next = LANGUAGE_OPTIONS[(idx + 1) % LANGUAGE_OPTIONS.length]?.code ?? 'en';
    setLanguage(next);
  }, [language, setLanguage]);

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCurrencyState(next);
      showToast(
        `Display currency set to ${next}`,
        next === 'BDT'
          ? `Bangladesh Taka (৳) at 1 USD = ৳${currencyConfig.rates.BDT}`
          : 'Display prices in USD ($). Bangladesh checkout settles in BDT.',
        'info'
      );
    },
    [currencyConfig.rates.BDT, showToast]
  );

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === 'BDT' ? 'USD' : 'BDT');
  }, [currency, setCurrency]);

  const addToCart = useCallback(
    (
      product: Product,
      color: string,
      colorHex: string,
      size: string,
      quantity = 1,
      openDrawer = true
    ) => {
      if (isProductOutOfStock(product)) {
        showToast('Out of stock', `${product.name} is currently unavailable.`, 'error');
        return;
      }

      const key = `${product.id}::${color}::${size}`;
      const existing = cart.find((i) => i.key === key);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty >= product.stockCount) {
        showToast(
          'Maximum available stock in bag',
          `Only ${product.stockCount} units of ${product.name} available.`,
          'info'
        );
        if (openDrawer) setCartDrawerOpen(true);
        return;
      }

      const targetQty = Math.min(product.stockCount, currentQty + quantity);
      setCart((prev) => {
        const hit = prev.find((i) => i.key === key);
        if (hit) {
          return prev.map((i) => (i.key === key ? { ...i, quantity: targetQty } : i));
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            slug: product.slug,
            image: product.images[0],
            price: product.price,
            originalPrice: product.originalPrice,
            color,
            colorHex,
            size,
            quantity: targetQty,
            stockCount: product.stockCount,
            weightKg: product.weightKg ?? 1.0,
            sizeTier: product.sizeTier ?? 'small',
          },
        ];
      });

      if (currentQty + quantity > product.stockCount) {
        showToast(
          'Quantity capped at available stock',
          `${product.stockCount} maximum units available for ${product.name}.`,
          'info'
        );
      }

      if (openDrawer) {
        setCartDrawerOpen(true);
      } else {
        showToast('Added to bag', `${product.name} · ${color}`, 'success');
      }
    },
    [cart, showToast]
  );

  const updateCartQty = useCallback(
    (key: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((i) => i.key !== key));
        return;
      }
      const targetItem = cart.find((i) => i.key === key);
      if (targetItem && quantity > targetItem.stockCount) {
        showToast(
          'Stock limit reached',
          `Maximum ${targetItem.stockCount} units available in stock.`,
          'info'
        );
      }
      setCart((prev) =>
        prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.stockCount, quantity) } : i))
      );
    },
    [cart, showToast]
  );

  const removeFromCart = useCallback(
    (key: string, options?: { silent?: boolean }) => {
      setCart((prev) => prev.filter((i) => i.key !== key));
      if (!options?.silent) {
        showToast('Removed from bag', undefined, 'info');
      }
    },
    [showToast]
  );

  const restoreCartItem = useCallback((item: CartItem, index?: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.key === item.key);
      if (existing) {
        return prev.map((i) =>
          i.key === item.key
            ? { ...i, quantity: Math.min(i.stockCount, i.quantity + item.quantity) }
            : i
        );
      }
      const next = [...prev];
      const safeIndex =
        typeof index === 'number' && index >= 0
          ? Math.min(index, next.length)
          : next.length;
      next.splice(safeIndex, 0, item);
      return next;
    });
  }, []);

  const saveItemForLater = useCallback(
    (key: string) => {
      const item = cart.find((i) => i.key === key);
      if (!item) return;
      setCart((prev) => prev.filter((i) => i.key !== key));
      setSavedForLater((prev) => {
        if (prev.some((s) => s.key === key)) return prev;
        return [item, ...prev];
      });
      showToast('Saved for later', item.name, 'info');
    },
    [cart, showToast]
  );

  const moveSavedToCart = useCallback(
    (key: string) => {
      const item = savedForLater.find((i) => i.key === key);
      if (!item) return;
      const liveProduct = products.find((p) => p.id === item.productId);
      const availableStock = liveProduct ? liveProduct.stockCount : item.stockCount;
      if (availableStock <= 0) {
        showToast('Out of stock', `${item.name} is currently out of stock.`, 'error');
        return;
      }
      setSavedForLater((prev) => prev.filter((i) => i.key !== key));
      setCart((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key
              ? {
                  ...i,
                  stockCount: availableStock,
                  quantity: Math.min(availableStock, i.quantity + item.quantity),
                }
              : i
          );
        }
        return [
          ...prev,
          { ...item, stockCount: availableStock, quantity: Math.min(availableStock, item.quantity) },
        ];
      });
      showToast('Moved to bag', item.name, 'success');
    },
    [products, savedForLater, showToast]
  );

  const removeSavedItem = useCallback((key: string) => {
    setSavedForLater((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedPromoCode(null);
  }, []);

  const appliedPromo = useMemo(() => {
    if (!appliedPromoCode) return null;
    return promotions.find((p) => p.code === appliedPromoCode && p.active !== false) || null;
  }, [appliedPromoCode, promotions]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const applyPromoCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Enter a promo code.' };
      const found = promotions.find((p) => p.code === code && p.active !== false);
      if (!found) {
        const activeCodes = promotions
          .filter((p) => p.active !== false)
          .map((p) => p.code)
          .join(', ');
        return {
          ok: false,
          message: activeCodes
            ? `Invalid or paused code. Active codes: ${activeCodes}.`
            : 'No active promo codes are currently available.',
        };
      }
      if (cartSubtotal < found.minSubtotal) {
        return {
          ok: false,
          message: `Code ${found.code} requires a minimum subtotal of ${formatCurrency(
            found.minSubtotal,
            currency,
            currencyConfig.rates.BDT
          )}.`,
        };
      }
      setAppliedPromoCode(found.code);
      showToast('Promo code applied', found.description, 'success');
      return { ok: true, message: found.description };
    },
    [cartSubtotal, currency, currencyConfig.rates.BDT, promotions, showToast]
  );

  const removePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    showToast('Promo code removed', undefined, 'info');
  }, [showToast]);

  const estimatedShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedPromo?.discountType === 'shipping') return 0;
    const dhakaZone = shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro');
    const threshold = dhakaZone?.freeThresholdUsd ?? 120;
    const baseFee = dhakaZone?.standardFeeUsd ?? 0.7;
    return cartSubtotal >= threshold ? 0 : baseFee;
  }, [cart.length, cartSubtotal, appliedPromo, shippingConfig.zones]);

  const cartDiscount = useMemo(() => {
    if (!appliedPromo || cartSubtotal < appliedPromo.minSubtotal) return 0;
    if (appliedPromo.discountType === 'percent') {
      return Number(((cartSubtotal * appliedPromo.value) / 100).toFixed(2));
    }
    return 0;
  }, [appliedPromo, cartSubtotal]);

  const cartTax = useMemo(() => {
    const taxable = Math.max(0, cartSubtotal - cartDiscount);
    return Number((taxable * 0.05).toFixed(2));
  }, [cartSubtotal, cartDiscount]);

  const cartTotal = useMemo(
    () =>
      Math.max(
        0,
        Number((cartSubtotal - cartDiscount + cartTax + estimatedShipping).toFixed(2))
      ),
    [cartSubtotal, cartDiscount, cartTax, estimatedShipping]
  );

  const runProtectedAction = useCallback(
    async (
      actionId: ProtectedActionId,
      executor: () => Promise<void> | void,
      options?: RunProtectedActionOptions
    ): Promise<boolean> => {
      const decision = evaluateActionAccess(actionId, profile, storePolicy);
      if (decision.allowed) {
        await executor();
        return true;
      }

      const nextPending: PendingAction = {
        actionId,
        createdAt: Date.now(),
        expiresAt: Date.now() + storePolicy.pendingActionTtlMs,
        payload: {
          productId: options?.productId,
          itemName: options?.itemName,
          orderId: options?.orderId,
          reason: options?.reason,
          address: options?.address,
          paymentMethod: options?.paymentMethod,
          review: options?.review,
          accountTab: options?.accountTab,
          preferredTab: options?.preferredTab ?? decision.defaultAuthTab,
          prefill: options?.prefill,
        },
        returnRoute: options?.returnRoute ?? {
          name: route.name,
          slug: route.slug,
          category: route.category,
          accountTab: route.accountTab,
          orderId: route.orderId,
        },
      };

      setCartDrawerOpen(false);
      setQuickViewProduct(null);
      setPendingAction(nextPending);
      writePendingActionToSession(nextPending, storePolicy.pendingActionTtlMs);
      const ctx = buildAuthPromptContext(actionId, {
        itemName: options?.itemName,
        preferredTab: options?.preferredTab ?? decision.defaultAuthTab,
        prefill: options?.prefill,
      });
      setAuthPromptContext(ctx);
      setAuthPrefill(options?.prefill);
      setAuthModalStayOnPage(false);
      setAuthModalTab(ctx.defaultTab);
      setAuthModalOpen(false);

      const returnSource = nextPending.returnRoute as RouteState | undefined;
      const returnPath =
        returnSource && returnSource.name !== 'login'
          ? serializeRouteToPath(returnSource)
          : route.name === 'login'
          ? route.redirectTo
          : serializeRouteToPath(route);

      navigate({
        name: 'login',
        accountTab: ctx.defaultTab,
        ...(returnPath && !returnPath.startsWith('/login') ? { redirectTo: returnPath } : {}),
      });
      return false;
    },
    [navigate, profile, route, storePolicy]
  );

  const executeWishlistMutation = useCallback(
    async (product: Product) => {
      if (storePolicy.wishlistAuthRequired && profile.isAuthenticated) {
        setWishlistPendingIds((prev) => (prev.includes(product.id) ? prev : [...prev, product.id]));
        const previousIds = wishlistIds;
        const alreadySaved = previousIds.includes(product.id);
        setWishlistIds((prev) =>
          alreadySaved ? prev.filter((id) => id !== product.id) : [product.id, ...prev]
        );
        try {
          const res = await toggleAccountWishlistApi(product.id);
          setWishlistIds(res.wishlistIds);
          broadcastAuthSync({ type: 'wishlist:sync' });
          showToast(
            res.added ? t(language, 'wishlistSavedToast') : t(language, 'wishlistRemovedToast'),
            product.name,
            res.added ? 'success' : 'info'
          );
        } catch (err) {
          setWishlistIds(previousIds);
          showToast(
            t(language, 'wishlistErrorToast'),
            err instanceof Error ? err.message : undefined,
            'error'
          );
        } finally {
          setWishlistPendingIds((prev) => prev.filter((id) => id !== product.id));
        }
        return;
      }

      setWishlistIds((prev) => {
        const exists = prev.includes(product.id);
        if (exists) {
          showToast(t(language, 'wishlistRemovedToast'), product.name, 'info');
          return prev.filter((id) => id !== product.id);
        }
        showToast(t(language, 'wishlistSavedToast'), product.name, 'success');
        return [product.id, ...prev];
      });
    },
    [
      broadcastAuthSync,
      language,
      profile.isAuthenticated,
      showToast,
      storePolicy.wishlistAuthRequired,
      wishlistIds,
    ]
  );

  const toggleWishlist = useCallback(
    (product: Product) => {
      if (wishlistPendingIds.includes(product.id)) return;
      void runProtectedAction(
        'wishlist:toggle',
        () => executeWishlistMutation(product),
        {
          productId: product.id,
          itemName: product.name,
        }
      );
    },
    [executeWishlistMutation, runProtectedAction, wishlistPendingIds]
  );

  const toggleCompare = useCallback(
    (product: Product) => {
      setCompareIds((prev) => {
        if (prev.includes(product.id)) {
          showToast('Removed from comparison', product.name, 'info');
          return prev.filter((id) => id !== product.id);
        }
        if (prev.length >= 4) {
          showToast('Compare limit reached', 'You can compare up to 4 products at once.', 'error');
          return prev;
        }
        showToast('Added to comparison', product.name, 'success');
        return [...prev, product.id];
      });
    },
    [showToast]
  );

  const clearCompare = useCallback(() => setCompareIds([]), []);

  const recordProductView = useCallback(
    (productId: string) => {
      if (!canPersonalizeCatalog(cookieConsent)) return;
      setRecentlyViewedIds((prev) => {
        if (prev[0] === productId) return prev;
        return [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      });
    },
    [cookieConsent]
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      if (!canTrackSearchHistory(cookieConsent)) return;
      const clean = query.trim();
      if (!clean) return;
      setRecentSearches((prev) =>
        [clean, ...prev.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
      );
    },
    [cookieConsent]
  );

  const trackOptionalEvent = useCallback(
    (name: string, meta?: { route?: string; category?: string }) => {
      return recordOptionalEvent(cookieConsent, { name, ...meta });
    },
    [cookieConsent]
  );

  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  const executeReviewSubmission = useCallback(
    async (
      productId: string,
      review: Omit<ProductReview, 'id' | 'date' | 'verified'>,
      authenticatedOverride?: boolean
    ) => {
      const isAuthed = authenticatedOverride ?? profile.isAuthenticated;
      if (isAuthed) {
        try {
          const res = await submitProductReviewApi(productId, {
            rating: review.rating,
            title: review.title,
            comment: review.comment,
          });
          setCustomReviews((prev) => ({
            ...prev,
            [productId]: [res.review, ...(prev[productId] || [])],
          }));
          showToast('Review published', 'Thank you for sharing your verified impression.', 'success');
          return;
        } catch (err) {
          showToast(
            'Unable to submit review',
            err instanceof Error ? err.message : 'Please try again.',
            'error'
          );
          return;
        }
      }

      const newReview: ProductReview = {
        ...review,
        id: `rev-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        verified: false,
      };
      setCustomReviews((prev) => ({
        ...prev,
        [productId]: [newReview, ...(prev[productId] || [])],
      }));
      showToast('Review published', 'Thank you for sharing your impression.', 'success');
    },
    [profile.isAuthenticated, showToast]
  );

  const submitProductReview = useCallback(
    (productId: string, review: Omit<ProductReview, 'id' | 'date' | 'verified'>) => {
      const target = products.find((p) => p.id === productId);
      void runProtectedAction(
        'review:submit',
        () => executeReviewSubmission(productId, review),
        {
          productId,
          itemName: target?.name,
          review: {
            productId,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
          },
        }
      );
    },
    [executeReviewSubmission, products, runProtectedAction]
  );

  const submitProductQuestion = useCallback(
    (productId: string, author: string, questionText: string) => {
      const target = products.find((p) => p.id === productId);
      const newQ: ProductQuestion = {
        id: `qa-${Date.now()}`,
        author: author.trim() || 'Shopper',
        question: questionText.trim(),
        answer: `Thank you for asking. Our ${target?.brand || 'Studio'} specialists verify that all listed specifications, warranty terms (${target?.warranty || 'manufacturer coverage'}), and variants apply to current stock batches.`,
        answeredBy: 'Kinto Concierge',
        date: new Date().toISOString().slice(0, 10),
      };
      setCustomQuestions((prev) => ({
        ...prev,
        [productId]: [newQ, ...(prev[productId] || [])],
      }));
      showToast('Question posted', 'Concierge answer attached below.', 'success');
    },
    [products, showToast]
  );

  const commitVerifiedOrder = useCallback(
    (verifiedOrder: Order) => {
      const hydrated = hydrateOrderImages([verifiedOrder])[0];
      setOrders((prev) => [hydrated, ...prev.filter((o) => o.id !== hydrated.id)]);
      if (!profile.isAuthenticated) {
        const existingGuestIds = readGuestOrderIds();
        if (!existingGuestIds.includes(hydrated.id)) {
          writeGuestOrderIds([hydrated.id, ...existingGuestIds]);
        }
      }
      clearCart();
      refreshStorefrontSync();
      refreshNotifications(profile.role);
    },
    [
      clearCart,
      hydrateOrderImages,
      profile.isAuthenticated,
      profile.role,
      refreshNotifications,
      refreshStorefrontSync,
    ]
  );

  const reorderFromOrder = useCallback(
    (order: Order) => {
      order.items.forEach((item) => {
        const liveProduct = products.find((p) => p.id === item.productId);
        if (liveProduct) {
          addToCart(liveProduct, item.color, item.colorHex, item.size, item.quantity, false);
        }
      });
      setCartDrawerOpen(true);
      showToast(`Reordered #${order.id}`, 'Items added back to your shopping bag.', 'success');
    },
    [addToCart, products, showToast]
  );

  const executeCancelOrder = useCallback(
    async (orderId: string) => {
      try {
        const updated = await performOrderCustomerActionApi(
          orderId,
          'cancel',
          'Cancelled prior to shipment via Customer Account'
        );
        setOrders((prev) => prev.map((o) => (o.id === orderId ? hydrateOrderImages([updated])[0] : o)));
        showToast(`Order #${orderId} cancelled`, 'Authorization hold will be released.', 'info');
        refreshNotifications(profile.role);
      } catch (err) {
        showToast(
          'Unable to cancel order',
          err instanceof Error ? err.message : 'Order cannot be cancelled.',
          'error'
        );
      }
    },
    [hydrateOrderImages, profile.role, refreshNotifications, showToast]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      await runProtectedAction('order:cancel', () => executeCancelOrder(orderId), { orderId });
    },
    [executeCancelOrder, runProtectedAction]
  );

  const executeReturnOrder = useCallback(
    async (orderId: string, reason?: string) => {
      try {
        const updated = await performOrderCustomerActionApi(
          orderId,
          'return',
          reason || `${policyFactsPublic.returnWindowDays}-day return requested through Customer Account`
        );
        setOrders((prev) => prev.map((o) => (o.id === orderId ? hydrateOrderImages([updated])[0] : o)));
        showToast(
          `Return initiated for #${orderId}`,
          'Prepaid pickup instructions generated.',
          'success'
        );
        refreshNotifications(profile.role);
      } catch (err) {
        showToast(
          'Return request error',
          err instanceof Error ? err.message : 'Could not initiate return.',
          'error'
        );
      }
    },
    [hydrateOrderImages, policyFactsPublic.returnWindowDays, profile.role, refreshNotifications, showToast]
  );

  const requestOrderReturn = useCallback(
    async (orderId: string, reason?: string) => {
      await runProtectedAction(
        'order:return',
        () => executeReturnOrder(orderId, reason),
        { orderId, reason }
      );
    },
    [executeReturnOrder, runProtectedAction]
  );

  const claimOrders = useCallback(
    async (orderIds?: string[]): Promise<number> => {
      if (!profile.isAuthenticated) return 0;
      try {
        const idsToClaim =
          orderIds && orderIds.length > 0 ? orderIds : readGuestOrderIds();
        const res = await claimGuestOrdersApi(idsToClaim);
        if (Array.isArray(res.orders)) {
          setOrders(hydrateOrderImages(res.orders));
        }
        writeGuestOrderIds([]);
        if (res.claimedCount > 0) {
          showToast(t(language, 'authOrderClaimedToast'), undefined, 'success');
        }
        return res.claimedCount;
      } catch {
        return 0;
      }
    },
    [hydrateOrderImages, language, profile.isAuthenticated, showToast]
  );

  const updateProfile = useCallback(
    async (updates: Partial<CustomerProfile>) => {
      setProfile((prev) => ({ ...prev, ...updates }));
      try {
        await updateProfileApi({
          fullName: updates.fullName,
          email: updates.email,
          phone: updates.phone,
          studioName: updates.studioName,
        });
      } catch {
        // Ignore offline fallback
      }
      showToast('Profile updated', undefined, 'success');
    },
    [showToast]
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        await changePasswordApi(currentPassword, newPassword);
        showToast('Password updated', 'Your session credentials have been updated.', 'success');
        return { ok: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to update password.';
        showToast('Password update failed', message, 'error');
        return { ok: false, error: message };
      }
    },
    [showToast]
  );

  const signOut = useCallback(() => {
    suppressCartSyncRef.current = true;
    void logoutWithApi();
    setOrders([]);
    setAddresses([]);
    setPaymentMethods([]);
    setWishlistIds([]);
    setCart([]);
    setAppliedPromoCode(null);
    setPendingAction(null);
    setAuthPromptContext(null);
    setAuthPrefill(undefined);
    setAuthModalOpen(false);
    writePendingActionToSession(null, storePolicy.pendingActionTtlMs);
    writeGuestOrderIds([]);
    setProfile(createGuestProfile());
    broadcastAuthSync({ type: 'auth:logout' });
    window.setTimeout(() => {
      suppressCartSyncRef.current = false;
    }, 0);
    if (route.name === 'account' || route.name === 'seller' || route.name === 'admin') {
      navigate({ name: 'home' });
    }
    showToast('Signed out', 'Your session has been closed securely.', 'info');
  }, [broadcastAuthSync, navigate, route.name, showToast, storePolicy.pendingActionTtlMs]);

  const resumePendingActionAfterAuth = useCallback(
    async (user: AccountDirectoryEntry): Promise<boolean> => {
      const activePending =
        pendingAction ?? readPendingActionFromSession(storePolicy.pendingActionTtlMs);

      setPendingAction(null);
      setAuthPromptContext(null);
      setAuthPrefill(undefined);
      writePendingActionToSession(null, storePolicy.pendingActionTtlMs);

      if (!activePending) {
        if (route.name === 'login' && route.redirectTo) {
          const resolved = resolveRedirectRoute(route.redirectTo);
          if (resolved) {
            navigate(resolved);
            return true;
          }
        }
        return false;
      }

      const payload = activePending.payload;

      if (activePending.actionId === 'seller:workspace') {
        if (user.role === 'seller' || user.role === 'admin') {
          navigate({ name: 'seller' });
        } else {
          showToast('Seller studio role required for seller portal', undefined, 'info');
          navigate({ name: 'account', accountTab: 'overview' });
        }
        return true;
      }

      if (activePending.actionId === 'admin:workspace') {
        if (user.role === 'admin') {
          navigate({ name: 'admin' });
        } else {
          showToast('Administrator access required for admin console', undefined, 'info');
          navigate({ name: 'account', accountTab: 'overview' });
        }
        return true;
      }

      if (activePending.actionId === 'wishlist:toggle' && payload?.productId) {
        try {
          const fresh = await fetchAccountWishlistApi();
          if (!fresh.includes(payload.productId)) {
            const toggled = await toggleAccountWishlistApi(payload.productId);
            setWishlistIds(toggled.wishlistIds);
            broadcastAuthSync({ type: 'wishlist:sync' });
            showToast(t(language, 'wishlistSavedToast'), payload.itemName, 'success');
          } else {
            setWishlistIds(fresh);
            showToast(t(language, 'wishlistAlreadySavedToast'), payload.itemName, 'info');
          }
        } catch {
          // Best-effort continuation
        }
      } else if (activePending.actionId === 'wishlist:view') {
        navigate({ name: 'wishlist' });
        return true;
      } else if (activePending.actionId === 'account:open') {
        navigate({ name: 'account', accountTab: payload?.accountTab || 'overview' });
        return true;
      } else if (activePending.actionId === 'address:save' && payload?.address) {
        try {
          const nextAddrs = await saveAccountAddressApi(payload.address);
          setAddresses(nextAddrs);
          showToast('Address saved', payload.address.label, 'success');
        } catch {
          // Ignore
        }
      } else if (activePending.actionId === 'payment:save' && payload?.paymentMethod) {
        try {
          const nextPms = await saveAccountPaymentMethodApi(payload.paymentMethod);
          setPaymentMethods(nextPms);
          showToast('Payment method saved', payload.paymentMethod.brand, 'success');
        } catch {
          // Ignore
        }
      } else if (activePending.actionId === 'review:submit' && payload?.review) {
        await executeReviewSubmission(
          payload.review.productId,
          {
            author: user.fullName,
            location: user.location || 'Dhaka, Bangladesh',
            rating: payload.review.rating,
            title: payload.review.title,
            comment: payload.review.comment,
          },
          true
        );
      } else if (activePending.actionId === 'order:cancel' && payload?.orderId) {
        await executeCancelOrder(payload.orderId);
      } else if (activePending.actionId === 'order:return' && payload?.orderId) {
        await executeReturnOrder(payload.orderId, payload.reason);
      } else if (activePending.actionId === 'order:claim') {
        const ids = payload?.orderId ? [payload.orderId] : readGuestOrderIds();
        if (ids.length > 0) {
          try {
            const res = await claimGuestOrdersApi(ids);
            setOrders(hydrateOrderImages(res.orders));
            writeGuestOrderIds([]);
            showToast(t(language, 'authOrderClaimedToast'), undefined, 'success');
          } catch {
            // Ignore
          }
        }
        navigate({ name: 'account', accountTab: 'orders' });
        return true;
      } else if (activePending.actionId === 'checkout:proceed') {
        navigate({ name: 'checkout' });
        return true;
      }

      if (route.name === 'login' && activePending.returnRoute) {
        navigate(activePending.returnRoute as RouteState);
      }
      return true;
    },
    [
      broadcastAuthSync,
      executeCancelOrder,
      executeReturnOrder,
      executeReviewSubmission,
      hydrateOrderImages,
      language,
      navigate,
      pendingAction,
      route.name,
      route.redirectTo,
      showToast,
      storePolicy.pendingActionTtlMs,
    ]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<AccountDirectoryEntry | null> => {
      try {
        const { user } = await loginWithApi({
          email: email.trim(),
          password,
        });
        setProfile({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          studioRole: user.roleLabel,
          studioName: user.studioName,
          isAuthenticated: true,
        });
        await hydrateAuthenticatedAccountData(user, {
          mergeGuestBag: true,
          claimGuestOrders: true,
        });
        broadcastAuthSync({ type: 'auth:login', userId: user.id });
        showToast(
          `Signed in as ${user.fullName}`,
          `${user.roleLabel} session active`,
          'success'
        );
        return user;
      } catch (err) {
        showToast(
          'Sign-in failed',
          err instanceof Error ? err.message : 'Check credentials and try again.',
          'error'
        );
        return null;
      }
    },
    [broadcastAuthSync, hydrateAuthenticatedAccountData, showToast]
  );

  const registerAccount = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      password?: string;
      role: 'customer' | 'seller';
      studioName?: string;
      acceptedPolicies: LegalAcceptanceRecord;
    }): Promise<RegisterAccountResult> => {
      try {
        const { user } = await registerWithApi(payload);
        setProfile({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          studioRole: user.roleLabel,
          studioName: user.studioName,
          isAuthenticated: true,
        });
        await hydrateAuthenticatedAccountData(user, {
          mergeGuestBag: true,
          claimGuestOrders: true,
        });
        broadcastAuthSync({ type: 'auth:login', userId: user.id });
        showToast(
          'Account registered',
          `Welcome, ${user.fullName} (${user.roleLabel})`,
          'success'
        );
        return { user };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to register account.';
        const status = err instanceof ApiError ? err.status : undefined;
        showToast('Registration failed', message, 'error');
        return { user: null, error: { message, status } };
      }
    },
    [broadcastAuthSync, hydrateAuthenticatedAccountData, showToast]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationReadApi(id);
    } catch {
      // Optimistic
    }
  }, []);

  const unreadNotificationCount = useMemo(
    () => (Array.isArray(notifications) ? notifications : []).filter((n) => !n.read).length,
    [notifications]
  );

  const executeSaveAddress = useCallback(
    async (address: Omit<Address, 'id'> & { id?: string }) => {
      try {
        const saved = await saveAccountAddressApi(address);
        setAddresses(saved);
        showToast('Address saved', address.label, 'success');
      } catch (err) {
        showToast(
          'Unable to save address',
          err instanceof Error ? err.message : 'Please check your input.',
          'error'
        );
      }
    },
    [showToast]
  );

  const saveAddress = useCallback(
    (address: Omit<Address, 'id'> & { id?: string }) => {
      void runProtectedAction(
        'address:save',
        () => executeSaveAddress(address),
        { address }
      );
    },
    [executeSaveAddress, runProtectedAction]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      if (!profile.isAuthenticated) return;
      deleteAccountAddressApi(id)
        .then((next) => {
          setAddresses(next);
          showToast('Address removed', undefined, 'info');
        })
        .catch(() => showToast('Unable to remove address', undefined, 'error'));
    },
    [profile.isAuthenticated, showToast]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      if (!profile.isAuthenticated) return;
      setDefaultAccountAddressApi(id)
        .then((next) => {
          setAddresses(next);
          showToast('Default address updated', undefined, 'success');
        })
        .catch(() => showToast('Unable to update default address', undefined, 'error'));
    },
    [profile.isAuthenticated, showToast]
  );

  const executeAddPaymentMethod = useCallback(
    async (card: Omit<PaymentMethodRecord, 'id'>) => {
      try {
        const next = await saveAccountPaymentMethodApi(card);
        setPaymentMethods(next);
        showToast('Payment method saved', `${card.brand} (${card.referenceMasked})`, 'success');
      } catch (err) {
        showToast(
          'Unable to save payment method',
          err instanceof Error ? err.message : 'Please try again.',
          'error'
        );
      }
    },
    [showToast]
  );

  const addPaymentMethod = useCallback(
    (card: Omit<PaymentMethodRecord, 'id'>) => {
      void runProtectedAction(
        'payment:save',
        () => executeAddPaymentMethod(card),
        { paymentMethod: card }
      );
    },
    [executeAddPaymentMethod, runProtectedAction]
  );

  const deletePaymentMethod = useCallback(
    (id: string) => {
      if (!profile.isAuthenticated) return;
      deleteAccountPaymentMethodApi(id)
        .then((next) => {
          setPaymentMethods(next);
          showToast('Payment method removed', undefined, 'info');
        })
        .catch(() => showToast('Unable to remove payment method', undefined, 'error'));
    },
    [profile.isAuthenticated, showToast]
  );

  const setDefaultPaymentMethod = useCallback(
    (id: string) => {
      if (!profile.isAuthenticated) return;
      setDefaultAccountPaymentMethodApi(id)
        .then((next) => {
          setPaymentMethods(next);
          showToast('Default payment method updated', undefined, 'success');
        })
        .catch(() => showToast('Unable to update default card', undefined, 'error'));
    },
    [profile.isAuthenticated, showToast]
  );

  const setNotificationPrefs = useCallback(
    (prefs: NotificationPrefs) => {
      setNotificationPrefsState(prefs);
      showToast('Notification preferences saved', undefined, 'success');
    },
    [showToast]
  );

  const activeCookieVersion = useMemo(
    () => publishedPolicies.find((p) => p.id === 'cookie-policy')?.currentVersion || LEGAL_VERSION,
    [publishedPolicies]
  );

  const setPrivacyPrefs = useCallback(
    (prefs: PrivacyPrefs) => {
      setPrivacyPrefsState(prefs);
      const nextConsent: CookieConsentState = {
        version: activeCookieVersion,
        status: 'custom',
        decidedAt: new Date().toISOString(),
        necessary: true,
        saveSearchHistory: prefs.saveSearchHistory,
        personalizedCatalog: prefs.personalizedCatalog,
        analyticsOptIn: prefs.analyticsOptIn,
      };
      setCookieConsent(nextConsent);
      clearGatedStorage(nextConsent);
      if (!prefs.saveSearchHistory) {
        setRecentSearches([]);
      }
      if (!prefs.personalizedCatalog) {
        setRecentlyViewedIds([]);
      }
      showToast('Privacy settings updated', undefined, 'success');
    },
    [activeCookieVersion, showToast]
  );

  const openCookiePreferences = useCallback(() => setCookieModalOpen(true), []);
  const closeCookiePreferences = useCallback(() => setCookieModalOpen(false), []);

  const acceptAllCookies = useCallback(() => {
    const nextPrefs: PrivacyPrefs = {
      saveSearchHistory: true,
      personalizedCatalog: true,
      analyticsOptIn: true,
    };
    setPrivacyPrefsState(nextPrefs);
    setCookieConsent({
      version: activeCookieVersion,
      status: 'all',
      decidedAt: new Date().toISOString(),
      necessary: true,
      ...nextPrefs,
    });
    setCookieModalOpen(false);
    showToast('Cookie preferences saved', 'All optional storefront preferences enabled.', 'success');
  }, [activeCookieVersion, showToast]);

  const rejectNonEssentialCookies = useCallback(() => {
    const nextPrefs: PrivacyPrefs = {
      saveSearchHistory: false,
      personalizedCatalog: false,
      analyticsOptIn: false,
    };
    setPrivacyPrefsState(nextPrefs);
    setRecentSearches([]);
    setRecentlyViewedIds([]);
    const nextConsent: CookieConsentState = {
      version: activeCookieVersion,
      status: 'essential-only',
      decidedAt: new Date().toISOString(),
      necessary: true,
      ...nextPrefs,
    };
    clearGatedStorage(nextConsent);
    setCookieConsent(nextConsent);
    setCookieModalOpen(false);
    showToast('Essential cookies only', 'Non-essential personalization and diagnostics disabled.', 'info');
  }, [activeCookieVersion, showToast]);

  const saveCookiePreferences = useCallback(
    (prefs: PrivacyPrefs) => {
      setPrivacyPrefsState(prefs);
      if (!prefs.saveSearchHistory) {
        setRecentSearches([]);
      }
      if (!prefs.personalizedCatalog) {
        setRecentlyViewedIds([]);
      }
      const nextConsent: CookieConsentState = {
        version: activeCookieVersion,
        status: 'custom',
        decidedAt: new Date().toISOString(),
        necessary: true,
        ...prefs,
      };
      clearGatedStorage(nextConsent);
      setCookieConsent(nextConsent);
      setCookieModalOpen(false);
      showToast('Cookie preferences updated', undefined, 'success');
    },
    [activeCookieVersion, showToast]
  );

  const openPolicyPreview = useCallback((id: LegalDocumentId) => setPreviewPolicyId(id), []);
  const closePolicyPreview = useCallback(() => setPreviewPolicyId(null), []);

  const value = useMemo<StoreContextValue>(
    () => ({
      route,
      navigationDirection,
      canGoBack,
      navigate,
      goBack,
      storefrontLoading,
      catalogError,
      retryCatalogLoad,
      categoryNodes,
      categories,
      getCategoryNodeBySlug,
      getDescendantSlugs,
      products,
      language,
      setLanguage,
      toggleLanguage,
      currency,
      currencyConfig,
      shippingConfig,
      setCurrency,
      toggleCurrency,
      cart,
      savedForLater,
      wishlistIds,
      compareIds,
      recentlyViewedIds,
      recentSearches,
      appliedPromo,
      cartDrawerOpen,
      setCartDrawerOpen,
      quickViewProduct,
      setQuickViewProduct,
      toasts,
      showToast,
      dismissToast,
      addToCart,
      updateCartQty,
      removeFromCart,
      restoreCartItem,
      saveItemForLater,
      moveSavedToCart,
      removeSavedItem,
      clearCart,
      applyPromoCode,
      removePromoCode,
      cartSubtotal,
      cartDiscount,
      cartTax,
      estimatedShipping,
      cartTotal,
      cartItemCount,
      toggleWishlist,
      toggleCompare,
      clearCompare,
      recordProductView,
      addRecentSearch,
      clearRecentSearches,
      submitProductReview,
      submitProductQuestion,
      orders,
      commitVerifiedOrder,
      reorderFromOrder,
      cancelOrder,
      requestOrderReturn,
      refreshOrders,
      refreshStorefrontSync,
      storePolicy,
      pendingAction,
      authPromptContext,
      authPrefill,
      wishlistPendingIds,
      profile,
      authLoading,
      authModalOpen,
      setAuthModalOpen,
      authModalTab,
      setAuthModalTab,
      authModalStayOnPage,
      openAuthModal,
      cancelAuthPrompt,
      runProtectedAction,
      resumePendingActionAfterAuth,
      claimOrders,
      updateProfile,
      changePassword,
      signOut,
      signIn,
      registerAccount,
      notifications,
      unreadNotificationCount,
      markNotificationRead,
      addresses,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod,
      notificationPrefs,
      setNotificationPrefs,
      privacyPrefs,
      setPrivacyPrefs,
      cookieConsent,
      cookieModalOpen,
      openCookiePreferences,
      closeCookiePreferences,
      acceptAllCookies,
      rejectNonEssentialCookies,
      saveCookiePreferences,
      previewPolicyId,
      openPolicyPreview,
      closePolicyPreview,
      publishedPolicies,
      policyFactsPublic,
      cookieInventory,
      enabledPaymentMethods,
      refreshPublishedPolicies,
      trackOptionalEvent,
    }),
    [
      route,
      navigationDirection,
      canGoBack,
      navigate,
      goBack,
      storefrontLoading,
      catalogError,
      retryCatalogLoad,
      categoryNodes,
      categories,
      getCategoryNodeBySlug,
      getDescendantSlugs,
      products,
      language,
      setLanguage,
      toggleLanguage,
      currency,
      currencyConfig,
      shippingConfig,
      setCurrency,
      toggleCurrency,
      cart,
      savedForLater,
      wishlistIds,
      compareIds,
      recentlyViewedIds,
      recentSearches,
      appliedPromo,
      cartDrawerOpen,
      quickViewProduct,
      toasts,
      showToast,
      dismissToast,
      addToCart,
      updateCartQty,
      removeFromCart,
      restoreCartItem,
      saveItemForLater,
      moveSavedToCart,
      removeSavedItem,
      clearCart,
      applyPromoCode,
      removePromoCode,
      cartSubtotal,
      cartDiscount,
      cartTax,
      estimatedShipping,
      cartTotal,
      cartItemCount,
      toggleWishlist,
      toggleCompare,
      clearCompare,
      recordProductView,
      addRecentSearch,
      clearRecentSearches,
      submitProductReview,
      submitProductQuestion,
      orders,
      commitVerifiedOrder,
      reorderFromOrder,
      cancelOrder,
      requestOrderReturn,
      refreshOrders,
      refreshStorefrontSync,
      storePolicy,
      pendingAction,
      authPromptContext,
      authPrefill,
      wishlistPendingIds,
      profile,
      authLoading,
      authModalOpen,
      authModalTab,
      authModalStayOnPage,
      openAuthModal,
      cancelAuthPrompt,
      runProtectedAction,
      resumePendingActionAfterAuth,
      claimOrders,
      updateProfile,
      changePassword,
      signOut,
      signIn,
      registerAccount,
      notifications,
      unreadNotificationCount,
      markNotificationRead,
      addresses,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod,
      notificationPrefs,
      setNotificationPrefs,
      privacyPrefs,
      setPrivacyPrefs,
      cookieConsent,
      cookieModalOpen,
      openCookiePreferences,
      closeCookiePreferences,
      acceptAllCookies,
      rejectNonEssentialCookies,
      saveCookiePreferences,
      previewPolicyId,
      openPolicyPreview,
      closePolicyPreview,
      publishedPolicies,
      policyFactsPublic,
      cookieInventory,
      enabledPaymentMethods,
      refreshPublishedPolicies,
      trackOptionalEvent,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
