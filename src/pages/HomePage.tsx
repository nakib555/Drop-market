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
  HeartPulse,
  ShieldCheck,
  Shirt,
  Sofa,
  Sparkles,
  Star,
  Tag,
  Truck,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ATELIER_CRAFT_IMAGE, BRAND_STUDIOS, HERO_IMAGE } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { STUDIO15_MIN_USD, formatCurrency } from '../utils/format';
import { STUDIO_TRANSITION } from '../utils/motion';
import { ScrollReveal } from '../components/ui/MotionPrimitives';
import { TypingGradientText } from '../components/ui/TypingGradientText';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { ProductGridSkeleton, ResilientImage } from '../components/ui/Primitives';

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

const CLIENT_TESTIMONIALS = [
  {
    quote:
      'The Aeterna AE-1 wireless headphones and Zonolith hi-fi speaker share the same milled aluminum restraint as our studio furniture. Acoustic clarity and build tolerances are remarkable.',
    name: 'Clara Lindqvist',
    role: 'Principal Architect, Copenhagen',
  },
  {
    quote:
      'Picked up the Kyoto heavyweight merino overshirt alongside the Vanguard 22L daypack before a two-week Tokyo trip. Both held up through rain and transit without looking worn.',
    name: 'Marcus Sterling',
    role: 'Creative Director, New York',
  },
  {
    quote:
      'Being able to order single-origin coffee, cold-pressed skincare, workshop tools, and oak living pieces in BDT with next-day Dhaka Metro courier is effortless.',
    name: 'Nadia Rahman',
    role: 'Design Buyer, Dhaka & Portland',
  },
];

const HERO_TYPING_PHRASES = [
  'All in One Place.',
  'Audio, Tech & Smart Gear.',
  'Tailored Fashion & Carry.',
  'Home, Tools & Wellness.',
  'Delivered Across Bangladesh.',
];

