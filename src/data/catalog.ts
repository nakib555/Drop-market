import {
  Address,
  BrandStudio,
  CategoryMeta,
  CategoryNode,
  JournalArticle,
  PaymentMethodRecord,
  SubcategoryMeta,
} from '../types/commerce';
import {
  BANGLADESH_GEO_TREE,
  INITIAL_CATEGORY_TREE,
  PROMO_CODES,
  getDescendantCategorySlugs,
} from '../../server/shared/marketplaceSchema';
import { resolveImagePreset } from '../utils/imagePresets';

import heroArchitecturalLivingImg from '../assets/images/hero_architectural_living_1794631819598.jpg';
import editorialAtelierCraftImg from '../assets/images/editorial_atelier_craft_1794631820102.jpg';
import productCoffeePouroverImg from '../assets/images/product_coffee_pourover_1794633336545.jpg';

export { BANGLADESH_GEO_TREE, INITIAL_CATEGORY_TREE, PROMO_CODES, getDescendantCategorySlugs };

export const HERO_IMAGE = heroArchitecturalLivingImg;
export const ATELIER_CRAFT_IMAGE = editorialAtelierCraftImg;

function buildRecursiveSubcategories(nodes: CategoryNode[], parentId: string): SubcategoryMeta[] {
  return nodes
    .filter((n) => n.parentId === parentId && n.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((child) => ({
      id: child.id,
      slug: child.slug,
      name: child.name,
      parentId: child.parentId,
      depth: child.depth,
      children: buildRecursiveSubcategories(nodes, child.id),
    }));
}

export function buildCategoryMetasFromNodes(nodes: CategoryNode[]): CategoryMeta[] {
  return nodes
    .filter((n) => n.parentId === null && n.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((dept) => ({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
      shortName: dept.shortName,
      parentId: null,
      depth: 0,
      pathSlugs: dept.pathSlugs,
      description: dept.description,
      bannerTagline: dept.bannerTagline,
      iconName: dept.iconName,
      image: resolveImagePreset(dept.imagePresetKey, dept.slug),
      imagePresetKey: dept.imagePresetKey,
      countLabel: dept.countLabel,
      sortOrder: dept.sortOrder,
      isActive: dept.isActive,
      seoTitle: dept.seoTitle,
      seoDescription: dept.seoDescription,
      collectionIds: dept.collectionIds,
      subcategories: buildRecursiveSubcategories(nodes, dept.id),
      descendantSlugs: getDescendantCategorySlugs(nodes, dept.slug),
      featuredBrands: dept.featuredBrands,
      filterFacets: dept.filterFacets,
    }));
}

export const CATEGORIES: CategoryMeta[] = buildCategoryMetasFromNodes(INITIAL_CATEGORY_TREE);

export const BRAND_STUDIOS: BrandStudio[] = [
  {
    id: 'aeterna-acoustics',
    name: 'Aeterna Acoustics',
    origin: 'Copenhagen & San Francisco',
    specialty: 'Wireless Audio, Docks & Vehicle Optics',
    founded: '2019',
    summary:
      'Industrial engineers pairing CNC-anodized aluminum enclosures with custom planar transducers, Thunderbolt docks, and automotive optics.',
    categories: ['electronics-tech', 'automotive-tools-industrial'],
  },
  {
    id: 'loom-caliber',
    name: 'Loom & Caliber',
    origin: 'Kyoto & New York',
    specialty: 'Heavyweight Knitwear & Titanium Timepieces',
    founded: '2017',
    summary:
      'Garment and horology workshop weaving shuttle-loom merino wool alongside Grade-5 titanium mechanical watches.',
    categories: ['fashion-accessories'],
  },
  {
    id: 'kinto-atelier',
    name: 'Kinto Atelier',
    origin: 'Dhaka Studio & Kyoto',
    specialty: 'Furniture, Nursery, Books & Companion Ware',
    founded: '2018',
    summary:
      'In-house woodworking, glassblowing, ceramic, and textile workshop crafting furniture, stoneware, monographs, Montessori toys, and pet ware.',
    categories: [
      'home-furniture-kitchen',
      'grocery-food-household',
      'books-stationery-office',
      'baby-kids-toys-hobbies',
      'health-wellness-pets',
    ],
  },
  {
    id: 'solis-foundry',
    name: 'Solis Foundry',
    origin: 'Providence, RI',
    specialty: 'Lighting, Bronze Clocks & Brushless Tools',
    founded: '2016',
    summary:
      'Precision metalworking collective machining unlacquered brass luminaires, bronze desk clocks, dashcams, and industrial workshop tools.',
    categories: ['home-furniture-kitchen', 'books-stationery-office', 'automotive-tools-industrial'],
  },
  {
    id: 'aethel-apothecary',
    name: 'Aethel Apothecary',
    origin: 'Grasse & Seattle',
    specialty: 'Botanical Skincare & Daily Supplements',
    founded: '2020',
    summary:
      'Cold-pressed botanical skincare and third-party tested daily vegan supplements bottled in recyclable amber glass.',
    categories: ['beauty-care', 'health-wellness-pets'],
  },
  {
    id: 'nordic-trail-roast',
    name: 'Nordic Trail & Roast',
    origin: 'Oslo & Copenhagen',
    specialty: 'Technical Packs, Trail Footwear & Coffee',
    founded: '2021',
    summary:
      'Everyday carry engineers and micro-lot roasters building weatherproof bags, trail runners, titanium flasks, and single-origin roasts.',
    categories: ['sports-outdoors-travel', 'grocery-food-household'],
  },
];

export const BANGLADESH_DIVISIONS: Record<string, string[]> = {
  Dhaka: ['Dhaka Metro', 'Gazipur', 'Narayanganj', 'Savar', 'Tangail', 'Keraniganj'],
  Chattogram: ['Chattogram City', "Cox's Bazar", 'Cumilla', 'Sandwip', 'Teknaf'],
  Sylhet: ['Sylhet City', 'Moulvibazar', 'Sreemangal'],
  Rajshahi: ['Rajshahi City', 'Bogura'],
  Khulna: ['Khulna City', 'Jashore'],
  Barishal: ['Barishal City', 'Bhola', 'Monpura'],
  Rangpur: ['Rangpur City'],
  Mymensingh: ['Mymensingh City'],
};

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: 'material-honesty-across-everyday-objects',
    title: 'Material Honesty: Aluminum, Merino, Stone & Botanical Glass',
    category: 'Design & Materials',
    readTime: '5 min read',
    publishedAt: 'November 8, 2026',
    author: 'Kenji Sato, Creative Director',
    excerpt:
      'Why the same repairable design standards apply equally to over-ear headphones, brushless workshop drivers, heavyweight wool overshirts, and solid oak seating.',
    image: editorialAtelierCraftImg,
    body: [
      'Great consumer goods share one underlying philosophy: honest materials outlast seasonal trends. Whether machining an anodized aluminum headphone cup or milling a solid American walnut door, eliminating fragile coatings allows objects to age gracefully.',
      'Across all ten marketplace departments—spanning Electronics, Fashion, Home & Kitchen, Beauty, Grocery, Sports, Books, Automotive & Tools, Baby & Montessori, and Health & Pets—every partner maker publishes transparent specifications and warranty terms.',
    ],
  },
  {
    slug: 'morning-ritual-lighting-sound-and-pourover',
    title: 'The Morning Ritual: Acoustics, Botanical Care & Single-Origin Extraction',
    category: 'Daily Rituals',
    readTime: '4 min read',
    publishedAt: 'October 27, 2026',
    author: 'Miriam Vance, Product Curator',
    excerpt:
      'Pairing warm 2700K alabaster lighting with calm acoustic playback and precision washed Ethiopia pour-over brewing.',
    image: productCoffeePouroverImg,
    body: [
      'Intentional environments shape the first thirty minutes of the day. Replacing harsh overhead fixtures with low-glare alabaster light, queuing acoustic music through woven wool speakers, and hand-pouring 93°C water over freshly roasted Yirgacheffe creates tactile calm.',
    ],
  },
];

