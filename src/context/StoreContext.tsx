import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES,
  INITIAL_ADDRESSES,
  INITIAL_ORDERS,
  INITIAL_PAYMENT_METHODS,
  PRODUCTS,
  PROMO_CODES,
} from '../data/catalog';
import { readStorage, writeStorage } from '../services/storage';
import {
  Address,
  CartItem,
  CategoryMeta,
  CategorySlug,
  CustomerProfile,
  DeliveryMethodId,
  NotificationPrefs,
  Order,
  PaymentMethodId,
  PaymentMethodRecord,
  PrivacyPrefs,
  Product,
  ProductQuestion,
  ProductReview,
  PromoCode,
  RouteName,
} from '../types/commerce';
import { CurrencyCode, formatCurrency } from '../utils/format';

export interface RouteState {
  name: RouteName;
  slug?: string;
  category?: CategorySlug | 'all';
  subcategory?: string;
  brand?: string;
  query?: string;
  collection?: 'trending' | 'best-sellers' | 'new-arrivals' | 'offers';
  accountTab?: string;
  orderId?: string;
}

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
  navigate: (next: RouteState) => void;
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
  profile: CustomerProfile;
  updateProfile: (updates: Partial<CustomerProfile>) => void;
  logoutDemo: () => void;
  loginDemo: (email?: string) => void;
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

const PAGE_TITLES: Record<RouteName, string> = {
  home: 'KINTO STUDIO — Everything You Need. All in One Place.',
  shop: 'Shop Marketplace — KINTO STUDIO',
  category: 'Department — KINTO STUDIO',
  product: 'Product Details — KINTO STUDIO',
  search: 'Search Catalog — KINTO STUDIO',
  cart: 'Shopping Bag — KINTO STUDIO',
  wishlist: 'Saved Wishlist — KINTO STUDIO',
  checkout: 'Checkout — KINTO STUDIO',
  account: 'Customer Account — KINTO STUDIO',
  'track-order': 'Order Tracking — KINTO STUDIO',
  compare: 'Compare Specifications — KINTO STUDIO',
  brands: 'Partner Brands & Makers — KINTO STUDIO',
  offers: 'Seasonal Offers — KINTO STUDIO',
  journal: 'Studio Journal — KINTO STUDIO',
  about: 'About Kinto Studio',
  contact: 'Contact Us — KINTO STUDIO',
  faq: 'Frequently Asked Questions — KINTO STUDIO',
  'shipping-policy': 'Shipping & Delivery Policy — KINTO STUDIO',
  'return-policy': 'Returns & Refunds — KINTO STUDIO',
  'privacy-policy': 'Privacy Policy — KINTO STUDIO',
  terms: 'Terms & Conditions — KINTO STUDIO',
  maintenance: 'Scheduled Maintenance — KINTO STUDIO',
  'not-found': 'Page Not Found — KINTO STUDIO',
};

const LEGACY_CATEGORY_MAP: Record<string, CategorySlug> = {
  seating: 'home-living',
  lighting: 'home-living',
  'tables-storage': 'home-living',
  'ceramics-glass': 'home-living',
  'textiles-objects': 'home-living',
  'electronics-audio': 'electronics-tech',
  'apparel-accessories': 'fashion-apparel',
  'beauty-wellness': 'beauty-care',
  'outdoor-travel': 'sports-outdoor',
  'pantry-coffee': 'grocery-food',
};

function normalizeCategorySlug(raw: string | null | undefined): CategorySlug | 'all' {
  if (!raw || raw === 'all') return 'all';
  return LEGACY_CATEGORY_MAP[raw] || (raw as CategorySlug);
}

function parseHashToRoute(): RouteState {
  if (typeof window === 'undefined') return { name: 'home' };
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { name: 'home' };

  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const searchParams = new URLSearchParams(queryPart || '');

  const first = segments[0] as RouteName;
  if (first === 'product' && segments[1]) {
    return { name: 'product', slug: segments[1] };
  }
  if (first === 'category' && segments[1]) {
    return {
      name: 'category',
      category: normalizeCategorySlug(segments[1]),
      subcategory: searchParams.get('sub') || undefined,
      brand: searchParams.get('brand') || undefined,
    };
  }
  if (first === 'shop') {
    const col = searchParams.get('collection') as RouteState['collection'] | null;
    const cat = normalizeCategorySlug(searchParams.get('category'));
    return {
      name: 'shop',
      collection: col || undefined,
      category: cat,
      subcategory: searchParams.get('sub') || undefined,
      brand: searchParams.get('brand') || undefined,
      query: searchParams.get('q') || undefined,
    };
  }
  if (first === 'search') {
    return { name: 'search', query: searchParams.get('q') || '' };
  }
  if (first === 'account') {
    return { name: 'account', accountTab: segments[1] || 'overview' };
  }
  if (first === 'track-order') {
    return { name: 'track-order', orderId: searchParams.get('id') || segments[1] || '' };
  }

  const validRoutes: RouteName[] = [
    'home',
    'shop',
    'category',
    'product',
    'search',
    'cart',
    'wishlist',
    'checkout',
    'account',
    'track-order',
    'compare',
    'brands',
    'offers',
    'journal',
    'about',
    'contact',
    'faq',
    'shipping-policy',
    'return-policy',
    'privacy-policy',
    'terms',
    'maintenance',
    'not-found',
  ];
  if (validRoutes.includes(first)) {
    return { name: first };
  }
  return { name: 'not-found' };
}

