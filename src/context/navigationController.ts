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
}

const PAGE_TITLES: Record<RouteName, string> = {
  home: 'KINTO STUDIO — Everything You Need. All in One Place.',
  shop: 'Shop Marketplace — KINTO STUDIO',
  category: 'Department — KINTO STUDIO',
  product: 'Product Details — KINTO STUDIO',
  search: 'Search Catalog — KINTO STUDIO',
  cart: 'Shopping Bag — KINTO STUDIO',
  wishlist: 'Saved Wishlist — KINTO STUDIO',
  checkout: 'Checkout — KINTO STUDIO',
  account: 'Account Workspace — KINTO STUDIO',
  login: 'Sign In — KINTO STUDIO',
  seller: 'Seller Studio Portal — KINTO STUDIO',
  admin: 'Admin Operations Console — KINTO STUDIO',
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
  'shipping-policy': 2,
  'return-policy': 2,
  'privacy-policy': 2,
  terms: 2,
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
  'shipping-policy': 20,
  'return-policy': 21,
  'privacy-policy': 22,
  terms: 23,
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
  'shipping-policy',
  'return-policy',
  'privacy-policy',
  'terms',
  'maintenance',
  'not-found',
];

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
  ].join(':');
}

export function parseHashToRoute(): RouteState {
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
  if (first === 'login') {
    const tab = searchParams.get('tab') === 'register' ? 'register' : 'signin';
    return { name: 'login', accountTab: tab };
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
    return { name: first };
  }
  return { name: 'not-found' };
}

export function serializeRouteToHash(route: RouteState): string {
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
      const base = `#/category/${route.category || 'home-furniture-kitchen'}`;
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
    case 'login':
      return route.accountTab === 'register' ? '#/login?tab=register' : '#/login';
    case 'seller':
      return '#/seller';
    case 'admin':
      return '#/admin';
    case 'track-order':
      return route.orderId ? `#/track-order?id=${encodeURIComponent(route.orderId)}` : '#/track-order';
    default:
      return `#/${route.name}`;
  }
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
    return found ? `${found.name} — KINTO STUDIO` : PAGE_TITLES.product;
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

export function useNavigationController(
  products: Product[],
  categories: CategoryMeta[]
): NavigationController {
  const [route, setRoute] = useState<RouteState>(parseHashToRoute);
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>(1);

  const initialRoute = route;
  const routeRef = useRef<RouteState>(initialRoute);
  const historyRef = useRef<{ stack: RouteState[]; index: number }>({
    stack: [initialRoute],
    index: 0,
  });
  const skipNextHashRef = useRef<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

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
    const onHashChange = () => {
      const currentHash = window.location.hash || '#/';
      if (skipNextHashRef.current === currentHash) {
        skipNextHashRef.current = null;
        return;
      }

      const next = parseHashToRoute();
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

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [commitRouteTransition]);

  useEffect(() => {
    document.title = resolveDocumentTitle(route, products, categories);
  }, [route, products, categories]);

  const navigate = useCallback(
    (next: RouteState) => {
      const targetHash = serializeRouteToHash(next);
      const direction = computeRouteDirection(routeRef.current, next);
      const currentHash = window.location.hash || '#/';

      if (currentHash !== targetHash) {
        skipNextHashRef.current = targetHash;
        window.location.hash = targetHash;
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
      const targetHash = serializeRouteToHash(previous);
      const currentHash = window.location.hash || '#/';
      history.index -= 1;
      if (currentHash !== targetHash) {
        skipNextHashRef.current = targetHash;
        window.location.hash = targetHash;
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
