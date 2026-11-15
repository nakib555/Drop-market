import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeVerifiedReviewStats,
  mapRawToCatalog,
  type DummyJsonProductDto,
} from '../server/shared/dummyJsonCatalog.ts';
import {
  parseLocationToRoute,
  serializeRouteToPath,
} from '../src/context/navigationController.ts';
import { resolveSeoMetadata } from '../src/utils/seo.ts';
import type { CategoryMeta, Product, ProductReview } from '../src/types/commerce.ts';

test('computeVerifiedReviewStats aggregates only verified reviews and returns zero when unreviewed', () => {
  const mixedReviews: ProductReview[] = [
    {
      id: 'r1',
      author: 'Guest User',
      location: 'Dhaka',
      rating: 5,
      title: 'Unverified sample',
      comment: 'Should not be counted.',
      date: '2026-11-01',
      verified: false,
    },
    {
      id: 'r2',
      author: 'Rafiqul Islam',
      location: 'Dhaka',
      rating: 4,
      title: 'Solid build',
      comment: 'Works reliably every day.',
      date: '2026-11-05',
      verified: true,
    },
    {
      id: 'r3',
      author: 'Nadia Rahman',
      location: 'Banani',
      rating: 5,
      title: 'Great acoustics',
      comment: 'Balanced sound stage.',
      date: '2026-11-08',
      verified: true,
    },
  ];

  const stats = computeVerifiedReviewStats(mixedReviews);
  assert.equal(stats.verifiedReviews.length, 2);
  assert.equal(stats.reviewCount, 2);
  assert.equal(stats.rating, 4.5);

  const emptyStats = computeVerifiedReviewStats([mixedReviews[0]]);
  assert.equal(emptyStats.verifiedReviews.length, 0);
  assert.equal(emptyStats.reviewCount, 0);
  assert.equal(emptyStats.rating, 0);
});

test('mapRawToCatalog deduplicates IDs/slugs, drops invalid records, and omits unverified ratings', () => {
  const rawItems: DummyJsonProductDto[] = [
    {
      id: 101,
      title: 'Studio Wireless Headphones',
      description: 'Precision planar headphones. Engineered for low distortion.',
      category: 'mobile-accessories',
      price: 299.99,
      discountPercentage: 15,
      rating: 4.9,
      stock: 14,
      brand: 'Aeterna',
      reviews: [
        {
          rating: 5,
          comment: 'Upstream mock review',
          reviewerName: 'Sample Reviewer',
          date: '2026-10-01',
        },
      ],
      images: ['https://cdn.example.com/headphones.jpg'],
    },
    // Duplicate ID should be ignored
    {
      id: 101,
      title: 'Duplicate ID Entry',
      description: 'Should be skipped.',
      category: 'mobile-accessories',
      price: 199,
    },
    // Invalid non-positive price should be dropped
    {
      id: 102,
      title: 'Broken Zero Price Item',
      description: 'Invalid pricing',
      category: 'laptops',
      price: 0,
    },
    // Same base title with distinct ID produces unique slug cleanly
    {
      id: 103,
      title: 'Studio Wireless Headphones',
      description: 'Second edition model.',
      category: 'mobile-accessories',
      price: 349,
      stock: 4,
    },
  ];

  const { products, skus } = mapRawToCatalog(rawItems);
  assert.equal(products.length, 2);
  assert.equal(skus.length, 2);

  assert.equal(products[0].id, 'dj-101');
  assert.equal(products[0].rating, 0);
  assert.equal(products[0].reviewCount, 0);
  assert.deepEqual(products[0].reviews, []);
  assert.notEqual(products[0].badgeText, 'Top Rated');

  assert.notEqual(products[0].slug, products[1].slug);
  assert.equal(products[1].availability, 'low-stock');
});

test('navigation route parser supports clean History paths and legacy #/ hash fallbacks', () => {
  assert.deepEqual(parseLocationToRoute('/', '', ''), { name: 'home' });

  const cleanProd = parseLocationToRoute('/product/aeterna-headphones-1', '', '');
  assert.deepEqual(cleanProd, { name: 'product', slug: 'aeterna-headphones-1' });
  assert.equal(serializeRouteToPath(cleanProd), '/product/aeterna-headphones-1');

  const cleanCat = parseLocationToRoute('/category/electronics-tech', '?sub=audio-sound&brand=Aeterna', '');
  assert.deepEqual(cleanCat, {
    name: 'category',
    category: 'electronics-tech',
    subcategory: 'audio-sound',
    brand: 'Aeterna',
  });
  assert.equal(
    serializeRouteToPath(cleanCat),
    '/category/electronics-tech?sub=audio-sound&brand=Aeterna'
  );

  // Legacy alias & hash fallback resolution
  const legacyHash = parseLocationToRoute('/', '', '#/category/electronics-audio?brand=Solis');
  assert.equal(legacyHash.name, 'category');
  assert.equal(legacyHash.category, 'electronics-tech');
  assert.equal(legacyHash.brand, 'Solis');

  assert.deepEqual(parseLocationToRoute('/nonexistent-route', '', ''), { name: 'not-found' });
});

