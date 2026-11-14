import { BANGLADESH_GEO_TREE } from '../shared/marketplaceSchema.ts';
import type {
  CurrencyCode,
  CurrencyRateState,
  ProductSizeTier,
  ShippingQuoteOption,
  ShippingQuoteResponse,
  ShippingRuleConfig,
  ShippingZoneId,
  ShippingZoneRule,
} from '../../src/types/commerce.ts';
import { convertUsdToCurrency, roundCurrencyAmount } from './currencyService.ts';

export function createInitialShippingConfig(): ShippingRuleConfig {
  const zones: ShippingZoneRule[] = [
    {
      zoneId: 'dhaka_metro',
      label: 'Dhaka Metro (North & South City)',
      standardFeeUsd: 0.7, // ~85 BDT
      expressFeeUsd: 1.65, // ~200 BDT
      expressAvailable: true,
      whiteGloveFeeUsd: 12,
      whiteGloveAvailable: true,
      freeThresholdUsd: 120,
      baseWeightAllowanceKg: 3,
      perExtraKgUsd: 0.25,
      bulkySurchargeUsd: 3.5,
      freightSurchargeUsd: 15,
      standardEta: '24–48 Hours (Next-Day Metro)',
      expressEta: 'Same-Day / 4–8 Hours Dispatch',
      whiteGloveEta: 'Scheduled 2-Person Room Assembly (1–2 Days)',
      codEligible: true,
      codMaxOrderUsd: 650,
      isRestricted: false,
    },
    {
      zoneId: 'dhaka_suburbs',
      label: 'Dhaka Suburbs (Savar, Gazipur, Narayanganj, Keraniganj)',
      standardFeeUsd: 1.0, // ~121 BDT
      expressFeeUsd: 2.2, // ~265 BDT
      expressAvailable: true,
      whiteGloveFeeUsd: 18,
      whiteGloveAvailable: true,
      freeThresholdUsd: 160,
      baseWeightAllowanceKg: 2.5,
      perExtraKgUsd: 0.35,
      bulkySurchargeUsd: 4.5,
      freightSurchargeUsd: 20,
      standardEta: '2–3 Business Days',
      expressEta: 'Next Business Day',
      whiteGloveEta: 'Scheduled Delivery & Placement (2–3 Days)',
      codEligible: true,
      codMaxOrderUsd: 550,
      isRestricted: false,
    },
    {
      zoneId: 'chattogram_sylhet_metro',
      label: 'Chattogram & Sylhet City Hubs',
      standardFeeUsd: 1.25, // ~150 BDT
      expressFeeUsd: 2.9, // ~350 BDT
      expressAvailable: true,
      whiteGloveFeeUsd: 26,
      whiteGloveAvailable: true,
      freeThresholdUsd: 220,
      baseWeightAllowanceKg: 2,
      perExtraKgUsd: 0.4,
      bulkySurchargeUsd: 6.0,
      freightSurchargeUsd: 28,
      standardEta: '2–4 Business Days',
      expressEta: 'Air Express · 1–2 Business Days',
      whiteGloveEta: 'Regional Scheduled Freight (3–5 Days)',
      codEligible: true,
      codMaxOrderUsd: 500,
      isRestricted: false,
    },
    {
      zoneId: 'nationwide_district',
      label: 'All 64 Districts & Upazila Hubs (Bangladesh)',
      standardFeeUsd: 1.5, // ~180 BDT
      expressFeeUsd: 3.4,
      expressAvailable: false,
      whiteGloveFeeUsd: 35,
      whiteGloveAvailable: false,
      freeThresholdUsd: 300,
      baseWeightAllowanceKg: 2,
      perExtraKgUsd: 0.45,
      bulkySurchargeUsd: 7.5,
      freightSurchargeUsd: 38,
      standardEta: '3–5 Business Days',
      expressEta: 'Unavailable in outer district',
      whiteGloveEta: 'Curbside district freight only',
      codEligible: true,
      codMaxOrderUsd: 400,
      isRestricted: false,
    },
    {
      zoneId: 'remote_restricted',
      label: 'Offshore Islands & Restricted Marine Char Zones',
      standardFeeUsd: 4.0,
      expressFeeUsd: 8.0,
      expressAvailable: false,
      whiteGloveFeeUsd: 0,
      whiteGloveAvailable: false,
      freeThresholdUsd: 99999,
      baseWeightAllowanceKg: 1,
      perExtraKgUsd: 1.2,
      bulkySurchargeUsd: 18,
      freightSurchargeUsd: 90,
      standardEta: 'Service Restricted',
      expressEta: 'Unavailable',
      whiteGloveEta: 'Unavailable',
      codEligible: false,
      codMaxOrderUsd: 0,
      isRestricted: true,
      restrictionReason: 'Offshore island / seasonal marine ferry crossing currently restricted for direct courier delivery.',
    },
    {
      zoneId: 'international',
      label: 'International Air Freight (North America / EU / APAC)',
      standardFeeUsd: 24,
      expressFeeUsd: 48,
      expressAvailable: true,
      whiteGloveFeeUsd: 120,
      whiteGloveAvailable: true,
      freeThresholdUsd: 500,
      baseWeightAllowanceKg: 3,
      perExtraKgUsd: 4.5,
      bulkySurchargeUsd: 28,
      freightSurchargeUsd: 95,
      standardEta: '5–9 Business Days',
      expressEta: '2–4 Business Days (DHL Air)',
      whiteGloveEta: '5–10 Business Days White-Glove',
      codEligible: false,
      codMaxOrderUsd: 0,
      isRestricted: false,
    },
  ];

  return {
    zones,
    restrictedAreaKeywords: ['sandwip', 'saint martin', 'st. martin', 'monpura', 'hatiya', 'nijhum dwip'],
    updatedAt: new Date().toISOString(),
  };
}

