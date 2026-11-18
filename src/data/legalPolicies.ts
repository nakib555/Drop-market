import type {
  CategorySlug,
  CurrencyRateState,
  LanguageCode,
  LegalAcceptanceRecord,
  LegalDocumentId,
  ManagedPromoRecord,
  PaymentMethodId,
  PolicyCategory,
  PolicyDocumentRecord,
  PolicyFactsConfig,
  PolicyFactsPublicSummary,
  PolicySection,
  ShippingRuleConfig,
} from '../types/commerce';
import {
  buildActiveCookieInventory,
  buildDefaultPolicyRecords,
  createInitialPolicyFacts,
  getPublicPublishedPolicies,
  POLICY_BASE_VERSION,
  POLICY_EFFECTIVE_DATE,
} from '../../server/services/policyService';
import {
  buildLocalizedDynamicVars,
  getLocalizedDepartmentSafetyNotice,
  localizePolicyRecord,
  localizePublicFactsSummary,
  translateCookieInventoryItems,
  translatePolicyCategory,
} from '../../server/shared/policyTranslations/index';

export {
  localizePublicFactsSummary,
  translateCookieInventoryItems,
  translatePolicyCategory,
};

export const LEGAL_VERSION = POLICY_BASE_VERSION;
export const LEGAL_EFFECTIVE_DATE = POLICY_EFFECTIVE_DATE;

export const LEGAL_ENTITY = {
  legalName: 'Kinto Studio',
  legalEmail: 'legal@kintostudio.bd',
  conciergeEmail: 'support@kintostudio.bd',
  jurisdictionLabel: 'Laws of Bangladesh · Competent Courts in Dhaka',
  registeredHub: 'Dhaka Operations Hub, Bangladesh',
  showrooms: 'Dhaka Operations & Customer Care Desk (Online Marketplace)',
} as const;

export type LegalSection = PolicySection;

export interface LegalDocument {
  id: LegalDocumentId;
  category: 'Core Agreements' | 'Commerce & Logistics' | 'Marketplace Governance' | 'Safety & Rights';
  policyCategory: PolicyCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  relatedIds: LegalDocumentId[];
  sections: LegalSection[];
}

export interface DepartmentSafetyNotice {
  title: string;
  summary: string;
  points: string[];
}

export function buildPolicyAcceptance(
  scope: string[],
  options?: {
    version?: string;
    acceptedPolicyVersions?: Record<string, string>;
    marketingOptIn?: boolean;
  }
): LegalAcceptanceRecord {
  return {
    version: options?.version || LEGAL_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    scope,
    jurisdiction: 'Bangladesh (Dhaka Courts)',
    ...(options?.acceptedPolicyVersions
      ? { acceptedPolicyVersions: options.acceptedPolicyVersions }
      : {}),
    ...(typeof options?.marketingOptIn === 'boolean'
      ? { marketingOptIn: options.marketingOptIn }
      : {}),
  };
}

export const DEPARTMENT_SAFETY_NOTICES: Record<string, DepartmentSafetyNotice> = {
  'beauty-care': {
    title: 'Cosmetic, Topical & Personal Care Advisory',
    summary:
      'Formulations are offered strictly for external cosmetic use and do not constitute medical treatment or dermatological prescriptions.',
    points: [
      'Perform a 24-hour patch test on clean skin before full application, particularly for active botanical extracts, acids, or essential oils.',
      'Discontinue use immediately and consult a qualified physician if irritation, rash, or allergic reaction occurs.',
      'Opened, unsealed, or used beauty and hygiene items are ineligible for return once sanitary seals are broken.',
    ],
  },
  'grocery-food-household': {
    title: 'Food, Beverage, Allergen & Perishable Handling Notice',
    summary:
      'Specialty pantry goods, coffee beans, and teas may be processed in facilities handling tree nuts, dairy, gluten, soy, or sesame.',
    points: [
      'Verify allergen declarations, BSTI/food-safety markings where applicable, best-before dates, and storage directions immediately upon parcel arrival.',
      'Kinto Studio makes no therapeutic, medicinal, or disease-prevention claims regarding specialty grocery products.',
      'Report damaged, spoiled, or tampered seals promptly with photographic evidence.',
    ],
  },
  'baby-kids-toys-hobbies': {
    title: 'Child Safety, Age Grading & Supervision Warning',
    summary:
      'Toys, nursery pieces, and craft kits must only be used in accordance with manufacturer minimum age recommendations and adult supervision.',
    points: [
      'Choking Hazard: Products containing small detachable parts, marbles, cords, or craft fasteners are unsuitable for children under 3 years unless explicitly rated.',
      'Inspect wooden dowels, joints, finishes, and textile seams periodically for wear and remove any loose components.',
    ],
  },
  'electronics-tech': {
    title: 'Electrical Rating, Voltage & Lithium Battery Notice',
    summary:
      'Verify mains voltage compatibility (220–240V / 50Hz in Bangladesh or multi-voltage rating) and surge protection prior to energizing audio or precision electronics.',
    points: [
      'Use only manufacturer-certified USB-PD or DC power adapters; unauthorized adapters may void partner hardware warranties.',
      'Items containing high-capacity lithium-ion batteries may be restricted from express air transit and routed via ground courier.',
    ],
  },
  'automotive-tools-industrial': {
    title: 'Mechanical Skill, PPE & Assumption of Risk Notice',
    summary:
      'Power tools, torque instruments, and automotive accessories require proper personal protective equipment (eye, ear, hand protection) and mechanical competence.',
    points: [
      'Never exceed rated RPM, load limits, voltage, or torque specifications printed in the manufacturer manual.',
      'Improper installation or modified safety guards voids warranty coverage and creates injury risk.',
    ],
  },
  'health-wellness-pets': {
    title: 'Wellness, Supplement & Pet Care Disclaimer',
    summary:
      'Wellness devices, nutritional supplements, and pet supplies are not intended to diagnose, treat, cure, or prevent any human or veterinary medical condition.',
    points: [
      'Consult a licensed physician or veterinarian before introducing supplements, therapeutic accessories, or specialized pet formulations.',
      'Keep wellness capsules, essential oils, and pet remedies out of reach of children and unintended pets.',
    ],
  },
  default: {
    title: 'Marketplace Authenticity & Usage Disclosure',
    summary:
      'Operate and care for each item strictly according to the maker specification sheet and enclosed care instructions.',
    points: [
      'Third-party Seller Studio listings are fulfilled and warranted directly by the identified partner seller alongside non-waivable statutory consumer protections.',
      'Inspect parcels at delivery; report transit damage or wrong-item fulfillment within 48 hours of receipt.',
    ],
  },
};

