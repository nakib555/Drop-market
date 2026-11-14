import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, Eye, Heart, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types/commerce';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, getDiscountPercent } from '../../utils/format';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { ResilientImage } from '../ui/Primitives';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, layout = 'grid' }) => {
  const {
    currency,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    setQuickViewProduct,
  } = useStore();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setSelectedColorIdx(0);
    setJustAdded(false);
  }, [product.id]);

  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);
  const discount = getDiscountPercent(product.price, product.originalPrice);
  const secondaryImage = product.images[1];
  const activeColor = product.colors[selectedColorIdx] || product.colors[0];

  const handlePrimaryAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes[0];
    addToCart(product, activeColor.name, activeColor.hex, defaultSize, 1, false);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const highlights = product.cardHighlights?.slice(0, 2) || [];

  if (layout === 'list') {
    return (
      <article className="group flex flex-col sm:flex-row gap-5 sm:gap-6 p-4 sm:p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md">
        <div
          onClick={() => navigate({ name: 'product', slug: product.slug })}
          className="relative w-full sm:w-60 md:w-64 aspect-[4/3] rounded-md overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F] shrink-0 cursor-pointer"
        >
          <ResilientImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {secondaryImage && (
            <ResilientImage
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-wider text-[#84827B] truncate">
                {product.brand} · {product.categoryLabel}
              </span>
              {discount > 0 && (
                <span className="text-xs font-mono-num font-medium text-[#8F6438] dark:text-[#C89B67] shrink-0">
                  Save {discount}%
                </span>
              )}
            </div>
            <h3
              onClick={() => navigate({ name: 'product', slug: product.slug })}
              className="text-lg font-semibold text-[#171716] dark:text-[#F4F3EF] cursor-pointer hover:text-[#8F6438] dark:hover:text-[#C89B67] transition-colors"
            >
              {product.name}
            </h3>
            <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] line-clamp-2 max-w-2xl">
              {product.shortDescription}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C5B57] dark:text-[#A3A19B] pt-1">
              <span className="inline-flex items-center gap-1 font-mono-num">
                <Star className="w-3.5 h-3.5 fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]" />
                {product.rating.toFixed(1)} ({product.reviewCount})
              </span>
              {highlights.map((h) => (
                <React.Fragment key={h}>
                  <span aria-hidden="true">·</span>
                  <span>{h}</span>
                </React.Fragment>
              ))}
              <span aria-hidden="true">·</span>
              <span>
                {product.availability === 'in-stock'
                  ? 'In Stock'
                  : product.availability === 'low-stock'
                  ? `Only ${product.stockCount} left`
                  : 'Made to Order'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
            <div className="flex items-baseline gap-2.5">
              <span className="text-base font-mono-num font-semibold text-[#171716] dark:text-[#F4F3EF]">
                {formatCurrency(product.price, currency)}
              </span>
              {product.originalPrice && (
                <span className="text-xs font-mono-num line-through text-[#84827B]">
                  {formatCurrency(product.originalPrice, currency)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-10 h-10 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'border-[#8F6438] text-[#8F6438] dark:border-[#C89B67] dark:text-[#C89B67]'
                    : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => toggleCompare(product)}
                aria-label="Compare specifications"
                className={`w-10 h-10 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                  isCompared
                    ? 'border-[#171716] bg-[#171716] text-white dark:border-[#F4F3EF] dark:bg-[#F4F3EF] dark:text-[#171716]'
                    : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setQuickViewProduct(product)}
                className="px-3.5 h-10 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs font-medium hover:border-[#171716] dark:hover:border-[#F4F3EF] transition-colors cursor-pointer"
              >
                Quick View
              </button>
              <button
                type="button"
                onClick={handlePrimaryAdd}
                className={`px-4 h-10 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-[color,background-color,transform] duration-150 active:scale-[0.97] cursor-pointer ${
                  justAdded
                    ? 'bg-[#1F6E43] text-white'
                    : 'bg-[#171716] dark:bg-[#F4F3EF] text-white dark:text-[#171716] hover:bg-[#2E2D2A] dark:hover:bg-[#E2E0D8]'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add to Bag</span>
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
    <article className="group flex flex-col rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md">
      <div
        onClick={() => navigate({ name: 'product', slug: product.slug })}
        className="relative aspect-[4/3] overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F] cursor-pointer"
      >
        <ResilientImage
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {secondaryImage && (
          <ResilientImage
            src={secondaryImage}
            alt={`${product.name} studio detail`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {/* Top badge & wishlist icon */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none">
          {discount > 0 ? (
            <span className="px-2 py-0.5 rounded-md bg-[#171716]/85 text-[#FAF9F6] text-[11px] font-mono-num">
              -{discount}%
            </span>
          ) : product.badgeText ? (
            <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF]/92 dark:bg-[#191917]/92 text-[#171716] dark:text-[#F4F3EF] border border-[#E5E3DD]/70 dark:border-[#2C2C28] text-[11px] font-medium">
              {product.badgeText}
            </span>
          ) : (
            <span />
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            animate={isWishlisted ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={STUDIO_TRANSITION.springPop}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            aria-label={
              isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
            }
            className={`pointer-events-auto w-9 h-9 rounded-md flex items-center justify-center backdrop-blur-sm border transition-colors cursor-pointer ${
              isWishlisted
                ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                : 'bg-white/90 dark:bg-[#191917]/90 text-[#171716] dark:text-[#F4F3EF] border-[#E5E3DD]/70 dark:border-[#2C2C28] hover:bg-white dark:hover:bg-[#191917]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        {/* Mobile-accessible corner quick actions + Desktop hover bar */}
        <div className="flex md:hidden absolute bottom-2 right-2 gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            aria-label={`Quick view ${product.name}`}
            className="w-8 h-8 rounded-md bg-white/92 dark:bg-[#191917]/92 text-[#171716] dark:text-[#F4F3EF] border border-[#E5E3DD]/70 dark:border-[#2C2C28] flex items-center justify-center shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product);
            }}
            aria-label={`Compare ${product.name}`}
            className={`w-8 h-8 rounded-md border flex items-center justify-center shadow-xs cursor-pointer ${
              isCompared
                ? 'bg-[#8F6438] text-white border-[#8F6438] dark:bg-[#C89B67] dark:text-[#171716]'
                : 'bg-white/92 dark:bg-[#191917]/92 text-[#171716] dark:text-[#F4F3EF] border-[#E5E3DD]/70 dark:border-[#2C2C28]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden md:flex absolute inset-x-3 bottom-3 gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="flex-1 h-9 rounded-md bg-white/95 dark:bg-[#191917]/95 text-[#171716] dark:text-[#F4F3EF] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-[#191917] shadow-sm cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(product);
            }}
            aria-label={`Compare ${product.name}`}
            className={`w-9 h-9 rounded-md flex items-center justify-center shadow-sm cursor-pointer transition-colors ${
              isCompared
                ? 'bg-[#8F6438] text-white dark:bg-[#C89B67] dark:text-[#171716]'
                : 'bg-white/95 dark:bg-[#191917]/95 text-[#171716] dark:text-[#F4F3EF]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metadata & Price */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#84827B] truncate">
              {product.brand}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono-num text-[#5C5B57] dark:text-[#A3A19B] shrink-0">
              <Star className="w-3 h-3 fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]" />
              {product.rating.toFixed(1)}
            </span>
          </div>

          <h3
            onClick={() => navigate({ name: 'product', slug: product.slug })}
            className="text-[15px] sm:text-base font-semibold text-[#171716] dark:text-[#F4F3EF] leading-snug line-clamp-1 cursor-pointer hover:text-[#8F6438] dark:hover:text-[#C89B67] transition-colors"
          >
            {product.name}
          </h3>

          {/* Category-adaptive highlights + swatch dots */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] truncate">
              {highlights.length > 0 ? highlights.join(' · ') : product.categoryLabel}
            </p>
            {product.colors.length > 1 && (
              <div className="flex items-center gap-1 shrink-0" aria-label="Available variants">
                {product.colors.slice(0, 4).map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={`Select ${c.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColorIdx(idx);
                    }}
                    className={`w-3 h-3 rounded-full border cursor-pointer transition-transform ${
                      idx === selectedColorIdx
                        ? 'scale-110 ring-1 ring-[#171716] dark:ring-[#F4F3EF] border-white dark:border-[#191917]'
                        : 'border-black/20 dark:border-white/20 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[15px] font-mono-num font-semibold text-[#171716] dark:text-[#F4F3EF]">
              {formatCurrency(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] font-mono-num line-through text-[#84827B]">
                {formatCurrency(product.originalPrice, currency)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrimaryAdd}
            aria-label={`Add ${product.name} to bag`}
            className={`px-3.5 h-9 rounded-md text-xs font-medium inline-flex items-center gap-1 transition-[color,background-color,transform] duration-150 active:scale-[0.96] whitespace-nowrap shrink-0 cursor-pointer ${
              justAdded
                ? 'bg-[#1F6E43] text-white'
                : 'bg-[#171716] dark:bg-[#F4F3EF] text-white dark:text-[#171716] hover:bg-[#2E2D2A] dark:hover:bg-[#E2E0D8]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <span>Add</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
