import type {
  CategoryNode,
  CategorySlug,
  ProductSizeTier,
  PromoCode,
  ShippingZoneId,
} from '../../src/types/commerce.ts';

/**
 * Legacy category slug mapping so prior deep links continue resolving cleanly.
 */
export const LEGACY_CATEGORY_ALIASES: Record<string, CategorySlug> = {
  seating: 'home-furniture-kitchen',
  lighting: 'home-furniture-kitchen',
  'tables-storage': 'home-furniture-kitchen',
  'ceramics-glass': 'home-furniture-kitchen',
  'textiles-objects': 'home-furniture-kitchen',
  'home-living': 'home-furniture-kitchen',
  'electronics-audio': 'electronics-tech',
  'apparel-accessories': 'fashion-accessories',
  'fashion-apparel': 'fashion-accessories',
  'beauty-wellness': 'beauty-care',
  'outdoor-travel': 'sports-outdoors-travel',
  'sports-outdoor': 'sports-outdoors-travel',
  'pantry-coffee': 'grocery-food-household',
  'grocery-food': 'grocery-food-household',
  'books-office': 'books-stationery-office',
  'toys-entertainment': 'baby-kids-toys-hobbies',
};

export function normalizeCategorySlug(raw: string | null | undefined): CategorySlug | 'all' {
  if (!raw || raw === 'all') return 'all';
  return LEGACY_CATEGORY_ALIASES[raw] || (raw as CategorySlug);
}

/**
 * 10 Top-Level Departments + Deep Nested Child Categories (unlimited depth capable).
 * Shared cleanly between Express API and React client with zero binary/image imports.
 */
