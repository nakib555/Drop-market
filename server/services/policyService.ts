import type {
  CookieInventoryItem,
  CurrencyRateState,
  LanguageCode,
  LegalAcceptanceRecord,
  LegalDocumentId,
  LegalReviewChecklistItem,
  ManagedPromoRecord,
  PaymentMethodId,
  PolicyAcceptanceLedgerEntry,
  PolicyCategory,
  PolicyChecklistSummary,
  PolicyDocumentRecord,
  PolicyFactsConfig,
  PolicyFactsPublicSummary,
  PolicySection,
  PolicyStatus,
  PolicyVersionRecord,
  ShippingRuleConfig,
} from '../../src/types/commerce.ts';
import {
  isPlaceholderValue,
  sanitizePlainText,
  sanitizePolicySections,
  scanUnresolvedPlaceholders,
  stripInternalCounselNotes,
} from '../../src/utils/policySanitizer.ts';
import { getGatewayConfigStatus } from './paymentService.ts';
import {
  buildLocalizedDynamicVars,
  localizePolicyRecord,
  localizePublicFactsSummary,
  normalizePolicyLanguage,
  translateCookieInventoryItems,
} from '../shared/policyTranslations/index.ts';

export const POLICY_BASE_VERSION = '2026.11';
export const POLICY_EFFECTIVE_DATE = 'November 14, 2026';

export function createInitialPolicyFacts(): PolicyFactsConfig {
  return {
    legalEntityName: '[CONFIRM BUSINESS LEGAL NAME]',
    tradingName: 'Kinto Studio',
    registrationTradeLicense: '[CONFIRM TRADE LICENSE NO]',
    registrationDbid: '[CONFIRM DBID REGISTRATION NO]',
    registrationBinVat: '[CONFIRM BIN / VAT NO]',
    registrationTin: '[CONFIRM E-TIN NO]',
    registeredAddress: '[CONFIRM REGISTERED OFFICE STREET ADDRESS, DHAKA, BANGLADESH]',
    operatingCountry: 'Bangladesh',
    supportEmail: 'support@kintostudio.bd',
    legalEmail: 'legal@kintostudio.bd',
    supportPhone: '[CONFIRM CUSTOMER SUPPORT PHONE]',
    supportHours: '[CONFIRM SUPPORT OPERATING HOURS — e.g. Sat–Thu BST]',
    returnWindowDays: 14,
    defectReportHours: 48,
    refundSlaBusinessDays: '7 to 10 business days after quality inspection',
    cancelPreDispatchCutoff: 'Any time before order status advances to Packed or Shipped',
    marketplaceModel: 'hybrid_1p_3p',
    sellerCommissionSummary: '[CONFIRM SELLER COMMISSION & FEE SCHEDULE]',
    sellerPayoutCycle: '[CONFIRM SELLER PAYOUT TIMING & RESERVE WINDOW]',
    governingLaw: 'Laws of the People’s Republic of Bangladesh',
    competentCourts: 'Competent Courts in Dhaka, Bangladesh',
    policyOwner: '[CONFIRM POLICY OWNER / COMPLIANCE OFFICER]',
    effectiveDate: POLICY_EFFECTIVE_DATE,
    materialChangeNoticeDays: 14,
    updatedAt: new Date().toISOString(),
  };
}

export function buildPublicFactsSummary(
  facts: PolicyFactsConfig,
  lang: LanguageCode = 'en'
): PolicyFactsPublicSummary {
  const hasConfirmedEntityDetails =
    !isPlaceholderValue(facts.legalEntityName) &&
    !isPlaceholderValue(facts.registrationTradeLicense) &&
    !isPlaceholderValue(facts.registeredAddress);

  const enSummary: PolicyFactsPublicSummary = {
    tradingName: sanitizePlainText(facts.tradingName || 'Kinto Studio'),
    operatingCountry: sanitizePlainText(facts.operatingCountry || 'Bangladesh'),
    supportEmail: sanitizePlainText(facts.supportEmail || 'support@kintostudio.bd'),
    legalEmail: sanitizePlainText(facts.legalEmail || 'legal@kintostudio.bd'),
    ...(isPlaceholderValue(facts.supportPhone)
      ? {}
      : { supportPhone: sanitizePlainText(facts.supportPhone) }),
    supportHours: isPlaceholderValue(facts.supportHours)
      ? 'Customer Support Desk (Email & Ticket Portal)'
      : sanitizePlainText(facts.supportHours),
    returnWindowDays: Math.max(1, Math.round(Number(facts.returnWindowDays) || 14)),
    defectReportHours: Math.max(12, Math.round(Number(facts.defectReportHours) || 48)),
    refundSlaBusinessDays: sanitizePlainText(facts.refundSlaBusinessDays),
    cancelPreDispatchCutoff: sanitizePlainText(facts.cancelPreDispatchCutoff),
    marketplaceModelLabel: 'Direct Studio Editions & Independent Partner Seller Studios',
    governingLaw: sanitizePlainText(facts.governingLaw),
    competentCourts: sanitizePlainText(facts.competentCourts),
    effectiveDate: sanitizePlainText(facts.effectiveDate),
    hasConfirmedEntityDetails,
  };

  const safeLang = normalizePolicyLanguage(lang);
  if (safeLang === 'en') return enSummary;
  return localizePublicFactsSummary(facts, safeLang);
}

export function buildActiveCookieInventory(lang: LanguageCode = 'en'): CookieInventoryItem[] {
  const baseItems: CookieInventoryItem[] = [
    {
      key: 'HttpOnly Session Token Cookie',
      storageType: 'httpOnlyCookie',
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Server',
      duration: 'Session / 7 days',
      purpose: 'Maintains authenticated Buyer, Seller, or Admin login state securely.',
    },
    {
      key: 'kinto-cart / kinto-saved / kinto-promo',
      storageType: 'localStorage',
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Storefront',
      duration: 'Persistent until cleared or checkout',
      purpose: 'Preserves your shopping bag, saved items, and applied promotional code.',
    },
    {
      key: 'kinto-language / kinto-currency / kinto-theme',
      storageType: 'localStorage',
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Storefront',
      duration: 'Persistent user setting',
      purpose: 'Remembers interface language, BDT/USD currency display, and contrast mode.',
    },
    {
      key: 'kinto-cookie-consent / kinto-privacy-prefs',
      storageType: 'localStorage',
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Privacy Controls',
      duration: 'Persistent until preferences updated',
      purpose: 'Stores your granular consent choices so optional tracking stays blocked when declined.',
    },
    {
      key: 'kinto-guest-order-ids / kinto-pending-action',
      storageType: 'sessionStorage',
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Checkout & Auth Resume',
      duration: 'Browser tab session (max 15 min pending action)',
      purpose: 'Allows guest order tracking handoff and resumes an action after sign-in.',
    },
    {
      key: 'kinto-recent-searches',
      storageType: 'localStorage',
      classification: 'Optional Preference',
      provider: 'Kinto Studio Search',
      duration: 'Cleared immediately when toggled off',
      purpose: 'Stores recent storefront search queries only when Save Search History consent is granted.',
      consentKey: 'saveSearchHistory',
    },
    {
      key: 'kinto-recent-views',
      storageType: 'localStorage',
      classification: 'Optional Preference',
      provider: 'Kinto Studio Catalog Personalization',
      duration: 'Cleared immediately when toggled off',
      purpose: 'Powers Recently Viewed product shelves only when Personalized Catalog consent is granted.',
      consentKey: 'personalizedCatalog',
    },
    {
      key: 'Privacy-Minimized Route Diagnostics (In-Memory)',
      storageType: 'sessionStorage',
      classification: 'Optional Analytics',
      provider: 'Kinto Studio (No 3rd-Party Ad Pixels Installed)',
      duration: 'In-memory session only',
      purpose: 'Records non-personal page-view/feature telemetry only when Analytics Opt-In is enabled.',
      consentKey: 'analyticsOptIn',
    },
  ];

  const safeLang = normalizePolicyLanguage(lang);
  return safeLang === 'en' ? baseItems : translateCookieInventoryItems(baseItems, safeLang);
}

export function createInitialLegalReviewChecklist(): LegalReviewChecklistItem[] {
  return [
    {
      id: 'chk-bd-entity',
      topic: 'Bangladesh Business Registration & Disclosures (Trade License, DBID, e-TIN, BIN/VAT)',
      jurisdiction: 'Bangladesh',
      statutoryReference: 'Digital Commerce Operation Guidelines 2021 §3.1; Value Added Tax Act',
      status: 'needs_business_confirmation',
      reviewer: 'Pending Owner & Tax Counsel',
      reviewDate: 'Pending',
      notes: 'Replace [CONFIRM ...] fields in PolicyFactsConfig once corporate registration certificates are issued.',
    },
    {
      id: 'chk-bd-dncrp',
      topic: 'Consumer Rights, Refund Deadlines & Delivery SLAs',
      jurisdiction: 'Bangladesh',
      statutoryReference: 'Consumer Rights Protection Act 2009; Digital Commerce Operation Guidelines 2021',
      status: 'needs_legal_review',
      reviewer: 'Pending Qualified Bangladesh Advocate',
      reviewDate: 'Pending',
      notes: 'Verify 14-day voluntary change-of-mind window vs category exemptions and refund settlement timelines.',
    },
    {
      id: 'chk-bd-escrow',
      topic: 'Payment Gateway Agreements & Settlement / Escrow Hold Terms',
      jurisdiction: 'Bangladesh',
      statutoryReference: 'Bangladesh Bank MFS & Payment Systems Directives; Contract Act 1872',
      status: 'needs_legal_review',
      reviewer: 'Pending Qualified Bangladesh Advocate',
      reviewDate: 'Pending',
      notes: 'Verify bKash, Nagad, Rocket, SSLCommerz merchant settlement cycles before activating digital channels.',
    },
    {
      id: 'chk-bd-cyber',
      topic: 'Data Protection, Cyber Security & Cross-Border FX/Data Transfers',
      jurisdiction: 'Bangladesh / International',
      statutoryReference: 'Cyber Security Act 2023; Evidence Act; Foreign Exchange Regulation Act',
      status: 'needs_legal_review',
      reviewer: 'Pending Qualified Bangladesh Advocate',
      reviewDate: 'Pending',
      notes: 'Confirm hosting location disclosures, invoice retention period, and international card FX rules.',
    },
    {
      id: 'chk-seller-kyc',
      topic: 'Third-Party Seller Agreement, Commission Schedule & Prohibited Goods Enforcement',
      jurisdiction: 'Bangladesh',
      statutoryReference: 'Contract Act 1872; Copyright Act 2023; Trademarks Act 2009; Arms Act',
      status: 'needs_business_confirmation',
      reviewer: 'Pending Commercial & Legal Review',
      reviewDate: 'Pending',
      notes: 'Confirm verified seller commission % and payout schedule before onboarding third-party merchants.',
    },
  ];
}