export const HomePage: React.FC = () => {
  const {
    categories,
    products,
    currency,
    shippingConfig,
    recentlyViewedIds,
    navigate,
    storefrontLoading,
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
        const featuredSlugs = [
          'aeterna-ae1-studio-wireless-headphones',
          'kyoto-heavyweight-merino-overshirt',
          'aethel-botanical-facial-serum-duo',
          'solis-18v-brushless-drill-precision-kit',
          'nordic-montessori-play-nursery-kit',
          'kuro-smoked-oak-lounge-chair',
        ];
        const picked = featuredSlugs
          .map((slug) => products.find((p) => p.slug === slug))
          .filter((p): p is NonNullable<typeof p> => Boolean(p));
        return picked.length >= 6 ? picked : products.slice(0, 6);
      }
    }
  }, [products, activeTab]);

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
    <div className="space-y-16 sm:space-y-20 lg:space-y-24">
      {/* 1. Editorial Split Hero */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          <div className="md:col-span-6 lg:col-span-5 flex flex-col justify-between py-1 lg:py-4 space-y-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8F6438] dark:text-[#C89B67] font-medium">
                Kinto Studio 10-Department Marketplace
              </p>
              <h1 className="font-display text-[clamp(2rem,3.6vw,3.35rem)] font-medium leading-[1.06] tracking-tight text-[#171716] dark:text-[#F4F3EF]">
                Everything You Need.
                <span className="block min-h-[1.14em] mt-1">
                  <TypingGradientText phrases={HERO_TYPING_PHRASES} />
                </span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed max-w-lg">
                Shop ten specialized departments—from electronics, tailored apparel, furniture, and skincare to grocery, outdoor gear, books, tools, baby, and wellness.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate({ name: 'shop', category: 'all' })}
                >
                  <span>Shop All Departments</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate({ name: 'offers' })}>
                  Explore Offers
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
              <span className="truncate">
                Spotlight: Aeterna AE-1 Studio Wireless Headphones
              </span>
              <button
                type="button"
                onClick={() =>
                  navigate({ name: 'product', slug: 'aeterna-ae1-studio-wireless-headphones' })
                }
                className="font-medium text-[#171716] dark:text-[#F4F3EF] hover:underline whitespace-nowrap cursor-pointer"
              >
                Inspect Product
              </button>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-7">
            <div className="relative h-56 sm:h-80 md:h-full md:min-h-[380px] lg:h-[430px] xl:h-[500px] rounded-lg overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F]">
              <ResilientImage
                src={HERO_IMAGE}
                alt="Curated living interior featuring Kinto Studio furniture, lighting, audio hardware, and daily objects"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 4-column guarantees bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 px-5 sm:px-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 mt-0.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <div>
              <p className="text-sm font-medium">
                Complimentary Shipping {formatCurrency(freeThresholdUsd, currency)}+
              </p>
              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                Next-day Dhaka Metro &amp; 64-district Bangladesh delivery
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <div>
              <p className="text-sm font-medium">bKash, Nagad, Cards &amp; COD</p>
              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                Server-verified payments &amp; Cash on Delivery
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-4 h-4 mt-0.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <div>
              <p className="text-sm font-medium">30-Day Returns &amp; Warranties</p>
              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                Protected across electronics, apparel, furniture &amp; tools
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 mt-0.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <div>
              <p className="text-sm font-medium">BDT (৳) &amp; USD ($) Pricing</p>
              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                Live FX header switch &amp; BDT Bangladesh settlement
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Department — Balanced 2-col mobile / 5-col desktop for 10 universal departments */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">
              {categories.length} Universal Departments
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
              Shop by Department
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'shop', category: 'all' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
          >
            <span>Browse Full Catalog ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {categories.map((cat) => {
            const IconComp = DEPT_ICON_MAP[cat.iconName] || Sparkles;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => navigate({ name: 'category', category: cat.slug })}
                className="group text-left rounded-lg overflow-hidden bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F]">
                  <ResilientImage
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  <span className="absolute top-2.5 left-2.5 w-8 h-8 rounded-md bg-white/90 dark:bg-[#191917]/90 border border-[#E5E3DD]/70 dark:border-[#2C2C28] flex items-center justify-center text-[#171716] dark:text-[#F4F3EF]">
                    <IconComp className="w-4 h-4" />
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-1">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#84827B] truncate">
                      {cat.countLabel}
                    </p>
                    <p className="text-sm sm:text-[15px] font-medium mt-0.5 group-hover:text-[#8F6438] dark:group-hover:text-[#C89B67] transition-colors line-clamp-1">
                      {cat.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#84827B] font-mono-num">
                    {cat.subcategories.length > 0
                      ? `${cat.subcategories.length} sub-collections`
                      : 'Shop collection'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollReveal>

      {/* 3. Trending Across Departments */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">High Demand</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
              Trending Products
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'shop', collection: 'trending', category: 'all' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
          >
            <span>See all trending</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {storefrontLoading ? (
          <ProductGridSkeleton
            count={4}
            className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            label="Loading trending products"
          />
        ) : (
          <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* 4. Curated Multi-Department Collection Tabs (includes New Arrivals & Best Sellers) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">
              Curated Collections
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
              Selected for Everyday Utility
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Department showcase"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F2F0EC] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] overflow-x-auto no-scrollbar max-w-full"
          >
            {(
              [
                { id: 'all', label: 'Featured Mix' },
                { id: 'new-arrivals', label: 'New Arrivals' },
                { id: 'best-sellers', label: 'Best Sellers' },
                { id: 'electronics', label: 'Tech & Audio' },
                { id: 'fashion', label: 'Fashion & Carry' },
                { id: 'home-office', label: 'Home & Office' },
                { id: 'beauty-grocery', label: 'Beauty & Grocery' },
                { id: 'auto-kids-health', label: 'Tools, Baby & Wellness' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-[#171716] dark:text-[#F4F3EF]'
                      : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="home-collection-tab"
                      transition={STUDIO_TRANSITION.springTab}
                      className="absolute inset-0 rounded-md bg-[#FFFFFF] dark:bg-[#262623] shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {storefrontLoading ? (
          <ProductGridSkeleton
            count={6}
            className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
            label="Loading curated collection"
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
            <span>View Full Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* 5. Seasonal Promotional Campaign Banner */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="rounded-lg bg-[#171716] dark:bg-[#191917] text-[#FAF9F6] border border-[#2C2C28] p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#E2B887] font-medium">
              <Tag className="w-3.5 h-3.5" /> Seasonal Marketplace Privilege
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-medium leading-tight">
              Save 15% across any category on orders over{' '}
              {formatCurrency(STUDIO15_MIN_USD, currency)} with code{' '}
              <span className="font-mono-num text-[#E2B887]">STUDIO15</span>
            </h2>
            <p className="text-sm text-[#B4B2AC]">
              Mix audio gear, apparel, beauty sets, and home essentials in one consolidated bag with automatic multi-currency totals.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate({ name: 'offers' })}
            >
              Shop Seasonal Offers
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/25 text-white hover:bg-white/10"
              onClick={() => navigate({ name: 'shop', collection: 'best-sellers', category: 'all' })}
            >
              Best Sellers
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {/* 6. Featured Partner Brands Directory Strip */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">Trusted Makers</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
              Featured Brands &amp; Studios
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate({ name: 'brands' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
          >
            <span>Explore Maker Directory</span>
            <ArrowRight className="w-4 h-4" />
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
              className="text-left p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#8F6438] dark:hover:border-[#C89B67] transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[#84827B]">
                <span>{brand.origin}</span>
                <span className="font-mono-num">Est. {brand.founded}</span>
              </div>
              <p className="font-display text-2xl font-medium">{brand.name}</p>
              <p className="text-xs text-[#8F6438] dark:text-[#C89B67] font-medium">
                {brand.specialty}
              </p>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* 7. Craftsmanship & Studio Provenance */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch rounded-lg overflow-hidden bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <div className="lg:col-span-7 min-h-[240px] sm:min-h-[340px] bg-[#F2F0EC] dark:bg-[#22221F]">
            <ResilientImage
              src={ATELIER_CRAFT_IMAGE}
              alt="Kinto Studio prototyping bench with precision hardware, fabrics, stone samples, and woodworking tools"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#8F6438] dark:text-[#C89B67] font-medium">
                Quality Standard
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium leading-tight">
                One rigorous design bar across every department.
              </h2>
              <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                From acoustic engineers in Copenhagen to textile weavers in Kyoto and specialty roasters in Oregon, Kinto Studio vets every product for transparent specifications, authentic materials, and dependable warranties.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="md" onClick={() => navigate({ name: 'about' })}>
                Our Standards
              </Button>
              <Button variant="outline" size="md" onClick={() => navigate({ name: 'journal' })}>
                Read Studio Journal
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 8. Verified Customer Reviews */}
      <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">Client Perspectives</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
              Trusted Across Homes &amp; Studios
            </h2>
          </div>
          <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] font-mono-num">
            4.9 / 5.0 average across 680+ verified orders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {CLIENT_TESTIMONIALS.map((item) => (
            <blockquote
              key={item.name}
              className="p-6 sm:p-7 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <div
                  className="flex items-center gap-0.5 text-[#8F6438] dark:text-[#C89B67]"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-[#171716] dark:text-[#F4F3EF]">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
              <footer className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </ScrollReveal>

      {/* 9. Recently Viewed Strip (renders when shopper has browsing history) */}
      {recentlyViewedProducts.length > 0 && (
        <ScrollReveal className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#84827B]">
                Continue Inspecting
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium mt-1">
                Recently Viewed
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'shop', category: 'all' })}
              className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
            >
              <span>Browse Full Catalog</span>
              <ArrowRight className="w-4 h-4" />
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
