export type CoreCategorySlug =
  | 'electronics-tech'
  | 'fashion-accessories'
  | 'home-furniture-kitchen'
  | 'beauty-care'
  | 'grocery-food-household'
  | 'sports-outdoors-travel'
  | 'books-stationery-office'
  | 'automotive-tools-industrial'
  | 'baby-kids-toys-hobbies'
  | 'health-wellness-pets';

export type CategorySlug = CoreCategorySlug | (string & {});

export type AvailabilityStatus = 'in-stock' | 'low-stock' | 'made-to-order' | 'out-of-stock';

export type UserRole = 'customer' | 'seller' | 'admin';

export type CurrencyCode = 'BDT' | 'USD';

export type AttributeType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'single_select'
  | 'multi_select'
  | 'range'
  | 'color'
  | 'size'
  | 'measurement'
  | 'date';

export interface MeasurementValue {
  value: number;
  unit: string;
}

export interface RangeValue {
  min: number;
  max: number;
  unit?: string;
}

export type TypedAttributeValue =
  | string
  | number
  | boolean
  | string[]
  | MeasurementValue
  | RangeValue;

export interface SubcategoryMeta {
  id?: string;
  slug: string;
  name: string;
  parentId?: string | null;
  depth?: number;
  children?: SubcategoryMeta[];
}

export interface CategoryFacetConfig {
  key: string;
  label: string;
  type: AttributeType;
  unit?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  filterable?: boolean;
}

export interface CategoryNode {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  parentId: string | null;
  depth: number;
  pathSlugs: string[];
  description: string;
  bannerTagline: string;
  iconName: string;
  imagePresetKey: string;
  countLabel: string;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  collectionIds: string[];
  featuredBrands: string[];
  filterFacets: CategoryFacetConfig[];
}

export interface CategoryMeta {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  parentId: string | null;
  depth: number;
  pathSlugs: string[];
  description: string;
  bannerTagline: string;
  iconName: string;
  image: string;
  imagePresetKey?: string;
  countLabel: string;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  collectionIds: string[];
  subcategories: SubcategoryMeta[];
  descendantSlugs: string[];
  featuredBrands: string[];
  filterFacets: CategoryFacetConfig[];
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
}

export interface ProductQuestion {
  id: string;
  author: string;
  question: string;
  answer: string;
  answeredBy: string;
  date: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export type ProductSizeTier = 'small' | 'medium' | 'bulky' | 'freight';

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  subtitle?: string;
  brand: string;
  category: CategorySlug;
  categoryLabel: string;
  subcategory: string;
  subcategoryLabel: string;
  categoryIds?: string[];
  collectionIds?: string[];
  weightKg?: number;
  sizeTier?: ProductSizeTier;
  codEligible?: boolean;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stockCount: number;
  availability: AvailabilityStatus;
  badgeText?: string;
  shortDescription: string;
  description: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  variantColorLabel?: string;
  variantSizeLabel?: string;
  cardHighlights: string[];
  attributes: Record<string, string>;
  typedAttributes?: Record<string, TypedAttributeValue>;
  specifications: ProductSpec[];
  careNote?: string;
  deliveryEstimate: string;
  returnPolicy: string;
  warranty: string;
  tags: string[];
  isTrending?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeaturedOffer?: boolean;
  reviews: ProductReview[];
  questions?: ProductQuestion[];
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  brand: string;
  category: CategorySlug;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  color: string;
  colorHex: string;
  size: string;
  quantity: number;
  stockCount: number;
  weightKg?: number;
  sizeTier?: ProductSizeTier;
}

export interface PromoCode {
  code: string;
  description: string;
  discountType: 'percent' | 'shipping';
  value: number;
  minSubtotal: number;
}

export type DeliveryMethodId = 'standard' | 'express' | 'white-glove';

export type PaymentMethodId =
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'visa'
  | 'mastercard'
  | 'cod'
  | 'sslcommerz'
  | 'bank-transfer'
  | 'card'
  | 'wallet';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'cod_pending';

export interface OrderCurrencySnapshot {
  baseCurrency: 'USD';
  transactionCurrency: CurrencyCode;
  exchangeRate: number;
  rateSource: string;
  rateTimestamp: string;
  roundingRule: string;
  baseSubtotalUsd: number;
  baseTotalUsd: number;
  chargedTotal: number;
}