function summarizeGatewayReadiness(): {
  activeLabels: string[];
  pendingLabels: string[];
  rows: string[][];
} {
  const specs: Array<{ method: PaymentMethodId; label: string; scope: string }> = [
    { method: 'cod', label: 'Cash on Delivery (COD)', scope: 'Eligible Bangladesh delivery zones within order cap' },
    { method: 'bkash', label: 'bKash Mobile Wallet', scope: 'Bangladesh BDT Checkout (Env Credentials)' },
    { method: 'nagad', label: 'Nagad Mobile Wallet', scope: 'Bangladesh BDT Checkout (Env Credentials)' },
    { method: 'rocket', label: 'Rocket (DBBL)', scope: 'Bangladesh BDT Checkout (Env Credentials)' },
    { method: 'sslcommerz', label: 'SSLCommerz Gateway', scope: 'Bangladesh & Cards (Env Credentials)' },
    { method: 'visa', label: 'Visa / Mastercard 3DS', scope: 'Domestic & International (Stripe/SSLCommerz Env)' },
    { method: 'bank-transfer', label: 'Bank Transfer (NPSB / BEFTN)', scope: 'Manual Verified Settlement (Env Account)' },
  ];

  const activeLabels: string[] = [];
  const pendingLabels: string[] = [];
  const rows: string[][] = [];

  for (const item of specs) {
    const status = getGatewayConfigStatus(item.method);
    if (status.enabled) {
      activeLabels.push(item.label);
      rows.push([item.label, 'Active at Checkout', item.scope]);
    } else {
      pendingLabels.push(item.label);
      rows.push([item.label, 'Pending Gateway Activation', 'Disabled until merchant credentials are verified']);
    }
  }

  return { activeLabels, pendingLabels, rows };
}

