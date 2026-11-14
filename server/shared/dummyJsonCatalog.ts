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

export function mapDummyJsonProduct(item: DummyJsonProductDto, index: number): Product {
  const dept = resolveDepartmentRoute(item);
  const price = Math.max(1, Number((item.price || 19.99).toFixed(2)));
  const discountPct = Number(item.discountPercentage || 0);
  const originalPrice =
    discountPct >= 5 && discountPct < 90
      ? Number((price / (1 - discountPct / 100)).toFixed(2))
      : undefined;

  const stockCount = Math.max(0, Math.round(Number(item.stock ?? 15)));
  const availability: AvailabilityStatus =
    stockCount <= 0
      ? 'out-of-stock'
      : stockCount <= 8 || item.availabilityStatus === 'Low Stock'
      ? 'low-stock'
      : 'in-stock';

  const weightKg =
    typeof item.weight === 'number' && item.weight > 0
      ? Number((item.weight * 0.45).toFixed(2)) // DummyJSON weights are unitless/lbs-like small integers
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

  const mappedReviews: ProductReview[] = (Array.isArray(item.reviews) ? item.reviews : []).map(
    (rev, rIdx) => ({
      id: `dj-rev-${item.id}-${rIdx + 1}`,
      author: rev.reviewerName?.trim() || 'Verified Buyer',
      location: 'Verified Marketplace Order',
      rating: Math.max(1, Math.min(5, Math.round(rev.rating ?? 5))),
      title:
        (rev.rating ?? 5) >= 5
          ? 'Exceeds Expectations'
          : (rev.rating ?? 5) >= 4
          ? 'Solid Build & Value'
          : 'Helpful Purchase Note',
      comment: rev.comment?.trim() || 'Verified delivery and authentic packaging.',
      date: rev.date ? rev.date.slice(0, 10) : '2026-10-15',
      verified: true,
    })
  );

  const rating = Number(Math.max(1, Math.min(5, item.rating || 4.6)).toFixed(1));
  const reviewCount = Math.max(mappedReviews.length, Math.round((item.stock || 8) * 1.4 + 6));
  const slugBase = item.title
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

  const isTrending = rating >= 4.4 || index % 7 === 0;
  const isBestSeller = reviewCount >= 35 || index % 5 === 0;
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
    sku: item.sku || `DJ-${String(item.id).padStart(4, '0')}`,
    name: item.title,
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
    reviewCount,
    stockCount,
    availability,
    badgeText: originalPrice
      ? `${Math.round(discountPct)}% Off`
      : isTrending && rating >= 4.7
      ? 'Top Rated'
      : undefined,
    shortDescription: buildShortDescription(item.description),
    description: item.description || 'Verified marketplace selection.',
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
    returnPolicy: item.returnPolicy || '30-day studio return guarantee',
    warranty: item.warrantyInformation || '1-Year Studio Guarantee',
    tags: Array.from(
      new Set([
        ...(Array.isArray(item.tags) ? item.tags : []),
        item.category,
        brand.toLowerCase(),
        dept.categoryLabel.toLowerCase(),
      ])
    ),
    isTrending,
    isBestSeller,
    isNewArrival,
    isFeaturedOffer,
    reviews: mappedReviews,
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

function mapRawToCatalog(rawItems: DummyJsonProductDto[]): {
  products: Product[];
  skus: AuthoritativeCatalogSku[];
} {
  const products = rawItems.map((item, idx) => mapDummyJsonProduct(item, idx));
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
        const mapped = mapRawToCatalog(rawItems);
        memoryCatalog = { ...mapped, fetchedAt: Date.now() };
        return mapped;
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (err) {
      const cachedRaw = readBrowserRawCache();
      if (cachedRaw) {
        const mapped = mapRawToCatalog(cachedRaw);
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
    const mapped = mapRawToCatalog(raw);
    memoryCatalog = { ...mapped, fetchedAt: Date.now() };
    return mapped.products;
  }
  return [];
}