export interface CurrencyRateState {
  baseCurrency: 'USD';
  defaultCurrency: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  source: string;
  updateFrequencyMinutes: number;
  updatedAt: string;
  roundingRules: Record<CurrencyCode, { decimals: number; mode: string }>;
}

export type ShippingZoneId =
  | 'dhaka_metro'
  | 'dhaka_suburbs'
  | 'chattogram_sylhet_metro'
  | 'nationwide_district'
  | 'remote_restricted'
  | 'international';

export interface ShippingZoneRule {
  zoneId: ShippingZoneId;
  label: string;
  standardFeeUsd: number;
  expressFeeUsd: number;
  expressAvailable: boolean;
  whiteGloveFeeUsd: number;
  whiteGloveAvailable: boolean;
  freeThresholdUsd: number;
  baseWeightAllowanceKg: number;
  perExtraKgUsd: number;
  bulkySurchargeUsd: number;
  freightSurchargeUsd: number;
  standardEta: string;
  expressEta: string;
  whiteGloveEta: string;
  codEligible: boolean;
  codMaxOrderUsd: number;
  isRestricted: boolean;
  restrictionReason?: string;
}

export interface ShippingRuleConfig {
  zones: ShippingZoneRule[];
  restrictedAreaKeywords: string[];
  updatedAt: string;
}

export interface ShippingQuoteOption {
  id: DeliveryMethodId;
  title: string;
  eta: string;
  courier: string;
  costUsd: number;
  costDisplay: number;
  available: boolean;
  reason?: string;
}

export interface ShippingQuoteResponse {
  zoneId: ShippingZoneId;
  zoneLabel: string;
  restricted: boolean;
  restrictionReason?: string;
  codEligible: boolean;
  codReason?: string;
  totalWeightKg: number;
  hasBulkyItems: boolean;
  freeShippingThresholdUsd: number;
  freeShippingRemainingUsd: number;
  options: ShippingQuoteOption[];
}

export interface CheckoutQuoteResponse {
  currency: CurrencyCode;
  currencySnapshot: OrderCurrencySnapshot;
  shippingQuote: ShippingQuoteResponse;
  subtotalUsd: number;
  discountUsd: number;
  taxUsd: number;
  shippingUsd: number;
  totalUsd: number;
  subtotalCharged: number;
  discountCharged: number;
  taxCharged: number;
  shippingCharged: number;
  totalCharged: number;
  promoApplied?: string;
  allowedPaymentMethods: PaymentMethodId[];
}

export interface PaymentSession {
  id: string;
  idempotencyKey: string;
  transactionRef: string;
  provider: string;
  paymentMethod: PaymentMethodId;
  status: PaymentStatus;
  amount: number;
  currency: CurrencyCode;
  baseAmountUsd: number;
  currencySnapshot: OrderCurrencySnapshot;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  gatewayInstructions: string;
  orderId?: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  upazila?: string;
  area: string;
  streetAddress: string;
  postalCode: string;
  isDefault: boolean;
}

export type OrderStage =
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested';

export interface OrderTimelineEvent {
  stage: OrderStage;
  timestamp: string;
  note: string;
  completed: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: {
    country: string;
    state: string;
    city: string;
    upazila?: string;
    area: string;
    streetAddress: string;
    postalCode: string;
    instructions?: string;
  };
  deliveryMethod: DeliveryMethodId;
  deliveryLabel: string;
  estimatedArrival: string;
  courierName: string;
  trackingNumber: string;
  paymentMethod: PaymentMethodId;
  paymentLabel: string;
  paymentStatus: PaymentStatus;
  transactionRef?: string;
  gatewayProvider?: string;
  currencySnapshot?: OrderCurrencySnapshot;
  promoCode?: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount?: number;
  discountAmount: number;
  total: number;
  currentStage: OrderStage;
  timeline: OrderTimelineEvent[];
}

export interface AccountDirectoryEntry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  roleLabel: string;
  studioName?: string;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  location: string;
  demoPasswordHint: string;
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  studioRole: string;
  studioName?: string;
  isAuthenticated: boolean;
}

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  category: 'order' | 'inventory' | 'system' | 'promotion';
  createdAt: string;
  read: boolean;
  roleScope: UserRole | 'all';
  targetTab?: string;
  orderId?: string;
}

