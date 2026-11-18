import type {
  CookieInventoryItem,
  CurrencyRateState,
  LanguageCode,
  LegalDocumentId,
  ManagedPromoRecord,
  PaymentMethodId,
  PolicyCategory,
  PolicyDocumentRecord,
  PolicyFactsConfig,
  PolicyFactsPublicSummary,
  ShippingRuleConfig,
} from '../../../src/types/commerce.ts';
import {
  isPlaceholderValue,
  sanitizePlainText,
  sanitizePolicySections,
  stripInternalCounselNotes,
} from '../../../src/utils/policySanitizer.ts';
import { AR_POLICY_PACK } from './ar.ts';
import { BN_POLICY_PACK } from './bn.ts';
import { ES_POLICY_PACK } from './es.ts';
import { FR_POLICY_PACK } from './fr.ts';
import { HI_POLICY_PACK } from './hi.ts';
import {
  formatPolicyDateForLanguage,
  GATEWAY_TRANSLATIONS,
  getLocalizedDepartmentSafetyNotice,
  POLICY_CATEGORY_TRANSLATIONS,
  POLICY_FACTS_TRANSLATIONS,
  translateCookieInventoryItems,
} from './meta.ts';
import type { PolicyDynamicVars, PolicyLocalePack } from './types.ts';

export {
  formatPolicyDateForLanguage,
  getLocalizedDepartmentSafetyNotice,
  POLICY_CATEGORY_TRANSLATIONS,
  POLICY_FACTS_TRANSLATIONS,
  translateCookieInventoryItems,
};

const POLICY_LOCALE_PACKS: Partial<Record<LanguageCode, PolicyLocalePack>> = {
  bn: BN_POLICY_PACK,
  hi: HI_POLICY_PACK,
  ar: AR_POLICY_PACK,
  es: ES_POLICY_PACK,
  fr: FR_POLICY_PACK,
};

export const SUPPORTED_POLICY_LANGUAGES: ReadonlyArray<LanguageCode> = [
  'en',
  'bn',
  'hi',
  'ar',
  'es',
  'fr',
];

export function normalizePolicyLanguage(lang?: unknown): LanguageCode {
  if (
    lang === 'en' ||
    lang === 'bn' ||
    lang === 'hi' ||
    lang === 'ar' ||
    lang === 'es' ||
    lang === 'fr'
  ) {
    return lang;
  }
  return 'en';
}

export function translatePolicyCategory(
  category: PolicyCategory,
  lang: LanguageCode = 'en'
): string {
  const safeLang = normalizePolicyLanguage(lang);
  return POLICY_CATEGORY_TRANSLATIONS[category]?.[safeLang] ?? category;
}

export function localizePublicFactsSummary(
  facts: PolicyFactsConfig | PolicyFactsPublicSummary,
  lang: LanguageCode = 'en'
): PolicyFactsPublicSummary {
  const safeLang = normalizePolicyLanguage(lang);
  const meta = POLICY_FACTS_TRANSLATIONS[safeLang];

  const hasConfirmedEntityDetails =
    'hasConfirmedEntityDetails' in facts
      ? facts.hasConfirmedEntityDetails
      : !isPlaceholderValue(facts.legalEntityName) &&
        !isPlaceholderValue(facts.registrationTradeLicense) &&
        !isPlaceholderValue(facts.registeredAddress);

  const supportHoursRaw =
    isPlaceholderValue(facts.supportHours) ||
    facts.supportHours === 'Customer Support Desk (Email & Ticket Portal)'
      ? meta.defaultSupportHours
      : sanitizePlainText(facts.supportHours);

  const refundSlaRaw =
    !facts.refundSlaBusinessDays ||
    facts.refundSlaBusinessDays === '7 to 10 business days after quality inspection'
      ? meta.defaultRefundSlaBusinessDays
      : sanitizePlainText(facts.refundSlaBusinessDays);

  const cancelCutoffRaw =
    !facts.cancelPreDispatchCutoff ||
    facts.cancelPreDispatchCutoff === 'Any time before order status advances to Packed or Shipped'
      ? meta.defaultCancelPreDispatchCutoff
      : sanitizePlainText(facts.cancelPreDispatchCutoff);

  const operatingCountry =
    safeLang === 'en' || facts.operatingCountry !== 'Bangladesh'
      ? sanitizePlainText(facts.operatingCountry || meta.operatingCountry)
      : meta.operatingCountry;

  const governingLaw =
    safeLang === 'en' ||
    !facts.governingLaw ||
    facts.governingLaw === 'Laws of the People’s Republic of Bangladesh'
      ? safeLang === 'en'
        ? sanitizePlainText(facts.governingLaw || meta.governingLaw)
        : meta.governingLaw
      : sanitizePlainText(facts.governingLaw);

  const competentCourts =
    safeLang === 'en' ||
    !facts.competentCourts ||
    facts.competentCourts === 'Competent Courts in Dhaka, Bangladesh'
      ? safeLang === 'en'
        ? sanitizePlainText(facts.competentCourts || meta.competentCourts)
        : meta.competentCourts
      : sanitizePlainText(facts.competentCourts);

  const supportPhoneVal =
    facts.supportPhone && !isPlaceholderValue(facts.supportPhone)
      ? sanitizePlainText(facts.supportPhone)
      : undefined;

  return {
    tradingName: sanitizePlainText(facts.tradingName || 'Kinto Studio'),
    operatingCountry,
    supportEmail: sanitizePlainText(facts.supportEmail || 'support@kintostudio.bd'),
    legalEmail: sanitizePlainText(facts.legalEmail || 'legal@kintostudio.bd'),
    ...(supportPhoneVal ? { supportPhone: supportPhoneVal } : {}),
    supportHours: supportHoursRaw,
    returnWindowDays: Math.max(1, Math.round(Number(facts.returnWindowDays) || 14)),
    defectReportHours: Math.max(12, Math.round(Number(facts.defectReportHours) || 48)),
    refundSlaBusinessDays: refundSlaRaw,
    cancelPreDispatchCutoff: cancelCutoffRaw,
    marketplaceModelLabel:
      safeLang === 'en' && 'marketplaceModelLabel' in facts && facts.marketplaceModelLabel
        ? sanitizePlainText(facts.marketplaceModelLabel)
        : meta.marketplaceModelLabel,
    governingLaw,
    competentCourts,
    effectiveDate: formatPolicyDateForLanguage(sanitizePlainText(facts.effectiveDate), safeLang),
    hasConfirmedEntityDetails,
  };
}

