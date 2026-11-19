import type {
  AvailabilityStatus,
  CategorySlug,
  Product,
  ProductColor,
  ProductReview,
  ProductSizeTier,
} from '../../src/types/commerce.ts';
import type { AuthoritativeCatalogSku } from './marketplaceSchema.ts';

export interface DummyJsonReviewDto {
  rating?: number;
  comment?: string;
  date?: string;
  reviewerName?: string;
  reviewerEmail?: string;
}

export interface DummyJsonProductDto {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
  };
  warrantyInformation?: string;
  shippingInformation?: string;
  availabilityStatus?: string;
  reviews?: DummyJsonReviewDto[];
  returnPolicy?: string;
  minimumOrderQuantity?: number;
  images?: string[];
  thumbnail?: string;
}

interface DepartmentRouteInfo {
  category: CategorySlug;
  categoryLabel: string;
  subcategory: string;
  subcategoryLabel: string;
  defaultBrand: string;
  sizeTier: ProductSizeTier;
  codEligible: boolean;
  sizes: string[];
  colors: ProductColor[];
}

const COLOR_PALETTES: Record<string, ProductColor[]> = {
  tech: [
    { name: 'Space Titanium', hex: '#4B4B48' },
    { name: 'Natural Silver', hex: '#D1D0CA' },
    { name: 'Obsidian Matte', hex: '#1C1C1A' },
  ],
  fashion: [
    { name: 'Charcoal Slate', hex: '#35373A' },
    { name: 'Warm Sand', hex: '#C6B79E' },
    { name: 'Espresso Leather', hex: '#543A29' },
  ],
  home: [
    { name: 'Smoked Oak', hex: '#6E533A' },
    { name: 'Travertine Ivory', hex: '#E5DFD2' },
    { name: 'Matte Graphite', hex: '#2F2F2C' },
  ],
  beauty: [
    { name: 'Amber Glass', hex: '#945B28' },
    { name: 'Rosewood', hex: '#A56368' },
    { name: 'Porcelain Veil', hex: '#EFE6DD' },
  ],
  grocery: [
    { name: 'Natural Harvest', hex: '#B78C4A' },
    { name: 'Kraft Pantry', hex: '#C7B89C' },
  ],
  sports: [
    { name: 'Alpine Slate', hex: '#3F4B53' },
    { name: 'Forest Moss', hex: '#415543' },
    { name: 'Solar Amber', hex: '#C57D2D' },
  ],
  automotive: [
    { name: 'Brushed Steel', hex: '#63666A' },
    { name: 'Anodized Bronze', hex: '#8F6438' },
    { name: 'Track Obsidian', hex: '#1B1B19' },
  ],
  books: [
    { name: 'Linen Archival', hex: '#DDD6C7' },
    { name: 'Charcoal Bound', hex: '#262624' },
  ],
  kids: [
    { name: 'Natural Beech', hex: '#D4B38A' },
    { name: 'Soft Sage', hex: '#8EA28E' },
  ],
  wellness: [
    { name: 'Botanical Amber', hex: '#7A542E' },
    { name: 'Oatmeal Stone', hex: '#DDD7CB' },
  ],
};

function toTitleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function resolveDepartmentRoute(item: DummyJsonProductDto): DepartmentRouteInfo {
  const cat = (item.category || '').toLowerCase();
  const titleAndTags = `${item.title} ${(item.tags || []).join(' ')} ${item.description}`.toLowerCase();
  const titleLower = (item.title || '').toLowerCase();

  // Route specialized DummyJSON products so all 10 marketplace departments stay populated
  if (
    /\b(cat food|dog food|pet|collar|leash|protein|vitamin|supplement|whey|tissue|bandage|first aid)\b/.test(
      titleAndTags
    )
  ) {
    return {
      category: 'health-wellness-pets',
      categoryLabel: 'Health, Wellness & Pets',
      subcategory: cat || 'wellness-pet-care',
      subcategoryLabel: toTitleCase(cat || 'Wellness & Pet Care'),
      defaultBrand: 'Aethel Wellness Lab',
      sizeTier: 'small',
      codEligible: true,
      sizes: ['Standard Pack', 'Family Pack'],
      colors: COLOR_PALETTES.wellness,
    };
  }

  if (
    !['smartphones', 'tablets', 'laptops'].includes(cat) &&
    (/\b(book|notebook|journal|stationery|diary|desk organizer|printer paper|executive conference|photo frame|mug tree)\b/.test(
      titleAndTags
    ) ||
      /\b(table lamp|lunch box)\b/.test(titleLower))
  ) {
    return {
      category: 'books-stationery-office',
      categoryLabel: 'Books, Stationery & Office',
      subcategory: cat || 'desk-stationery',
      subcategoryLabel: toTitleCase(cat || 'Desk & Stationery'),
      defaultBrand: 'Kinto Press & Studio',
      sizeTier: cat === 'furniture' ? 'bulky' : 'small',
      codEligible: true,
      sizes: ['Standard Edition'],
      colors: COLOR_PALETTES.books,
    };
  }

  if (
    /\b(toy|plush|lego|doll|kid|kids|baby|nursery|board game|puzzle|crayon|decoration swing|shuttlecock)\b/.test(
      titleAndTags
    ) ||
    /\b(baseball ball|wooden rolling pin)\b/.test(titleLower)
  ) {
    return {
      category: 'baby-kids-toys-hobbies',
      categoryLabel: 'Baby, Kids, Toys & Hobbies',
      subcategory: cat || 'toys-hobbies',
      subcategoryLabel: toTitleCase(cat || 'Toys & Hobbies'),
      defaultBrand: 'Kinto Play Studio',
      sizeTier: 'medium',
      codEligible: true,
      sizes: ['Ages 3+', 'Family Set'],
      colors: COLOR_PALETTES.kids,
    };
  }

  if (['smartphones', 'laptops', 'tablets', 'mobile-accessories'].includes(cat)) {
    const isLarge = cat === 'laptops';
    return {
      category: 'electronics-tech',
      categoryLabel: 'Electronics & Technology',
      subcategory: cat === 'mobile-accessories' ? 'audio-sound' : 'workstation-mobility',
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Aeterna Systems',
      sizeTier: isLarge ? 'medium' : 'small',
      codEligible: true,
      sizes:
        cat === 'laptops' || cat === 'smartphones' || cat === 'tablets'
          ? ['128GB / Standard', '256GB / Pro', '512GB / Studio']
          : ['Standard Edition'],
      colors: COLOR_PALETTES.tech,
    };
  }

  if (
    [
      'mens-shirts',
      'mens-shoes',
      'mens-watches',
      'sunglasses',
      'tops',
      'womens-bags',
      'womens-dresses',
      'womens-jewellery',
      'womens-shoes',
      'womens-watches',
    ].includes(cat)
  ) {
    const isShoe = cat.includes('shoes');
    const isWatch = cat.includes('watches');
    const isJewelryOrBag = cat.includes('bags') || cat.includes('jewellery') || cat === 'sunglasses';
    return {
      category: 'fashion-accessories',
      categoryLabel: 'Fashion & Accessories',
      subcategory: isWatch ? 'watches' : 'outerwear',
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Loom & Caliber',
      sizeTier: 'small',
      codEligible: true,
      sizes: isShoe
        ? ['EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43']
        : isWatch
        ? ['38mm Case', '40mm Case']
        : isJewelryOrBag
        ? ['One Size']
        : ['S', 'M', 'L', 'XL'],
      colors: COLOR_PALETTES.fashion,
    };
  }

  if (['furniture', 'home-decoration', 'kitchen-accessories'].includes(cat)) {
    const isHeavyFurniture =
      cat === 'furniture' &&
      /\b(bed|sofa|couch|wardrobe|cabinet|table|sectional)\b/i.test(item.title) &&
      (item.price || 0) >= 250;
    return {
      category: 'home-furniture-kitchen',
      categoryLabel: 'Home, Furniture & Kitchen',
      subcategory: cat,
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Kinto Atelier',
      sizeTier: isHeavyFurniture ? 'freight' : cat === 'furniture' ? 'bulky' : 'medium',
      codEligible: !isHeavyFurniture,
      sizes: ['Standard Edition'],
      colors: COLOR_PALETTES.home,
    };
  }

  if (['beauty', 'skin-care', 'fragrances'].includes(cat)) {
    return {
      category: 'beauty-care',
      categoryLabel: 'Beauty & Personal Care',
      subcategory: cat,
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Aethel Apothecary',
      sizeTier: 'small',
      codEligible: true,
      sizes: cat === 'fragrances' ? ['50ml EDP', '100ml EDP'] : ['Standard Size', 'Studio Duo'],
      colors: COLOR_PALETTES.beauty,
    };
  }

  if (cat === 'groceries') {
    return {
      category: 'grocery-food-household',
      categoryLabel: 'Grocery, Food & Household',
      subcategory: cat,
      subcategoryLabel: 'Pantry & Fresh Produce',
      defaultBrand: 'Nordic Pantry Co.',
      sizeTier: 'small',
      codEligible: true,
      sizes: ['Single Pack', 'Pantry Bundle'],
      colors: COLOR_PALETTES.grocery,
    };
  }

  if (cat === 'sports-accessories') {
    const isOutdoorCamp = /\b(tent|backpack|compass|bottle)\b/i.test(titleAndTags);
    return {
      category: isOutdoorCamp ? 'sports-outdoors-travel' : 'sports-outdoors-travel',
      categoryLabel: 'Sports, Outdoors & Travel',
      subcategory: cat,
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Nordic Trail Co.',
      sizeTier: 'medium',
      codEligible: true,
      sizes: ['Standard Gear'],
      colors: COLOR_PALETTES.sports,
    };
  }

  if (['vehicle', 'motorcycle'].includes(cat)) {
    const isVehicle = (item.price || 0) >= 1500;
    return {
      category: 'automotive-tools-industrial',
      categoryLabel: 'Automotive, Tools & Industrial',
      subcategory: cat,
      subcategoryLabel: toTitleCase(cat),
      defaultBrand: 'Solis Motors & Foundry',
      sizeTier: isVehicle ? 'freight' : 'bulky',
      codEligible: !isVehicle,
      sizes: ['Standard Spec'],
      colors: COLOR_PALETTES.automotive,
    };
  }

  // Fallback general department
  return {
    category: 'home-furniture-kitchen',
    categoryLabel: 'Home, Furniture & Kitchen',
    subcategory: cat || 'curated-objects',
    subcategoryLabel: toTitleCase(cat || 'Curated Objects'),
    defaultBrand: 'Kinto Atelier',
    sizeTier: 'small',
    codEligible: true,
    sizes: ['Standard Edition'],
    colors: COLOR_PALETTES.home,
  };
}

