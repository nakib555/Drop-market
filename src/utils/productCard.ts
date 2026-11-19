import type { AvailabilityStatus } from '../types/commerce';
import { getDiscountPercent, isProductOutOfStock } from './format';

export interface CardAvailabilityBadge {
  key: 'outOfStock' | 'inStock' | 'onlyLeft' | 'madeToOrder';
  tone: 'error' | 'success' | 'warning' | 'neutral';
  outOfStock: boolean;
}

export interface CardPricingSummary {
  discountPercent: number;
  hasVerifiedDiscount: boolean;
}

/**
 * Determines whether an image URL represents a studio product cutout (e.g., DummyJSON PNG/WebP)
 * that benefits from `object-contain` padding on a neutral studio backdrop rather than edge-to-edge cropping.
 */
export function isStudioCutoutImage(src?: string): boolean {
  if (!src || typeof src !== 'string') return false;
  const normalized = src.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('cdn.dummyjson.com/')) return true;
  return /\.(png|webp|svg)(\?.*)?$/.test(normalized);
}

/**
 * Maps product stock state to a semantic translation key and color tone for card status lines.
 */
export function resolveCardAvailability(product: {
  availability?: AvailabilityStatus;
  stockCount: number;
}): CardAvailabilityBadge {
  const outOfStock = isProductOutOfStock(product);
  if (outOfStock) {
    return { key: 'outOfStock', tone: 'error', outOfStock: true };
  }
  if (product.availability === 'low-stock') {
    return { key: 'onlyLeft', tone: 'warning', outOfStock: false };
  }
  if (product.availability === 'made-to-order') {
    return { key: 'madeToOrder', tone: 'neutral', outOfStock: false };
  }
  return { key: 'inStock', tone: 'success', outOfStock: false };
}

/**
 * Computes verified discount metadata for product cards.
 */
export function resolveCardPricing(price: number, originalPrice?: number): CardPricingSummary {
  const discountPercent = getDiscountPercent(price, originalPrice);
  const hasVerifiedDiscount =
    discountPercent > 0 && typeof originalPrice === 'number' && originalPrice > price;
  return { discountPercent, hasVerifiedDiscount };
}

/**
 * Returns true only when a product has real, verified ratings and reviews.
 */
export function hasVerifiedProductRating(rating?: number, reviewCount?: number): boolean {
  return (
    typeof rating === 'number' &&
    Number.isFinite(rating) &&
    rating > 0 &&
    typeof reviewCount === 'number' &&
    Number.isFinite(reviewCount) &&
    reviewCount > 0
  );
}
