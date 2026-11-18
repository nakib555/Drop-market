import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Baby,
  BookOpen,
  Check,
  Coffee,
  Compass,
  Cpu,
  Droplets,
  Globe,
  HeartPulse,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
  Tag,
  Truck,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_STUDIOS, HERO_IMAGE } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { STUDIO15_MIN_USD, formatCurrency } from '../utils/format';
import { t, translateDepartmentName, type UiStringKey } from '../utils/i18n';
import { STUDIO_TRANSITION } from '../utils/motion';
import { ScrollReveal } from '../components/ui/MotionPrimitives';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { EmptyState, ProductGridSkeleton, ResilientImage } from '../components/ui/Primitives';
import { TypingGradientText } from '../components/ui/TypingGradientText';

const DEPT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Shirt,
  Sofa,
  Droplets,
  Coffee,
  Compass,
  BookOpen,
  Wrench,
  Baby,
  HeartPulse,
};

type HomeCollectionTab =
  | 'all'
  | 'new-arrivals'
  | 'best-sellers'
  | 'electronics'
  | 'fashion'
  | 'home-office'
  | 'beauty-grocery'
  | 'auto-kids-health';

const COLLECTION_TABS: ReadonlyArray<{ id: HomeCollectionTab; labelKey: UiStringKey }> = [
  { id: 'all', labelKey: 'tabFeatured' },
  { id: 'new-arrivals', labelKey: 'tabNewArrivals' },
  { id: 'best-sellers', labelKey: 'tabBestSellers' },
  { id: 'electronics', labelKey: 'tabElectronics' },
  { id: 'fashion', labelKey: 'tabFashion' },
  { id: 'home-office', labelKey: 'tabHomeOffice' },
  { id: 'beauty-grocery', labelKey: 'tabBeautyGrocery' },
  { id: 'auto-kids-health', labelKey: 'tabAutoKidsHealth' },
];