export const FAQ_ITEMS = [
  {
    category: 'Orders & Delivery in Bangladesh',
    question: 'How are delivery charges calculated across Bangladesh divisions and areas?',
    answer:
      'Shipping is computed dynamically by our rule engine based on Country -> Division -> District -> City/Upazila -> Area, parcel weight, and item size tier (small, medium, bulky, freight). Orders in Dhaka Metro typically arrive within 24–48 hours with free shipping thresholds configurable by zone.',
  },
  {
    category: 'Currency & FX Pricing',
    question: 'Why does BDT appear by default and how is checkout currency handled?',
    answer:
      'BDT (৳) is the default marketplace currency across Bangladesh, with live USD ($) switching in the header. Every order placed for a Bangladesh address settles authoritatively in BDT with an immutable FX rate, source, and timestamp stored on your receipt.',
  },
  {
    category: 'Payment Gateways',
    question: 'Which local Bangladesh and international payment methods are supported?',
    answer:
      'Checkout supports bKash, Nagad, Rocket, Visa, Mastercard, SSLCommerz, Bank Transfer, and Cash on Delivery (eligible on non-freight orders within zone caps) via server-verified payment sessions.',
  },
  {
    category: 'Electronics, Tools & Watches',
    question: 'What is covered under hardware, power tool, and mechanical watch warranties?',
    answer:
      'Aeterna Acoustics audio hardware includes 3-year coverage, Solis Foundry industrial brushless tools carry 5-year tool warranties, and Loom & Caliber Grade-5 titanium watches include a 5-year movement warranty.',
  },
  {
    category: 'Returns & Exchanges',
    question: 'How do returns and exchanges work across departments?',
    answer:
      'Eligible in-stock purchases qualify for returns within 14 days of delivery (and defective, damaged, or wrong-item claims within 48 hours of delivery) directly through your Customer Account portal, subject to hygiene and safety seal exclusions.',
  },
];

export const INITIAL_ADDRESSES: Address[] = [];

export const INITIAL_PAYMENT_METHODS: PaymentMethodRecord[] = [];
