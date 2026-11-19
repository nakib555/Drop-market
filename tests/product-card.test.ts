import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasVerifiedProductRating,
  isStudioCutoutImage,
  resolveCardAvailability,
  resolveCardPricing,
  resolveCardRating,
  resolveCardStockCount,
} from '../src/utils/productCard.ts';

test('isStudioCutoutImage distinguishes studio cutouts from full-bleed editorial photos', () => {
  assert.equal(
    isStudioCutoutImage('https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/1.webp'),
    true
  );
  assert.equal(isStudioCutoutImage('/assets/item-cutout.png?v=2'), true);
  assert.equal(isStudioCutoutImage('/src/assets/images/product_brass_lamp_1794631822181.jpg'), false);
  assert.equal(isStudioCutoutImage(''), false);
  assert.equal(isStudioCutoutImage(undefined), false);
});

test('resolveCardAvailability maps stock states accurately without silent overrides', () => {
  assert.deepEqual(resolveCardAvailability({ availability: 'in-stock', stockCount: 15 }), {
    key: 'inStock',
    tone: 'success',
    outOfStock: false,
  });
  assert.deepEqual(resolveCardAvailability({ availability: 'low-stock', stockCount: 3 }), {
    key: 'onlyLeft',
    tone: 'warning',
    outOfStock: false,
  });
  assert.deepEqual(resolveCardAvailability({ availability: 'made-to-order', stockCount: 5 }), {
    key: 'madeToOrder',
    tone: 'neutral',
    outOfStock: false,
  });
  assert.deepEqual(resolveCardAvailability({ availability: 'in-stock', stockCount: 0 }), {
    key: 'outOfStock',
    tone: 'error',
    outOfStock: true,
  });
  assert.deepEqual(resolveCardAvailability({ availability: 'out-of-stock', stockCount: 10 }), {
    key: 'outOfStock',
    tone: 'error',
    outOfStock: true,
  });
});

test('resolveCardPricing validates verified discounts and rejects invalid compare-at prices', () => {
  assert.deepEqual(resolveCardPricing(90, 100), {
    discountPercent: 10,
    hasVerifiedDiscount: true,
  });
  assert.deepEqual(resolveCardPricing(100, 100), {
    discountPercent: 0,
    hasVerifiedDiscount: false,
  });
  assert.deepEqual(resolveCardPricing(120, 90), {
    discountPercent: 0,
    hasVerifiedDiscount: false,
  });
  assert.deepEqual(resolveCardPricing(45, undefined), {
    discountPercent: 0,
    hasVerifiedDiscount: false,
  });
});

test('hasVerifiedProductRating requires both positive rating and positive reviewCount', () => {
  assert.equal(hasVerifiedProductRating(4.6, 18), true);
  assert.equal(hasVerifiedProductRating(0, 0), false);
  assert.equal(hasVerifiedProductRating(4.5, 0), false);
  assert.equal(hasVerifiedProductRating(undefined, 12), false);
});

test('resolveCardRating prioritizes verified reviews and falls back to sourceRating', () => {
  assert.deepEqual(resolveCardRating({ rating: 4.8, reviewCount: 5, sourceRating: 2.6 }), {
    rating: 4.8,
    hasRating: true,
    isVerified: true,
  });
  assert.deepEqual(resolveCardRating({ rating: 0, reviewCount: 0, sourceRating: 2.56 }), {
    rating: 2.6,
    hasRating: true,
    isVerified: false,
  });
  assert.deepEqual(resolveCardRating({ rating: 0, reviewCount: 0, sourceRating: undefined }), {
    rating: 0,
    hasRating: false,
    isVerified: false,
  });
});

test('resolveCardStockCount returns positive rounded count for available items and null when out of stock', () => {
  assert.equal(resolveCardStockCount({ availability: 'in-stock', stockCount: 42 }), 42);
  assert.equal(resolveCardStockCount({ availability: 'low-stock', stockCount: 4 }), 4);
  assert.equal(resolveCardStockCount({ availability: 'in-stock', stockCount: 0 }), null);
  assert.equal(resolveCardStockCount({ availability: 'out-of-stock', stockCount: 10 }), null);
});

