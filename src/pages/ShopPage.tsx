import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { BRAND_STUDIOS } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { AvailabilityStatus, CategorySlug, SortOption } from '../types/commerce';
import { formatCurrency, fuzzyScoreText } from '../utils/format';
import { StaggerGrid, StaggerItem } from '../components/ui/MotionPrimitives';
import { ProductCard } from '../components/product/ProductCard';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/FormFields';
import {
  Breadcrumb,
  Drawer,
  EmptyState,
  Pagination,
  ProductGridSkeleton,
  ResilientImage,
} from '../components/ui/Primitives';

interface ShopPageProps {
  mode: 'shop' | 'category' | 'search' | 'offers';
}

const ITEMS_PER_PAGE = 9;

export const ShopPage: React.FC<ShopPageProps> = ({ mode }) => {
  const {
    categories,
    products,
    currency,
    route,
    navigate,
    addRecentSearch,
    storefrontLoading,
  } = useStore();

  const catalogMaxPrice = useMemo(() => {
    const highest = Math.max(500, ...products.map((p) => p.price));
    return Math.ceil(highest / 100) * 100;
  }, [products]);

  const [searchInput, setSearchInput] = useState(route.query || '');
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>(
    route.category || 'all'
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    route.subcategory || 'all'
  );
  const [selectedBrand, setSelectedBrand] = useState<string>(route.brand || 'all');
  const [maxPrice, setMaxPrice] = useState<number>(catalogMaxPrice);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [minRating, setMinRating] = useState<number>(0);
  const [availability, setAvailability] = useState<'all' | AvailabilityStatus>('all');
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(
    mode === 'offers' || route.collection === 'offers'
  );
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(route.category || 'all');
    setSelectedSubcategory(route.subcategory || 'all');
    setSelectedBrand(route.brand || 'all');
    setSelectedAttributes({});
    setSearchInput(route.query || '');
    setOnSaleOnly(mode === 'offers' || route.collection === 'offers');
    setPage(1);
  }, [route.category, route.subcategory, route.brand, route.query, route.collection, mode]);

  const activeCategoryMeta = useMemo(
    () =>
      selectedCategory !== 'all'
        ? categories.find((c) => c.slug === selectedCategory)
        : undefined,
    [categories, selectedCategory]
  );

  // Scoped base items for accurate dynamic filter options
  const categoryScopedProducts = useMemo(
    () =>
      selectedCategory === 'all'
        ? products
        : products.filter((p) => p.category === selectedCategory),
    [products, selectedCategory]
  );

  const allColors = useMemo(() => {
    const names = new Set<string>();
    categoryScopedProducts.forEach((p) =>
      p.colors.forEach((c) => names.add(c.name.split('/')[0].trim()))
    );
    return Array.from(names).sort();
  }, [categoryScopedProducts]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    categoryScopedProducts.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [categoryScopedProducts]);

  // Dynamic category-aware facet options
  const dynamicFacetOptions = useMemo(() => {
    if (!activeCategoryMeta) return [];
    return activeCategoryMeta.filterFacets
      .map((facet) => {
        const values = new Set<string>();
        categoryScopedProducts.forEach((p) => {
          const val = p.attributes?.[facet.key];
          if (val) values.add(val);
        });
        return {
          key: facet.key,
          label: facet.label,
          options: Array.from(values).sort(),
        };
      })
      .filter((f) => f.options.length > 0);
  }, [activeCategoryMeta, categoryScopedProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchInput.trim();
    const matched = products.filter((p) => {
      if (route.collection === 'trending' && !p.isTrending) return false;
      if (route.collection === 'best-sellers' && !p.isBestSeller) return false;
      if (route.collection === 'new-arrivals' && !p.isNewArrival) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedSubcategory !== 'all' && p.subcategory !== selectedSubcategory) return false;
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (p.price > maxPrice) return false;
      if (
        selectedColor !== 'all' &&
        !p.colors.some((c) => c.name.toLowerCase().includes(selectedColor.toLowerCase()))
      ) {
        return false;
      }
      if (selectedSize !== 'all' && !p.sizes.includes(selectedSize)) return false;

      // Dynamic attribute facets
      for (const [attrKey, attrVal] of Object.entries(selectedAttributes)) {
        if (attrVal && attrVal !== 'all' && p.attributes?.[attrKey] !== attrVal) {
          return false;
        }
      }

      if (p.rating < minRating) return false;
      if (availability !== 'all' && p.availability !== availability) return false;
      if (onSaleOnly && !p.originalPrice && !p.isFeaturedOffer) return false;

      if (q) {
        const haystack = `${p.name} ${p.brand} ${p.categoryLabel} ${p.subcategoryLabel} ${p.tags.join(
          ' '
        )} ${p.shortDescription} ${p.sku}`;
        if (fuzzyScoreText(q, haystack) < 16) return false;
      }
      return true;
    });

    return matched.sort((a, b) => {
      if (q && sortBy === 'featured') {
        const sa = fuzzyScoreText(q, `${a.name} ${a.brand} ${a.tags.join(' ')}`);
        const sb = fuzzyScoreText(q, `${b.name} ${b.brand} ${b.tags.join(' ')}`);
        if (sb !== sa) return sb - sa;
      }
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'highest-rated':
          return b.rating - a.rating;
        case 'best-selling':
          return b.reviewCount - a.reviewCount;
        case 'newest':
          return Number(Boolean(b.isNewArrival)) - Number(Boolean(a.isNewArrival));
        case 'featured':
        default:
          return Number(Boolean(b.isTrending)) - Number(Boolean(a.isTrending));
      }
    });
  }, [
    products,
    route.collection,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    maxPrice,
    selectedColor,
    selectedSize,
    selectedAttributes,
    minRating,
    availability,
    onSaleOnly,
    searchInput,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (nextCat: CategorySlug | 'all') => {
    setSelectedCategory(nextCat);
    setSelectedSubcategory('all');
    setSelectedAttributes({});
    setPage(1);
    if (mode === 'category') {
      if (nextCat === 'all') {
        navigate({ name: 'shop', category: 'all' });
      } else {
        navigate({ name: 'category', category: nextCat });
      }
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setMaxPrice(catalogMaxPrice);
    setSelectedColor('all');
    setSelectedSize('all');
    setSelectedAttributes({});
    setMinRating(0);
    setAvailability('all');
    setOnSaleOnly(false);
    setPage(1);
    if (mode === 'category' || route.collection || route.brand || route.subcategory) {
      navigate({ name: 'shop', category: 'all' });
    }
  };

  // Active filter chips
  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = [];
  if (selectedCategory !== 'all') {
    activeFilterChips.push({
      key: 'cat',
      label: `Dept: ${activeCategoryMeta?.shortName || selectedCategory}`,
      onClear: () => handleCategoryChange('all'),
    });
  }
  if (selectedSubcategory !== 'all' && activeCategoryMeta) {
    const sub = activeCategoryMeta.subcategories.find((s) => s.slug === selectedSubcategory);
    activeFilterChips.push({
      key: 'sub',
      label: `Type: ${sub?.name || selectedSubcategory}`,
      onClear: () => {
        setSelectedSubcategory('all');
        setPage(1);
      },
    });
  }
  if (selectedBrand !== 'all') {
    activeFilterChips.push({
      key: 'brand',
      label: `Brand: ${selectedBrand}`,
      onClear: () => {
        setSelectedBrand('all');
        setPage(1);
      },
    });
  }
  if (maxPrice < catalogMaxPrice) {
    activeFilterChips.push({
      key: 'price',
      label: `Under ${formatCurrency(maxPrice, currency)}`,
      onClear: () => {
        setMaxPrice(catalogMaxPrice);
        setPage(1);
      },
    });
  }
  if (selectedColor !== 'all') {
    activeFilterChips.push({
      key: 'color',
      label: `Finish: ${selectedColor}`,
      onClear: () => {
        setSelectedColor('all');
        setPage(1);
      },
    });
  }
  if (selectedSize !== 'all') {
    activeFilterChips.push({
      key: 'size',
      label: `Option: ${selectedSize}`,
      onClear: () => {
        setSelectedSize('all');
        setPage(1);
      },
    });
  }
  Object.entries(selectedAttributes).forEach(([k, val]) => {
    if (val && val !== 'all') {
      const facet = activeCategoryMeta?.filterFacets.find((f) => f.key === k);
      activeFilterChips.push({
        key: `attr-${k}`,
        label: `${facet?.label || k}: ${val}`,
        onClear: () => {
          setSelectedAttributes((prev) => {
            const next = { ...prev };
            delete next[k];
            return next;
          });
          setPage(1);
        },
      });
    }
  });
  if (minRating > 0) {
    activeFilterChips.push({
      key: 'rating',
      label: `${minRating}+ ★`,
      onClear: () => {
        setMinRating(0);
        setPage(1);
      },
    });
  }
  if (availability !== 'all') {
    activeFilterChips.push({
      key: 'avail',
      label: `Status: ${availability.replace('-', ' ')}`,
      onClear: () => {
        setAvailability('all');
        setPage(1);
      },
    });
  }
  if (onSaleOnly) {
    activeFilterChips.push({
      key: 'sale',
      label: 'On Sale Only',
      onClear: () => {
        setOnSaleOnly(false);
        setPage(1);
      },
    });
  }
  if (searchInput.trim()) {
    activeFilterChips.push({
      key: 'query',
      label: `Search: “${searchInput.trim()}”`,
      onClear: () => {
        setSearchInput('');
        setPage(1);
      },
    });
  }

  const pageHeading =
    mode === 'search'
      ? searchInput.trim()
        ? `Search results for “${searchInput.trim()}”`
        : 'Search Catalog'
      : mode === 'offers' || route.collection === 'offers'
      ? 'Seasonal Offers & Studio Editions'
      : activeCategoryMeta
      ? activeCategoryMeta.name
      : route.collection === 'new-arrivals'
      ? 'New Arrivals'
      : route.collection === 'best-sellers'
      ? 'Best Sellers'
      : route.collection === 'trending'
      ? 'Trending Now'
      : 'All Marketplace Products';

  const pageDescription =
    activeCategoryMeta?.description ||
    (mode === 'offers'
      ? 'Select hardware editions, seasonal wardrobe releases, and multi-category marketplace savings.'
      : 'Explore our curated 8-department marketplace across electronics, fashion, home living, beauty, grocery, outdoor, office, and gift editions.');

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Department Filter */}
      <div className="space-y-2.5">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">Department</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left py-1 text-sm cursor-pointer ${
              selectedCategory === 'all'
                ? 'font-semibold text-[#171716] dark:text-[#F4F3EF]'
                : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
            }`}
          >
            All Departments
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left py-1 text-sm cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'font-semibold text-[#8F6438] dark:text-[#C89B67]'
                  : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category-Specific Dynamic Attribute Facets */}
      {dynamicFacetOptions.length > 0 && (
        <div className="space-y-4 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
          <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
            {activeCategoryMeta?.shortName} Specifications
          </p>
          {dynamicFacetOptions.map((facet) => (
            <div key={facet.key} className="space-y-1.5">
              <label
                htmlFor={`facet-${facet.key}`}
                className="text-xs text-[#84827B] font-medium block"
              >
                {facet.label}
              </label>
              <select
                id={`facet-${facet.key}`}
                value={selectedAttributes[facet.key] || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAttributes((prev) => ({ ...prev, [facet.key]: val }));
                  setPage(1);
                }}
                className="w-full h-9 px-2.5 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
              >
                <option value="all">Any {facet.label}</option>
                {facet.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Partner Brand Filter */}
      <div className="space-y-2.5 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">Brand / Maker</p>
        <select
          aria-label="Filter by brand"
          value={selectedBrand}
          onChange={(e) => {
            setSelectedBrand(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
        >
          <option value="all">All Brands</option>
          {BRAND_STUDIOS.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Max Price Range */}
      <div className="space-y-2.5 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <div className="flex items-center justify-between">
          <label
            htmlFor="price-range"
            className="text-xs uppercase tracking-wider text-[#84827B] font-medium"
          >
            Max Price
          </label>
          <span className="text-xs font-mono-num font-medium">
            {formatCurrency(maxPrice, currency)}
          </span>
        </div>
        <input
          id="price-range"
          type="range"
          min={50}
          max={catalogMaxPrice}
          step={50}
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setPage(1);
          }}
          className="w-full accent-[#8F6438] dark:accent-[#C89B67] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] font-mono-num text-[#84827B]">
          <span>{formatCurrency(50, currency)}</span>
          <span>{formatCurrency(catalogMaxPrice, currency)}</span>
        </div>
      </div>

      {/* Finish / Color */}
      <div className="space-y-2.5 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">
          Color / Finish
        </p>
        <select
          aria-label="Filter by finish or color"
          value={selectedColor}
          onChange={(e) => {
            setSelectedColor(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
        >
          <option value="all">All Colors &amp; Finishes</option>
          {allColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Size / Edition */}
      <div className="space-y-2.5 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">
          Size / Edition
        </p>
        <select
          aria-label="Filter by size or edition"
          value={selectedSize}
          onChange={(e) => {
            setSelectedSize(e.target.value);
            setPage(1);
          }}
          className="w-full h-10 px-3 text-sm rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
        >
          <option value="all">All Sizes &amp; Editions</option>
          {allSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Availability & Rating */}
      <div className="space-y-3 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">Availability</p>
        <div className="space-y-2 text-sm">
          {(
            [
              { value: 'all', label: 'All Stock Status' },
              { value: 'in-stock', label: 'Ready to Ship (In Stock)' },
              { value: 'low-stock', label: 'Limited Quantity' },
              { value: 'made-to-order', label: 'Made to Order' },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="availability"
                checked={availability === opt.value}
                onChange={() => {
                  setAvailability(opt.value);
                  setPage(1);
                }}
                className="accent-[#171716] dark:accent-[#F4F3EF]"
              />
              <span className="text-sm text-[#5C5B57] dark:text-[#B4B2AC]">{opt.label}</span>
            </label>
          ))}
        </div>

        <div className="pt-2">
          <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium mb-2">
            Minimum Rating
          </p>
          <div className="flex gap-1.5">
            {[0, 4.5, 4.8].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setMinRating(r);
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-mono-num border cursor-pointer ${
                  minRating === r
                    ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                    : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#A3A19B]'
                }`}
              >
                {r === 0 ? 'Any' : `${r}+ ★`}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Checkbox
            label="Special offers & discounts only"
            checked={onSaleOnly}
            onChange={(val) => {
              setOnSaleOnly(val);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Button variant="outline" size="sm" fullWidth onClick={resetFilters}>
        Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          ...(activeCategoryMeta
            ? [
                {
                  label: 'Shop',
                  onClick: () => navigate({ name: 'shop', category: 'all' }),
                },
                { label: activeCategoryMeta.name },
              ]
            : [{ label: pageHeading }]),
        ]}
      />

      {/* Category Landing Banner OR Standard Shop Header */}
      {activeCategoryMeta ? (
        <div className="rounded-lg overflow-hidden bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[#8F6438] dark:text-[#C89B67] font-medium">
                {activeCategoryMeta.bannerTagline}
              </p>
              <h1 className="font-display text-[clamp(1.85rem,3.4vw,3rem)] font-medium tracking-tight">
                {activeCategoryMeta.name}
              </h1>
              <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC] max-w-xl">
                {activeCategoryMeta.description}
              </p>
            </div>

            {/* Subcategory Shortcuts + Featured Brand Filters */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubcategory('all');
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                    selectedSubcategory === 'all'
                      ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716]'
                      : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:border-[#171716]'
                  }`}
                >
                  All {activeCategoryMeta.shortName}
                </button>
                {activeCategoryMeta.subcategories.map((sub) => (
                  <button
                    key={sub.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSubcategory(sub.slug);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                      selectedSubcategory === sub.slug
                        ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716]'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:border-[#171716]'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#84827B]">
                <span>Featured brands:</span>
                {activeCategoryMeta.featuredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setSelectedBrand((prev) => (prev === brand ? 'all' : brand));
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                      selectedBrand === brand
                        ? 'border-[#8F6438] text-[#8F6438] dark:border-[#C89B67] dark:text-[#C89B67] font-medium'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-48 sm:h-56 lg:h-auto bg-[#F2F0EC] dark:bg-[#22221F]">
            <ResilientImage
              src={activeCategoryMeta.image}
              alt={activeCategoryMeta.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
          <div className="space-y-2 max-w-2xl">
            <h1 className="font-display text-[clamp(1.85rem,3.5vw,3rem)] font-medium tracking-tight">
              {pageHeading}
            </h1>
            <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC]">
              {pageDescription}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchInput.trim()) addRecentSearch(searchInput.trim());
              setPage(1);
            }}
            className="relative w-full lg:w-80"
          >
            <Search className="w-4 h-4 text-[#84827B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by keyword, brand, or SKU..."
              aria-label="Filter catalog by keyword"
              className="w-full h-11 pl-10 pr-9 text-sm rounded-md bg-white dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] focus:border-[#171716] dark:focus:border-[#F4F3EF]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear filter text"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Horizontal Department Switcher */}
      <div
        role="navigation"
        aria-label="Department quick filter"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        <button
          type="button"
          onClick={() => handleCategoryChange('all')}
          className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
              : 'bg-white dark:bg-[#191917] border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
          }`}
        >
          All Departments
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => handleCategoryChange(cat.slug)}
            className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
              selectedCategory === cat.slug
                ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                : 'bg-white dark:bg-[#191917] border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              Filters{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}
            </span>
          </Button>
          <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#A3A19B] font-mono-num">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-[#84827B] hidden sm:inline">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 px-3 text-xs sm:text-sm rounded-md bg-white dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="best-selling">Best Selling</option>
              <option value="highest-rated">Highest Rated</option>
            </select>
          </div>

          <div
            role="group"
            aria-label="View layout"
            className="hidden sm:flex items-center border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              aria-label="Grid view"
              aria-pressed={viewLayout === 'grid'}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-colors ${
                viewLayout === 'grid'
                  ? 'bg-[#171716] text-white dark:bg-[#F4F3EF] dark:text-[#171716]'
                  : 'bg-white dark:bg-[#191917] text-[#5C5B57] dark:text-[#A3A19B]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              aria-label="List view"
              aria-pressed={viewLayout === 'list'}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-colors ${
                viewLayout === 'list'
                  ? 'bg-[#171716] text-white dark:bg-[#F4F3EF] dark:text-[#171716]'
                  : 'bg-white dark:bg-[#191917] text-[#5C5B57] dark:text-[#A3A19B]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onClear}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs hover:border-[#171716] dark:hover:border-[#F4F3EF] cursor-pointer transition-colors"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3 text-[#84827B]" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline px-2 py-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Content Layout: Desktop Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
            <FilterPanel />
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-8">
          {storefrontLoading ? (
            <ProductGridSkeleton
              count={viewLayout === 'grid' ? 9 : 4}
              layout={viewLayout}
              label="Loading marketplace catalog"
            />
          ) : paginatedProducts.length === 0 ? (
            <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
              <EmptyState
                title="No matching products found"
                description="Try broadening your price ceiling, switching finishes, or clearing active filters to explore the full catalog."
                actionLabel="Reset Filters"
                onAction={resetFilters}
              />
            </div>
          ) : viewLayout === 'grid' ? (
            <StaggerGrid className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {paginatedProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} layout="grid" />
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <div className="space-y-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="list" />
              ))}
            </div>
          )}

          {!storefrontLoading && (
            <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Marketplace"
        side="left"
      >
        <div className="p-6">
          <FilterPanel />
        </div>
      </Drawer>
    </div>
  );
};
