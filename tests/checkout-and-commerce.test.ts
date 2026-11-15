import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOrderCurrencySnapshot,
  convertUsdToCurrency,
  createInitialCurrencyState,
  roundCurrencyAmount,
} from '../server/services/currencyService.ts';
import {
  calculateShippingQuote,
  createInitialShippingConfig,
  resolveAddressZone,
} from '../server/services/shippingService.ts';
import {
  buildAuthoritativeCheckoutQuote,
  buildVerifiedOrderFromSession,
  createPaymentSession,
  type PendingSessionContext,
} from '../server/services/paymentService.ts';

test('currency rounding enforces integer-ceil BDT and 2-decimal USD snapshots', () => {
  const currencyState = {
    ...createInitialCurrencyState(),
    rates: { USD: 1, BDT: 120.5 },
  };

  assert.equal(roundCurrencyAmount(100.12, 'BDT'), 101);
  assert.equal(roundCurrencyAmount(100.126, 'USD'), 100.13);
  assert.equal(convertUsdToCurrency(10, 'BDT', currencyState), 1205);

  const snap = buildOrderCurrencySnapshot(100, 105.01, 'BDT', currencyState);
  assert.equal(snap.transactionCurrency, 'BDT');
  assert.equal(snap.exchangeRate, 120.5);
  assert.equal(snap.chargedTotal, Math.ceil(105.01 * 120.5));
});

test('shipping rules resolve Dhaka Metro, block Sandwip restricted marine islands, and block COD for freight', () => {
  const shippingConfig = createInitialShippingConfig();
  const currencyState = createInitialCurrencyState();

  const metro = resolveAddressZone(
    { country: 'Bangladesh', state: 'Dhaka', city: 'Dhaka', area: 'Gulshan 1 & 2' },
    shippingConfig
  );
  assert.equal(metro.zoneId, 'dhaka_metro');
  assert.equal(metro.areaRestricted, false);

  const sandwip = resolveAddressZone(
    { country: 'Bangladesh', state: 'Chattogram', city: 'Chattogram', upazila: 'Sandwip Upazila', area: 'Sandwip Offshore Island' },
    shippingConfig
  );
  assert.equal(sandwip.zoneId, 'remote_restricted');
  assert.equal(sandwip.areaRestricted, true);

  const freightQuote = calculateShippingQuote({
    address: { country: 'Bangladesh', state: 'Dhaka', city: 'Dhaka', area: 'Banani' },
    subtotalUsd: 1280,
    items: [{ quantity: 1, weightKg: 19.5, sizeTier: 'freight', codEligible: false }],
    currency: 'BDT',
    currencyState,
    config: shippingConfig,
  });
  assert.equal(freightQuote.codEligible, false);
  assert.equal(freightQuote.hasBulkyItems, true);
  assert.equal(freightQuote.options.find((o) => o.id === 'express')?.available, false);
});

test('buildAuthoritativeCheckoutQuote ignores client pricing and applies qualifying promos authoritatively', () => {
  const currencyState = createInitialCurrencyState();
  const shippingConfig = createInitialShippingConfig();

  // prod-aeterna-headphones has authoritative priceUsd = 420, sizeTier = 'small', codEligible = true
  const { quote } = buildAuthoritativeCheckoutQuote({
    request: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      address: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
      },
      deliveryMethod: 'standard',
      promoCode: 'STUDIO15',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
  });

  // Authoritative subtotal ($420) qualifies for STUDIO15 (min $300 -> 15% = $63)
  assert.equal(quote.currency, 'BDT');
  assert.equal(quote.subtotalUsd, 420);
  assert.equal(quote.promoApplied, 'STUDIO15');
  assert.equal(quote.discountUsd, 63);
  assert.equal(quote.taxUsd, 17.85);
  assert.ok(quote.allowedPaymentMethods.includes('cod'));
});

test('payment sessions preserve idempotency and enforce COD vs failed settlement rules', () => {
  const currencyState = createInitialCurrencyState();
  const shippingConfig = createInitialShippingConfig();
  const existingSessions = new Map<string, PendingSessionContext>();

  const customer = {
    customerName: 'Rafiqul Islam',
    email: 'rafiq.islam@kintostudio.bd',
    phone: '+8801711240914',
    shippingAddress: {
      country: 'Bangladesh',
      state: 'Dhaka',
      city: 'Dhaka',
      upazila: 'Dhaka North City Corporation',
      area: 'Gulshan 1 & 2',
      streetAddress: 'House 18, Road 71',
      postalCode: '1212',
    },
    deliveryMethod: 'standard' as const,
  };

  const ctx1 = createPaymentSession({
    idempotencyKey: 'idem-unit-test-1',
    paymentMethod: 'cod',
    customer,
    quoteRequest: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      address: customer.shippingAddress,
      deliveryMethod: 'standard',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
    existingSessions,
  });

  // Re-using same idempotencyKey returns existing session without duplication
  const ctx2 = createPaymentSession({
    idempotencyKey: 'idem-unit-test-1',
    paymentMethod: 'cod',
    customer,
    quoteRequest: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      address: customer.shippingAddress,
      deliveryMethod: 'standard',
    },
    sellerCreatedProducts: [],
    productOverrides: {},
    currencyState,
    shippingConfig,
    existingSessions,
  });

  assert.equal(ctx1.session.id, ctx2.session.id);

  // Confirm COD session produces order once
  const firstVerify = buildVerifiedOrderFromSession(ctx1, 'cod_confirmed');
  assert.ok(firstVerify.order);
  assert.equal(firstVerify.order.paymentStatus, 'cod_pending');
  assert.equal(firstVerify.order.currentStage, 'Confirmed');

  // Re-verifying the same session is an idempotent guard (no duplicate order)
  const secondVerify = buildVerifiedOrderFromSession(ctx1, 'cod_confirmed');
  assert.equal(secondVerify.order, undefined);
});