export function buildLocalizedDynamicVars(params: {
  lang: LanguageCode;
  version: string;
  facts?: PolicyFactsConfig | PolicyFactsPublicSummary;
  shippingConfig?: ShippingRuleConfig;
  currencyConfig?: CurrencyRateState;
  promotions?: ManagedPromoRecord[];
  cookieInventory: CookieInventoryItem[];
  gatewayStatuses?: Array<{ method: Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>; enabled: boolean }>;
  baseFactsConfig?: PolicyFactsConfig;
}): PolicyDynamicVars {
  const safeLang = normalizePolicyLanguage(params.lang);
  const meta = POLICY_FACTS_TRANSLATIONS[safeLang];

  const pubFacts = params.baseFactsConfig
    ? localizePublicFactsSummary(params.baseFactsConfig, safeLang)
    : params.facts
    ? localizePublicFactsSummary(params.facts, safeLang)
    : {
        tradingName: 'Kinto Studio',
        operatingCountry: meta.operatingCountry,
        supportEmail: 'support@kintostudio.bd',
        legalEmail: 'legal@kintostudio.bd',
        supportHours: meta.defaultSupportHours,
        returnWindowDays: 14,
        defectReportHours: 48,
        refundSlaBusinessDays: meta.defaultRefundSlaBusinessDays,
        cancelPreDispatchCutoff: meta.defaultCancelPreDispatchCutoff,
        marketplaceModelLabel: meta.marketplaceModelLabel,
        governingLaw: meta.governingLaw,
        competentCourts: meta.competentCourts,
        effectiveDate: formatPolicyDateForLanguage('November 14, 2026', safeLang),
        hasConfirmedEntityDetails: false,
      };

  const bdtRate = params.currencyConfig?.rates?.BDT ?? 120.5;
  const dhakaZone = params.shippingConfig?.zones.find((z) => z.zoneId === 'dhaka_metro');
  const dhakaThresholdUsd = dhakaZone?.freeThresholdUsd ?? 120;
  const dhakaThresholdBdt = Math.ceil(dhakaThresholdUsd * bdtRate);
  const dhakaThresholdBdtFormatted = dhakaThresholdBdt.toLocaleString('en-US');

  const zoneRows =
    params.shippingConfig && params.shippingConfig.zones.length > 0
      ? params.shippingConfig.zones.map((z) => [
          z.label,
          z.isRestricted ? meta.suspendedStatus : z.standardEta,
          z.isRestricted
            ? meta.prepaidRestrictedStatus
            : z.codEligible
            ? meta.upToCodUsd(z.codMaxOrderUsd)
            : meta.prepaidOnlyStatus,
        ])
      : [[meta.defaultNationwideLabel, meta.defaultNationwideWindow, meta.defaultNationwideCod]];

  const defaultGateways: Array<{
    method: Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>;
    enabled: boolean;
  }> = params.gatewayStatuses || [
    { method: 'cod', enabled: true },
    { method: 'bkash', enabled: false },
    { method: 'nagad', enabled: false },
    { method: 'rocket', enabled: false },
    { method: 'sslcommerz', enabled: false },
    { method: 'visa', enabled: false },
    { method: 'bank-transfer', enabled: false },
  ];

  const activeLabels: string[] = [];
  const gatewayRows: string[][] = [];
  for (const item of defaultGateways) {
    const gw = GATEWAY_TRANSLATIONS[item.method][safeLang];
    if (item.enabled) {
      activeLabels.push(gw.label);
      gatewayRows.push([gw.label, meta.activeAtCheckout, gw.scope]);
    } else {
      gatewayRows.push([gw.label, meta.pendingGatewayActivation, meta.disabledUntilVerified]);
    }
  }

  const activePromosRows = (params.promotions || [])
    .filter((p) => p.active)
    .map((p) => [
      p.code,
      p.discountType === 'shipping' ? meta.promoWaivesBaseFee : meta.promoPercentOff(p.value),
      p.minSubtotal > 0
        ? meta.promoMinSubtotal(p.minSubtotal, Math.ceil(p.minSubtotal * bdtRate).toLocaleString('en-US'))
        : meta.promoNoMinimum,
      p.description,
    ]);

  const localizedCookies = translateCookieInventoryItems(params.cookieInventory, safeLang);
  const cookieRows = localizedCookies.map((item) => [
    `${item.key} (${item.storageType})`,
    item.classification,
    `${item.duration} — ${item.purpose}`,
  ]);

  const rawLegalEntityName = params.baseFactsConfig?.legalEntityName;
  const operatorDisplay =
    !rawLegalEntityName || isPlaceholderValue(rawLegalEntityName)
      ? `${pubFacts.tradingName} ${meta.operatorFallbackSuffix}`
      : meta.operatorTradingAs(sanitizePlainText(rawLegalEntityName), pubFacts.tradingName);

  const rawCommission = params.baseFactsConfig?.sellerCommissionSummary;
  const sellerCommissionText =
    !rawCommission || isPlaceholderValue(rawCommission)
      ? meta.commissionOnboardingFallback
      : sanitizePlainText(rawCommission);

  const rawPayout = params.baseFactsConfig?.sellerPayoutCycle;
  const sellerPayoutText =
    !rawPayout || isPlaceholderValue(rawPayout)
      ? meta.payoutSettingsFallback
      : sanitizePlainText(rawPayout);

  return {
    version: params.version,
    effectiveDate: pubFacts.effectiveDate,
    tradingName: pubFacts.tradingName,
    operatorDisplay,
    operatingCountry: pubFacts.operatingCountry,
    supportEmail: pubFacts.supportEmail,
    legalEmail: pubFacts.legalEmail,
    supportPhone: pubFacts.supportPhone,
    supportHours: pubFacts.supportHours,
    governingLaw: pubFacts.governingLaw,
    competentCourts: pubFacts.competentCourts,
    returnWindowDays: pubFacts.returnWindowDays,
    defectReportHours: pubFacts.defectReportHours,
    refundSlaBusinessDays: pubFacts.refundSlaBusinessDays,
    cancelPreDispatchCutoff: pubFacts.cancelPreDispatchCutoff,
    dhakaThresholdUsd,
    dhakaThresholdBdt,
    dhakaThresholdBdtFormatted,
    activeGatewaysLabel:
      activeLabels.length > 0 ? activeLabels.join(', ') : GATEWAY_TRANSLATIONS.cod[safeLang].label,
    zoneRows,
    gatewayRows,
    activePromosRows,
    cookieRows,
    sellerCommissionText,
    sellerPayoutText,
  };
}

