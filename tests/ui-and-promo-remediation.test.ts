import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialCurrencyState } from '../server/services/currencyService.ts';
import {
  buildAuthoritativeCheckoutQuote,
  resolveActivePromo,
} from '../server/services/paymentService.ts';
import { createInitialShippingConfig } from '../server/services/shippingService.ts';
import { getDirectionalSlideSign, getSwipeNavigationDelta } from '../src/utils/motion.ts';
import {
  acquireScrollLock,
  dispatchTopEscape,
  getActiveScrollLockCount,
  getEscapeStackSize,
  registerEscapeHandler,
  releaseScrollLock,
  resetOverlayManagerForTest,
} from '../src/utils/scrollLock.ts';

test('overlay scroll lock reference counting and ESC LIFO stack behave deterministically', () => {
  resetOverlayManagerForTest();

  const originalDocument = (globalThis as Record<string, unknown>).document;
  const mockBody = { style: { overflow: '' } };
  (globalThis as Record<string, unknown>).document = { body: mockBody };

  try {
    acquireScrollLock('search-modal');
    assert.equal(getActiveScrollLockCount(), 1);
    assert.equal(mockBody.style.overflow, 'hidden');

    acquireScrollLock('cart-drawer');
    assert.equal(getActiveScrollLockCount(), 2);
    assert.equal(mockBody.style.overflow, 'hidden');

    // Duplicate release of a single ID must preserve lock for the remaining open overlay
    releaseScrollLock('cart-drawer');
    releaseScrollLock('cart-drawer');
    assert.equal(getActiveScrollLockCount(), 1);
    assert.equal(mockBody.style.overflow, 'hidden');

    releaseScrollLock('search-modal');
    assert.equal(getActiveScrollLockCount(), 0);
    assert.equal(mockBody.style.overflow, '');

    // ESC stack dispatches LIFO (topmost overlay handles ESC first)
    const closedOrder: string[] = [];
    const unregisterFirst = registerEscapeHandler('modal-1', () => {
      closedOrder.push('modal-1');
    });
    const unregisterSecond = registerEscapeHandler('modal-2', () => {
      closedOrder.push('modal-2');
    });
    assert.equal(getEscapeStackSize(), 2);

    assert.equal(dispatchTopEscape(), true);
    assert.deepEqual(closedOrder, ['modal-2']);

    unregisterSecond();
    assert.equal(getEscapeStackSize(), 1);

    assert.equal(dispatchTopEscape(), true);
    assert.deepEqual(closedOrder, ['modal-2', 'modal-1']);

    unregisterFirst();
    assert.equal(getEscapeStackSize(), 0);
    assert.equal(dispatchTopEscape(), false);
  } finally {
    resetOverlayManagerForTest();
    if (originalDocument === undefined) {
      delete (globalThis as Record<string, unknown>).document;
    } else {
      (globalThis as Record<string, unknown>).document = originalDocument;
    }
  }
});

test('resolveActivePromo and buildAuthoritativeCheckoutQuote enforce active flag and minSubtotal', () => {
  const managedPromos = [
    {
      code: 'STUDIO15',
      discountType: 'percent' as const,
      value: 15,
      minSubtotal: 300,
      description: '15% off $300+',
      active: false,
    },
    {
      code: 'KINTO10',
      discountType: 'percent' as const,
      value: 10,
      minSubtotal: 500,
      description: '10% off $500+',
      active: true,
    },
  ];

  assert.equal(resolveActivePromo('studio15', managedPromos), null);
  assert.equal(resolveActivePromo('kinto10', managedPromos)?.code, 'KINTO10');

  const currencyState = createInitialCurrencyState();
  const shippingConfig = createInitialShippingConfig();

  // prod-aeterna-headphones has authoritative priceUsd = 420
  const pausedQuote = buildAuthoritativeCheckoutQuote({
    request: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      address: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
      },
      deliveryMethod: 'standard',
      promoCode: 'STUDIO15',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
    promotions: managedPromos,
  });

  assert.equal(pausedQuote.quote.promoApplied, undefined);
  assert.equal(pausedQuote.quote.discountUsd, 0);

  // KINTO10 requires minSubtotal $500 -> quantity 1 ($420) must not apply, quantity 2 ($840) must apply
  const belowMinQuote = buildAuthoritativeCheckoutQuote({
    request: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      address: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
      },
      deliveryMethod: 'standard',
      promoCode: 'KINTO10',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
    promotions: managedPromos,
  });
  assert.equal(belowMinQuote.quote.promoApplied, undefined);
  assert.equal(belowMinQuote.quote.discountUsd, 0);

  const qualifyingQuote = buildAuthoritativeCheckoutQuote({
    request: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 2 }],
      address: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
      },
      deliveryMethod: 'standard',
      promoCode: 'KINTO10',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
    promotions: managedPromos,
  });
  assert.equal(qualifyingQuote.quote.subtotalUsd, 840);
  assert.equal(qualifyingQuote.quote.promoApplied, 'KINTO10');
  assert.equal(qualifyingQuote.quote.discountUsd, 84);
});

test('RTL motion helpers invert horizontal swipe deltas and directional slide signs in Arabic', () => {
  assert.equal(getSwipeNavigationDelta(25, false), 0);
  assert.equal(getSwipeNavigationDelta(-25, true), 0);

  // Swiping left (startX - endX > 40) advances (+1) in LTR and goes backward (-1) in RTL
  assert.equal(getSwipeNavigationDelta(72, false), 1);
  assert.equal(getSwipeNavigationDelta(72, true), -1);

  // Swiping right (startX - endX < -40) goes backward (-1) in LTR and advances (+1) in RTL
  assert.equal(getSwipeNavigationDelta(-72, false), -1);
  assert.equal(getSwipeNavigationDelta(-72, true), 1);

  assert.equal(getDirectionalSlideSign(1, false), 1);
  assert.equal(getDirectionalSlideSign(1, true), -1);
  assert.equal(getDirectionalSlideSign(-1, true), 1);
});
