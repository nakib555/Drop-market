import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
  INITIAL_PAYMENT_METHODS,
  PRODUCTS,
  PROMO_CODES,
} from '../data/catalog';
import {
  clearStoredToken,
  createOrderApi,
  fetchAuthAccounts,
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
  CategorySlug,
  CustomerProfile,
  DeliveryMethodId,
  DynamicCategoryRecord,
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
  RouteName,
  StoreNotification,
} from '../types/commerce';
import { CurrencyCode, formatCurrency } from '../utils/format';
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

interface CheckoutPayload {
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: {
    country: string;
    state: string;
    city: string;
    area: string;
    streetAddress: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
}

interface StoreContextValue {
  route: RouteState;
  navigationDirection: NavigationDirection;
  canGoBack: boolean;
  navigate: (next: RouteState) => void;
  goBack: () => void;
  storefrontLoading: boolean;
  categories: CategoryMeta[];
  products: Product[];
  currency: CurrencyCode;
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
  placeOrder: (payload: CheckoutPayload) => Order;
  reorderFromOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  requestOrderReturn: (orderId: string, reason?: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshStorefrontSync: () => Promise<void>;
  profile: CustomerProfile;
  authAccounts: AccountDirectoryEntry[];
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'signin' | 'register';
  setAuthModalTab: (tab: 'signin' | 'register') => void;
  openAuthModal: (tab?: 'signin' | 'register') => void;
  updateProfile: (updates: Partial<CustomerProfile>) => Promise<void>;
  logoutDemo: () => void;
  loginDemo: (email?: string, password?: string) => Promise<AccountDirectoryEntry | null>;
  switchDemoAccount: (accountId: string) => Promise<AccountDirectoryEntry | null>;
  registerAccount: (payload: {
    fullName: string;
    email: string;
    phone?: string;
    password?: string;
    role: 'customer' | 'seller';
    studioName?: string;
  }) => Promise<AccountDirectoryEntry | null>;
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
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    readStorage<CurrencyCode>('kinto-currency', 'USD')
  );
  const [cart, setCart] = useState<CartItem[]>(() => readStorage('kinto-cart', []));
  const [savedForLater, setSavedForLater] = useState<CartItem[]>(() =>
    readStorage('kinto-saved', [])
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>(() =>
    readStorage('kinto-wishlist', [
      'prod-aeterna-headphones',
      'prod-kuro-lounge',
      'prod-botanical-serum',
    ])
  );
  const [compareIds, setCompareIds] = useState<string[]>(() => readStorage('kinto-compare', []));
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    readStorage('kinto-recent-views', ['prod-merino-overshirt', 'prod-coffee-pourover'])
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readStorage('kinto-recent-searches', [
      'Wireless Headphones',
      'Merino Overshirt',
      'Botanical Serum',
    ])
  );
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(() =>
    readStorage('kinto-promo', null)
  );
  const [orders, setOrders] = useState<Order[]>(() => readStorage('kinto-orders', INITIAL_ORDERS));
  const [customReviews, setCustomReviews] = useState<Record<string, ProductReview[]>>(() =>
    readStorage('kinto-reviews', {})
  );
  const [customQuestions, setCustomQuestions] = useState<Record<string, ProductQuestion[]>>(() =>
    readStorage('kinto-questions', {})
  );

