import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { BRAND_STUDIOS } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import {
  AttributeType,
  AvailabilityStatus,
  CategoryMeta,
  CategorySlug,
  SortOption,
  SubcategoryMeta,
  TypedAttributeValue,
} from '../types/commerce';
import {
  CurrencyCode,
  formatCurrency,
  formatTypedAttributeValue,
  fuzzyScoreText,
} from '../utils/format';
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

interface DynamicFacetDescriptor {
  key: string;
  label: string;
  type: AttributeType;
  unit?: string;
  options: string[];
  minBound?: number;
  maxBound?: number;
}

function getNumericRangeFromTyped(val: TypedAttributeValue | undefined): [number, number] | null {
  if (typeof val === 'number' && Number.isFinite(val)) return [val, val];
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    if ('value' in val && typeof val.value === 'number') return [val.value, val.value];
    if ('min' in val && 'max' in val) return [val.min, val.max];
  }
  return null;
}

function findSubcategoryNode(
  items: SubcategoryMeta[],
  targetSlug: string
): SubcategoryMeta | undefined {
  for (const item of items) {
    if (item.slug === targetSlug) return item;
    if (item.children?.length) {
      const nested = findSubcategoryNode(item.children, targetSlug);
      if (nested) return nested;
    }
  }
  return undefined;
}