export function buildDefaultPolicyRecords(params: {
  facts: PolicyFactsConfig;
  shippingConfig?: ShippingRuleConfig;
  currencyConfig?: CurrencyRateState;
  promotions?: ManagedPromoRecord[];
}): PolicyDocumentRecord[] {
  const { facts, shippingConfig, currencyConfig, promotions = [] } = params;
  const pubFacts = buildPublicFactsSummary(facts);
  const nowIso = new Date().toISOString();
  const dhakaZone = shippingConfig?.zones.find((z) => z.zoneId === 'dhaka_metro');
  const intlZone = shippingConfig?.zones.find((z) => z.zoneId === 'international');
  const dhakaThresholdUsd = dhakaZone?.freeThresholdUsd ?? 120;
  const bdtRate = currencyConfig?.rates?.BDT ?? 120.5;
  const dhakaThresholdBdt = Math.ceil(dhakaThresholdUsd * bdtRate);
  const gateways = summarizeGatewayReadiness();
  const cookieInventory = buildActiveCookieInventory();

  const operatorDisplay = isPlaceholderValue(facts.legalEntityName)
    ? `${pubFacts.tradingName} (Operator details configured in Store Legal Settings)`
    : `${sanitizePlainText(facts.legalEntityName)} trading as ${pubFacts.tradingName}`;

  const entityBullets = [
    `Storefront Name: ${pubFacts.tradingName}`,
    `Support Contact: ${pubFacts.supportEmail}${pubFacts.supportPhone ? ` · ${pubFacts.supportPhone}` : ''}`,
    `Legal & Grievance Contact: ${pubFacts.legalEmail}`,
    `Governing Law & Jurisdiction: ${pubFacts.governingLaw} (${pubFacts.competentCourts})`,
  ];

  const zoneTableRows = (shippingConfig?.zones || []).map((z) => [
    z.label,
    z.isRestricted ? 'Currently Suspended' : z.standardEta,
    z.isRestricted ? 'Prepaid / Restricted' : z.codEligible ? `Up to $${z.codMaxOrderUsd} USD eq. BDT` : 'Prepaid Only',
  ]);

  const activePromosRows = promotions
    .filter((p) => p.active)
    .map((p) => [
      p.code,
      p.discountType === 'shipping' ? 'Waives standard base fee' : `${p.value}% off subtotal`,
      p.minSubtotal > 0 ? `$${p.minSubtotal} USD (approx. ${Math.ceil(p.minSubtotal * bdtRate)} BDT)` : 'No minimum subtotal',
      p.description,
    ]);

  const rawActiveTemplates: Array<{
    id: LegalDocumentId;
    category: PolicyCategory;
    legacyCategory: PolicyDocumentRecord['legacyCategory'];
    jurisdiction: string;
    scope: string;
    requiresLegalReview: boolean;
    requiresOwnerConfirmation: boolean;
    title: string;
    shortTitle: string;
    subtitle: string;
    summary: string;
    relatedIds: LegalDocumentId[];
    sections: PolicySection[];
  }> = [
    {
      id: 'terms',
      category: 'Privacy & Legal',
      legacyCategory: 'Core Agreements',
      jurisdiction: 'Bangladesh (Dhaka Courts)',
      scope: 'Storefront buyers, guests, registered account holders & visitors',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Terms & Conditions of Service',
      shortTitle: 'Terms & Conditions',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Bangladesh Law`,
      summary:
        'Contractual framework governing storefront browsing, guest & registered orders, hybrid 1P/3P marketplace structure, BDT/USD pricing, and non-waivable statutory consumer protections.',
      relatedIds: ['marketplace-terms', 'privacy-policy', 'return-policy', 'cancellation-policy'],
      sections: [
        {
          id: 'operator-eligibility',
          heading: '1. Platform Operator, Eligibility & Accounts',
          paragraphs: [
            `This storefront is operated by ${operatorDisplay} under the laws of Bangladesh.`,
          ],
          bullets: [
            ...entityBullets,
            'Contractual Age & Capacity: Buyers confirm they are at least 18 years old and legally competent under the Contract Act 1872 and Majority Act 1875.',
            'Account Security: Registered users are responsible for safeguarding credentials and maintaining accurate delivery and contact information; guest checkout remains supported.',
          ],
        },
        {
          id: 'marketplace-model-listings',
          heading: '2. Marketplace Role (Direct & Partner Seller Listings)',
          paragraphs: [
            'Kinto Studio operates both direct studio editions and curated third-party Partner Seller Studio listings.',
          ],
          bullets: [
            'Clear Attribution: Every product page explicitly identifies whether an item is fulfilled directly by Kinto Studio or by an independent Partner Seller Studio.',
            'Accuracy & Manifest Errors: Listings are reviewed for precision; if a typographical pricing error or sudden stock loss prevents dispatch, affected orders are cancelled pre-dispatch with a full refund.',
          ],
        },
        {
          id: 'orders-pricing-payment',
          heading: '3. Order Acceptance & Currency Settlement',
          paragraphs: [
            'Checkout submission constitutes an offer to purchase that is confirmed upon server validation.',
          ],
          bullets: [
            'Verification Trigger: Orders are accepted once live stock, pricing, delivery zone eligibility, and payment authorization (or COD verification) are confirmed.',
            'Domestic BDT Settlement: All deliveries inside Bangladesh settle authoritatively in Bangladesh Taka (BDT).',
            'International USD Settlement: Cross-border deliveries settle in USD using the locked exchange-rate snapshot displayed at checkout.',
            'Linked Policies: Shipping, returns, cancellations, warranties, product safety, and review rules apply by reference.',
          ],
        },
        {
          id: 'rights-liability-disputes',
          heading: '4. Non-Waivable Consumer Rights & Governing Law',
          paragraphs: [
            'Statutory consumer protections prevail over any conflicting storefront term.',
          ],
          bullets: [
            'Force Majeure: Neither party is liable for courier delays caused by severe weather, transport blockades, regulatory holds, or utility failures.',
            'Dispute Venue: Domestic transactions are governed by Bangladesh law with competent courts in Dhaka following good-faith review via Customer Care.',
          ],
          notice: {
            tone: 'statutory',
            label: 'Statutory Consumer Protection',
            body: 'Nothing in these Terms waives mandatory rights under the Consumer Rights Protection Act 2009, Sale of Goods Act 1930, or Digital Commerce guidelines.',
          },
        },
      ],
    },
    {
      id: 'privacy-policy',
      category: 'Privacy & Legal',
      legacyCategory: 'Core Agreements',
      jurisdiction: 'Bangladesh / International',
      scope: 'All visitors, guest shoppers, registered buyers, and sellers',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Privacy Policy',
      shortTitle: 'Privacy Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Data Minimization & Rights`,
      summary:
        'Plain-language explanation of personal data collected during browsing, guest checkout, accounts, and reviews, why it is processed, who receives it, and how to submit privacy requests.',
      relatedIds: ['cookie-policy', 'data-retention-policy', 'terms', 'customer-support-policy'],
      sections: [
        {
          id: 'data-sources',
          heading: '1. Personal Data We Collect',
          paragraphs: [
            'We collect only the information necessary to process orders, arrange courier delivery, prevent fraud, and answer inquiries.',
          ],
          table: {
            headers: ['Interaction', 'Data Collected', 'Required vs Optional'],
            rows: [
              ['Browsing & Search', 'Selected language, currency, cart items; optional recent searches/views only with cookie consent', 'Essential prefs required; history/analytics strictly optional'],
              ['Account Registration', 'Full name, email, phone number, role, hashed password, timestamped policy acceptance', 'Required to create and secure an account; marketing toggle optional'],
              ['Guest & Account Checkout', 'Recipient name, delivery geography (Division/District/Upazila/Area), email, phone, tokenized gateway ref', 'Required to route courier, quote fees, and process payment'],
              ['Reviews, Q&A & Support', 'Display name, product feedback, support ticket message, optional Order ID', 'Required only when submitting feedback or an inquiry'],
            ],
          },
        },
        {
          id: 'sharing-fulfillment',
          heading: '2. Sharing With Sellers, Couriers & Payment Gateways',
          paragraphs: [
            'We never sell personal data and share order details strictly with fulfillment partners.',
          ],
          bullets: [
            'Partner Seller Studios: Receive only line items and delivery area details required to pack and hand off parcels.',
            'Courier Partners: Receive recipient name, street address, delivery notes, and reachable phone number for parcel delivery.',
            'Payment Processors: Process tokenized payment authorization references; Kinto Studio never stores raw card CVV codes or MFS PINs.',
          ],
        },
        {
          id: 'transfers-security-rights',
          heading: '3. Security Safeguards, Transfers & Your Privacy Rights',
          paragraphs: [
            'Access controls protect customer records while giving you direct control over preferences and erasure requests.',
          ],
          bullets: [
            'Technical Safeguards: Signed session tokens, role-based access controls, and input validation protect storefront and account records.',
            'Cross-Border Customs: International orders require sharing recipient delivery data with air carriers and destination customs authorities.',
            `Your Requests: Manage privacy toggles in My Account or email ${pubFacts.legalEmail} for access, correction, or account erasure (subject to statutory VAT/invoice retention).`,
          ],
        },
      ],
    },
    {
      id: 'cookie-policy',
      category: 'Privacy & Legal',
      legacyCategory: 'Core Agreements',
      jurisdiction: 'Bangladesh / International',
      scope: 'Cookies, localStorage, sessionStorage & optional preference gating',
      requiresLegalReview: false,
      requiresOwnerConfirmation: false,
      title: 'Cookie & Browser Storage Policy',
      shortTitle: 'Cookie Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Granular Consent Controls`,
      summary:
        'Accurate inventory of every strictly necessary token/storage key and optional preference technology active on Kinto Studio, plus how consent controls work.',
      relatedIds: ['privacy-policy', 'data-retention-policy', 'terms'],
      sections: [
        {
          id: 'consent-enforcement',
          heading: '1. Essential Storage vs Consent-Gated Preferences',
          paragraphs: [
            'Browser storage separates core shopping functionality from optional personalization controls.',
          ],
          bullets: [
            'Strictly Necessary Storage: Powers sign-in security, shopping bag retention, language, currency, and recording your consent selection.',
            'Optional Preferences: Save Search History, Personalized Catalog (Recently Viewed), and Analytics Opt-In remain off until explicitly enabled.',
            'Instant Withdrawal: Turning off any optional toggle in Cookie Preferences immediately clears stored local history and halts optional telemetry.',
          ],
        },
        {
          id: 'cookie-inventory-table',
          heading: '2. Active Technology Inventory',
          paragraphs: [
            'No third-party advertising trackers or retargeting pixels are active on this storefront.',
          ],
          table: {
            headers: ['Key / Technology', 'Category', 'Duration & Purpose'],
            rows: cookieInventory.map((item) => [
              `${item.key} (${item.storageType})`,
              item.classification,
              `${item.duration} — ${item.purpose}`,
            ]),
          },
        },
      ],
    },
    {
      id: 'shipping-policy',
      category: 'Orders & Delivery',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Supported International Corridors',
      scope: 'Zone coverage, delivery estimates, weight tiers, fees & parcel inspection',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Shipping & Delivery Policy',
      shortTitle: 'Shipping Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Live Zone Quotes`,
      summary:
        'Transparent explanation of Bangladesh delivery zones, international air freight, processing vs transit estimates, weight/bulky surcharges, and damaged parcel procedures.',
      relatedIds: ['international-orders-policy', 'return-policy', 'cancellation-policy', 'payment-policy'],
      sections: [
        {
          id: 'coverage-estimates',
          heading: '1. Delivery Zones & Estimated Transit Windows',
          paragraphs: [
            `Orders dispatch from Dhaka hubs or verified Partner Seller Studios across all 64 districts of Bangladesh and supported international corridors.`,
          ],
          bullets: [
            `Dhaka Complimentary Threshold: Standard shipping is waived in Dhaka Metro starting at $${dhakaThresholdUsd} USD (approx. ${dhakaThresholdBdt.toLocaleString()} BDT) for qualifying non-freight items.`,
            'Transit Estimates: Displayed windows begin after payment authorization or COD confirmation and serve as operational estimates rather than guaranteed deadlines.',
          ],
          table: {
            headers: ['Configured Delivery Zone', 'Estimated Window (Estimate Only)', 'Cash on Delivery Eligibility'],
            rows: zoneTableRows.length > 0 ? zoneTableRows : [['Bangladesh Nationwide & Dhaka Metro', '1–5 Business Days', 'Zone & Cap Dependent']],
          },
        },
        {
          id: 'address-delays-claims',
          heading: '2. Restricted Areas, Address Accuracy & Split Dispatches',
          paragraphs: [
            'Accurate contact details and serviceable areas help couriers complete first-attempt delivery.',
          ],
          bullets: [
            'Restricted Corridors: Remote offshore marine routes flagged during address selection may be temporarily suspended or prepaid-only.',
            'Address & Phone Accuracy: Unreachable recipients or incomplete addresses may result in rescheduled delivery or carrier re-dispatch fees.',
            'Multi-Vendor Parcels: Orders mixing direct studio and Partner Seller items may ship in separate tracked parcels at no extra checkout fee.',
            'Force Majeure Delays: Weather, hartals/blockades, or public holidays may extend transit times and are updated on Order Tracking.',
          ],
        },
        {
          id: 'lost-damaged-parcels',
          heading: '3. Lost, Delayed or Transit-Damaged Parcels',
          paragraphs: [
            'Always inspect outer packaging seals at handover before signing.',
          ],
          bullets: [
            `Reporting Window: Report missing items, tampered seals, or transit damage within ${pubFacts.defectReportHours} hours via Track Order or ${pubFacts.supportEmail}.`,
            'Resolution: Include your Order ID and clear parcel photographs so logistics care can arrange priority replacement or refund.',
          ],
        },
      ],
    },
    {
      id: 'return-policy',
      category: 'Returns & Warranty',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Cross-Border',
      scope: 'Return eligibility, window, exclusions, refunds & exchanges',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Returns, Refunds & Exchanges Policy',
      shortTitle: 'Return & Refund Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · ${pubFacts.returnWindowDays}-Day Standard Window`,
      summary:
        'Fair rules covering defective/wrong item remedies, category hygiene/perishable exclusions, quality inspection, refund routing, and dispute escalation.',
      relatedIds: ['cancellation-policy', 'warranty-policy', 'shipping-policy', 'customer-support-policy'],
      sections: [
        {
          id: 'return-windows-eligibility',
          heading: '1. Return Eligibility & Category Matrix',
          paragraphs: [
            'Clear timelines distinguish defective deliveries from voluntary change-of-mind returns.',
          ],
          bullets: [
            `Defective or Wrong Items: Report within ${pubFacts.defectReportHours} hours of delivery with photos for free pickup, replacement, or full refund.`,
            `Change-of-Mind Window: Eligible unused items may be returned within ${pubFacts.returnWindowDays} days with original tags, seals, manuals, and packaging intact.`,
          ],
          table: {
            headers: ['Category / Condition', 'Return / Remedy Scope', 'Return Shipping & Proof'],
            rows: [
              ['Defective, Damaged, Incomplete or Wrong Item', 'Full refund or replacement subject to stock', 'Platform/Seller covers pickup; report within 48h with photo proof'],
              ['Standard Electronics, Fashion & Home', `${pubFacts.returnWindowDays}-day return if unopened/unworn & serialized accessories intact`, 'Proof of order & intact packaging required'],
              ['Beauty, Personal Care & Hygiene', 'Defective/damaged only; non-returnable once sanitary seal is broken', 'Preserves hygiene safety; defects fully covered'],
              ['Grocery, Coffee & Perishables', 'Spoiled, tampered, expired, or wrong item only', 'Report promptly upon arrival for refund/replacement'],
              ['Made-to-Order / Custom Dimensions', 'Manufacturing defect or transit damage only', 'Bespoke production cannot be cancelled or returned for change of mind once started'],
            ],
          },
        },
        {
          id: 'refund-processing-exchanges',
          heading: '2. Return Initiation, Inspection & Refund Timelines',
          paragraphs: [
            'Both registered shoppers and guest buyers can initiate return inspections easily.',
          ],
          bullets: [
            'How to Request: Signed-in buyers submit requests via My Account → Orders; guests use Track Order or contact Customer Care.',
            'Quality Inspection: Returned goods are verified for completeness, serial match, and condition upon arrival.',
            `Refund Method & SLA: Approved refunds return to your original payment method (or verified MFS/bank for COD) within ${pubFacts.refundSlaBusinessDays}.`,
            'Promo Adjustments & Exchanges: Coupon discounts apply proportionally and are non-refundable as cash; direct exchanges depend on live stock.',
          ],
        },
      ],
    },
    {
      id: 'cancellation-policy',
      category: 'Orders & Delivery',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Global Orders',
      scope: 'Pre-dispatch self-service cancellation, guest requests & seller cancellation',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Order Cancellation Policy',
      shortTitle: 'Cancellation Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Pre-Dispatch Cancellation Rules`,
      summary:
        'When an order can be cancelled before packing/dispatch, how guests and account holders cancel, and automatic refunds if a seller cannot fulfill.',
      relatedIds: ['return-policy', 'shipping-policy', 'payment-policy', 'customer-support-policy'],
      sections: [
        {
          id: 'pre-dispatch-cancellation',
          heading: '1. Pre-Dispatch Self-Service Cancellation',
          paragraphs: [
            'Orders may be cancelled with zero penalty prior to warehouse packing or courier handover.',
          ],
          bullets: [
            `Cutoff Eligibility: ${pubFacts.cancelPreDispatchCutoff} (Confirmed or Processing stages) via My Account → Orders or Track Order.`,
            'Guest Cancellations: Use Track Order with your Order ID and checkout email, or open an urgent Support ticket.',
            'Custom Orders: Made-to-order pieces cannot be cancelled once workshop production begins.',
          ],
        },
        {
          id: 'after-dispatch-seller-cancel',
          heading: '2. Post-Dispatch Orders & Seller Cancellations',
          paragraphs: [
            'Once parcels enter courier custody, cancellation shifts to standard return processing.',
          ],
          bullets: [
            'Packed or Shipped Parcels: Automated cancellation closes once packed or shipped; follow the Return Policy after delivery.',
            `Unfulfillable Orders: If Kinto Studio or a Partner Seller cannot dispatch due to stock loss or QC failure, a full refund is issued within ${pubFacts.refundSlaBusinessDays}.`,
          ],
        },
      ],
    },
    {
      id: 'payment-policy',
      category: 'Payments',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Cross-Border FX',
      scope: 'Active payment gateways, COD caps, currency conversion & failed deductions',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Payment, Billing & Currency Policy',
      shortTitle: 'Payment Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Active Checkout Channels`,
      summary:
        'Lists only genuinely enabled checkout channels, BDT vs USD FX rules, COD verification rules, failed/duplicate charge handling, and invoice standards.',
      relatedIds: ['international-orders-policy', 'shipping-policy', 'cancellation-policy', 'privacy-policy'],
      sections: [
        {
          id: 'active-methods',
          heading: '1. Supported Payment Channels',
          paragraphs: [
            `Currently active checkout channel(s): ${gateways.activeLabels.join(', ')}.`,
          ],
          table: {
            headers: ['Payment Channel', 'Current Status', 'Operating Scope'],
            rows: gateways.rows,
          },
        },
        {
          id: 'currency-fx-cod',
          heading: '2. Currency Settlement & Cash on Delivery',
          paragraphs: [
            'Settlement currency and COD eligibility follow destination geography and order limits.',
          ],
          bullets: [
            'Domestic BDT Billing: All orders delivered inside Bangladesh settle in Bangladesh Taka (BDT).',
            'International USD Billing: Deliveries outside Bangladesh settle in USD using the locked checkout exchange-rate snapshot recorded on your receipt.',
            'COD Settlement Rules: Cash on Delivery remains in COD Pending status until courier cash collection; freight orders, restricted zones, or orders above zone caps require prepaid verification.',
          ],
        },
        {
          id: 'failed-duplicate-deductions',
          heading: '3. Failed Authorizations & Duplicate Debits',
          paragraphs: [
            'Idempotency safeguards protect shoppers from duplicate charges during gateway retries.',
          ],
          bullets: [
            'Session Protection: Every checkout quote carries a unique idempotency key so interrupted retries never create duplicate orders.',
            `Reconciliation Support: If a bank or wallet debits funds without confirmation, email ${pubFacts.supportEmail} with your transaction reference rather than placing a second order immediately.`,
          ],
        },
      ],
    },
    {
      id: 'warranty-policy',
      category: 'Returns & Warranty',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Manufacturer Channels',
      scope: 'Product warranties, seller vs maker coverage, exclusions & authenticity',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Warranty & Product Authenticity Policy',
      shortTitle: 'Warranty Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Product-Specific Disclosures`,
      summary:
        'Explains how manufacturer, seller, and studio warranties apply per SKU, required proof of purchase, exclusions, and counterfeit investigation steps.',
      relatedIds: ['return-policy', 'product-safety', 'prohibited-items', 'terms'],
      sections: [
        {
          id: 'warranty-scope',
          heading: '1. Product-Level Warranty Scope',
          paragraphs: [
            'Applicable warranty periods vary by department and are displayed on each Product Detail Page.',
          ],
          bullets: [
            'Coverage Start Date: Warranty coverage starts on the recorded delivery date unless serial registration specifies otherwise.',
            'Remedy Options: Covered faults are resolved via authorized repair, component replacement, or refund without limiting statutory Bangladesh consumer rights.',
            'Consumables & Apparel: Unless explicitly stated, apparel and perishable consumables rely on statutory defect and transit-damage remedies.',
          ],
        },
        {
          id: 'claims-authenticity',
          heading: '2. Authenticity Guarantee, Exclusions & Claims',
          paragraphs: [
            'All direct and Partner Seller goods are subject to strict authenticity verification.',
          ],
          bullets: [
            'Anti-Counterfeit Rule: Replicas are prohibited; unverified supply-chain claims result in listing removal and a full customer refund.',
            'Standard Exclusions: Physical impact, liquid ingress on non-waterproof units, unauthorized repairs, normal battery wear, and unprotected 220–240V mains surge damage are excluded.',
            `How to Claim: Email ${pubFacts.supportEmail} with your Order ID, serial number, and issue photos to open a warranty ticket.`,
          ],
        },
      ],
    },
    {
      id: 'promo-terms',
      category: 'Shopping',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Bangladesh & Eligible Storefront Orders',
      scope: 'Promotional codes, minimum spend rules, stacking limits & returns',
      requiresLegalReview: false,
      requiresOwnerConfirmation: true,
      title: 'Promotional Offers, Coupons & Discount Terms',
      shortTitle: 'Promo & Coupon Terms',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Single-Code Eligibility`,
      summary:
        'Transparent rules governing coupon codes, minimum subtotal requirements, free-shipping promo waivers, return adjustments, and abuse prevention.',
      relatedIds: ['return-policy', 'payment-policy', 'acceptable-use', 'terms'],
      sections: [
        {
          id: 'active-promo-rules',
          heading: '1. Active Promotions & Eligibility',
          paragraphs: [
            'One promotional code may be applied per order when minimum subtotal requirements are met.',
          ],
          table: activePromosRows.length > 0
            ? {
                headers: ['Promo Code', 'Benefit', 'Minimum Subtotal', 'Description'],
                rows: activePromosRows,
              }
            : undefined,
        },
        {
          id: 'promo-returns-modifications',
          heading: '2. Returns, Shipping Waivers & Fair Use',
          paragraphs: [
            'Promotional adjustments follow net paid amounts and standard courier rules.',
          ],
          bullets: [
            'Refund Calculation: Cancelled or returned orders refund strictly the net cash amount paid after discount; coupon value is not redeemable as cash.',
            'Shipping Promos: Free-shipping codes waive base standard courier charges; heavy or overweight surcharges may still apply.',
            'Abuse Prevention: Automated scraping or multi-account coupon farming may result in order cancellation.',
          ],
        },
      ],
    },
    {
      id: 'international-orders-policy',
      category: 'Orders & Delivery',
      legacyCategory: 'Commerce & Logistics',
      jurisdiction: 'Cross-Border Corridors Outside Bangladesh',
      scope: 'USD billing, FX conversion snapshots, customs duties & return logistics',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'International Orders, Customs & FX Policy',
      shortTitle: 'International & Customs',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Cross-Border Rules`,
      summary:
        'Explains USD billing for international destinations, locked FX rate snapshots, recipient customs duties/taxes, COD unavailability abroad, and carrier restrictions.',
      relatedIds: ['shipping-policy', 'payment-policy', 'return-policy', 'terms'],
      sections: [
        {
          id: 'fx-billing',
          heading: '1. USD Billing & Payment Eligibility',
          paragraphs: [
            'Deliveries outside Bangladesh settle in US Dollars with a locked rate snapshot.',
          ],
          bullets: [
            'Immutable FX Snapshot: Checkout locks the USD quote and exchange-rate snapshot directly onto your order receipt.',
            'Prepaid Requirement: Cash on Delivery is unavailable outside Bangladesh; an active card or online gateway channel is required.',
          ],
        },
        {
          id: 'customs-duties-restrictions',
          heading: '2. Customs Duties, VAT & Export Restrictions',
          paragraphs: [
            'International shipments operate on Delivered At Place (DAP) terms unless stated otherwise.',
          ],
          bullets: [
            'Import Duties & Taxes: Checkout freight covers air transit only; destination import duties, VAT/GST, and brokerage fees are the recipient’s responsibility.',
            'Air Export Exclusions: High-capacity lithium cells, pressurized aerosols, and restricted botanicals or foods may be ineligible for international dispatch.',
            'Mandatory Local Laws: Consumer protection rights required under the buyer’s destination country law remain unaffected.',
          ],
        },
      ],
    },
    {
      id: 'reviews-policy',
      category: 'Shopping',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Storefront Product Reviews & Q&A',
      scope: 'Eligibility, moderation, authenticity & prohibited review manipulation',
      requiresLegalReview: false,
      requiresOwnerConfirmation: false,
      title: 'Product Reviews & User-Generated Content Policy',
      shortTitle: 'Reviews & UGC Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Honest Feedback Standards`,
      summary:
        'Standards for authentic product reviews and customer Q&A, moderation criteria, ban on paid/fake reviews, and reporting procedures.',
      relatedIds: ['acceptable-use', 'privacy-policy', 'marketplace-terms', 'intellectual-property'],
      sections: [
        {
          id: 'review-authenticity',
          heading: '1. Authenticity & Verified Purchase Badges',
          paragraphs: [
            'Signed-in customers can share honest product reviews and ask catalog questions.',
          ],
          bullets: [
            'Verified Badge: Displayed strictly when server records confirm a fulfilled order for the reviewed item.',
            'Zero Manipulation: Paid reviews, undisclosed incentives, seller self-reviews, and competitor sabotage are prohibited and removed.',
          ],
        },
        {
          id: 'moderation-license',
          heading: '2. Content Guidelines & Moderation',
          paragraphs: [
            'Submitted reviews must stay focused on genuine product quality, sizing, and delivery experience.',
          ],
          bullets: [
            'Prohibited Content: Harassment, hate speech, personal phone numbers or addresses, unverified medical claims, and spam links are rejected.',
            `Publication License & Appeals: Submitting feedback grants Kinto Studio a non-exclusive license to display it alongside listings; report concerns to ${pubFacts.supportEmail}.`,
          ],
        },
      ],
    },
    {
      id: 'marketplace-terms',
      category: 'Seller Information',
      legacyCategory: 'Marketplace Governance',
      jurisdiction: 'Bangladesh Multi-Vendor Platform',
      scope: 'Buyer-seller separation, escrow protection & dispute triage',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Marketplace & Buyer-Seller Platform Terms',
      shortTitle: 'Marketplace Terms',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Hybrid 1P / 3P Disclosure`,
      summary:
        'Defines Kinto Studio’s dual role as direct retailer on house items and regulated marketplace intermediary for independent Partner Seller Studios.',
      relatedIds: ['seller-agreement', 'terms', 'prohibited-items', 'customer-support-policy'],
      sections: [
        {
          id: 'platform-role',
          heading: '1. Direct Studio Editions vs Partner Seller Studios',
          paragraphs: [
            'Product detail pages clearly distinguish house items from third-party partner listings.',
          ],
          bullets: [
            'Seller Responsibility: Independent Partner Seller Studios remain responsible for inventory accuracy, authentic sourcing, packaging, and stated warranties.',
            'Platform Coordination: Kinto Studio manages unified discovery, authoritative BDT/USD quotes, courier tracking, and post-purchase dispute triage.',
          ],
        },
        {
          id: 'dispute-settlement-protection',
          heading: '2. Escrow Holds & Buyer Protection',
          paragraphs: [
            'Settlement holds protect buyers when delivery or quality issues arise.',
          ],
          bullets: [
            'Reserve Safeguards: Seller disbursements may be held temporarily if a parcel is overdue, defective, or under authenticity review.',
            'Confirmed Claims: Verified non-delivery or wrong-item claims are resolved via full refund to the customer.',
          ],
        },
      ],
    },
    {
      id: 'seller-agreement',
      category: 'Seller Information',
      legacyCategory: 'Marketplace Governance',
      jurisdiction: 'Bangladesh Commercial & Tax Law',
      scope: 'Partner seller onboarding, listing license, fulfillment SLA, payouts & indemnity',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Seller Terms & Conditions (Partner Agreement)',
      shortTitle: 'Seller Agreement',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Commercial Partner Terms`,
      summary:
        'Binding partner terms covering seller KYC/tax responsibilities, listing compliance, dispatch SLAs, payouts/reserves, customer data limits, and appeals.',
      relatedIds: ['marketplace-terms', 'prohibited-items', 'intellectual-property', 'warranty-policy'],
      sections: [
        {
          id: 'seller-eligibility-tax',
          heading: '1. Merchant Eligibility, KYC & Tax Compliance',
          paragraphs: [
            'Approved Partner Seller Studios operate as independent merchants rather than employees or agents of Kinto Studio.',
          ],
          bullets: [
            'Statutory Documentation: Sellers must maintain valid Trade License, e-TIN, VAT/BIN records, and applicable sector approvals (such as BSTI).',
            'Catalog Warranties: Sellers warrant that every listed SKU is genuine, safe, accurately priced, weighed accurately for shipping, and IP-compliant.',
          ],
        },
        {
          id: 'fulfillment-payouts-data',
          heading: '2. Fulfillment SLAs, Payouts & Data Limits',
          paragraphs: [
            'Sellers must uphold dispatch service levels and handle customer delivery data strictly for order fulfillment.',
          ],
          bullets: [
            'Dispatch & Remedies: Pack orders within stated lead times and honor approved return or warranty remedies.',
            'Strict Data Restriction: Customer delivery data may never be exported or used for off-platform solicitation.',
            `Commercial Schedule: Commission rates (${isPlaceholderValue(facts.sellerCommissionSummary) ? 'as confirmed in onboarding' : facts.sellerCommissionSummary}) and payouts (${isPlaceholderValue(facts.sellerPayoutCycle) ? 'published in Seller Settings upon sign-off' : facts.sellerPayoutCycle}) remain subject to refund reserves; appeals go to ${pubFacts.legalEmail}.`,
          ],
        },
      ],
    },
    {
      id: 'prohibited-items',
      category: 'Seller Information',
      legacyCategory: 'Marketplace Governance',
      jurisdiction: 'Bangladesh Laws & Payment Provider Rules',
      scope: 'Restricted SKUs, counterfeit ban, hazardous goods & reporting',
      requiresLegalReview: true,
      requiresOwnerConfirmation: false,
      title: 'Prohibited & Restricted Products Policy',
      shortTitle: 'Prohibited Items',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Catalog Enforcement`,
      summary:
        'Zero-tolerance product bans aligned with Bangladesh statutes, carrier safety restrictions, and payment-gateway acceptable use schedules.',
      relatedIds: ['seller-agreement', 'product-safety', 'intellectual-property', 'acceptable-use'],
      sections: [
        {
          id: 'banned-goods',
          heading: '1. Strictly Prohibited Product Categories',
          paragraphs: [
            'Listings violating local statutes, carrier safety laws, or payment-provider rules are removed immediately:',
          ],
          bullets: [
            'Counterfeits & Replicas: Unauthorized replicas, counterfeit branded goods, and tampered serial electronics.',
            'Controlled Substances: Narcotics, prescription pharmaceuticals, and unsubstantiated medical cure claims.',
            'Weapons & Explosives: Firearms, ammunition, explosives, and prohibited weapons under Bangladesh law.',
            'Unsafe Consumer Goods: Recalled infant items, uncertified hazardous electricals, or toxic cosmetic adulterants.',
            'Illicit Goods: Pirated media, surveillance malware hardware, or stolen merchandise.',
          ],
        },
        {
          id: 'reporting-enforcement',
          heading: '2. Regulated Goods & Violation Reporting',
          paragraphs: [
            'Specialized items require safety disclosures and compliant carrier routing.',
          ],
          bullets: [
            'Ground Routing: High-capacity lithium batteries and sharp tools require safety labeling and ground-only courier transit.',
            `Takedown Reports: Report suspected prohibited listings immediately to ${pubFacts.legalEmail} with the product URL or SKU.`,
          ],
        },
      ],
    },
    {
      id: 'product-safety',
      category: 'Returns & Warranty',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Bangladesh Product & Department Standards',
      scope: 'Department safety disclosures across all 10 catalog departments',
      requiresLegalReview: false,
      requiresOwnerConfirmation: false,
      title: 'Product Safety & Department Disclaimers',
      shortTitle: 'Product Safety',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Multi-Department Precautions`,
      summary:
        'Essential electrical, cosmetic patch-test, food allergen, toy age-grading, mechanical PPE, and wellness non-medical disclaimers.',
      relatedIds: ['warranty-policy', 'prohibited-items', 'return-policy'],
      sections: [
        {
          id: 'safety-matrix',
          heading: '1. Department-Specific Safety & Usage Precautions',
          paragraphs: [
            'Catalog descriptions do not replace licensed medical, veterinary, nutritional, or electrical engineering advice.',
          ],
          table: {
            headers: ['Department', 'Required Customer Precaution'],
            rows: [
              ['Beauty & Personal Care', 'External cosmetic use only; perform a 24-hour skin patch test before full application.'],
              ['Grocery, Coffee & Pantry', 'Inspect ingredient/allergen markings and best-before dates immediately upon parcel arrival.'],
              ['Baby, Kids & Montessori Toys', 'Follow manufacturer age ratings; small components pose choking hazards under age 3.'],
              ['Electronics & Audio', 'Verify 220–240V / 50Hz Bangladesh mains compatibility or USB-PD rating with surge protection.'],
              ['Automotive & Industrial Tools', 'Wear eye, ear, and hand PPE and stay within rated RPM/torque limits.'],
              ['Health, Wellness & Pets', 'Not intended to diagnose, treat, cure, or prevent disease; consult a doctor or veterinarian.'],
            ],
          },
        },
      ],
    },
    {
      id: 'acceptable-use',
      category: 'Privacy & Legal',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Platform Integrity & Anti-Abuse',
      scope: 'Permitted browsing, anti-scraping, COD abuse & account integrity',
      requiresLegalReview: true,
      requiresOwnerConfirmation: false,
      title: 'Acceptable Use Policy',
      shortTitle: 'Acceptable Use',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Security & Fair Access`,
      summary:
        'Rules prohibiting automated scraping, credential stuffing, fraudulent COD refusals, promo exploitation, and abusive platform conduct.',
      relatedIds: ['terms', 'reviews-policy', 'intellectual-property'],
      sections: [
        {
          id: 'prohibited-activity',
          heading: '1. Prohibited Platform & Account Conduct',
          paragraphs: ['To keep marketplace operations reliable for shoppers and sellers, users must not:'],
          bullets: [
            'Security & Automation Abuse: Run automated scrapers, bots, credential-stuffing attacks, or bypass rate limits and session controls.',
            'Fulfillment & Payment Abuse: Submit false delivery addresses, repeatedly refuse COD parcels in bad faith, or file fraudulent chargebacks.',
            'Content & Promo Manipulation: Upload malicious scripts or manipulate search rankings, reviews, or coupon eligibility.',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      category: 'Seller Information',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Copyright Act 2023 & Trademarks Act 2009 (Bangladesh)',
      scope: 'Platform marks, seller listing rights & infringement takedowns',
      requiresLegalReview: true,
      requiresOwnerConfirmation: false,
      title: 'Intellectual Property & Takedown Policy',
      shortTitle: 'IP & Copyright Policy',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Rights Enforcement`,
      summary:
        'Respect for brand trademarks and maker copyrights, plus how rights holders submit verified notice-and-takedown requests.',
      relatedIds: ['prohibited-items', 'seller-agreement', 'reviews-policy'],
      sections: [
        {
          id: 'takedown-notices',
          heading: '1. Intellectual Property Rights & Takedown Notices',
          paragraphs: [
            'Kinto Studio respects third-party trademarks and copyrights under the Copyright Act 2023 and Trademarks Act 2009.',
          ],
          bullets: [
            'Platform Assets: Storefront branding, editorial photography, and codebase remain protected intellectual property.',
            `Submitting a Notice: Rights owners may email ${pubFacts.legalEmail} with mark/registration proof, affected SKU/URL, proof of authority, and a good-faith declaration.`,
            'Enforcement Action: Substantiated notices trigger prompt listing suspension pending seller verification.',
          ],
        },
      ],
    },
    {
      id: 'customer-support-policy',
      category: 'Orders & Delivery',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Bangladesh Consumer Support & Escalation',
      scope: 'Support channels, operating hours, complaint triage & external consumer remedies',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Contact, Complaints & Dispute Resolution Policy',
      shortTitle: 'Contact & Disputes',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Escalation Pathway`,
      summary:
        'Verified support channels, realistic complaint investigation steps, grievance escalation, and statutory consumer complaint rights.',
      relatedIds: ['return-policy', 'cancellation-policy', 'warranty-policy', 'terms'],
      sections: [
        {
          id: 'support-channels-contact',
          heading: '1. Support Channels & Ticket Submission',
          paragraphs: [
            'Multiple direct channels connect you with Kinto Studio Customer Care.',
          ],
          bullets: [
            `Primary Channels: Submit tickets via the Contact page (/contact), My Account / Track Order, or email ${pubFacts.supportEmail}.`,
            `Service Schedule: ${pubFacts.supportHours}.`,
            'Faster Resolution: Always include your Order ID (e.g., KS-10512) and photos when reporting transit damage, missing items, or payment discrepancies.',
          ],
        },
        {
          id: 'complaint-escalation-route',
          heading: '2. Grievance Escalation & Statutory Remedies',
          paragraphs: [
            'Unresolved complaints follow a clear compliance escalation route.',
          ],
          bullets: [
            `Compliance Desk Review: Escalate unresolved delivery, return, or refund tickets to ${pubFacts.legalEmail} with your Support Ticket Reference.`,
            'External Statutory Rights: Nothing restricts your right to file a complaint with the Directorate of National Consumer Rights Protection (DNCRP) or competent Bangladesh courts.',
          ],
        },
      ],
    },
    {
      id: 'data-retention-policy',
      category: 'Privacy & Legal',
      legacyCategory: 'Core Agreements',
      jurisdiction: 'Bangladesh Statutory Recordkeeping',
      scope: 'Retention criteria for accounts, invoices, acceptance logs & browser storage',
      requiresLegalReview: true,
      requiresOwnerConfirmation: true,
      title: 'Data Retention & Deletion Policy',
      shortTitle: 'Data Retention',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Storage Lifecycle`,
      summary:
        'Retention criteria distinguishing active profiles, statutory order/tax ledgers, consent acceptance logs, and user-cleared browser storage.',
      relatedIds: ['privacy-policy', 'cookie-policy', 'terms'],
      sections: [
        {
          id: 'retention-criteria',
          heading: '1. Record Retention & Deletion Rules',
          paragraphs: [
            'Personal records are retained strictly as needed for fulfillment, warranties, and Bangladesh statutory tax/audit compliance:',
          ],
          table: {
            headers: ['Record Category', 'Retention Standard', 'Deletion / Withdrawal Rule'],
            rows: [
              ['Account Profile & Saved Addresses', 'Retained while account remains active', `Deleted/anonymized upon verified deletion request to ${pubFacts.legalEmail}`],
              ['Order Receipts, Tax & Policy Acceptance Snapshots', 'Retained per Bangladesh statutory VAT/audit schedule', 'Preserved for dispute defense and legal accounting compliance'],
              ['Support Tickets & Return Inspection Notes', 'Retained during active warranty/dispute lifecycle', 'Archived or purged once statutory claim windows expire'],
              ['Optional Local Search & View History', 'Browser-local only', 'Cleared immediately when optional cookie toggles are switched off'],
            ],
          },
        },
      ],
    },
    {
      id: 'accessibility',
      category: 'Privacy & Legal',
      legacyCategory: 'Safety & Rights',
      jurisdiction: 'Global Storefront Web Experience',
      scope: 'Keyboard accessibility, assistive technology practices, known limits & reporting',
      requiresLegalReview: false,
      requiresOwnerConfirmation: false,
      title: 'Digital Accessibility Statement',
      shortTitle: 'Accessibility',
      subtitle: `Effective ${pubFacts.effectiveDate} · Version ${POLICY_BASE_VERSION} · Inclusive Storefront Commitment`,
      summary:
        'Outlines ongoing engineering practices for keyboard navigation, screen-reader landmarks, reduced motion, known constraints, and barrier reporting.',
      relatedIds: ['customer-support-policy', 'terms', 'privacy-policy'],
      sections: [
        {
          id: 'accessibility-practices',
          heading: '1. Assistive Technology & Inclusive Design',
          paragraphs: [
            'We continually refine storefront usability across assistive technologies and reading preferences.',
          ],
          bullets: [
            'Built-In Support: Keyboard navigation, semantic landmarks, reduced-motion preferences, high-contrast light/dark modes, and six storefront languages (EN, বাংলা, हिन्दी, العربية, ES, FR).',
            'Transparency Note: Focus order and contrast are tested during updates, though an independent third-party WCAG certification audit has not yet been completed.',
          ],
        },
        {
          id: 'known-limits-feedback',
          heading: '2. Known Limitations & Barrier Support',
          paragraphs: [
            'Our care team assists directly if any storefront media or control presents an accessibility obstacle.',
          ],
          bullets: [
            'Partner Media: Some third-party Partner Seller product images or spec sheets may lack complete alternative text while catalog audits continue.',
            `Report a Barrier: Email ${pubFacts.supportEmail} with the page URL and assistive tool used so our team can remediate the issue or help complete your order.`,
          ],
        },
      ],
    },
  ];

  // Build 10 explicit Not Applicable optional policy records based on audited storefront features
  const notApplicableTemplates: Array<{
    id: string;
    title: string;
    shortTitle: string;
    category: PolicyCategory;
    reason: string;
  }> = [
    {
      id: 'loyalty-terms',
      title: 'Loyalty & Rewards Program Terms',
      shortTitle: 'Loyalty Terms',
      category: 'Shopping',
      reason: 'No loyalty points, tier wallet, or reward redemption system exists in this storefront.',
    },
    {
      id: 'gift-cards-terms',
      title: 'Gift Card & Store Voucher Terms',
      shortTitle: 'Gift Card Terms',
      category: 'Payments',
      reason: 'Digital or physical Gift Card issuance and redemption are not implemented on this platform.',
    },
    {
      id: 'subscription-terms',
      title: 'Subscription & Auto-Renewal Terms',
      shortTitle: 'Subscription Terms',
      category: 'Payments',
      reason: 'All orders are single one-time purchases; recurring billing or auto-renewal subscriptions are not supported.',
    },
    {
      id: 'preorder-backorder-policy',
      title: 'Pre-Order & Backorder Policy',
      shortTitle: 'Pre-Order Policy',
      category: 'Orders & Delivery',
      reason: 'Checkout only permits ordering available in-stock or made-to-order SKUs with stock verification; no backorder queue exists.',
    },
    {
      id: 'bnpl-installment-terms',
      title: 'Installment & Buy Now Pay Later (BNPL) Terms',
      shortTitle: 'BNPL / EMI Terms',
      category: 'Payments',
      reason: 'No EMI, split-installment, or third-party BNPL financing provider is integrated.',
    },
    {
      id: 'digital-downloads-policy',
      title: 'Digital Products & Downloads Policy',
      shortTitle: 'Digital Products Policy',
      category: 'Shopping',
      reason: 'Catalog strictly sells shippable physical goods across 10 retail departments with courier delivery.',
    },
    {
      id: 'rental-policy',
      title: 'Product Rental Policy',
      shortTitle: 'Rental Policy',
      category: 'Orders & Delivery',
      reason: 'Marketplace supports outright sales only; short-term equipment or product rentals are not offered.',
    },
    {
      id: 'trade-in-policy',
      title: 'Device Trade-In Policy',
      shortTitle: 'Trade-In Policy',
      category: 'Returns & Warranty',
      reason: 'No used-item valuation or trade-in credit exchange flow is implemented.',
    },
    {
      id: 'price-match-policy',
      title: 'Price Match Guarantee Policy',
      shortTitle: 'Price Match Policy',
      category: 'Shopping',
      reason: 'No competitor price-matching claim workflow or retrospective credit program is offered.',
    },
    {
      id: 'affiliate-disclosure',
      title: 'Affiliate & Influencer Disclosure Policy',
      shortTitle: 'Affiliate Disclosure',
      category: 'Seller Information',
      reason: 'No affiliate referral tracking codes, creator commission links, or sponsored payout program exist.',
    },
  ];

  const activeRecords: PolicyDocumentRecord[] = rawActiveTemplates.map((tpl) => {
    const cleanSections = sanitizePolicySections(tpl.sections).map((sec) => ({
      ...sec,
      paragraphs: sec.paragraphs.map((p) => stripInternalCounselNotes(p)),
      bullets: sec.bullets?.map((b) => stripInternalCounselNotes(b)),
    }));
    const unresolved = scanUnresolvedPlaceholders({
      title: tpl.title,
      summary: tpl.summary,
      sections: cleanSections,
    });

    const initialVersion: PolicyVersionRecord = {
      version: POLICY_BASE_VERSION,
      title: tpl.title,
      subtitle: tpl.subtitle,
      summary: tpl.summary,
      sections: cleanSections,
      effectiveDate: pubFacts.effectiveDate,
      lastUpdated: pubFacts.effectiveDate,
      publishedAt: nowIso,
      publishedBy: 'Platform Governance Baseline',
      changeNote: 'Initial structured marketplace policy release with live operational parameters.',
      materialChange: false,
    };

    return {
      id: tpl.id,
      slug: tpl.id,
      category: tpl.category,
      legacyCategory: tpl.legacyCategory,
      applicability: tpl.id === 'terms' || tpl.id === 'privacy-policy' || tpl.id === 'cookie-policy' || tpl.id === 'shipping-policy' || tpl.id === 'return-policy' || tpl.id === 'cancellation-policy' || tpl.id === 'payment-policy' || tpl.id === 'warranty-policy' || tpl.id === 'accessibility' || tpl.id === 'customer-support-policy' ? 'required' : 'applicable',
      status: 'published',
      jurisdiction: tpl.jurisdiction,
      scope: tpl.scope,
      ownerRole: 'Platform Admin & Legal Counsel',
      requiresLegalReview: tpl.requiresLegalReview,
      requiresOwnerConfirmation: tpl.requiresOwnerConfirmation,
      unresolvedPlaceholders: unresolved,
      currentVersion: POLICY_BASE_VERSION,
      effectiveDate: pubFacts.effectiveDate,
      lastUpdated: pubFacts.effectiveDate,
      title: tpl.title,
      shortTitle: tpl.shortTitle,
      subtitle: tpl.subtitle,
      summary: tpl.summary,
      relatedIds: tpl.relatedIds,
      sections: cleanSections,
      versionHistory: [initialVersion],
    };
  });

  const notApplicableRecords: PolicyDocumentRecord[] = notApplicableTemplates.map((na) => ({
    id: na.id,
    slug: na.id,
    category: na.category,
    legacyCategory: 'Core Agreements',
    applicability: 'not_applicable',
    notApplicableReason: na.reason,
    status: 'not_applicable',
    jurisdiction: 'N/A',
    scope: na.reason,
    ownerRole: 'Platform Admin',
    requiresLegalReview: false,
    requiresOwnerConfirmation: false,
    unresolvedPlaceholders: [],
    currentVersion: POLICY_BASE_VERSION,
    effectiveDate: pubFacts.effectiveDate,
    lastUpdated: pubFacts.effectiveDate,
    title: na.title,
    shortTitle: na.shortTitle,
    subtitle: 'Not Applicable — Feature Not Implemented',
    summary: na.reason,
    relatedIds: [],
    sections: [],
    versionHistory: [],
  }));

  return [...activeRecords, ...notApplicableRecords];
}

