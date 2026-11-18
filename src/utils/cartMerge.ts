import type {
  ApiSellerProductRecord,
  CartItem,
  CartMergeAdjustment,
  CartMergeReport,
  Product,
  ProductOverride,
  SellerInventoryItem,
} from '../types/commerce';
import type { AuthoritativeCatalogSku } from '../../server/shared/marketplaceSchema';

export interface MergeCartsInput {
  guestCart: CartItem[];
  serverCart: CartItem[];
  products: Product[];
  productOverrides?: Record<string, ProductOverride>;
}

export function buildCartMergeProducts(params: {
  cachedProducts: Product[];
  authoritativeSkus: AuthoritativeCatalogSku[];
  sellerInventory: SellerInventoryItem[];
  sellerCreatedProducts: ApiSellerProductRecord[];
}): Product[] {
  const byId = new Map<string, Product>();

  const makeShellProduct = (base: {
    id: string;
    slug: string;
    sku: string;
    name: string;
    subtitle?: string;
    brand: string;
    category: Product['category'];
    categoryLabel: string;
    subcategory?: string;
    subcategoryLabel?: string;
    price: number;
    availability: Product['availability'];
    stockCount: number;
    rating?: number;
    reviewCount?: number;
    colors?: Product['colors'];
    sizes?: string[];
    shortDescription?: string;
    description?: string;
    specifications?: Product['specifications'];
    deliveryEstimate?: string;
    weightKg?: number;
    sizeTier?: Product['sizeTier'];
    codEligible?: boolean;
  }): Product => ({
    id: base.id,
    slug: base.slug,
    sku: base.sku,
    name: base.name,
    subtitle: base.subtitle || base.name,
    brand: base.brand,
    category: base.category,
    categoryLabel: base.categoryLabel,
    subcategory: base.subcategory || 'featured',
    subcategoryLabel: base.subcategoryLabel || base.categoryLabel,
    price: base.price,
    availability: base.availability,
    stockCount: base.stockCount,
    rating: base.rating ?? 0,
    reviewCount: base.reviewCount ?? 0,
    images: [],
    colors: base.colors || [],
    sizes: base.sizes || [],
    collectionIds: [],
    cardHighlights: [],
    shortDescription: base.shortDescription || base.name,
    description: base.description || base.name,
    specifications: base.specifications || [],
    attributes: {},
    deliveryEstimate: base.deliveryEstimate || '2-4 business days',
    returnPolicy: '30-day studio return',
    warranty: 'Standard studio warranty',
    tags: [],
    weightKg: base.weightKg,
    sizeTier: base.sizeTier,
    codEligible: base.codEligible,
    reviews: [],
    questions: [],
  });

  for (const sku of params.authoritativeSkus) {
    byId.set(
      sku.id,
      makeShellProduct({
        id: sku.id,
        slug: sku.id,
        sku: sku.sku,
        name: sku.name,
        brand: 'Kinto Studio',
        category: 'electronics-tech',
        categoryLabel: 'Kinto Studio',
        price: sku.priceUsd,
        availability: sku.stockCount > 0 ? 'in-stock' : 'out-of-stock',
        stockCount: sku.stockCount,
        weightKg: sku.weightKg,
        sizeTier: sku.sizeTier,
        codEligible: sku.codEligible,
      })
    );
  }

  for (const inv of params.sellerInventory) {
    const existing = byId.get(inv.id);
    byId.set(
      inv.id,
      existing
        ? {
            ...existing,
            name: inv.name,
            brand: inv.brand,
            category: inv.category,
            categoryLabel: inv.categoryLabel,
            price: inv.price,
            stockCount: inv.stockCount,
            availability: inv.availability,
          }
        : makeShellProduct({
            id: inv.id,
            slug: inv.id,
            sku: inv.sku,
            name: inv.name,
            brand: inv.brand,
            category: inv.category,
            categoryLabel: inv.categoryLabel,
            price: inv.price,
            availability: inv.availability,
            stockCount: inv.stockCount,
          })
    );
  }

  for (const product of params.cachedProducts) {
    byId.set(product.id, product);
  }

  for (const sp of params.sellerCreatedProducts) {
    byId.set(
      sp.id,
      makeShellProduct({
        id: sp.id,
        slug: sp.slug,
        sku: sp.sku,
        name: sp.name,
        subtitle: sp.subtitle,
        brand: sp.brand,
        category: sp.category,
        categoryLabel: sp.categoryLabel,
        subcategory: sp.subcategory,
        subcategoryLabel: sp.subcategoryLabel,
        price: sp.price,
        availability: sp.availability,
        stockCount: sp.stockCount,
        rating: sp.rating,
        reviewCount: sp.reviewCount,
        colors: sp.colors,
        sizes: sp.sizes,
        shortDescription: sp.shortDescription,
        description: sp.description,
        specifications: sp.specifications,
        deliveryEstimate: sp.deliveryEstimate,
      })
    );
  }

  return Array.from(byId.values());
}