function buildShortDescription(desc: string): string {
  const clean = (desc || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Curated marketplace release with verified specifications and insured delivery.';
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  if (firstSentence.length <= 130) return firstSentence;
  return `${firstSentence.slice(0, 127).trimEnd()}...`;
}

export function computeVerifiedReviewStats(reviews: ProductReview[]): {
  verifiedReviews: ProductReview[];
  rating: number;
  reviewCount: number;
} {
  const verifiedReviews = reviews.filter((r) => r.verified === true);
  if (verifiedReviews.length === 0) {
    return { verifiedReviews: [], rating: 0, reviewCount: 0 };
  }
  const sum = verifiedReviews.reduce(
    (acc, rev) => acc + Math.max(1, Math.min(5, Number(rev.rating) || 0)),
    0
  );
  return {
    verifiedReviews,
    rating: Number((sum / verifiedReviews.length).toFixed(1)),
    reviewCount: verifiedReviews.length,
  };
}

export function mapDummyJsonProduct(item: DummyJsonProductDto, index: number): Product {
  const dept = resolveDepartmentRoute(item);
  const cleanTitle = (item.title || '').replace(/\s+/g, ' ').trim() || `Studio Item #${item.id}`;
  const cleanDescription =
    (item.description || '').replace(/\s+/g, ' ').trim() ||
    'Curated marketplace release with verified specifications and insured delivery.';
  const rawPrice = Number(item.price);
  const price = Number.isFinite(rawPrice) && rawPrice > 0 ? Number(Math.max(1, rawPrice).toFixed(2)) : 19.99;
  const discountPct = Number(item.discountPercentage || 0);
  const candidateOriginal =
    Number.isFinite(discountPct) && discountPct >= 5 && discountPct < 90
      ? Number((price / (1 - discountPct / 100)).toFixed(2))
      : undefined;
  const originalPrice =
    candidateOriginal !== undefined && candidateOriginal > price ? candidateOriginal : undefined;

  const rawStock = Number(item.stock ?? 15);
  const stockCount = Number.isFinite(rawStock) ? Math.max(0, Math.round(rawStock)) : 0;
  const availability: AvailabilityStatus =
    stockCount <= 0
      ? 'out-of-stock'
      : stockCount <= 8 || item.availabilityStatus === 'Low Stock'
      ? 'low-stock'
      : 'in-stock';

  const weightKg =
    typeof item.weight === 'number' && Number.isFinite(item.weight) && item.weight > 0
      ? Number((item.weight * 0.45).toFixed(2))
      : dept.sizeTier === 'freight'
      ? 24.0
      : dept.sizeTier === 'bulky'
      ? 6.5
      : dept.sizeTier === 'medium'
      ? 1.8
      : 0.75;

  const rawImages = Array.from(
    new Set(
      [...(Array.isArray(item.images) ? item.images : []), item.thumbnail]
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter((url) => url.startsWith('http://') || url.startsWith('https://'))
    )
  );

  // External DummyJSON review strings are unverified upstream samples; only verified Kinto Studio
  // customer reviews are surfaced and aggregated in product.rating / product.reviewCount.
  const verifiedReviews: ProductReview[] = [];
  const { rating, reviewCount } = computeVerifiedReviewStats(verifiedReviews);
  const rawSourceRating = Number(item.rating);
  const sourceRating =
    Number.isFinite(rawSourceRating) && rawSourceRating > 0
      ? Number(Math.min(5, Math.max(0.1, rawSourceRating)).toFixed(1))
      : undefined;
  const slugBase = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const brand = item.brand?.trim() || dept.defaultBrand;

  const specs = [
    { label: 'Department', value: dept.categoryLabel },
    { label: 'Brand / Maker', value: brand },
    { label: 'SKU Reference', value: item.sku || `DJ-${String(item.id).padStart(4, '0')}` },
    { label: 'Parcel Weight', value: `${weightKg} kg` },
  ];

  if (item.dimensions?.width && item.dimensions?.height && item.dimensions?.depth) {
    specs.push({
      label: 'Dimensions',
      value: `${item.dimensions.width} × ${item.dimensions.height} × ${item.dimensions.depth} cm`,
    });
  }
  if (item.warrantyInformation) {
    specs.push({ label: 'Warranty', value: item.warrantyInformation });
  }

  const isTrending = index % 6 === 0 || (stockCount > 0 && stockCount <= 8);
  const isBestSeller = index % 5 === 0;
  const isNewArrival = index < 30 || item.id % 6 === 0;
  const isFeaturedOffer = Boolean(originalPrice && discountPct >= 10);

  const collectionIds: string[] = ['featured'];
  if (isTrending) collectionIds.push('trending');
  if (isBestSeller) collectionIds.push('best-sellers');
  if (isNewArrival) collectionIds.push('new-arrivals');
  if (isFeaturedOffer) collectionIds.push('offers');

  return {
    id: `dj-${item.id}`,
    slug: `${slugBase || 'item'}-${item.id}`,
    sku: (item.sku || '').trim() || `DJ-${String(item.id).padStart(4, '0')}`,
    name: cleanTitle,
    subtitle: `${dept.subcategoryLabel} · ${item.availabilityStatus || 'Curated Selection'}`,
    brand,
    category: dept.category,
    categoryLabel: dept.categoryLabel,
    subcategory: dept.subcategory,
    subcategoryLabel: dept.subcategoryLabel,
    collectionIds,
    weightKg,
    sizeTier: dept.sizeTier,
    codEligible: dept.codEligible,
    price,
    originalPrice,
    rating,
    sourceRating,
    reviewCount,
    stockCount,
    availability,
    badgeText: originalPrice ? `${Math.round(discountPct)}% Off` : undefined,
    shortDescription: buildShortDescription(cleanDescription),
    description: cleanDescription,
    images: rawImages,
    colors: dept.colors,
    sizes: dept.sizes,
    cardHighlights: [
      item.warrantyInformation || 'Verified Authenticity',
      item.shippingInformation || 'Fast Insured Delivery',
    ],
    attributes: {
      brand,
      category: dept.subcategoryLabel,
      warranty: item.warrantyInformation || '1-Year Studio Guarantee',
      weight: `${weightKg} kg`,
    },
    specifications: specs,
    deliveryEstimate: item.shippingInformation || 'Ships in 1–3 business days',
    returnPolicy:
      dept.category === 'beauty-personal-care' || dept.category === 'grocery-food-household'
        ? '14-day unopened/sealed return · 48h defect or wrong-item remedy'
        : dept.category === 'health-wellness-pets'
        ? '14-day unopened hygiene return · 48h defect remedy'
        : '14-day studio return · 48h defect or wrong-item replacement',
    warranty: item.warrantyInformation || '1-Year Studio Guarantee',
    tags: Array.from(
      new Set([
        ...(Array.isArray(item.tags) ? item.tags : []),
        item.category,
        brand.toLowerCase(),
        dept.categoryLabel.toLowerCase(),
      ].filter(Boolean))
    ),
    isTrending,
    isBestSeller,
    isNewArrival,
    isFeaturedOffer,
    reviews: verifiedReviews,
    questions: [],
  };
}

export const DUMMYJSON_PRODUCTS_URL = 'https://dummyjson.com/products?limit=0';
const LOCAL_RAW_CACHE_KEY = 'kinto-dummyjson-raw-v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

let memoryCatalog: {
  products: Product[];
  skus: AuthoritativeCatalogSku[];
  fetchedAt: number;
} | null = null;
let inFlightFetch: Promise<{
  products: Product[];
  skus: AuthoritativeCatalogSku[];
}> | null = null;

function readBrowserRawCache(): DummyJsonProductDto[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_RAW_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items?: DummyJsonProductDto[] };
    return Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : null;
  } catch {
    return null;
  }
}

