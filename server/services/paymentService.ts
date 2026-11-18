import {
  AUTHORITATIVE_CATALOG_SKUS,
  PROMO_CODES,
  type AuthoritativeCatalogSku,
} from '../shared/marketplaceSchema.ts';
import type {
  ApiSellerProductRecord,
  CartItem,
  CheckoutQuoteResponse,
  CurrencyCode,
  CurrencyRateState,
  DeliveryMethodId,
  LegalAcceptanceRecord,
  Order,
  OrderStage,
  PaymentMethodId,
  PaymentSession,
  PaymentStatus,
  ProductOverride,
  PromoCode,
  ShippingRuleConfig,
} from '../../src/types/commerce.ts';
import {
  buildOrderCurrencySnapshot,
  convertUsdToCurrency,
  roundCurrencyAmount,
} from './currencyService.ts';
import { calculateShippingQuote, type ShippingQuoteItemInput } from './shippingService.ts';

export interface CheckoutItemRequest {
  productId: string;
  quantity: number;
  color?: string;
  colorHex?: string;
  size?: string;
  name?: string;
  brand?: string;
  category?: string;
  slug?: string;
}

export interface CheckoutQuoteRequest {
  items: CheckoutItemRequest[];
  address: {
    country: string;
    state: string;
    city: string;
    upazila?: string;
    area: string;
  };
  deliveryMethod: DeliveryMethodId;
  promoCode?: string;
  requestedCurrency?: CurrencyCode;
  allowInternationalUsd?: boolean;
}

interface ProviderAdapterMeta {
  provider: string;
  label: string;
  buildInstructions: (ref: string, amount: number, currency: CurrencyCode) => string;
}

const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

export function getGatewayConfigStatus(method: PaymentMethodId): {
  enabled: boolean;
  reason?: string;
} {
  switch (method) {
    case 'cod':
      return { enabled: true };
    case 'bkash':
      return env.BKASH_APP_KEY && env.BKASH_APP_SECRET
        ? { enabled: true }
        : { enabled: false, reason: 'bKash merchant gateway credentials are not configured.' };
    case 'nagad':
      return env.NAGAD_MERCHANT_ID
        ? { enabled: true }
        : { enabled: false, reason: 'Nagad merchant credentials are not configured.' };
    case 'rocket':
      return env.ROCKET_MERCHANT_ID
        ? { enabled: true }
        : { enabled: false, reason: 'Rocket merchant credentials are not configured.' };
    case 'sslcommerz':
      return env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD
        ? { enabled: true }
        : { enabled: false, reason: 'SSLCommerz store credentials are not configured.' };
    case 'visa':
    case 'mastercard':
    case 'card':
      return env.STRIPE_SECRET_KEY || (env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD)
        ? { enabled: true }
        : { enabled: false, reason: 'Online card processor credentials are not configured.' };
    case 'bank-transfer':
      return env.BANK_TRANSFER_ACCOUNT_NO
        ? { enabled: true }
        : { enabled: false, reason: 'Bank settlement account details are not configured.' };
    case 'wallet':
    default:
      return { enabled: false, reason: 'Payment provider is not configured.' };
  }
}

export function getCheckoutChannelStatus(method: PaymentMethodId): {
  enabled: boolean;
  sandbox?: boolean;
  reason?: string;
} {
  const live = getGatewayConfigStatus(method);
  if (live.enabled) {
    return { enabled: true, sandbox: false };
  }
  if (env.STRICT_LIVE_GATEWAYS === 'true') {
    return live;
  }
  if (
    method === 'bkash' ||
    method === 'nagad' ||
    method === 'rocket' ||
    method === 'visa' ||
    method === 'mastercard' ||
    method === 'sslcommerz' ||
    method === 'bank-transfer'
  ) {
    return { enabled: true, sandbox: true, reason: live.reason };
  }
  return live;
}

