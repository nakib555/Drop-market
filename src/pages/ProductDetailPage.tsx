import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Star,
  Truck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import { getDepartmentSafetyNotice } from '../data/legalPolicies';
import {
  formatCurrency,
  formatShortDate,
  formatTypedAttributeValue,
  isProductOutOfStock,
} from '../utils/format';
import { t, translateDepartmentName } from '../utils/i18n';
import {
  getDirectionalSlideSign,
  getSwipeNavigationDelta,
  STUDIO_TRANSITION,
  slideFadeVariants,
} from '../utils/motion';
import { ProductCard } from '../components/product/ProductCard';
import {
  PriceDisplay,
  QuantityStepper,
  RatingSummary,
  WishlistButton,
} from '../components/product/CommercePrimitives';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/FormFields';
import {
  Breadcrumb,
  EmptyState,
  Modal,
  ProductDetailSkeleton,
  ResilientImage,
} from '../components/ui/Primitives';

export const ProductDetailPage: React.FC = () => {
  const {
    language,
    route,
    currency,
    products,
    shippingConfig,
    getCategoryNodeBySlug,
    navigate,
    addToCart,
    wishlistIds,
    wishlistPendingIds,
    toggleWishlist,
    recentlyViewedIds,
    recordProductView,
    submitProductReview,
    submitProductQuestion,
    profile,
    runProtectedAction,
    storefrontLoading,
  } = useStore();

  const product = useMemo(
    () => (route.slug ? products.find((p) => p.slug === route.slug) : products[0]),
    [products, route.slug]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'qa' | 'shipping'>('specs');
  const [showMobileStickyBar, setShowMobileStickyBar] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const primaryCtaRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Review submission state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Q&A submission state
  const [qaAuthor, setQaAuthor] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaError, setQaError] = useState('');
  const [qaSubmitted, setQaSubmitted] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setGalleryDirection(1);
    setZoomed(false);
    setZoomOrigin('50% 50%');
    setSelectedColorIdx(0);
    setSelectedSizeIdx(0);
    setQuantity(1);
    setActiveTab('specs');
    setSizeGuideOpen(false);
    setReviewAuthor('');
    setReviewLocation('');
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewError('');
    setReviewSubmitted(false);
    setQaAuthor('');
    setQaQuestion('');
    setQaError('');
    setQaSubmitted(false);
    recordProductView(product.id);
  }, [product?.id, recordProductView]);

  useEffect(() => {
    if (storefrontLoading || !product) {
      setShowMobileStickyBar(false);
      return;
    }
    const el = primaryCtaRef.current;
    if (!el) return;

    const getHeaderThreshold = () => {
      const headerEl = document.querySelector('header');
      return headerEl ? Math.max(52, Math.round(headerEl.getBoundingClientRect().height)) : 64;
    };

    const updateVisibility = () => {
      const rect = el.getBoundingClientRect();
      setShowMobileStickyBar(rect.bottom < getHeaderThreshold());
    };

    updateVisibility();

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          setShowMobileStickyBar(
            !entry.isIntersecting && entry.boundingClientRect.top < getHeaderThreshold()
          );
        },
        { threshold: 0 }
      );
      observer.observe(el);
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [product?.id, storefrontLoading]);

  if (storefrontLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-[var(--ks-container-max)] mx-auto px-4 py-16">
        <EmptyState
          title={t(language, 'productNotFound')}
          description={t(language, 'productNotFoundDesc')}
          actionLabel={t(language, 'returnToShop')}
          onAction={() => navigate({ name: 'shop', category: 'all' })}
        />
      </div>
    );
  }

  const color = product.colors[selectedColorIdx] ||
    product.colors[0] || { name: 'Standard', hex: '#84827B' };
  const size = product.sizes[selectedSizeIdx] || product.sizes[0] || 'Standard';
  const outOfStock = isProductOutOfStock(product);
  const maxSelectableQty = Math.max(1, product.stockCount);
  const isWishlisted = wishlistIds.includes(product.id);
  const isWishlistPending = wishlistPendingIds.includes(product.id);
  const questions = product.questions || [];

  const relatedProducts = products
    .filter(
      (p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand)
    )
    .slice(0, 3);

  const recentlyViewed = recentlyViewedIds
    .filter((id) => id !== product.id)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 3);

  const isRtl = language === 'ar';

  const stepGalleryImage = (delta: 1 | -1) => {
    if (!product || product.images.length <= 1) return;
    setGalleryDirection(delta);
    setActiveImageIdx((i) => (i + delta + product.images.length) % product.images.length);
    setZoomed(false);
    setZoomOrigin('50% 50%');
  };

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || product.images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = getSwipeNavigationDelta(touchStartX.current - endX, isRtl);
    if (delta !== 0) {
      stepGalleryImage(delta);
    }
    touchStartX.current = null;
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError(t(language, 'reviewErrRequired'));
      return;
    }
    setReviewError('');
    submitProductReview(product.id, {
      author: reviewAuthor.trim(),
      location: reviewLocation.trim() || t(language, 'verifiedOwnerBadge'),
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
    });
    setReviewAuthor('');
    setReviewLocation('');
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    setReviewSubmitted(true);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) {
      setQaError(t(language, 'qaErrRequired'));
      return;
    }
    setQaError('');
    submitProductQuestion(product.id, qaAuthor || t(language, 'yourNameLabel'), qaQuestion);
    setQaQuestion('');
    setQaAuthor('');
    setQaSubmitted(true);
  };

  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 pb-20 lg:pb-16 space-y-14">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          {
            label: translateDepartmentName(language, product.category, product.categoryLabel),
            onClick: () => navigate({ name: 'category', category: product.category }),
          },
          {
            label: product.subcategoryLabel,
            onClick: () =>
              navigate({
                name: 'category',
                category: product.category,
                subcategory: product.subcategory,
              }),
          },
          { label: product.name },
        ]}
      />

      {/* Main Split: Left Gallery + Right Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery with touch swipe */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[var(--ks-surface-muted)] border border-[var(--ks-border)]"
          >
            <AnimatePresence initial={false} mode="popLayout" custom={getDirectionalSlideSign(galleryDirection, isRtl)}>
              <motion.div
                key={`${product.id}-${activeImageIdx}`}
                custom={getDirectionalSlideSign(galleryDirection, isRtl)}
                variants={slideFadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (!zoomed) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0 && e.clientX > 0) {
                        const xPct = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                        const yPct = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
                        setZoomOrigin(`${xPct}% ${yPct}%`);
                      }
                    }
                    setZoomed((z) => !z);
                  }}
                  onMouseMove={(e) => {
                    if (!zoomed) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                      const xPct = Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                      const yPct = Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
                      setZoomOrigin(`${xPct}% ${yPct}%`);
                    }
                  }}
                  aria-label={zoomed ? 'Reset product image zoom' : 'Zoom product image'}
                  className={`w-full h-full block text-start ${
                    zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                >
                  <ResilientImage
                    src={product.images[activeImageIdx]}
                    alt={`${product.name} — view ${activeImageIdx + 1}`}
                    loading={activeImageIdx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={activeImageIdx === 0 ? 'high' : 'auto'}
                    style={zoomed ? { transformOrigin: zoomOrigin } : undefined}
                    className={`w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      zoomed ? 'scale-150' : 'scale-100'
                    }`}
                  />
                </button>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => {
                setZoomOrigin('50% 50%');
                setZoomed((z) => !z);
              }}
              aria-label={zoomed ? 'Reset zoom' : 'Zoom product image'}
              className="absolute top-3 end-3 w-11 h-11 rounded-md bg-[var(--ks-surface)]/92 text-[var(--ks-text-primary)] border border-[var(--ks-border)] flex items-center justify-center shadow-sm cursor-pointer"
            >
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepGalleryImage(-1)}
                  aria-label={t(language, 'previousImage')}
                  className="absolute start-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[var(--ks-surface)]/92 text-[var(--ks-text-primary)] border border-[var(--ks-border)] flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => stepGalleryImage(1)}
                  aria-label={t(language, 'nextImage')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[var(--ks-surface)]/92 text-[var(--ks-text-primary)] border border-[var(--ks-border)] flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => {
                    setGalleryDirection(idx >= activeImageIdx ? 1 : -1);
                    setActiveImageIdx(idx);
                    setZoomed(false);
                    setZoomOrigin('50% 50%');
                  }}
                  aria-label={`Select thumbnail ${idx + 1}`}
                  className={`aspect-[4/3] rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-[var(--ks-surface-muted)] ${
                    idx === activeImageIdx
                      ? 'border-[var(--ks-action)]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <ResilientImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 p-5 sm:p-7 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--ks-text-muted)]">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    name: 'shop',
                    category: product.category,
                    brand: product.brand,
                  })
                }
                className="uppercase tracking-wider hover:text-[var(--ks-accent)] cursor-pointer"
              >
                {product.brand}
              </button>
              <span className="font-mono-num">SKU: {product.sku}</span>
            </div>
            <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-xs font-medium text-[var(--ks-accent)]">{product.subtitle}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <RatingSummary
                rating={product.rating}
                reviewCount={product.reviewCount}
                showCount
                fallbackLabel={t(language, 'beFirstReview')}
                onClick={() => setActiveTab('reviews')}
              />
              <span aria-hidden="true" className="text-[var(--ks-text-muted)]">
                ·
              </span>
              <span
                className={`text-xs font-medium inline-flex items-center gap-1 ${
                  outOfStock
                    ? 'text-[var(--ks-error)]'
                    : product.availability === 'low-stock'
                    ? 'text-[var(--ks-warning)]'
                    : 'text-[var(--ks-success)]'
                }`}
              >
                {!outOfStock && <Check className="w-3.5 h-3.5" />}
                {outOfStock
                  ? t(language, 'outOfStock')
                  : product.availability === 'in-stock'
                  ? t(language, 'inStockReady', { count: product.stockCount })
                  : product.availability === 'low-stock'
                  ? t(language, 'lowStock', { count: product.stockCount })
                  : t(language, 'madeToOrder')}
              </span>
            </div>
          </div>

          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            currency={currency}
            size="lg"
            showSavings
            className="pb-4 border-b border-[var(--ks-border)]"
          />

          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            {product.description}
          </p>

          {/* Finish / Color */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium">
              {product.variantColorLabel || t(language, 'finishColor')}:{' '}
              <span className="text-[var(--ks-text-secondary)]">{color.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={idx === selectedColorIdx}
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md border text-xs cursor-pointer transition-colors ${
                    idx === selectedColorIdx
                      ? 'border-[var(--ks-action)] font-medium bg-[var(--ks-surface-muted)] text-[var(--ks-text-primary)]'
                      : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-border-strong)]'
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

          {/* Size / Edition + Conditional Fashion Size Guide */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">
                {product.variantSizeLabel || t(language, 'editionSize')}
              </p>
              {product.category === 'fashion-accessories' && (
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1 min-h-[44px] sm:min-h-[36px] text-xs font-medium text-[var(--ks-accent)] hover:underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{t(language, 'sizeGuide')}</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s, idx) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={idx === selectedSizeIdx}
                  onClick={() => setSelectedSizeIdx(idx)}
                  className={`px-3.5 py-2 min-h-[44px] rounded-md border text-xs cursor-pointer transition-colors ${
                    idx === selectedSizeIdx
                      ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)] font-medium'
                      : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-border-strong)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + CTAs */}
          <div ref={primaryCtaRef} className="space-y-3 pt-2">
            <div className="flex flex-col min-[430px]:flex-row items-stretch gap-2.5 sm:gap-3">
              <QuantityStepper
                value={quantity}
                min={1}
                max={maxSelectableQty}
                disabled={outOfStock}
                onChange={setQuantity}
                itemName={product.name}
                size="lg"
              />

              <div className="flex-1 min-w-0">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={outOfStock}
                  className="h-12 !py-0 !px-4 sm:!px-6 whitespace-nowrap"
                  onClick={() => addToCart(product, color.name, color.hex, size, quantity, true)}
                >
                  {outOfStock ? (
                    <span>{t(language, 'outOfStock')}</span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1.5 min-w-0 whitespace-nowrap">
                      <span>{t(language, 'addToBag')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num tabular-nums">
                        {formatCurrency(product.price * quantity, currency)}
                      </span>
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                size="md"
                disabled={outOfStock}
                onClick={() => {
                  addToCart(product, color.name, color.hex, size, quantity, false);
                  navigate({ name: 'checkout' });
                }}
              >
                {outOfStock ? t(language, 'unavailable') : t(language, 'buyNow')}
              </Button>
              <WishlistButton
                active={isWishlisted}
                pending={isWishlistPending}
                onToggle={() => toggleWishlist(product)}
                productName={product.name}
                variant="full"
              />
            </div>
          </div>

          {/* Delivery, Return, Warranty Summary */}
          <div className="pt-4 border-t border-[var(--ks-border)] space-y-2.5 text-xs leading-snug text-[var(--ks-text-secondary)]">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-[2px]" />
              <span>{product.deliveryEstimate}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-[2px]" />
              <span>{product.returnPolicy}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-[2px]" />
              <span>{product.warranty}</span>
            </div>

            {(() => {
              const safetyNotice = getDepartmentSafetyNotice(product.category);
              return (
                <div className="mt-3 p-3.5 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--ks-text-primary)]">
                    {safetyNotice.title}
                  </p>
                  <p className="text-[11px] leading-relaxed text-[var(--ks-text-secondary)]">
                    {safetyNotice.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs sm:text-[11px]">
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'product-safety' })}
                      className="min-h-[44px] sm:min-h-0 inline-flex items-center underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      {t(language, 'safetyDisclaimers')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'return-policy' })}
                      className="min-h-[44px] sm:min-h-0 inline-flex items-center underline text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                    >
                      {t(language, 'returnEligibility')}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Specifications, Reviews, Q&A & Care Tabs */}
      <section className="pt-8 border-t border-[var(--ks-border)] space-y-8">
        <div
          role="tablist"
          aria-label={t(language, 'specsAndCare')}
          className="flex items-center gap-6 border-b border-[var(--ks-border)] overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'specs', label: t(language, 'specsAndCare') },
              { id: 'reviews', label: t(language, 'reviewsTab', { count: product.reviews.length }) },
              { id: 'qa', label: t(language, 'qaTab', { count: questions.length }) },
              { id: 'shipping', label: t(language, 'deliveryAndWarranty') },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={`relative min-h-[44px] py-2.5 pb-3.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[var(--ks-text-primary)]'
                    : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
                }`}
              >
                {tab.label}
                {isSelected && (
                  <motion.span
                    layoutId="pdp-doc-tab"
                    transition={STUDIO_TRANSITION.springTab}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--ks-action)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={STUDIO_TRANSITION.fast}
          >
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <dl className="divide-y divide-[var(--ks-border)] border-y border-[var(--ks-border)]">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="py-3.5 flex items-baseline justify-between gap-4 text-sm"
                    >
                      <dt className="text-[var(--ks-text-secondary)] min-w-0">{spec.label}</dt>
                      <dd className="font-medium text-end font-mono-num max-w-[60%] leading-snug">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                  {product.typedAttributes &&
                    Object.entries(product.typedAttributes).map(([attrKey, attrVal]) => {
                      const catFacets = getCategoryNodeBySlug(product.category)?.filterFacets || [];
                      const facetMeta = catFacets.find((f) => f.key === attrKey);
                      const label =
                        facetMeta?.label ||
                        attrKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
                      return (
                        <div
                          key={`typed-${attrKey}`}
                          className="py-3.5 flex items-baseline justify-between gap-4 text-sm"
                        >
                          <dt className="text-[var(--ks-text-secondary)] min-w-0">{label}</dt>
                          <dd className="font-medium text-end font-mono-num max-w-[60%] leading-snug">
                            {formatTypedAttributeValue(attrVal, facetMeta?.unit)}
                          </dd>
                        </div>
                      );
                    })}
                  <div className="py-3.5 flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-[var(--ks-text-secondary)] min-w-0">
                      {t(language, 'shippingWeightTier')}
                    </dt>
                    <dd className="font-medium text-end font-mono-num capitalize max-w-[60%] leading-snug">
                      {product.weightKg ? `${product.weightKg} kg · ` : ''}
                      {t(language, 'parcelTierLabel', { tier: product.sizeTier || 'medium' })}
                    </dd>
                  </div>
                  <div className="py-3.5 flex items-baseline justify-between gap-4 text-sm">
                    <dt className="text-[var(--ks-text-secondary)] min-w-0">
                      {t(language, 'cashOnDelivery')}
                    </dt>
                    <dd className="font-medium text-end font-mono-num max-w-[60%] leading-snug">
                      {product.codEligible === false
                        ? t(language, 'prepaidOnly')
                        : t(language, 'codEligibleBD')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 rounded-lg bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] space-y-4 h-fit">
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-medium">
                    {t(language, 'careHandlingWarranty')}
                  </h3>
                  <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                    {t(language, 'fulfilledFromBrand', {
                      brand: product.brand,
                      dept: translateDepartmentName(language, product.category, product.categoryLabel),
                      warranty: product.warranty.toLowerCase(),
                    })}
                  </p>
                </div>
                {product.careNote && (
                  <div className="pt-3 border-t border-[var(--ks-divider)]">
                    <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] mb-1">
                      {t(language, 'handlingCareNote')}
                    </p>
                    <p className="text-sm text-[var(--ks-text-primary)] leading-relaxed">
                      {product.careNote}
                    </p>
                  </div>
                )}
                <div className="pt-3 border-t border-[var(--ks-divider)] space-y-1">
                  <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                    {t(language, 'returnsDispatchTerms')}
                  </p>
                  <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                    {product.returnPolicy}. {product.deliveryEstimate}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-4">
                {product.reviews.length === 0 ? (
                  <p className="text-sm text-[var(--ks-text-secondary)] py-4">
                    {t(language, 'noReviewsYet')}
                  </p>
                ) : (
                  product.reviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="p-5 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5 text-[var(--ks-accent)]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <span className="text-xs text-[var(--ks-text-muted)] font-mono-num">
                          {formatShortDate(rev.date)}
                        </span>
                      </div>
                      <h4 className="text-base font-medium">{rev.title}</h4>
                      <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="text-xs text-[var(--ks-text-muted)] pt-1">
                        {rev.author} · {rev.location}{' '}
                        {rev.verified ? `· ${t(language, 'verifiedOwnerBadge')}` : ''}
                      </p>
                    </article>
                  ))
                )}
              </div>

              {!profile.isAuthenticated ? (
                <div className="lg:col-span-5 p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4 h-fit">
                  <h3 className="font-display text-2xl font-medium">
                    {t(language, 'writeVerifiedReview')}
                  </h3>
                  <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                    {t(language, 'reviewsAuthOnlyDesc')}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      void runProtectedAction('review:submit', () => {}, {
                        productId: product.id,
                        itemName: product.name,
                        preferredTab: 'signin',
                        returnRoute: { name: 'product', slug: product.slug },
                      });
                    }}
                  >
                    {t(language, 'signInToReview')}
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleReviewSubmit}
                  className="lg:col-span-5 p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4 h-fit"
                >
                  <h3 className="font-display text-2xl font-medium">
                    {t(language, 'writeReviewHeading')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label={t(language, 'yourNameLabel')}
                      required
                      autoComplete="name"
                      value={reviewAuthor}
                      onChange={(e) => {
                        setReviewAuthor(e.target.value);
                        setReviewSubmitted(false);
                      }}
                      placeholder={t(language, 'yourFullNamePlaceholder')}
                    />
                    <Input
                      label={t(language, 'cityCountryLabel')}
                      autoComplete="address-level2"
                      value={reviewLocation}
                      onChange={(e) => {
                        setReviewLocation(e.target.value);
                        setReviewSubmitted(false);
                      }}
                      placeholder={t(language, 'cityCountryPlaceholder')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span id="pdp-rating-label" className="text-xs font-medium block">
                      {t(language, 'ratingLabel')}
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="pdp-rating-label"
                      className="flex items-center gap-1"
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          role="radio"
                          aria-checked={star === reviewRating}
                          onClick={() => {
                            setReviewRating(star);
                            setReviewSubmitted(false);
                          }}
                          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                          className="w-11 h-11 rounded-md flex items-center justify-center hover:bg-[var(--ks-surface-muted)] cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'fill-[var(--ks-accent)] text-[var(--ks-accent)]'
                                : 'text-[var(--ks-border-strong)]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label={t(language, 'reviewHeadlineLabel')}
                    required
                    value={reviewTitle}
                    onChange={(e) => {
                      setReviewTitle(e.target.value);
                      setReviewSubmitted(false);
                    }}
                    placeholder={t(language, 'reviewHeadlinePlaceholder')}
                  />
                  <Textarea
                    label={t(language, 'yourFeedbackLabel')}
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => {
                      setReviewComment(e.target.value);
                      setReviewSubmitted(false);
                    }}
                    placeholder={t(language, 'yourFeedbackPlaceholder')}
                  />
                  {reviewError && <p className="text-xs text-[var(--ks-error)]">{reviewError}</p>}
                  {reviewSubmitted && !reviewError && (
                    <p className="text-xs text-[var(--ks-success)]">
                      {t(language, 'reviewPublishedMsg')}
                    </p>
                  )}
                  <Button type="submit" variant="primary" size="md" fullWidth>
                    {t(language, 'publishVerifiedReview')}
                  </Button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-4">
                {questions.length === 0 ? (
                  <p className="text-sm text-[var(--ks-text-secondary)] py-4">
                    {t(language, 'noQuestionsYet')}
                  </p>
                ) : (
                  questions.map((qa) => (
                    <article
                      key={qa.id}
                      className="p-5 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--ks-text-muted)]">
                          <span className="min-w-0 truncate">
                            {t(language, 'questionFromAuthor', { author: qa.author })}
                          </span>
                          <span className="font-mono-num shrink-0">{formatShortDate(qa.date)}</span>
                        </div>
                        <p className="text-sm font-semibold">{qa.question}</p>
                      </div>
                      <div className="pt-3 border-t border-[var(--ks-border)] space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                          {t(language, 'answerByLabel', { author: qa.answeredBy })}
                        </p>
                        <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                          {qa.answer}
                        </p>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <form
                onSubmit={handleQuestionSubmit}
                className="lg:col-span-5 p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4 h-fit"
              >
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-[var(--ks-accent)]" />
                  <h3 className="font-display text-2xl font-medium">
                    {t(language, 'askQuestionHeading')}
                  </h3>
                </div>
                <p className="text-xs text-[var(--ks-text-secondary)]">
                  {t(language, 'askQuestionDesc')}
                </p>
                <Input
                  label={t(language, 'yourNameLabel')}
                  autoComplete="name"
                  value={qaAuthor}
                  onChange={(e) => {
                    setQaAuthor(e.target.value);
                    setQaSubmitted(false);
                  }}
                  placeholder={t(language, 'yourFullNamePlaceholder')}
                />
                <Textarea
                  label={t(language, 'yourQuestionLabel')}
                  required
                  rows={3}
                  value={qaQuestion}
                  onChange={(e) => {
                    setQaQuestion(e.target.value);
                    setQaSubmitted(false);
                  }}
                  placeholder={t(language, 'yourQuestionPlaceholder')}
                />
                {qaError && <p className="text-xs text-[var(--ks-error)]">{qaError}</p>}
                {qaSubmitted && !qaError && (
                  <p className="text-xs text-[var(--ks-success)]">
                    {t(language, 'questionPostedMsg')}
                  </p>
                )}
                <Button type="submit" variant="primary" size="md" fullWidth>
                  {t(language, 'postQuestionBtn')}
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="p-5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-2">
                <p className="font-medium">{t(language, 'dispatchCoverage')}</p>
                <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'dispatchCoverageDetail', {
                    estimate: product.deliveryEstimate,
                    amount: formatCurrency(
                      shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120,
                      currency
                    ),
                  })}
                </p>
              </div>
              <div className="p-5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-2">
                <p className="font-medium">{t(language, 'returnsExchanges')}</p>
                <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'returnsExchangesDetail', { policy: product.returnPolicy })}
                </p>
              </div>
              <div className="p-5 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-2">
                <p className="font-medium">{t(language, 'warrantyCoverage')}</p>
                <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'warrantyCoverageDetail', { warranty: product.warranty })}
                </p>
              </div>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Related & Recently Viewed */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[var(--ks-border)]">
          <h2 className="font-display text-3xl font-medium">
            {t(language, 'relatedProducts')}
          </h2>
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[var(--ks-border)]">
          <h2 className="font-display text-3xl font-medium">
            {t(language, 'recentlyViewed')}
          </h2>
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Fashion Apparel Size Guide Modal */}
      <Modal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        title={t(language, 'sizeGuideTitle')}
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-[var(--ks-text-secondary)]">
            {t(language, 'sizeGuideDesc')}
          </p>
          <div className="overflow-x-auto rounded-md border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs font-mono-num tabular-nums">
              <thead className="bg-[var(--ks-surface-muted)] border-b border-[var(--ks-border)]">
                <tr>
                  <th className="p-3 font-medium text-start">{t(language, 'sizeColHeader')}</th>
                  <th className="p-3 font-medium text-end">{t(language, 'chestColHeader')}</th>
                  <th className="p-3 font-medium text-end">{t(language, 'shoulderColHeader')}</th>
                  <th className="p-3 font-medium text-end">{t(language, 'lengthColHeader')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-border)]">
                <tr>
                  <td className="p-3 font-semibold text-start">S</td>
                  <td className="p-3 text-end">41.5</td>
                  <td className="p-3 text-end">18.2</td>
                  <td className="p-3 text-end">27.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-start">M</td>
                  <td className="p-3 text-end">43.5</td>
                  <td className="p-3 text-end">19.0</td>
                  <td className="p-3 text-end">28.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-start">L</td>
                  <td className="p-3 text-end">46.0</td>
                  <td className="p-3 text-end">19.8</td>
                  <td className="p-3 text-end">29.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-start">XL</td>
                  <td className="p-3 text-end">48.5</td>
                  <td className="p-3 text-end">20.6</td>
                  <td className="p-3 text-end">30.5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Scroll-triggered compact Mobile Sticky Purchase Bar */}
      <AnimatePresence>
        {showMobileStickyBar && (
          <motion.div
            key="pdp-mobile-sticky"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={STUDIO_TRANSITION.base}
            className="lg:hidden fixed bottom-0 inset-x-0 z-30 min-h-[54px] px-3 sm:px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] bg-[var(--ks-surface)]/95 backdrop-blur-md border-t border-[var(--ks-border)] shadow-[0_-4px_16px_rgba(26,26,24,0.06)] flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-[var(--ks-text-primary)] truncate">
                  {product.name}
                </span>
                <span className="text-xs font-mono-num font-semibold shrink-0 tabular-nums text-[var(--ks-text-primary)]">
                  {formatCurrency(product.price * quantity, currency)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ks-text-muted)] truncate">
                {color.name} · {size}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={outOfStock}
              className="whitespace-nowrap shrink-0 min-h-[40px]"
              onClick={() => addToCart(product, color.name, color.hex, size, quantity, true)}
            >
              {outOfStock ? t(language, 'outOfStock') : t(language, 'addToBag')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