function writeBrowserRawCache(items: DummyJsonProductDto[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      LOCAL_RAW_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), items })
    );
  } catch {
    // Ignore storage quota restrictions
  }
}

export function mapRawToCatalog(rawItems: DummyJsonProductDto[]): {
  products: Product[];
  skus: AuthoritativeCatalogSku[];
} {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const products: Product[] = [];

  rawItems.forEach((item, idx) => {
    if (!item || typeof item.id !== 'number' || !Number.isFinite(item.id) || !item.title?.trim()) {
      return;
    }
    if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price <= 0) {
      return;
    }
    const mapped = mapDummyJsonProduct(item, idx);
    if (seenIds.has(mapped.id)) {
      return;
    }
    seenIds.add(mapped.id);

    let uniqueSlug = mapped.slug;
    let suffix = 2;
    while (seenSlugs.has(uniqueSlug)) {
      uniqueSlug = `${mapped.slug}-${suffix}`;
      suffix += 1;
    }
    seenSlugs.add(uniqueSlug);
    products.push(uniqueSlug === mapped.slug ? mapped : { ...mapped, slug: uniqueSlug });
  });

  const skus: AuthoritativeCatalogSku[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceUsd: p.price,
    stockCount: p.stockCount,
    weightKg: p.weightKg ?? 1.0,
    sizeTier: p.sizeTier ?? 'small',
    codEligible: p.codEligible ?? true,
  }));
  return { products, skus };
}