const PROVIDER_ADAPTERS: Record<PaymentMethodId, ProviderAdapterMeta> = {
  bkash: {
    provider: 'bKash Merchant Checkout',
    label: 'bKash Mobile Wallet',
    buildInstructions: (ref, amount, cur) =>
      `bKash PGW · Pay ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
  nagad: {
    provider: 'Nagad MFS Payment Gateway',
    label: 'Nagad Mobile Wallet',
    buildInstructions: (ref, amount, cur) =>
      `Nagad Gateway · Pay ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
  rocket: {
    provider: 'DBBL Rocket E-Commerce Gateway',
    label: 'Rocket (DBBL)',
    buildInstructions: (ref, amount, cur) =>
      `Dutch-Bangla Rocket PGW · Pay ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
  visa: {
    provider: 'Visa 3DS Secure',
    label: 'Visa Card',
    buildInstructions: (ref, amount, cur) =>
      `Visa 3DS Authorization · ${amount.toLocaleString()} ${cur} · Trace ${ref}`,
  },
  mastercard: {
    provider: 'Mastercard ID Check',
    label: 'Mastercard',
    buildInstructions: (ref, amount, cur) =>
      `Mastercard 3DS Authorization · ${amount.toLocaleString()} ${cur} · Trace ${ref}`,
  },
  sslcommerz: {
    provider: 'SSLCommerz Payment Gateway',
    label: 'SSLCommerz Gateway',
    buildInstructions: (ref, amount, cur) =>
      `SSLCommerz · ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
  'bank-transfer': {
    provider: 'BEFTN / NPSB Bank Transfer',
    label: 'Bank Transfer (NPSB / BEFTN)',
    buildInstructions: (ref, amount, cur) =>
      `NPSB / BEFTN Settlement · Include reference ${ref} for ${amount.toLocaleString()} ${cur}.`,
  },
  cod: {
    provider: 'Courier Cash on Delivery',
    label: 'Cash on Delivery (Bangladesh)',
    buildInstructions: (ref, amount, cur) =>
      `Pay ${amount.toLocaleString()} ${cur} in cash upon delivery · Docket ${ref}`,
  },
  card: {
    provider: 'Card 3DS Payment',
    label: 'Credit / Debit Card',
    buildInstructions: (ref, amount, cur) => `Card 3DS Authorization · ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
  wallet: {
    provider: 'Digital Wallet',
    label: 'Digital Wallet',
    buildInstructions: (ref, amount, cur) => `Wallet Authorization · ${amount.toLocaleString()} ${cur} · Ref ${ref}`,
  },
};

export function resolveTransactionCurrency(params: {
  country?: string;
  requestedCurrency?: CurrencyCode;
  allowInternationalUsd?: boolean;
}): CurrencyCode {
  const isBangladesh = (params.country || 'Bangladesh').trim().toLowerCase() === 'bangladesh';
  // Bangladesh checkout strictly uses BDT unless an explicitly supported international USD rule applies
  if (isBangladesh) {
    return 'BDT';
  }
  if (params.allowInternationalUsd || params.requestedCurrency === 'USD') {
    return 'USD';
  }
  return params.requestedCurrency === 'BDT' ? 'BDT' : 'USD';
}

export function resolveAuthoritativeItems(
  requestedItems: CheckoutItemRequest[],
  sellerCreatedProducts: ApiSellerProductRecord[],
  productOverrides: Record<string, ProductOverride>,
  dynamicCatalogSkus: AuthoritativeCatalogSku[] = []
): { resolvedItems: CartItem[]; shippingInputs: ShippingQuoteItemInput[]; subtotalUsd: number } {
  const resolvedItems: CartItem[] = [];
  const shippingInputs: ShippingQuoteItemInput[] = [];
  let subtotalUsd = 0;

  for (const reqItem of requestedItems) {
    const qty = Math.max(1, Math.min(50, Math.round(Number(reqItem.quantity) || 1)));
    const catalogSku =
      dynamicCatalogSkus.find((s) => s.id === reqItem.productId) ||
      AUTHORITATIVE_CATALOG_SKUS.find((s) => s.id === reqItem.productId);
    const sellerSku = sellerCreatedProducts.find((s) => s.id === reqItem.productId);
    const override = productOverrides[reqItem.productId];

    if (!catalogSku && !sellerSku) {
      throw new Error(`Unknown product SKU: ${reqItem.productId}`);
    }

    const basePriceUsd =
      typeof override?.price === 'number' && override.price > 0
        ? override.price
        : catalogSku
        ? catalogSku.priceUsd
        : sellerSku!.price;

    const weightKg = catalogSku?.weightKg ?? sellerSku?.weightKg ?? 1.0;
    const sizeTier = catalogSku?.sizeTier ?? sellerSku?.sizeTier ?? 'small';
    const codEligible = catalogSku?.codEligible ?? sellerSku?.codEligible ?? true;
    const stockCount =
      typeof override?.stockCount === 'number'
        ? override.stockCount
        : catalogSku?.stockCount ?? sellerSku?.stockCount ?? 10;

    subtotalUsd += basePriceUsd * qty;

    shippingInputs.push({
      quantity: qty,
      weightKg,
      sizeTier,
      codEligible,
    });

    resolvedItems.push({
      key: `${reqItem.productId}::${reqItem.color || 'Studio Edition'}::${reqItem.size || 'Standard'}`,
      productId: reqItem.productId,
      name: catalogSku?.name || sellerSku?.name || reqItem.name || 'Marketplace Item',
      brand: sellerSku?.brand || reqItem.brand || 'Kinto Partner Studio',
      category: sellerSku?.category || reqItem.category || 'electronics-tech',
      slug: sellerSku?.slug || reqItem.slug || reqItem.productId,
      image: '',
      price: basePriceUsd,
      color: reqItem.color || 'Studio Finish',
      colorHex: reqItem.colorHex || '#2D2C2A',
      size: reqItem.size || 'Standard Edition',
      quantity: qty,
      stockCount,
      weightKg,
      sizeTier,
    });
  }

  return {
    resolvedItems,
    shippingInputs,
    subtotalUsd: roundCurrencyAmount(subtotalUsd, 'USD'),
  };
}

export type PromoCandidate = Pick<
  PromoCode,
  'code' | 'discountType' | 'value' | 'minSubtotal' | 'description'
> & { active?: boolean };

export function resolveActivePromo(rawCode: string | undefined): PromoCandidate | null;
export function resolveActivePromo<T extends PromoCandidate>(
  rawCode: string | undefined,
  promotions: ReadonlyArray<T>
): T | null;
export function resolveActivePromo(
  rawCode: string | undefined,
  promotions: ReadonlyArray<PromoCandidate> = PROMO_CODES
): PromoCandidate | null {
  const promoRaw = (rawCode || '').trim().toUpperCase();
  if (!promoRaw) return null;
  const found = promotions.find((p) => p.code.toUpperCase() === promoRaw && p.active !== false);
  return found ?? null;
}

export function buildAuthoritativeCheckoutQuote(params: {
  request: CheckoutQuoteRequest;
  sellerCreatedProducts: ApiSellerProductRecord[];
  productOverrides: Record<string, ProductOverride>;
  currencyState: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
  dynamicCatalogSkus?: AuthoritativeCatalogSku[];
  promotions?: PromoCandidate[];
}): { quote: CheckoutQuoteResponse; resolvedItems: CartItem[] } {
  const {
    request,
    sellerCreatedProducts,
    productOverrides,
    currencyState,
    shippingConfig,
    dynamicCatalogSkus = [],
    promotions = PROMO_CODES.map((p) => ({ ...p, active: true })),
  } = params;
  if (!Array.isArray(request.items) || request.items.length === 0) {
    throw new Error('Shopping bag cannot be empty.');
  }

  const { resolvedItems, shippingInputs, subtotalUsd } = resolveAuthoritativeItems(
    request.items,
    sellerCreatedProducts,
    productOverrides,
    dynamicCatalogSkus
  );

  const transactionCurrency = resolveTransactionCurrency({
    country: request.address?.country,
    requestedCurrency: request.requestedCurrency,
    allowInternationalUsd: request.allowInternationalUsd,
  });

  const promoObj = resolveActivePromo(request.promoCode, promotions);
  const promoApplied = promoObj && subtotalUsd >= promoObj.minSubtotal ? promoObj.code : undefined;

  const shippingQuote = calculateShippingQuote({
    address: request.address || { country: 'Bangladesh' },
    subtotalUsd,
    items: shippingInputs,
    promoCode: promoApplied,
    currency: transactionCurrency,
    currencyState,
    config: shippingConfig,
  });

  const selectedOption =
    shippingQuote.options.find((opt) => opt.id === request.deliveryMethod) ||
    shippingQuote.options.find((opt) => opt.available) ||
    shippingQuote.options[0];

  const shippingUsd = selectedOption?.available ? selectedOption.costUsd : 0;

  let discountUsd = 0;
  if (promoObj && promoApplied && promoObj.discountType === 'percent') {
    discountUsd = roundCurrencyAmount((subtotalUsd * promoObj.value) / 100, 'USD');
  }

  const taxableBaseUsd = Math.max(0, subtotalUsd - discountUsd);
  // Standard VAT/duty estimate (5% on Bangladesh/Global retail goods)
  const taxUsd = roundCurrencyAmount(taxableBaseUsd * 0.05, 'USD');
  const totalUsd = roundCurrencyAmount(taxableBaseUsd + taxUsd + shippingUsd, 'USD');

  const currencySnapshot = buildOrderCurrencySnapshot(
    subtotalUsd,
    totalUsd,
    transactionCurrency,
    currencyState
  );

  const candidateMethods: PaymentMethodId[] = [];
  const isBangladesh = (request.address?.country || 'Bangladesh').trim().toLowerCase() === 'bangladesh';
  if (isBangladesh) {
    candidateMethods.push('cod', 'bkash', 'nagad', 'rocket', 'visa', 'mastercard', 'sslcommerz', 'bank-transfer');
  } else {
    candidateMethods.push('visa', 'mastercard', 'bank-transfer', 'sslcommerz');
  }

  const allowedPaymentMethods: PaymentMethodId[] = [];
  const paymentMethodAvailability: Partial<
    Record<PaymentMethodId, { enabled: boolean; reason?: string }>
  > = {};

  for (const methodId of candidateMethods) {
    if (methodId === 'cod') {
      if (isBangladesh && shippingQuote.codEligible) {
        allowedPaymentMethods.push('cod');
        paymentMethodAvailability.cod = { enabled: true };
      } else {
        paymentMethodAvailability.cod = {
          enabled: false,
          reason: shippingQuote.codReason || 'Cash on Delivery is unavailable for this order.',
        };
      }
      continue;
    }

    const status = getCheckoutChannelStatus(methodId);
    paymentMethodAvailability[methodId] = { enabled: status.enabled, reason: status.reason };
    if (status.enabled) {
      allowedPaymentMethods.push(methodId);
    }
  }

  const subtotalCharged = convertUsdToCurrency(subtotalUsd, transactionCurrency, currencyState);
  const discountCharged = convertUsdToCurrency(discountUsd, transactionCurrency, currencyState);
  const taxCharged = convertUsdToCurrency(taxUsd, transactionCurrency, currencyState);
  const shippingCharged = convertUsdToCurrency(shippingUsd, transactionCurrency, currencyState);
  const totalCharged = currencySnapshot.chargedTotal;

  return {
    resolvedItems,
    quote: {
      currency: transactionCurrency,
      currencySnapshot,
      shippingQuote,
      subtotalUsd,
      discountUsd,
      taxUsd,
      shippingUsd,
      totalUsd,
      subtotalCharged,
      discountCharged,
      taxCharged,
      shippingCharged,
      totalCharged,
      promoApplied,
      allowedPaymentMethods,
      paymentMethodAvailability,
    },
  };
}

export interface PendingSessionContext {
  session: PaymentSession;
  quote: CheckoutQuoteResponse;
  items: CartItem[];
  customer: {
    customerName: string;
    email: string;
    phone: string;
    shippingAddress: Order['shippingAddress'];
    deliveryMethod: DeliveryMethodId;
  };
  policyAcceptance?: LegalAcceptanceRecord;
}

export function createPaymentSession(params: {
  idempotencyKey: string;
  paymentMethod: PaymentMethodId;
  customer: PendingSessionContext['customer'];
  quoteRequest: CheckoutQuoteRequest;
  sellerCreatedProducts: ApiSellerProductRecord[];
  productOverrides: Record<string, ProductOverride>;
  currencyState: CurrencyRateState;
  shippingConfig: ShippingRuleConfig;
  existingSessions: Map<string, PendingSessionContext>;
  policyAcceptance?: LegalAcceptanceRecord;
  dynamicCatalogSkus?: AuthoritativeCatalogSku[];
  promotions?: PromoCandidate[];
}): PendingSessionContext {
  const cleanKey = params.idempotencyKey.trim();
  for (const ctx of params.existingSessions.values()) {
    if (
      ctx.session.idempotencyKey === cleanKey &&
      !['failed', 'cancelled'].includes(ctx.session.status)
    ) {
      return ctx;
    }
  }

  const { quote, resolvedItems } = buildAuthoritativeCheckoutQuote({
    request: params.quoteRequest,
    sellerCreatedProducts: params.sellerCreatedProducts,
    productOverrides: params.productOverrides,
    currencyState: params.currencyState,
    shippingConfig: params.shippingConfig,
    dynamicCatalogSkus: params.dynamicCatalogSkus,
    promotions: params.promotions,
  });

  if (quote.shippingQuote.restricted) {
    throw new Error(
      quote.shippingQuote.restrictionReason ||
        'Selected delivery address falls inside a restricted carrier zone.'
    );
  }

  const selectedDelivery = quote.shippingQuote.options.find(
    (o) => o.id === params.customer.deliveryMethod
  );
  if (!selectedDelivery || !selectedDelivery.available) {
    throw new Error(
      selectedDelivery?.reason || 'Selected delivery method is not available for this address or cart.'
    );
  }

  if (params.paymentMethod === 'cod' && !quote.shippingQuote.codEligible) {
    throw new Error(
      quote.shippingQuote.codReason || 'Cash on Delivery is not eligible for this order.'
    );
  }

  const gatewayStatus = getCheckoutChannelStatus(params.paymentMethod);
  if (!gatewayStatus.enabled) {
    throw new Error(
      gatewayStatus.reason || 'Selected online payment gateway is not configured.'
    );
  }

  if (!quote.allowedPaymentMethods.includes(params.paymentMethod)) {
    throw new Error(`Payment method ${params.paymentMethod} is unavailable for the selected region.`);
  }

  const adapter = PROVIDER_ADAPTERS[params.paymentMethod] || PROVIDER_ADAPTERS.sslcommerz;
  const now = new Date().toISOString();
  const id = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const transactionRef = `KS-${params.paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 899999)}`;
  const status: PaymentStatus = params.paymentMethod === 'cod' ? 'cod_pending' : 'pending';

  const session: PaymentSession = {
    id,
    idempotencyKey: cleanKey,
    transactionRef,
    provider: adapter.provider,
    paymentMethod: params.paymentMethod,
    status,
    amount: quote.totalCharged,
    currency: quote.currency,
    baseAmountUsd: quote.totalUsd,
    currencySnapshot: quote.currencySnapshot,
    createdAt: now,
    updatedAt: now,
    gatewayInstructions: adapter.buildInstructions(transactionRef, quote.totalCharged, quote.currency),
  };

  const context: PendingSessionContext = {
    session,
    quote,
    items: resolvedItems,
    customer: params.customer,
    policyAcceptance: params.policyAcceptance,
  };

  params.existingSessions.set(id, context);
  return context;
}

export function buildVerifiedOrderFromSession(
  ctx: PendingSessionContext,
  outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed',
  verificationDetail?: { failureReason?: string; walletNumber?: string; cardLast4?: string }
): { session: PaymentSession; order?: Order } {
  const nowIso = new Date().toISOString();

  if (ctx.session.orderId && ['paid', 'cod_pending'].includes(ctx.session.status)) {
    // Idempotent guard — order already created
    return { session: ctx.session };
  }

  if (outcome === 'failed') {
    ctx.session.status = 'failed';
    ctx.session.failureReason =
      verificationDetail?.failureReason ||
      `${ctx.session.provider} declined authorization or timed out. No charge captured.`;
    ctx.session.updatedAt = nowIso;
    return { session: ctx.session };
  }

  if (outcome === 'cancelled') {
    ctx.session.status = 'cancelled';
    ctx.session.failureReason =
      verificationDetail?.failureReason || 'Customer cancelled gateway authorization prior to settlement.';
    ctx.session.updatedAt = nowIso;
    return { session: ctx.session };
  }

  const finalStatus: PaymentStatus =
    ctx.session.paymentMethod === 'cod' ? 'cod_pending' : 'paid';

  ctx.session.status = finalStatus;
  ctx.session.updatedAt = nowIso;

  const adapter = PROVIDER_ADAPTERS[ctx.session.paymentMethod] || PROVIDER_ADAPTERS.sslcommerz;
  const deliveryOption =
    ctx.quote.shippingQuote.options.find((o) => o.id === ctx.customer.deliveryMethod) ||
    ctx.quote.shippingQuote.options[0];

  const orderId = `KS-${Math.floor(10510 + Math.random() * 89480)}`;
  ctx.session.orderId = orderId;

  const nowDisplay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

  const rawSuffix =
    verificationDetail?.walletNumber?.trim() ||
    verificationDetail?.cardLast4?.trim() ||
    '';
  const cleanedSuffix = rawSuffix.replace(/\D/g, '').slice(-4);
  const walletSuffix = cleanedSuffix ? ` (${cleanedSuffix})` : '';

  const order: Order = {
    id: orderId,
    createdAt: nowIso,
    customerName: ctx.customer.customerName,
    email: ctx.customer.email,
    phone: ctx.customer.phone,
    shippingAddress: ctx.customer.shippingAddress,
    deliveryMethod: ctx.customer.deliveryMethod,
    deliveryLabel: deliveryOption?.title || 'Standard Tracked Courier',
    estimatedArrival: deliveryOption?.eta || '2–4 Business Days',
    courierName: deliveryOption?.courier || 'Kinto Regional Express',
    trackingNumber: `KS-${ctx.quote.shippingQuote.zoneId === 'international' ? 'GLB' : 'BD'}-${Math.floor(100000 + Math.random() * 899999)}`,
    paymentMethod: ctx.session.paymentMethod,
    paymentLabel: `${adapter.label}${walletSuffix}`,
    paymentStatus: finalStatus,
    transactionRef: ctx.session.transactionRef,
    gatewayProvider: ctx.session.provider,
    currencySnapshot: ctx.quote.currencySnapshot,
    promoCode: ctx.quote.promoApplied,
    items: ctx.items,
    subtotal: ctx.quote.subtotalUsd,
    shippingCost: ctx.quote.shippingUsd,
    taxAmount: ctx.quote.taxUsd,
    discountAmount: ctx.quote.discountUsd,
    total: ctx.quote.totalUsd,
    currentStage: 'Confirmed',
    policyAcceptance: ctx.policyAcceptance,
    timeline: [
      {
        stage: 'Confirmed',
        timestamp: nowDisplay,
        note:
          finalStatus === 'paid'
            ? `Server-verified settlement via ${adapter.provider} (${ctx.session.transactionRef})`
            : `Cash on Delivery docket verified (${ctx.session.transactionRef})`,
        completed: true,
      },
      {
        stage: 'Processing',
        timestamp: 'Pending',
        note: 'Fulfillment allocation & studio quality check',
        completed: false,
      },
      {
        stage: 'Packed',
        timestamp: 'Pending',
        note: 'Protective dispatch packaging',
        completed: false,
      },
      {
        stage: 'Shipped',
        timestamp: 'Pending',
        note: `Handover to ${deliveryOption?.courier || 'carrier'}`,
        completed: false,
      },
      {
        stage: 'Out for Delivery',
        timestamp: 'Pending',
        note: 'Local rider dispatched to area hub',
        completed: false,
      },
      {
        stage: 'Delivered',
        timestamp: deliveryOption?.eta || 'Estimated 2–4 days',
        note:
          finalStatus === 'cod_pending'
            ? 'Inspect parcel and collect cash receipt'
            : 'Signature confirmation at delivery address',
        completed: false,
      },
    ],
  };

  return { session: ctx.session, order };
}