interface ShopFilterPanelProps {
  idPrefix: string;
  categories: CategoryMeta[];
  activeCategoryMeta?: CategoryMeta;
  selectedCategory: CategorySlug | 'all';
  onCategoryChange: (nextCat: CategorySlug | 'all') => void;
  dynamicFacetOptions: DynamicFacetDescriptor[];
  selectedAttributes: Record<string, string>;
  onAttributeChange: (key: string, val: string) => void;
  selectedBrand: string;
  onBrandChange: (val: string) => void;
  maxPrice: number;
  catalogMaxPrice: number;
  currency: CurrencyCode;
  onMaxPriceChange: (val: number) => void;
  selectedColor: string;
  allColors: string[];
  onColorChange: (val: string) => void;
  selectedSize: string;
  allSizes: string[];
  onSizeChange: (val: string) => void;
  availability: 'all' | AvailabilityStatus;
  onAvailabilityChange: (val: 'all' | AvailabilityStatus) => void;
  minRating: number;
  onMinRatingChange: (val: number) => void;
  onSaleOnly: boolean;
  onSaleOnlyChange: (val: boolean) => void;
  onResetFilters: () => void;
}

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  idPrefix,
  categories,
  activeCategoryMeta,
  selectedCategory,
  onCategoryChange,
  dynamicFacetOptions,
  selectedAttributes,
  onAttributeChange,
  selectedBrand,
  onBrandChange,
  maxPrice,
  catalogMaxPrice,
  currency,
  onMaxPriceChange,
  selectedColor,
  allColors,
  onColorChange,
  selectedSize,
  allSizes,
  onSizeChange,
  availability,
  onAvailabilityChange,
  minRating,
  onMinRatingChange,
  onSaleOnly,
  onSaleOnlyChange,
  onResetFilters,
}) => (
  <div className="space-y-6">
    {/* Department Filter */}
    <div className="space-y-2.5">
      <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">
        Department (10)
      </p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`w-full text-left leading-snug py-1.5 text-sm cursor-pointer ${
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
            onClick={() => onCategoryChange(cat.slug)}
            className={`w-full text-left leading-snug py-1.5 text-sm cursor-pointer ${
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

    {/* Category-Specific Typed Attribute Facets */}
    {dynamicFacetOptions.length > 0 && (
      <div className="space-y-4 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
          {activeCategoryMeta?.shortName} Specifications
        </p>
        {dynamicFacetOptions.map((facet) => {
          const currentVal = selectedAttributes[facet.key] || '';

          if (facet.type === 'boolean') {
            return (
              <div key={facet.key} className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-facet-${facet.key}`}
                  className="text-xs text-[#84827B] font-medium block"
                >
                  {facet.label}
                </label>
                <select
                  id={`${idPrefix}-facet-${facet.key}`}
                  value={currentVal || 'all'}
                  onChange={(e) => onAttributeChange(facet.key, e.target.value)}
                  className="w-full h-10 px-2.5 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
                >
                  <option value="all">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            );
          }

          if (facet.type === 'multi_select') {
            const chosen = currentVal ? currentVal.split('||').filter(Boolean) : [];
            return (
              <div key={facet.key} className="space-y-2">
                <span className="text-xs text-[#84827B] font-medium block">{facet.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {facet.options.map((opt) => {
                    const active = chosen.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? chosen.filter((x) => x !== opt)
                            : [...chosen, opt];
                          onAttributeChange(facet.key, next.length ? next.join('||') : 'all');
                        }}
                        className={`px-2.5 py-1.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                            : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:border-[#171716]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (facet.type === 'number' || facet.type === 'range' || facet.type === 'measurement') {
            const [minStr = '', maxStr = ''] = currentVal.startsWith('range:')
              ? currentVal.replace('range:', '').split(':')
              : ['', ''];
            return (
              <div key={facet.key} className="space-y-1.5">
                <span className="text-xs text-[#84827B] font-medium block">
                  {facet.label}
                  {facet.unit ? ` (${facet.unit})` : ''}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    aria-label={`Minimum ${facet.label}`}
                    placeholder={
                      facet.minBound !== undefined ? `Min ${facet.minBound}` : 'Min'
                    }
                    value={minStr}
                    onChange={(e) => {
                      const nextMin = e.target.value;
                      onAttributeChange(
                        facet.key,
                        nextMin || maxStr ? `range:${nextMin}:${maxStr}` : 'all'
                      );
                    }}
                    className="h-9 px-2.5 text-xs font-mono-num rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
                  />
                  <input
                    type="number"
                    step="any"
                    aria-label={`Maximum ${facet.label}`}
                    placeholder={
                      facet.maxBound !== undefined ? `Max ${facet.maxBound}` : 'Max'
                    }
                    value={maxStr}
                    onChange={(e) => {
                      const nextMax = e.target.value;
                      onAttributeChange(
                        facet.key,
                        minStr || nextMax ? `range:${minStr}:${nextMax}` : 'all'
                      );
                    }}
                    className="h-9 px-2.5 text-xs font-mono-num rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
                  />
                </div>
              </div>
            );
          }

          if (facet.type === 'date') {
            return (
              <div key={facet.key} className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-facet-${facet.key}`}
                  className="text-xs text-[#84827B] font-medium block"
                >
                  {facet.label} (On / After)
                </label>
                <input
                  id={`${idPrefix}-facet-${facet.key}`}
                  type="date"
                  value={currentVal && currentVal !== 'all' ? currentVal : ''}
                  onChange={(e) => onAttributeChange(facet.key, e.target.value || 'all')}
                  className="w-full h-10 px-2.5 text-xs font-mono-num rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
                />
              </div>
            );
          }

          return (
            <div key={facet.key} className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-facet-${facet.key}`}
                className="text-xs text-[#84827B] font-medium block"
              >
                {facet.label}
              </label>
              <select
                id={`${idPrefix}-facet-${facet.key}`}
                value={currentVal || 'all'}
                onChange={(e) => onAttributeChange(facet.key, e.target.value)}
                className="w-full h-10 px-2.5 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
              >
                <option value="all">Any {facet.label}</option>
                {facet.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    )}

    {/* Partner Brand Filter */}
    <div className="space-y-2.5 pt-5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
      <p className="text-xs uppercase tracking-wider text-[#84827B] font-medium">Brand / Maker</p>
      <select
        aria-label="Filter by brand"
        value={selectedBrand}
        onChange={(e) => onBrandChange(e.target.value)}
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
          htmlFor={`${idPrefix}-price-range`}
          className="text-xs uppercase tracking-wider text-[#84827B] font-medium"
        >
          Max Price
        </label>
        <span className="text-xs font-mono-num font-medium">
          {formatCurrency(maxPrice, currency)}
        </span>
      </div>
      <input
        id={`${idPrefix}-price-range`}
        type="range"
        min={50}
        max={catalogMaxPrice}
        step={50}
        value={maxPrice}
        onChange={(e) => onMaxPriceChange(Number(e.target.value))}
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
        onChange={(e) => onColorChange(e.target.value)}
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
        onChange={(e) => onSizeChange(e.target.value)}
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
          <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer py-0.5">
            <input
              type="radio"
              name={`${idPrefix}-availability`}
              checked={availability === opt.value}
              onChange={() => onAvailabilityChange(opt.value)}
              className="mt-[3px] shrink-0 accent-[#171716] dark:accent-[#F4F3EF]"
            />
            <span className="text-sm leading-snug text-[#5C5B57] dark:text-[#B4B2AC]">{opt.label}</span>
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
              onClick={() => onMinRatingChange(r)}
              className={`px-3 py-2 rounded-md text-xs font-mono-num border cursor-pointer ${
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
          onChange={onSaleOnlyChange}
        />
      </div>
    </div>

    <Button variant="outline" size="sm" fullWidth onClick={onResetFilters}>
      Reset All Filters
    </Button>
  </div>
);

export const ShopPage: React.FC<ShopPageProps> = ({ mode }) => {
  const {
    categories,
    categoryNodes,
    getDescendantSlugs,
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
  const [hasCustomMaxPrice, setHasCustomMaxPrice] = useState(false);
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
    if (!hasCustomMaxPrice || maxPrice > catalogMaxPrice) {
      setMaxPrice(catalogMaxPrice);
    }
  }, [catalogMaxPrice, hasCustomMaxPrice, maxPrice]);

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
        ? categories.find(
            (c) =>
              c.slug === selectedCategory || c.descendantSlugs.includes(selectedCategory)
          )
        : undefined,
    [categories, selectedCategory]
  );

  const selectedSubcategoryNode = useMemo(() => {
    if (!activeCategoryMeta || selectedSubcategory === 'all') return undefined;
    return findSubcategoryNode(activeCategoryMeta.subcategories, selectedSubcategory);
  }, [activeCategoryMeta, selectedSubcategory]);

  const activeDeptSlugs = useMemo(
    () => (selectedCategory === 'all' ? [] : getDescendantSlugs(selectedCategory)),
    [selectedCategory, getDescendantSlugs]
  );

  const activeSubSlugs = useMemo(
    () => (selectedSubcategory === 'all' ? [] : getDescendantSlugs(selectedSubcategory)),
    [selectedSubcategory, getDescendantSlugs]
  );

  // Scoped base items for accurate dynamic filter options
  const categoryScopedProducts = useMemo(
    () =>
      selectedCategory === 'all'
        ? products
        : products.filter(
            (p) =>
              activeDeptSlugs.includes(p.category) ||
              activeDeptSlugs.includes(p.subcategory) ||
              p.category === selectedCategory
          ),
    [products, selectedCategory, activeDeptSlugs]
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

  // Dynamic category-aware typed attribute facets (zero irrelevant attributes across departments)
  const dynamicFacetOptions = useMemo<DynamicFacetDescriptor[]>(() => {
    if (!activeCategoryMeta) return [];
    const results: DynamicFacetDescriptor[] = [];

    for (const facet of activeCategoryMeta.filterFacets) {
      if (facet.filterable === false) continue;

      if (facet.type === 'boolean') {
        const hasAny = categoryScopedProducts.some(
          (p) =>
            typeof p.typedAttributes?.[facet.key] === 'boolean' ||
            p.attributes?.[facet.key] !== undefined
        );
        if (hasAny) {
          results.push({ key: facet.key, label: facet.label, type: 'boolean', options: [] });
        }
        continue;
      }

      if (facet.type === 'number' || facet.type === 'range' || facet.type === 'measurement') {
        const nums: number[] = [];
        categoryScopedProducts.forEach((p) => {
          const r = getNumericRangeFromTyped(p.typedAttributes?.[facet.key]);
          if (r) {
            nums.push(r[0], r[1]);
          }
        });
        if (nums.length > 0) {
          results.push({
            key: facet.key,
            label: facet.label,
            type: facet.type,
            unit: facet.unit,
            options: [],
            minBound: Math.min(...nums),
            maxBound: Math.max(...nums),
          });
        }
        continue;
      }

      if (facet.type === 'date') {
        const hasDates = categoryScopedProducts.some(
          (p) => typeof p.typedAttributes?.[facet.key] === 'string'
        );
        if (hasDates) {
          results.push({ key: facet.key, label: facet.label, type: 'date', options: [] });
        }
        continue;
      }

      const values = new Set<string>(facet.options || []);
      categoryScopedProducts.forEach((p) => {
        const typedVal = p.typedAttributes?.[facet.key];
        if (Array.isArray(typedVal)) {
          typedVal.forEach((item) => values.add(String(item)));
        } else if (typedVal !== undefined) {
          values.add(formatTypedAttributeValue(typedVal, facet.unit));
        } else if (p.attributes?.[facet.key]) {
          values.add(p.attributes[facet.key]);
        }
      });

      const opts = Array.from(values).filter(Boolean).sort();
      if (opts.length > 0) {
        results.push({
          key: facet.key,
          label: facet.label,
          type: facet.type,
          unit: facet.unit,
          options: opts,
        });
      }
    }

    return results;
  }, [activeCategoryMeta, categoryScopedProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchInput.trim();
    const matched = products.filter((p) => {
      if (route.collection === 'trending' && !p.isTrending && !p.collectionIds?.includes('trending')) {
        return false;
      }
      if (
        route.collection === 'best-sellers' &&
        !p.isBestSeller &&
        !p.collectionIds?.includes('best-sellers')
      ) {
        return false;
      }
      if (
        route.collection === 'new-arrivals' &&
        !p.isNewArrival &&
        !p.collectionIds?.includes('new-arrivals')
      ) {
        return false;
      }
      if (
        route.collection &&
        !['trending', 'best-sellers', 'new-arrivals', 'offers', 'all'].includes(
          route.collection
        ) &&
        !p.collectionIds?.includes(route.collection)
      ) {
        return false;
      }

      if (selectedCategory !== 'all') {
        const matchesDept =
          p.category === selectedCategory ||
          activeDeptSlugs.includes(p.category) ||
          activeDeptSlugs.includes(p.subcategory);
        if (!matchesDept) return false;
      }

      if (selectedSubcategory !== 'all') {
        const matchesSub =
          p.subcategory === selectedSubcategory || activeSubSlugs.includes(p.subcategory);
        if (!matchesSub) return false;
      }

      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;
      if (p.price > maxPrice) return false;
      if (
        selectedColor !== 'all' &&
        !p.colors.some((c) => c.name.toLowerCase().includes(selectedColor.toLowerCase()))
      ) {
        return false;
      }
      if (selectedSize !== 'all' && !p.sizes.includes(selectedSize)) return false;

      // Category-aware typed attribute evaluation
      for (const [attrKey, rawFilterVal] of Object.entries(selectedAttributes)) {
        if (!rawFilterVal || rawFilterVal === 'all') continue;
        const facetDef = activeCategoryMeta?.filterFacets.find((f) => f.key === attrKey);
        const typedVal = p.typedAttributes?.[attrKey];
        const legacyVal = p.attributes?.[attrKey];

        if (facetDef?.type === 'boolean') {
          const wantBool = rawFilterVal === 'true';
          const actualBool =
            typeof typedVal === 'boolean'
              ? typedVal
              : String(legacyVal).toLowerCase() === 'true';
          if (actualBool !== wantBool) return false;
        } else if (
          facetDef?.type === 'multi_select' ||
          rawFilterVal.includes('||') ||
          Array.isArray(typedVal)
        ) {
          const requiredTags = rawFilterVal.split('||').filter(Boolean);
          const actualTags = Array.isArray(typedVal)
            ? typedVal.map((x) => String(x).toLowerCase())
            : [String(typedVal ?? legacyVal ?? '').toLowerCase()];
          if (!requiredTags.every((t) => actualTags.includes(t.toLowerCase()))) {
            return false;
          }
        } else if (rawFilterVal.startsWith('range:')) {
          const [, minS, maxS] = rawFilterVal.split(':');
          const r = getNumericRangeFromTyped(typedVal);
          if (!r) return false;
          if (minS !== '' && r[1] < Number(minS)) return false;
          if (maxS !== '' && r[0] > Number(maxS)) return false;
        } else if (facetDef?.type === 'date') {
          if (typeof typedVal !== 'string' || typedVal < rawFilterVal) return false;
        } else {
          const actualStr =
            typedVal !== undefined
              ? formatTypedAttributeValue(typedVal, facetDef?.unit)
              : String(legacyVal ?? '');
          if (actualStr !== rawFilterVal) return false;
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
    activeDeptSlugs,
    activeSubSlugs,
    selectedBrand,
    maxPrice,
    selectedColor,
    selectedSize,
    selectedAttributes,
    activeCategoryMeta,
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
    setHasCustomMaxPrice(false);
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
    const subNode = findSubcategoryNode(activeCategoryMeta.subcategories, selectedSubcategory);
    activeFilterChips.push({
      key: 'sub',
      label: `Category: ${subNode?.name || selectedSubcategory}`,
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
        setHasCustomMaxPrice(false);
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
      const displayVal = val.startsWith('range:')
        ? `${val.split(':')[1] || '0'}–${val.split(':')[2] || '∞'}${facet?.unit ? ` ${facet.unit}` : ''}`
        : val.includes('||')
        ? val.split('||').join(', ')
        : val === 'true'
        ? 'Yes'
        : val === 'false'
        ? 'No'
        : val;
      activeFilterChips.push({
        key: `attr-${k}`,
        label: `${facet?.label || k}: ${displayVal}`,
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
      : 'Explore our curated 10-department universal marketplace spanning electronics, fashion, home living, beauty, grocery, outdoor, office, automotive tools, baby & toys, and health & pets.');

  // Find active Level 1 parent to display Level 2 children neatly when selected
  const activeLevel1Node = useMemo(() => {
    if (!activeCategoryMeta || selectedSubcategory === 'all') return undefined;
    return activeCategoryMeta.subcategories.find(
      (sub) =>
        sub.slug === selectedSubcategory ||
        Boolean(sub.children?.some((child) => child.slug === selectedSubcategory))
    );
  }, [activeCategoryMeta, selectedSubcategory]);

  const sharedFilterProps = {
    categories,
    activeCategoryMeta,
    selectedCategory,
    onCategoryChange: handleCategoryChange,
    dynamicFacetOptions,
    selectedAttributes,
    onAttributeChange: (key: string, val: string) => {
      setSelectedAttributes((prev) => ({ ...prev, [key]: val }));
      setPage(1);
    },
    selectedBrand,
    onBrandChange: (val: string) => {
      setSelectedBrand(val);
      setPage(1);
    },
    maxPrice,
    catalogMaxPrice,
    currency,
    onMaxPriceChange: (val: number) => {
      setHasCustomMaxPrice(val < catalogMaxPrice);
      setMaxPrice(val);
      setPage(1);
    },
    selectedColor,
    allColors,
    onColorChange: (val: string) => {
      setSelectedColor(val);
      setPage(1);
    },
    selectedSize,
    allSizes,
    onSizeChange: (val: string) => {
      setSelectedSize(val);
      setPage(1);
    },
    availability,
    onAvailabilityChange: (val: 'all' | AvailabilityStatus) => {
      setAvailability(val);
      setPage(1);
    },
    minRating,
    onMinRatingChange: (val: number) => {
      setMinRating(val);
      setPage(1);
    },
    onSaleOnly,
    onSaleOnlyChange: (val: boolean) => {
      setOnSaleOnly(val);
      setPage(1);
    },
    onResetFilters: resetFilters,
  };

  void categoryNodes;
  void selectedSubcategoryNode;

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
                {
                  label: activeCategoryMeta.name,
                  ...(selectedSubcategory !== 'all'
                    ? {
                        onClick: () => {
                          setSelectedSubcategory('all');
                          setPage(1);
                        },
                      }
                    : {}),
                },
                ...(selectedSubcategoryNode ? [{ label: selectedSubcategoryNode.name }] : []),
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

            {/* Nested Subcategory Shortcuts + Level-2 Children + Featured Brands */}
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
                {activeCategoryMeta.subcategories.map((sub) => {
                  const isActiveSub =
                    selectedSubcategory === sub.slug ||
                    Boolean(sub.children?.some((c) => c.slug === selectedSubcategory));
                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory(sub.slug);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                        isActiveSub
                          ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716]'
                          : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#B4B2AC] hover:border-[#171716]'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              {activeLevel1Node?.children && activeLevel1Node.children.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l-2 border-[#8F6438]/40 dark:border-[#C89B67]/40">
                  <span className="text-[11px] uppercase tracking-wider text-[#84827B] mr-1">
                    {activeLevel1Node.name}:
                  </span>
                  {activeLevel1Node.children.map((child) => (
                    <button
                      key={child.slug}
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory(child.slug);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                        selectedSubcategory === child.slug
                          ? 'border-[#8F6438] text-[#8F6438] dark:border-[#C89B67] dark:text-[#C89B67] bg-[#F9F8F6] dark:bg-[#22221F]'
                          : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#A3A19B] hover:border-[#171716]'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#84827B] leading-snug">
                <span className="whitespace-nowrap">Featured brands:</span>
                {activeCategoryMeta.featuredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setSelectedBrand((prev) => (prev === brand ? 'all' : brand));
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded border whitespace-nowrap cursor-pointer transition-colors ${
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

      {/* Horizontal Department Switcher (shown on general/search/offers views when not already inside a Category Banner) */}
      {!activeCategoryMeta && (
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
      )}

      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
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
          <p className="text-xs sm:text-sm text-[#5C5B57] dark:text-[#A3A19B] font-mono-num truncate">
            Showing {paginatedProducts.length} of {filteredProducts.length} products
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label htmlFor="sort-select" className="text-xs text-[#84827B] whitespace-nowrap">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 sm:flex-initial h-10 px-3 text-xs sm:text-sm rounded-md bg-white dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]"
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
            className="hidden sm:flex items-center border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md overflow-hidden shrink-0"
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
            <ShopFilterPanel idPrefix="desktop" {...sharedFilterProps} />
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
            <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="grid" />
              ))}
            </div>
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
          <ShopFilterPanel idPrefix="mobile" {...sharedFilterProps} />
        </div>
      </Drawer>
    </div>
  );
};