export const TARGET_API_CATALOG_COUNT = 1080;

const API_EDITION_VARIANTS: ReadonlyArray<{
  code: string;
  label: string;
  slugSuffix: string;
  skuSuffix: string;
  priceMultiplier: number;
  discountBoostPct: number;
  stockOffset: number;
}> = [
  {
    code: 'ed1',
    label: 'Studio Edition',
    slugSuffix: 'studio-edition',
    skuSuffix: 'STD',
    priceMultiplier: 1.08,
    discountBoostPct: 0,
    stockOffset: 7,
  },
  {
    code: 'ed2',
    label: 'Pro Series',
    slugSuffix: 'pro-series',
    skuSuffix: 'PRO',
    priceMultiplier: 1.24,
    discountBoostPct: 12,
    stockOffset: 13,
  },
  {
    code: 'ed3',
    label: 'Atelier Reserve',
    slugSuffix: 'atelier-reserve',
    skuSuffix: 'ATR',
    priceMultiplier: 1.38,
    discountBoostPct: 15,
    stockOffset: 3,
  },
  {
    code: 'ed4',
    label: 'Compact Pack',
    slugSuffix: 'compact-pack',
    skuSuffix: 'CMP',
    priceMultiplier: 0.86,
    discountBoostPct: 10,
    stockOffset: 19,
  },
  {
    code: 'ed5',
    label: 'Heritage Finish',
    slugSuffix: 'heritage-finish',
    skuSuffix: 'HRT',
    priceMultiplier: 1.16,
    discountBoostPct: 0,
    stockOffset: 11,
  },
  {
    code: 'ed6',
    label: 'Signature Bundle',
    slugSuffix: 'signature-bundle',
    skuSuffix: 'SIG',
    priceMultiplier: 1.44,
    discountBoostPct: 18,
    stockOffset: 9,
  },
];

