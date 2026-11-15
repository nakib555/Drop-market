import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ADDRESSES,
  INITIAL_CATEGORY_TREE,
  INITIAL_PAYMENT_METHODS,
  PROMO_CODES,
  buildCategoryMetasFromNodes,
  getDescendantCategorySlugs,
} from '../data/catalog';
import { getCachedDummyJsonProductsSync } from '../../server/shared/dummyJsonCatalog';
import {
  ApiError,
  changePasswordApi,
  clearStoredToken,
  createOrderApi,
  fetchCatalogProductsApi,
  fetchCurrentUser,
  fetchNotificationsApi,
  fetchOrdersApi,
  fetchStorefrontSync,
  getStoredToken,
  loginWithApi,
  markNotificationReadApi,
  performOrderCustomerActionApi,
  registerWithApi,
  updateProfileApi,
} from '../services/api';
import { readStorage, writeStorage } from '../services/storage';
import {
  AccountDirectoryEntry,
  Address,
  ApiSellerProductRecord,
  CartItem,
  CategoryMeta,
  CategoryNode,
  CookieConsentState,
  CurrencyCode,
  CurrencyRateState,
  CustomerProfile,
  DeliveryMethodId,
  LanguageCode,
  LegalAcceptanceRecord,
  LegalDocumentId,
  NotificationPrefs,
  Order,
  PaymentMethodId,
  PaymentMethodRecord,
  PrivacyPrefs,
  Product,
  ProductOverride,
  ProductQuestion,
  ProductReview,
  PromoCode,
  ShippingRuleConfig,
  StoreNotification,
} from '../types/commerce';
import { LEGAL_VERSION } from '../data/legalPolicies';
import {
  DEFAULT_BDT_RATE,
  FREE_SHIPPING_THRESHOLD_USD,
  formatCurrency,
  isProductOutOfStock,
  setGlobalBdtRate,
} from '../utils/format';
import { resolveImagePreset } from '../utils/imagePresets';
import {
  NavigationDirection,
  RouteState,
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

interface CheckoutPayload {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: {
    country: string;
    state: string;
    city: string;
    upazila?: string;
    area: string;
    streetAddress: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
  paymentReference?: string;
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
  removeFromCart: (key: string) => void;
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
  placeOrder: (payload: CheckoutPayload) => Order;
  reorderFromOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  requestOrderReturn: (orderId: string, reason?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshStorefrontSync: () => Promise<void>;
  profile: CustomerProfile;
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'register';
  setAuthModalTab: (tab: 'signin' | 'register') => void;
  openAuthModal: (tab?: 'signin' | 'register') => void;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logoutDemo: () => void;
  loginDemo: (email: string, password: string) => Promise<AccountDirectoryEntry | null>;
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
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() =>
    readStorage<LanguageCode>('kinto-language', 'en')
  );
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    readStorage<CurrencyCode>('kinto-currency', 'BDT')
  );
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyRateState>(DEFAULT_CURRENCY_STATE);
  const [shippingConfig, setShippingConfig] = useState<ShippingRuleConfig>(DEFAULT_SHIPPING_CONFIG);

  const [cart, setCart] = useState<CartItem[]>(() => readStorage('kinto-cart', []));
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() =>
    readStorage('kinto-saved', [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStorage('kinto-wishlist', [])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() => readStorage('kinto-compare', []));
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    readStorage('kinto-recent-views', [])
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readStorage('kinto-recent-searches', ['iPhone', 'MacBook', 'Perfume'])
  );
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(() =>
    readStorage('kinto-promo', null)
  );
  const [orders, setOrders] = useState<Order[]>(() => readStorage('kinto-orders', []));
  const [customReviews, setCustomReviews] = useState<Record<string, ProductReview[]>>(() =>
    readStorage('kinto-reviews', {})
  );
  const [customQuestions, setCustomQuestions] = useState<Record<string, ProductQuestion[]>>(() =>
    readStorage('kinto-questions', {})
  );

  // API-driven auth, notifications, and live catalog sync
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [storefrontLoading, setStorefrontLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [profile, setProfile] = useState<CustomerProfile>(() => {
    const guestProfile: CustomerProfile = {
      id: 'guest',
      fullName: '',
      email: '',
      phone: '',
      role: 'customer',
      studioRole: 'Guest',
      isAuthenticated: false,
    };
    const stored = readStorage<CustomerProfile>('kinto-profile', guestProfile);
    if (!getStoredToken() || stored.email === 'alex.mercer@studio.example') {
      return guestProfile;
    }
    return stored;
  });
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [apiProducts, setApiProducts] = useState<Product[]>(() =>
    getCachedDummyJsonProductsSync()
  );
  const [productOverrides, setProductOverrides] = useState<Record<string, ProductOverride>>({});
  const [sellerProducts, setSellerProducts] = useState<ApiSellerProductRecord[]>([]);
  const [categoryNodes, setCategoryNodes] = useState<CategoryNode[]>(INITIAL_CATEGORY_TREE);

  const [addresses, setAddresses] = useState<Address[]>(() => {
    const stored = readStorage<Address[]>('kinto-addresses', INITIAL_ADDRESSES);
    return Array.isArray(stored)
      ? stored.filter((a) => a.city !== 'San Francisco' && a.city !== 'Portland')
      : [];
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>(() => {
    const stored = readStorage<Array<PaymentMethodRecord & { last4?: string }>>(
      'kinto-payment-methods',
      INITIAL_PAYMENT_METHODS
    );
    return Array.isArray(stored)
      ? stored.filter((pm) => !('last4' in pm && pm.last4) && Boolean(pm.referenceMasked))
      : [];
  });
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
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [previewPolicyId, setPreviewPolicyId] = useState<LegalDocumentId | null>(null);

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

  useEffect(() => {
    let active = true;
    const hasExistingCatalog = apiProductsRef.current.length > 0;
    async function initApi() {
      setAuthLoading(true);
      if (!hasExistingCatalog) {
        setStorefrontLoading(true);
      }
      try {
        const hasToken = Boolean(getStoredToken());
        const [catalogRes, syncRes, meRes, ordersRes] = await Promise.allSettled([
          fetchCatalogProductsApi(),
          fetchStorefrontSync(),
          hasToken ? fetchCurrentUser() : Promise.reject(new Error('No active session')),
          hasToken ? fetchOrdersApi() : Promise.resolve([]),
        ]);

        if (!active) return;

        const loadedCatalog =
          catalogRes.status === 'fulfilled' && Array.isArray(catalogRes.value)
            ? catalogRes.value
            : getCachedDummyJsonProductsSync();

        if (loadedCatalog.length > 0) {
          setApiProducts(loadedCatalog);
        }

        if (meRes.status === 'fulfilled' && meRes.value && hasToken) {
          const u = meRes.value;
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
        } else if (hasToken && meRes.status === 'rejected') {
          clearStoredToken();
          setProfile({
            id: 'guest',
            fullName: '',
            email: '',
            phone: '',
            role: 'customer',
            studioRole: 'Guest',
            isAuthenticated: false,
          });
        }
        if (syncRes.status === 'fulfilled' && syncRes.value) {
          applySyncPayload(syncRes.value);
        }
        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          setOrders(hydrateOrderImages(ordersRes.value, loadedCatalog));
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
  }, [applySyncPayload, hydrateOrderImages]);

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

    const combinedBase = [...mappedSellerProducts, ...hydratedApiProducts];

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

      if (extraReviews.length === 0) {
        return extraQuestions.length > 0
          ? { ...baseWithOverride, questions: mergedQuestions }
          : baseWithOverride;
      }

      const mergedReviews = [...extraReviews, ...baseWithOverride.reviews];
      const totalScore =
        baseWithOverride.rating * baseWithOverride.reviewCount +
        extraReviews.reduce((sum, r) => sum + r.rating, 0);
      const totalCount = baseWithOverride.reviewCount + extraReviews.length;
      return {
        ...baseWithOverride,
        reviews: mergedReviews,
        reviewCount: totalCount,
        rating: Number((totalScore / totalCount).toFixed(1)),
        questions: mergedQuestions,
      };
    });
  }, [apiProducts, customReviews, customQuestions, productOverrides, sellerProducts]);

  useEffect(() => {
    writeStorage('kinto-language', language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    }
  }, [language]);
  useEffect(() => writeStorage('kinto-currency', currency), [currency]);
  useEffect(() => writeStorage('kinto-cart', cart), [cart]);
  useEffect(() => writeStorage('kinto-saved', savedForLater), [savedForLater]);
  useEffect(() => writeStorage('kinto-wishlist', wishlistIds), [wishlistIds]);
  useEffect(() => writeStorage('kinto-compare', compareIds), [compareIds]);
  useEffect(() => writeStorage('kinto-recent-views', recentlyViewedIds), [recentlyViewedIds]);
  useEffect(() => writeStorage('kinto-recent-searches', recentSearches), [recentSearches]);
  useEffect(() => writeStorage('kinto-promo', appliedPromoCode), [appliedPromoCode]);
  useEffect(() => writeStorage('kinto-orders', orders), [orders]);
  useEffect(() => writeStorage('kinto-reviews', customReviews), [customReviews]);
  useEffect(() => writeStorage('kinto-questions', customQuestions), [customQuestions]);
  useEffect(() => writeStorage('kinto-profile', profile), [profile]);
  useEffect(() => writeStorage('kinto-addresses', addresses), [addresses]);
  useEffect(() => writeStorage('kinto-payment-methods', paymentMethods), [paymentMethods]);
  useEffect(() => writeStorage('kinto-notif-prefs', notificationPrefs), [notificationPrefs]);
  useEffect(() => writeStorage('kinto-privacy-prefs', privacyPrefs), [privacyPrefs]);
  useEffect(() => writeStorage('kinto-cookie-consent', cookieConsent), [cookieConsent]);

  const { route, navigationDirection, canGoBack, navigate, goBack } = useNavigationController(
    products,
    categories
  );

  const openAuthModal = useCallback(
    (tab: 'signin' | 'register' = 'signin') => {
      setAuthModalTab(tab);
      setAuthModalOpen(false);
      navigate({ name: 'login', accountTab: tab });
    },
    [navigate]
  );

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
      showToast(
        next === 'bn' ? 'ভাষা বাংলায় পরিবর্তন করা হয়েছে' : 'Display language set to English',
        undefined,
        'info'
      );
    },
    [showToast]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'bn' : 'en');
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
    (key: string) => {
      setCart((prev) => prev.filter((i) => i.key !== key));
      showToast('Removed from bag', undefined, 'info');
    },
    [showToast]
  );

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
    return PROMO_CODES.find((p) => p.code === appliedPromoCode) || null;
  }, [appliedPromoCode]);

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
      const found = PROMO_CODES.find((p) => p.code === code);
      if (!found) {
        return { ok: false, message: 'Invalid code. Try STUDIO15, WELCOME10, or FREESHIP.' };
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
    [cartSubtotal, currency, currencyConfig.rates.BDT, showToast]
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

  const toggleWishlist = useCallback(
    (product: Product) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(product.id);
        if (exists) {
          showToast('Removed from wishlist', product.name, 'info');
          return prev.filter((id) => id !== product.id);
        }
        showToast('Saved to wishlist', product.name, 'success');
        return [product.id, ...prev];
      });
    },
    [showToast]
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
      if (!privacyPrefs.personalizedCatalog) return;
      setRecentlyViewedIds((prev) => {
        if (prev[0] === productId) return prev;
        return [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      });
    },
    [privacyPrefs.personalizedCatalog]
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      if (!privacyPrefs.saveSearchHistory) return;
      const clean = query.trim();
      if (!clean) return;
      setRecentSearches((prev) =>
        [clean, ...prev.filter((q) => q.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
      );
    },
    [privacyPrefs.saveSearchHistory]
  );

  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  const submitProductReview = useCallback(
    (productId: string, review: Omit<ProductReview, 'id' | 'date' | 'verified'>) => {
      const newReview: ProductReview = {
        ...review,
        id: `rev-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        verified: profile.isAuthenticated,
      };
      setCustomReviews((prev) => ({
        ...prev,
        [productId]: [newReview, ...(prev[productId] || [])],
      }));
      showToast('Review published', 'Thank you for sharing your verified impression.', 'success');
    },
    [profile.isAuthenticated, showToast]
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
      clearCart();
      refreshStorefrontSync();
      refreshNotifications(profile.role);
    },
    [clearCart, hydrateOrderImages, profile.role, refreshNotifications, refreshStorefrontSync]
  );

  const placeOrder = useCallback(
    (payload: CheckoutPayload): Order => {
      const deliveryLabels: Record<
        DeliveryMethodId,
        { label: string; cost: number; eta: string; courier: string }
      > = {
        standard: {
          label: 'Standard Tracked Courier',
          cost:
            cartSubtotal >= FREE_SHIPPING_THRESHOLD_USD || appliedPromo?.discountType === 'shipping'
              ? 0
              : 1.5,
          eta: '2–4 Business Days',
          courier: 'Steadfast & Pathao Studio Ground',
        },
        express: {
          label: 'Express Priority Dispatch',
          cost: appliedPromo?.discountType === 'shipping' ? 0 : 2.9,
          eta: 'Next Business Day',
          courier: 'RedX Priority Air & Same-Day',
        },
        'white-glove': {
          label: 'White-Glove Room Placement',
          cost: 12,
          eta: 'Scheduled 2–5 Days',
          courier: 'Kinto Atelier Specialist Fleet',
        },
      };

      const paymentLabels: Record<PaymentMethodId, string> = {
        bkash: 'bKash Mobile Wallet',
        nagad: 'Nagad Mobile Wallet',
        rocket: 'Rocket (DBBL)',
        visa: 'Visa Card',
        mastercard: 'Mastercard',
        cod: 'Cash on Delivery (Bangladesh)',
        sslcommerz: 'SSLCommerz Multi-Channel',
        'bank-transfer': 'Direct Bank Transfer',
        card: payload.paymentReference ? `Card ending in ${payload.paymentReference}` : 'Credit / Debit Card',
        wallet: 'Digital Wallet',
      };

      const delivery = deliveryLabels[payload.deliveryMethod];
      const finalTotal = Math.max(
        0,
        Number((cartSubtotal - cartDiscount + cartTax + delivery.cost).toFixed(2))
      );
      const orderId = `KS-${Math.floor(10500 + Math.random() * 89000)}`;
      const nowLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date());

      const isBd = payload.shippingAddress.country.toLowerCase() === 'bangladesh';
      const settleCurrency: CurrencyCode = isBd ? 'BDT' : currency;
      const rate = settleCurrency === 'BDT' ? currencyConfig.rates.BDT : 1;
      const chargedTotal =
        settleCurrency === 'BDT' ? Math.ceil(finalTotal * rate) : finalTotal;

      const newOrder: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        customerName: payload.customerName,
        email: payload.email,
        phone: payload.phone,
        shippingAddress: payload.shippingAddress,
        deliveryMethod: payload.deliveryMethod,
        deliveryLabel: delivery.label,
        estimatedArrival: delivery.eta,
        courierName: delivery.courier,
        trackingNumber: `KS-TRK-${Math.floor(1000000 + Math.random() * 8999999)}`,
        paymentMethod: payload.paymentMethod,
        paymentLabel: paymentLabels[payload.paymentMethod],
        paymentStatus: payload.paymentMethod === 'cod' ? 'cod_pending' : 'paid',
        transactionRef: `KS-LOCAL-${Math.floor(100000 + Math.random() * 899999)}`,
        gatewayProvider: 'Kinto Checkout Ledger',
        currencySnapshot: {
          baseCurrency: 'USD',
          transactionCurrency: settleCurrency,
          exchangeRate: rate,
          rateSource: currencyConfig.source,
          rateTimestamp: currencyConfig.updatedAt,
          roundingRule: currencyConfig.roundingRules[settleCurrency].mode,
          baseSubtotalUsd: cartSubtotal,
          baseTotalUsd: finalTotal,
          chargedTotal,
        },
        promoCode: appliedPromo?.code,
        items: [...cart],
        subtotal: cartSubtotal,
        shippingCost: delivery.cost,
        taxAmount: cartTax,
        discountAmount: cartDiscount,
        total: finalTotal,
        currentStage: 'Confirmed',
        timeline: [
          {
            stage: 'Confirmed',
            timestamp: nowLabel,
            note: 'Order received and verified',
            completed: true,
          },
          {
            stage: 'Processing',
            timestamp: 'Pending',
            note: 'Quality check & fulfillment allocation',
            completed: false,
          },
          {
            stage: 'Packed',
            timestamp: 'Pending',
            note: 'Protective packaging & seal',
            completed: false,
          },
          {
            stage: 'Shipped',
            timestamp: 'Pending',
            note: `Handover to ${delivery.courier}`,
            completed: false,
          },
          {
            stage: 'Out for Delivery',
            timestamp: 'Pending',
            note: 'Local courier transit',
            completed: false,
          },
          {
            stage: 'Delivered',
            timestamp: delivery.eta,
            note: 'Confirmation at delivery address',
            completed: false,
          },
        ],
      };

      setOrders((prev) => [newOrder, ...prev]);
      createOrderApi(newOrder)
        .then(() => refreshNotifications(profile.role))
        .catch(() => {
          showToast('Order saved locally for preview', 'Offline tracking remains active.', 'info');
        });
      clearCart();
      return newOrder;
    },
    [
      appliedPromo,
      cart,
      cartDiscount,
      cartSubtotal,
      cartTax,
      clearCart,
      currency,
      currencyConfig,
      profile.role,
      refreshNotifications,
      showToast,
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

  const cancelOrder = useCallback(
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

  const requestOrderReturn = useCallback(
    async (orderId: string, reason?: string) => {
      try {
        const updated = await performOrderCustomerActionApi(
          orderId,
          'return',
          reason || '30-day return requested through Customer Account'
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
    [hydrateOrderImages, profile.role, refreshNotifications, showToast]
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

  const logoutDemo = useCallback(() => {
    clearStoredToken();
    setOrders([]);
    setProfile({
      id: 'guest',
      fullName: '',
      email: '',
      phone: '',
      role: 'customer',
      studioRole: 'Guest',
      studioName: undefined,
      isAuthenticated: false,
    });
    showToast('Signed out', 'Your session has been closed securely.', 'info');
  }, [showToast]);

  const loginDemo = useCallback(
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
        await Promise.all([refreshOrders(), refreshNotifications(user.role)]);
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
    [refreshNotifications, refreshOrders, showToast]
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
        await Promise.all([refreshOrders(), refreshNotifications(user.role)]);
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
    [refreshNotifications, refreshOrders, showToast]
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

  const saveAddress = useCallback(
    (address: Omit<Address, 'id'> & { id?: string }) => {
      setAddresses((prev) => {
        let next = [...prev];
        if (address.isDefault) {
          next = next.map((a) => ({ ...a, isDefault: false }));
        }
        if (address.id) {
          return next.map((a) => (a.id === address.id ? { ...address, id: address.id } : a));
        }
        const id = `addr-${Date.now()}`;
        return [
          { ...address, id, isDefault: next.length === 0 ? true : address.isDefault },
          ...next,
        ];
      });
      showToast('Address saved', address.label, 'success');
    },
    [showToast]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address removed', undefined, 'info');
    },
    [showToast]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      showToast('Default address updated', undefined, 'success');
    },
    [showToast]
  );

  const addPaymentMethod = useCallback(
    (card: Omit<PaymentMethodRecord, 'id'>) => {
      setPaymentMethods((prev) => {
        const base = card.isDefault ? prev.map((p) => ({ ...p, isDefault: false })) : prev;
        return [{ ...card, id: `pm-${Date.now()}` }, ...base];
      });
      showToast('Payment method saved', `${card.brand} (${card.referenceMasked})`, 'success');
    },
    [showToast]
  );

  const deletePaymentMethod = useCallback(
    (id: string) => {
      setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
      showToast('Payment method removed', undefined, 'info');
    },
    [showToast]
  );

  const setDefaultPaymentMethod = useCallback(
    (id: string) => {
      setPaymentMethods((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
      showToast('Default card updated', undefined, 'success');
    },
    [showToast]
  );

  const setNotificationPrefs = useCallback(
    (prefs: NotificationPrefs) => {
      setNotificationPrefsState(prefs);
      showToast('Notification preferences saved', undefined, 'success');
    },
    [showToast]
  );

  const setPrivacyPrefs = useCallback(
    (prefs: PrivacyPrefs) => {
      setPrivacyPrefsState(prefs);
      setCookieConsent({
        version: LEGAL_VERSION,
        status: 'custom',
        decidedAt: new Date().toISOString(),
        necessary: true,
        saveSearchHistory: prefs.saveSearchHistory,
        personalizedCatalog: prefs.personalizedCatalog,
        analyticsOptIn: prefs.analyticsOptIn,
      });
      if (!prefs.saveSearchHistory) {
        setRecentSearches([]);
      }
      showToast('Privacy settings updated', undefined, 'success');
    },
    [showToast]
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
      version: LEGAL_VERSION,
      status: 'all',
      decidedAt: new Date().toISOString(),
      necessary: true,
      ...nextPrefs,
    });
    setCookieModalOpen(false);
    showToast('Cookie preferences saved', 'All optional storefront preferences enabled.', 'success');
  }, [showToast]);

  const rejectNonEssentialCookies = useCallback(() => {
    const nextPrefs: PrivacyPrefs = {
      saveSearchHistory: false,
      personalizedCatalog: false,
      analyticsOptIn: false,
    };
    setPrivacyPrefsState(nextPrefs);
    setRecentSearches([]);
    setCookieConsent({
      version: LEGAL_VERSION,
      status: 'essential-only',
      decidedAt: new Date().toISOString(),
      necessary: true,
      ...nextPrefs,
    });
    setCookieModalOpen(false);
    showToast('Essential cookies only', 'Non-essential personalization and diagnostics disabled.', 'info');
  }, [showToast]);

  const saveCookiePreferences = useCallback(
    (prefs: PrivacyPrefs) => {
      setPrivacyPrefsState(prefs);
      if (!prefs.saveSearchHistory) {
        setRecentSearches([]);
      }
      setCookieConsent({
        version: LEGAL_VERSION,
        status: 'custom',
        decidedAt: new Date().toISOString(),
        necessary: true,
        ...prefs,
      });
      setCookieModalOpen(false);
      showToast('Cookie preferences updated', undefined, 'success');
    },
    [showToast]
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
      placeOrder,
      reorderFromOrder,
      cancelOrder,
      requestOrderReturn,
      refreshOrders,
      refreshStorefrontSync,
      profile,
      authLoading,
      authModalOpen,
      setAuthModalOpen,
      authModalTab,
      setAuthModalTab,
      openAuthModal,
      updateProfile,
      changePassword,
      logoutDemo,
      loginDemo,
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
    }),
    [
      route,
      navigationDirection,
      canGoBack,
      navigate,
      goBack,
      storefrontLoading,
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
      placeOrder,
      reorderFromOrder,
      cancelOrder,
      requestOrderReturn,
      refreshOrders,
      refreshStorefrontSync,
      profile,
      authLoading,
      authModalOpen,
      authModalTab,
      openAuthModal,
      updateProfile,
      changePassword,
      logoutDemo,
      loginDemo,
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