export interface PolicyTranslationContext {
  facts?: PolicyFactsConfig | PolicyFactsPublicSummary;
  shippingConfig?: ShippingRuleConfig;
  currencyConfig?: CurrencyRateState;
  promotions?: ManagedPromoRecord[];
}

function getGatewayStatusesList(): Array<{
  method: Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>;
  enabled: boolean;
}> {
  const methods: Array<Exclude<PaymentMethodId, 'mastercard' | 'card' | 'wallet'>> = [
    'cod',
    'bkash',
    'nagad',
    'rocket',
    'sslcommerz',
    'visa',
    'bank-transfer',
  ];
  return methods.map((method) => ({
    method,
    enabled: getGatewayConfigStatus(method).enabled,
  }));
}

export function projectPublicPolicyDocument(
  record: PolicyDocumentRecord,
  requestedVersion?: string,
  lang: LanguageCode = 'en',
  context?: PolicyTranslationContext
): PolicyDocumentRecord | null {
  if (record.applicability === 'not_applicable') return null;
  if (record.status !== 'published' && record.versionHistory.length === 0) return null;

  let projected: PolicyDocumentRecord | null = null;

  // Serve immutable requested historical version when specified (e.g. from order receipt ?version=2026.11)
  if (requestedVersion && requestedVersion.trim()) {
    const cleanVer = requestedVersion.trim();
    const matched = record.versionHistory.find((v) => v.version === cleanVer);
    if (matched) {
      projected = {
        ...record,
        currentVersion: matched.version,
        title: sanitizePlainText(matched.title),
        subtitle: stripInternalCounselNotes(sanitizePlainText(matched.subtitle)),
        summary: stripInternalCounselNotes(sanitizePlainText(matched.summary)),
        sections: sanitizePolicySections(matched.sections),
        effectiveDate: sanitizePlainText(matched.effectiveDate),
        lastUpdated: sanitizePlainText(matched.lastUpdated),
        draftContent: undefined,
      };
    }
  }

  if (!projected) {
    // Always prefer last published immutable snapshot for public viewing so unapproved edits never leak
    const latestPublished = record.versionHistory[0];
    const baseTitle = latestPublished ? latestPublished.title : record.title;
    const baseSubtitle = latestPublished ? latestPublished.subtitle : record.subtitle;
    const baseSummary = latestPublished ? latestPublished.summary : record.summary;
    const baseSections = latestPublished ? latestPublished.sections : record.sections;
    const baseEffective = latestPublished ? latestPublished.effectiveDate : record.effectiveDate;
    const baseLastUpdated = latestPublished ? latestPublished.lastUpdated : record.lastUpdated;
    const baseVersion = latestPublished ? latestPublished.version : record.currentVersion;

    projected = {
      ...record,
      currentVersion: baseVersion,
      title: sanitizePlainText(baseTitle),
      subtitle: stripInternalCounselNotes(sanitizePlainText(baseSubtitle)),
      summary: stripInternalCounselNotes(sanitizePlainText(baseSummary)),
      sections: sanitizePolicySections(baseSections).map((sec) => ({
        ...sec,
        paragraphs: sec.paragraphs.map((p) => stripInternalCounselNotes(p)),
        bullets: sec.bullets?.map((b) => stripInternalCounselNotes(b)),
      })),
      effectiveDate: sanitizePlainText(baseEffective),
      lastUpdated: sanitizePlainText(baseLastUpdated),
      unresolvedPlaceholders: [],
      draftContent: undefined,
    };
  }

  const safeLang = normalizePolicyLanguage(lang);
  if (safeLang === 'en') {
    return projected;
  }

  const baseFactsConfig =
    context?.facts && 'legalEntityName' in context.facts ? context.facts : undefined;
  const dynamicVars = buildLocalizedDynamicVars({
    lang: safeLang,
    version: projected.currentVersion,
    facts: context?.facts,
    baseFactsConfig,
    shippingConfig: context?.shippingConfig,
    currencyConfig: context?.currencyConfig,
    promotions: context?.promotions,
    cookieInventory: buildActiveCookieInventory(safeLang),
    gatewayStatuses: getGatewayStatusesList(),
  });

  return localizePolicyRecord(projected, {
    lang: safeLang,
    baseVersion: POLICY_BASE_VERSION,
    dynamicVars,
  });
}