export interface ProductOverride {
  id: string;
  price?: number;
  stockCount?: number;
  availability?: AvailabilityStatus;
}

export interface ApiSellerProductRecord {
  id: string;
  slug: string;
  sku: string;
  name: string;
  subtitle?: string;
  brand: string;
  category: CategorySlug;
  categoryLabel: string;
  subcategory: string;
  subcategoryLabel: string;
  weightKg?: number;
  sizeTier?: ProductSizeTier;
  codEligible?: boolean;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stockCount: number;
  availability: AvailabilityStatus;
  badgeText?: string;
  shortDescription: string;
  description: string;
  imagePresetKey: string;
  colors: ProductColor[];
  sizes: string[];
  cardHighlights: string[];
  attributes: Record<string, string>;
  typedAttributes?: Record<string, TypedAttributeValue>;
  specifications: ProductSpec[];
  deliveryEstimate: string;
  returnPolicy: string;
  warranty: string;
  tags: string[];
  sellerId: string;
  isNewArrival?: boolean;
}

export interface DynamicCategoryRecord {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  parentId?: string | null;
  depth?: number;
  description: string;
  bannerTagline: string;
  iconName?: string;
  imagePresetKey: string;
  countLabel: string;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  collectionIds?: string[];
  subcategories: SubcategoryMeta[];
  featuredBrands: string[];
  filterFacets: CategoryFacetConfig[];
}

export interface SellerApplicationRecord {
  id: string;
  studioName: string;
  ownerName: string;
  email: string;
  department: string;
  origin: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'suspended';
  productCount: number;
  monthlyRevenue: number;
}

export interface SellerInventoryItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  price: number;
  stockCount: number;
  availability: AvailabilityStatus;
  imagePresetKey: string;
  monthlyUnitsSold: number;
}

export interface SellerDashboardData {
  studioName: string;
  ownerName: string;
  kpis: {
    monthlyGmv: number;
    pendingFulfillment: number;
    lowStockSkus: number;
    activeListings: number;
    avgRating: number;
  };
  revenueSeries: { month: string; gmv: number; orders: number }[];
  inventory: SellerInventoryItem[];
  fulfillmentQueue: Order[];
}

export interface AdminDashboardData {
  kpis: {
    totalGmv: number;
    totalOrders: number;
    activeSellers: number;
    pendingSellers: number;
    registeredUsers: number;
    activeCategories: number;
  };
  departmentShare: { category: string; label: string; gmv: number; sharePercent: number }[];
  users: AccountDirectoryEntry[];
  sellerApplications: SellerApplicationRecord[];
  orders: Order[];
  categories: CategoryNode[];
  currencyConfig: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
}

export interface PaymentMethodRecord {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  holderName: string;
  isDefault: boolean;
}

export interface NotificationPrefs {
  orderUpdates: boolean;
  restockAlerts: boolean;
  studioJournal: boolean;
  privateOffers: boolean;
}

export interface PrivacyPrefs {
  personalizedCatalog: boolean;
  saveSearchHistory: boolean;
  analyticsOptIn: boolean;
}

export interface JournalArticle {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: string;
  excerpt: string;
  image: string;
  body: string[];
}

export interface BrandStudio {
  id: string;
  name: string;
  origin: string;
  specialty: string;
  founded: string;
  summary: string;
  categories: CategorySlug[];
}

export type SortOption =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'best-selling'
  | 'highest-rated';

export interface CatalogFilters {
  query: string;
  category: CategorySlug | 'all';
  subcategory?: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  color: string;
  size: string;
  minRating: number;
  availability: 'all' | AvailabilityStatus;
  onSaleOnly: boolean;
  collection?: 'trending' | 'best-sellers' | 'new-arrivals' | 'offers' | 'all';
}

export type RouteName =
  | 'home'
  | 'shop'
  | 'category'
  | 'product'
  | 'search'
  | 'cart'
  | 'wishlist'
  | 'checkout'
  | 'account'
  | 'login'
  | 'seller'
  | 'admin'
  | 'track-order'
  | 'compare'
  | 'brands'
  | 'offers'
  | 'journal'
  | 'about'
  | 'contact'
  | 'faq'
  | 'shipping-policy'
  | 'return-policy'
  | 'privacy-policy'
  | 'terms'
  | 'maintenance'
  | 'not-found';