export const HomePage: React.FC = () => {
  const {
    language,
    categories,
    products,
    currency,
    shippingConfig,
    recentlyViewedIds,
    navigate,
    storefrontLoading,
    catalogError,
    retryCatalogLoad,
  } = useStore();
  const [activeTab, setActiveTab] = useState<HomeCollectionTab>('all');

  const freeThresholdUsd = useMemo(
    () =>
      shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120,
    [shippingConfig]
  );

  const trendingProducts = useMemo(() => {
    const trending = products.filter((p) => p.isTrending);
    return (trending.length >= 4 ? trending : products).slice(0, 4);
  }, [products]);

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 4),
    [recentlyViewedIds, products]
  );

  const collectionProducts = useMemo(() => {
    switch (activeTab) {
      case 'new-arrivals': {
        const recent = products.filter((p) => p.isNewArrival);
        return (recent.length > 0 ? recent : products).slice(0, 6);
      }
      case 'best-sellers': {
        const best = products.filter((p) => p.isBestSeller);
        return (best.length > 0 ? best : products).slice(0, 6);
      }
      case 'electronics':
        return products.filter((p) => p.category === 'electronics-tech').slice(0, 6);
      case 'fashion':
        return products
          .filter(
            (p) =>
              p.category === 'fashion-accessories' || p.category === 'sports-outdoors-travel'
          )
          .slice(0, 6);
      case 'home-office':
        return products
          .filter(
            (p) =>
              p.category === 'home-furniture-kitchen' ||
              p.category === 'books-stationery-office'
          )
          .slice(0, 6);
      case 'beauty-grocery':
        return products
          .filter(
            (p) =>
              p.category === 'beauty-care' || p.category === 'grocery-food-household'
          )
          .slice(0, 6);
      case 'auto-kids-health':
        return products
          .filter(
            (p) =>
              p.category === 'automotive-tools-industrial' ||
              p.category === 'baby-kids-toys-hobbies' ||
              p.category === 'health-wellness-pets'
          )
          .slice(0, 6);
      case 'all':
      default: {
        const picked: typeof products = [];
        const seenDepartments = new Set<string>();
        for (const item of products) {
          if (!seenDepartments.has(item.category)) {
            seenDepartments.add(item.category);
            picked.push(item);
          }
          if (picked.length >= 6) break;
        }
        return picked.length >= 6 ? picked : products.slice(0, 6);
      }
    }
  }, [products, activeTab]);

  const spotlightProduct = trendingProducts[0] || products[0];

  const scrollToDepartments = () => {
    const el = document.getElementById('departments-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate({ name: 'shop', category: 'all' });
    }
  };

  const handleViewAllCollection = () => {
    switch (activeTab) {
      case 'new-arrivals':
        navigate({ name: 'shop', collection: 'new-arrivals', category: 'all' });
        break;
      case 'best-sellers':
        navigate({ name: 'shop', collection: 'best-sellers', category: 'all' });
        break;
      case 'electronics':
        navigate({ name: 'category', category: 'electronics-tech' });
        break;
      case 'fashion':
        navigate({ name: 'category', category: 'fashion-accessories' });
        break;
      case 'home-office':
        navigate({ name: 'category', category: 'home-furniture-kitchen' });
        break;
      case 'beauty-grocery':
        navigate({ name: 'category', category: 'beauty-care' });
        break;
      case 'auto-kids-health':
        navigate({ name: 'category', category: 'automotive-tools-industrial' });
        break;
      default:
        navigate({ name: 'shop', category: 'all' });
    }
  };

  return (
    <div className="space-y-14 sm:space-y-20 lg:space-y-24">
      {/* 1. Editorial Split Hero */}
      <section className="ks-container pt-4 sm:pt-6 lg:pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          <div className="md:col-span-6 lg:col-span-5 @container flex flex-col justify-between py-1 lg:py-4 space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--ks-accent)] font-medium">
                {t(language, 'heroEyebrow')}
              </p>
              <h1 className="ks-heading-hero !text-[clamp(1.65rem,7.5cqi,3.3rem)] !leading-[1.1] space-y-1">
                <span className="block whitespace-nowrap">{t(language, 'heroTitleLine1')}</span>
                <span className="block">
                  <TypingGradientText
                    key={language}
                    singleLine
                    className="text-[clamp(1.5rem,7cqi,3.1rem)] leading-[1.12]"
                    phrases={[
                      t(language, 'heroTypingPhrase1'),
                      t(language, 'heroTypingPhrase2'),
                    ]}
                  />
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-[var(--ks-text-secondary)] leading-relaxed max-w-lg">
                {t(language, 'heroSubtitle')}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate({ name: 'shop', category: 'all' })}
                >
                  <span>{t(language, 'shopAllProducts')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
                <Button variant="outline" size="lg" onClick={scrollToDepartments}>
                  {t(language, 'exploreDepartments')}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--ks-border)] flex items-center justify-between gap-3 text-xs text-[var(--ks-text-secondary)]">
              <span className="min-w-0 flex-1 truncate">
                {spotlightProduct
                  ? t(language, 'featuredItemPrefix', { name: spotlightProduct.name })
                  : t(language, 'heroSubFallback')}
              </span>
              {spotlightProduct && (
                <button
                  type="button"
                  onClick={() =>
                    navigate({ name: 'product', slug: spotlightProduct.slug })
                  }
                  className="font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t(language, 'viewProduct')}
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-7">
            <div className="relative h-56 sm:h-80 md:h-full md:min-h-[380px] lg:h-[430px] xl:h-[500px] rounded-[var(--ks-radius-lg)] overflow-hidden bg-[var(--ks-surface-muted)]">
              <ResilientImage
                src={HERO_IMAGE}
                alt="Living space arranged with oak seating, warm lighting, and wireless audio hardware"
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Shopping Benefits Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 px-5 sm:px-6 ks-surface-card">
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
            <div>
              <p className="text-sm font-medium leading-snug text-[var(--ks-text-primary)]">
                {t(language, 'benefitZonesTitle')}
              </p>
              <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                {t(language, 'benefitZonesDesc', {
                  amount: formatCurrency(freeThresholdUsd, currency),
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
            <div>
              <p className="text-sm font-medium leading-snug text-[var(--ks-text-primary)]">
                {t(language, 'benefitPayTitle')}
              </p>
              <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                {t(language, 'benefitPayDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
            <div>
              <p className="text-sm font-medium leading-snug text-[var(--ks-text-primary)]">
                {t(language, 'benefitReturnsTitle')}
              </p>
              <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                {t(language, 'benefitReturnsDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
            <div>
              <p className="text-sm font-medium leading-snug text-[var(--ks-text-primary)]">
                {t(language, 'benefitCurrencyTitle')}
              </p>
              <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                {t(language, 'benefitCurrencyDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Department (All 10 Departments Preserved) */}
      <ScrollReveal className="ks-container" id="departments-grid">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="ks-eyebrow">{t(language, 'departmentsEyebrow')}</p>
            <h2 className="ks-heading-section mt-1">{t(language, 'browseByDepartment')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'shop', category: 'all' })}
            className="self-start sm:self-auto text-start whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
          >
            <span>{t(language, 'shopAllProductsCount', { count: products.length })}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((cat) => {
            const IconComp = DEPT_ICON_MAP[cat.iconName] || Sparkles;
            const localizedName = translateDepartmentName(language, cat.slug, cat.name);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => navigate({ name: 'category', category: cat.slug })}
                className="group text-start rounded-[var(--ks-radius-lg)] overflow-hidden bg-[var(--ks-surface)] border border-[var(--ks-border)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--ks-shadow-card-hover)] cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--ks-surface-muted)]">
                  <ResilientImage
                    src={cat.image}
                    alt={localizedName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  <span className="absolute top-2.5 start-2.5 w-8 h-8 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)]/92 border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-text-primary)]">
                    <IconComp className="w-4 h-4" />
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-1">
                  <div>
                    <p className="text-[11px] text-[var(--ks-text-muted)] truncate">
                      {cat.countLabel}
                    </p>
                    <p className="text-sm sm:text-[15px] font-medium mt-0.5 text-[var(--ks-text-primary)] group-hover:text-[var(--ks-accent)] transition-colors line-clamp-1">
                      {localizedName}
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--ks-text-muted)] font-mono-num">
                    {cat.subcategories.length > 0
                      ? t(language, 'categoriesCount', { count: cat.subcategories.length })
                      : t(language, 'viewDepartment')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* 3. Featured / Trending Products */}
      <ScrollReveal className="ks-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="ks-eyebrow">{t(language, 'popularSelection')}</p>
            <h2 className="ks-heading-section mt-1">{t(language, 'trendingProducts')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'shop', collection: 'trending', category: 'all' })}
            className="self-start sm:self-auto text-start whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
          >
            <span>{t(language, 'viewAllTrending')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {storefrontLoading ? (
          <ProductGridSkeleton
            count={4}
            className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            label="Loading trending products"
          />
        ) : catalogError && products.length === 0 ? (
          <div className="rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
            <EmptyState
              title={t(language, 'unableToLoadCatalog')}
              description={catalogError}
              actionLabel={t(language, 'retryLoadingCatalog')}
              onAction={() => retryCatalogLoad()}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* 4. Department Showcase Tabs */}
      <section className="ks-container">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
          <div>
            <p className="ks-eyebrow">{t(language, 'byCategory')}</p>
            <h2 className="ks-heading-section mt-1">{t(language, 'everydayEssentials')}</h2>
          </div>

          <div
            role="tablist"
            aria-label="Product collections"
            className="inline-flex items-center gap-1 p-1 rounded-[var(--ks-radius-lg)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] overflow-x-auto no-scrollbar max-w-full"
          >
            {COLLECTION_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 rounded-[var(--ks-radius-md)] text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-[var(--ks-text-primary)]'
                      : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="home-collection-tab"
                      transition={STUDIO_TRANSITION.springTab}
                      className="absolute inset-0 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{t(language, tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {storefrontLoading ? (
          <ProductGridSkeleton
            count={6}
            className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            label="Loading products"
          />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={STUDIO_TRANSITION.fast}
              className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            >
              {collectionProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" onClick={handleViewAllCollection}>
            <span>{t(language, 'browseCollection')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      </section>

      {/* 5. Seasonal Promo Banner */}
      <ScrollReveal className="ks-container">
        <div className="rounded-[var(--ks-radius-lg)] bg-[#222220] dark:bg-[#191917] text-[#FAF9F6] border border-[#2C2C27] p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] text-[#E2B887] font-medium">
              <Tag className="w-3.5 h-3.5" /> {t(language, 'seasonalOffer')}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-medium leading-tight">
              {t(language, 'promoBannerHeadline', {
                amount: formatCurrency(STUDIO15_MIN_USD, currency),
              })}
            </h2>
            <p className="text-sm text-[#B4B2AC]">
              {t(language, 'promoBannerDesc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate({ name: 'offers' })}
            >
              {t(language, 'shopOffers')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/25 text-white hover:bg-white/10"
              onClick={() => navigate({ name: 'shop', collection: 'best-sellers', category: 'all' })}
            >
              {t(language, 'bestSellers')}
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {/* 6. Featured Brands */}
      <ScrollReveal className="ks-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="ks-eyebrow">{t(language, 'brands')}</p>
            <h2 className="ks-heading-section mt-1">{t(language, 'featuredBrands')}</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'brands' })}
            className="self-start sm:self-auto text-start whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
          >
            <span>{t(language, 'viewAllBrands')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {BRAND_STUDIOS.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() =>
                navigate({
                  name: 'shop',
                  category: brand.categories[0] || 'all',
                  brand: brand.name,
                })
              }
              className="text-start p-5 ks-surface-card hover:border-[var(--ks-accent)] transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-baseline justify-between gap-2 text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                <span className="truncate">
                  {t(language, 'deptCountLabel', { count: brand.categories.length })}
                </span>
                {brand.founded && (
                  <span className="font-mono-num shrink-0">
                    {t(language, 'estYear', { year: brand.founded })}
                  </span>
                )}
              </div>
              <p className="font-display text-2xl font-medium text-[var(--ks-text-primary)]">
                {brand.name}
              </p>
              <p className="text-xs text-[var(--ks-accent)] font-medium">
                {brand.specialty}
              </p>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* 7. Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <ScrollReveal className="ks-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <p className="ks-eyebrow">{t(language, 'yourHistory')}</p>
              <h2 className="ks-heading-section mt-1">{t(language, 'recentlyViewed')}</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'shop', category: 'all' })}
              className="self-start sm:self-auto text-start whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 min-h-[40px] text-sm font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
            >
              <span>{t(language, 'shopAllProducts')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
};