function serializeRouteToHash(route: RouteState): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'product':
      return `#/product/${route.slug || ''}`;
    case 'category': {
      const p = new URLSearchParams();
      if (route.subcategory) p.set('sub', route.subcategory);
      if (route.brand) p.set('brand', route.brand);
      const qs = p.toString();
      const base = `#/category/${route.category || 'home-living'}`;
      return qs ? `${base}?${qs}` : base;
    }
    case 'shop': {
      const p = new URLSearchParams();
      if (route.collection) p.set('collection', route.collection);
      if (route.category && route.category !== 'all') p.set('category', route.category);
      if (route.subcategory) p.set('sub', route.subcategory);
      if (route.brand) p.set('brand', route.brand);
      if (route.query) p.set('q', route.query);
      const qs = p.toString();
      return qs ? `#/shop?${qs}` : '#/shop';
    }
    case 'search':
      return route.query ? `#/search?q=${encodeURIComponent(route.query)}` : '#/search';
    case 'account':
      return route.accountTab ? `#/account/${route.accountTab}` : '#/account';
    case 'track-order':
      return route.orderId ? `#/track-order?id=${encodeURIComponent(route.orderId)}` : '#/track-order';
    default:
      return `#/${route.name}`;
  }
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteState>(parseHashToRoute);
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
  const [profile, setProfile] = useState<CustomerProfile>(() =>
    readStorage('kinto-profile', {
      fullName: 'Alex Mercer',
      email: 'alex.mercer@studio.example',
      phone: '+1 (415) 555-0194',
      studioRole: 'Marketplace Member',
      isAuthenticated: true,
    })
  );
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

  const products = useMemo(() => {
    return PRODUCTS.map((p) => {
      const extraReviews = customReviews[p.id] || [];
      const extraQuestions = customQuestions[p.id] || [];
      const mergedQuestions = [...extraQuestions, ...(p.questions || [])];

      if (extraReviews.length === 0) {
        return extraQuestions.length > 0 ? { ...p, questions: mergedQuestions } : p;
      }

      const mergedReviews = [...extraReviews, ...p.reviews];
      const totalScore =
        p.rating * p.reviewCount + extraReviews.reduce((sum, r) => sum + r.rating, 0);
      const totalCount = p.reviewCount + extraReviews.length;
      return {
        ...p,
        reviews: mergedReviews,
        reviewCount: totalCount,
        rating: Number((totalScore / totalCount).toFixed(1)),
        questions: mergedQuestions,
      };
    });
  }, [customReviews, customQuestions]);

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

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashToRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (route.name === 'product' && route.slug) {
      const found = products.find((p) => p.slug === route.slug);
      document.title = found ? `${found.name} — KINTO STUDIO` : PAGE_TITLES.product;
    } else if (route.name === 'category' && route.category) {
      const foundCat = CATEGORIES.find((c) => c.slug === route.category);
      document.title = foundCat ? `${foundCat.name} — KINTO STUDIO` : PAGE_TITLES.category;
    } else {
      document.title = PAGE_TITLES[route.name] || PAGE_TITLES.home;
    }
  }, [route, products]);

  const navigate = useCallback((next: RouteState) => {
    const targetHash = serializeRouteToHash(next);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute(next);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      const target = PRODUCTS.find((p) => p.id === productId);
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
    [showToast]
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
      clearCart();
      return newOrder;
    },
    [appliedPromo, cart, cartDiscount, cartSubtotal, cartTax, clearCart]
  );

  const updateProfile = useCallback(
    (updates: Partial<CustomerProfile>) => {
      setProfile((prev) => ({ ...prev, ...updates }));
      showToast('Profile updated', undefined, 'success');
    },
    [showToast]
  );

  const logoutDemo = useCallback(() => {
    setProfile((prev) => ({ ...prev, isAuthenticated: false }));
    showToast('Signed out', 'You are browsing as a guest.', 'info');
  }, [showToast]);

  const loginDemo = useCallback(
    (email?: string) => {
      setProfile((prev) => ({
        ...prev,
        email: email || prev.email,
        isAuthenticated: true,
      }));
      showToast('Signed in', 'Welcome back to your Kinto Studio account.', 'success');
    },
    [showToast]
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
    navigate,
    categories: CATEGORIES,
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
    profile,
    updateProfile,
    logoutDemo,
    loginDemo,
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
