import React, { useEffect, useRef, useState } from 'react';
import { Check, Plus, Star } from 'lucide-react';
import { Product } from '../../types/commerce';
import { useStore } from '../../context/StoreContext';
import { t, translateDepartmentName } from '../../utils/i18n';
import {
  hasVerifiedProductRating,
  isStudioCutoutImage,
  resolveCardAvailability,
  resolveCardPricing,
} from '../../utils/productCard';
import { ResilientImage } from '../ui/Primitives';
import { PriceDisplay, WishlistButton } from './CommercePrimitives';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

const TONE_CLASS_MAP = {
  success: 'text-[var(--ks-success)]',
  warning: 'text-[var(--ks-warning)]',
  error: 'text-[var(--ks-error)]',
  neutral: 'text-[var(--ks-text-secondary)]',
} as const;

const ProductCardInner: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const {
    language,
    currency,
    navigate,
    addToCart,
    wishlistIds,
    wishlistPendingIds,
    toggleWishlist,
  } = useStore();

  const [justAdded, setJustAdded] = useState(false);
  const [hoverMounted, setHoverMounted] = useState(false);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setJustAdded(false);
    setHoverMounted(false);
    return () => {
      if (addedTimerRef.current) {
        window.clearTimeout(addedTimerRef.current);
        addedTimerRef.current = null;
      }
    };
  }, [product.id]);

  const isWishlisted = wishlistIds.includes(product.id);
  const isWishlistPending = wishlistPendingIds.includes(product.id);
  const { discountPercent, hasVerifiedDiscount } = resolveCardPricing(
    product.price,
    product.originalPrice
  );
  const hasRating = hasVerifiedProductRating(product.rating, product.reviewCount);
  const availability = resolveCardAvailability(product);
  const outOfStock = availability.outOfStock;
  const secondaryImage = product.images[1];
  const primaryColor = product.colors[0] || { name: 'Standard', hex: '#84827B' };
  const isPrimaryCutout = isStudioCutoutImage(product.images[0]);
  const isSecondaryCutout = isStudioCutoutImage(secondaryImage);

  const availabilityLabel =
    availability.key === 'onlyLeft'
      ? t(language, 'onlyLeft', { count: product.stockCount })
      : t(language, availability.key);

  const handlePrimaryAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    const defaultSize = product.sizes[0] || 'Standard';
    addToCart(product, primaryColor.name, primaryColor.hex, defaultSize, 1, false);
    setJustAdded(true);
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  };

  if (layout === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row gap-5 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-[var(--ks-surface)] border border-[var(--ks-border)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ks-ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--ks-shadow-card-hover)] hover:border-[var(--ks-border-strong)]">
        <button
          type="button"
          onClick={() => navigate({ name: 'product', slug: product.slug })}
          onMouseEnter={() => {
            if (secondaryImage && !hoverMounted) setHoverMounted(true);
          }}
          aria-label={product.name}
          className="relative w-full sm:w-60 md:w-64 aspect-[4/3] rounded-xl overflow-hidden bg-[#F7F7F5] dark:bg-[#22221F] border border-[var(--ks-border)] shrink-0 cursor-pointer block text-start"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full transition-transform duration-300 group-hover:scale-[1.03] ${
              isPrimaryCutout ? 'object-contain p-3 sm:p-4' : 'object-cover'
            }`}
          />
          {secondaryImage && hoverMounted && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className={`absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isSecondaryCutout
                  ? 'object-contain p-3 sm:p-4 bg-[#F7F7F5] dark:bg-[#22221F]'
                  : 'object-cover'
              }`}
            />
          )}
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <span className="block text-xs tracking-wide text-[var(--ks-text-muted)] truncate">
              {product.brand
                ? `${product.brand} · ${translateDepartmentName(language, product.category, product.categoryLabel)}`
                : translateDepartmentName(language, product.category, product.categoryLabel)}
            </span>
            <h3 className="text-lg font-semibold text-[var(--ks-text-primary)] leading-snug">
              <button
                type="button"
                onClick={() => navigate({ name: 'product', slug: product.slug })}
                className="text-start hover:text-[var(--ks-accent)] transition-colors cursor-pointer"
              >
                {product.name}
              </button>
            </h3>
            <p className="text-sm text-[var(--ks-text-secondary)] line-clamp-2 max-w-2xl">
              {product.shortDescription}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-0.5">
              <span className={`font-medium ${TONE_CLASS_MAP[availability.tone]}`}>
                {availabilityLabel}
              </span>
              {hasRating && (
                <>
                  <span aria-hidden="true" className="text-[var(--ks-text-muted)]">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono-num tabular-nums">
                    <Star
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-[var(--ks-text-primary)]">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[var(--ks-text-muted)]">({product.reviewCount})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              currency={currency}
              size="md"
              stacked
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <WishlistButton
                active={isWishlisted}
                pending={isWishlistPending}
                onToggle={() => toggleWishlist(product)}
                productName={product.name}
                variant="overlay"
              />
              <button
                type="button"
                disabled={outOfStock}
                onClick={handlePrimaryAdd}
                className={`px-4 min-h-[44px] rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-[color,background-color,border-color,transform] duration-[var(--ks-duration-fast)] whitespace-nowrap ${
                  outOfStock
                    ? 'bg-[var(--ks-surface-muted)] border-[var(--ks-border)] text-[var(--ks-text-muted)] cursor-not-allowed opacity-70'
                    : justAdded
                    ? 'bg-[var(--ks-success)] border-[var(--ks-success)] text-[var(--ks-success-text)] active:scale-[0.97] cursor-pointer'
                    : 'bg-[#E8F7EE] border-[#A7DFC0] text-[#146C43] hover:bg-[#D5F1E0] hover:border-[#84CFA5] dark:bg-[#1E6B43]/25 dark:border-[#4ADE80]/35 dark:text-[#4ADE80] dark:hover:bg-[#1E6B43]/40 active:scale-[0.97] cursor-pointer'
                }`}
              >
                {outOfStock ? (
                  <span>{t(language, 'outOfStock')}</span>
                ) : justAdded ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.2} />
                    <span>{t(language, 'added')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" strokeWidth={2} />
                    <span>{t(language, 'addToBag')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col rounded-2xl bg-[var(--ks-surface)] border border-[var(--ks-border)] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ks-ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--ks-shadow-card-hover)] hover:border-[var(--ks-border-strong)]">
      {/* Studio Image Stage */}
      <div
        onMouseEnter={() => {
          if (secondaryImage && !hoverMounted) setHoverMounted(true);
        }}
        className="relative aspect-[4/3] overflow-hidden bg-[#F7F7F5] dark:bg-[#22221F] border-b border-[var(--ks-border)]"
      >
        <button
          type="button"
          onClick={() => navigate({ name: 'product', slug: product.slug })}
          aria-label={product.name}
          className="block w-full h-full cursor-pointer text-start"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full transition-transform duration-300 group-hover:scale-[1.03] ${
              isPrimaryCutout ? 'object-contain p-3 sm:p-4' : 'object-cover'
            }`}
          />
          {secondaryImage && hoverMounted && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className={`absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isSecondaryCutout
                  ? 'object-contain p-3 sm:p-4 bg-[#F7F7F5] dark:bg-[#22221F]'
                  : 'object-cover'
              }`}
            />
          )}
        </button>

        <div className="absolute top-2.5 end-2.5 sm:top-3 sm:end-3 pointer-events-none">
          <WishlistButton
            active={isWishlisted}
            pending={isWishlistPending}
            onToggle={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            productName={product.name}
            variant="overlay"
          />
        </div>
      </div>

      {/* Product Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <h3 className="text-[15px] sm:text-base font-semibold text-[var(--ks-text-primary)] leading-snug">
            <button
              type="button"
              onClick={() => navigate({ name: 'product', slug: product.slug })}
              className="w-full text-start line-clamp-2 hover:text-[var(--ks-accent)] transition-colors cursor-pointer"
            >
              {product.name}
            </button>
          </h3>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] sm:text-[13px] min-h-[20px]">
            <span className={`font-medium ${TONE_CLASS_MAP[availability.tone]}`}>
              {availabilityLabel}
            </span>
            {hasRating && (
              <>
                <span aria-hidden="true" className="text-[var(--ks-text-muted)]">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 font-mono-num tabular-nums">
                  <Star
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium text-[var(--ks-text-primary)]">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-[var(--ks-text-muted)]">({product.reviewCount})</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Price Stack & Quick-Add '+' Button */}
        <div className="flex items-end justify-between gap-2 pt-1 mt-auto">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            currency={currency}
            size="sm"
            stacked
          />

          <button
            type="button"
            disabled={outOfStock}
            onClick={handlePrimaryAdd}
            title={
              outOfStock
                ? t(language, 'outOfStock')
                : justAdded
                ? t(language, 'added')
                : t(language, 'addToBag')
            }
            aria-label={
              outOfStock
                ? `${product.name} — ${t(language, 'outOfStock')}`
                : justAdded
                ? `${t(language, 'added')}: ${product.name}`
                : `${t(language, 'addToBag')}: ${product.name}`
            }
            className={`w-11 h-11 rounded-xl shrink-0 inline-flex items-center justify-center border transition-[color,background-color,border-color,transform] duration-[var(--ks-duration-fast)] ${
              outOfStock
                ? 'bg-[var(--ks-surface-muted)] border-[var(--ks-border)] text-[var(--ks-text-muted)] cursor-not-allowed opacity-65'
                : justAdded
                ? 'bg-[var(--ks-success)] border-[var(--ks-success)] text-[var(--ks-success-text)] active:scale-[0.95] cursor-pointer'
                : 'bg-[#E8F7EE] border-[#A7DFC0] text-[#146C43] hover:bg-[#D5F1E0] hover:border-[#84CFA5] dark:bg-[#1E6B43]/25 dark:border-[#4ADE80]/35 dark:text-[#4ADE80] dark:hover:bg-[#1E6B43]/40 active:scale-[0.95] cursor-pointer'
            }`}
          >
            {justAdded ? (
              <Check className="w-5 h-5" strokeWidth={2.2} />
            ) : (
              <Plus className="w-5 h-5" strokeWidth={2} />
            )}
          </button>
        </div>

        {hasVerifiedDiscount && (
          <span className="sr-only">{t(language, 'savePercent', { percent: discountPercent })}</span>
        )}
      </div>
    </article>
  );
};

export const ProductCard = React.memo(ProductCardInner);

