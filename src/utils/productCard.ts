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

export interface CardRatingSummary {
  rating: number;
  hasRating: boolean;
  isVerified: boolean;
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

/**
 * Resolves the star rating to display on product cards, prioritizing verified customer
 * reviews and falling back to catalog sourceRating (or positive rating) when present.
 */
export function resolveCardRating(product: {
  rating?: number;
  reviewCount?: number;
  sourceRating?: number;
}): CardRatingSummary {
  if (hasVerifiedProductRating(product.rating, product.reviewCount)) {
    return {
      rating: Number(Math.min(5, product.rating!).toFixed(1)),
      hasRating: true,
      isVerified: true,
    };
  }
  if (
    typeof product.sourceRating === 'number' &&
    Number.isFinite(product.sourceRating) &&
    product.sourceRating > 0
  ) {
    return {
      rating: Number(Math.min(5, product.sourceRating).toFixed(1)),
      hasRating: true,
      isVerified: false,
    };
  }
  if (
    typeof product.rating === 'number' &&
    Number.isFinite(product.rating) &&
    product.rating > 0
  ) {
    return {
      rating: Number(Math.min(5, product.rating).toFixed(1)),
      hasRating: true,
      isVerified: false,
    };
  }
  return { rating: 0, hasRating: false, isVerified: false };
}

/**
 * Resolves visible parenthetical stock count on product cards for available products.
 */
export function resolveCardStockCount(product: {
  availability?: AvailabilityStatus;
  stockCount: number;
}): number | null {
  if (isProductOutOfStock(product)) return null;
  if (typeof product.stockCount !== 'number' || !Number.isFinite(product.stockCount)) {
    return null;
  }
  const rounded = Math.round(product.stockCount);
  return rounded > 0 ? rounded : null;
}