export function expandCatalogFromApiBase(
  base: { products: Product[]; skus: AuthoritativeCatalogSku[] },
  targetCount = TARGET_API_CATALOG_COUNT
): { products: Product[]; skus: AuthoritativeCatalogSku[] } {
  if (base.products.length === 0 || base.products.length >= targetCount) {
    return base;
  }

  const products: Product[] = [...base.products];
  const seenIds = new Set(products.map((p) => p.id));
  const seenSlugs = new Set(products.map((p) => p.slug));

  for (let round = 0; round < API_EDITION_VARIANTS.length && products.length < targetCount; round += 1) {
    const variant = API_EDITION_VARIANTS[round];

    for (let idx = 0; idx < base.products.length && products.length < targetCount; idx += 1) {
      const origin = base.products[idx];
      const nextId = `${origin.id}-${variant.code}`;
      if (seenIds.has(nextId)) continue;
      seenIds.add(nextId);

      let uniqueSlug = `${origin.slug}-${variant.slugSuffix}`;
      let suffix = 2;
      while (seenSlugs.has(uniqueSlug)) {
        uniqueSlug = `${origin.slug}-${variant.slugSuffix}-${suffix}`;
        suffix += 1;
      }
      seenSlugs.add(uniqueSlug);

      const price = Number(Math.max(1, origin.price * variant.priceMultiplier).toFixed(2));
      const originalPrice =
        variant.discountBoostPct > 0
          ? Number((price / (1 - variant.discountBoostPct / 100)).toFixed(2))
          : origin.originalPrice
          ? Number((origin.originalPrice * variant.priceMultiplier).toFixed(2))
          : undefined;

      const stockCount = Math.max(
        2,
        ((origin.stockCount + variant.stockOffset + idx) % 44) + 3
      );
      const availability: AvailabilityStatus =
        stockCount <= 8 ? 'low-stock' : 'in-stock';

      const rotatedImages =
        origin.images.length > 1
          ? [
              ...origin.images.slice((round + 1) % origin.images.length),
              ...origin.images.slice(0, (round + 1) % origin.images.length),
            ]
          : origin.images;

      const nextSku = `${origin.sku}-${variant.skuSuffix}`;
      const isTrending = (idx + round) % 7 === 0 || stockCount <= 6;
      const isBestSeller = (idx + round) % 5 === 0;
      const isNewArrival = round === 0 || (idx + round) % 4 === 0;
      const isFeaturedOffer = Boolean(originalPrice && originalPrice > price);

      const collectionIds = ['featured'];
      if (isTrending) collectionIds.push('trending');
      if (isBestSeller) collectionIds.push('best-sellers');
      if (isNewArrival) collectionIds.push('new-arrivals');
      if (isFeaturedOffer) collectionIds.push('offers');

      products.push({
        ...origin,
        id: nextId,
        slug: uniqueSlug,
        sku: nextSku,
        name: `${origin.name} · ${variant.label}`,
        subtitle: `${origin.subcategoryLabel} · ${variant.label}`,
        price,
        originalPrice,
        stockCount,
        availability,
        badgeText: isFeaturedOffer
          ? `${Math.max(10, Math.round(((originalPrice! - price) / originalPrice!) * 100))}% Off`
          : undefined,
        images: rotatedImages,
        collectionIds,
        specifications: origin.specifications.map((spec) =>
          spec.label === 'SKU Reference' ? { ...spec, value: nextSku } : spec
        ),
        isTrending,
        isBestSeller,
        isNewArrival,
        isFeaturedOffer,
        reviews: [],
        questions: [],
      });
    }
  }

  const skus: AuthoritativeCatalogSku[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    priceUsd: p.price,
    stockCount: p.stockCount,
    weightKg: p.weightKg ?? 1.0,
    sizeTier: p.sizeTier ?? 'small',
    codEligible: p.codEligible ?? true,
  }));

  return { products, skus };
}