export const INITIAL_CATEGORY_TREE: CategoryNode[] = [
  // 1. Electronics & Technology
  {
    id: 'cat-electronics',
    slug: 'electronics-tech',
    name: 'Electronics & Technology',
    shortName: 'Electronics',
    parentId: null,
    depth: 0,
    pathSlugs: ['electronics-tech'],
    description:
      'Wireless studio audio, acoustic hi-fi speakers, aluminum workstations, smart mobile gear, and repairable hardware.',
    bannerTagline: 'Precision acoustics, computing & smart technology',
    iconName: 'Cpu',
    imagePresetKey: 'headphones',
    countLabel: 'Audio, Computing & Mobile',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Electronics & Technology — Kinto Studio',
    seoDescription: 'Shop wireless headphones, hi-fi speakers, aluminum laptop hubs, and smart devices.',
    collectionIds: ['featured', 'trending', 'tech-essentials'],
    featuredBrands: ['Aeterna Acoustics', 'Solis Foundry'],
    filterFacets: [
      { key: 'processor', label: 'Processor / Chipset', type: 'single_select', options: ['Apple M-Series Ready', 'Dual ARM DSP', '40mm Beryllium Transducer', 'Custom Class-D DSP'], filterable: true },
      { key: 'ramGb', label: 'Memory / RAM (GB)', type: 'number', unit: 'GB', min: 0, max: 64, step: 4, filterable: true },
      { key: 'storageGb', label: 'Storage Capacity', type: 'range', unit: 'GB', min: 0, max: 2048, step: 64, filterable: true },
      { key: 'screenSizeIn', label: 'Screen Size', type: 'measurement', unit: 'in', filterable: true },
      { key: 'osCompatibility', label: 'OS Support', type: 'multi_select', options: ['macOS', 'Windows', 'iOS', 'Android', 'USB-C Universal'], filterable: true },
      { key: 'warrantyYears', label: 'Warranty (Years)', type: 'number', unit: 'yrs', min: 1, max: 5, step: 1, filterable: true },
      { key: 'wirelessEnabled', label: 'Wireless / Bluetooth', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'cat-el-audio',
    slug: 'audio-sound',
    name: 'Audio & Acoustics',
    shortName: 'Audio',
    parentId: 'cat-electronics',
    depth: 1,
    pathSlugs: ['electronics-tech', 'audio-sound'],
    description: 'Studio headphones, wireless spatial speakers, and lossless DACs.',
    bannerTagline: 'Reference-grade listening hardware',
    iconName: 'Headphones',
    imagePresetKey: 'headphones',
    countLabel: 'Headphones & Speakers',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Audio & Acoustics — Electronics',
    seoDescription: 'Studio wireless headphones and room-filling speakers.',
    collectionIds: ['trending', 'tech-essentials'],
    featuredBrands: ['Aeterna Acoustics'],
    filterFacets: [],
  },
  {
    id: 'cat-el-headphones',
    slug: 'headphones',
    name: 'Studio Headphones',
    shortName: 'Headphones',
    parentId: 'cat-el-audio',
    depth: 2,
    pathSlugs: ['electronics-tech', 'audio-sound', 'headphones'],
    description: 'Over-ear ANC and planar studio headphones.',
    bannerTagline: 'Beryllium and planar acoustic drivers',
    iconName: 'Headphones',
    imagePresetKey: 'headphones',
    countLabel: 'Over-Ear & ANC',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Studio Headphones',
    seoDescription: 'Precision over-ear wireless ANC headphones.',
    collectionIds: ['trending'],
    featuredBrands: ['Aeterna Acoustics'],
    filterFacets: [],
  },
  {
    id: 'cat-el-speakers',
    slug: 'speakers',
    name: 'Hi-Fi Wireless Speakers',
    shortName: 'Speakers',
    parentId: 'cat-el-audio',
    depth: 2,
    pathSlugs: ['electronics-tech', 'audio-sound', 'speakers'],
    description: 'Room-filling AirPlay 2 and Wi-Fi multiroom speakers.',
    bannerTagline: 'Machined acoustic enclosures',
    iconName: 'Speaker',
    imagePresetKey: 'speaker',
    countLabel: 'Wi-Fi & AirPlay 2',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Hi-Fi Speakers',
    seoDescription: 'Ambient Wi-Fi and AirPlay speakers.',
    collectionIds: ['featured'],
    featuredBrands: ['Aeterna Acoustics'],
    filterFacets: [],
  },
  {
    id: 'cat-el-workstation',
    slug: 'workstation-mobility',
    name: 'Computing & Mobile Docks',
    shortName: 'Computing',
    parentId: 'cat-electronics',
    depth: 1,
    pathSlugs: ['electronics-tech', 'workstation-mobility'],
    description: 'CNC aluminum laptop docks, power hubs, and mobile workstations.',
    bannerTagline: 'Thunderbolt & GaN charging architecture',
    iconName: 'Laptop',
    imagePresetKey: 'workstation',
    countLabel: 'Laptops, Docks & Hubs',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Computing & Workstations',
    seoDescription: 'Aluminum laptop stands, docks, and mobile tech.',
    collectionIds: ['new-arrivals', 'tech-essentials'],
    featuredBrands: ['Solis Foundry'],
    filterFacets: [],
  },

  // 2. Fashion & Accessories
  {
    id: 'cat-fashion',
    slug: 'fashion-accessories',
    name: 'Fashion & Accessories',
    shortName: 'Fashion',
    parentId: null,
    depth: 0,
    pathSlugs: ['fashion-accessories'],
    description:
      'Shuttle-loomed Japanese merino outerwear, Grade-5 titanium automatic timepieces, and tailored everyday wear.',
    bannerTagline: 'Tailored silhouettes & natural fibers',
    iconName: 'Shirt',
    imagePresetKey: 'overshirt',
    countLabel: 'Apparel, Watches & Bags',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Fashion & Accessories — Kinto Studio',
    seoDescription: 'Merino outerwear, automatic titanium watches, and minimalist leather carry.',
    collectionIds: ['featured', 'best-sellers', 'wardrobe-core'],
    featuredBrands: ['Loom & Caliber', 'Nordic Trail & Roast'],
    filterFacets: [
      { key: 'gender', label: 'Department', type: 'single_select', options: ['Unisex', 'Menswear', 'Womenswear'], filterable: true },
      { key: 'fit', label: 'Fit Profile', type: 'single_select', options: ['Relaxed Architectural', 'Tailored', 'Standard Case'], filterable: true },
      { key: 'style', label: 'Style', type: 'single_select', options: ['Workwear Minimalist', 'Field Horology', 'Everyday Urban'], filterable: true },
      { key: 'materials', label: 'Materials', type: 'multi_select', options: ['Merino Wool', 'Grade-5 Titanium', 'Full-Grain Leather', 'Organic Cotton'], filterable: true },
      { key: 'machineWashable', label: 'Easy Care / Washable', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'cat-fa-outerwear',
    slug: 'outerwear',
    name: 'Outerwear & Knitwear',
    shortName: 'Outerwear',
    parentId: 'cat-fashion',
    depth: 1,
    pathSlugs: ['fashion-accessories', 'outerwear'],
    description: 'Heavyweight overshirts, boiled wool coats, and textured knits.',
    bannerTagline: 'Natural yarns woven for longevity',
    iconName: 'Shirt',
    imagePresetKey: 'overshirt',
    countLabel: 'Overshirts & Jackets',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Outerwear & Knitwear',
    seoDescription: 'Merino wool overshirts and tailored coats.',
    collectionIds: ['best-sellers', 'wardrobe-core'],
    featuredBrands: ['Loom & Caliber'],
    filterFacets: [],
  },
  {
    id: 'cat-fa-watches',
    slug: 'watches',
    name: 'Automatic Watches',
    shortName: 'Watches',
    parentId: 'cat-fashion',
    depth: 1,
    pathSlugs: ['fashion-accessories', 'watches'],
    description: 'Mechanical field watches crafted from Grade-5 titanium and sapphire crystal.',
    bannerTagline: 'Precision Swiss & Japanese movements',
    iconName: 'Watch',
    imagePresetKey: 'clock',
    countLabel: 'Titanium Horology',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Automatic Watches',
    seoDescription: 'Grade-5 titanium automatic field watches.',
    collectionIds: ['featured'],
    featuredBrands: ['Loom & Caliber'],
    filterFacets: [],
  },

  // 3. Home, Furniture & Kitchen
  {
    id: 'cat-home',
    slug: 'home-furniture-kitchen',
    name: 'Home, Furniture & Kitchen',
    shortName: 'Home & Kitchen',
    parentId: null,
    depth: 0,
    pathSlugs: ['home-furniture-kitchen'],
    description:
      'Solid hardwood lounge seating, Roman travertine tables, brass architectural lighting, stonework, and culinary kitchen essentials.',
    bannerTagline: 'Architectural furniture, lighting & kitchen craft',
    iconName: 'Sofa',
    imagePresetKey: 'chair',
    countLabel: 'Furniture, Lighting & Kitchen',
    sortOrder: 3,
    isActive: true,
    seoTitle: 'Home, Furniture & Kitchen — Kinto Studio',
    seoDescription: 'Shop oak seating, travertine tables, brass lighting, and kitchen glassware.',
    collectionIds: ['featured', 'best-sellers', 'architectural-living'],
    featuredBrands: ['Kinto Atelier', 'Solis Foundry'],
    filterFacets: [
      { key: 'room', label: 'Room / Space', type: 'single_select', options: ['Living Room', 'Dining & Kitchen', 'Bedroom', 'Study & Entry'], filterable: true },
      { key: 'finish', label: 'Surface Finish', type: 'single_select', options: ['Natural Oil', 'Honed Matte', 'Unlacquered Brass', 'Satin Lacquer'], filterable: true },
      { key: 'assemblyRequired', label: 'Assembly Required', type: 'boolean', filterable: true },
      { key: 'dimensionsCm', label: 'Primary Span (cm)', type: 'measurement', unit: 'cm', filterable: true },
      { key: 'weightKg', label: 'Weight (kg)', type: 'range', unit: 'kg', min: 1, max: 120, step: 5, filterable: true },
      { key: 'materials', label: 'Materials', type: 'multi_select', options: ['Smoked Oak', 'American Walnut', 'Roman Travertine', 'Solid Brass', 'Stoneware', 'Merino Wool'], filterable: true },
    ],
  },
  {
    id: 'cat-hm-seating',
    slug: 'seating',
    name: 'Lounge & Dining Seating',
    shortName: 'Seating',
    parentId: 'cat-home',
    depth: 1,
    pathSlugs: ['home-furniture-kitchen', 'seating'],
    description: 'Sculptural hardwood lounge chairs and steam-bent dining chairs.',
    bannerTagline: 'Mortise-and-tenon joinery',
    iconName: 'Armchair',
    imagePresetKey: 'chair',
    countLabel: 'Chairs & Sofas',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Seating — Home & Furniture',
    seoDescription: 'Oak and bouclé lounge and dining chairs.',
    collectionIds: ['featured', 'architectural-living'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },
  {
    id: 'cat-hm-tables',
    slug: 'tables-storage',
    name: 'Tables & Credenzas',
    shortName: 'Tables & Storage',
    parentId: 'cat-home',
    depth: 1,
    pathSlugs: ['home-furniture-kitchen', 'tables-storage'],
    description: 'Monolithic stone coffee tables and fluted timber credenzas.',
    bannerTagline: 'Natural travertine & solid walnut',
    iconName: 'LayoutGrid',
    imagePresetKey: 'table',
    countLabel: 'Tables & Storage',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Tables & Credenzas',
    seoDescription: 'Travertine coffee tables and walnut storage.',
    collectionIds: ['architectural-living'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },
  {
    id: 'cat-hm-lighting',
    slug: 'lighting',
    name: 'Architectural Lighting',
    shortName: 'Lighting',
    parentId: 'cat-home',
    depth: 1,
    pathSlugs: ['home-furniture-kitchen', 'lighting'],
    description: 'Unlacquered brass task lamps and opal linear pendants.',
    bannerTagline: 'Warm 2700K architectural illumination',
    iconName: 'Lamp',
    imagePresetKey: 'lamp',
    countLabel: 'Lamps & Pendants',
    sortOrder: 3,
    isActive: true,
    seoTitle: 'Architectural Lighting',
    seoDescription: 'Brass table lamps and linear pendant fixtures.',
    collectionIds: ['best-sellers'],
    featuredBrands: ['Solis Foundry'],
    filterFacets: [],
  },
  {
    id: 'cat-hm-kitchen-decor',
    slug: 'decor-textiles',
    name: 'Kitchen, Decor & Textiles',
    shortName: 'Kitchen & Decor',
    parentId: 'cat-home',
    depth: 1,
    pathSlugs: ['home-furniture-kitchen', 'decor-textiles'],
    description: 'Stoneware vessels, borosilicate kitchenware, and woven merino throws.',
    bannerTagline: 'Tactile stoneware & natural weaves',
    iconName: 'Sparkles',
    imagePresetKey: 'vessel',
    countLabel: 'Ceramics, Glass & Textiles',
    sortOrder: 4,
    isActive: true,
    seoTitle: 'Kitchen, Decor & Textiles',
    seoDescription: 'Hand-thrown stoneware and woven throws.',
    collectionIds: ['new-arrivals'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },

  // 4. Beauty & Personal Care
  {
    id: 'cat-beauty',
    slug: 'beauty-care',
    name: 'Beauty & Personal Care',
    shortName: 'Beauty & Care',
    parentId: null,
    depth: 0,
    pathSlugs: ['beauty-care'],
    description:
      'Cold-pressed botanical serums, ceramide barrier cremes, gentle cleansers, and restorative daily skin care.',
    bannerTagline: 'Clean botanical skincare & apothecary',
    iconName: 'Droplets',
    imagePresetKey: 'serum',
    countLabel: 'Skincare & Apothecary',
    sortOrder: 4,
    isActive: true,
    seoTitle: 'Beauty & Personal Care — Kinto Studio',
    seoDescription: 'Botanical facial serums, barrier cremes, and clean skincare.',
    collectionIds: ['featured', 'trending', 'apothecary-rituals'],
    featuredBrands: ['Aethel Apothecary'],
    filterFacets: [
      { key: 'skinType', label: 'Skin Type', type: 'multi_select', options: ['All Skin Types', 'Sensitive', 'Dry', 'Combination'], filterable: true },
      { key: 'volumeMl', label: 'Net Volume (ml)', type: 'measurement', unit: 'ml', filterable: true },
      { key: 'keyIngredients', label: 'Key Ingredients', type: 'multi_select', options: ['Squalane', 'Niacinamide', 'Sea Buckthorn', 'Ceramides', 'Hyaluronic Acid'], filterable: true },
      { key: 'fragranceFree', label: 'Fragrance-Free', type: 'boolean', filterable: true },
      { key: 'applicationMethod', label: 'Application Routine', type: 'text', filterable: false },
    ],
  },
  {
    id: 'cat-bt-serums',
    slug: 'serums',
    name: 'Facial Serums & Oils',
    shortName: 'Serums',
    parentId: 'cat-beauty',
    depth: 1,
    pathSlugs: ['beauty-care', 'serums'],
    description: 'Potent UV-glass botanical serums.',
    bannerTagline: 'Cold-processed botanical actives',
    iconName: 'Droplets',
    imagePresetKey: 'serum',
    countLabel: 'Serums & Elixirs',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Facial Serums',
    seoDescription: 'Cold-pressed botanical facial serums.',
    collectionIds: ['trending', 'apothecary-rituals'],
    featuredBrands: ['Aethel Apothecary'],
    filterFacets: [],
  },

  // 5. Grocery, Food & Household
  {
    id: 'cat-grocery',
    slug: 'grocery-food-household',
    name: 'Grocery, Food & Household',
    shortName: 'Grocery & Home',
    parentId: null,
    depth: 0,
    pathSlugs: ['grocery-food-household'],
    description:
      'Single-origin micro-lot coffees, artisanal pantry staples, brewing equipment, and eco-conscious household care.',
    bannerTagline: 'Specialty roasts, pantry goods & household care',
    iconName: 'Coffee',
    imagePresetKey: 'coffee',
    countLabel: 'Coffee, Pantry & Household',
    sortOrder: 5,
    isActive: true,
    seoTitle: 'Grocery, Food & Household — Kinto Studio',
    seoDescription: 'Specialty single-origin coffee, pour-over gear, and gourmet pantry staples.',
    collectionIds: ['best-sellers', 'pantry-favorites'],
    featuredBrands: ['Nordic Trail & Roast', 'Kinto Atelier'],
    filterFacets: [
      { key: 'origin', label: 'Origin / Source', type: 'single_select', options: ['Ethiopia · Yirgacheffe', 'Sylhet & Darjeeling Blend', 'Borosilicate / Europe'], filterable: true },
      { key: 'weightGrams', label: 'Net Weight (g)', type: 'measurement', unit: 'g', filterable: true },
      { key: 'dietary', label: 'Dietary Profile', type: 'multi_select', options: ['Single-Origin Organic', 'Vegan', 'Zero Additive', 'BPA-Free'], filterable: true },
      { key: 'bestBeforeDate', label: 'Freshness / Best Before', type: 'date', filterable: true },
      { key: 'organicCertified', label: 'Organic Certified', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'cat-gr-coffee',
    slug: 'specialty-coffee',
    name: 'Specialty Coffee & Tea',
    shortName: 'Coffee & Tea',
    parentId: 'cat-grocery',
    depth: 1,
    pathSlugs: ['grocery-food-household', 'specialty-coffee'],
    description: 'Washed single-origin beans and loose-leaf estate teas.',
    bannerTagline: 'Small-batch roasted weekly',
    iconName: 'Coffee',
    imagePresetKey: 'coffee',
    countLabel: 'Coffee & Tea Lots',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Specialty Coffee & Tea',
    seoDescription: 'Single-origin specialty coffee sets and pour-over brewers.',
    collectionIds: ['best-sellers', 'pantry-favorites'],
    featuredBrands: ['Nordic Trail & Roast'],
    filterFacets: [],
  },
  {
    id: 'cat-gr-tableware',
    slug: 'tableware',
    name: 'Serving & Household Glass',
    shortName: 'Tableware',
    parentId: 'cat-grocery',
    depth: 1,
    pathSlugs: ['grocery-food-household', 'tableware'],
    description: 'Hand-blown borosilicate carafes and eco-household refill containers.',
    bannerTagline: 'Heat-resistant everyday glassware',
    iconName: 'Utensils',
    imagePresetKey: 'carafe',
    countLabel: 'Carafes & Containers',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Serving & Household Glassware',
    seoDescription: 'Borosilicate carafes and daily household glassware.',
    collectionIds: ['pantry-favorites'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },

  // 6. Sports, Outdoors & Travel
  {
    id: 'cat-sports',
    slug: 'sports-outdoors-travel',
    name: 'Sports, Outdoors & Travel',
    shortName: 'Sports & Travel',
    parentId: null,
    depth: 0,
    pathSlugs: ['sports-outdoors-travel'],
    description:
      'Seam-sealed weatherproof packs, trail & road running shoes, Japanese titanium hydration flasks, and expedition travel gear.',
    bannerTagline: 'Technical packs, footwear & trail performance',
    iconName: 'Compass',
    imagePresetKey: 'daypack',
    countLabel: 'Packs, Footwear & Trail Gear',
    sortOrder: 6,
    isActive: true,
    seoTitle: 'Sports, Outdoors & Travel — Kinto Studio',
    seoDescription: 'Weatherproof backpacks, trail sneakers, and insulated titanium flasks.',
    collectionIds: ['trending', 'new-arrivals', 'expedition-kit'],
    featuredBrands: ['Nordic Trail & Roast', 'Loom & Caliber'],
    filterFacets: [
      { key: 'activity', label: 'Intended Activity', type: 'multi_select', options: ['Alpine Hiking', 'Daily Commute', 'Road & Trail Running', 'Multi-Day Travel'], filterable: true },
      { key: 'equipmentType', label: 'Equipment Type', type: 'single_select', options: ['Weatherproof Daypack', 'Trail Running Footwear', 'Insulated Hydration'], filterable: true },
      { key: 'waterproof', label: 'Waterproof / Seam-Sealed', type: 'boolean', filterable: true },
      { key: 'capacityLiters', label: 'Volume Capacity (L)', type: 'measurement', unit: 'L', filterable: true },
    ],
  },
  {
    id: 'cat-sp-packs',
    slug: 'packs',
    name: 'Backpacks & Travel Carry',
    shortName: 'Packs & Travel',
    parentId: 'cat-sports',
    depth: 1,
    pathSlugs: ['sports-outdoors-travel', 'packs'],
    description: 'Ballistic Cordura commuter and alpine daypacks.',
    bannerTagline: 'Built for wet transit & trail ascents',
    iconName: 'Backpack',
    imagePresetKey: 'daypack',
    countLabel: 'Daypacks & Carry',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Backpacks & Travel Carry',
    seoDescription: 'Weatherproof 22L Cordura daypacks and flasks.',
    collectionIds: ['new-arrivals', 'expedition-kit'],
    featuredBrands: ['Nordic Trail & Roast'],
    filterFacets: [],
  },
  {
    id: 'cat-sp-footwear',
    slug: 'footwear',
    name: 'Running & Trail Footwear',
    shortName: 'Footwear',
    parentId: 'cat-sports',
    depth: 1,
    pathSlugs: ['sports-outdoors-travel', 'footwear'],
    description: 'Engineered knit trail and urban running shoes.',
    bannerTagline: 'Nitrogen-infused midsole propulsion',
    iconName: 'Footprints',
    imagePresetKey: 'sneakers',
    countLabel: 'Trail & Road Shoes',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Running & Trail Footwear',
    seoDescription: 'Breathable knit running sneakers.',
    collectionIds: ['trending'],
    featuredBrands: ['Nordic Trail & Roast'],
    filterFacets: [],
  },

  // 7. Books, Stationery & Office
  {
    id: 'cat-books',
    slug: 'books-stationery-office',
    name: 'Books, Stationery & Office',
    shortName: 'Books & Office',
    parentId: null,
    depth: 0,
    pathSlugs: ['books-stationery-office'],
    description:
      'Hardcover architecture monographs, precision milled bronze desk timepieces, fountain stationery, and focused workspace essentials.',
    bannerTagline: 'Design monographs, desk instruments & stationery',
    iconName: 'BookOpen',
    imagePresetKey: 'books',
    countLabel: 'Books, Desk Clocks & Pens',
    sortOrder: 7,
    isActive: true,
    seoTitle: 'Books, Stationery & Office — Kinto Studio',
    seoDescription: 'Architectural monographs, milled bronze desk clocks, and fine stationery.',
    collectionIds: ['featured', 'studio-library'],
    featuredBrands: ['Solis Foundry', 'Kinto Atelier'],
    filterFacets: [
      { key: 'format', label: 'Edition / Format', type: 'single_select', options: ['Linen Hardcover Set', 'CNC Solid Metal', 'Archival Paper'], filterable: true },
      { key: 'pageCount', label: 'Pages / Spec Count', type: 'number', unit: 'pages', min: 0, max: 1000, step: 50, filterable: true },
      { key: 'archivalPaper', label: 'Archival / Acid-Free', type: 'boolean', filterable: true },
      { key: 'publishDate', label: 'Edition Release Date', type: 'date', filterable: true },
    ],
  },
  {
    id: 'cat-bk-monographs',
    slug: 'monographs',
    name: 'Books & Design Monographs',
    shortName: 'Monographs',
    parentId: 'cat-books',
    depth: 1,
    pathSlugs: ['books-stationery-office', 'monographs'],
    description: 'Smyth-sewn linen hardcover architectural and design editions.',
    bannerTagline: 'Heavyweight uncoated archival stock',
    iconName: 'BookOpen',
    imagePresetKey: 'books',
    countLabel: 'Hardcover Books',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Design Monographs & Books',
    seoDescription: 'Collectible hardcover architecture books.',
    collectionIds: ['studio-library'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },
  {
    id: 'cat-bk-clocks',
    slug: 'desk-clocks',
    name: 'Desk Instruments & Clocks',
    shortName: 'Desk Clocks',
    parentId: 'cat-books',
    depth: 1,
    pathSlugs: ['books-stationery-office', 'desk-clocks'],
    description: 'Silent sweep bronze clocks and solid metal workspace tools.',
    bannerTagline: 'Tactile desk engineering',
    iconName: 'Clock',
    imagePresetKey: 'clock',
    countLabel: 'Timepieces & Workspace',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Desk Instruments & Clocks',
    seoDescription: 'Milled solid bronze desk clocks.',
    collectionIds: ['featured'],
    featuredBrands: ['Solis Foundry'],
    filterFacets: [],
  },

  // 8. Automotive, Tools & Industrial
  {
    id: 'cat-auto',
    slug: 'automotive-tools-industrial',
    name: 'Automotive, Tools & Industrial',
    shortName: 'Auto & Tools',
    parentId: null,
    depth: 0,
    pathSlugs: ['automotive-tools-industrial'],
    description:
      '4K Sony STARVIS dashcams, brushless cordless workshop drivers, precision titanium hex tool kits, and garage hardware.',
    bannerTagline: 'Vehicle electronics, precision tools & industrial gear',
    iconName: 'Wrench',
    imagePresetKey: 'tools',
    countLabel: 'Automotive & Workshop Tools',
    sortOrder: 8,
    isActive: true,
    seoTitle: 'Automotive, Tools & Industrial — Kinto Studio',
    seoDescription: '4K vehicle dashcams, brushless cordless drills, and machined bit sets.',
    collectionIds: ['new-arrivals', 'workshop-pro'],
    featuredBrands: ['Solis Foundry', 'Aeterna Acoustics'],
    filterFacets: [
      { key: 'voltageV', label: 'Operating Voltage (V)', type: 'number', unit: 'V', min: 5, max: 36, step: 1, filterable: true },
      { key: 'toolGrade', label: 'Grade / Duty', type: 'single_select', options: ['Industrial Brushless', 'Automotive OEM', 'Workshop Precision'], filterable: true },
      { key: 'batteryIncluded', label: 'Battery / Hardwire Included', type: 'boolean', filterable: true },
      { key: 'certifications', label: 'Safety & Ratings', type: 'multi_select', options: ['IP54 Dust-Sealed', 'Supercapacitor Thermal', 'S2 Tool Steel', 'UL Listed'], filterable: true },
    ],
  },
  {
    id: 'cat-au-dashcams',
    slug: 'vehicle-electronics',
    name: 'Automotive Electronics',
    shortName: 'Car Tech',
    parentId: 'cat-auto',
    depth: 1,
    pathSlugs: ['automotive-tools-industrial', 'vehicle-electronics'],
    description: 'Dual-channel 4K dashcams and OBD diagnostic telemetry kits.',
    bannerTagline: 'All-weather cabin & road recording',
    iconName: 'Car',
    imagePresetKey: 'dashcam',
    countLabel: 'Dashcams & Telemetry',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Automotive Electronics',
    seoDescription: '4K dashcam kits for vehicles.',
    collectionIds: ['new-arrivals'],
    featuredBrands: ['Aeterna Acoustics'],
    filterFacets: [],
  },
  {
    id: 'cat-au-tools',
    slug: 'power-hand-tools',
    name: 'Power & Precision Hand Tools',
    shortName: 'Power Tools',
    parentId: 'cat-auto',
    depth: 1,
    pathSlugs: ['automotive-tools-industrial', 'power-hand-tools'],
    description: 'Brushless torque drivers, CNC bit organizers, and industrial fasteners.',
    bannerTagline: 'Machined S2 steel & brushless torque',
    iconName: 'Wrench',
    imagePresetKey: 'tools',
    countLabel: 'Drills & Tool Kits',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Power & Hand Tools',
    seoDescription: 'Brushless drivers and machined hex tool sets.',
    collectionIds: ['workshop-pro'],
    featuredBrands: ['Solis Foundry'],
    filterFacets: [],
  },

  // 9. Baby, Kids, Toys & Hobbies
  {
    id: 'cat-baby',
    slug: 'baby-kids-toys-hobbies',
    name: 'Baby, Kids, Toys & Hobbies',
    shortName: 'Baby & Toys',
    parentId: null,
    depth: 0,
    pathSlugs: ['baby-kids-toys-hobbies'],
    description:
      'Organic GOTS-certified muslin nursery essentials, Montessori European beechwood blocks, acoustic children instruments, and heirloom hobbies.',
    bannerTagline: 'Safe organic nursery & Montessori craftsmanship',
    iconName: 'Blocks',
    imagePresetKey: 'nursery',
    countLabel: 'Nursery, Montessori & Hobbies',
    sortOrder: 9,
    isActive: true,
    seoTitle: 'Baby, Kids, Toys & Hobbies — Kinto Studio',
    seoDescription: 'Organic muslin swaddles, wooden Montessori blocks, and tuned wooden instruments.',
    collectionIds: ['new-arrivals', 'family-heirlooms'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [
      { key: 'ageBracket', label: 'Age Bracket', type: 'single_select', options: ['0–24 Months', '2–5 Years', '6+ Years / All Ages'], filterable: true },
      { key: 'safetyStandard', label: 'Safety Certification', type: 'multi_select', options: ['EN-71 Non-Toxic', 'GOTS Organic Cotton', 'Zero-VOC Beeswax', 'FSC European Beech'], filterable: true },
      { key: 'nonToxicFinish', label: 'Zero-VOC Non-Toxic Finish', type: 'boolean', filterable: true },
    ],
  },
  {
    id: 'cat-bb-nursery',
    slug: 'baby-nursery',
    name: 'Baby & Organic Nursery',
    shortName: 'Baby Nursery',
    parentId: 'cat-baby',
    depth: 1,
    pathSlugs: ['baby-kids-toys-hobbies', 'baby-nursery'],
    description: 'GOTS organic muslin blankets and solid beechwood Montessori sets.',
    bannerTagline: 'Gentle organic textiles & rounded timber',
    iconName: 'Baby',
    imagePresetKey: 'nursery',
    countLabel: 'Swaddles & Nursery',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Baby & Organic Nursery',
    seoDescription: 'Organic baby blankets and Montessori wooden toys.',
    collectionIds: ['family-heirlooms'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },
  {
    id: 'cat-bb-toys',
    slug: 'wooden-toys-hobbies',
    name: 'Wooden Toys & Acoustic Hobbies',
    shortName: 'Toys & Hobbies',
    parentId: 'cat-baby',
    depth: 1,
    pathSlugs: ['baby-kids-toys-hobbies', 'wooden-toys-hobbies'],
    description: 'Tuned beechwood pentatonic instruments and creative heirloom sets.',
    bannerTagline: 'Screen-free tactile play',
    iconName: 'Music',
    imagePresetKey: 'instrument',
    countLabel: 'Instruments & Creative Kits',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Wooden Toys & Hobbies',
    seoDescription: 'Beechwood acoustic instruments and creative gifts.',
    collectionIds: ['new-arrivals', 'family-heirlooms'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },

  // 10. Health, Wellness & Pets
  {
    id: 'cat-health',
    slug: 'health-wellness-pets',
    name: 'Health, Wellness & Pets',
    shortName: 'Health & Pets',
    parentId: null,
    depth: 0,
    pathSlugs: ['health-wellness-pets'],
    description:
      'Clean-label daily nutritional supplements, adaptogenic wellness formulas, stoneware pet feeding bowls, and vegetable-tanned pet accessories.',
    bannerTagline: 'Daily vitality & considered companion care',
    iconName: 'HeartPulse',
    imagePresetKey: 'healthpets',
    countLabel: 'Supplements & Pet Care',
    sortOrder: 10,
    isActive: true,
    seoTitle: 'Health, Wellness & Pets — Kinto Studio',
    seoDescription: 'Daily wellness supplements, stoneware pet bowls, and leather pet collars.',
    collectionIds: ['featured', 'new-arrivals', 'daily-wellness'],
    featuredBrands: ['Aethel Apothecary', 'Kinto Atelier'],
    filterFacets: [
      { key: 'careTarget', label: 'Care Focus', type: 'single_select', options: ['Human Daily Wellness', 'Pet Nutrition & Care', 'Dual Wellness Bundle'], filterable: true },
      { key: 'dosageForm', label: 'Format', type: 'single_select', options: ['Vegan Capsules', 'Ceramic + Leather Set'], filterable: true },
      { key: 'thirdPartyTested', label: 'Lab / Vet Tested', type: 'boolean', filterable: true },
      { key: 'expiryDate', label: 'Batch Expiry Date', type: 'date', filterable: true },
    ],
  },
  {
    id: 'cat-hl-supplements',
    slug: 'daily-supplements',
    name: 'Vitamins & Daily Wellness',
    shortName: 'Wellness',
    parentId: 'cat-health',
    depth: 1,
    pathSlugs: ['health-wellness-pets', 'daily-supplements'],
    description: 'Third-party tested daily vegan capsules and adaptogens.',
    bannerTagline: 'Glass-bottled daily balance',
    iconName: 'HeartPulse',
    imagePresetKey: 'healthpets',
    countLabel: 'Daily Supplements',
    sortOrder: 1,
    isActive: true,
    seoTitle: 'Vitamins & Daily Wellness',
    seoDescription: 'Amber glass daily vegan supplements.',
    collectionIds: ['daily-wellness'],
    featuredBrands: ['Aethel Apothecary'],
    filterFacets: [],
  },
  {
    id: 'cat-hl-pets',
    slug: 'pet-care-accessories',
    name: 'Pet Bowls & Leather Gear',
    shortName: 'Pet Care',
    parentId: 'cat-health',
    depth: 1,
    pathSlugs: ['health-wellness-pets', 'pet-care-accessories'],
    description: 'Heavy stoneware feeding bowls and solid-brass vegetable-tanned collars.',
    bannerTagline: 'Built for lifelong companions',
    iconName: 'PawPrint',
    imagePresetKey: 'healthpets',
    countLabel: 'Feeding & Walk Gear',
    sortOrder: 2,
    isActive: true,
    seoTitle: 'Pet Care & Accessories',
    seoDescription: 'Ceramic pet bowls and brass-buckled leather collars.',
    collectionIds: ['new-arrivals', 'daily-wellness'],
    featuredBrands: ['Kinto Atelier'],
    filterFacets: [],
  },
];

/**
 * Resolve a category slug + all descendant nested slugs from any tree node array.
 */
export function getDescendantCategorySlugs(
  nodes: CategoryNode[],
  targetSlug: string
): string[] {
  const target = nodes.find((n) => n.slug === targetSlug);
  if (!target) return [targetSlug];

  const collected = new Set<string>([target.slug]);
  let added = true;
  const collectedIds = new Set<string>([target.id]);

  while (added) {
    added = false;
    for (const node of nodes) {
      if (node.parentId && collectedIds.has(node.parentId) && !collectedIds.has(node.id)) {
        collectedIds.add(node.id);
        collected.add(node.slug);
        added = true;
      }
    }
  }
  return Array.from(collected);
}

/**
 * Full 5-Level Hierarchical Bangladesh Address Tree:
 * Country (Bangladesh) -> Division -> District -> City/Upazila -> Area[]
 */
export interface BangladeshAreaEntry {
  name: string;
  postalCode: string;
  zoneId: ShippingZoneId;
  restricted?: boolean;
  restrictionNote?: string;
}

export interface BangladeshUpazilaEntry {
  name: string;
  areas: BangladeshAreaEntry[];
}

export interface BangladeshDistrictEntry {
  name: string;
  upazilas: BangladeshUpazilaEntry[];
}

export interface BangladeshDivisionEntry {
  name: string;
  districts: BangladeshDistrictEntry[];
}

export const BANGLADESH_GEO_TREE: BangladeshDivisionEntry[] = [
  {
    name: 'Dhaka',
    districts: [
      {
        name: 'Dhaka',
        upazilas: [
          {
            name: 'Dhaka North City Corporation',
            areas: [
              { name: 'Banani', postalCode: '1213', zoneId: 'dhaka_metro' },
              { name: 'Gulshan 1 & 2', postalCode: '1212', zoneId: 'dhaka_metro' },
              { name: 'Baridhara Diplomatic Zone', postalCode: '1212', zoneId: 'dhaka_metro' },
              { name: 'Uttara Sector 1–14', postalCode: '1230', zoneId: 'dhaka_metro' },
              { name: 'Mirpur DOHS & Pallabi', postalCode: '1216', zoneId: 'dhaka_metro' },
              { name: 'Bashundhara R/A', postalCode: '1229', zoneId: 'dhaka_metro' },
            ],
          },
          {
            name: 'Dhaka South City Corporation',
            areas: [
              { name: 'Dhanmondi', postalCode: '1205', zoneId: 'dhaka_metro' },
              { name: 'Motijheel Commercial Area', postalCode: '1000', zoneId: 'dhaka_metro' },
              { name: 'Lalmatia & Mohammadpur', postalCode: '1207', zoneId: 'dhaka_metro' },
              { name: 'Wari & Old Dhaka', postalCode: '1203', zoneId: 'dhaka_metro' },
            ],
          },
          {
            name: 'Savar Upazila',
            areas: [
              { name: 'Savar Bazar & Ashulia', postalCode: '1340', zoneId: 'dhaka_suburbs' },
              { name: 'DEPZ & Hemayetpur', postalCode: '1349', zoneId: 'dhaka_suburbs' },
            ],
          },
          {
            name: 'Keraniganj Upazila',
            areas: [
              { name: 'Jinjira & Hasnabad', postalCode: '1310', zoneId: 'dhaka_suburbs' },
            ],
          },
        ],
      },
      {
        name: 'Gazipur',
        upazilas: [
          {
            name: 'Gazipur Sadar / City',
            areas: [
              { name: 'Joydebpur & Chowrasta', postalCode: '1700', zoneId: 'dhaka_suburbs' },
              { name: 'Tongi Station Road', postalCode: '1710', zoneId: 'dhaka_suburbs' },
            ],
          },
        ],
      },
      {
        name: 'Narayanganj',
        upazilas: [
          {
            name: 'Narayanganj Sadar',
            areas: [
              { name: 'Chashara & Fatullah', postalCode: '1400', zoneId: 'dhaka_suburbs' },
            ],
          },
        ],
      },
      {
        name: 'Tangail',
        upazilas: [
          {
            name: 'Tangail Sadar',
            areas: [
              { name: 'Tangail Town Center', postalCode: '1900', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Chattogram',
    districts: [
      {
        name: 'Chattogram',
        upazilas: [
          {
            name: 'Chattogram City Corporation',
            areas: [
              { name: 'GEC Circle & Nasirabad', postalCode: '4000', zoneId: 'chattogram_sylhet_metro' },
              { name: 'Agrabad Commercial', postalCode: '4100', zoneId: 'chattogram_sylhet_metro' },
              { name: 'Halishahar & Khulshi', postalCode: '4225', zoneId: 'chattogram_sylhet_metro' },
            ],
          },
          {
            name: 'Sandwip Upazila',
            areas: [
              {
                name: 'Sandwip Offshore Island',
                postalCode: '4300',
                zoneId: 'remote_restricted',
                restricted: true,
                restrictionNote: 'Offshore maritime ferry zone — currently restricted for parcel & bulky dispatch.',
              },
            ],
          },
        ],
      },
      {
        name: "Cox's Bazar",
        upazilas: [
          {
            name: "Cox's Bazar Sadar",
            areas: [
              { name: 'Kolatoli & Laboni Beach Zone', postalCode: '4700', zoneId: 'nationwide_district' },
            ],
          },
          {
            name: 'Teknaf Upazila',
            areas: [
              {
                name: 'Saint Martin Island',
                postalCode: '4762',
                zoneId: 'remote_restricted',
                restricted: true,
                restrictionNote: 'Bay island marine route — direct courier service restricted.',
              },
              { name: 'Teknaf Town', postalCode: '4760', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
      {
        name: 'Cumilla',
        upazilas: [
          {
            name: 'Cumilla Adarsha Sadar',
            areas: [
              { name: 'Kandirpar & Racecourse', postalCode: '3500', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sylhet',
    districts: [
      {
        name: 'Sylhet',
        upazilas: [
          {
            name: 'Sylhet City Corporation',
            areas: [
              { name: 'Zindabazar & Amberkhana', postalCode: '3100', zoneId: 'chattogram_sylhet_metro' },
              { name: 'Shahjalal Upashahar', postalCode: '3100', zoneId: 'chattogram_sylhet_metro' },
            ],
          },
        ],
      },
      {
        name: 'Moulvibazar',
        upazilas: [
          {
            name: 'Sreemangal Upazila',
            areas: [
              { name: 'Sreemangal Town & Tea Estate Hub', postalCode: '3210', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Rajshahi',
    districts: [
      {
        name: 'Rajshahi',
        upazilas: [
          {
            name: 'Rajshahi City Corporation',
            areas: [
              { name: 'Shaheb Bazar & Padma Residential', postalCode: '6100', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
      {
        name: 'Bogura',
        upazilas: [
          {
            name: 'Bogura Sadar',
            areas: [
              { name: 'Satmatha Town Center', postalCode: '5800', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Khulna',
    districts: [
      {
        name: 'Khulna',
        upazilas: [
          {
            name: 'Khulna City Corporation',
            areas: [
              { name: 'Shib Bari & Sonadanga', postalCode: '9100', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
      {
        name: 'Jashore',
        upazilas: [
          {
            name: 'Jashore Sadar',
            areas: [
              { name: 'Chachra & Rail Road', postalCode: '7400', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Barishal',
    districts: [
      {
        name: 'Barishal',
        upazilas: [
          {
            name: 'Barishal City Corporation',
            areas: [
              { name: 'Sadar Road & Nathullabad', postalCode: '8200', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
      {
        name: 'Bhola',
        upazilas: [
          {
            name: 'Monpura Upazila',
            areas: [
              {
                name: 'Monpura River Char',
                postalCode: '8340',
                zoneId: 'remote_restricted',
                restricted: true,
                restrictionNote: 'Isolated river char — courier delivery suspended.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Rangpur',
    districts: [
      {
        name: 'Rangpur',
        upazilas: [
          {
            name: 'Rangpur City Corporation',
            areas: [
              { name: 'Jahaj Company More & Dhap', postalCode: '5400', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Mymensingh',
    districts: [
      {
        name: 'Mymensingh',
        upazilas: [
          {
            name: 'Mymensingh City Corporation',
            areas: [
              { name: 'Ganginar Par & Charpara', postalCode: '2200', zoneId: 'nationwide_district' },
            ],
          },
        ],
      },
    ],
  },
];

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'STUDIO15',
    description: '15% privilege savings on qualifying orders ($300+ base / ৳36,150+)',
    discountType: 'percent',
    value: 15,
    minSubtotal: 300,
  },
  {
    code: 'WELCOME10',
    description: '10% welcome privilege on any order',
    discountType: 'percent',
    value: 10,
    minSubtotal: 0,
  },
  {
    code: 'FREESHIP',
    description: 'Complimentary standard shipping on eligible addresses',
    discountType: 'shipping',
    value: 100,
    minSubtotal: 0,
  },
];

export interface AuthoritativeCatalogSku {
  id: string;
  sku: string;
  name: string;
  priceUsd: number;
  stockCount: number;
  weightKg: number;
  sizeTier: ProductSizeTier;
  codEligible: boolean;
}

/**
 * Authoritative server-side catalog pricing, physical dimensions, weight & COD flags.
 * Client never sets product prices or weight tiers on checkout/payment APIs.
 */
export const AUTHORITATIVE_CATALOG_SKUS: AuthoritativeCatalogSku[] = [
  { id: 'prod-aeterna-headphones', sku: 'KS-ELC-001', name: 'Aeterna AE-1 Studio Wireless Headphones', priceUsd: 420, stockCount: 18, weightKg: 0.65, sizeTier: 'small', codEligible: true },
  { id: 'prod-zonolith-speaker', sku: 'KS-ELC-002', name: 'Zonolith Compact Acoustic Hi-Fi Speaker', priceUsd: 540, stockCount: 9, weightKg: 4.2, sizeTier: 'medium', codEligible: true },
  { id: 'prod-kinto-desk-dock', sku: 'KS-ELC-004', name: 'Aeterna Dual-Device Aluminum Desk Dock', priceUsd: 240, stockCount: 16, weightKg: 1.8, sizeTier: 'small', codEligible: true },
  { id: 'prod-merino-overshirt', sku: 'KS-APP-001', name: 'Kyoto Heavyweight Merino Overshirt', priceUsd: 265, stockCount: 24, weightKg: 0.75, sizeTier: 'small', codEligible: true },
  { id: 'prod-caliber-watch', sku: 'KS-APP-002', name: 'Caliber 38mm Titanium Field Automatic', priceUsd: 780, stockCount: 6, weightKg: 0.35, sizeTier: 'small', codEligible: true },
  { id: 'prod-kuro-lounge', sku: 'KS-LIV-001', name: 'Kuro Smoked Oak Lounge Chair', priceUsd: 1280, stockCount: 11, weightKg: 19.5, sizeTier: 'freight', codEligible: false },
  { id: 'prod-solis-lamp', sku: 'KS-LIV-002', name: 'Solis Alabaster & Brass Table Lamp', priceUsd: 460, stockCount: 14, weightKg: 3.1, sizeTier: 'medium', codEligible: true },
  { id: 'prod-monolith-table', sku: 'KS-LIV-003', name: 'Pietra Honed Travertine Coffee Table', priceUsd: 1850, stockCount: 5, weightKg: 74.0, sizeTier: 'freight', codEligible: false },
  { id: 'prod-tama-vessels', sku: 'KS-LIV-004', name: 'Tama Wheel-Thrown Stoneware Duo', priceUsd: 145, stockCount: 32, weightKg: 2.2, sizeTier: 'medium', codEligible: true },
  { id: 'prod-vesper-pendant', sku: 'KS-LIV-005', name: 'Vesper Opal Glass Linear Pendant', priceUsd: 690, stockCount: 7, weightKg: 4.8, sizeTier: 'bulky', codEligible: true },
  { id: 'prod-sora-credenza', sku: 'KS-LIV-006', name: 'Sora Fluted American Walnut Credenza', priceUsd: 2680, stockCount: 4, weightKg: 62.0, sizeTier: 'freight', codEligible: false },
  { id: 'prod-asha-dining-chair', sku: 'KS-LIV-007', name: 'Asha Steam-Bent Ash Dining Chair', priceUsd: 520, stockCount: 20, weightKg: 5.4, sizeTier: 'bulky', codEligible: true },
  { id: 'prod-botanical-serum', sku: 'KS-BTY-001', name: 'Aethel Botanical Facial Serum & Creme', priceUsd: 148, stockCount: 31, weightKg: 0.4, sizeTier: 'small', codEligible: true },
  { id: 'prod-coffee-pourover', sku: 'KS-PNT-001', name: 'Yirgacheffe Pour-Over Brew Set & Roast', priceUsd: 195, stockCount: 22, weightKg: 1.6, sizeTier: 'medium', codEligible: true },
  { id: 'prod-kiri-carafe', sku: 'KS-PNT-002', name: 'Kiri Mouth-Blown Carafe & Tumbler Set', priceUsd: 120, stockCount: 25, weightKg: 1.3, sizeTier: 'medium', codEligible: true },
  { id: 'prod-outdoor-daypack', sku: 'KS-OUT-001', name: 'Vanguard 22L Weatherproof Daypack & Flask', priceUsd: 295, stockCount: 15, weightKg: 1.4, sizeTier: 'medium', codEligible: true },
  { id: 'prod-strata-runner', sku: 'KS-OUT-002', name: 'Strata Merino-Knit Trail & Road Runner', priceUsd: 210, stockCount: 19, weightKg: 0.9, sizeTier: 'small', codEligible: true },
  { id: 'prod-form-timber-monograph', sku: 'KS-OFF-002', name: 'Form & Timber: Complete Monograph Anthology', priceUsd: 95, stockCount: 27, weightKg: 2.4, sizeTier: 'medium', codEligible: true },
  { id: 'prod-chronos-clock', sku: 'KS-ELC-003', name: 'Meridian CNC Bronze Desk Clock', priceUsd: 340, stockCount: 9, weightKg: 1.1, sizeTier: 'small', codEligible: true },
  { id: 'prod-optic-dashcam', sku: 'KS-ELC-005', name: 'Optic-4K Milled Aluminum Dashcam Kit', priceUsd: 315, stockCount: 12, weightKg: 0.85, sizeTier: 'small', codEligible: true },
  { id: 'prod-industrial-tools', sku: 'KS-AUT-002', name: 'Kors Brushless 20V Drill & S2 Titanium Bit Set', priceUsd: 340, stockCount: 14, weightKg: 3.4, sizeTier: 'medium', codEligible: true },
  { id: 'prod-harmonia-instrument', sku: 'KS-ENT-002', name: 'Harmonia Solid Beech Acoustic Music Set', priceUsd: 135, stockCount: 14, weightKg: 1.5, sizeTier: 'medium', codEligible: true },
  { id: 'prod-baby-nursery-set', sku: 'KS-BBY-002', name: 'Bebe Organic Muslin Swaddle & Montessori Blocks', priceUsd: 118, stockCount: 21, weightKg: 1.3, sizeTier: 'medium', codEligible: true },
  { id: 'prod-health-pets-bundle', sku: 'KS-HLP-001', name: 'Herbalist Daily Vegan Caps, Stoneware Bowl & Collar', priceUsd: 168, stockCount: 25, weightKg: 1.7, sizeTier: 'medium', codEligible: true },
  { id: 'prod-listening-bundle', sku: 'KS-ENT-001', name: 'Evening Desk Listening & Ritual Gift Set', priceUsd: 640, stockCount: 10, weightKg: 3.6, sizeTier: 'medium', codEligible: true },
];