export function getPublicPublishedPolicies(
  policies: PolicyDocumentRecord[],
  lang: LanguageCode = 'en',
  context?: PolicyTranslationContext
): PolicyDocumentRecord[] {
  const safeLang = normalizePolicyLanguage(lang);
  const dynamicVars =
    safeLang === 'en'
      ? undefined
      : buildLocalizedDynamicVars({
          lang: safeLang,
          version: POLICY_BASE_VERSION,
          facts: context?.facts,
          baseFactsConfig:
            context?.facts && 'legalEntityName' in context.facts ? context.facts : undefined,
          shippingConfig: context?.shippingConfig,
          currencyConfig: context?.currencyConfig,
          promotions: context?.promotions,
          cookieInventory: buildActiveCookieInventory(safeLang),
          gatewayStatuses: getGatewayStatusesList(),
        });

  return policies
    .map((doc) => {
      const projected = projectPublicPolicyDocument(doc, undefined, 'en');
      if (!projected) return null;
      if (safeLang === 'en') return projected;
      return localizePolicyRecord(projected, {
        lang: safeLang,
        baseVersion: POLICY_BASE_VERSION,
        dynamicVars,
      });
    })
    .filter((doc): doc is PolicyDocumentRecord => doc !== null);
}

export function bumpSemverLikeVersion(current: string): string {
  const parts = String(current || POLICY_BASE_VERSION).split('.');
  if (parts.length === 2) {
    const year = parts[0];
    const minor = Number(parts[1]) || 11;
    return `${year}.${minor + 1}.1`;
  }
  if (parts.length >= 3) {
    const patch = (Number(parts[2]) || 0) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }
  return `${POLICY_BASE_VERSION}.1`;
}

