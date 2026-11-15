import { normalizeCategorySlug } from '../../server/shared/marketplaceSchema';
import type { CategoryMeta, Product, RouteName } from '../types/commerce';

export interface SeoFaqItem {
  category: string;
  question: string;
  answer: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'product' | 'article';
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  jsonLd: Array<Record<string, unknown>>;
}

export interface SeoRouteInput {
  name: RouteName;
  slug?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  query?: string;
  collection?: 'trending' | 'best-sellers' | 'new-arrivals' | 'offers';
  accountTab?: string;
  orderId?: string;
}

const DEFAULT_DESCRIPTION =
  'Shop electronics, tailored fashion, home furnishings, botanical beauty, groceries, outdoor gear, books, industrial tools, kids, and wellness with BDT and USD pricing across Bangladesh.';

const DEFAULT_IMAGE_PATH = '/pwa-512x512.png';

const NOINDEX_ROUTES = new Set<RouteName>([
  'cart',
  'wishlist',
  'checkout',
  'account',
  'login',
  'seller',
  'admin',
  'track-order',
  'compare',
  'search',
  'maintenance',
  'not-found',
]);

function toAbsoluteUrl(pathOrUrl: string, origin: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (!pathOrUrl) return `${cleanOrigin}${DEFAULT_IMAGE_PATH}`;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanOrigin}${normalizedPath}`;
}

export function buildCanonicalPath(route: SeoRouteInput): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'product':
      return route.slug ? `/product/${encodeURIComponent(route.slug)}` : '/shop';
    case 'category': {
      const cat = normalizeCategorySlug(route.category || 'home-furniture-kitchen') || 'home-furniture-kitchen';
      const params = new URLSearchParams();
      if (route.subcategory) params.set('sub', route.subcategory);
      if (route.brand) params.set('brand', route.brand);
      const qs = params.toString();
      return qs ? `/category/${cat}?${qs}` : `/category/${cat}`;
    }
    case 'shop': {
      const params = new URLSearchParams();
      if (route.collection) params.set('collection', route.collection);
      if (route.category && route.category !== 'all') params.set('category', route.category);
      if (route.subcategory) params.set('sub', route.subcategory);
      if (route.brand) params.set('brand', route.brand);
      const qs = params.toString();
      return qs ? `/shop?${qs}` : '/shop';
    }
    case 'search':
      return route.query ? `/search?q=${encodeURIComponent(route.query)}` : '/search';
    case 'account':
      return route.accountTab && route.accountTab !== 'overview'
        ? `/account/${encodeURIComponent(route.accountTab)}`
        : '/account';
    case 'login':
      return route.accountTab === 'register' ? '/login?tab=register' : '/login';
    case 'track-order':
      return route.orderId ? `/track-order?id=${encodeURIComponent(route.orderId)}` : '/track-order';
    case 'not-found':
      return '/not-found';
    default:
      return `/${route.name}`;
  }
}

export function resolveSeoMetadata(params: {
  route: SeoRouteInput;
  products: Product[];
  categories: CategoryMeta[];
  origin?: string;
  faqItems?: SeoFaqItem[];
}): SeoMetadata {
  const {
    route,
    products,
    categories,
    origin = 'https://kintostudio.bd',
    faqItems = [],
  } = params;

  const cleanOrigin = origin.replace(/\/+$/, '');
  const canonicalUrl = `${cleanOrigin}${buildCanonicalPath(route)}`;
  let title = 'KINTO STUDIO — Everyday Goods & Multi-Department Store';
  let description = DEFAULT_DESCRIPTION;
  let robots = NOINDEX_ROUTES.has(route.name) ? 'noindex, follow' : 'index, follow';
  let ogType: SeoMetadata['ogType'] = 'website';
  let ogImage = toAbsoluteUrl(DEFAULT_IMAGE_PATH, cleanOrigin);

  const baseSchemas: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'KINTO STUDIO',
      url: cleanOrigin,
      logo: toAbsoluteUrl(DEFAULT_IMAGE_PATH, cleanOrigin),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'KINTO STUDIO',
      url: cleanOrigin,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${cleanOrigin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  const jsonLd: Array<Record<string, unknown>> = [...baseSchemas];

  if (route.name === 'product') {
    const found = route.slug ? products.find((p) => p.slug === route.slug) : undefined;
    if (found) {
      title = `${found.name} — ${found.brand} | KINTO STUDIO`;
      description = found.shortDescription || found.description.slice(0, 160);
      ogType = 'product';
      ogImage = toAbsoluteUrl(found.images[0] || DEFAULT_IMAGE_PATH, cleanOrigin);

      const schemaAvailability =
        found.stockCount <= 0 || found.availability === 'out-of-stock'
          ? 'https://schema.org/OutOfStock'
          : found.availability === 'low-stock'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/InStock';

      const productSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: found.name,
        description: found.description || found.shortDescription,
        sku: found.sku,
        image: found.images.map((img) => toAbsoluteUrl(img, cleanOrigin)),
        brand: {
          '@type': 'Brand',
          name: found.brand,
        },
        category: found.categoryLabel,
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'USD',
          price: found.price.toFixed(2),
          availability: schemaAvailability,
          itemCondition: 'https://schema.org/NewCondition',
        },
      };

      const verifiedReviews = (found.reviews || []).filter((r) => r.verified === true);
      if (found.reviewCount > 0 && found.rating > 0) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: found.rating.toFixed(1),
          reviewCount: found.reviewCount,
          bestRating: 5,
          worstRating: 1,
        };
      }
      if (verifiedReviews.length > 0) {
        productSchema.review = verifiedReviews.slice(0, 5).map((rev) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: rev.author },
          datePublished: rev.date,
          name: rev.title,
          reviewBody: rev.comment,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: rev.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }));
      }

      jsonLd.push(productSchema);
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${cleanOrigin}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: found.categoryLabel,
            item: `${cleanOrigin}/category/${found.category}`,
          },
          { '@type': 'ListItem', position: 3, name: found.name, item: canonicalUrl },
        ],
      });
    } else if (products.length > 0) {
      title = 'Product Not Found — KINTO STUDIO';
      description = 'The requested product could not be located in the current Kinto Studio catalog.';
      robots = 'noindex, follow';
    }
  } else if (route.name === 'category') {
    const foundCat = categories.find(
      (c) => c.slug === route.category || c.descendantSlugs.includes(route.category || '')
    );
    if (foundCat) {
      title = foundCat.seoTitle || `${foundCat.name} — KINTO STUDIO`;
      description = foundCat.seoDescription || foundCat.description;
      if (foundCat.image) {
        ogImage = toAbsoluteUrl(foundCat.image, cleanOrigin);
      }
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: foundCat.name,
        description,
        url: canonicalUrl,
      });
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${cleanOrigin}/` },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${cleanOrigin}/shop` },
          { '@type': 'ListItem', position: 3, name: foundCat.name, item: canonicalUrl },
        ],
      });
    } else {
      title = 'Department — KINTO STUDIO';
    }
  } else if (route.name === 'shop') {
    if (route.collection === 'offers') {
      title = 'Special Offers & Seasonal Discounts — KINTO STUDIO';
      description = 'Explore markdowns, studio editions, and promotional pricing across all 10 Kinto Studio departments.';
    } else if (route.collection === 'new-arrivals') {
      title = 'New Arrivals — KINTO STUDIO';
    } else if (route.collection === 'best-sellers') {
      title = 'Best Sellers — KINTO STUDIO';
    } else if (route.collection === 'trending') {
      title = 'Trending Now — KINTO STUDIO';
    } else {
      title = 'Shop All Departments — KINTO STUDIO';
    }
  } else if (route.name === 'offers') {
    title = 'Special Offers — KINTO STUDIO';
    description = 'Shop curated markdowns and promotional editions with BDT and USD pricing across Bangladesh.';
  } else if (route.name === 'brands') {
    title = 'Partner Makers & Studios — KINTO STUDIO';
    description = 'Discover the independent acoustic engineers, mills, roasters, and makers behind Kinto Studio.';
  } else if (route.name === 'journal') {
    title = 'The Studio Journal — KINTO STUDIO';
    ogType = 'article';
    description = 'Essays and field notes on design longevity, acoustic craftsmanship, botanical formulation, and daily rituals.';
  } else if (route.name === 'faq') {
    title = 'Frequently Asked Questions — KINTO STUDIO';
    description = 'Answers on Bangladesh courier zones, BDT settlement, bKash/Nagad/SSLCommerz payments, and 30-day returns.';
    if (faqItems.length > 0) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      });
    }
  } else if (route.name === 'about') {
    title = 'About Kinto Studio — Multi-Department Marketplace';
  } else if (route.name === 'contact') {
    title = 'Contact & Customer Care — KINTO STUDIO';
  } else if (route.name === 'legal') {
    title = 'Legal Center & Marketplace Policies — KINTO STUDIO';
  } else if (route.name === 'search') {
    title = route.query ? `Search: ${route.query} — KINTO STUDIO` : 'Search Catalog — KINTO STUDIO';
  } else if (route.name === 'not-found') {
    title = 'Page Not Found — KINTO STUDIO';
  } else if (route.name !== 'home') {
    const formatted = route.name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    title = `${formatted} — KINTO STUDIO`;
  }

  return {
    title,
    description,
    canonicalUrl,
    robots,
    ogType,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonicalUrl,
    ogImage,
    jsonLd,
  };
}

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applyDocumentSeo(meta: SeoMetadata): void {
  if (typeof document === 'undefined') return;

  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);

  upsertMetaTag('property', 'og:type', meta.ogType);
  upsertMetaTag('property', 'og:site_name', 'KINTO STUDIO');
  upsertMetaTag('property', 'og:title', meta.ogTitle);
  upsertMetaTag('property', 'og:description', meta.ogDescription);
  upsertMetaTag('property', 'og:url', meta.ogUrl);
  upsertMetaTag('property', 'og:image', meta.ogImage);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', meta.ogTitle);
  upsertMetaTag('name', 'twitter:description', meta.ogDescription);
  upsertMetaTag('name', 'twitter:image', meta.ogImage);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', meta.canonicalUrl);

  let scriptEl = document.getElementById('kinto-seo-jsonld') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'kinto-seo-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(meta.jsonLd.length === 1 ? meta.jsonLd[0] : meta.jsonLd);
}