  // API-driven auth, accounts directory, notifications, and live catalog sync
  const [authAccounts, setAuthAccounts] = useState<AccountDirectoryEntry[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [storefrontLoading, setStorefrontLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'register'>('signin');
  const [profile, setProfile] = useState<CustomerProfile>(() =>
    readStorage('kinto-profile', {
      id: 'guest',
      fullName: 'Guest Visitor',
      email: 'alex.mercer@studio.example',
      phone: '+1 (415) 555-0194',
      role: 'customer',
      studioRole: 'Guest Visitor',
      isAuthenticated: false,
    })
  );
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [productOverrides, setProductOverrides] = useState<Record<string, ProductOverride>>({});
  const [sellerProducts, setSellerProducts] = useState<ApiSellerProductRecord[]>([]);
  const [customCategories, setCustomCategories] = useState<DynamicCategoryRecord[]>([]);

  const [addresses, setAddresses] = useState<Address[]>(() =>
    readStorage('kinto-addresses', INITIAL_ADDRESSES)
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>(() =>
    readStorage('kinto-payment-methods', INITIAL_PAYMENT_METHODS)
  );
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

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const hydrateOrderImages = useCallback((apiOrders: Order[]): Order[] => {
    return apiOrders.map((ord) => ({
      ...ord,
      items: ord.items.map((item) => {
        if (item.image) return item;
        const matched = PRODUCTS.find((p) => p.id === item.productId);
        return {
          ...item,
          image: matched?.images[0] || resolveImagePreset(undefined, item.category),
        };
      }),
    }));
  }, []);

  const refreshStorefrontSync = useCallback(async () => {
    try {
      const sync = await fetchStorefrontSync();
      setProductOverrides(sync.productOverrides || {});
      setSellerProducts(sync.sellerProducts || []);
      setCustomCategories(sync.customCategories || []);
    } catch {
      // Static deploy fallback uses base bundled catalog
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const apiOrders = await fetchOrdersApi();
      setOrders(hydrateOrderImages(apiOrders));
    } catch {
      // Keep local cached orders
    }
  }, [hydrateOrderImages]);

  const refreshNotifications = useCallback(async (role: CustomerProfile['role']) => {
    try {
      const list = await fetchNotificationsApi(role);
      setNotifications(list);
    } catch {
      // Ignore if offline
    }
  }, []);

  // Hydrate multi-role accounts, active user session, storefront sync, and API orders on mount
  useEffect(() => {
    let active = true;
    async function initApi() {
      setAuthLoading(true);
      setStorefrontLoading(true);
      try {
        const [accountsRes, meRes, syncRes, ordersRes] = await Promise.allSettled([
          fetchAuthAccounts(),
          fetchCurrentUser(),
          fetchStorefrontSync(),
          fetchOrdersApi(),
        ]);

        if (!active) return;

        if (accountsRes.status === 'fulfilled') {
          setAuthAccounts(accountsRes.value);
        }
        if (meRes.status === 'fulfilled' && Boolean(getStoredToken()) && profile.isAuthenticated) {
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
        }
        if (syncRes.status === 'fulfilled') {
          setProductOverrides(syncRes.value.productOverrides || {});
          setSellerProducts(syncRes.value.sellerProducts || []);
          setCustomCategories(syncRes.value.customCategories || []);
        }
        if (ordersRes.status === 'fulfilled') {
          setOrders(hydrateOrderImages(ordersRes.value));
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
  }, [hydrateOrderImages]);

  useEffect(() => {
    refreshNotifications(profile.role || 'customer');
  }, [profile.role, refreshNotifications]);

  // Merge base categories + admin-added dynamic categories
  const categories = useMemo<CategoryMeta[]>(() => {
    const mappedDynamic: CategoryMeta[] = customCategories.map((dc) => ({
      id: dc.id,
      slug: dc.slug,
      name: dc.name,
      shortName: dc.shortName,
      description: dc.description,
      bannerTagline: dc.bannerTagline,
      image: resolveImagePreset(dc.imagePresetKey, dc.slug),
      countLabel: dc.countLabel,
      subcategories: dc.subcategories,
      featuredBrands: dc.featuredBrands,
      filterFacets: dc.filterFacets,
    }));
    return [...CATEGORIES, ...mappedDynamic];
  }, [customCategories]);

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

    const combinedBase = [...mappedSellerProducts, ...PRODUCTS];

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
  }, [customReviews, customQuestions, productOverrides, sellerProducts]);

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

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      setCurrencyState(next);
      showToast(
        `Display currency set to ${next}`,
        next === 'BDT' ? 'Showing approximate BDT (৳) equivalents.' : 'Showing prices in USD ($).',
        'info'
      );
    },
    [showToast]
  );

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === 'USD' ? 'BDT' : 'USD');
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
      setSavedForLater((prev) => prev.filter((i) => i.key !== key));
      setCart((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(i.stockCount, i.quantity + item.quantity) } : i
          );
        }
        return [...prev, item];
      });
      showToast('Moved to bag', item.name, 'success');
    },
    [savedForLater, showToast]
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
            currency
          )}.`,
        };
      }
      setAppliedPromoCode(found.code);
      showToast('Promo code applied', found.description, 'success');
      return { ok: true, message: found.description };
    },
    [cartSubtotal, currency, showToast]
  );

  const removePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    showToast('Promo code removed', undefined, 'info');
  }, [showToast]);

  const estimatedShipping = useMemo(() => {
    if (cart.length === 0) return 0;
    if (appliedPromo?.discountType === 'shipping') return 0;
    return cartSubtotal >= 500 ? 0 : 28;
  }, [cart.length, cartSubtotal, appliedPromo]);

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

  const recordProductView = useCallback((productId: string) => {
    setRecentlyViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  }, []);

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

  const placeOrder = useCallback(
    (payload: CheckoutPayload): Order => {
      const deliveryLabels: Record<
        DeliveryMethodId,
        { label: string; cost: number; eta: string; courier: string }
      > = {
        standard: {
          label: 'Standard Ground Delivery',
          cost: cartSubtotal >= 500 || appliedPromo?.discountType === 'shipping' ? 0 : 28,
          eta: 'Nov 20 – Nov 22, 2026',
          courier: 'UPS / Kinto Regional Ground',
        },
        express: {
          label: 'Express Insured Courier',
          cost: appliedPromo?.discountType === 'shipping' ? 0 : 48,
          eta: 'Nov 16 – Nov 17, 2026',
          courier: 'Priority Express Courier',
        },
        'white-glove': {
          label: 'White-Glove Room Placement',
          cost: 125,
          eta: 'Nov 21 – Nov 25, 2026',
          courier: 'Kinto Dedicated White-Glove',
        },
      };

      const paymentLabels: Record<PaymentMethodId, string> = {
        card: 'Credit / Debit Card',
        wallet: 'Digital Wallet',
        bkash: 'bKash Mobile Wallet (Demo)',
        nagad: 'Nagad Mobile Wallet (Demo)',
        rocket: 'Rocket Mobile Banking (Demo)',
        'bank-transfer': 'Direct Bank Transfer',
        cod: 'Cash on Delivery (COD)',
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
            note: 'Order received and confirmed (simulated checkout)',
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
          // Keep optimistic local order
        });
      clearCart();
      return newOrder;
    },
    [appliedPromo, cart, cartDiscount, cartSubtotal, cartTax, clearCart, profile.role, refreshNotifications]
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

  const logoutDemo = useCallback(() => {
    clearStoredToken();
    setProfile((prev) => ({
      ...prev,
      fullName: 'Guest Visitor',
      studioRole: 'Guest Visitor',
      studioName: undefined,
      role: 'customer',
      isAuthenticated: false,
    }));
    showToast('Signed out', 'Select an account or sign in to continue.', 'info');
  }, [showToast]);

  const loginDemo = useCallback(
    async (email?: string, password?: string): Promise<AccountDirectoryEntry | null> => {
      try {
        const { user } = await loginWithApi({
          email: email || profile.email,
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
        refreshNotifications(user.role);
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
    [profile.email, refreshNotifications, showToast]
  );

  const switchDemoAccount = useCallback(
    async (accountId: string): Promise<AccountDirectoryEntry | null> => {
      try {
        const { user } = await loginWithApi({ accountId });
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
        refreshNotifications(user.role);
        showToast(
          `Signed in as ${user.fullName}`,
          user.studioName || user.roleLabel,
          'success'
        );
        return user;
      } catch (err) {
        showToast(
          'Role switch failed',
          err instanceof Error ? err.message : 'Could not switch account.',
          'error'
        );
        return null;
      }
    },
    [refreshNotifications, showToast]
  );

  const registerAccount = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone?: string;
      password?: string;
      role: 'customer' | 'seller';
      studioName?: string;
    }): Promise<AccountDirectoryEntry | null> => {
      try {
        const { user } = await registerWithApi(payload);
        setAuthAccounts((prev) => [user, ...prev]);
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
        refreshNotifications(user.role);
        showToast(
          'Account registered',
          `Welcome, ${user.fullName} (${user.roleLabel})`,
          'success'
        );
        return user;
      } catch (err) {
        showToast(
          'Registration failed',
          err instanceof Error ? err.message : 'Unable to register account.',
          'error'
        );
        return null;
      }
    },
    [refreshNotifications, showToast]
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
    () => notifications.filter((n) => !n.read).length,
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
      showToast('Payment method saved', `${card.brand} ending in ${card.last4}`, 'success');
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
      showToast('Privacy settings updated', undefined, 'success');
    },
    [showToast]
  );

  const value: StoreContextValue = {
    route,
    navigationDirection,
    canGoBack,
    navigate,
    goBack,
    storefrontLoading,
    categories,
    products,
    currency,
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
    placeOrder,
    reorderFromOrder,
    cancelOrder,
    requestOrderReturn,
    refreshOrders,
    refreshStorefrontSync,
    profile,
    authAccounts,
    authLoading,
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    openAuthModal,
    updateProfile,
    logoutDemo,
    loginDemo,
    switchDemoAccount,
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
