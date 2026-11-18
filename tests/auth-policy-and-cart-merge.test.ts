import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_STORE_POLICY,
  buildAuthPromptContext,
  evaluateActionAccess,
  isPendingActionExpired,
  parsePendingAction,
  serializePendingAction,
} from '../src/policy/authPolicy.ts';
import { buildCartItemKey, mergeGuestAndServerCarts } from '../src/utils/cartMerge.ts';
import {
  parseLocationToRoute,
  resolveRedirectRoute,
  serializeRouteToPath,
} from '../src/context/navigationController.ts';
import type { CartItem, Product, StorePolicyConfig } from '../src/types/commerce.ts';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    slug: 'kinto-lamp',
    sku: 'KS-001',
    name: 'Kinto Brass Desk Lamp',
    brand: 'Kinto Atelier',
    category: 'home-furniture-kitchen',
    categoryLabel: 'Home, Furniture & Kitchen',
    subcategory: 'lighting',
    subcategoryLabel: 'Lighting',
    price: 180,
    rating: 4.8,
    reviewCount: 12,
    stockCount: 5,
    availability: 'in-stock',
    shortDescription: 'Architectural brushed brass lamp',
    description: 'Detailed description',
    images: ['/img/lamp.jpg'],
    colors: [{ name: 'Brushed Brass', hex: '#b59449' }],
    sizes: ['Standard'],
    cardHighlights: ['Dimmer switch'],
    attributes: {},
    specifications: [],
    deliveryEstimate: '2-3 days',
    returnPolicy: '30 days',
    warranty: '2 years',
    tags: [],
    reviews: [],
    ...overrides,
  };
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const productId = overrides.productId ?? 'prod-1';
  const color = overrides.color ?? 'Brushed Brass';
  const size = overrides.size ?? 'Standard';
  return {
    key: buildCartItemKey(productId, color, size),
    productId,
    name: 'Kinto Brass Desk Lamp',
    brand: 'Kinto Atelier',
    category: 'home-furniture-kitchen',
    slug: 'kinto-lamp',
    image: '/img/lamp.jpg',
    price: 180,
    color,
    colorHex: '#b59449',
    size,
    quantity: 1,
    stockCount: 5,
    ...overrides,
  };
}

describe('Centralized Auth Policy', () => {
  it('allows guest checkout by default while protecting wishlist, account, address, reviews, and order mutations', () => {
    const guest = { isAuthenticated: false, role: 'customer' as const };

    assert.equal(evaluateActionAccess('checkout:proceed', guest, DEFAULT_STORE_POLICY).allowed, true);
    assert.equal(evaluateActionAccess('wishlist:toggle', guest, DEFAULT_STORE_POLICY).allowed, false);
    assert.equal(evaluateActionAccess('account:open', guest, DEFAULT_STORE_POLICY).allowed, false);
    assert.equal(evaluateActionAccess('address:save', guest, DEFAULT_STORE_POLICY).allowed, false);
    assert.equal(evaluateActionAccess('review:submit', guest, DEFAULT_STORE_POLICY).allowed, false);
    assert.equal(evaluateActionAccess('order:cancel', guest, DEFAULT_STORE_POLICY).allowed, false);
    assert.equal(evaluateActionAccess('order:return', guest, DEFAULT_STORE_POLICY).allowed, false);
  });

  it('respects configurable store policies when wishlist is local or checkout requires auth', () => {
    const guest = { isAuthenticated: false, role: 'customer' as const };
    const strictCheckoutPolicy: StorePolicyConfig = {
      ...DEFAULT_STORE_POLICY,
      wishlistAuthRequired: false,
      checkoutAuthRequired: true,
    };

    assert.equal(evaluateActionAccess('wishlist:toggle', guest, strictCheckoutPolicy).allowed, true);
    const checkoutDecision = evaluateActionAccess('checkout:proceed', guest, strictCheckoutPolicy);
    assert.equal(checkoutDecision.allowed, false);
    assert.equal(checkoutDecision.reason, 'auth_required');
  });

  it('enforces role requirements for seller and admin workspaces', () => {
    const customer = { isAuthenticated: true, role: 'customer' as const };
    const seller = { isAuthenticated: true, role: 'seller' as const };
    const admin = { isAuthenticated: true, role: 'admin' as const };

    const custToSeller = evaluateActionAccess('seller:workspace', customer);
    assert.equal(custToSeller.allowed, false);
    assert.equal(custToSeller.reason, 'role_required');

    assert.equal(evaluateActionAccess('seller:workspace', seller).allowed, true);
    assert.equal(evaluateActionAccess('admin:workspace', seller).allowed, false);
    assert.equal(evaluateActionAccess('admin:workspace', admin).allowed, true);
  });

  it('builds tailored contextual prompt keys and preserves item context and prefill', () => {
    const ctx = buildAuthPromptContext('wishlist:toggle', {
      itemName: 'Aeterna Headphones',
    });
    assert.equal(ctx.titleKey, 'authCtxWishlistTitle');
    assert.equal(ctx.itemName, 'Aeterna Headphones');
    assert.ok(ctx.benefitKeys.length >= 2);

    const claimCtx = buildAuthPromptContext('order:claim', {
      prefill: { email: 'guest@example.com', fullName: 'Tariq' },
    });
    assert.equal(claimCtx.defaultTab, 'register');
    assert.equal(claimCtx.prefill?.email, 'guest@example.com');
  });

  it('serializes and expires pending actions according to TTL', () => {
    const now = 1_700_000_000_000;
    const raw = serializePendingAction(
      {
        actionId: 'wishlist:toggle',
        createdAt: now,
        payload: { productId: 'prod-aeterna-headphones' },
        returnRoute: { name: 'shop' },
      },
      10_000
    );

    const fresh = parsePendingAction(raw, now + 5_000, 10_000);
    assert.ok(fresh);
    assert.equal(fresh.actionId, 'wishlist:toggle');
    assert.equal(fresh.payload?.productId, 'prod-aeterna-headphones');

    const expired = parsePendingAction(raw, now + 15_000, 10_000);
    assert.equal(expired, null);
    assert.equal(isPendingActionExpired(fresh, now + 15_000, 10_000), true);
  });
});