export function localizePolicyRecord(
  record: PolicyDocumentRecord,
  options: {
    lang?: LanguageCode;
    baseVersion?: string;
    dynamicVars?: PolicyDynamicVars;
  }
): PolicyDocumentRecord {
  const safeLang = normalizePolicyLanguage(options.lang);
  if (safeLang === 'en') {
    return record;
  }

  const pack = POLICY_LOCALE_PACKS[safeLang];
  if (!pack) return record;

  const baseVer = options.baseVersion || '2026.11';
  // Preserve custom Admin CMS overrides cleanly if a newer custom revision was published
  const isBaselineVersion = record.currentVersion === baseVer;
  if (!isBaselineVersion) {
    return {
      ...record,
      effectiveDate: formatPolicyDateForLanguage(record.effectiveDate, safeLang),
      lastUpdated: formatPolicyDateForLanguage(record.lastUpdated, safeLang),
    };
  }

  const builder = pack.policies[record.id as LegalDocumentId];
  if (!builder || !options.dynamicVars) {
    return record;
  }

  const built = builder(options.dynamicVars);
  const cleanSections = sanitizePolicySections(built.sections).map((sec) => ({
    ...sec,
    paragraphs: sec.paragraphs.map((p) => stripInternalCounselNotes(p)),
    bullets: sec.bullets?.map((b) => stripInternalCounselNotes(b)),
  }));

  return {
    ...record,
    title: sanitizePlainText(built.title),
    shortTitle: sanitizePlainText(built.shortTitle),
    subtitle: stripInternalCounselNotes(sanitizePlainText(built.subtitle)),
    summary: stripInternalCounselNotes(sanitizePlainText(built.summary)),
    jurisdiction: sanitizePlainText(built.jurisdiction),
    scope: sanitizePlainText(built.scope),
    effectiveDate: options.dynamicVars.effectiveDate,
    lastUpdated: options.dynamicVars.effectiveDate,
    sections: cleanSections,
    unresolvedPlaceholders: [],
    draftContent: undefined,
  };
}
