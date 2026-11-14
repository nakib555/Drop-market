import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquarePlus,
  Minus,
  Plus,
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
import { formatCurrency, formatShortDate, getDiscountPercent } from '../utils/format';
import { STUDIO_TRANSITION } from '../utils/motion';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/FormFields';
import { Breadcrumb, EmptyState, Modal, ResilientImage } from '../components/ui/Primitives';

export const ProductDetailPage: React.FC = () => {
  const {
    route,
    currency,
    products,
    navigate,
    addToCart,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    recentlyViewedIds,
    recordProductView,
    submitProductReview,
    submitProductQuestion,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === route.slug) || products[0],
    [products, route.slug]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
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

  // Q&A submission state
  const [qaAuthor, setQaAuthor] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaError, setQaError] = useState('');

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setZoomed(false);
    setSelectedColorIdx(0);
    setSelectedSizeIdx(0);
    setQuantity(1);
    setActiveTab('specs');
    recordProductView(product.id);
  }, [product?.id, recordProductView]);

  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product?.id]);

  if (!product) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16">
        <EmptyState
          title="Product not found"
          description="The requested piece could not be located in our current catalog."
          actionLabel="Return to Shop"
          onAction={() => navigate({ name: 'shop', category: 'all' })}
        />
      </div>
    );
  }

  const color = product.colors[selectedColorIdx] || product.colors[0];
  const size = product.sizes[selectedSizeIdx] || product.sizes[0];
  const discount = getDiscountPercent(product.price, product.originalPrice);
  const isWishlisted = wishlistIds.includes(product.id);
  const isCompared = compareIds.includes(product.id);
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

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || product.images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveImageIdx((i) => (i + 1) % product.images.length);
      } else {
        setActiveImageIdx((i) => (i - 1 + product.images.length) % product.images.length);
      }
      setZoomed(false);
    }
    touchStartX.current = null;
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError('Please complete your name, review headline, and feedback.');
      return;
    }
    setReviewError('');
    submitProductReview(product.id, {
      author: reviewAuthor.trim(),
      location: reviewLocation.trim() || 'Verified Shopper',
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
    });
    setReviewAuthor('');
    setReviewLocation('');
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim()) {
      setQaError('Please enter your question before submitting.');
      return;
    }
    setQaError('');
    submitProductQuestion(product.id, qaAuthor || 'Guest Shopper', qaQuestion);
    setQaQuestion('');
    setQaAuthor('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 pb-20 lg:pb-16 space-y-14">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          {
            label: product.categoryLabel,
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
            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F] border border-[#E5E3DD] dark:border-[#2C2C28]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${product.id}-${activeImageIdx}`}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.4 }}
                transition={STUDIO_TRANSITION.fast}
                className="w-full h-full"
              >
                <ResilientImage
                  src={product.images[activeImageIdx]}
                  alt={`${product.name} — view ${activeImageIdx + 1}`}
                  onClick={() => setZoomed((z) => !z)}
                  className={`w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-zoom-in ${
                    zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                  }`}
                />
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? 'Reset zoom' : 'Zoom product image'}
              className="absolute top-3 right-3 w-10 h-10 rounded-md bg-white/90 dark:bg-[#191917]/90 text-[#171716] dark:text-[#F4F3EF] flex items-center justify-center shadow-sm cursor-pointer"
            >
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>

            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIdx(
                      (i) => (i - 1 + product.images.length) % product.images.length
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-[#191917]/90 text-[#171716] dark:text-[#F4F3EF] flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIdx((i) => (i + 1) % product.images.length)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 dark:bg-[#191917]/90 text-[#171716] dark:text-[#F4F3EF] flex items-center justify-center shadow-sm cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
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
                    setActiveImageIdx(idx);
                    setZoomed(false);
                  }}
                  aria-label={`Select thumbnail ${idx + 1}`}
                  className={`aspect-[4/3] rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                    idx === activeImageIdx
                      ? 'border-[#171716] dark:border-[#F4F3EF]'
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
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 p-5 sm:p-7 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-[#84827B]">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    name: 'shop',
                    category: product.category,
                    brand: product.brand,
                  })
                }
                className="uppercase tracking-wider hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
              >
                {product.brand}
              </button>
              <span className="font-mono-num">SKU: {product.sku}</span>
            </div>
            <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67]">
                {product.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className="inline-flex items-center gap-1.5 text-xs font-mono-num cursor-pointer hover:underline"
              >
                <Star className="w-3.5 h-3.5 fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-[#5C5B57] dark:text-[#A3A19B]">
                  ({product.reviewCount} reviews)
                </span>
              </button>
              <span aria-hidden="true" className="text-[#84827B]">
                ·
              </span>
              <span
                className={`text-xs font-medium inline-flex items-center gap-1 ${
                  product.availability === 'low-stock'
                    ? 'text-[#B45309] dark:text-[#FBBF24]'
                    : 'text-[#1F6E43] dark:text-[#4ADE80]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {product.availability === 'in-stock'
                  ? `In Stock (${product.stockCount} ready)`
                  : product.availability === 'low-stock'
                  ? `Low Stock (${product.stockCount} remaining)`
                  : 'Made to Order'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 pb-4 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
            <span className="text-2xl sm:text-3xl font-mono-num font-semibold">
              {formatCurrency(product.price, currency)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-base font-mono-num line-through text-[#84827B]">
                  {formatCurrency(product.originalPrice, currency)}
                </span>
                <span className="text-xs font-mono-num font-medium text-[#8F6438] dark:text-[#C89B67]">
                  Save {discount}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
            {product.description}
          </p>

          {/* Finish / Color */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium">
              {product.variantColorLabel || 'Finish / Color'}:{' '}
              <span className="text-[#5C5B57] dark:text-[#A3A19B]">{color.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c, idx) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColorIdx(idx)}
                  className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-md border text-xs cursor-pointer transition-colors ${
                    idx === selectedColorIdx
                      ? 'border-[#171716] dark:border-[#F4F3EF] font-medium bg-[#F9F8F6] dark:bg-[#22221F]'
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

          {/* Size / Edition + Conditional Fashion Size Guide */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">
                {product.variantSizeLabel || 'Edition / Size'}
              </p>
              {product.category === 'fashion-apparel' && (
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s, idx) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSizeIdx(idx)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-md border text-xs cursor-pointer transition-colors ${
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

          {/* Quantity + CTAs */}
          <div ref={primaryCtaRef} className="space-y-3 pt-2">
            <div className="flex flex-col min-[390px]:flex-row items-stretch min-[390px]:items-center gap-3">
              <div className="inline-flex items-center justify-between min-[390px]:justify-center border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md h-12 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-11 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-mono-num">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                  aria-label="Increase quantity"
                  className="w-11 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => addToCart(product, color.name, color.hex, size, quantity, true)}
              >
                Add to Bag · {formatCurrency(product.price * quantity, currency)}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <Button
                variant="secondary"
                size="md"
                className="col-span-2 sm:col-span-1"
                onClick={() => {
                  addToCart(product, color.name, color.hex, size, quantity, false);
                  navigate({ name: 'checkout' });
                }}
              >
                Buy Now
              </Button>
              <Button variant="outline" size="md" onClick={() => toggleWishlist(product)}>
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-[#8F6438]' : ''}`} />
                <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
              </Button>
              <Button variant="outline" size="md" onClick={() => toggleCompare(product)}>
                <ArrowLeftRight className="w-4 h-4" />
                <span>{isCompared ? 'Compared' : 'Compare'}</span>
              </Button>
            </div>
          </div>

          {/* Delivery, Return, Warranty Summary */}
          <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-2.5 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0 mt-0.5" />
              <span>{product.deliveryEstimate}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0 mt-0.5" />
              <span>{product.returnPolicy}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0 mt-0.5" />
              <span>{product.warranty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications, Reviews, Q&A & Care Tabs */}
      <section className="pt-8 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-8">
        <div
          role="tablist"
          aria-label="Product documentation"
          className="flex items-center gap-6 border-b border-[#E5E3DD] dark:border-[#2C2C28] overflow-x-auto no-scrollbar"
        >
          {(
            [
              { id: 'specs', label: 'Specifications & Care' },
              { id: 'reviews', label: `Reviews (${product.reviews.length})` },
              { id: 'qa', label: `Q&A (${questions.length})` },
              { id: 'shipping', label: 'Delivery & Warranty' },
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
                className={`relative pb-3.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#171716] dark:text-[#F4F3EF]'
                    : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                }`}
              >
                {tab.label}
                {isSelected && (
                  <motion.span
                    layoutId="pdp-doc-tab"
                    transition={STUDIO_TRANSITION.springTab}
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#171716] dark:bg-[#F4F3EF]"
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
                <dl className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="py-3.5 flex items-center justify-between gap-4 text-sm"
                    >
                      <dt className="text-[#5C5B57] dark:text-[#A3A19B]">{spec.label}</dt>
                      <dd className="font-medium text-right font-mono-num">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="p-6 rounded-lg bg-[#F2F0EC] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display text-2xl font-medium">
                      Maker Provenance &amp; Care
                    </h3>
                    <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                      Produced in collaboration with {product.brand} for the {product.categoryLabel}{' '}
                      department. Covered by {product.warranty.toLowerCase()}.
                    </p>
                  </div>
                  {product.careNote && (
                    <div className="pt-3 border-t border-[#DCD9D0] dark:border-[#2C2C28]">
                      <p className="text-xs uppercase tracking-wider text-[#84827B] mb-1">
                        Handling &amp; Care Note
                      </p>
                      <p className="text-sm text-[#171716] dark:text-[#F4F3EF]">
                        {product.careNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-4">
                  {product.reviews.length === 0 ? (
                    <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] py-4">
                      No written reviews yet for this product. Share the first impression using the form.
                    </p>
                  ) : (
                    product.reviews.map((rev) => (
                      <article
                        key={rev.id}
                        className="p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-0.5 text-[#8F6438] dark:text-[#C89B67]">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-[#84827B] font-mono-num">
                            {formatShortDate(rev.date)}
                          </span>
                        </div>
                        <h4 className="text-base font-medium">{rev.title}</h4>
                        <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                          {rev.comment}
                        </p>
                        <p className="text-xs text-[#84827B] pt-1">
                          {rev.author} · {rev.location} {rev.verified ? '· Verified Owner' : ''}
                        </p>
                      </article>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleReviewSubmit}
                  className="lg:col-span-5 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4 h-fit"
                >
                  <h3 className="font-display text-2xl font-medium">Write a Review</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Your Name"
                      required
                      value={reviewAuthor}
                      onChange={(e) => setReviewAuthor(e.target.value)}
                      placeholder="Alex Mercer"
                    />
                    <Input
                      label="City / Country"
                      value={reviewLocation}
                      onChange={(e) => setReviewLocation(e.target.value)}
                      placeholder="Dhaka / Portland"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium">Rating</span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          aria-label={`${star} stars`}
                          className="p-1.5 cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating
                                ? 'fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]'
                                : 'text-[#DCD9D0] dark:text-[#3A3934]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Headline"
                    required
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Summarize your impression"
                  />
                  <Textarea
                    label="Your Feedback"
                    required
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share notes on finish, performance, sizing, or delivery..."
                  />
                  {reviewError && (
                    <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{reviewError}</p>
                  )}
                  <Button type="submit" variant="primary" size="md" fullWidth>
                    Publish Review
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'qa' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-4">
                  {questions.length === 0 ? (
                    <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] py-4">
                      No questions asked yet for this product. Ask our specialists anything using the form.
                    </p>
                  ) : (
                    questions.map((qa) => (
                      <article
                        key={qa.id}
                        className="p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[#84827B]">
                            <span>Question from {qa.author}</span>
                            <span className="font-mono-num">{formatShortDate(qa.date)}</span>
                          </div>
                          <p className="text-sm font-semibold">{qa.question}</p>
                        </div>
                        <div className="pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                          <p className="text-[11px] uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
                            Answer · {qa.answeredBy}
                          </p>
                          <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                            {qa.answer}
                          </p>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleQuestionSubmit}
                  className="lg:col-span-5 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4 h-fit"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
                    <h3 className="font-display text-2xl font-medium">Ask a Question</h3>
                  </div>
                  <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                    Questions about sizing, voltage compatibility, dietary notes, or shipping? Post below.
                  </p>
                  <Input
                    label="Your Name"
                    value={qaAuthor}
                    onChange={(e) => setQaAuthor(e.target.value)}
                    placeholder="Alex Mercer"
                  />
                  <Textarea
                    label="Your Question"
                    required
                    rows={3}
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="Ask about compatibility, materials, sizing, or delivery..."
                  />
                  {qaError && (
                    <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{qaError}</p>
                  )}
                  <Button type="submit" variant="primary" size="md" fullWidth>
                    Post Question
                  </Button>
                </form>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="p-5 rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
                  <p className="font-medium">Dispatch &amp; Transit</p>
                  <p className="text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                    {product.deliveryEstimate}. Orders over $500 (৳60,000) qualify for complimentary insured shipping.
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
                  <p className="font-medium">30-Day Home Trial</p>
                  <p className="text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                    {product.returnPolicy}. Initiate returns or exchanges directly through your Customer Account.
                  </p>
                </div>
                <div className="p-5 rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
                  <p className="font-medium">Warranty Coverage</p>
                  <p className="text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                    {product.warranty}. Covers craftsmanship defects, hardware failures, and transit breakage.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Related & Recently Viewed */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
          <h2 className="font-display text-3xl font-medium">Complementary Products</h2>
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="space-y-6 pt-8 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
          <h2 className="font-display text-3xl font-medium">Recently Viewed</h2>
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
        title="Apparel & Fit Size Guide"
      >
        <div className="space-y-4 text-sm">
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
            Measurements reflect relaxed garment dimensions laid flat. Select your normal size for intended layering room.
          </p>
          <div className="overflow-x-auto rounded-md border border-[#E5E3DD] dark:border-[#2C2C28]">
            <table className="w-full text-left text-xs font-mono-num">
              <thead className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28]">
                <tr>
                  <th className="p-3 font-medium">Size</th>
                  <th className="p-3 font-medium">Chest (in)</th>
                  <th className="p-3 font-medium">Shoulder (in)</th>
                  <th className="p-3 font-medium">Length (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                <tr>
                  <td className="p-3 font-semibold">S</td>
                  <td className="p-3">41.5</td>
                  <td className="p-3">18.2</td>
                  <td className="p-3">27.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">M</td>
                  <td className="p-3">43.5</td>
                  <td className="p-3">19.0</td>
                  <td className="p-3">28.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">L</td>
                  <td className="p-3">46.0</td>
                  <td className="p-3">19.8</td>
                  <td className="p-3">29.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">XL</td>
                  <td className="p-3">48.5</td>
                  <td className="p-3">20.6</td>
                  <td className="p-3">30.5</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Scroll-triggered compact Mobile Sticky Purchase Bar (<= 48px) */}
      <AnimatePresence>
        {showMobileStickyBar && (
          <motion.div
            key="pdp-mobile-sticky"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={STUDIO_TRANSITION.base}
            className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-12 px-3 sm:px-4 bg-[#FFFFFF]/95 dark:bg-[#191917]/95 backdrop-blur-md border-t border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex items-center gap-2">
              <span className="text-xs font-medium truncate">{product.name}</span>
              <span className="text-xs font-mono-num font-semibold shrink-0">
                {formatCurrency(product.price, currency)}
              </span>
            </div>
            <Button
              variant="primary"
              size="xs"
              onClick={() => addToCart(product, color.name, color.hex, size, quantity, true)}
            >
              Add to Bag
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