describe('Guest-to-Account Cart Merge', () => {
  it('combines matching guest and server variants and clamps to live stock', () => {
    const p1 = makeProduct({ id: 'prod-1', price: 180, stockCount: 4 });
    const guest = [makeCartItem({ productId: 'prod-1', quantity: 3 })];
    const server = [makeCartItem({ productId: 'prod-1', quantity: 3 })];

    const { mergedCart, report } = mergeGuestAndServerCarts({
      guestCart: guest,
      serverCart: server,
      products: [p1],
    });

    assert.equal(mergedCart.length, 1);
    assert.equal(mergedCart[0].quantity, 4);
    assert.equal(report.adjustments.length, 1);
    assert.equal(report.adjustments[0].reason, 'clamped_stock');
    assert.equal(report.adjustments[0].requestedQuantity, 6);
    assert.equal(report.adjustments[0].finalQuantity, 4);
  });

  it('drops out-of-stock or removed items and reconciles live price changes', () => {
    const pActive = makeProduct({ id: 'prod-1', price: 210, stockCount: 8 });
    const pSoldOut = makeProduct({
      id: 'prod-2',
      name: 'Sold Out Chair',
      price: 500,
      stockCount: 0,
      availability: 'out-of-stock',
    });

    const guest = [
      makeCartItem({ productId: 'prod-1', price: 180, quantity: 2 }),
      makeCartItem({ productId: 'prod-2', name: 'Sold Out Chair', price: 500, quantity: 1 }),
      makeCartItem({ productId: 'prod-missing', name: 'Discontinued Mug', price: 30, quantity: 1 }),
    ];

    const { mergedCart, report } = mergeGuestAndServerCarts({
      guestCart: guest,
      serverCart: [],
      products: [pActive, pSoldOut],
    });

    assert.equal(mergedCart.length, 1);
    assert.equal(mergedCart[0].price, 210);
    assert.equal(mergedCart[0].quantity, 2);
    assert.equal(report.adjustments.length, 3);
    assert.ok(report.adjustments.some((a) => a.reason === 'price_updated' && a.updatedPrice === 210));
    assert.ok(report.adjustments.some((a) => a.reason === 'out_of_stock' && a.productId === 'prod-2'));
    assert.ok(report.adjustments.some((a) => a.reason === 'unavailable' && a.productId === 'prod-missing'));
  });
});

describe('Full-Page Login Route & Redirect Resolution', () => {
  it('serializes and parses login tab and redirect query parameters', () => {
    const loginPath = serializeRouteToPath({
      name: 'login',
      accountTab: 'register',
      redirectTo: '/product/kinto-lamp',
    });
    assert.equal(loginPath, '/login?tab=register&redirect=%2Fproduct%2Fkinto-lamp');

    const [pathname, search] = loginPath.split('?');
    const parsed = parseLocationToRoute(pathname, `?${search}`, '');
    assert.equal(parsed.name, 'login');
    assert.equal(parsed.accountTab, 'register');
    assert.equal(parsed.redirectTo, '/product/kinto-lamp');
  });

  it('resolves valid storefront redirect targets and blocks self-redirect or external URLs', () => {
    const productRedirect = resolveRedirectRoute('/product/kinto-lamp');
    assert.deepEqual(productRedirect, { name: 'product', slug: 'kinto-lamp' });

    const shopRedirect = resolveRedirectRoute('/shop?collection=trending&brand=Kinto');
    assert.equal(shopRedirect?.name, 'shop');
    assert.equal(shopRedirect?.collection, 'trending');
    assert.equal(shopRedirect?.brand, 'Kinto');

    assert.equal(resolveRedirectRoute('/login'), null);
    assert.equal(resolveRedirectRoute('https://evil.example'), null);
    assert.equal(resolveRedirectRoute('/does-not-exist'), null);
    assert.equal(resolveRedirectRoute(undefined), null);
  });
});
