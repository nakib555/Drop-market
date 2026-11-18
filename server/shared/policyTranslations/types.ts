import type {
  CookieInventoryItem,
  LanguageCode,
  LegalDocumentId,
  PaymentMethodId,
  PolicyCategory,
  PolicySection,
} from '../../../src/types/commerce.ts';

export interface PolicyDynamicVars {
  version: string;
  effectiveDate: string;
  tradingName: string;
  operatorDisplay: string;
  operatingCountry: string;
  supportEmail: string;
  legalEmail: string;
  supportPhone?: string;
  supportHours: string;
  governingLaw: string;
  competentCourts: string;
  returnWindowDays: number;
  defectReportHours: number;
  refundSlaBusinessDays: string;
  cancelPreDispatchCutoff: string;
  dhakaThresholdUsd: number;
  dhakaThresholdBdt: number;
  dhakaThresholdBdtFormatted: string;
  activeGatewaysLabel: string;
  zoneRows: string[][];
  gatewayRows: string[][];
  activePromosRows: string[][];
  cookieRows: string[][];
  sellerCommissionText: string;
  sellerPayoutText: string;
}

export interface LocalizedPolicyDocumentContent {
  title: string;
  shortTitle: string;
  subtitle: string;
  summary: string;
  jurisdiction: string;
  scope: string;
  sections: PolicySection[];
}

export type LocalizedPolicyBuilder = (vars: PolicyDynamicVars) => LocalizedPolicyDocumentContent;

export interface LocalizedFactsMeta {
  operatingCountry: string;
  governingLaw: string;
  competentCourts: string;
  marketplaceModelLabel: string;
  defaultSupportHours: string;
  defaultRefundSlaBusinessDays: string;
  defaultCancelPreDispatchCutoff: string;
  operatorFallbackSuffix: string;
  operatorTradingAs: (legalEntity: string, tradingName: string) => string;
  commissionOnboardingFallback: string;
  payoutSettingsFallback: string;
  suspendedStatus: string;
  prepaidRestrictedStatus: string;
  prepaidOnlyStatus: string;
  upToCodUsd: (usd: number) => string;
  defaultNationwideLabel: string;
  defaultNationwideWindow: string;
  defaultNationwideCod: string;
  activeAtCheckout: string;
  pendingGatewayActivation: string;
  disabledUntilVerified: string;
  promoWaivesBaseFee: string;
  promoPercentOff: (pct: number) => string;
  promoMinSubtotal: (usd: number, bdtFormatted: string) => string;
  promoNoMinimum: string;
}

export interface LocalizedCookieMeta {
  classification: string;
  provider: string;
  duration: string;
  purpose: string;
}

export interface LocalizedGatewayMeta {
  label: string;
  scope: string;
}

export interface LocalizedDepartmentSafetyNotice {
  title: string;
  summary: string;
  points: string[];
}

export interface PolicyLocalePack {
  language: Exclude<LanguageCode, 'en'>;
  policies: Record<LegalDocumentId, LocalizedPolicyBuilder>;
}

export interface LocalizedCookieBuilderInput {
  baseItems: CookieInventoryItem[];
  language: LanguageCode;
}

export type PolicyCategoryTranslationMap = Record<PolicyCategory, Record<LanguageCode, string>>;
export type GatewayTranslationMap = Record<
  Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>,
  Record<LanguageCode, LocalizedGatewayMeta>
>;
