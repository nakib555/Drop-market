import type {
  CookieInventoryItem,
  CurrencyRateState,
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

export function buildPublicFactsSummary(facts: PolicyFactsConfig): PolicyFactsPublicSummary {
  const hasConfirmedEntityDetails =
    !isPlaceholderValue(facts.legalEntityName) &&
    !isPlaceholderValue(facts.registrationTradeLicense) &&
    !isPlaceholderValue(facts.registeredAddress);

  return {
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
}

export function buildActiveCookieInventory(): CookieInventoryItem[] {
  return [
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
            `This website and storefront are operated by ${operatorDisplay}. By browsing, creating an account, or placing an order, you agree to these Terms & Conditions and the linked policies referenced during checkout.`,
            'You confirm that you are legally competent to enter into a binding contract under the Contract Act 1872 and the Majority Act 1875 of Bangladesh (at least 18 years of age). Both guest checkout and registered accounts are supported; account holders are responsible for keeping login credentials confidential and contact details accurate.',
          ],
          bullets: entityBullets,
        },
        {
          id: 'marketplace-model-listings',
          heading: '2. Marketplace Role (Direct & Partner Seller Listings)',
          paragraphs: [
            'Kinto Studio operates as a multi-category marketplace featuring both Kinto Studio house editions and verified independent third-party Seller Studios. Each product detail page identifies whether an item is fulfilled directly by Kinto Studio or by an independent Partner Seller Studio.',
            'Product descriptions, imagery, pricing, stock availability, and specifications are reviewed for accuracy, but manifest typographical errors, technical pricing mistakes, or sudden stock depletion may occur. Where a manifest listing error prevents fulfillment, Kinto Studio may cancel the affected order prior to dispatch and issue a full refund.',
          ],
        },
        {
          id: 'orders-pricing-payment',
          heading: '3. Order Acceptance, BDT/USD Pricing & Policies by Reference',
          paragraphs: [
            'Submitting an order request at checkout constitutes an offer to purchase; an order is accepted upon server verification of stock, pricing, delivery zone eligibility, and payment confirmation (or Cash on Delivery verification).',
            'Domestic orders inside Bangladesh settle authoritatively in Bangladesh Taka (BDT). International deliveries settle in USD using a rate snapshot captured at checkout quote confirmation. Delivery, returns, cancellations, warranties, product safety, and reviews are governed by their dedicated policies integrated by reference.',
          ],
        },
        {
          id: 'rights-liability-disputes',
          heading: '4. Non-Waivable Consumer Rights, Force Majeure & Governing Law',
          paragraphs: [
            'Nothing in these Terms waives or limits mandatory consumer rights protected under the Consumer Rights Protection Act 2009, the Sale of Goods Act 1930, or applicable Digital Commerce regulations in Bangladesh. Where applicable law provides stronger protections, statutory law prevails.',
            'Neither party is liable for delays caused by events beyond reasonable control (natural disasters, severe transport disruption, regulatory holds, or utility failures). For domestic transactions, these Terms are governed by the laws of Bangladesh with courts in Dhaka holding jurisdiction following a good-faith resolution period via Customer Care.',
          ],
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
          heading: '1. Personal Data We Collect & How It Is Collected',
          paragraphs: [
            'We collect only the personal data reasonably needed to operate the storefront, fulfill orders, prevent fraud, and support customer inquiries. Optional marketing communications and optional browser tracking remain opt-in and are never required to purchase.',
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
          heading: '2. When Data Is Shared With Sellers, Couriers & Gateways',
          paragraphs: [
            'We do not sell personal data. Fulfilling an order requires controlled sharing with necessary processors: Partner Seller Studios receive order line items and delivery area details needed to pack and dispatch items; authorized courier partners receive recipient name, street address, and phone for parcel delivery; active payment providers process payment authorization tokens.',
            'Kinto Studio never stores raw credit/debit card CVV codes or Mobile Financial Service PINs on storefront servers. All payment sessions operate via tokenized transaction references.',
          ],
        },
        {
          id: 'transfers-security-rights',
          heading: '3. Safeguards, Cross-Border Transfers & Privacy Requests',
          paragraphs: [
            'Role-based access controls, signed session tokens, and input validation protect dashboard and customer records; however, no internet system can guarantee absolute security. Cross-border international orders involve sharing delivery data with international air carriers and customs authorities as required to clear parcels.',
            `To request access, correction, marketing withdrawal, or account data erasure (subject to mandatory statutory tax/invoice retention), write to ${pubFacts.legalEmail} or manage privacy toggles inside My Account.`,
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
          heading: '1. Essential Storage vs Consent-Gated Technologies',
          paragraphs: [
            'Essential cookies and browser storage are strictly necessary for sign-in security, shopping bag retention, language, currency, and recording your privacy choice. Disabling essential browser storage may prevent sign-in or cart checkout from functioning.',
            'Optional preferences—Save Search History, Personalized Catalog (Recently Viewed), and Analytics Opt-In—remain off until explicitly enabled via Cookie Preferences. Withdrawing consent immediately clears stored search/view history and halts optional telemetry.',
          ],
        },
        {
          id: 'cookie-inventory-table',
          heading: '2. Active Technology Inventory',
          paragraphs: ['No third-party advertising trackers or retargeting pixels are active on this storefront. Current storage technologies:'],
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
          heading: '1. Service Coverage, Processing & Delivery Estimates',
          paragraphs: [
            `Orders dispatch from Dhaka hubs or verified Partner Seller Studios across all 64 Districts of Bangladesh and supported international corridors. Standard free-shipping eligibility in Dhaka Metro starts at $${dhakaThresholdUsd} USD (approx. ${dhakaThresholdBdt.toLocaleString()} BDT at current reference rate) for qualifying non-freight items.`,
            'All displayed delivery windows in checkout (such as Dhaka 24–48 hours or district 3–5 business days) are good-faith operational estimates—not guaranteed deadlines—and begin once payment authorization or COD verification clears and items pass dispatch check.',
          ],
          table: {
            headers: ['Configured Delivery Zone', 'Estimated Window (Estimate Only)', 'Cash on Delivery Eligibility'],
            rows: zoneTableRows.length > 0 ? zoneTableRows : [['Bangladesh Nationwide & Dhaka Metro', '1–5 Business Days', 'Zone & Cap Dependent']],
          },
        },
        {
          id: 'address-delays-claims',
          heading: '2. Restricted Areas, Address Accuracy, Split Orders & Delays',
          paragraphs: [
            'Remote offshore marine zones (such as offshore island routes flagged during address selection) may be temporarily suspended or restricted from COD. Customers must supply complete street addresses and reachable phone numbers; failed delivery attempts caused by unreachable contacts or incorrect addresses may require rescheduling or re-delivery charges.',
            'Orders containing both direct studio items and Partner Seller Studio items may arrive in separate tracked parcels without extra customer shipping charges beyond the checkout quote. Delays caused by weather, hartals/blockades, public holidays, or courier disruption are communicated proactively via order tracking.',
          ],
        },
        {
          id: 'lost-damaged-parcels',
          heading: '3. Lost, Delayed or Transit-Damaged Parcels',
          paragraphs: [
            `Inspect outer parcel seals upon delivery. Report missing items, courier damage, or non-delivery beyond the estimated window within ${pubFacts.defectReportHours} hours via Track Order or ${pubFacts.supportEmail} so our logistics desk can investigate with the carrier and arrange replacement or refund.`,
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
          heading: '1. Return Eligibility & Category Conditions',
          paragraphs: [
            `Defective, transit-damaged, expired, or wrong-item deliveries should be reported within ${pubFacts.defectReportHours} hours of delivery with order ID and photos for priority replacement or refund at zero return-shipping cost to you.`,
            `Eligible change-of-mind returns may be requested within ${pubFacts.returnWindowDays} days of delivery provided the item is unused, unwashed, with original tags, seals, manuals, and manufacturer packaging intact. Statutory consumer rights always prevail over voluntary policy limits.`,
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
          heading: '2. Return Initiation, Inspection & Refund Processing',
          paragraphs: [
            'Signed-in buyers can submit return requests directly from My Account → Orders. Guest buyers can initiate returns by linking/claiming their order in Track Order or contacting Customer Care with their Order ID and email.',
            `Returned items undergo verification to confirm condition and completeness. Approved refunds return strictly to your original payment method (or verified bank account/MFS for settled Cash on Delivery orders) within ${pubFacts.refundSlaBusinessDays}. Promotional coupon values apply proportionally and are not refunded as cash; direct exchanges depend on live replacement stock.`,
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
          heading: '1. Customer Pre-Dispatch Cancellation Cutoff',
          paragraphs: [
            `Orders in "Confirmed" or "Processing" stage may be cancelled directly (${pubFacts.cancelPreDispatchCutoff}) via My Account → Orders or Track Order with zero cancellation fee.`,
            'Guest shoppers may use Track Order with their Order ID + checkout email to request pre-dispatch cancellation or submit an urgent cancellation ticket to Support. Custom/made-to-order pieces cannot be cancelled once workshop production begins.',
          ],
        },
        {
          id: 'after-dispatch-seller-cancel',
          heading: '2. Already Packed/Shipped Orders & Seller Cancellations',
          paragraphs: [
            'Once an order advances to "Packed", "Shipped", or "Out for Delivery" and enters courier custody, automated cancellation is unavailable; please allow delivery or follow the Return & Refund Policy once delivered.',
            `If Kinto Studio or a Partner Seller Studio cannot fulfill an order due to verified stock loss or pre-dispatch QC failure, we notify you immediately and process a full refund to your original payment method within ${pubFacts.refundSlaBusinessDays}.`,
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
          heading: '1. Supported Payment Channels & Gateway Readiness',
          paragraphs: [
            `Only payment methods actively verified and enabled on server configuration are selectable at checkout. Currently active checkout channel(s): ${gateways.activeLabels.join(', ')}. Additional gateways appear at checkout only once merchant credentials are verified and enabled.`,
          ],
          table: {
            headers: ['Payment Channel', 'Current Status', 'Operating Scope'],
            rows: gateways.rows,
          },
        },
        {
          id: 'currency-fx-cod',
          heading: '2. BDT Domestic Settlement, International USD & Cash on Delivery',
          paragraphs: [
            'Orders shipping within Bangladesh are billed in Bangladesh Taka (BDT). International deliveries outside Bangladesh are quoted and billed in USD using the locked reference exchange rate displayed on your checkout summary (currently configured reference rate snapshot is saved on every order receipt).',
            'Cash on Delivery orders remain in "COD Pending" status until physical courier cash settlement. Heavy freight items, restricted zones, and orders exceeding zone COD limits require prepaid verification when online gateways are enabled.',
          ],
        },
        {
          id: 'failed-duplicate-deductions',
          heading: '3. Pending, Failed or Duplicate Payment Deductions',
          paragraphs: [
            `Each checkout session uses an idempotency key to prevent duplicate orders. If funds are debited by an external bank or wallet without an order confirmation screen, do not reorder immediately—contact ${pubFacts.supportEmail} with your transaction reference and timestamp so we can verify settlement or trigger reversal with the gateway.`,
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
          heading: '1. Verified Product-Level Warranty Coverage',
          paragraphs: [
            'Not all categories carry an identical warranty. Each Product Detail Page explicitly states the applicable warranty term (for example, manufacturer/partner hardware warranty on studio audio or tools, or no extended warranty beyond statutory defect remedies for consumables and apparel).',
            'Warranty periods begin on the recorded delivery date unless a manufacturer warranty card specifies activation upon serial registration. Remedies (repair, component replacement, or refund) follow the stated maker or seller warranty alongside non-excludable Bangladesh consumer rights.',
          ],
        },
        {
          id: 'claims-authenticity',
          heading: '2. Authenticity Commitment, Exclusions & How to Claim',
          paragraphs: [
            'Kinto Studio prohibits replica or counterfeit listings. Any suspected authenticity discrepancy is investigated immediately with invoice/supply-chain verification from the Partner Seller Studio, with a full refund issued if authenticity cannot be substantiated.',
            `Warranty does not cover physical impact damage, liquid damage on non-waterproof hardware, unauthorized repair modifications, normal battery/consumable wear, or mains surge damage on 220–240V electronics used without surge protection. Email ${pubFacts.supportEmail} with your Order ID and serial/photo evidence to initiate a claim.`,
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
          heading: '1. Active Promotions & Eligibility Requirements',
          paragraphs: [
            'Promotional codes apply automatically during cart and checkout calculation when minimum subtotal thresholds and eligibility conditions are satisfied. Only one promotional code may be applied per order unless expressly stated otherwise.',
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
          heading: '2. Returns, Cancellations & Abuse Safeguards',
          paragraphs: [
            'If an order using a percentage discount is cancelled or returned for refund, only the net cash amount actually paid after discount is refunded; coupon face value cannot be redeemed for cash. Free-shipping promo codes waive standard base courier fees while heavy overweight surcharges may still apply per shipping rules.',
            'Kinto Studio reserves the right to cancel orders or revoke coupon privileges in cases of automated scraping, duplicate-account coupon farming, or unauthorized code manipulation.',
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
          heading: '1. USD Settlement & Exchange-Rate Snapshot',
          paragraphs: [
            'While orders inside Bangladesh are settled strictly in Bangladesh Taka (BDT), orders shipping to international addresses outside Bangladesh are quoted and billed in US Dollars (USD) with an immutable exchange rate snapshot stored on the order receipt.',
            'Cash on Delivery (COD) is not available for international deliveries; orders shipped outside Bangladesh require an active online card or gateway channel.',
          ],
        },
        {
          id: 'customs-duties-restrictions',
          heading: '2. Import Duties, Customs Clearance & Restricted Items',
          paragraphs: [
            'International air-freight prices at checkout cover international transit only unless explicitly labeled Duty Paid. Recipient import duties, VAT/GST, brokerage fees, and local customs inspection charges are the buyer’s responsibility under Delivered At Place (DAP) terms.',
            'High-capacity lithium battery items, pressurized aerosols, or region-restricted botanical/food goods may be ineligible for international air export. Mandatory consumer protection laws in the buyer’s delivery country remain unaffected.',
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
          heading: '1. Review Eligibility, Authenticity & Disclosure',
          paragraphs: [
            'Signed-in customers may post product reviews and questions. Badges indicating verified purchase status reflect server-confirmed order records; unverified reviews never display a Verified Purchase label.',
            'Paid, incentivized without clear disclosure, competitor-sabotage, or seller self-written reviews are strictly prohibited and will be removed with potential seller or buyer account suspension.',
          ],
        },
        {
          id: 'moderation-license',
          heading: '2. Prohibited Content, Moderation & Content License',
          paragraphs: [
            'Reviews must focus on the product’s genuine quality, sizing, performance, or delivery experience. Harassment, profanity, hate speech, personal phone numbers/addresses, medical claims, external spam links, or off-topic content will be rejected or removed.',
            `By submitting a review or question, you grant Kinto Studio a non-exclusive license to publish and display that feedback in connection with the listed product. To report suspicious reviews or appeal a moderation decision, contact ${pubFacts.supportEmail}.`,
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
          heading: '1. Direct Studio Listings vs Independent Seller Studios',
          paragraphs: [
            'Every product listing clearly displays its brand and fulfilling Seller Studio. When an item is sold by an independent third-party Seller Studio, that Seller Studio is responsible for inventory accuracy, authentic sourcing, packaging, and honoring stated warranties.',
            'Kinto Studio facilitates unified discovery, BDT/USD quote calculation, courier tracking coordination, and structured post-purchase dispute handling across both first-party and partner listings.',
          ],
        },
        {
          id: 'dispute-settlement-protection',
          heading: '2. Buyer Protection & Settlement Safeguards',
          paragraphs: [
            'To protect buyers, platform settlement policies allow temporary holds on seller funds when a parcel is overdue, undelivered, defective, or flagged for authenticity review. Confirmed non-delivery or wrong-item claims are resolved via full refund to the customer.',
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
          heading: '1. Independent Merchant Status, KYC & Bangladesh Tax Compliance',
          paragraphs: [
            'Approved Partner Seller Studios operate as independent merchants—not employees or agents of Kinto Studio. Sellers must supply accurate business contact details, maintain valid Trade License / e-TIN / VAT/BIN documentation where legally required, and certify BSTI or sector approvals for regulated goods.',
            'Sellers warrant that every listed SKU is genuine, safe, accurately priced, weighed accurately for shipping tiers, and free from third-party trademark or copyright infringement.',
          ],
        },
        {
          id: 'fulfillment-payouts-data',
          heading: '2. Fulfillment SLAs, Fees, Customer Data & Enforcement',
          paragraphs: [
            `Sellers must confirm and pack orders within stated dispatch lead times, honor approved customer return/warranty remedies, and strictly use masked customer delivery data solely to fulfill Kinto Studio orders (never for off-platform solicitation).`,
            `Commercial commission rates (${isPlaceholderValue(facts.sellerCommissionSummary) ? 'as confirmed in your onboarding schedule' : facts.sellerCommissionSummary}) and payout settlement timing (${isPlaceholderValue(facts.sellerPayoutCycle) ? 'published in Seller Store Settings upon commercial sign-off' : facts.sellerPayoutCycle}) govern seller disbursements, subject to chargeback/refund reserves and termination/appeal review via ${pubFacts.legalEmail}.`,
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
            'Listings in violation of local law, transport safety rules, or payment-provider restrictions are removed immediately and may result in permanent seller suspension:',
          ],
          bullets: [
            'Counterfeit branded merchandise, unauthorized replicas, and tampered serial electronics.',
            'Narcotics, prescription pharmaceuticals, controlled substances, and unsubstantiated medical cure claims.',
            'Firearms, ammunition, explosives, and prohibited weapons under applicable Bangladesh law.',
            'Recalled infant products, unsafe uncertified electrical hardware, or toxic cosmetic adulterants (e.g. banned mercury formulations).',
            'Pirated digital/print media, surveillance malware hardware, or stolen goods.',
          ],
        },
        {
          id: 'reporting-enforcement',
          heading: '2. Restricted Goods & Reporting Violations',
          paragraphs: [
            `Regulated items (e.g., high-capacity lithium batteries or sharp workshop tools) require explicit safety disclosures and carrier-compliant ground routing. Report suspected prohibited listings immediately to ${pubFacts.legalEmail} with the product URL or SKU.`,
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
            'Editorial descriptions and Q&A answers do not replace licensed medical, veterinary, nutritional, or electrical engineering advice. Review all enclosed manufacturer manuals prior to use:',
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
          paragraphs: ['To protect marketplace reliability for genuine shoppers and sellers, users must not:'],
          bullets: [
            'Run automated scrapers, bots, credential-stuffing attacks, or bypass rate limits and CSRF/session controls.',
            'Submit false delivery addresses, repeatedly refuse Cash on Delivery parcels in bad faith, or file fraudulent payment chargebacks.',
            'Upload malicious scripts, phishing payloads, or manipulate search, reviews, or coupon eligibility.',
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
          heading: '1. Ownership & Submitting an Infringement Notice',
          paragraphs: [
            'Kinto Studio respects third-party intellectual property rights and protects its own storefront branding, code, and photography under applicable Bangladesh copyright and trademark statutes.',
            `Rights owners who believe a seller listing infringes a valid trademark or copyright may email ${pubFacts.legalEmail} identifying the mark/registration, affected product URL/SKU, proof of authority, and a good-faith declaration. Substantiated notices result in prompt listing suspension pending seller verification.`,
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
          heading: '1. Verified Support Channels & Ticket Submission',
          paragraphs: [
            `Reach Kinto Studio Customer Care via the online Contact & Support form (/contact), inside My Account / Track Order, or by emailing ${pubFacts.supportEmail}. Service hours: ${pubFacts.supportHours}.`,
            'Always include your Order ID (for example KS-10512) and relevant photos if reporting transit damage, missing items, or payment reconciliation questions.',
          ],
        },
        {
          id: 'complaint-escalation-route',
          heading: '2. Complaint Escalation & Statutory Consumer Remedies',
          paragraphs: [
            `If an initial support ticket regarding an undelivered order, disputed return, or pending refund is not resolved satisfactorily, request formal Compliance Desk review by emailing ${pubFacts.legalEmail} with your Support Ticket Reference.`,
            'Nothing in this policy restricts a customer’s right to lodge a complaint with the Directorate of National Consumer Rights Protection (DNCRP) or pursue remedies available before competent courts in Bangladesh.',
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
          heading: '1. Retention Criteria & Erasure Workflow',
          paragraphs: [
            'Kinto Studio retains personal records only for as long as needed to deliver orders, honor warranties, audit policy consent acceptances, and satisfy statutory Bangladesh accounting and tax recordkeeping obligations:',
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
          heading: '1. Accessibility Practices & Assistive Technology Support',
          paragraphs: [
            'Kinto Studio works continuously to improve usability across desktop and mobile screen readers, keyboard-only navigation, reduced-motion preferences, high-contrast light/dark themes, and multilingual scripts (English, বাংলা, हिन्दी, العربية, Español, Français).',
            'Important transparency note: While we actively test focus order, semantic landmarks, and contrast during engineering updates, the storefront has not yet undergone an independent third-party WCAG certification audit.',
          ],
        },
        {
          id: 'known-limits-feedback',
          heading: '2. Known Limitations & Reporting Accessibility Barriers',
          paragraphs: [
            'Third-party Seller Studio product images or external documents may occasionally lack complete alternative descriptions. We actively work with sellers to improve catalog media accessibility.',
            `If you encounter a barrier while browsing, searching, or checking out, email ${pubFacts.supportEmail} with the page URL and assistive tool used so our team can assist you or complete your order over alternative support channels.`,
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

export function projectPublicPolicyDocument(
  record: PolicyDocumentRecord,
  requestedVersion?: string
): PolicyDocumentRecord | null {
  if (record.applicability === 'not_applicable') return null;
  if (record.status !== 'published' && record.versionHistory.length === 0) return null;

  // Serve immutable requested historical version when specified (e.g. from order receipt ?version=2026.11)
  if (requestedVersion && requestedVersion.trim()) {
    const cleanVer = requestedVersion.trim();
    const matched = record.versionHistory.find((v) => v.version === cleanVer);
    if (matched) {
      return {
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

  // Always prefer last published immutable snapshot for public viewing so unapproved edits never leak
  const latestPublished = record.versionHistory[0];
  const baseTitle = latestPublished ? latestPublished.title : record.title;
  const baseSubtitle = latestPublished ? latestPublished.subtitle : record.subtitle;
  const baseSummary = latestPublished ? latestPublished.summary : record.summary;
  const baseSections = latestPublished ? latestPublished.sections : record.sections;
  const baseEffective = latestPublished ? latestPublished.effectiveDate : record.effectiveDate;
  const baseLastUpdated = latestPublished ? latestPublished.lastUpdated : record.lastUpdated;
  const baseVersion = latestPublished ? latestPublished.version : record.currentVersion;

  return {
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

export function getPublicPublishedPolicies(
  policies: PolicyDocumentRecord[]
): PolicyDocumentRecord[] {
  return policies
    .map((doc) => projectPublicPolicyDocument(doc))
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
