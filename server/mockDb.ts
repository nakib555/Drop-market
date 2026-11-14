import type {
  AccountDirectoryEntry,
  ApiSellerProductRecord,
  AvailabilityStatus,
  CategoryNode,
  CurrencyRateState,
  DynamicCategoryRecord,
  Order,
  OrderStage,
  ProductOverride,
  SellerApplicationRecord,
  SellerInventoryItem,
  ShippingRuleConfig,
  StoreNotification,
  UserRole,
} from '../src/types/commerce.ts';
import { INITIAL_CATEGORY_TREE } from './shared/marketplaceSchema.ts';
import { createInitialCurrencyState } from './services/currencyService.ts';
import { createInitialShippingConfig } from './services/shippingService.ts';
import type { PendingSessionContext } from './services/paymentService.ts';

export interface ServerUserRecord extends AccountDirectoryEntry {
  password: string;
}

export const INITIAL_SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'usr-customer-alex',
    fullName: 'Alex Mercer',
    email: 'alex.mercer@studio.example',
    phone: '+1 (415) 555-0194',
    role: 'customer',
    roleLabel: 'Marketplace Member',
    status: 'active',
    joinedAt: '2025-04-12',
    location: 'San Francisco, US · Dhaka Hub',
    demoPasswordHint: 'studio2026',
    password: 'studio2026',
  },
  {
    id: 'usr-seller-elena',
    fullName: 'Elena Vance',
    email: 'elena@aeterna-loom.studio',
    phone: '+1 (503) 555-0148',
    role: 'seller',
    roleLabel: 'Verified Seller Studio',
    studioName: 'Aeterna & Loom Collective',
    status: 'active',
    joinedAt: '2024-09-03',
    location: 'Copenhagen & Portland',
    demoPasswordHint: 'seller2026',
    password: 'seller2026',
  },
  {
    id: 'usr-admin-kenji',
    fullName: 'Kenji Takahashi',
    email: 'admin@kintostudio.example',
    phone: '+1 (212) 555-0182',
    role: 'admin',
    roleLabel: 'Platform Administrator',
    studioName: 'Kinto Studio Global Ops',
    status: 'active',
    joinedAt: '2023-11-18',
    location: 'New York & Dhaka',
    demoPasswordHint: 'admin2026',
    password: 'admin2026',
  },
  {
    id: 'usr-customer-nadia',
    fullName: 'Nadia Rahman',
    email: 'nadia.rahman@dhaka-atelier.example',
    phone: '+880 1711-004821',
    role: 'customer',
    roleLabel: 'Design Trade Buyer',
    status: 'active',
    joinedAt: '2025-08-21',
    location: 'Banani, Dhaka',
    demoPasswordHint: 'studio2026',
    password: 'studio2026',
  },
  {
    id: 'usr-seller-soren',
    fullName: 'Soren Lindholm',
    email: 'soren@nordicroast.example',
    phone: '+47 21 98 44 10',
    role: 'seller',
    roleLabel: 'Maker Partner',
    studioName: 'Nordic Trail & Roast',
    status: 'pending',
    joinedAt: '2026-10-29',
    location: 'Oslo & Portland',
    demoPasswordHint: 'seller2026',
    password: 'seller2026',
  },
  {
    id: 'usr-customer-clara',
    fullName: 'Clara Lindqvist',
    email: 'clara@nordic-arch.example',
    phone: '+45 33 14 28 90',
    role: 'customer',
    roleLabel: 'Marketplace Member',
    status: 'active',
    joinedAt: '2026-01-19',
    location: 'Copenhagen, DK',
    demoPasswordHint: 'studio2026',
    password: 'studio2026',
  },
];

export const INITIAL_SELLER_APPLICATIONS: SellerApplicationRecord[] = [
  {
    id: 'app-aeterna-loom',
    studioName: 'Aeterna & Loom Collective',
    ownerName: 'Elena Vance',
    email: 'elena@aeterna-loom.studio',
    department: 'Electronics & Fashion',
    origin: 'Copenhagen & Kyoto',
    submittedAt: '2024-09-01',
    status: 'approved',
    productCount: 7,
    monthlyRevenue: 48620,
  },
  {
    id: 'app-nordic-roast',
    studioName: 'Nordic Trail & Roast',
    ownerName: 'Soren Lindholm',
    email: 'soren@nordicroast.example',
    department: 'Grocery & Outdoor',
    origin: 'Oslo & Oregon',
    submittedAt: '2026-10-29',
    status: 'pending',
    productCount: 4,
    monthlyRevenue: 19450,
  },
  {
    id: 'app-aethel-botanicals',
    studioName: 'Aethel Apothecary Lab',
    ownerName: 'Margaux Delacroix',
    email: 'margaux@aethel.studio',
    department: 'Beauty, Health & Pets',
    origin: 'Grasse & Seattle',
    submittedAt: '2025-05-14',
    status: 'approved',
    productCount: 5,
    monthlyRevenue: 31800,
  },
];

