import type {
  AccountDirectoryEntry,
  AdminSystemReadiness,
  ApiSellerProductRecord,
  AvailabilityStatus,
  CategoryNode,
  CurrencyRateState,
  DynamicCategoryRecord,
  ManagedPromoRecord,
  NewsletterSubscriptionRecord,
  Order,
  OrderStage,
  PaymentMethodId,
  PlatformSettingsState,
  ProductOverride,
  SellerApplicationRecord,
  SellerAuthorizedCustomerSummary,
  SellerInventoryItem,
  SellerStoreSettings,
  ShippingRuleConfig,
  StoreNotification,
  SupportInquiryRecord,
  UserRole,
} from '../src/types/commerce.ts';
import { INITIAL_CATEGORY_TREE, PROMO_CODES } from './shared/marketplaceSchema.ts';
import { createInitialCurrencyState } from './services/currencyService.ts';
import { createInitialShippingConfig } from './services/shippingService.ts';
import type { PendingSessionContext } from './services/paymentService.ts';

export interface ServerUserRecord extends AccountDirectoryEntry {
  password: string;
}

export const INITIAL_SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'usr-customer-rafiq',
    fullName: 'Rafiqul Islam',
    email: 'rafiq.islam@kintostudio.bd',
    phone: '+880 1711-240914',
    role: 'customer',
    roleLabel: 'Member Account',
    status: 'active',
    joinedAt: '2025-04-12',
    location: 'Gulshan, Dhaka, Bangladesh',
    password: 'studio2026',
  },
  {
    id: 'usr-seller-elena',
    fullName: 'Elena Vance',
    email: 'elena@aeterna-loom.studio',
    phone: '+880 1819-420148',
    role: 'seller',
    roleLabel: 'Verified Seller Studio',
    studioName: 'Aeterna & Loom Collective',
    status: 'active',
    joinedAt: '2024-09-03',
    location: 'Dhaka & Copenhagen',
    password: 'seller2026',
  },
  {
    id: 'usr-admin-kenji',
    fullName: 'Kenji Takahashi',
    email: 'admin@kintostudio.bd',
    phone: '+880 1911-880182',
    role: 'admin',
    roleLabel: 'Platform Administrator',
    studioName: 'Kinto Studio Global Ops',
    status: 'active',
    joinedAt: '2023-11-18',
    location: 'Dhaka Operations Hub, Bangladesh',
    password: 'admin2026',
  },
  {
    id: 'usr-customer-nadia',
    fullName: 'Nadia Rahman',
    email: 'nadia.rahman@dhaka-atelier.bd',
    phone: '+880 1711-004821',
    role: 'customer',
    roleLabel: 'Design Trade Buyer',
    status: 'active',
    joinedAt: '2025-08-21',
    location: 'Banani, Dhaka, Bangladesh',
    password: 'studio2026',
  },
  {
    id: 'usr-seller-soren',
    fullName: 'Soren Lindholm',
    email: 'soren@nordicroast.example',
    phone: '+880 1612-309844',
    role: 'seller',
    roleLabel: 'Maker Partner',
    studioName: 'Nordic Trail & Roast',
    status: 'pending',
    joinedAt: '2026-10-29',
    location: 'Oslo & Dhaka Hub',
    password: 'seller2026',
  },
  {
    id: 'usr-customer-clara',
    fullName: 'Clara Lindqvist',
    email: 'clara@nordic-arch.example',
    phone: '+45 33 14 28 90',
    role: 'customer',
    roleLabel: 'Member Account',
    status: 'active',
    joinedAt: '2026-01-19',
    location: 'Copenhagen, Denmark',
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
    origin: 'Oslo & Dhaka Hub',
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
    origin: 'Grasse & Dhaka Hub',
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
    customerName: 'Rafiqul Islam',
    email: 'rafiq.islam@kintostudio.bd',
    phone: '+880 1711-240914',
    shippingAddress: {
      country: 'Bangladesh',
      state: 'Dhaka',
      city: 'Dhaka',
      upazila: 'Dhaka North City Corporation',
      area: 'Gulshan 2',
      streetAddress: 'House 28, Road 90, Gulshan 2',
      postalCode: '1212',
      instructions: 'Call 15 minutes prior to arrival at reception gate.',
    },
    deliveryMethod: 'express',
    deliveryLabel: 'Express Insured Courier',
    estimatedArrival: 'Nov 15, 2026',
    courierName: 'RedX Priority Express',
    trackingNumber: 'KS-BD-9940218',
    paymentMethod: 'sslcommerz',
    paymentLabel: 'SSLCommerz Card Gateway (Ref 884120)',
    paymentStatus: 'paid',
    transactionRef: 'KS-VISA-884120',
    gatewayProvider: 'SSLCommerz Multi-Currency Gateway',
    currencySnapshot: {
      baseCurrency: 'USD',
      transactionCurrency: 'BDT',
      exchangeRate: 120.5,
      rateSource: 'Bangladesh Bank & OpenFX Studio Reference Feed',
      rateTimestamp: '2026-11-08T15:30:00Z',
      roundingRule: 'ceil_integer_taka',
      baseSubtotalUsd: 615,
      baseTotalUsd: 576.89,
      chargedTotal: 69516,
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
      { stage: 'Confirmed', timestamp: 'Nov 8, 2026 · 7:30 AM', note: 'Server-verified settlement via SSLCommerz (KS-VISA-884120)', completed: true },
      { stage: 'Processing', timestamp: 'Nov 9, 2026 · 10:15 AM', note: 'Coffee roasted & audio unit tested', completed: true },
      { stage: 'Packed', timestamp: 'Nov 10, 2026 · 2:40 PM', note: 'Cradled in molded pulp protective transit packaging', completed: true },
      { stage: 'Shipped', timestamp: 'Nov 11, 2026 · 9:05 AM', note: 'Departed Dhaka Central Distribution Hub', completed: true },
      { stage: 'Out for Delivery', timestamp: 'Estimated Nov 15', note: 'Pending local courier dispatch', completed: false },
      { stage: 'Delivered', timestamp: 'Estimated Nov 15', note: 'Signature confirmation at residence', completed: false },
    ],
  },
  {
    id: 'KS-10495',
    createdAt: '2026-11-12T09:15:00Z',
    customerName: 'Nadia Rahman',
    email: 'nadia.rahman@dhaka-atelier.bd',
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
    customerName: 'Clara Lindqvist',
    email: 'clara@nordic-arch.example',
    phone: '+45 33 14 28 90',
    shippingAddress: {
      country: 'Denmark',
      state: 'Capital Region',
      city: 'Copenhagen',
      upazila: 'Indre By',
      area: 'Bredgade',
      streetAddress: 'Bredgade 45, 2. th',
      postalCode: '1260',
    },
    deliveryMethod: 'standard',
    deliveryLabel: 'Standard Tracked Courier',
    estimatedArrival: 'Nov 20, 2026',
    courierName: 'DHL Global Freight',
    trackingNumber: 'KS-TRK-7710294',
    paymentMethod: 'visa',
    paymentLabel: 'Card Gateway Token (Ref 771029)',
    paymentStatus: 'paid',
    transactionRef: 'KS-VISA-771029',
    gatewayProvider: 'SSLCommerz / Card 3DS Secure',
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
    customerName: 'Rafiqul Islam',
    email: 'rafiq.islam@kintostudio.bd',
    phone: '+880 1711-240914',
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
    message: 'Your Aeterna AE-1 Headphones & Yirgacheffe Pour-Over Set departed Dhaka Central Hub.',
    category: 'order',
    createdAt: '2h ago',
    read: false,
    roleScope: 'customer',
    orderId: 'KS-10482',
  },
  {
    id: 'notif-2',
    title: 'Seasonal Privilege Active',
    message: 'Apply code STUDIO15 across all 10 marketplace departments on qualifying orders (৳36,150+ / $300+).',
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

export const INITIAL_SELLER_STORE_SETTINGS: SellerStoreSettings = {
  studioName: 'Aeterna & Loom Collective',
  contactEmail: 'elena@aeterna-loom.studio',
  dispatchLeadTime: '24–48 hours (Sunday–Thursday, Dhaka Ops)',
  pickupDivision: 'Dhaka',
  codSupported: true,
  preferredCouriers: ['RedX Priority', 'Pathao Courier', 'Steadfast Logistics'],
  payoutChannel: 'bKash Merchant Settlement / BRAC Bank EFT',
  payoutSchedule: 'Bi-weekly (1st & 15th following delivery confirmation)',
  payoutAccountMasked: 'BRAC Bank •••• 4910',
};

export const INITIAL_PLATFORM_SETTINGS: PlatformSettingsState = {
  storefrontName: 'Kinto Studio',
  supportEmail: 'support@kintostudio.bd',
  defaultLanguage: 'en',
  maintenanceNoticeEnabled: false,
};

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
  sellerStoreSettings: SellerStoreSettings = {
    ...INITIAL_SELLER_STORE_SETTINGS,
    preferredCouriers: [...INITIAL_SELLER_STORE_SETTINGS.preferredCouriers],
  };
  promotions: ManagedPromoRecord[] = PROMO_CODES.map((p) => ({ ...p, active: true }));
  platformSettings: PlatformSettingsState = { ...INITIAL_PLATFORM_SETTINGS };
  sessions: Map<string, string> = new Map();
  supportInquiries: SupportInquiryRecord[] = [];
  newsletterSubscribers: NewsletterSubscriptionRecord[] = [];
  passwordResetTokens: Map<
    string,
    { email: string; userId: string; code: string; expiresAt: number; used: boolean }
  > = new Map();

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
    const token = `ks-tok-${userId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    this.sessions.set(token, userId);
    return token;
  }

  invalidateUserSessions(userId: string): void {
    for (const [tok, uid] of this.sessions.entries()) {
      if (uid === userId) {
        this.sessions.delete(tok);
      }
    }
  }

  buildSystemReadiness(
    getGatewayStatus: (method: PaymentMethodId) => { enabled: boolean; reason?: string }
  ): AdminSystemReadiness {
    const env = typeof process !== 'undefined' && process.env ? process.env : {};
    const gatewayIds: Array<{ id: PaymentMethodId; label: string; envHint: string }> = [
      { id: 'cod', label: 'Cash on Delivery (Bangladesh)', envHint: 'Zone eligibility config' },
      { id: 'bkash', label: 'bKash Merchant PGW', envHint: 'BKASH_APP_KEY + BKASH_APP_SECRET' },
      { id: 'nagad', label: 'Nagad MFS Gateway', envHint: 'NAGAD_MERCHANT_ID' },
      { id: 'rocket', label: 'DBBL Rocket PGW', envHint: 'ROCKET_MERCHANT_ID' },
      {
        id: 'sslcommerz',
        label: 'SSLCommerz PGW',
        envHint: 'SSLCOMMERZ_STORE_ID + SSLCOMMERZ_STORE_PASSWORD',
      },
      { id: 'visa', label: 'Visa / Mastercard 3DS', envHint: 'STRIPE_SECRET_KEY or SSLCommerz' },
      { id: 'bank-transfer', label: 'NPSB / BEFTN Bank Transfer', envHint: 'BANK_TRANSFER_ACCOUNT_NO' },
    ];

    const hasDbUrl = Boolean(env.DATABASE_URL || env.FIREBASE_PROJECT_ID);
    const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_FROM);
    const hasTradeLicense = Boolean(env.KINTO_TRADE_LICENSE_NO);
    const hasDbid = Boolean(env.KINTO_DBID_NO);
    const hasBinVat = Boolean(env.KINTO_BIN_VAT_NO);

    return {
      checkedAt: new Date().toISOString(),
      persistence: {
        id: 'storage-persistence',
        label: 'Marketplace Data Storage',
        status: hasDbUrl ? 'operational' : 'in-memory',
        summary: hasDbUrl
          ? 'External database connection string detected in server environment.'
          : 'Running in-memory MockMarketplaceDb store; state resets on full server restart.',
        requiredAction: hasDbUrl
          ? undefined
          : 'Provision PostgreSQL (Cloud SQL) or Firestore when ready for persistent multi-instance deployment.',
      },
      emailTransport: {
        id: 'smtp-transport',
        label: 'Transactional Email & Password Recovery',
        status: hasSmtp ? 'operational' : 'pending-config',
        summary: hasSmtp
          ? 'SMTP credentials configured for order receipts and password reset codes.'
          : 'SMTP_HOST and SMTP_FROM are unconfigured; password reset issues a 15-minute in-app verification code preview without sending external email.',
        requiredAction: hasSmtp ? undefined : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in server env.',
      },
      paymentGateways: gatewayIds.map((gw) => {
        const st = getGatewayStatus(gw.id);
        return {
          id: `gw-${gw.id}`,
          label: gw.label,
          status: st.enabled ? 'operational' : 'pending-config',
          summary: st.enabled
            ? 'Operational in server checkout quotes and session verification.'
            : st.reason || 'Merchant credentials pending.',
          requiredAction: st.enabled ? undefined : `Configure ${gw.envHint} in server environment.`,
        };
      }),
      businessCompliance: [
        {
          id: 'reg-trade-license',
          label: 'Dhaka City Corporation Trade License',
          status: hasTradeLicense ? 'operational' : 'pending-config',
          summary: hasTradeLicense
            ? 'Registered Trade License identifier provided.'
            : 'Pending commercial Trade License filing before public launch.',
          requiredAction: hasTradeLicense ? undefined : 'Populate verified Trade License number prior to go-live.',
        },
        {
          id: 'reg-dbid',
          label: 'Bangladesh Digital Business ID (DBID)',
          status: hasDbid ? 'operational' : 'pending-config',
          summary: hasDbid
            ? 'DBID registration configured.'
            : 'Pending Ministry of Commerce DBID registration under Digital Commerce Guidelines 2021.',
          requiredAction: hasDbid ? undefined : 'Obtain DBID and verify legal entity copy with Bangladesh counsel.',
        },
        {
          id: 'reg-bin',
          label: 'NBR BIN / VAT & e-TIN',
          status: hasBinVat ? 'operational' : 'pending-config',
          summary: hasBinVat
            ? 'BIN/VAT registration configured for tax invoices.'
            : 'Using 5% configurable VAT rate estimate; official BIN/VAT number pending.',
          requiredAction: hasBinVat ? undefined : 'Configure official NBR BIN/VAT identifier before tax filing.',
        },
      ],
      crawlerSurface: {
        id: 'seo-crawler',
        label: 'SEO Routing, Sitemap & Robots Surface',
        status: 'operational',
        summary: 'History API routes, canonical tags, JSON-LD Schema.org, /robots.txt, and dynamic /sitemap.xml are active.',
      },
      metrics: {
        openSupportInquiries: this.supportInquiries.filter((i) => i.status !== 'resolved').length,
        newsletterSubscribers: this.newsletterSubscribers.length,
        pendingSellers: this.sellerApplications.filter((s) => s.status === 'pending').length,
      },
    };
  }

  getCombinedInventory(): SellerInventoryItem[] {
    return [
      ...this.sellerCreatedProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category,
        categoryLabel: p.categoryLabel,
        price: p.price,
        stockCount: p.stockCount,
        availability: p.availability,
        imagePresetKey: p.imagePresetKey,
        monthlyUnitsSold: 4,
      })),
      ...this.sellerInventory,
    ];
  }

  buildDynamicRevenueSeries(currentMonthGmv: number, pendingOrdersCount: number) {
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const now = new Date();
    const multipliers = [0.74, 0.81, 0.86, 0.91, 0.95, 1];
    const baseOrders = [68, 74, 82, 89, 95, 102 + pendingOrdersCount];
    return multipliers.map((mult, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return {
        month: formatter.format(date),
        gmv: idx === 5 ? Math.round(currentMonthGmv) : Math.round(currentMonthGmv * mult),
        orders: baseOrders[idx],
      };
    });
  }

  getAuthorizedCustomersForSeller(): SellerAuthorizedCustomerSummary[] {
    const map = new Map<string, SellerAuthorizedCustomerSummary>();
    for (const order of this.orders) {
      if (order.currentStage === 'Cancelled') continue;
      const key = order.email.toLowerCase();
      const existing = map.get(key);
      const cityArea = `${order.shippingAddress.area}, ${order.shippingAddress.city}`;
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpentUsd = Number((existing.totalSpentUsd + order.total).toFixed(2));
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt.slice(0, 10);
        }
      } else {
        map.set(key, {
          customerKey: order.id,
          displayName: order.customerName,
          cityArea,
          orderCount: 1,
          lastOrderDate: order.createdAt.slice(0, 10),
          totalSpentUsd: Number(order.total.toFixed(2)),
        });
      }
    }
    return Array.from(map.values());
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
          : 'Member Account';
    }
    if (updates.status) {
      user.status = updates.status;
    }
    return this.toPublicAccount(user);
  }
}

export const db = new MockMarketplaceDb();