test('resolveSeoMetadata emits clean canonical URLs, noindex on private routes, and strictly verified aggregateRating JSON-LD', () => {
  const categories: CategoryMeta[] = [
    {
      id: 'cat-el',
      slug: 'electronics-tech',
      name: 'Electronics & Technology',
      shortName: 'Electronics',
      parentId: null,
      depth: 0,
      pathSlugs: ['electronics-tech'],
      description: 'Wireless audio and computing hardware.',
      bannerTagline: 'Precision acoustics',
      iconName: 'Cpu',
      image: '/pwa-512x512.png',
      imagePresetKey: 'headphones',
      countLabel: 'Audio & Computing',
      sortOrder: 1,
      isActive: true,
      seoTitle: 'Electronics & Technology — Kinto Studio',
      seoDescription: 'Shop wireless headphones and speakers.',
      collectionIds: ['featured'],
      subcategories: [],
      descendantSlugs: ['electronics-tech'],
      featuredBrands: ['Aeterna Acoustics'],
      filterFacets: [],
    },
  ];

  const unreviewedProduct: Product = {
    id: 'p-1',
    slug: 'unreviewed-speaker',
    sku: 'KS-1',
    name: 'Zonolith Acoustic Speaker',
    brand: 'Aeterna Acoustics',
    category: 'electronics-tech',
    categoryLabel: 'Electronics & Technology',
    subcategory: 'audio-sound',
    subcategoryLabel: 'Audio & Acoustics',
    price: 540,
    rating: 0,
    reviewCount: 0,
    stockCount: 9,
    availability: 'in-stock',
    cardHighlights: ['360° Dispersion', 'Balanced Driver'],
    shortDescription: 'Compact room-filling Hi-Fi speaker.',
    description: 'Machined acoustic enclosure with balanced full-range response.',
    images: ['https://cdn.example.com/speaker.jpg'],
    colors: [{ name: 'Graphite', hex: '#2F2F2C' }],
    sizes: ['Standard'],
    attributes: {},
    specifications: [],
    deliveryEstimate: '24-48h',
    returnPolicy: '30 days',
    warranty: '2 years',
    tags: ['speaker'],
    reviews: [],
  };

  const reviewedProduct: Product = {
    ...unreviewedProduct,
    id: 'p-2',
    slug: 'reviewed-headphones',
    name: 'Aeterna Studio Headphones',
    rating: 4.8,
    reviewCount: 1,
    reviews: [
      {
        id: 'rev-1',
        author: 'Rafiqul Islam',
        location: 'Dhaka',
        rating: 5,
        title: 'Reference clarity',
        comment: 'Zero listening fatigue.',
        date: '2026-11-10',
        verified: true,
      },
    ],
  };

  const unreviewedSeo = resolveSeoMetadata({
    route: { name: 'product', slug: 'unreviewed-speaker' },
    products: [unreviewedProduct, reviewedProduct],
    categories,
    origin: 'https://kintostudio.bd',
  });
  assert.equal(unreviewedSeo.robots, 'index, follow');
  assert.equal(unreviewedSeo.canonicalUrl, 'https://kintostudio.bd/product/unreviewed-speaker');
  const unreviewedProductSchema = unreviewedSeo.jsonLd.find((s) => s['@type'] === 'Product');
  assert.ok(unreviewedProductSchema);
  assert.equal('aggregateRating' in unreviewedProductSchema, false);
  assert.equal('review' in unreviewedProductSchema, false);

  const reviewedSeo = resolveSeoMetadata({
    route: { name: 'product', slug: 'reviewed-headphones' },
    products: [unreviewedProduct, reviewedProduct],
    categories,
    origin: 'https://kintostudio.bd',
  });
  const reviewedProductSchema = reviewedSeo.jsonLd.find((s) => s['@type'] === 'Product');
  assert.ok(reviewedProductSchema);
  assert.ok('aggregateRating' in reviewedProductSchema);
  assert.ok('review' in reviewedProductSchema);

  const missingProdSeo = resolveSeoMetadata({
    route: { name: 'product', slug: 'does-not-exist' },
    products: [unreviewedProduct],
    categories,
    origin: 'https://kintostudio.bd',
  });
  assert.equal(missingProdSeo.robots, 'noindex, follow');

  const checkoutSeo = resolveSeoMetadata({
    route: { name: 'checkout' },
    products: [unreviewedProduct],
    categories,
    origin: 'https://kintostudio.bd',
  });
  assert.equal(checkoutSeo.robots, 'noindex, follow');
});