export function savePolicyDraft(
  doc: PolicyDocumentRecord,
  input: {
    title: string;
    shortTitle?: string;
    subtitle?: string;
    summary: string;
    effectiveDate?: string;
    sections: PolicySection[];
    changeNote?: string;
    materialChange?: boolean;
    updatedBy: string;
  }
): PolicyDocumentRecord {
  if (doc.applicability === 'not_applicable') {
    throw new Error(`Policy "${doc.slug}" is marked Not Applicable and cannot be drafted.`);
  }
  const cleanTitle = sanitizePlainText(input.title || doc.title);
  const cleanShort = sanitizePlainText(input.shortTitle || doc.shortTitle);
  const cleanSubtitle = sanitizePlainText(input.subtitle || doc.subtitle);
  const cleanSummary = sanitizePlainText(input.summary || doc.summary);
  const cleanEffective = sanitizePlainText(input.effectiveDate || doc.effectiveDate);
  const cleanSections = sanitizePolicySections(input.sections);

  if (!cleanTitle || cleanSections.length === 0) {
    throw new Error('Policy draft requires a non-empty title and at least one sanitized section.');
  }

  const unresolvedPlaceholders = scanUnresolvedPlaceholders({
    cleanTitle,
    cleanSummary,
    cleanSections,
  });

  const nextStatus: PolicyStatus = doc.status === 'published' ? 'draft' : doc.status;

  return {
    ...doc,
    status: nextStatus === 'archived' ? 'draft' : nextStatus,
    unresolvedPlaceholders,
    draftContent: {
      title: cleanTitle,
      shortTitle: cleanShort,
      subtitle: cleanSubtitle,
      summary: cleanSummary,
      effectiveDate: cleanEffective,
      sections: cleanSections,
      changeNote: input.changeNote ? sanitizePlainText(input.changeNote) : undefined,
      materialChange: Boolean(input.materialChange),
      updatedAt: new Date().toISOString(),
      updatedBy: sanitizePlainText(input.updatedBy),
    },
  };
}

