import { useCallback, useEffect, useRef, useState } from 'react';
import { CategoryMeta, CategorySlug, Product, RouteName } from '../types/commerce';
import { normalizeCategorySlug } from '../../server/shared/marketplaceSchema';

export type NavigationDirection = 1 | -1;

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
  redirectTo?: string;
  policyVersion?: string;
}

const PAGE_TITLES: Record<RouteName, string> = {
  home: 'KINTO STUDIO — Everyday Goods & Multi-Department Store',
  shop: 'Shop All Products — KINTO STUDIO',
  category: 'Department — KINTO STUDIO',
  product: 'Product Details — KINTO STUDIO',
  search: 'Search Products — KINTO STUDIO',
  cart: 'Shopping Bag — KINTO STUDIO',
  wishlist: 'Wishlist — KINTO STUDIO',
  checkout: 'Checkout — KINTO STUDIO',
  account: 'My Account — KINTO STUDIO',
  login: 'Sign In — KINTO STUDIO',
  seller: 'Seller Dashboard — KINTO STUDIO',
  admin: 'Admin Console — KINTO STUDIO',
  'track-order': 'Track Order — KINTO STUDIO',
  compare: 'Product Comparison — KINTO STUDIO',
  brands: 'Featured Brands — KINTO STUDIO',
  offers: 'Special Offers — KINTO STUDIO',
  journal: 'Journal — KINTO STUDIO',
  about: 'About Kinto Studio',
  contact: 'Contact & Support — KINTO STUDIO',
  faq: 'Help & FAQ — KINTO STUDIO',
  legal: 'Policies & Legal — KINTO STUDIO',
  'shipping-policy': 'Shipping & Delivery Policy — KINTO STUDIO',
  'return-policy': 'Return & Refund Policy — KINTO STUDIO',
  'cancellation-policy': 'Cancellation Policy — KINTO STUDIO',
  'payment-policy': 'Payment & Billing Policy — KINTO STUDIO',
  'warranty-policy': 'Warranty Policy — KINTO STUDIO',
  'privacy-policy': 'Privacy Policy — KINTO STUDIO',
  'cookie-policy': 'Cookie Policy — KINTO STUDIO',
  terms: 'Terms & Conditions — KINTO STUDIO',
  'seller-agreement': 'Seller Terms — KINTO STUDIO',
  'marketplace-terms': 'Marketplace Terms — KINTO STUDIO',
  'prohibited-items': 'Prohibited Items Policy — KINTO STUDIO',
  'product-safety': 'Product Safety Information — KINTO STUDIO',
  'acceptable-use': 'Acceptable Use Policy — KINTO STUDIO',
  'intellectual-property': 'Intellectual Property Policy — KINTO STUDIO',
  'customer-support-policy': 'Contact, Complaints & Dispute Resolution — KINTO STUDIO',
  'data-retention-policy': 'Data Retention Policy — KINTO STUDIO',
  accessibility: 'Accessibility — KINTO STUDIO',
  'reviews-policy': 'Reviews, Ratings & UGC Policy — KINTO STUDIO',
  'promo-terms': 'Promotions, Coupons & Discount Terms — KINTO STUDIO',
  'international-orders-policy': 'Cross-Border & International Orders Policy — KINTO STUDIO',
  maintenance: 'Maintenance Notice — KINTO STUDIO',
  'not-found': 'Page Not Found — KINTO STUDIO',
};

const ROUTE_DEPTH: Record<RouteName, number> = {
  home: 0,
  shop: 1,
  category: 1,
  offers: 1,
  brands: 1,
  journal: 1,
  search: 2,
  compare: 2,
  wishlist: 2,
  about: 2,
  contact: 2,
  faq: 2,
  legal: 2,
  'shipping-policy': 2,
  'return-policy': 2,
  'cancellation-policy': 2,
  'payment-policy': 2,
  'warranty-policy': 2,
  'privacy-policy': 2,
  'cookie-policy': 2,
  terms: 2,
  'seller-agreement': 2,
  'marketplace-terms': 2,
  'prohibited-items': 2,
  'product-safety': 2,
  'acceptable-use': 2,
  'intellectual-property': 2,
  'customer-support-policy': 2,
  'data-retention-policy': 2,
  accessibility: 2,
  'reviews-policy': 2,
  'promo-terms': 2,
  'international-orders-policy': 2,
  maintenance: 2,
  'not-found': 2,
  product: 3,
  account: 3,
  login: 3,
  seller: 3,
  admin: 3,
  cart: 4,
  checkout: 5,
  'track-order': 6,
};

