import React, { useEffect, useState } from 'react';
import { ArrowRight, Heart, Minus, Plus, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, getDiscountPercent, isProductOutOfStock } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal, ResilientImage } from '../ui/Primitives';

export const QuickViewModal: React.FC = () => {
  const {
    currency,
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    wishlistIds,
    toggleWishlist,
    navigate,
  } = useStore();

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setSelectedColorIdx(0);
    setSelectedSizeIdx(0);
    setQty(1);
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const outOfStock = isProductOutOfStock(quickViewProduct);
  const color = quickViewProduct.colors[selectedColorIdx] ||
    quickViewProduct.colors[0] || { name: 'Standard', hex: '#84827B' };
  const size = quickViewProduct.sizes[selectedSizeIdx] || quickViewProduct.sizes[0] || 'Standard';
  const isWishlisted = wishlistIds.includes(quickViewProduct.id);
  const discount = getDiscountPercent(quickViewProduct.price, quickViewProduct.originalPrice);

  return (
    <Modal
      open={Boolean(quickViewProduct)}
      onClose={() => setQuickViewProduct(null)}
      title="Quick View"
      maxWidthClass="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F]">
          <ResilientImage
            src={quickViewProduct.images[0]}
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#84827B]">
                {quickViewProduct.brand} · {quickViewProduct.categoryLabel}
              </p>
              <h3 className="font-display text-3xl font-medium mt-1">{quickViewProduct.name}</h3>
              {quickViewProduct.subtitle && (
                <p className="text-xs text-[#8F6438] dark:text-[#C89B67] mt-1 font-medium">
                  {quickViewProduct.subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                <span className="inline-flex items-center gap-1 font-mono-num text-[#171716] dark:text-[#F4F3EF]">
                  <Star className="w-3.5 h-3.5 fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]" />
                  {quickViewProduct.rating.toFixed(1)}
                </span>
                <span>({quickViewProduct.reviewCount} reviews)</span>
                <span aria-hidden="true">·</span>
                <span>{quickViewProduct.sku}</span>
              </div>
            </div>

            <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
              <span className="text-2xl font-mono-num font-semibold">
                {formatCurrency(quickViewProduct.price, currency)}
              </span>
              {quickViewProduct.originalPrice && (
                <>
                  <span className="text-sm font-mono-num line-through text-[#84827B]">
                    {formatCurrency(quickViewProduct.originalPrice, currency)}
                  </span>
                  <span className="text-xs font-mono-num font-medium text-[#8F6438] dark:text-[#C89B67]">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
              {quickViewProduct.shortDescription}
            </p>

            {/* Color selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {quickViewProduct.variantColorLabel || 'Finish / Color'}:{' '}
                <span className="text-[#5C5B57] dark:text-[#A3A19B]">{color.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    aria-label={c.name}
                    className={`flex items-center gap-2 px-3 min-h-[40px] py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      idx === selectedColorIdx
                        ? 'border-[#171716] dark:border-[#F4F3EF] font-medium'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#A3A19B]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {quickViewProduct.variantSizeLabel || 'Edition / Size'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.sizes.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSizeIdx(idx)}
                    className={`px-3 min-h-[40px] py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      idx === selectedSizeIdx
                        ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF] font-medium'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#A3A19B]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
            <div className="flex flex-wrap min-[380px]:flex-nowrap items-center gap-2.5 sm:gap-3">
              <div className="inline-flex items-center border border-[#DCD9D0] dark:border-[#2E2E2A] rounded-md h-11 shrink-0">
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-mono-num">
                  {outOfStock ? 0 : qty}
                </span>
                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={() =>
                    setQty((q) => Math.min(Math.max(1, quickViewProduct.stockCount), q + 1))
                  }
                  aria-label="Increase quantity"
                  className="w-10 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-[140px]">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={outOfStock}
                  onClick={() => {
                    addToCart(quickViewProduct, color.name, color.hex, size, qty, true);
                    setQuickViewProduct(null);
                  }}
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Bag'}
                </Button>
              </div>

              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct)}
                aria-label="Toggle wishlist"
                className="w-11 h-11 rounded-md border border-[#DCD9D0] dark:border-[#2E2E2A] flex items-center justify-center shrink-0 cursor-pointer hover:border-[#171716] dark:hover:border-[#F4F3EF]"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted ? 'fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]' : ''
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const slug = quickViewProduct.slug;
                setQuickViewProduct(null);
                navigate({ name: 'product', slug });
              }}
              className="w-full py-2 text-xs font-medium text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View full specifications, Q&amp;A &amp; reviews</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