export function transitionPolicyStatus(
  doc: PolicyDocumentRecord,
  action: 'submit_review' | 'schedule' | 'publish' | 'archive',
  actorName: string,
  options?: { scheduledFor?: string; forceAllowPlaceholders?: boolean }
): { updated: PolicyDocumentRecord; newVersionPublished?: PolicyVersionRecord } {
  if (doc.applicability === 'not_applicable') {
    throw new Error(`Policy "${doc.slug}" is Not Applicable.`);
  }

  const source = doc.draftContent || {
    title: doc.title,
    shortTitle: doc.shortTitle,
    subtitle: doc.subtitle,
    summary: doc.summary,
    effectiveDate: doc.effectiveDate,
    sections: doc.sections,
    changeNote: undefined,
    materialChange: false,
  };

  const unresolved = scanUnresolvedPlaceholders({
    title: source.title,
    summary: source.summary,
    sections: source.sections,
  });

  if (action === 'submit_review') {
    return {
      updated: {
        ...doc,
        status: 'review',
        unresolvedPlaceholders: unresolved,
      },
    };
  }

  if (action === 'schedule') {
    if (!options?.scheduledFor) {
      throw new Error('Scheduled publication requires a target future ISO timestamp.');
    }
    return {
      updated: {
        ...doc,
        status: 'scheduled',
        scheduledFor: options.scheduledFor,
        unresolvedPlaceholders: unresolved,
      },
    };
  }

  if (action === 'archive') {
    return {
      updated: {
        ...doc,
        status: 'archived',
      },
    };
  }

  // Publish transition
  if (unresolved.length > 0 && !options?.forceAllowPlaceholders) {
    throw new Error(
      `Cannot publish "${doc.shortTitle}": resolve placeholder(s) first: ${unresolved.join(', ')}`
    );
  }

  const nowIso = new Date().toISOString();
  const formattedToday = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const nextVersion = doc.draftContent ? bumpSemverLikeVersion(doc.currentVersion) : doc.currentVersion;
  const publishedSnapshot: PolicyVersionRecord = {
    version: nextVersion,
    title: source.title,
    subtitle: source.subtitle,
    summary: source.summary,
    sections: sanitizePolicySections(source.sections),
    effectiveDate: source.effectiveDate || formattedToday,
    lastUpdated: formattedToday,
    publishedAt: nowIso,
    publishedBy: sanitizePlainText(actorName || 'Admin Compliance Desk'),
    changeNote: source.changeNote || 'Policy revision published.',
    materialChange: Boolean(source.materialChange),
  };

  return {
    newVersionPublished: publishedSnapshot,
    updated: {
      ...doc,
      status: 'published',
      scheduledFor: undefined,
      currentVersion: nextVersion,
      effectiveDate: publishedSnapshot.effectiveDate,
      lastUpdated: publishedSnapshot.lastUpdated,
      title: publishedSnapshot.title,
      shortTitle: source.shortTitle || doc.shortTitle,
      subtitle: publishedSnapshot.subtitle,
      summary: publishedSnapshot.summary,
      sections: publishedSnapshot.sections,
      unresolvedPlaceholders: [],
      draftContent: undefined,
      versionHistory: [publishedSnapshot, ...doc.versionHistory].slice(0, 25),
    },
  };
}

