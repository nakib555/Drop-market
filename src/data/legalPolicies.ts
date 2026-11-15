import type {
  CategorySlug,
  LegalAcceptanceRecord,
  LegalDocumentId,
} from '../types/commerce';

export const LEGAL_VERSION = '2026.11';
export const LEGAL_EFFECTIVE_DATE = 'November 14, 2026';

export const LEGAL_ENTITY = {
  legalName: 'Kinto Studio',
  legalEmail: 'legal@kintostudio.bd',
  conciergeEmail: 'support@kintostudio.bd',
  jurisdictionLabel: 'Laws of Bangladesh · Competent Courts in Dhaka',
  registeredHub:
    'Dhaka Operations Hub, Dhaka, Bangladesh (Registered Trade License / DBID / BIN / VAT to be populated prior to commercial launch)',
  showrooms: 'Dhaka Operations & Customer Care Desk (Online-First Marketplace)',
  counselAdvisory:
    'Operational policy framework prepared for Kinto Studio in alignment with Bangladesh statutory principles (Consumer Rights Protection Act 2009, Digital Commerce Operation Guidelines 2021, Contract Act 1872, Cyber Security Act 2023). Have a qualified Bangladesh advocate verify your Trade License, DBID, e-TIN, VAT/BIN numbers, and cross-border terms before live commercial launch.',
} as const;

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface LegalDocument {
  id: LegalDocumentId;
  category: 'Core Agreements' | 'Commerce & Logistics' | 'Marketplace Governance' | 'Safety & Rights';
  title: string;
  shortTitle: string;
  subtitle: string;
  summary: string;
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

export function buildPolicyAcceptance(scope: string[]): LegalAcceptanceRecord {
  return {
    version: LEGAL_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    scope,
    jurisdiction: 'Bangladesh (Dhaka Courts)',
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
      'Report damaged, spoiled, or tampered seals within 24 hours of delivery with photographic evidence.',
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

export function getDepartmentSafetyNotice(category?: CategorySlug | string): DepartmentSafetyNotice {
  if (category && DEPARTMENT_SAFETY_NOTICES[category]) {
    return DEPARTMENT_SAFETY_NOTICES[category];
  }
  return DEPARTMENT_SAFETY_NOTICES.default;
}

export function getLegalDocuments(options?: { dhakaThresholdUsd?: number }): LegalDocument[] {
  const freeThresholdUsd = options?.dhakaThresholdUsd ?? 120;

  return [
    {
      id: 'terms',
      category: 'Core Agreements',
      title: 'Terms and Conditions',
      shortTitle: 'Terms & Conditions',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Bangladesh Law & Dhaka Courts`,
      summary:
        'Binding buyer and visitor agreement governing marketplace access, BDT/USD pricing, statutory consumer protections, liability allocation, and Bangladesh court jurisdiction.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['marketplace-terms', 'privacy-policy', 'return-policy', 'shipping-policy'],
      sections: [
        {
          id: 'acceptance-eligibility',
          heading: '1. Binding Acceptance & Eligibility',
          paragraphs: [
            `By accessing, creating an account on, or placing an order through ${LEGAL_ENTITY.legalName} ("Kinto Studio", "we", "us"), you agree to be bound by these Terms and Conditions and all referenced marketplace policies. If you do not agree, please discontinue use.`,
            'You confirm that you are at least 18 years of age (the age of majority under the Majority Act 1875) and legally competent to contract under the Contract Act 1872 of Bangladesh. Purchases placed on behalf of an organization bind that legal entity.',
          ],
        },
        {
          id: 'pricing-fx',
          heading: '2. Pricing, BDT Primary Settlement & International FX',
          paragraphs: [
            'Prices across Bangladesh are settled authoritatively in Bangladesh Taka (BDT) inclusive of disclosed delivery charges and applicable VAT/taxes. Where USD international pricing applies for cross-border destinations, checkout records an immutable exchange rate snapshot at quote confirmation.',
            'Despite automated validation, Kinto Studio may cancel an order caused by obvious manifest pricing, typographical, or inventory synchronization errors prior to courier dispatch, issuing a prompt full refund to the original payment channel.',
          ],
        },
        {
          id: 'statutory-rights-liability',
          heading: '3. Consumer Rights, Warranties & Balanced Liability',
          paragraphs: [
            'Nothing in these Terms excludes, restricts, or waives non-excludable consumer rights and remedies guaranteed under Bangladesh law—including the Consumer Rights Protection Act 2009, the Sale of Goods Act 1930, and the Digital Commerce Operation Guidelines 2021 (such as accurate product representation, promised weights/measures, genuine quality, and timely refund obligations).',
            'Subject strictly to those non-waivable statutory rights, Kinto Studio is not liable for indirect business losses or consequential damages not reasonably foreseeable at order formation, and platform contractual liability for any disputed transaction is bounded by applicable statutory remedies or the net order value paid.',
          ],
        },
        {
          id: 'governing-law-dhaka',
          heading: '4. Governing Law & Dispute Resolution (Bangladesh First)',
          paragraphs: [
            'For all domestic transactions and platform usage in Bangladesh, these Terms are governed by the laws of the People’s Republic of Bangladesh, and competent courts in Dhaka hold jurisdiction. Before initiating formal action, parties are encouraged to contact our Grievance & Legal Desk for a 15-to-30 day good-faith resolution.',
            'For orders shipped internationally outside Bangladesh, mandatory consumer protection rules of the buyer’s delivery jurisdiction may additionally apply to the extent required by local law.',
          ],
          bullets: [
            `Legal Notice Hub: ${LEGAL_ENTITY.registeredHub}`,
            `Official Legal & Grievance Email: ${LEGAL_ENTITY.legalEmail}`,
            'Counsel Review Note: Have a licensed Bangladesh advocate verify company registration details (Trade License, DBID, TIN/BIN) before commercial production.',
          ],
        },
      ],
    },
    {
      id: 'privacy-policy',
      category: 'Core Agreements',
      title: 'Privacy Policy',
      shortTitle: 'Privacy Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Data Protection & Consent`,
      summary:
        'Details personal, delivery, tokenized payment, and preference data Kinto Studio collects, lawful basis, cross-border safeguards, and how you control consent.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['data-retention-policy', 'cookie-policy', 'terms'],
      sections: [
        {
          id: 'data-controller',
          heading: '1. Data Controller & Legal Safeguards',
          paragraphs: [
            `${LEGAL_ENTITY.legalName} acts as data controller for customer, seller, and visitor information processed across our storefront and dashboards in accordance with Bangladesh Cyber Security Act 2023 safeguards and applicable international cross-border privacy principles.`,
          ],
        },
        {
          id: 'data-collected',
          heading: '2. Categories of Information Collected',
          paragraphs: [
            'We collect only the personal data reasonably necessary to authenticate accounts, verify addresses, dispatch parcels, settle tokenized payments, and support returns:',
          ],
          table: {
            headers: ['Data Category', 'Examples', 'Purpose'],
            rows: [
              ['Account & Contact', 'Name, email, BD/intl mobile number, role', 'Authentication, order notifications, support'],
              ['Delivery Geography', 'Country, Division, District, Upazila, Area, street', 'Shipping calculation, courier handoff, COD eligibility'],
              ['Tokenized Payment', 'Gateway transaction ref, MFS/card token, status', 'Payment verification & refund reversal (zero raw card CVV/PIN stored)'],
              ['Consent & Legal Logs', 'Policy acceptance timestamp & cookie preferences', 'Compliance records and consent withdrawal tracking'],
            ],
          },
        },
        {
          id: 'sharing-processors',
          heading: '3. Controlled Sharing & User Rights',
          paragraphs: [
            'We never sell customer personal data. Information is shared strictly as needed with verified Partner Seller Studios fulfilling your order, authorized logistics couriers (RedX, Pathao, Steadfast, DHL), and licensed payment gateways (bKash, Nagad, Rocket, SSLCommerz).',
            `You may edit profile details directly inside My Account or email ${LEGAL_ENTITY.legalEmail} to request data access, correction, or account deletion (subject to statutory Bangladesh tax/invoice retention rules).`,
          ],
        },
      ],
    },
    {
      id: 'cookie-policy',
      category: 'Core Agreements',
      title: 'Cookie & Browser Storage Policy',
      shortTitle: 'Cookie Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Essential & Optional Storage`,
      summary:
        'Inventory of strictly necessary browser storage and consent-gated personalization preferences used by the Kinto Studio storefront.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['privacy-policy', 'data-retention-policy', 'terms'],
      sections: [
        {
          id: 'how-storage-works',
          heading: '1. Essential Storage vs. Consent-Gated Preferences',
          paragraphs: [
            'Kinto Studio relies on essential browser local storage to preserve your shopping bag, chosen language (EN / বাংলা), currency (BDT / USD), active session token, and light/dark contrast mode.',
            'Optional features—Search History, Recently Viewed personalization, and Analytics diagnostics—remain disabled unless consented to via our Cookie Preferences control.',
          ],
        },
        {
          id: 'storage-inventory',
          heading: '2. Active Storage Keys',
          paragraphs: ['Summary of active client-side storage keys:'],
          table: {
            headers: ['Storage Key', 'Classification', 'Purpose'],
            rows: [
              ['kinto-api-token / kinto-profile', 'Strictly Necessary', 'Maintains authenticated Buyer, Seller, or Admin session'],
              ['kinto-cart / kinto-saved / kinto-promo', 'Strictly Necessary', 'Retains shopping bag, saved items, and active promo codes'],
              ['kinto-language / kinto-currency / kinto-theme', 'Strictly Necessary', 'Preserves EN/বাংলা language, BDT/USD currency, and theme'],
              ['kinto-cookie-consent / kinto-privacy-prefs', 'Strictly Necessary', 'Stores active consent preferences'],
              ['kinto-recent-searches / kinto-recent-views', 'Optional', 'Stores search queries and viewed items only with user consent'],
            ],
          },
        },
      ],
    },
    {
      id: 'shipping-policy',
      category: 'Commerce & Logistics',
      title: 'Shipping & Delivery Policy',
      shortTitle: 'Shipping Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Dhaka Hub, All 64 Districts & International Corridors`,
      summary:
        'Rule-based shipping zones across Bangladesh and global destinations, estimated dispatch timelines, COD ceilings, and delivery inspection standards.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['return-policy', 'cancellation-policy', 'payment-policy'],
      sections: [
        {
          id: 'zones-thresholds',
          heading: '1. Bangladesh Zones & Free Shipping Thresholds',
          paragraphs: [
            `Orders ship from Dhaka or approved Seller Studios across all 8 Divisions and 64 Districts of Bangladesh. Inside Dhaka Metro, qualifying standard orders above the configured Dhaka threshold ($${freeThresholdUsd} USD equivalent in BDT) unlock complimentary standard shipping.`,
            'In line with Digital Commerce Operation Guidelines 2021: once full payment is received, items ready in stock inside Dhaka/same-city hubs are targeted for dispatch/delivery within 5 business days (up to 10 days nationwide outside metro hubs unless bespoke/made-to-order timelines are expressly disclosed prior to checkout).',
          ],
        },
        {
          id: 'cod-restricted',
          heading: '2. Cash on Delivery (COD) & Remote Zones',
          paragraphs: [
            'Cash on Delivery is supported across eligible non-freight orders inside covered Bangladesh delivery zones up to configurable order value caps. Oversized freight items, made-to-order pieces, and flagged security/remote zones require prepaid gateway verification.',
          ],
        },
        {
          id: 'customs-risk',
          heading: '3. International Duties & Delivery Risk',
          paragraphs: [
            'For shipments outside Bangladesh, destination import duties, customs clearance taxes, and brokerage charges are borne by the recipient. Transit risk passes upon verified parcel handoff at the buyer’s designated delivery address.',
          ],
        },
      ],
    },
    {
      id: 'return-policy',
      category: 'Commerce & Logistics',
      title: 'Return & Refund Policy',
      shortTitle: 'Return & Refund Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Inspection & Refund Timelines`,
      summary:
        'Conditions for returns, wrong/defective item claims, hygiene exclusions, and verified refund processing within Bangladesh timelines.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['cancellation-policy', 'warranty-policy', 'shipping-policy'],
      sections: [
        {
          id: 'return-eligibility',
          heading: '1. Return Eligibility & Reporting Windows',
          paragraphs: [
            'Defective, damaged-in-transit, expired, or wrong-item deliveries should be reported within 48 hours of receipt with photo documentation for free replacement pickup or full refund.',
            'Eligible change-of-mind returns (unused, unopened items with original seals, accessories, and packaging intact) may be requested within 14 days of delivery (30 days on marked first-party studio hardware/home releases).',
          ],
          table: {
            headers: ['Product Category', 'Return Rule', 'Condition'],
            rows: [
              ['Defective / Wrong / Transit Damaged', 'Full Refund or Replacement', 'Report within 48 hours of delivery with proof'],
              ['Electronics & Audio', '14 Days Unopened / Defect Replacement', 'Serial & original factory accessories verified'],
              ['Beauty, Personal Care & Hygiene', 'Unopened & Factory Sealed Only', 'No return once sanitary seal is broken unless defective'],
              ['Grocery, Coffee & Perishables', 'Damaged / Spoiled / Expired Only', 'Perishables non-returnable for change of mind'],
              ['Made-to-Order / Custom Furniture', 'Manufacturing Defect / Transit Damage', 'Custom dimensions non-returnable once produced'],
            ],
          },
        },
        {
          id: 'refund-settlement',
          heading: '2. Refund Settlement SLA',
          paragraphs: [
            'Verified refunds are credited strictly back to the original payment method (bKash, Nagad, Rocket, SSLCommerz/Card, or verified bank EFT for settled COD orders) within 7 to 10 business days (matching Bangladesh Digital Commerce refund rules) once returned merchandise passes quality check.',
          ],
        },
      ],
    },
    {
      id: 'cancellation-policy',
      category: 'Commerce & Logistics',
      title: 'Order Cancellation Policy',
      shortTitle: 'Cancellation Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Pre-Dispatch Cancellation & Stock Failure Reversal`,
      summary:
        'Self-service cancellation rights prior to packing/dispatch, seller stock-out protection, and refund timelines.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['return-policy', 'shipping-policy', 'payment-policy'],
      sections: [
        {
          id: 'buyer-cancellation',
          heading: '1. Customer Pre-Dispatch Cancellation',
          paragraphs: [
            'Customers may cancel any order in "Confirmed" or "Processing" status directly from My Account → Orders or Track Order with zero cancellation penalty. Any prepaid amount is refunded to the original gateway within 5–7 business days.',
            'Once an order transitions to "Packed", "Shipped", or "Out for Delivery" and enters physical courier custody, cancellation is closed and post-delivery return procedures apply.',
          ],
        },
        {
          id: 'marketplace-cancellation',
          heading: '2. Platform / Seller Cancellation & Stock Failure',
          paragraphs: [
            'If a Seller Studio fails to hand over inventory within the committed SLA, or fails quality inspection prior to dispatch, Kinto Studio notifies the customer immediately and initiates an automatic full refund.',
          ],
        },
      ],
    },
    {
      id: 'payment-policy',
      category: 'Commerce & Logistics',
      title: 'Payment & Billing Policy',
      shortTitle: 'Payment Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · bKash, Nagad, Rocket, Cards, SSLCommerz & COD`,
      summary:
        'Supported Bangladesh Mobile Financial Services, card tokenization rules, BDT primary billing, COD caps, and fraud prevention.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['shipping-policy', 'cancellation-policy', 'terms'],
      sections: [
        {
          id: 'payment-channels',
          heading: '1. Authorized Payment Methods & Tokenization',
          paragraphs: [
            'All digital payments run through tokenized provider checkout sessions—supporting bKash, Nagad, Rocket, Visa, Mastercard, SSLCommerz, Bank Transfer, and eligible Cash on Delivery. Kinto Studio never collects, stores, or logs raw credit card CVV codes or MFS PINs on storefront servers.',
          ],
        },
        {
          id: 'cod-settlement',
          heading: '2. Cash on Delivery & Payment Verification',
          paragraphs: [
            'Cash on Delivery orders remain in "COD Pending" payment status at placement and convert to "Paid" strictly upon physical courier cash collection and settlement confirmation. High-value or restricted-zone orders may require advance prepaid verification.',
          ],
        },
      ],
    },
    {
      id: 'warranty-policy',
      category: 'Commerce & Logistics',
      title: 'Warranty & Authenticity Policy',
      shortTitle: 'Warranty Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Coverage Windows, Exclusions & Claim Process`,
      summary:
        'Standard partner hardware, watch, tool, and craftsmanship warranty periods, serial verification, and service claim steps.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['return-policy', 'product-safety', 'terms'],
      sections: [
        {
          id: 'warranty-coverage',
          heading: '1. Standard Coverage & Warranty Periods',
          paragraphs: [
            'Every electrical, acoustic, horological, or workshop product lists its explicit warranty period on the Product Detail Page and digital order receipt (e.g., 2–3 years on studio electronics, 5 years on brushless workshop motors and titanium mechanical movements).',
          ],
        },
        {
          id: 'warranty-exclusions',
          heading: '2. Claim Process & Exclusions',
          paragraphs: [
            'Warranty covers verified manufacturing and material defects under normal use. Voltage surges without surge protection (for 220–240V mains equipment), unauthorized third-party repair tampering, liquid submersion on non-rated units, and consumable wear are excluded.',
            `To initiate a warranty claim, contact ${LEGAL_ENTITY.conciergeEmail} with your Order ID and serial reference.`,
          ],
        },
      ],
    },
    {
      id: 'marketplace-terms',
      category: 'Marketplace Governance',
      title: 'Marketplace & Buyer-Seller Platform Terms',
      shortTitle: 'Marketplace Terms',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Multi-Vendor Structure`,
      summary:
        'Clarifies marketplace intermediary role, verified Seller Studio disclosures, order fulfillment separation, and platform dispute triage.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'seller-agreement', 'customer-support-policy'],
      sections: [
        {
          id: 'intermediary-transparency',
          heading: '1. Platform Intermediary & Seller Disclosure',
          paragraphs: [
            'Kinto Studio curates independent Partner Seller Studios alongside first-party house editions. Product cards and checkout receipts clearly display the supplying brand/studio responsible for inventory authenticity, pricing, and warranty fulfillment.',
          ],
        },
        {
          id: 'escrow-dispute',
          heading: '2. Buyer Protection & Escrow Triage',
          paragraphs: [
            'Seller settlements are released after order confirmation and delivery completion windows so verified customer complaints regarding non-delivery, wrong items, or counterfeit reports can be investigated and refunded fairly.',
          ],
        },
      ],
    },
    {
      id: 'seller-agreement',
      category: 'Marketplace Governance',
      title: 'Seller Terms & Partner Agreement',
      shortTitle: 'Seller Agreement',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · KYC, SLAs & Indemnification`,
      summary:
        'Contractual obligations for Partner Seller Studios covering authenticity warranties, BSTI/tax compliance, dispatch SLAs, payouts, and indemnity.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['marketplace-terms', 'prohibited-items', 'intellectual-property'],
      sections: [
        {
          id: 'independent-relationship',
          heading: '1. Independent Merchant Status & Bangladesh Tax Compliance',
          paragraphs: [
            'Partner Seller Studios operate as independent merchants—not employees, agents, or franchisees of Kinto Studio. Sellers hold primary responsibility for product authenticity, BSTI/regulatory certifications where required, valid Bangladesh Trade License / e-TIN / VAT registration, and accurate weight/size tier declarations.',
          ],
        },
        {
          id: 'payouts-reserves',
          heading: '2. Payout Cycles, Holds & Indemnification',
          paragraphs: [
            'Commissions, courier charges, and verified customer refunds are settled from seller balances. Kinto Studio may place temporary holds on payouts during active fraud/counterfeit investigations or elevated return disputes, and Sellers indemnify the platform against third-party IP infringement or unsafe product claims.',
          ],
        },
      ],
    },
    {
      id: 'prohibited-items',
      category: 'Marketplace Governance',
      title: 'Prohibited & Restricted Items Policy',
      shortTitle: 'Prohibited Items',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Zero-Tolerance Compliance Standard`,
      summary:
        'Catalog ban covering counterfeit goods, controlled drugs, weapons, uncertified hazardous goods, and unsafe children’s products.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['seller-agreement', 'product-safety', 'acceptable-use'],
      sections: [
        {
          id: 'zero-tolerance',
          heading: '1. Zero-Tolerance Delisting Policy',
          paragraphs: [
            'Any SKU violating Bangladesh import laws, product safety standards, or this Prohibited Items schedule is subject to immediate removal, seller suspension, and escalation to relevant authorities.',
          ],
        },
        {
          id: 'banned-categories',
          heading: '2. Strictly Prohibited Categories',
          paragraphs: ['Items strictly barred from Kinto Studio include:'],
          bullets: [
            'Counterfeit merchandise, unauthorized replicas, and tampered serial hardware.',
            'Prescription pharmaceuticals, narcotics, and unapproved medical/therapeutic claims.',
            'Weapons, ammunition, explosives, or prohibited combat knives under the Arms Act.',
            'Loose damaged lithium-ion cells, toxic mercury cosmetics, and recalled unsafe infant products.',
            'Pirated media, copyright-circumvention tools, or stolen property.',
          ],
        },
      ],
    },
    {
      id: 'product-safety',
      category: 'Safety & Rights',
      title: 'Product Safety & Regulatory Disclaimers',
      shortTitle: 'Product Safety',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Category Safety, Age & Voltage Notices`,
      summary:
        'Mandatory risk, allergy, age-grading, 220–240V electrical safety, mechanical PPE, and non-medical notices across all 10 departments.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['warranty-policy', 'prohibited-items', 'return-policy'],
      sections: [
        {
          id: 'no-professional-advice',
          heading: '1. Informational Disclaimer',
          paragraphs: [
            'Catalog copy, Studio Journal essays, and product specifications do not constitute licensed medical, nutritional, veterinary, electrical, or structural engineering advice.',
          ],
        },
        {
          id: 'department-disclosures',
          heading: '2. Category-Specific Precautions',
          paragraphs: ['Observe department precautions shown on Product Detail Pages:'],
          table: {
            headers: ['Department', 'Required Precaution'],
            rows: [
              ['Beauty & Skincare', 'External cosmetic use only; perform a 24-hour patch test prior to full use.'],
              ['Grocery, Coffee & Pantry', 'Inspect allergen labels (nuts, dairy, gluten, soy) and expiry dates on arrival.'],
              ['Baby & Montessori Toys', 'Follow age-grading labels; supervise young children; choking hazard on small parts.'],
              ['Electronics & Batteries', 'Verify 220–240V / USB-PD ratings; use certified adapters and surge protection.'],
              ['Automotive & Power Tools', 'Wear certified eye, ear, and hand PPE; operate strictly within rated RPM/torque limits.'],
              ['Health, Wellness & Pets', 'Non-diagnostic products; consult a licensed physician or vet before supplement use.'],
            ],
          },
        },
      ],
    },
    {
      id: 'acceptable-use',
      category: 'Safety & Rights',
      title: 'Acceptable Use & Community Content Policy',
      shortTitle: 'Acceptable Use',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Reviews, Q&A, Anti-Scraping & Account Integrity`,
      summary:
        'Rules governing authentic customer reviews, anti-scraping protections, COD refusal abuse prevention, and respectful conduct.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'privacy-policy', 'intellectual-property'],
      sections: [
        {
          id: 'ugc-license',
          heading: '1. Genuine Reviews & Community License',
          paragraphs: [
            'Submitted product reviews and Q&A questions must reflect honest personal experience. By posting, you grant Kinto Studio a license to display and moderate your feedback on the marketplace.',
          ],
        },
        {
          id: 'prohibited-conduct',
          heading: '2. Prohibited Platform Conduct',
          paragraphs: ['The following activities result in account restriction or termination:'],
          bullets: [
            'Automated catalog scraping, credential stuffing, or unauthorized API probing.',
            'Coordinated fake reviews or abusive promo-code manipulation.',
            'Repeated fraudulent Cash on Delivery refusal or abusive payment chargebacks.',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      category: 'Safety & Rights',
      title: 'Intellectual Property & Takedown Policy',
      shortTitle: 'IP & Copyright Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Copyright Act 2023 & Trademarks Act 2009`,
      summary:
        'Protection of marketplace trademarks, studio designs, and structured rights-holder takedown procedure.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['seller-agreement', 'prohibited-items', 'acceptable-use'],
      sections: [
        {
          id: 'platform-ip',
          heading: '1. Brand & Editorial Rights',
          paragraphs: [
            'All Kinto Studio trademarks, software architecture, design tokens, and original editorial assets are protected under the Copyright Act 2023 and Trademarks Act 2009 of Bangladesh.',
          ],
        },
        {
          id: 'takedown-procedure',
          heading: '2. Reporting Infringement',
          paragraphs: [
            `Rights holders may submit signed infringement notices to ${LEGAL_ENTITY.legalEmail} identifying the protected mark/work, affected SKU/URL, and good-faith ownership statement. Verified infringing listings are promptly disabled.`,
          ],
        },
      ],
    },
    {
      id: 'customer-support-policy',
      category: 'Safety & Rights',
      title: 'Customer Support & Grievance Redressal Policy',
      shortTitle: 'Support & Grievance',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Response SLAs & Escalation Channels`,
      summary:
        'Support hours in Dhaka, ticket acknowledgement targets, complaint escalation workflow, and DNCRP consumer rights awareness.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['return-policy', 'cancellation-policy', 'terms'],
      sections: [
        {
          id: 'support-sla',
          heading: '1. Support Channels & Response SLAs',
          paragraphs: [
            `Our Dhaka Customer Care Desk operates Saturday through Thursday (10:00 AM – 8:00 PM BST) via ${LEGAL_ENTITY.conciergeEmail} and the Track Order / Account Support portal.`,
            'Order issues, courier delays, and return requests are acknowledged within 1 business day and resolved or escalated within 3–5 business days.',
          ],
        },
        {
          id: 'grievance-officer',
          heading: '2. Formal Grievance Escalation',
          paragraphs: [
            `Unresolved complaints regarding defective items, undelivered prepaid orders, or refund delays may be escalated to our Compliance Desk at ${LEGAL_ENTITY.legalEmail} with your Order ID, alongside statutory remedies available through the Directorate of National Consumer Rights Protection (DNCRP).`,
          ],
        },
      ],
    },
    {
      id: 'data-retention-policy',
      category: 'Core Agreements',
      title: 'Data Retention & Deletion Policy',
      shortTitle: 'Data Retention',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Lifecycle Timelines & Erasure`,
      summary:
        'Retention periods for active accounts, invoice/tax audit ledgers, session tokens, and optional local browser preferences.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['privacy-policy', 'cookie-policy', 'terms'],
      sections: [
        {
          id: 'retention-schedule',
          heading: '1. Data Retention Schedule',
          paragraphs: [
            'Kinto Studio retains account and transaction data only as long as required for active service delivery, warranty claims, dispute defense, and Bangladesh tax/commercial compliance:',
          ],
          table: {
            headers: ['Record Category', 'Retention Window', 'Basis'],
            rows: [
              ['Active Customer / Seller Profile', 'Until account deletion request or 36 months inactivity', 'Contractual service delivery'],
              ['Order Invoices, Tax & Payment Logs', 'Minimum 6 years from financial year close', 'Bangladesh VAT/tax & audit statutory obligation'],
              ['Support Tickets & Return Evidence', '24 months after ticket closure', 'Warranty & dispute resolution'],
              ['Local Search & Browsing History', 'Immediate clear on consent withdrawal or browser clear', 'User-controlled browser storage'],
            ],
          },
        },
      ],
    },
    {
      id: 'accessibility',
      category: 'Safety & Rights',
      title: 'Digital Accessibility Statement',
      shortTitle: 'Accessibility',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · WCAG 2.1 Level AA Commitment`,
      summary:
        'Ongoing engineering standards for keyboard navigation, screen-reader landmarks, high-contrast themes, and Bangla/English readability.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'customer-support-policy'],
      sections: [
        {
          id: 'standards',
          heading: '1. Conformance & Accessible Support',
          paragraphs: [
            'Kinto Studio targets WCAG 2.1 Level AA conformance across desktop, tablet, and mobile browsers—including semantic headings, labeled form controls, high-contrast light/dark palettes, keyboard focus rings, and Noto Sans Bengali bilingual legibility.',
            `Report any accessibility barrier to ${LEGAL_ENTITY.conciergeEmail} for prompt assistance within 2 business days.`,
          ],
        },
      ],
    },
  ];
}

export function getLegalDocumentById(
  id: LegalDocumentId,
  options?: { dhakaThresholdUsd?: number }
): LegalDocument {
  const docs = getLegalDocuments(options);
  return docs.find((d) => d.id === id) || docs[0];
}