export const INITIAL_SELLER_INVENTORY: SellerInventoryItem[] = [
  {
    id: 'prod-aeterna-headphones',
    sku: 'KS-ELC-001',
    name: 'Aeterna AE-1 Studio Wireless Headphones',
    brand: 'Aeterna Acoustics',
    category: 'electronics-tech',
    categoryLabel: 'Electronics & Technology',
    price: 420,
    stockCount: 18,
    availability: 'in-stock',
    imagePresetKey: 'headphones',
    monthlyUnitsSold: 42,
  },
  {
    id: 'prod-zonolith-speaker',
    sku: 'KS-ELC-002',
    name: 'Zonolith Ambient Wi-Fi & AirPlay Speaker',
    brand: 'Aeterna Acoustics',
    category: 'electronics-tech',
    categoryLabel: 'Electronics & Technology',
    price: 580,
    stockCount: 9,
    availability: 'low-stock',
    imagePresetKey: 'speaker',
    monthlyUnitsSold: 23,
  },
  {
    id: 'prod-merino-overshirt',
    sku: 'KS-FSH-001',
    name: 'Kyoto Heavyweight Merino Wool Overshirt',
    brand: 'Loom & Caliber',
    category: 'fashion-accessories',
    categoryLabel: 'Fashion & Accessories',
    price: 245,
    stockCount: 24,
    availability: 'in-stock',
    imagePresetKey: 'overshirt',
    monthlyUnitsSold: 58,
  },
  {
    id: 'prod-outdoor-daypack',
    sku: 'KS-OUT-001',
    name: 'Vanguard 22L Weatherproof Daypack & Flask',
    brand: 'Nordic Trail & Roast',
    category: 'sports-outdoors-travel',
    categoryLabel: 'Sports, Outdoors & Travel',
    price: 295,
    stockCount: 15,
    availability: 'in-stock',
    imagePresetKey: 'daypack',
    monthlyUnitsSold: 31,
  },
  {
    id: 'prod-kuro-lounge',
    sku: 'KS-HOM-001',
    name: 'Kuro Smoked Oak & Bouclé Lounge Chair',
    brand: 'Kinto Atelier',
    category: 'home-furniture-kitchen',
    categoryLabel: 'Home, Furniture & Kitchen',
    price: 1480,
    stockCount: 7,
    availability: 'low-stock',
    imagePresetKey: 'chair',
    monthlyUnitsSold: 11,
  },
  {
    id: 'prod-botanical-serum',
    sku: 'KS-BTY-001',
    name: 'Aethel Botanical Facial Serum & Creme',
    brand: 'Aethel Apothecary',
    category: 'beauty-care',
    categoryLabel: 'Beauty & Personal Care',
    price: 148,
    stockCount: 31,
    availability: 'in-stock',
    imagePresetKey: 'serum',
    monthlyUnitsSold: 74,
  },
  {
    id: 'prod-industrial-tools',
    sku: 'KS-AUT-002',
    name: 'Kors Brushless 20V Drill & S2 Titanium Bit Set',
    brand: 'Solis Foundry',
    category: 'automotive-tools-industrial',
    categoryLabel: 'Automotive, Tools & Industrial',
    price: 340,
    stockCount: 14,
    availability: 'in-stock',
    imagePresetKey: 'tools',
    monthlyUnitsSold: 19,
  },
  {
    id: 'prod-baby-nursery-set',
    sku: 'KS-BBY-002',
    name: 'Bebe Organic Muslin Swaddle & Montessori Blocks',
    brand: 'Kinto Atelier',
    category: 'baby-kids-toys-hobbies',
    categoryLabel: 'Baby, Kids, Toys & Hobbies',
    price: 118,
    stockCount: 21,
    availability: 'in-stock',
    imagePresetKey: 'nursery',
    monthlyUnitsSold: 36,
  },
  {
    id: 'prod-health-pets-bundle',
    sku: 'KS-HLP-001',
    name: 'Herbalist Daily Vegan Caps, Stoneware Bowl & Collar',
    brand: 'Aethel Apothecary',
    category: 'health-wellness-pets',
    categoryLabel: 'Health, Wellness & Pets',
    price: 168,
    stockCount: 25,
    availability: 'in-stock',
    imagePresetKey: 'healthpets',
    monthlyUnitsSold: 44,
  },
];