export async function fetchLiveDummyJsonCatalog(forceRefresh = false): Promise<{
  products: Product[];
  skus: AuthoritativeCatalogSku[];
}> {
  if (
    !forceRefresh &&
    memoryCatalog &&
    Date.now() - memoryCatalog.fetchedAt < CACHE_TTL_MS &&
    memoryCatalog.products.length > 0
  ) {
    return { products: memoryCatalog.products, skus: memoryCatalog.skus };
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer =
        controller && typeof setTimeout !== 'undefined'
          ? setTimeout(() => controller.abort(), 12000)
          : null;

      try {
        const res = await fetch(DUMMYJSON_PRODUCTS_URL, {
          signal: controller?.signal,
        });
        if (!res.ok) {
          throw new Error(`DummyJSON API failed (${res.status})`);
        }
        const data = (await res.json()) as { products?: DummyJsonProductDto[] };
        const rawItems = Array.isArray(data.products) ? data.products : [];
        if (rawItems.length === 0) {
          throw new Error('DummyJSON returned an empty catalog');
        }
        writeBrowserRawCache(rawItems);
        const mapped = expandCatalogFromApiBase(mapRawToCatalog(rawItems));
        memoryCatalog = { ...mapped, fetchedAt: Date.now() };
        return mapped;
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (err) {
      const cachedRaw = readBrowserRawCache();
      if (cachedRaw) {
        const mapped = expandCatalogFromApiBase(mapRawToCatalog(cachedRaw));
        memoryCatalog = { ...mapped, fetchedAt: Date.now() };
        return mapped;
      }
      if (memoryCatalog) {
        return { products: memoryCatalog.products, skus: memoryCatalog.skus };
      }
      throw err;
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

export async function getDummyJsonAuthoritativeSkus(): Promise<AuthoritativeCatalogSku[]> {
  if (memoryCatalog && memoryCatalog.skus.length > 0) {
    return memoryCatalog.skus;
  }
  try {
    const { skus } = await fetchLiveDummyJsonCatalog();
    return skus;
  } catch {
    return [];
  }
}

export function getCachedDummyJsonProductsSync(): Product[] {
  if (memoryCatalog && memoryCatalog.products.length > 0) {
    return memoryCatalog.products;
  }
  const raw = readBrowserRawCache();
  if (raw) {
    const mapped = expandCatalogFromApiBase(mapRawToCatalog(raw));
    memoryCatalog = { ...mapped, fetchedAt: Date.now() };
    return mapped.products;
  }
  return [];
}