export function buildCartItemKey(productId: string, color: string, size: string): string {
  return `${productId}::${color}::${size}`;
}

export function mergeGuestAndServerCarts(input: MergeCartsInput): {
  mergedCart: CartItem[];
  report: CartMergeReport;
} {
  const { guestCart, serverCart, products, productOverrides } = input;
  const productMap = new Map<string, Product>();
  for (const product of products) {
    productMap.set(product.id, product);
  }

  const combinedByKey = new Map<
    string,
    {
      item: CartItem;
      fromGuest: boolean;
      fromServer: boolean;
    }
  >();

  const adjustments: CartMergeAdjustment[] = [];
  let addedFromGuest = 0;

  const upsert = (sourceItem: CartItem, source: 'guest' | 'server') => {
    const key = sourceItem.key || buildCartItemKey(sourceItem.productId, sourceItem.color, sourceItem.size);
    const existing = combinedByKey.get(key);
    if (!existing) {
      combinedByKey.set(key, {
        item: { ...sourceItem, key },
        fromGuest: source === 'guest',
        fromServer: source === 'server',
      });
      if (source === 'guest') {
        addedFromGuest += 1;
      }
      return;
    }

    existing.item = {
      ...existing.item,
      quantity: Math.max(1, existing.item.quantity) + Math.max(1, sourceItem.quantity),
    };
    if (source === 'guest') existing.fromGuest = true;
    if (source === 'server') existing.fromServer = true;
  };

  for (const item of serverCart) {
    if (item && item.productId && item.quantity > 0) {
      upsert(item, 'server');
    }
  }
  for (const item of guestCart) {
    if (item && item.productId && item.quantity > 0) {
      upsert(item, 'guest');
    }
  }

  const mergedCart: CartItem[] = [];

  for (const entry of combinedByKey.values()) {
    const rawItem = entry.item;
    const liveProduct = productMap.get(rawItem.productId);
    const override = productOverrides?.[rawItem.productId];

    if (!liveProduct) {
      adjustments.push({
        key: rawItem.key,
        productId: rawItem.productId,
        name: rawItem.name,
        reason: 'unavailable',
        requestedQuantity: rawItem.quantity,
        finalQuantity: 0,
      });
      continue;
    }

    const liveAvailability = override?.availability ?? liveProduct.availability;
    const liveStockCount = Math.max(0, override?.stockCount ?? liveProduct.stockCount);
    const livePrice = override?.price ?? liveProduct.price;
    const liveOriginalPrice =
      liveProduct.originalPrice && liveProduct.originalPrice > livePrice
        ? liveProduct.originalPrice
        : undefined;

    if (liveAvailability === 'out-of-stock' || liveStockCount <= 0) {
      adjustments.push({
        key: rawItem.key,
        productId: rawItem.productId,
        name: liveProduct.name,
        reason: 'out_of_stock',
        requestedQuantity: rawItem.quantity,
        finalQuantity: 0,
      });
      continue;
    }

    const requestedQty = Math.max(1, rawItem.quantity);
    const clampedQty = Math.min(requestedQty, liveStockCount);

    if (clampedQty < requestedQty) {
      adjustments.push({
        key: rawItem.key,
        productId: rawItem.productId,
        name: liveProduct.name,
        reason: 'clamped_stock',
        requestedQuantity: requestedQty,
        finalQuantity: clampedQty,
      });
    } else if (Math.abs(livePrice - rawItem.price) > 0.009) {
      adjustments.push({
        key: rawItem.key,
        productId: rawItem.productId,
        name: liveProduct.name,
        reason: 'price_updated',
        requestedQuantity: requestedQty,
        finalQuantity: clampedQty,
        previousPrice: rawItem.price,
        updatedPrice: livePrice,
      });
    }

    mergedCart.push({
      ...rawItem,
      name: liveProduct.name,
      brand: liveProduct.brand,
      category: liveProduct.category,
      slug: liveProduct.slug,
      image: liveProduct.images[0] || rawItem.image,
      price: livePrice,
      originalPrice: liveOriginalPrice,
      stockCount: liveStockCount,
      weightKg: liveProduct.weightKg ?? rawItem.weightKg,
      sizeTier: liveProduct.sizeTier ?? rawItem.sizeTier,
      quantity: clampedQty,
    });
  }

  return {
    mergedCart,
    report: {
      addedFromGuest,
      mergedTotalCount: mergedCart.reduce((acc, item) => acc + item.quantity, 0),
      adjustments,
    },
  };
}
