import React, { useEffect, useRef, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { Product } from '../../types/commerce';
import { useStore } from '../../context/StoreContext';
import { getDiscountPercent, isProductOutOfStock } from '../../utils/format';
import { t, translateDepartmentName } from '../../utils/i18n';
import { ResilientImage } from '../ui/Primitives';
import { PriceDisplay, RatingSummary, WishlistButton } from './CommercePrimitives';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

const ProductCardInner: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const {
    language,
    currency,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
  } = useStore();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [hoverMounted, setHoverMounted] = useState(false);
  const addedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedColorIdx(0);
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
  const discount = getDiscountPercent(product.price, product.originalPrice);
  const hasVerifiedDiscount =
    discount > 0 &&
    typeof product.originalPrice === 'number' &&
    product.originalPrice > product.price;
  const hasRating =
    typeof product.rating === 'number' &&
    product.rating > 0 &&
    typeof product.reviewCount === 'number' &&
    product.reviewCount > 0;
  const outOfStock = isProductOutOfStock(product);
  const secondaryImage = product.images[1];
  const activeColor = product.colors[selectedColorIdx] ||
    product.colors[0] || { name: 'Standard', hex: '#84827B' };

  const handlePrimaryAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (outOfStock) return;
    const defaultSize = product.sizes[0] || 'Standard';
    addToCart(product, activeColor.name, activeColor.hex, defaultSize, 1, false);
    setJustAdded(true);
    if (addedTimerRef.current) window.clearTimeout(addedTimerRef.current);
    addedTimerRef.current = window.setTimeout(() => setJustAdded(false), 1200);
  };

  const highlights = product.cardHighlights?.slice(0, 2) || [];

  if (layout === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row gap-5 sm:gap-6 p-4 sm:p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ks-ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--ks-shadow-card-hover)]">
        <button
          type="button"
          onClick={() => navigate({ name: 'product', slug: product.slug })}
          onMouseEnter={() => {
            if (secondaryImage && !hoverMounted) setHoverMounted(true);
          }}
          aria-label={product.name}
          className="relative w-full sm:w-60 md:w-64 aspect-[4/3] rounded-[var(--ks-radius-md)] overflow-hidden bg-[var(--ks-surface-muted)] shrink-0 cursor-pointer block text-start"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {secondaryImage && hoverMounted && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </button>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs tracking-wide text-[var(--ks-text-muted)] truncate">
                {product.brand
                  ? `${product.brand} · ${translateDepartmentName(language, product.category, product.categoryLabel)}`
                  : translateDepartmentName(language, product.category, product.categoryLabel)}
              </span>
              {hasVerifiedDiscount && (
                <span className="text-xs font-mono-num font-medium text-[var(--ks-accent)] shrink-0">
                  {t(language, 'savePercent', { percent: discount })}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[var(--ks-text-primary)]">
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
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs text-[var(--ks-text-secondary)] pt-1">
              <RatingSummary rating={product.rating} reviewCount={product.reviewCount} compact />
              {highlights.map((h, i) => (
                <React.Fragment key={h}>
                  {(hasRating || i > 0) && <span aria-hidden="true">·</span>}
                  <span>{h}</span>
                </React.Fragment>
              ))}
              {(hasRating || highlights.length > 0) && <span aria-hidden="true">·</span>}
              <span>
                {outOfStock
                  ? t(language, 'outOfStock')
                  : product.availability === 'in-stock'
                  ? t(language, 'inStock')
                  : product.availability === 'low-stock'
                  ? t(language, 'onlyLeft', { count: product.stockCount })
                  : t(language, 'madeToOrder')}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--ks-border)]">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              currency={currency}
              size="md"
            />

            <div className="flex flex-wrap items-center gap-2">
              <WishlistButton
                active={isWishlisted}
                onToggle={() => toggleWishlist(product)}
                productName={product.name}
                variant="icon"
              />
              <button
                type="button"
                disabled={outOfStock}
                onClick={handlePrimaryAdd}
                className={`px-4 min-h-[44px] sm:min-h-0 sm:h-10 rounded-[var(--ks-radius-md)] text-xs font-medium inline-flex items-center gap-1.5 transition-[color,background-color,transform] duration-[var(--ks-duration-fast)] whitespace-nowrap ${
                  outOfStock
                    ? 'bg-[var(--ks-surface-muted)] text-[var(--ks-text-muted)] cursor-not-allowed'
                    : justAdded
                    ? 'bg-[var(--ks-success)] text-[var(--ks-success-text)] active:scale-[0.97] cursor-pointer'
                    : 'bg-[var(--ks-action)] text-[var(--ks-action-text)] hover:bg-[var(--ks-action-hover)] active:scale-[0.97] cursor-pointer'
                }`}
              >
                {outOfStock ? (
                  <span>{t(language, 'outOfStock')}</span>
                ) : justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t(language, 'added')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
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
    <article className="group flex flex-col rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ks-ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--ks-shadow-card-hover)]">
      <div
        onMouseEnter={() => {
          if (secondaryImage && !hoverMounted) setHoverMounted(true);
        }}
        className="relative aspect-[4/3] overflow-hidden bg-[var(--ks-surface-muted)]"
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {secondaryImage && hoverMounted && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </button>

        {/* Top status/discount label & wishlist control */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-start justify-between pointer-events-none">
          {outOfStock ? (
            <span className="px-2 py-0.5 rounded-[var(--ks-radius-sm)] bg-[#222220]/90 text-[#FAF9F6] text-[11px] font-medium">
              {t(language, 'outOfStock')}
            </span>
          ) : hasVerifiedDiscount ? (
            <span className="px-2 py-0.5 rounded-[var(--ks-radius-sm)] bg-[#222220]/90 text-[#FAF9F6] text-[11px] font-mono-num">
              -{discount}%
            </span>
          ) : (
            <span />
          )}

          <WishlistButton
            active={isWishlisted}
            onToggle={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            productName={product.name}
            variant="overlay"
          />
        </div>
      </div>

      {/* Product info & Add to Bag bar */}
      <div className="p-3 min-[380px]:p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 min-h-[16px]">
            <span className="text-[11px] tracking-wide text-[var(--ks-text-muted)] min-w-0 truncate">
              {product.brand || translateDepartmentName(language, product.category, product.categoryLabel)}
            </span>
            <RatingSummary
              rating={product.rating}
              reviewCount={product.reviewCount}
              compact
              showCount={false}
              className="shrink-0"
            />
          </div>

          <h3 className="text-[15px] sm:text-base font-semibold text-[var(--ks-text-primary)] leading-snug">
            <button
              type="button"
              onClick={() => navigate({ name: 'product', slug: product.slug })}
              className="w-full text-start line-clamp-1 hover:text-[var(--ks-accent)] transition-colors cursor-pointer"
            >
              {product.name}
            </button>
          </h3>

          <div className="flex items-center justify-between gap-2 pt-0.5 min-h-[24px]">
            <p className="text-[11px] text-[var(--ks-text-secondary)] truncate">
              {highlights.length > 0 ? highlights.join(' · ') : product.categoryLabel}
            </p>
            {product.colors.length > 1 && (
              <div
                className="flex flex-wrap items-center justify-end gap-0.5 shrink-0 -me-1"
                aria-label={t(language, 'colorFinish')}
              >
                {product.colors.slice(0, 4).map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-pressed={idx === selectedColorIdx}
                    aria-label={c.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColorIdx(idx);
                    }}
                    className="min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 sm:p-1.5 rounded-full cursor-pointer flex items-center justify-center"
                  >
                    <span
                      className={`block w-3 h-3 rounded-full border transition-transform ${
                        idx === selectedColorIdx
                          ? 'scale-110 ring-1 ring-[var(--ks-text-primary)] border-[var(--ks-surface)]'
                          : 'border-black/20 dark:border-white/25 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[var(--ks-border)]">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            currency={currency}
            size="sm"
          />

          <button
            type="button"
            disabled={outOfStock}
            onClick={handlePrimaryAdd}
            aria-label={outOfStock ? `${product.name} — ${t(language, 'outOfStock')}` : `${t(language, 'addToBag')}: ${product.name}`}
            className={`ms-auto px-3 sm:px-3.5 min-h-[44px] sm:min-h-[40px] rounded-[var(--ks-radius-md)] text-xs font-medium inline-flex items-center gap-1 transition-[color,background-color,transform] duration-[var(--ks-duration-fast)] whitespace-nowrap shrink-0 ${
              outOfStock
                ? 'bg-[var(--ks-surface-muted)] text-[var(--ks-text-muted)] cursor-not-allowed'
                : justAdded
                ? 'bg-[var(--ks-success)] text-[var(--ks-success-text)] active:scale-[0.96] cursor-pointer'
                : 'bg-[var(--ks-action)] text-[var(--ks-action-text)] hover:bg-[var(--ks-action-hover)] active:scale-[0.96] cursor-pointer'
            }`}
          >
            {outOfStock ? (
              <span>{t(language, 'outOfStock')}</span>
            ) : justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t(language, 'added')}</span>
              </>
            ) : (
              <span>{t(language, 'addToBag')}</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export const ProductCard = React.memo(ProductCardInner);