export interface AddressResolutionResult {
  zoneId: ShippingZoneId;
  areaRestricted: boolean;
  areaRestrictionReason?: string;
}

export function resolveAddressZone(
  address: {
    country?: string;
    state?: string;
    city?: string;
    upazila?: string;
    area?: string;
  },
  config: ShippingRuleConfig
): AddressResolutionResult {
  const country = (address.country || 'Bangladesh').trim().toLowerCase();
  if (country !== 'bangladesh') {
    return { zoneId: 'international', areaRestricted: false };
  }

  const combinedText = [address.state, address.city, address.upazila, address.area]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check explicit restricted keywords first
  for (const kw of config.restrictedAreaKeywords) {
    if (kw && combinedText.includes(kw.toLowerCase())) {
      return {
        zoneId: 'remote_restricted',
        areaRestricted: true,
        areaRestrictionReason: `Delivery to "${address.area || address.upazila || kw}" is currently suspended under restricted marine/char carrier rules.`,
      };
    }
  }

  // Exact/normalized match in BANGLADESH_GEO_TREE
  for (const div of BANGLADESH_GEO_TREE) {
    for (const dist of div.districts) {
      for (const upa of dist.upazilas) {
        for (const areaEntry of upa.areas) {
          const areaLower = areaEntry.name.toLowerCase();
          const inputArea = (address.area || '').trim().toLowerCase();
          if (
            inputArea &&
            (areaLower === inputArea || areaLower.includes(inputArea) || inputArea.includes(areaLower))
          ) {
            return {
              zoneId: areaEntry.zoneId,
              areaRestricted: Boolean(areaEntry.restricted),
              areaRestrictionReason: areaEntry.restrictionNote,
            };
          }
        }
        if (
          address.upazila &&
          upa.name.toLowerCase() === address.upazila.trim().toLowerCase() &&
          upa.areas[0]
        ) {
          const sample = upa.areas[0];
          return {
            zoneId: sample.zoneId,
            areaRestricted: Boolean(sample.restricted),
            areaRestrictionReason: sample.restrictionNote,
          };
        }
      }
    }
  }

  // Fallback heuristics for free-text Dhaka / Chattogram / Sylhet entries
  if (
    combinedText.includes('savar') ||
    combinedText.includes('gazipur') ||
    combinedText.includes('narayanganj') ||
    combinedText.includes('keraniganj') ||
    combinedText.includes('tongi')
  ) {
    return { zoneId: 'dhaka_suburbs', areaRestricted: false };
  }
  if (
    combinedText.includes('dhaka north') ||
    combinedText.includes('dhaka south') ||
    combinedText.includes('dhaka metro') ||
    combinedText.includes('banani') ||
    combinedText.includes('gulshan') ||
    combinedText.includes('dhanmondi') ||
    combinedText.includes('uttara') ||
    combinedText.includes('mirpur') ||
    combinedText.includes('bashundhara') ||
    (combinedText.includes('dhaka') && !combinedText.includes('tangail'))
  ) {
    return { zoneId: 'dhaka_metro', areaRestricted: false };
  }
  if (combinedText.includes('chattogram city') || combinedText.includes('sylhet city') || combinedText.includes('gec') || combinedText.includes('zindabazar')) {
    return { zoneId: 'chattogram_sylhet_metro', areaRestricted: false };
  }

  return { zoneId: 'nationwide_district', areaRestricted: false };
}

export interface ShippingQuoteItemInput {
  quantity: number;
  weightKg: number;
  sizeTier: ProductSizeTier;
  codEligible: boolean;
}