const PEER_ROUTE_ORDER: Partial<Record<RouteName, number>> = {
  home: 0,
  shop: 1,
  category: 2,
  offers: 3,
  brands: 4,
  journal: 5,
  about: 6,
  contact: 7,
  faq: 8,
  search: 9,
  wishlist: 10,
  compare: 11,
  product: 12,
  account: 13,
  login: 14,
  seller: 15,
  admin: 16,
  cart: 17,
  checkout: 18,
  'track-order': 19,
  legal: 20,
  terms: 21,
  'privacy-policy': 22,
  'data-retention-policy': 23,
  'cookie-policy': 24,
  'shipping-policy': 25,
  'return-policy': 26,
  'cancellation-policy': 27,
  'payment-policy': 28,
  'warranty-policy': 29,
  'marketplace-terms': 30,
  'seller-agreement': 31,
  'prohibited-items': 32,
  'product-safety': 33,
  'acceptable-use': 34,
  'intellectual-property': 35,
  'customer-support-policy': 36,
  accessibility: 37,
  'reviews-policy': 38,
  'promo-terms': 39,
  'international-orders-policy': 40,
};

const VALID_ROUTES: RouteName[] = [
  'home',
  'shop',
  'category',
  'product',
  'search',
  'cart',
  'wishlist',
  'checkout',
  'account',
  'login',
  'seller',
  'admin',
  'track-order',
  'compare',
  'brands',
  'offers',
  'journal',
  'about',
  'contact',
  'faq',
  'legal',
  'shipping-policy',
  'return-policy',
  'cancellation-policy',
  'payment-policy',
  'warranty-policy',
  'privacy-policy',
  'cookie-policy',
  'terms',
  'seller-agreement',
  'marketplace-terms',
  'prohibited-items',
  'product-safety',
  'acceptable-use',
  'intellectual-property',
  'customer-support-policy',
  'data-retention-policy',
  'accessibility',
  'reviews-policy',
  'promo-terms',
  'international-orders-policy',
  'maintenance',
  'not-found',
];

const POLICY_ROUTE_SET = new Set<RouteName>([
  'terms',
  'privacy-policy',
  'cookie-policy',
  'shipping-policy',
  'return-policy',
  'cancellation-policy',
  'payment-policy',
  'warranty-policy',
  'seller-agreement',
  'marketplace-terms',
  'prohibited-items',
  'product-safety',
  'acceptable-use',
  'intellectual-property',
  'customer-support-policy',
  'data-retention-policy',
  'accessibility',
  'reviews-policy',
  'promo-terms',
  'international-orders-policy',
]);

export function getRouteKey(route: RouteState): string {
  return [
    route.name,
    route.slug || '',
    route.category || '',
    route.subcategory || '',
    route.brand || '',
    route.collection || '',
    route.query || '',
    route.accountTab || '',
    route.orderId || '',
    route.redirectTo || '',
    route.policyVersion || '',
  ].join(':');
}