export function buildValidatedAcceptanceRecord(params: {
  policies: PolicyDocumentRecord[];
  requestedPolicyIds: string[];
  requestedVersion?: string;
  jurisdiction?: string;
  marketingOptIn?: boolean;
}): LegalAcceptanceRecord {
  const published = getPublicPublishedPolicies(params.policies);
  const policyVersions: Record<string, string> = {};
  const acceptedIds: string[] = [];

  for (const id of params.requestedPolicyIds) {
    const match = published.find((p) => p.id === id || p.slug === id);
    if (match) {
      acceptedIds.push(match.id);
      policyVersions[match.id] = match.currentVersion;
    }
  }

  if (acceptedIds.length === 0) {
    for (const core of published.slice(0, 3)) {
      acceptedIds.push(core.id);
      policyVersions[core.id] = core.currentVersion;
    }
  }

  return {
    version: params.requestedVersion || POLICY_BASE_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    scope: acceptedIds,
    jurisdiction: params.jurisdiction || 'Bangladesh (Dhaka Courts)',
    acceptedPolicyVersions: policyVersions,
    ...(typeof params.marketingOptIn === 'boolean' ? { marketingOptIn: params.marketingOptIn } : {}),
  };
}

export function createAcceptanceLedgerEntry(params: {
  context: PolicyAcceptanceLedgerEntry['context'];
  subjectRef: string;
  acceptance: LegalAcceptanceRecord;
}): PolicyAcceptanceLedgerEntry {
  return {
    id: `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    context: params.context,
    subjectRef: sanitizePlainText(params.subjectRef),
    policyIds: params.acceptance.scope,
    policyVersions: params.acceptance.acceptedPolicyVersions || {},
    versionTag: params.acceptance.version,
    acceptedAt: params.acceptance.acceptedAt,
    jurisdiction: params.acceptance.jurisdiction,
    ...(typeof params.acceptance.marketingOptIn === 'boolean'
      ? { marketingOptIn: params.acceptance.marketingOptIn }
      : {}),
  };
}

export function buildPolicyChecklistSummary(
  policies: PolicyDocumentRecord[],
  facts: PolicyFactsConfig,
  checklist: LegalReviewChecklistItem[]
): PolicyChecklistSummary {
  const active = policies.filter((p) => p.applicability !== 'not_applicable');
  const notApplicable = policies.filter((p) => p.applicability === 'not_applicable');
  const published = active.filter((p) => p.status === 'published');
  const draftOrReview = active.filter((p) => p.status !== 'published');

  const unresolvedPolicyPlaceholders = active.reduce(
    (sum, p) => sum + p.unresolvedPlaceholders.length,
    0
  );
  const factsPlaceholders = scanUnresolvedPlaceholders(facts).length;

  return {
    totalActivePolicies: active.length,
    totalNotApplicable: notApplicable.length,
    publishedCount: published.length,
    draftOrReviewCount: draftOrReview.length,
    unresolvedPlaceholdersCount: unresolvedPolicyPlaceholders + factsPlaceholders,
    pendingLegalReviewCount: checklist.filter((c) => c.status === 'needs_legal_review').length,
    pendingOwnerFactsCount: checklist.filter((c) => c.status === 'needs_business_confirmation').length + factsPlaceholders,
  };
}