export function calculateShippingQuote(params: {
  address: { country?: string; state?: string; city?: string; upazila?: string; area?: string };
  subtotalUsd: number;
  items: ShippingQuoteItemInput[];
  promoCode?: string;
  currency: CurrencyCode;
  currencyState: CurrencyRateState;
  config: ShippingRuleConfig;
}): ShippingQuoteResponse {
  const { address, subtotalUsd, items, promoCode, currency, currencyState, config } = params;
  const resolution = resolveAddressZone(address, config);
  const zone =
    config.zones.find((z) => z.zoneId === resolution.zoneId) ||
    config.zones[config.zones.length - 1];

  const isRestricted = zone.isRestricted || resolution.areaRestricted;
  const restrictionReason =
    resolution.areaRestrictionReason || zone.restrictionReason || undefined;

  const totalWeightKg = Math.round(
    items.reduce((sum, i) => sum + Math.max(0.1, i.weightKg) * Math.max(1, i.quantity), 0) * 100
  ) / 100;

  const hasFreight = items.some((i) => i.sizeTier === 'freight');
  const hasBulky = items.some((i) => i.sizeTier === 'bulky');
  const hasBulkyItems = hasFreight || hasBulky;

  const excessKg = Math.max(0, totalWeightKg - zone.baseWeightAllowanceKg);
  const weightSurchargeUsd = excessKg * zone.perExtraKgUsd;
  const sizeSurchargeUsd = hasFreight
    ? zone.freightSurchargeUsd
    : hasBulky
    ? zone.bulkySurchargeUsd
    : 0;

  const isFreeShipPromo = (promoCode || '').trim().toUpperCase() === 'FREESHIP';
  const meetsFreeThreshold = subtotalUsd >= zone.freeThresholdUsd && !hasFreight;

  const standardCostUsd = isRestricted
    ? 0
    : isFreeShipPromo || meetsFreeThreshold
    ? roundCurrencyAmount(weightSurchargeUsd * 0.5, 'USD') // promo waives base fee; heavy overweight keeps half
    : roundCurrencyAmount(zone.standardFeeUsd + weightSurchargeUsd + sizeSurchargeUsd, 'USD');

  const expressCostUsd =
    isRestricted || !zone.expressAvailable || hasFreight
      ? 0
      : roundCurrencyAmount(zone.expressFeeUsd + weightSurchargeUsd + sizeSurchargeUsd, 'USD');

  const whiteGloveCostUsd =
    isRestricted || !zone.whiteGloveAvailable
      ? 0
      : roundCurrencyAmount(zone.whiteGloveFeeUsd + weightSurchargeUsd, 'USD');

  const allItemsAllowCod = items.every((i) => i.codEligible);
  let codEligible = true;
  let codReason: string | undefined;

  if (isRestricted) {
    codEligible = false;
    codReason = 'Restricted delivery zone does not support dispatch or COD.';
  } else if (!zone.codEligible) {
    codEligible = false;
    codReason = `Cash on Delivery is unavailable for ${zone.label}.`;
  } else if (!allItemsAllowCod || hasFreight) {
    codEligible = false;
    codReason = 'Heavy freight or white-glove furniture requires prepaid digital verification.';
  } else if (subtotalUsd > zone.codMaxOrderUsd) {
    codEligible = false;
    codReason = `Orders above ${convertUsdToCurrency(zone.codMaxOrderUsd, currency, currencyState).toLocaleString()} ${currency} require digital prepayment.`;
  }

  const freeShippingRemainingUsd = Math.max(
    0,
    roundCurrencyAmount(zone.freeThresholdUsd - subtotalUsd, 'USD')
  );

  const options: ShippingQuoteOption[] = [
    {
      id: 'standard',
      title: 'Standard Tracked Courier',
      eta: zone.standardEta,
      courier: zone.zoneId === 'international' ? 'DHL Global Freight' : 'Steadfast & Pathao Studio Ground',
      costUsd: standardCostUsd,
      costDisplay: convertUsdToCurrency(standardCostUsd, currency, currencyState),
      available: !isRestricted,
      reason: isRestricted ? restrictionReason : undefined,
    },
    {
      id: 'express',
      title: 'Express Priority Dispatch',
      eta: zone.expressEta,
      courier: zone.zoneId === 'international' ? 'DHL Express Air' : 'RedX Priority Air & Same-Day',
      costUsd: expressCostUsd,
      costDisplay: convertUsdToCurrency(expressCostUsd, currency, currencyState),
      available: !isRestricted && zone.expressAvailable && !hasFreight,
      reason: isRestricted
        ? restrictionReason
        : !zone.expressAvailable
        ? 'Express lane unavailable in this zone.'
        : hasFreight
        ? 'Oversized furniture items require Standard or White-Glove freight.'
        : undefined,
    },
    {
      id: 'white-glove',
      title: 'White-Glove Room Placement',
      eta: zone.whiteGloveEta,
      courier: 'Kinto Atelier Specialist Fleet',
      costUsd: whiteGloveCostUsd,
      costDisplay: convertUsdToCurrency(whiteGloveCostUsd, currency, currencyState),
      available: !isRestricted && zone.whiteGloveAvailable,
      reason: isRestricted
        ? restrictionReason
        : !zone.whiteGloveAvailable
        ? 'White-glove crew is limited to major metro zones.'
        : undefined,
    },
  ];

  return {
    zoneId: zone.zoneId,
    zoneLabel: zone.label,
    restricted: isRestricted,
    restrictionReason,
    codEligible,
    codReason,
    totalWeightKg,
    hasBulkyItems,
    freeShippingThresholdUsd: zone.freeThresholdUsd,
    freeShippingRemainingUsd,
    options,
  };
}
