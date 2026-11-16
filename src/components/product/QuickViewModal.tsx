import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { isProductOutOfStock } from '../../utils/format';
import { t, translateDepartmentName } from '../../utils/i18n';
import { Button } from '../ui/Button';
import { Modal, ResilientImage } from '../ui/Primitives';
import { PriceDisplay, QuantityStepper, RatingSummary, WishlistButton } from './CommercePrimitives';

export const QuickViewModal: React.FC = () => {
  const {
    language,
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
  const hasVerifiedRating =
    quickViewProduct.rating > 0 && quickViewProduct.reviewCount > 0;

  return (
    <Modal
      open={Boolean(quickViewProduct)}
      onClose={() => setQuickViewProduct(null)}
      title={t(language, 'quickView')}
      maxWidthClass="max-w-4xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-[4/3] rounded-md overflow-hidden bg-[var(--ks-surface-muted)]">
          <ResilientImage
            src={quickViewProduct.images[0]}
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                {quickViewProduct.brand} ·{' '}
                {translateDepartmentName(
                  language,
                  quickViewProduct.category,
                  quickViewProduct.categoryLabel
                )}
              </p>
              <h3 className="font-display text-3xl font-medium mt-1">{quickViewProduct.name}</h3>
              {quickViewProduct.subtitle && (
                <p className="text-xs text-[var(--ks-accent)] mt-1 font-medium">
                  {quickViewProduct.subtitle}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-[var(--ks-text-secondary)]">
                <RatingSummary
                  rating={quickViewProduct.rating}
                  reviewCount={quickViewProduct.reviewCount}
                  showCount
                />
                {hasVerifiedRating && <span aria-hidden="true">·</span>}
                <span>SKU: {quickViewProduct.sku}</span>
              </div>
            </div>

            <PriceDisplay
              price={quickViewProduct.price}
              originalPrice={quickViewProduct.originalPrice}
              currency={currency}
              size="lg"
              showSavings
            />

            <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
              {quickViewProduct.shortDescription}
            </p>

            {/* Color selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {quickViewProduct.variantColorLabel || t(language, 'finishColor')}:{' '}
                <span className="text-[var(--ks-text-secondary)]">{color.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={idx === selectedColorIdx}
                    onClick={() => setSelectedColorIdx(idx)}
                    aria-label={c.name}
                    className={`flex items-center gap-2 px-3 min-h-[40px] py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      idx === selectedColorIdx
                        ? 'border-[var(--ks-action)] font-medium text-[var(--ks-text-primary)]'
                        : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)]'
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
                {quickViewProduct.variantSizeLabel || t(language, 'editionSize')}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.sizes.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={idx === selectedSizeIdx}
                    onClick={() => setSelectedSizeIdx(idx)}
                    className={`px-3 min-h-[40px] py-2 rounded-md border text-xs cursor-pointer transition-colors ${
                      idx === selectedSizeIdx
                        ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)] font-medium'
                        : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--ks-border)]">
            <div className="flex flex-wrap min-[380px]:flex-nowrap items-center gap-2.5 sm:gap-3">
              <QuantityStepper
                value={qty}
                min={1}
                max={Math.max(1, quickViewProduct.stockCount)}
                disabled={outOfStock}
                onChange={setQty}
                itemName={quickViewProduct.name}
                size="md"
              />

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
                  {outOfStock ? t(language, 'outOfStock') : t(language, 'addToBag')}
                </Button>
              </div>

              <WishlistButton
                active={isWishlisted}
                onToggle={() => toggleWishlist(quickViewProduct)}
                productName={quickViewProduct.name}
                variant="icon"
                className="w-11 h-11"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const slug = quickViewProduct.slug;
                setQuickViewProduct(null);
                navigate({ name: 'product', slug });
              }}
              className="w-full py-2 text-xs font-medium text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t(language, 'viewFullSpecs')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