export function parseLocationToRoute(
  pathnameArg?: string,
  searchArg?: string,
  hashArg?: string
): RouteState {
  const rawHash =
    typeof hashArg === 'string'
      ? hashArg
      : typeof window !== 'undefined'
      ? window.location.hash
      : '';
  const rawPathname =
    typeof pathnameArg === 'string'
      ? pathnameArg
      : typeof window !== 'undefined'
      ? window.location.pathname
      : '/';
  const rawSearch =
    typeof searchArg === 'string'
      ? searchArg
      : typeof window !== 'undefined'
      ? window.location.search
      : '';

  let pathPart = rawPathname || '/';
  let queryPart = rawSearch.replace(/^\?/, '');

  // Support legacy #/... hash URLs gracefully
  if (rawHash && rawHash.startsWith('#/')) {
    const hashBody = rawHash.replace(/^#\/?/, '');
    const [hPath, hQuery] = hashBody.split('?');
    pathPart = hPath || '/';
    if (hQuery) queryPart = hQuery;
  }

  const cleanPath = pathPart.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return { name: 'home' };

  const segments = cleanPath.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
  const searchParams = new URLSearchParams(queryPart);
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
  if (first === 'login') {
    const tab = searchParams.get('tab') === 'register' ? 'register' : 'signin';
    const redirect = searchParams.get('redirect');
    return {
      name: 'login',
      accountTab: tab,
      ...(redirect ? { redirectTo: redirect } : {}),
    };
  }
  if (first === 'seller') {
    return { name: 'seller', accountTab: 'seller-hub' };
  }
  if (first === 'admin') {
    return { name: 'admin', accountTab: 'admin-console' };
  }
  if (first === 'track-order') {
    return { name: 'track-order', orderId: searchParams.get('id') || segments[1] || '' };
  }

  if (VALID_ROUTES.includes(first)) {
    if (POLICY_ROUTE_SET.has(first)) {
      const ver = searchParams.get('version')?.trim();
      return ver ? { name: first, policyVersion: ver } : { name: first };
    }
    return { name: first };
  }
  return { name: 'not-found' };
}

export function serializeRouteToPath(route: RouteState): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'product':
      return `/product/${encodeURIComponent(route.slug || '')}`;
    case 'category': {
      const p = new URLSearchParams();
      if (route.subcategory) p.set('sub', route.subcategory);
      if (route.brand) p.set('brand', route.brand);
      const qs = p.toString();
      const base = `/category/${route.category || 'home-furniture-kitchen'}`;
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
      return qs ? `/shop?${qs}` : '/shop';
    }
    case 'search':
      return route.query ? `/search?q=${encodeURIComponent(route.query)}` : '/search';
    case 'account':
      return route.accountTab && route.accountTab !== 'overview'
        ? `/account/${encodeURIComponent(route.accountTab)}`
        : '/account';
    case 'login': {
      const p = new URLSearchParams();
      if (route.accountTab === 'register') p.set('tab', 'register');
      if (route.redirectTo) p.set('redirect', route.redirectTo);
      const qs = p.toString();
      return qs ? `/login?${qs}` : '/login';
    }
    case 'seller':
      return '/seller';
    case 'admin':
      return '/admin';
    case 'track-order':
      return route.orderId ? `/track-order?id=${encodeURIComponent(route.orderId)}` : '/track-order';
    default: {
      if (POLICY_ROUTE_SET.has(route.name) && route.policyVersion) {
        return `/${route.name}?version=${encodeURIComponent(route.policyVersion)}`;
      }
      return `/${route.name}`;
    }
  }
}

export function resolveRedirectRoute(rawRedirect?: string): RouteState | null {
  if (!rawRedirect) return null;
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith('/')) return null;
  const [pathnamePart, searchPart = ''] = trimmed.split('?');
  const parsed = parseLocationToRoute(
    pathnamePart || '/',
    searchPart ? `?${searchPart}` : '',
    ''
  );
  if (parsed.name === 'login' || parsed.name === 'not-found') {
    return null;
  }
  return parsed;
}

export function parseHashToRoute(): RouteState {
  return parseLocationToRoute();
}

export function serializeRouteToHash(route: RouteState): string {
  return `#${serializeRouteToPath(route)}`;
}

export function computeRouteDirection(prev: RouteState, next: RouteState): NavigationDirection {
  const prevDepth = ROUTE_DEPTH[prev.name] ?? 2;
  const nextDepth = ROUTE_DEPTH[next.name] ?? 2;

  if (nextDepth !== prevDepth) {
    return nextDepth > prevDepth ? 1 : -1;
  }

  const prevPeer = PEER_ROUTE_ORDER[prev.name] ?? 0;
  const nextPeer = PEER_ROUTE_ORDER[next.name] ?? 0;
  if (nextPeer !== prevPeer) {
    return nextPeer > prevPeer ? 1 : -1;
  }

  return 1;
}

export function resolveDocumentTitle(
  route: RouteState,
  products: Product[],
  categories: CategoryMeta[]
): string {
  if (route.name === 'product' && route.slug) {
    const found = products.find((p) => p.slug === route.slug);
    return found ? `${found.name} — KINTO STUDIO` : 'Product Not Found — KINTO STUDIO';
  }
  if (route.name === 'category' && route.category) {
    const foundCat = categories.find((c) => c.slug === route.category);
    return foundCat ? foundCat.seoTitle || `${foundCat.name} — KINTO STUDIO` : PAGE_TITLES.category;
  }
  return PAGE_TITLES[route.name] || PAGE_TITLES.home;
}