export const INITIAL_SELLER_CREATED_PRODUCTS: ApiSellerProductRecord[] = [];
export const INITIAL_CUSTOM_CATEGORIES: DynamicCategoryRecord[] = [];

export const INITIAL_SERVER_ORDERS: Order[] = [
  {
    id: 'KS-10482',
    createdAt: '2026-11-08T15:30:00Z',
    customerName: 'Alex Mercer',
    email: 'alex.mercer@studio.example',
    phone: '+1 (415) 555-0194',
    shippingAddress: {
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      upazila: 'San Francisco Metro',
      area: 'Pacific Heights',
      streetAddress: '2140 Steiner Street, Apt 4B',
      postalCode: '94115',
      instructions: 'Call 15 minutes prior to arrival at service entrance.',
    },
    deliveryMethod: 'express',
    deliveryLabel: 'Express Insured Courier',
    estimatedArrival: 'Nov 15, 2026',
    courierName: 'DHL Express Air',
    trackingNumber: 'APF-9940218-US',
    paymentMethod: 'visa',
    paymentLabel: 'Visa ending in 4242',
    paymentStatus: 'paid',
    transactionRef: 'KS-VISA-884120',
    gatewayProvider: 'SSLCommerz / Visa 3DS Secure',
    currencySnapshot: {
      baseCurrency: 'USD',
      transactionCurrency: 'USD',
      exchangeRate: 1,
      rateSource: 'Bangladesh Bank & OpenFX Studio Reference Feed',
      rateTimestamp: '2026-11-08T15:30:00Z',
      roundingRule: 'half_even_cents',
      baseSubtotalUsd: 615,
      baseTotalUsd: 576.89,
      chargedTotal: 576.89,
    },
    promoCode: 'STUDIO15',
    items: [
      {
        key: 'prod-aeterna-headphones::Natural Aluminum / Charcoal::Standard Edition',
        productId: 'prod-aeterna-headphones',
        name: 'Aeterna AE-1 Studio Wireless Headphones',
        brand: 'Aeterna Acoustics',
        category: 'electronics-tech',
        slug: 'aeterna-ae1-studio-wireless-headphones',
        image: '',
        price: 420,
        color: 'Natural Aluminum / Charcoal',
        colorHex: '#A5A4A0',
        size: 'Standard Edition',
        quantity: 1,
        stockCount: 18,
        weightKg: 0.65,
        sizeTier: 'small',
      },
      {
        key: 'prod-coffee-pourover::Matte Black / Speckled Sand::Complete Kettle + Dripper + 250g',
        productId: 'prod-coffee-pourover',
        name: 'Yirgacheffe Pour-Over Brew Set & Roast',
        brand: 'Nordic Trail & Roast',
        category: 'grocery-food-household',
        slug: 'yirgacheffe-pourover-kettle-roast-set',
        image: '',
        price: 195,
        color: 'Matte Black / Speckled Sand',
        colorHex: '#222220',
        size: 'Complete Kettle + Dripper + 250g',
        quantity: 1,
        stockCount: 22,
        weightKg: 1.6,
        sizeTier: 'medium',
      },
    ],
    subtotal: 615,
    shippingCost: 28,
    taxAmount: 26.14,
    discountAmount: 92.25,
    total: 576.89,
    currentStage: 'Shipped',
    timeline: [
      { stage: 'Confirmed', timestamp: 'Nov 8, 2026 · 7:30 AM', note: 'Server-verified settlement via Visa 3DS (KS-VISA-884120)', completed: true },
      { stage: 'Processing', timestamp: 'Nov 9, 2026 · 10:15 AM', note: 'Coffee roasted & audio unit tested', completed: true },
      { stage: 'Packed', timestamp: 'Nov 10, 2026 · 2:40 PM', note: 'Cradled in molded pulp protective transit packaging', completed: true },
      { stage: 'Shipped', timestamp: 'Nov 11, 2026 · 9:05 AM', note: 'Departed Portland distribution hub', completed: true },
      { stage: 'Out for Delivery', timestamp: 'Estimated Nov 15', note: 'Pending local courier dispatch', completed: false },
      { stage: 'Delivered', timestamp: 'Estimated Nov 15', note: 'Signature confirmation at residence', completed: false },
    ],
  },
  {
    id: 'KS-10495',
    createdAt: '2026-11-12T09:15:00Z',
    customerName: 'Nadia Rahman',
    email: 'nadia.rahman@dhaka-atelier.example',
    phone: '+880 1711-004821',
    shippingAddress: {
      country: 'Bangladesh',
      state: 'Dhaka',
      city: 'Dhaka',
      upazila: 'Dhaka North City Corporation',
      area: 'Banani',
      streetAddress: 'House 42, Road 11, Block F',
      postalCode: '1213',
      instructions: 'Call courier guard desk upon entry.',
    },
    deliveryMethod: 'express',
    deliveryLabel: 'Express Priority Dispatch',
    estimatedArrival: 'Same-Day / 4–8 Hours Dispatch',
    courierName: 'RedX Priority Air & Same-Day',
    trackingNumber: 'KS-BD-448120',
    paymentMethod: 'bkash',
    paymentLabel: 'bKash Mobile Wallet (4821)',
    paymentStatus: 'paid',
    transactionRef: 'KS-BKASH-902114',
    gatewayProvider: 'bKash Merchant Checkout v1.2',
    currencySnapshot: {
      baseCurrency: 'USD',
      transactionCurrency: 'BDT',
      exchangeRate: 120.5,
      rateSource: 'Bangladesh Bank & OpenFX Studio Reference Feed',
      rateTimestamp: '2026-11-12T09:15:00Z',
      roundingRule: 'ceil_integer_taka',
      baseSubtotalUsd: 490,
      baseTotalUsd: 516.15,
      chargedTotal: 62197,
    },
    items: [
      {
        key: 'prod-merino-overshirt::Charcoal Slate::M',
        productId: 'prod-merino-overshirt',
        name: 'Kyoto Heavyweight Merino Wool Overshirt',
        brand: 'Loom & Caliber',
        category: 'fashion-accessories',
        slug: 'kyoto-heavyweight-merino-overshirt',
        image: '',
        price: 245,
        color: 'Charcoal Slate',
        colorHex: '#35373A',
        size: 'M',
        quantity: 2,
        stockCount: 24,
        weightKg: 0.75,
        sizeTier: 'small',
      },
    ],
    subtotal: 490,
    shippingCost: 1.65,
    taxAmount: 24.5,
    discountAmount: 0,
    total: 516.15,
    currentStage: 'Processing',
    timeline: [
      { stage: 'Confirmed', timestamp: 'Nov 12, 2026 · 9:15 AM', note: 'bKash gateway verified ৳62,197 BDT (KS-BKASH-902114)', completed: true },
      { stage: 'Processing', timestamp: 'Nov 12, 2026 · 1:20 PM', note: 'Garment steam inspection at Dhaka Central Hub', completed: true },
      { stage: 'Packed', timestamp: 'Pending', note: 'Protective garment box preparation', completed: false },
      { stage: 'Shipped', timestamp: 'Pending', note: 'Dispatched via RedX Priority', completed: false },
      { stage: 'Out for Delivery', timestamp: 'Pending', note: 'Banani rider handoff', completed: false },
      { stage: 'Delivered', timestamp: 'Estimated Nov 18', note: 'Recipient signature required', completed: false },
    ],
  },
  {
    id: 'KS-10501',
    createdAt: '2026-11-13T16:40:00Z',
    customerName: 'Alex Mercer',
    email: 'alex.mercer@studio.example',
    phone: '+1 (415) 555-0194',
    shippingAddress: {
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      upazila: 'San Francisco Metro',
      area: 'Pacific Heights',
      streetAddress: '2140 Steiner Street, Apt 4B',
      postalCode: '94115',
    },
    deliveryMethod: 'standard',
    deliveryLabel: 'Standard Tracked Courier',
    estimatedArrival: 'Nov 20, 2026',
    courierName: 'DHL Global Freight',
    trackingNumber: 'KS-TRK-7710294',
    paymentMethod: 'visa',
    paymentLabel: 'Visa Card ending in 4242',
    paymentStatus: 'paid',
    transactionRef: 'KS-VISA-771029',
    gatewayProvider: 'SSLCommerz / Visa 3DS Secure',
    currencySnapshot: {
      baseCurrency: 'USD',
      transactionCurrency: 'USD',
      exchangeRate: 1,
      rateSource: 'Bangladesh Bank & OpenFX Studio Reference Feed',
      rateTimestamp: '2026-11-13T16:40:00Z',
      roundingRule: 'half_even_cents',
      baseSubtotalUsd: 580,
      baseTotalUsd: 609,
      chargedTotal: 609,
    },
    items: [
      {
        key: 'prod-zonolith-speaker::Brushed Graphite / Kvadrat Wool::Standard',
        productId: 'prod-zonolith-speaker',
        name: 'Zonolith Ambient Wi-Fi & AirPlay Speaker',
        brand: 'Aeterna Acoustics',
        category: 'electronics-tech',
        slug: 'zonolith-ambient-wifi-speaker',
        image: '',
        price: 580,
        color: 'Brushed Graphite / Kvadrat Wool',
        colorHex: '#2E2F31',
        size: 'Standard',
        quantity: 1,
        stockCount: 9,
        weightKg: 4.2,
        sizeTier: 'medium',
      },
    ],
    subtotal: 580,
    shippingCost: 0,
    taxAmount: 29,
    discountAmount: 0,
    total: 609,
    currentStage: 'Confirmed',
    timeline: [
      { stage: 'Confirmed', timestamp: 'Nov 13, 2026 · 4:40 PM', note: 'Order confirmed & verified (KS-VISA-771029)', completed: true },
      { stage: 'Processing', timestamp: 'Pending', note: 'Quality check & fulfillment allocation', completed: false },
      { stage: 'Packed', timestamp: 'Pending', note: 'Protective packaging & seal', completed: false },
      { stage: 'Shipped', timestamp: 'Pending', note: 'Handover to DHL Global Freight', completed: false },
      { stage: 'Out for Delivery', timestamp: 'Pending', note: 'Local courier transit', completed: false },
      { stage: 'Delivered', timestamp: 'Estimated Nov 20', note: 'Confirmation at delivery address', completed: false },
    ],
  },
  {
    id: 'KS-10319',
    createdAt: '2026-10-12T11:20:00Z',
    customerName: 'Alex Mercer',
    email: 'alex.mercer@studio.example',
    phone: '+1 (415) 555-0194',
    shippingAddress: {
      country: 'Bangladesh',
      state: 'Dhaka',
      city: 'Dhaka',
      upazila: 'Dhaka North City Corporation',
      area: 'Gulshan 1 & 2',
      streetAddress: 'House 18, Road 71, Gulshan 2',
      postalCode: '1212',
    },
    deliveryMethod: 'standard',
    deliveryLabel: 'Standard Tracked Courier',
    estimatedArrival: 'Oct 14, 2026',
    courierName: 'Steadfast & Pathao Studio Ground',
    trackingNumber: 'KS-BD-882019',
    paymentMethod: 'nagad',
    paymentLabel: 'Nagad Mobile Wallet',
    paymentStatus: 'paid',
    transactionRef: 'KS-NAGAD-552819',
    gatewayProvider: 'Nagad MFS Payment Gateway',
    currencySnapshot: {
      baseCurrency: 'USD',
      transactionCurrency: 'BDT',
      exchangeRate: 120.5,
      rateSource: 'Bangladesh Bank & OpenFX Studio Reference Feed',
      rateTimestamp: '2026-10-12T11:20:00Z',
      roundingRule: 'ceil_integer_taka',
      baseSubtotalUsd: 296,
      baseTotalUsd: 310.8,
      chargedTotal: 37452,
    },
    items: [
      {
        key: 'prod-botanical-serum::Botanical Duo (Serum + Creme)::50ml + 60ml Set',
        productId: 'prod-botanical-serum',
        name: 'Aethel Botanical Facial Serum & Creme',
        brand: 'Aethel Apothecary',
        category: 'beauty-care',
        slug: 'aethel-botanical-facial-serum-duo',
        image: '',
        price: 148,
        color: 'Botanical Duo (Serum + Creme)',
        colorHex: '#8F5928',
        size: '50ml + 60ml Set',
        quantity: 2,
        stockCount: 31,
        weightKg: 0.4,
        sizeTier: 'small',
      },
    ],
    subtotal: 296,
    shippingCost: 0,
    taxAmount: 14.8,
    discountAmount: 0,
    total: 310.8,
    currentStage: 'Delivered',
    timeline: [
      { stage: 'Confirmed', timestamp: 'Oct 12, 2026 · 11:20 AM', note: 'Nagad settlement confirmed ৳37,452 BDT', completed: true },
      { stage: 'Processing', timestamp: 'Oct 12, 2026 · 3:10 PM', note: 'Apothecary batch verified', completed: true },
      { stage: 'Packed', timestamp: 'Oct 13, 2026 · 9:45 AM', note: 'Temperature-safe cushioning applied', completed: true },
      { stage: 'Shipped', timestamp: 'Oct 13, 2026 · 5:00 PM', note: 'Dispatched from Dhaka Hub', completed: true },
      { stage: 'Out for Delivery', timestamp: 'Oct 14, 2026 · 8:15 AM', note: 'With Gulshan courier rider', completed: true },
      { stage: 'Delivered', timestamp: 'Oct 14, 2026 · 1:42 PM', note: 'Delivered to Gulshan reception', completed: true },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: StoreNotification[] = [
  {
    id: 'notif-1',
    title: 'Shipment Dispatched · #KS-10482',
    message: 'Your Aeterna AE-1 Headphones & Yirgacheffe Pour-Over Set departed our fulfillment hub.',
    category: 'order',
    createdAt: '2h ago',
    read: false,
    roleScope: 'customer',
    orderId: 'KS-10482',
  },
  {
    id: 'notif-2',
    title: 'Seasonal Privilege Active',
    message: 'Apply code STUDIO15 across all 10 marketplace departments on qualifying orders ($300+ / ৳36,150+).',
    category: 'promotion',
    createdAt: '1d ago',
    read: true,
    roleScope: 'all',
  },
  {
    id: 'notif-3',
    title: 'Low Stock Threshold · KS-HOM-001',
    message: 'Kuro Smoked Oak Lounge Chair inventory dropped to 7 remaining units.',
    category: 'inventory',
    createdAt: '3h ago',
    read: false,
    roleScope: 'seller',
    targetTab: 'seller-hub',
  },
  {
    id: 'notif-4',
    title: '2 Orders Ready for Fulfillment',
    message: 'Orders #KS-10495 and #KS-10501 await packing & carrier handover.',
    category: 'order',
    createdAt: '5h ago',
    read: false,
    roleScope: 'seller',
    targetTab: 'seller-hub',
  },
  {
    id: 'notif-5',
    title: 'New Vendor Application Pending',
    message: 'Nordic Trail & Roast submitted verification records for Grocery & Outdoor listings.',
    category: 'system',
    createdAt: '4h ago',
    read: false,
    roleScope: 'admin',
    targetTab: 'admin-console',
  },
];

export class MockMarketplaceDb {
  users: ServerUserRecord[] = INITIAL_SERVER_USERS.map((u) => ({ ...u }));
  sellerApplications: SellerApplicationRecord[] = INITIAL_SELLER_APPLICATIONS.map((s) => ({ ...s }));
  sellerInventory: SellerInventoryItem[] = INITIAL_SELLER_INVENTORY.map((i) => ({ ...i }));
  sellerCreatedProducts: ApiSellerProductRecord[] = [];
  categoryTree: CategoryNode[] = INITIAL_CATEGORY_TREE.map((c) => ({
    ...c,
    pathSlugs: [...c.pathSlugs],
    collectionIds: [...c.collectionIds],
    featuredBrands: [...c.featuredBrands],
    filterFacets: c.filterFacets.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined })),
  }));
  customCategories: DynamicCategoryRecord[] = [];
  currencyConfig: CurrencyRateState = createInitialCurrencyState();
  shippingConfig: ShippingRuleConfig = createInitialShippingConfig();
  paymentSessions: Map<string, PendingSessionContext> = new Map();
  productOverrides: Record<string, ProductOverride> = {};
  orders: Order[] = INITIAL_SERVER_ORDERS.map((o) => ({
    ...o,
    items: o.items.map((item) => ({ ...item })),
    timeline: o.timeline.map((t) => ({ ...t })),
  }));
  notifications: StoreNotification[] = INITIAL_NOTIFICATIONS.map((n) => ({ ...n }));
  sessions: Map<string, string> = new Map([['demo-token-alex', 'usr-customer-alex']]);

  toPublicAccount(u: ServerUserRecord): AccountDirectoryEntry {
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      roleLabel: u.roleLabel,
      studioName: u.studioName,
      status: u.status,
      joinedAt: u.joinedAt,
      location: u.location,
      demoPasswordHint: u.demoPasswordHint,
      policyAcceptance: u.policyAcceptance,
    };
  }

  getUserByToken(token?: string): ServerUserRecord | null {
    if (!token) return null;
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    const userId = this.sessions.get(clean);
    if (!userId) return null;
    return this.users.find((u) => u.id === userId) || null;
  }

  issueSession(userId: string): string {
    const token = `ks-tok-${userId}-${Date.now().toString(36)}`;
    this.sessions.set(token, userId);
    return token;
  }

  advanceOrderTimeline(order: Order, nextStage: OrderStage, note?: string): Order {
    const coreStages: OrderStage[] = [
      'Confirmed',
      'Processing',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered',
    ];
    const nowLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date());

    if (nextStage === 'Cancelled' || nextStage === 'Return Requested') {
      const updatedTimeline = [
        ...order.timeline,
        {
          stage: nextStage,
          timestamp: nowLabel,
          note:
            note ||
            (nextStage === 'Cancelled'
              ? 'Order cancelled before dispatch via marketplace portal'
              : '30-day studio return initiated by customer'),
          completed: true,
        },
      ];
      const updated = { ...order, currentStage: nextStage, timeline: updatedTimeline };
      this.orders = this.orders.map((o) => (o.id === order.id ? updated : o));
      return updated;
    }

    const stageIdx = coreStages.indexOf(nextStage);
    const updatedTimeline = order.timeline.map((ev) => {
      const idx = coreStages.indexOf(ev.stage);
      if (idx === -1) return ev;
      if (idx <= stageIdx) {
        return {
          ...ev,
          completed: true,
          timestamp: ev.completed && ev.timestamp !== 'Pending' ? ev.timestamp : nowLabel,
          note: idx === stageIdx && note ? note : ev.note,
        };
      }
      return { ...ev, completed: false };
    });

    const updated: Order = {
      ...order,
      currentStage: nextStage,
      timeline: updatedTimeline,
    };
    this.orders = this.orders.map((o) => (o.id === order.id ? updated : o));
    return updated;
  }

  updateInventoryItem(
    id: string,
    updates: { price?: number; stockCount?: number; availability?: AvailabilityStatus }
  ) {
    const existing = this.sellerInventory.find((i) => i.id === id);
    if (existing) {
      if (typeof updates.price === 'number') existing.price = updates.price;
      if (typeof updates.stockCount === 'number') {
        existing.stockCount = updates.stockCount;
        existing.availability =
          updates.availability || (updates.stockCount <= 8 ? 'low-stock' : 'in-stock');
      } else if (updates.availability) {
        existing.availability = updates.availability;
      }
    }

    const created = this.sellerCreatedProducts.find((p) => p.id === id);
    if (created) {
      if (typeof updates.price === 'number') created.price = updates.price;
      if (typeof updates.stockCount === 'number') {
        created.stockCount = updates.stockCount;
        created.availability =
          updates.availability || (updates.stockCount <= 8 ? 'low-stock' : 'in-stock');
      } else if (updates.availability) {
        created.availability = updates.availability;
      }
    }

    this.productOverrides[id] = {
      ...(this.productOverrides[id] || { id }),
      ...updates,
    };

    return this.productOverrides[id];
  }

  updateUserRoleAndStatus(
    userId: string,
    updates: { role?: UserRole; status?: 'active' | 'pending' | 'suspended' }
  ) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    if (updates.role) {
      user.role = updates.role;
      user.roleLabel =
        updates.role === 'admin'
          ? 'Platform Administrator'
          : updates.role === 'seller'
          ? 'Verified Seller Studio'
          : 'Marketplace Member';
    }
    if (updates.status) {
      user.status = updates.status;
    }
    return this.toPublicAccount(user);
  }
}

export const db = new MockMarketplaceDb();
