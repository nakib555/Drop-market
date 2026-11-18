import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
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
import {
  t,
  translateDepartmentName,
  translateDepartmentShortName,
} from '../utils/i18n';
import { LanguageCode } from '../types/commerce';
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
  language: LanguageCode;
  categories: CategoryMeta[];
  activeCategoryMeta?: CategoryMeta;
  selectedCategory: CategorySlug | 'all';
  onCategoryChange: (nextCat: CategorySlug | 'all') => void;
  dynamicFacetOptions: DynamicFacetDescriptor[];
  selectedAttributes: Record<string, string>;
  onAttributeChange: (key: string, val: string) => void;
  selectedBrand: string;
  allBrands: string[];
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
  hasAnyRatedProducts: boolean;
  onMinRatingChange: (val: number) => void;
  onSaleOnly: boolean;
  onSaleOnlyChange: (val: boolean) => void;
  onResetFilters: () => void;
  hideResetButton?: boolean;
}

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  idPrefix,
  language,
  categories,
  activeCategoryMeta,
  selectedCategory,
  onCategoryChange,
  dynamicFacetOptions,
  selectedAttributes,
  onAttributeChange,
  selectedBrand,
  allBrands,
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
  hasAnyRatedProducts,
  onMinRatingChange,
  onSaleOnly,
  onSaleOnlyChange,
  onResetFilters,
  hideResetButton = false,
}) => (
  <div className="space-y-6">
    {/* Department Filter */}
    <div className="space-y-2.5">
      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
        {t(language, 'departmentsWithCount', { count: categories.length })}
      </p>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`w-full text-start leading-snug min-h-[40px] px-2 -mx-2 rounded-[var(--ks-radius-sm)] text-sm cursor-pointer transition-colors ${
            selectedCategory === 'all'
              ? 'font-semibold text-[var(--ks-text-primary)] bg-[var(--ks-surface-muted)]'
              : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
          }`}
        >
          {t(language, 'allDepartments')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onCategoryChange(cat.slug)}
            className={`w-full text-start leading-snug min-h-[40px] px-2 -mx-2 rounded-[var(--ks-radius-sm)] text-sm cursor-pointer transition-colors ${
              selectedCategory === cat.slug
                ? 'font-semibold text-[var(--ks-accent)] bg-[var(--ks-surface-muted)]'
                : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
            }`}
          >
            {translateDepartmentName(language, cat.slug, cat.name)}
          </button>
        ))}
      </div>
    </div>

    {/* Category-Specific Typed Attribute Facets */}
    {dynamicFacetOptions.length > 0 && (
      <div className="space-y-4 pt-5 border-t border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
          {t(language, 'deptSpecifications', {
            dept: activeCategoryMeta
              ? translateDepartmentShortName(
                  language,
                  activeCategoryMeta.slug,
                  activeCategoryMeta.shortName
                )
              : '',
          })}
        </p>
        {dynamicFacetOptions.map((facet) => {
          const currentVal = selectedAttributes[facet.key] || '';

          if (facet.type === 'boolean') {
            return (
              <div key={facet.key} className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-facet-${facet.key}`}
                  className="text-xs text-[var(--ks-text-muted)] font-medium block"
                >
                  {facet.label}
                </label>
                <select
                  id={`${idPrefix}-facet-${facet.key}`}
                  value={currentVal || 'all'}
                  onChange={(e) => onAttributeChange(facet.key, e.target.value)}
                  className="w-full min-h-[44px] px-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
                >
                  <option value="all">{t(language, 'anyLabel')}</option>
                  <option value="true">{t(language, 'yesLabel')}</option>
                  <option value="false">{t(language, 'noLabel')}</option>
                </select>
              </div>
            );
          }

          if (facet.type === 'multi_select') {
            const chosen = currentVal ? currentVal.split('||').filter(Boolean) : [];
            return (
              <div key={facet.key} className="space-y-2">
                <span className="text-xs text-[var(--ks-text-muted)] font-medium block">{facet.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {facet.options.map((opt) => {
                    const active = chosen.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          const next = active
                            ? chosen.filter((x) => x !== opt)
                            : [...chosen, opt];
                          onAttributeChange(facet.key, next.length ? next.join('||') : 'all');
                        }}
                        className={`min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-md border text-xs sm:text-[11px] font-medium cursor-pointer transition-colors ${
                          active
                            ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                            : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-action)]'
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
                <span className="text-xs text-[var(--ks-text-muted)] font-medium block">
                  {facet.label}
                  {facet.unit ? ` (${facet.unit})` : ''}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    aria-label={t(language, 'minimumLabel', { label: facet.label })}
                    placeholder={
                      facet.minBound !== undefined
                        ? t(language, 'minBoundPlaceholder', { val: facet.minBound })
                        : t(language, 'minPlaceholder')
                    }
                    value={minStr}
                    onChange={(e) => {
                      const nextMin = e.target.value;
                      onAttributeChange(
                        facet.key,
                        nextMin || maxStr ? `range:${nextMin}:${maxStr}` : 'all'
                      );
                    }}
                    className="min-h-[44px] px-3 text-base sm:text-xs font-mono-num rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
                  />
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    aria-label={t(language, 'maximumLabel', { label: facet.label })}
                    placeholder={
                      facet.maxBound !== undefined
                        ? t(language, 'maxBoundPlaceholder', { val: facet.maxBound })
                        : t(language, 'maxPlaceholder')
                    }
                    value={maxStr}
                    onChange={(e) => {
                      const nextMax = e.target.value;
                      onAttributeChange(
                        facet.key,
                        minStr || nextMax ? `range:${minStr}:${nextMax}` : 'all'
                      );
                    }}
                    className="min-h-[44px] px-3 text-base sm:text-xs font-mono-num rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
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
                  className="text-xs text-[var(--ks-text-muted)] font-medium block"
                >
                  {t(language, 'dateOnOrAfter', { label: facet.label })}
                </label>
                <input
                  id={`${idPrefix}-facet-${facet.key}`}
                  type="date"
                  value={currentVal && currentVal !== 'all' ? currentVal : ''}
                  onChange={(e) => onAttributeChange(facet.key, e.target.value || 'all')}
                  className="w-full min-h-[44px] px-3 text-base sm:text-xs font-mono-num rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
                />
              </div>
            );
          }

          return (
            <div key={facet.key} className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-facet-${facet.key}`}
                className="text-xs text-[var(--ks-text-muted)] font-medium block"
              >
                {facet.label}
              </label>
              <select
                id={`${idPrefix}-facet-${facet.key}`}
                value={currentVal || 'all'}
                onChange={(e) => onAttributeChange(facet.key, e.target.value)}
                className="w-full min-h-[44px] px-3 text-base sm:text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
              >
                <option value="all">{t(language, 'anyFacetOption', { label: facet.label })}</option>
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

    {/* Brand Filter */}
    <div className="space-y-2.5 pt-5 border-t border-[var(--ks-border)]">
      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
        {t(language, 'brand')}
      </p>
      <select
        aria-label={t(language, 'brand')}
        value={selectedBrand}
        onChange={(e) => onBrandChange(e.target.value)}
        className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
      >
        <option value="all">{t(language, 'allBrands')}</option>
        {allBrands.map((brandName) => (
          <option key={brandName} value={brandName}>
            {brandName}
          </option>
        ))}
      </select>
    </div>

    {/* Max Price Range */}
    <div className="space-y-2.5 pt-5 border-t border-[var(--ks-border)]">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${idPrefix}-price-range`}
          className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium"
        >
          {t(language, 'maxPrice')}
        </label>
        <span className="text-xs font-mono-num font-medium">
          {formatCurrency(maxPrice, currency)}
        </span>
      </div>
      <input
        id={`${idPrefix}-price-range`}
        type="range"
        min={0}
        max={catalogMaxPrice}
        step={25}
        value={maxPrice}
        onChange={(e) => onMaxPriceChange(Number(e.target.value))}
        className="w-full h-8 accent-[var(--ks-accent)] cursor-pointer"
      />
      <div className="flex justify-between text-[11px] font-mono-num text-[var(--ks-text-muted)]">
        <span>{formatCurrency(0, currency)}</span>
        <span>{formatCurrency(catalogMaxPrice, currency)}</span>
      </div>
    </div>

    {/* Finish / Color */}
    <div className="space-y-2.5 pt-5 border-t border-[var(--ks-border)]">
      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
        {t(language, 'colorFinish')}
      </p>
      <select
        aria-label={t(language, 'colorFinish')}
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
      >
        <option value="all">{t(language, 'allColorsFinishes')}</option>
        {allColors.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>

    {/* Size / Edition */}
    <div className="space-y-2.5 pt-5 border-t border-[var(--ks-border)]">
      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
        {t(language, 'sizeEdition')}
      </p>
      <select
        aria-label={t(language, 'sizeEdition')}
        value={selectedSize}
        onChange={(e) => onSizeChange(e.target.value)}
        className="w-full min-h-[44px] px-3 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)]"
      >
        <option value="all">{t(language, 'allSizesEditions')}</option>
        {allSizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>

    {/* Availability & Rating */}
    <div className="space-y-3 pt-5 border-t border-[var(--ks-border)]">
      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
        {t(language, 'availability')}
      </p>
      <div className="space-y-1 text-sm">
        {(
          [
            { value: 'all', label: t(language, 'allStockStatus') },
            { value: 'in-stock', label: t(language, 'readyToShip') },
            { value: 'low-stock', label: t(language, 'limitedQuantity') },
            { value: 'made-to-order', label: t(language, 'madeToOrder') },
          ] as const
        ).map((opt) => (
          <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer min-h-[44px] sm:min-h-[40px] py-1">
            <input
              type="radio"
              name={`${idPrefix}-availability`}
              checked={availability === opt.value}
              onChange={() => onAvailabilityChange(opt.value)}
              className="w-4 h-4 shrink-0 accent-[var(--ks-action)]"
            />
            <span className="text-sm leading-snug text-[var(--ks-text-secondary)]">{opt.label}</span>
          </label>
        ))}
      </div>

      <div className="pt-2">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium mb-2">
          {t(language, 'minimumRating')}
        </p>
        {hasAnyRatedProducts ? (
          <div className="flex flex-wrap gap-2">
            {[0, 4.5, 4.8].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={minRating === r}
                onClick={() => onMinRatingChange(r)}
                className={`min-h-[44px] sm:min-h-[40px] px-3.5 py-2 rounded-[var(--ks-radius-md)] text-xs font-mono-num border cursor-pointer transition-colors ${
                  minRating === r
                    ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                    : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)]'
                }`}
              >
                {r === 0 ? t(language, 'anyLabel') : `${r}+ ★`}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1.5 rounded-md text-xs font-mono-num border border-[var(--ks-border)] bg-[var(--ks-surface-muted)] text-[var(--ks-text-primary)]">
              {t(language, 'anyLabel')}
            </span>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Checkbox
          label={t(language, 'onSaleOnly')}
          checked={onSaleOnly}
          onChange={onSaleOnlyChange}
        />
      </div>
    </div>

    {!hideResetButton && (
      <Button variant="outline" size="sm" fullWidth onClick={onResetFilters}>
        {t(language, 'resetAllFilters')}
      </Button>
    )}
  </div>
);

export const ShopPage: React.FC<ShopPageProps> = ({ mode }) => {
  const {
    language,
    categories,
    getDescendantSlugs,
    products,
    currency,
    route,
    navigate,
    addRecentSearch,
    storefrontLoading,
    catalogError,
    retryCatalogLoad,
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
    setSelectedColor('all');
    setSelectedSize('all');
    setSelectedAttributes({});
    setMinRating(0);
    setAvailability('all');
    setHasCustomMaxPrice(false);
    setMaxPrice(catalogMaxPrice);
    setSortBy('featured');
    setSearchInput(route.query || '');
    setOnSaleOnly(mode === 'offers' || route.collection === 'offers');
    setPage(1);
  }, [route.category, route.subcategory, route.brand, route.query, route.collection, mode, catalogMaxPrice]);

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

  const allBrands = useMemo(() => {
    const names = new Set<string>();
    categoryScopedProducts.forEach((p) => {
      if (p.brand) names.add(p.brand);
    });
    return Array.from(names).sort();
  }, [categoryScopedProducts]);

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

  const hasAnyRatedProducts = useMemo(
    () => categoryScopedProducts.some((p) => p.reviewCount > 0 && p.rating > 0),
    [categoryScopedProducts]
  );

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
    const deptChipName = activeCategoryMeta
      ? translateDepartmentShortName(language, activeCategoryMeta.slug, activeCategoryMeta.shortName)
      : selectedCategory;
    activeFilterChips.push({
      key: 'cat',
      label: t(language, 'chipDept', { val: deptChipName }),
      onClear: () => handleCategoryChange('all'),
    });
  }
  if (selectedSubcategory !== 'all' && activeCategoryMeta) {
    const subNode = findSubcategoryNode(activeCategoryMeta.subcategories, selectedSubcategory);
    activeFilterChips.push({
      key: 'sub',
      label: t(language, 'chipCategory', { val: subNode?.name || selectedSubcategory }),
      onClear: () => {
        setSelectedSubcategory('all');
        setPage(1);
      },
    });
  }
  if (selectedBrand !== 'all') {
    activeFilterChips.push({
      key: 'brand',
      label: t(language, 'chipBrand', { val: selectedBrand }),
      onClear: () => {
        setSelectedBrand('all');
        setPage(1);
      },
    });
  }
  if (maxPrice < catalogMaxPrice) {
    activeFilterChips.push({
      key: 'price',
      label: t(language, 'chipUnderPrice', { price: formatCurrency(maxPrice, currency) }),
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
      label: t(language, 'chipFinish', { val: selectedColor }),
      onClear: () => {
        setSelectedColor('all');
        setPage(1);
      },
    });
  }
  if (selectedSize !== 'all') {
    activeFilterChips.push({
      key: 'size',
      label: t(language, 'chipOption', { val: selectedSize }),
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
        ? t(language, 'yesLabel')
        : val === 'false'
        ? t(language, 'noLabel')
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
    const availLabel =
      availability === 'in-stock'
        ? t(language, 'inStock')
        : availability === 'low-stock'
        ? t(language, 'limitedQuantity')
        : availability === 'made-to-order'
        ? t(language, 'madeToOrder')
        : t(language, 'outOfStock');
    activeFilterChips.push({
      key: 'avail',
      label: t(language, 'chipStatus', { val: availLabel }),
      onClear: () => {
        setAvailability('all');
        setPage(1);
      },
    });
  }
  if (onSaleOnly) {
    activeFilterChips.push({
      key: 'sale',
      label: t(language, 'onSaleOnly'),
      onClear: () => {
        setOnSaleOnly(false);
        setPage(1);
      },
    });
  }
  if (searchInput.trim()) {
    activeFilterChips.push({
      key: 'query',
      label: t(language, 'chipSearch', { query: searchInput.trim() }),
      onClear: () => {
        setSearchInput('');
        setPage(1);
      },
    });
  }

  const activeDeptDisplayName = activeCategoryMeta
    ? translateDepartmentName(language, activeCategoryMeta.slug, activeCategoryMeta.name)
    : '';
  const activeDeptDisplayShortName = activeCategoryMeta
    ? translateDepartmentShortName(language, activeCategoryMeta.slug, activeCategoryMeta.shortName)
    : '';

  const pageHeading =
    mode === 'search'
      ? searchInput.trim()
        ? t(language, 'searchResultsFor', { query: searchInput.trim() })
        : t(language, 'searchCatalog')
      : mode === 'offers' || route.collection === 'offers'
      ? t(language, 'seasonalOffersTitle')
      : activeCategoryMeta
      ? activeDeptDisplayName
      : route.collection === 'new-arrivals'
      ? t(language, 'newArrivals')
      : route.collection === 'best-sellers'
      ? t(language, 'bestSellers')
      : route.collection === 'trending'
      ? t(language, 'trendingNowTitle')
      : t(language, 'shopAllProducts');

  const pageDescription =
    activeCategoryMeta?.description ||
    (mode === 'offers'
      ? t(language, 'seasonalOffersDesc')
      : t(language, 'browseAllDesc'));

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
    language,
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
    allBrands,
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
    hasAnyRatedProducts,
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

  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          ...(activeCategoryMeta
            ? [
                {
                  label: t(language, 'shop'),
                  onClick: () => navigate({ name: 'shop', category: 'all' }),
                },
                {
                  label: activeDeptDisplayName,
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
        <div className="rounded-lg overflow-hidden bg-[var(--ks-surface)] border border-[var(--ks-border)] grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)] font-medium">
                {activeCategoryMeta.bannerTagline}
              </p>
              <h1 className="font-display text-[clamp(1.85rem,3.4vw,3rem)] font-medium tracking-tight text-balance">
                {activeDeptDisplayName}
              </h1>
              <p className="text-sm sm:text-base text-[var(--ks-text-secondary)] max-w-xl">
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
                  className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors inline-flex items-center ${
                    selectedSubcategory === 'all'
                      ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                      : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-action)]'
                  }`}
                >
                  {t(language, 'allDepartmentPrefix', { dept: activeDeptDisplayShortName })}
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
                      className={`min-h-[44px] sm:min-h-[34px] px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-colors inline-flex items-center ${
                        isActiveSub
                          ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                          : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-action)]'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>

              {activeLevel1Node?.children && activeLevel1Node.children.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border)]">
                  <span className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)] me-1">
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
                      className={`min-h-[44px] sm:min-h-[30px] px-2.5 py-1 rounded text-xs sm:text-[11px] font-medium border cursor-pointer transition-colors inline-flex items-center ${
                        selectedSubcategory === child.slug
                          ? 'border-[var(--ks-accent)] text-[var(--ks-accent)] bg-[var(--ks-surface)]'
                          : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-action)]'
                      }`}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ks-text-muted)] leading-snug">
                <span className="whitespace-nowrap">{t(language, 'featuredBrands')}:</span>
                {activeCategoryMeta.featuredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setSelectedBrand((prev) => (prev === brand ? 'all' : brand));
                      setPage(1);
                    }}
                    className={`min-h-[44px] sm:min-h-[28px] px-2.5 sm:px-2 py-1 sm:py-0.5 rounded border whitespace-nowrap cursor-pointer transition-colors inline-flex items-center ${
                      selectedBrand === brand
                        ? 'border-[var(--ks-accent)] text-[var(--ks-accent)] font-medium'
                        : 'border-[var(--ks-border)] hover:text-[var(--ks-text-primary)]'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 h-48 sm:h-56 lg:h-auto bg-[var(--ks-surface-muted)]">
            <ResilientImage
              src={activeCategoryMeta.image}
              alt={activeDeptDisplayName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[var(--ks-border)]">
          <div className="space-y-2 max-w-2xl">
            <h1 className="font-display text-[clamp(1.85rem,3.5vw,3rem)] font-medium tracking-tight text-balance">
              {pageHeading}
            </h1>
            <p className="text-sm sm:text-base text-[var(--ks-text-secondary)]">
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
            <Search className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder={t(language, 'filterPlaceholder')}
              aria-label={t(language, 'search')}
              className="w-full min-h-[44px] ps-10 pe-10 py-2 text-base sm:text-sm rounded-md bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border)] focus:border-[var(--ks-action)]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setPage(1);
                }}
                aria-label={t(language, 'clear')}
                className="absolute end-0.5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-9 sm:h-9 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
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
          aria-label={t(language, 'departmentsEyebrow')}
          className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
        >
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                : 'bg-[var(--ks-surface)] border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
            }`}
          >
            {t(language, 'allDepartments')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                  : 'bg-[var(--ks-surface)] border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
              }`}
            >
              {translateDepartmentName(language, cat.slug, cat.name)}
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
              {t(language, 'filters')}
              {activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}
            </span>
          </Button>
          <p className="text-xs sm:text-sm text-[var(--ks-text-secondary)] font-mono-num truncate">
            {filteredProducts.length === 1
              ? t(language, 'productsCountSingle', { count: filteredProducts.length })
              : t(language, 'productsCountPlural', { count: filteredProducts.length })}
            {totalPages > 1
              ? ` · ${t(language, 'pageOfTotal', { page: safePage, total: totalPages })}`
              : ''}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <label htmlFor="sort-select" className="text-xs text-[var(--ks-text-muted)] whitespace-nowrap">
              {t(language, 'sortBy')}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
              className="flex-1 sm:flex-initial min-h-[44px] px-3 text-base sm:text-sm rounded-md bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border)]"
            >
              <option value="featured">{t(language, 'sortFeatured')}</option>
              <option value="newest">{t(language, 'sortNewest')}</option>
              <option value="price-asc">{t(language, 'sortPriceAsc')}</option>
              <option value="price-desc">{t(language, 'sortPriceDesc')}</option>
              <option value="best-selling">{t(language, 'sortBestSelling')}</option>
              {filteredProducts.some((p) => p.reviewCount > 0) && (
                <option value="highest-rated">{t(language, 'sortHighestRated')}</option>
              )}
            </select>
          </div>

          <div
            role="group"
            aria-label={t(language, 'gridView')}
            className="hidden sm:flex items-center border border-[var(--ks-border)] rounded-md overflow-hidden shrink-0"
          >
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              aria-label={t(language, 'gridView')}
              aria-pressed={viewLayout === 'grid'}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-colors ${
                viewLayout === 'grid'
                  ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)]'
                  : 'bg-[var(--ks-surface)] text-[var(--ks-text-secondary)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              aria-label={t(language, 'listView')}
              aria-pressed={viewLayout === 'list'}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-colors ${
                viewLayout === 'list'
                  ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)]'
                  : 'bg-[var(--ks-surface)] text-[var(--ks-text-secondary)]'
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
              className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 py-1 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] text-xs hover:border-[var(--ks-action)] cursor-pointer transition-colors"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3 text-[var(--ks-text-muted)] shrink-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-[44px] sm:min-h-[36px] text-xs font-medium text-[var(--ks-accent)] hover:underline px-2 py-1 cursor-pointer"
          >
            {t(language, 'clearAll')}
          </button>
        </div>
      )}

      {/* Main Content Layout: Desktop Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
            <ShopFilterPanel idPrefix="desktop" {...sharedFilterProps} />
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-8">
          {storefrontLoading ? (
            <ProductGridSkeleton
              count={viewLayout === 'grid' ? 9 : 4}
              layout={viewLayout}
              label={t(language, 'loadingCatalog')}
            />
          ) : catalogError && products.length === 0 ? (
            <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
              <EmptyState
                title={t(language, 'unableToLoadCatalog')}
                description={catalogError}
                actionLabel={t(language, 'retryLoadingCatalog')}
                onAction={() => retryCatalogLoad()}
              />
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
              <EmptyState
                title={t(language, 'noMatchingProducts')}
                description={t(language, 'noMatchingProductsDesc')}
                actionLabel={t(language, 'resetFilters')}
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

      {/* Mobile Slide-Over Filter Sheet with Live Match Count Footer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title={t(language, 'filterProducts')}
        side={language === 'ar' ? 'right' : 'left'}
      >
        <div className="flex flex-col min-h-full">
          <div className="p-5 sm:p-6 flex-1">
            <ShopFilterPanel idPrefix="mobile" hideResetButton {...sharedFilterProps} />
          </div>
          <div className="sticky bottom-0 p-4 bg-[var(--ks-surface)]/95 backdrop-blur-md border-t border-[var(--ks-border)] flex items-center gap-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {activeFilterChips.length > 0 && (
              <Button variant="outline" size="md" onClick={resetFilters}>
                {t(language, 'clearAll')}
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setMobileFilterOpen(false)}
            >
              {filteredProducts.length === 1
                ? t(language, 'showItemSingle')
                : t(language, 'showItemsCount', { count: filteredProducts.length })}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};