export interface NavigationController {
  route: RouteState;
  navigationDirection: NavigationDirection;
  canGoBack: boolean;
  navigate: (next: RouteState) => void;
  goBack: () => void;
}

function getCurrentBrowserPath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname || '/'}${window.location.search || ''}`;
}

export function useNavigationController(
  _products: Product[],
  _categories: CategoryMeta[]
): NavigationController {
  const [route, setRoute] = useState<RouteState>(() => parseLocationToRoute());
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>(1);

  const initialRoute = route;
  const routeRef = useRef<RouteState>(initialRoute);
  const historyRef = useRef<{ stack: RouteState[]; index: number }>({
    stack: [initialRoute],
    index: 0,
  });
  const [canGoBack, setCanGoBack] = useState(false);

  // Normalize any legacy #/... hash URL into a clean History API path on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
      const normalized = serializeRouteToPath(parseLocationToRoute());
      if (getCurrentBrowserPath() !== normalized || window.location.hash) {
        window.history.replaceState({ kintoRoute: getRouteKey(routeRef.current) }, '', normalized);
      }
    }
  }, []);

  const commitRouteTransition = useCallback(
    (next: RouteState, explicitDirection?: NavigationDirection, pushToStack = true) => {
      const prev = routeRef.current;
      const nextKey = getRouteKey(next);
      const prevKey = getRouteKey(prev);
      const history = historyRef.current;

      let resolvedDirection: NavigationDirection =
        explicitDirection ?? computeRouteDirection(prev, next);

      if (pushToStack && nextKey !== prevKey) {
        const previousEntry = history.index > 0 ? history.stack[history.index - 1] : undefined;
        if (previousEntry && getRouteKey(previousEntry) === nextKey) {
          history.index -= 1;
          resolvedDirection = explicitDirection ?? -1;
        } else {
          const trimmed = history.stack.slice(0, history.index + 1);
          trimmed.push(next);
          history.stack = trimmed.slice(-30);
          history.index = history.stack.length - 1;
        }
      }

      routeRef.current = next;
      setNavigationDirection(resolvedDirection);
      setRoute(next);
      setCanGoBack(history.index > 0);
    },
    []
  );

  useEffect(() => {
    const syncFromLocation = () => {
      const next = parseLocationToRoute();
      if (window.location.hash.startsWith('#/')) {
        const normalized = serializeRouteToPath(next);
        window.history.replaceState({ kintoRoute: getRouteKey(next) }, '', normalized);
      }
      const nextKey = getRouteKey(next);
      const history = historyRef.current;
      let backIdx = -1;
      for (let i = history.index - 1; i >= 0; i -= 1) {
        if (getRouteKey(history.stack[i]) === nextKey) {
          backIdx = i;
          break;
        }
      }
      const forwardIdx = history.stack
        .slice(history.index + 1)
        .findIndex((entry) => getRouteKey(entry) === nextKey);

      if (backIdx !== -1) {
        history.index = backIdx;
        commitRouteTransition(next, -1, false);
      } else if (forwardIdx !== -1) {
        history.index = history.index + 1 + forwardIdx;
        commitRouteTransition(next, 1, false);
      } else {
        commitRouteTransition(next, undefined, true);
      }

      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, [commitRouteTransition]);

  const navigate = useCallback(
    (next: RouteState) => {
      const targetPath = serializeRouteToPath(next);
      const direction = computeRouteDirection(routeRef.current, next);
      const currentPath = getCurrentBrowserPath();

      if (currentPath !== targetPath || window.location.hash.startsWith('#/')) {
        window.history.pushState({ kintoRoute: getRouteKey(next) }, '', targetPath);
        commitRouteTransition(next, direction, true);
      } else {
        commitRouteTransition(next, direction, false);
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    },
    [commitRouteTransition]
  );

  const goBack = useCallback(() => {
    const history = historyRef.current;
    if (history.index > 0) {
      const previous = history.stack[history.index - 1];
      const targetPath = serializeRouteToPath(previous);
      history.index -= 1;
      if (getCurrentBrowserPath() !== targetPath) {
        window.history.pushState({ kintoRoute: getRouteKey(previous) }, '', targetPath);
      }
      commitRouteTransition(previous, -1, false);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }
    navigate({ name: 'home' });
  }, [commitRouteTransition, navigate]);

  return {
    route,
    navigationDirection,
    canGoBack,
    navigate,
    goBack,
  };
}