export function getDepartmentSafetyNotice(
  category?: CategorySlug | string,
  language: LanguageCode = 'en'
): DepartmentSafetyNotice {
  if (language && language !== 'en') {
    return getLocalizedDepartmentSafetyNotice(category, language);
  }
  if (category && DEPARTMENT_SAFETY_NOTICES[category]) {
    return DEPARTMENT_SAFETY_NOTICES[category];
  }
  return DEPARTMENT_SAFETY_NOTICES.default;
}

export function policyRecordToLegalDocument(record: PolicyDocumentRecord): LegalDocument {
  return {
    id: record.id as LegalDocumentId,
    category: record.legacyCategory,
    policyCategory: record.category,
    title: record.title,
    shortTitle: record.shortTitle,
    subtitle: record.subtitle,
    summary: record.summary,
    effectiveDate: record.effectiveDate,
    lastUpdated: record.lastUpdated,
    version: record.currentVersion,
    relatedIds: record.relatedIds,
    sections: record.sections,
  };
}

export function getLegalDocuments(options?: {
  dhakaThresholdUsd?: number;
  shippingConfig?: ShippingRuleConfig;
  currencyConfig?: CurrencyRateState;
  promotions?: ManagedPromoRecord[];
  publishedRecords?: PolicyDocumentRecord[];
  language?: LanguageCode;
  facts?: PolicyFactsPublicSummary | PolicyFactsConfig;
  enabledPaymentMethods?: PaymentMethodId[];
}): LegalDocument[] {
  const lang = options?.language || 'en';

  if (options?.publishedRecords && options.publishedRecords.length > 0) {
    const baseDocs = getPublicPublishedPolicies(options.publishedRecords);
    if (lang === 'en') {
      return baseDocs.map(policyRecordToLegalDocument);
    }
    const gatewayMethods: Array<Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>> = [
      'cod',
      'bkash',
      'nagad',
      'rocket',
      'sslcommerz',
      'visa',
      'bank-transfer',
    ];
    const enabledSet = options.enabledPaymentMethods
      ? new Set(options.enabledPaymentMethods)
      : new Set<PaymentMethodId>(['cod']);
    const dynamicVars = buildLocalizedDynamicVars({
      lang,
      version: POLICY_BASE_VERSION,
      facts: options.facts || createInitialPolicyFacts(),
      shippingConfig: options.shippingConfig,
      currencyConfig: options.currencyConfig,
      promotions: options.promotions,
      cookieInventory: buildActiveCookieInventory(lang),
      gatewayStatuses: gatewayMethods.map((method) => ({
        method,
        enabled: enabledSet.has(method) || (method === 'visa' && enabledSet.has('mastercard')),
      })),
    });
    return baseDocs
      .map((rec) =>
        localizePolicyRecord(rec, {
          lang,
          baseVersion: POLICY_BASE_VERSION,
          dynamicVars,
        })
      )
      .map(policyRecordToLegalDocument);
  }

  const facts = createInitialPolicyFacts();
  const baseShipping: ShippingRuleConfig | undefined = options?.shippingConfig
    ? options.shippingConfig
    : typeof options?.dhakaThresholdUsd === 'number'
    ? {
        zones: [
          {
            zoneId: 'dhaka_metro',
            label: 'Dhaka Metro (North & South City)',
            standardFeeUsd: 0.7,
            expressFeeUsd: 1.65,
            expressAvailable: true,
            whiteGloveFeeUsd: 12,
            whiteGloveAvailable: true,
            freeThresholdUsd: options.dhakaThresholdUsd,
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
        ],
        restrictedAreaKeywords: [],
        updatedAt: new Date().toISOString(),
      }
    : undefined;

  const records = buildDefaultPolicyRecords({
    facts,
    shippingConfig: baseShipping,
    currencyConfig: options?.currencyConfig,
    promotions: options?.promotions,
  });

  return getPublicPublishedPolicies(records, lang, {
    facts,
    shippingConfig: baseShipping,
    currencyConfig: options?.currencyConfig,
    promotions: options?.promotions,
  }).map(policyRecordToLegalDocument);
}

export function getLegalDocumentById(
  id: LegalDocumentId,
  options?: {
    dhakaThresholdUsd?: number;
    publishedRecords?: PolicyDocumentRecord[];
    language?: LanguageCode;
    facts?: PolicyFactsPublicSummary | PolicyFactsConfig;
    shippingConfig?: ShippingRuleConfig;
    currencyConfig?: CurrencyRateState;
    promotions?: ManagedPromoRecord[];
    enabledPaymentMethods?: PaymentMethodId[];
  }
): LegalDocument {
  const docs = getLegalDocuments(options);
  return docs.find((d) => d.id === id) || docs[0];
}
