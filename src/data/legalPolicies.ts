import type {
  CategorySlug,
  LegalAcceptanceRecord,
  LegalDocumentId,
} from '../types/commerce';

export const LEGAL_VERSION = '2026.11';
export const LEGAL_EFFECTIVE_DATE = 'November 14, 2026';

export const LEGAL_ENTITY = {
  legalName: 'Kinto Studio LLC',
  legalEmail: 'legal@kintostudio.example',
  conciergeEmail: 'concierge@kintostudio.example',
  jurisdictionLabel: 'Laws of Bangladesh · Exclusive Jurisdiction of Dhaka Courts',
  registeredHub:
    'Dhaka Operations Hub, Dhaka, Bangladesh (Trade License / DBID / BIN Reference on File)',
  showrooms: 'Portland Atelier & New York Viewing Gallery',
  counselAdvisory:
    'Standard marketplace compliance framework drafted for Kinto Studio LLC. Review registered entity identifiers (Trade License, BIN, and DBID) with a qualified Bangladesh corporate advocate prior to public commercial rollout.',
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
      'Verify allergen declarations, best-before dates, and storage directions immediately upon parcel arrival.',
      'Kinto Studio LLC makes no therapeutic, medicinal, or disease-prevention claims regarding specialty grocery products.',
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
      'Use only manufacturer-certified USB-PD or DC power adapters; unauthorized adapters void partner hardware warranties.',
      'Items containing high-capacity lithium-ion batteries may be restricted from express air transit and routed via surface courier.',
    ],
  },
  'automotive-tools-industrial': {
    title: 'Mechanical Skill, PPE & Assumption of Risk Notice',
    summary:
      'Power tools, torque instruments, and automotive accessories require proper personal protective equipment (eye, ear, hand protection) and mechanical competence.',
    points: [
      'Never exceed rated RPM, load limits, voltage, or torque specifications printed in the manufacturer manual.',
      'Improper installation, modified safety guards, or commercial misuse is undertaken solely at the user’s risk.',
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
      'Third-party Seller Studio listings are fulfilled and warranted directly by the identified partner seller alongside statutory consumer protections.',
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
      title: 'Terms of Service',
      shortTitle: 'Terms of Service',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Bangladesh Law & Dhaka Courts`,
      summary:
        'Binding buyer and visitor agreement governing marketplace access, BDT/USD pricing, liability caps, indemnification, and exclusive Dhaka court jurisdiction.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['privacy-policy', 'return-policy', 'shipping-policy', 'product-safety'],
      sections: [
        {
          id: 'acceptance-eligibility',
          heading: '1. Binding Acceptance & Eligibility',
          paragraphs: [
            `By accessing, browsing, creating an account on, or placing an order through ${LEGAL_ENTITY.legalName} ("Kinto Studio", "we", "us"), you agree to be legally bound by these Terms of Service and all referenced policies. If you do not agree, discontinue use immediately.`,
            'You represent that you are at least 18 years of age (the age of majority under the Majority Act 1875) and possess legal capacity to enter into binding contracts under the Contract Act 1872 of Bangladesh. Purchases on behalf of a corporate entity bind that organization.',
          ],
        },
        {
          id: 'marketplace-role',
          heading: '2. Multi-Vendor Marketplace Role',
          paragraphs: [
            'Kinto Studio operates both a curated retail studio and a multi-vendor digital commerce marketplace connecting buyers with independent partner Seller Studios. Where a product is sold and shipped by a third-party Seller Studio, that seller acts as the merchant of record responsible for inventory title, product compliance, safety labeling, and stated manufacturer warranties.',
            'Kinto Studio facilitates payment processing, logistics coordination, and dispute triage in alignment with Bangladesh Digital Commerce Operation Guidelines 2021, without assuming unlimited liability for third-party manufacturing defects except where non-waivable statutory law requires.',
          ],
        },
        {
          id: 'pricing-fx',
          heading: '3. Pricing, Multi-Currency Settlement (BDT/USD) & Typographical Errors',
          paragraphs: [
            'Catalog items are priced in USD base valuation and converted into Bangladesh Taka (BDT) at authoritative gateway checkout exchange rates published at quote confirmation. Domestic Bangladesh deliveries settle strictly in BDT unless an authorized international channel applies.',
            'Applicable VAT, customs duties, weight-based courier surcharges, and gateway charges are displayed prior to confirmation. Despite automated controls, we reserve the right to cancel or void any order arising from manifest typographical, pricing, stock, or FX feed errors prior to physical dispatch, issuing a prompt full refund.',
          ],
        },
        {
          id: 'orders-cancellation',
          heading: '4. Order Acceptance, Fraud Screening & Pre-Dispatch Cancellation',
          paragraphs: [
            'Receipt of an automated order confirmation does not constitute irrevocable acceptance. Kinto Studio reserves the right to verify mobile wallet (bKash, Nagad, Rocket), card (Visa, Mastercard, SSLCommerz), or Cash on Delivery (COD) eligibility, limit abnormal bulk quantities, and cancel suspected fraudulent, sanctioned, or high-risk COD transactions prior to dispatch.',
          ],
        },
        {
          id: 'warranty-disclaimer',
          heading: '5. Disclaimer of Warranties ("As-Is" & "As-Available")',
          paragraphs: [
            'To the maximum extent permitted by the laws of Bangladesh (including the Sale of Goods Act 1930 and Consumer Rights Protection Act 2009 where non-excludable rights apply), the Kinto Studio platform, digital tools, editorial content, and marketplace services are provided on an "AS-IS" and "AS-AVAILABLE" basis without implied warranties of merchantability, uninterrupted uptime, or fitness for a particular purpose beyond written product specifications.',
          ],
        },
        {
          id: 'liability-cap',
          heading: '6. Limitation of Liability & Aggregate Cap',
          paragraphs: [
            'To the fullest extent permitted by law, neither Kinto Studio LLC nor its directors, officers, employees, couriers, or affiliates shall be liable for indirect, incidental, punitive, special, or consequential damages—including lost profits, lost business, data loss, or personal inconvenience—arising out of platform use, delayed transit, or third-party product performance.',
            'In all events, Kinto Studio LLC’s maximum aggregate contractual or tort liability arising from any transaction or claim shall not exceed the greater of: (a) the total net purchase price actually paid by you to Kinto Studio for the specific disputed order within the preceding six (6) months, or (b) BDT 15,000.',
          ],
        },
        {
          id: 'indemnification-force-majeure',
          heading: '7. Indemnification & Force Majeure',
          paragraphs: [
            'You agree to indemnify, defend, and hold harmless Kinto Studio LLC and its personnel from third-party claims, losses, legal fees, or regulatory penalties resulting from your breach of these Terms, misuse of products, unlawful User-Generated Content, payment chargeback abuse, or violation of Bangladesh law.',
            'Neither party shall be liable for delayed fulfillment caused by Force Majeure events beyond reasonable control, including floods, cyclones, hartals/transport strikes, port or customs holds, civil unrest, utility or telecom outages, epidemic restrictions, or courier network disruptions.',
          ],
        },
        {
          id: 'governing-law-dhaka',
          heading: '8. Governing Law & Exclusive Jurisdiction of Dhaka Courts',
          paragraphs: [
            'These Terms of Service and all non-contractual obligations arising from your use of Kinto Studio are governed exclusively by the substantive laws of the People’s Republic of Bangladesh, without regard to conflict-of-law rules.',
            `Before initiating litigation, both parties agree to submit a written dispute notice to ${LEGAL_ENTITY.legalEmail} for a 30-day good-faith resolution window. Any unresolved claim may be referred to binding arbitration in Dhaka under the Arbitration Act 2001 or filed exclusively before the competent courts situated in Dhaka, Bangladesh. All claims must be brought within one (1) year of the underlying event unless mandatory statute specifies otherwise.`,
          ],
          bullets: [
            'Legal Notice Address: Kinto Studio LLC · Dhaka Operations Hub, Dhaka, Bangladesh',
            `Official Legal Email: ${LEGAL_ENTITY.legalEmail}`,
            'Severability & Assignment: Invalidity of one clause does not affect remaining provisions; Kinto Studio may assign agreements in corporate restructuring.',
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
        'Explains what personal, order, location, and browser storage data Kinto Studio LLC collects, why it is processed, and how to withdraw optional consent.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['cookie-policy', 'terms', 'acceptable-use'],
      sections: [
        {
          id: 'data-controller',
          heading: '1. Data Controller & Legal Scope',
          paragraphs: [
            `${LEGAL_ENTITY.legalName} acts as controller for customer, buyer, and seller account data processed across our storefront, mobile web app (PWA), Seller Studio, and Admin Console, operating in compliance with applicable Bangladesh data protection and Cyber Security Act 2023 safeguards.`,
          ],
        },
        {
          id: 'data-collected',
          heading: '2. Categories of Information Collected',
          paragraphs: [
            'We collect only the information necessary to fulfill orders, verify Seller Studios, prevent fraud, and improve your experience when explicitly permitted.',
          ],
          table: {
            headers: ['Data Category', 'Examples', 'Purpose & Retention'],
            rows: [
              [
                'Identity & Contact',
                'Full name, email, Bangladesh/international phone, studio name',
                'Account access, order receipts, statutory tax/invoice records',
              ],
              [
                'Delivery Geography',
                'Division, District, Upazila, Area, street & postal code',
                'Shipping zone quoting, courier dispatch, restricted-area screening',
              ],
              [
                'Payment & Settlement',
                'Method token, masked card last-4 or wallet suffix, transaction reference',
                'Payment verification & refund auditing (full PINs/CVVs never stored)',
              ],
              [
                'Legal Audit Trail',
                'Accepted policy version, timestamp, consent status',
                'Proof of contract formation and compliance verification',
              ],
              [
                'Optional Preferences',
                'Local search history, recently viewed objects, diagnostics toggle',
                'Controlled directly by your Cookie & Privacy Preferences',
              ],
            ],
          },
        },
        {
          id: 'sharing-processors',
          heading: '3. Third-Party Fulfillment & Payment Sharing',
          paragraphs: [
            'We never sell customer personal data to third-party data brokers. Limited order details are shared strictly on a need-to-know basis with:',
          ],
          bullets: [
            'Verified Partner Seller Studios fulfilling your specific third-party line items.',
            'Courier and logistics partners (e.g., Steadfast, Pathao, RedX, international freight) strictly for parcel delivery and COD collection.',
            'Payment processors (SSLCommerz, bKash, Nagad, Rocket, card networks) under tokenized gateway sessions.',
            'Competent law enforcement or judicial authorities in Dhaka upon lawful warrant or regulatory order.',
          ],
        },
        {
          id: 'user-rights',
          heading: '4. Security, Retention & Your Privacy Rights',
          paragraphs: [
            'Order financial ledgers and consent records are retained as needed for warranty support, dispute defense, and Bangladesh tax compliance. You may view, update, or erase optional local browsing/search data anytime in Account → Privacy Settings or via the Cookie Preferences dialog.',
            `To request data access, correction, or account deletion, email ${LEGAL_ENTITY.legalEmail} from your registered address.`,
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
        'Full inventory of essential browser storage, PWA offline caches, and consent-gated personalization preferences.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['privacy-policy', 'terms'],
      sections: [
        {
          id: 'how-storage-works',
          heading: '1. Essential Storage vs. Consent-Gated Preferences',
          paragraphs: [
            'Kinto Studio uses strictly necessary browser local storage, session tokens, and Progressive Web App (PWA) service-worker caches to keep your shopping bag, chosen currency (BDT/USD), authentication session, and dark/light appearance intact.',
            'Optional personalization features—specifically local Search History persistence, Recently Viewed Catalog recommendations, and Anonymous Performance Diagnostics—remain disabled or controllable through our Cookie Banner and Account Privacy Settings.',
          ],
        },
        {
          id: 'storage-inventory',
          heading: '2. Active Storage & Cache Inventory',
          paragraphs: [
            'Below is the live inventory of client-side storage keys utilized by the storefront:',
          ],
          table: {
            headers: ['Storage Key', 'Classification', 'Function'],
            rows: [
              ['kinto-api-token / kinto-profile', 'Strictly Necessary', 'Authenticates active Buyer, Seller, or Admin workspace'],
              ['kinto-cart / kinto-saved / kinto-promo', 'Strictly Necessary', 'Preserves shopping bag items, quantities, and promo state'],
              ['kinto-currency / kinto-theme', 'Strictly Necessary', 'Retains BDT/USD preference and light/dark UI contrast mode'],
              ['kinto-cookie-consent / kinto-privacy-prefs', 'Strictly Necessary', 'Stores your active legal cookie and tracking choices'],
              ['kinto-recent-searches', 'Optional (Search History)', 'Stores recent queries when Search History consent is ON'],
              ['kinto-recent-views', 'Optional (Personalization)', 'Tracks viewed objects when Catalog Personalization consent is ON'],
            ],
          },
        },
        {
          id: 'managing-cookies',
          heading: '3. Modifying or Withdrawing Consent',
          paragraphs: [
            'You can accept all, reject non-essential storage, or customize individual categories at any time using the "Cookie Preferences" link in the site footer or inside Account → Privacy Settings. Clearing site data in your browser also removes local caches.',
          ],
        },
      ],
    },
    {
      id: 'shipping-policy',
      category: 'Commerce & Logistics',
      title: 'Shipping & Delivery Policy',
      shortTitle: 'Shipping Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Dhaka Hub, 64 Districts & International Freight`,
      summary:
        'Delivery zones across Bangladesh and global destinations, courier SLAs, COD eligibility ceilings, restricted area screening, and transit risk rules.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['return-policy', 'terms', 'product-safety'],
      sections: [
        {
          id: 'zones-thresholds',
          heading: '1. Bangladesh Zones & Free Shipping Threshold',
          paragraphs: [
            `Orders ship from our Dhaka Operations Hub or approved partner studios across all 64 districts of Bangladesh and select global freight corridors. Standard courier delivery inside Dhaka Metro qualifies for complimentary shipping on orders at or above $${freeThresholdUsd} USD equivalent (converted dynamically in BDT at checkout).`,
            'Final shipping costs depend on destination zone, weight tier, parcel volume (bulky/freight surcharges), and chosen speed (Standard Tracked Courier, Express Priority, or White-Glove Room Placement).',
          ],
        },
        {
          id: 'cod-restricted',
          heading: '2. Cash on Delivery (COD) & Restricted Zones',
          paragraphs: [
            'Cash on Delivery is available within eligible Bangladesh delivery zones up to configurable order value caps, excluding oversized freight, made-to-order atelier commissions, or restricted security/high-risk addresses.',
            'Orders placed to restricted keywords or unsafe zones are blocked at checkout until a serviceable address is selected.',
          ],
        },
        {
          id: 'customs-risk',
          heading: '3. International Duties, Inspection & Risk of Loss',
          paragraphs: [
            'For shipments outside Bangladesh, the buyer acts as Importer of Record and bears all destination customs duties, import VAT, and clearance fees. Risk of loss passes upon confirmed physical delivery signature or verified OTP/wallet handoff at the buyer’s designated delivery address.',
          ],
        },
      ],
    },
    {
      id: 'return-policy',
      category: 'Commerce & Logistics',
      title: 'Returns, Refunds & Cancellation Policy',
      shortTitle: 'Returns & Refunds',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Remedies & Exclusions`,
      summary:
        'Clear conditions for pre-dispatch cancellations, post-delivery inspection windows, non-returnable hygienic/perishable goods, and verified refund timelines.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['shipping-policy', 'terms', 'product-safety'],
      sections: [
        {
          id: 'cancellation-window',
          heading: '1. Pre-Dispatch Cancellation Rules',
          paragraphs: [
            'Orders in "Confirmed" or "Processing" stages may be cancelled directly from your Order History or tracking dashboard without fee. Once status advances to "Packed", "Shipped", or "Out for Delivery", the parcel cannot be halted and must follow the post-delivery return process.',
          ],
        },
        {
          id: 'return-eligibility',
          heading: '2. Return Windows & Inspection Obligations',
          paragraphs: [
            'Unused studio objects in original, factory-sealed packaging with all accessories, tags, manuals, and warranty cards may be requested for return within 14 days of delivery (30 days for select first-party Kinto Studio home/hardware releases as stated on the product card).',
            'Wrong items, transit breakage, or missing accessories must be reported within 48 hours of delivery with unedited unboxing or defect photos to qualify for complimentary return pickup or replacement.',
          ],
          table: {
            headers: ['Category / Condition', 'Eligibility', 'Notes'],
            rows: [
              ['Defective / Damaged / Wrong Item', '100% Eligible (within 48h report)', 'Free replacement or full refund including delivery fee'],
              ['Unopened Electronics / Hardware', '14 Days (factory seal intact)', 'Serial number & packaging verified prior to credit'],
              ['Beauty, Skincare & Grooming', 'Unopened & Sealed Only', 'Non-returnable once sanitary seal is broken'],
              ['Grocery, Coffee & Supplements', 'Damaged / Expired on Arrival Only', 'Perishables non-returnable for change of mind'],
              ['Made-to-Order / Custom Furniture', 'Defect or Transit Damage Only', 'Restocking fee or non-cancelable once milled'],
            ],
          },
        },
        {
          id: 'refund-settlement',
          heading: '3. Refund Channels & Processing Timelines',
          paragraphs: [
            'Approved refunds are credited strictly back to the original payment channel—bKash, Nagad, Rocket, SSLCommerz, Visa/Mastercard, or verified Bangladesh bank transfer for settled COD orders—within 5 to 10 business days following warehouse quality inspection (subject to issuer settlement cycles).',
          ],
        },
      ],
    },
    {
      id: 'seller-agreement',
      category: 'Marketplace Governance',
      title: 'Seller Marketplace Agreement',
      shortTitle: 'Seller Agreement',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Partner Studios & Indemnification`,
      summary:
        'Contractual obligations, authenticity warranties, tax responsibility, payout reserves, and strict seller indemnification protecting Kinto Studio LLC.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['prohibited-items', 'intellectual-property', 'terms'],
      sections: [
        {
          id: 'independent-relationship',
          heading: '1. Independent Merchant Status',
          paragraphs: [
            'Partner Seller Studios operate strictly as independent commercial vendors—never as employees, agents, franchisees, or joint-venture partners of Kinto Studio LLC. Each Seller Studio retains sole legal responsibility for sourcing, product safety testing, regulatory approvals, pricing accuracy, fulfillment SLAs, and statutory taxes (including Bangladesh VAT, AIT, Trade License, and TIN compliance).',
          ],
        },
        {
          id: 'seller-warranties',
          heading: '2. Authenticity, Title & Listing Representations',
          paragraphs: [
            'By publishing any SKU in Seller Studio, the Seller warrants and represents that: (a) it holds clear legal title and distribution authority in Bangladesh; (b) every product is 100% authentic and never counterfeit, grey-market diverted, expired, or misbranded; (c) weight, size tier, COD eligibility, and safety warnings are truthful; and (d) no Prohibited or Restricted Items are listed.',
          ],
        },
        {
          id: 'payouts-reserves',
          heading: '3. Marketplace Commissions, Holds & Chargeback Reserves',
          paragraphs: [
            'Kinto Studio LLC deducts agreed platform commissions, payment gateway fees, and shipping adjustments prior to seller settlement. We reserve the right to freeze, offset, or hold seller payouts for up to 90 days in cases of elevated return rates, suspected counterfeit complaints, customer disputes, or payment chargebacks.',
          ],
        },
        {
          id: 'seller-indemnity',
          heading: '4. Broad Seller Indemnification & Immediate Delisting',
          paragraphs: [
            'Seller agrees to fully indemnify, defend, and hold harmless Kinto Studio LLC against all regulatory fines, BSTI/consumer-court actions, copyright/trademark claims, bodily injury, property damage, and tax assessments arising from Seller’s listings or fulfilled goods.',
            'Kinto Studio LLC may immediately suspend or terminate any Seller Studio account without prior notice for policy breaches, counterfeit flags, or unsafe products.',
          ],
        },
      ],
    },
    {
      id: 'prohibited-items',
      category: 'Marketplace Governance',
      title: 'Prohibited & Restricted Items Policy',
      shortTitle: 'Prohibited Items',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Version ${LEGAL_VERSION} · Zero-Tolerance Catalog Rules`,
      summary:
        'Strict list of illegal, hazardous, counterfeit, uncertified, and restricted items banned from Seller Studio listings and buyer shipments.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['seller-agreement', 'product-safety', 'acceptable-use'],
      sections: [
        {
          id: 'zero-tolerance',
          heading: '1. Zero-Tolerance Enforcement',
          paragraphs: [
            'Listing, promoting, or shipping any prohibited item results in immediate SKU removal, account suspension, payout forfeiture where permitted by law, and potential referral to Bangladesh law enforcement or customs authorities.',
          ],
        },
        {
          id: 'banned-categories',
          heading: '2. Strictly Prohibited Categories',
          paragraphs: [
            'The following items may never be offered through Kinto Studio LLC:',
          ],
          bullets: [
            'Counterfeit Goods & Unauthorized Replicas: Fake designer apparel, cloned audio hardware, forged serial labels, or trademark-infringing knockoffs.',
            'Controlled Substances & Unregistered Drugs: Narcotics, prescription pharmaceuticals, unregulated steroid/weight-loss pills, or unapproved medical devices.',
            'Weapons, Ammunition & Explosives: Firearms, replica combat blades prohibited under the Arms Act, tasers, fireworks, or explosive precursors.',
            'Hazardous & Flammable Goods: Loose/uncertified lithium-ion cells, pressurized canisters, toxic industrial solvents, or mercury-containing cosmetics.',
            'Recalled & Unsafe Infant Products: Inclined infant sleepers, choking-hazard unmarked small-part toys for under-3s, or lead-painted nursery items.',
            'Stolen Property & Illegal Digital Goods: Pirated books/software, signal jammers, hacking hardware, or copyright-circumvention devices.',
          ],
        },
      ],
    },
    {
      id: 'product-safety',
      category: 'Safety & Rights',
      title: 'Product Safety & Regulatory Disclaimers',
      shortTitle: 'Product Safety',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Department-Specific Risk & Usage Notices`,
      summary:
        'Mandatory risk, allergy, age-grading, voltage, mechanical PPE, and non-medical disclaimers covering all 10 marketplace departments.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'prohibited-items', 'return-policy'],
      sections: [
        {
          id: 'no-professional-advice',
          heading: '1. No Medical, Nutritional, Mechanical or Veterinary Advice',
          paragraphs: [
            'Product descriptions, editorial Studio Journal essays, Q&A responses, and customer impressions on Kinto Studio are provided strictly for informational purposes and do not substitute for professional medical, dermatological, dietary, veterinary, architectural, or licensed automotive advice.',
          ],
        },
        {
          id: 'department-disclosures',
          heading: '2. Department-Specific Safety Warnings',
          paragraphs: [
            'By purchasing items across our regulated categories, you acknowledge and agree to observe the following safeguards:',
          ],
          table: {
            headers: ['Department', 'Required Buyer & User Precaution'],
            rows: [
              [
                'Beauty & Skincare',
                'External use only. Perform a 24-hour patch test before full use; stop use immediately if irritation occurs.',
              ],
              [
                'Grocery, Food & Coffee',
                'Check allergen warnings (nuts, dairy, gluten, soy) and expiry dates on arrival; store per label temperature.',
              ],
              [
                'Baby, Kids & Montessori Toys',
                'Observe minimum age ratings; keep small parts away from children under 3 years; supervise active play.',
              ],
              [
                'Electronics & Batteries',
                'Verify 220–240V / USB-PD ratings; use surge protection; never puncture or overheat lithium batteries.',
              ],
              [
                'Automotive & Power Tools',
                'Wear ANSI/CE eye, ear, and hand PPE; adhere strictly to RPM/torque limits; misuse voids warranty and is at user risk.',
              ],
              [
                'Health, Wellness & Pets',
                'Non-diagnostic products; consult a licensed doctor or veterinarian prior to dietary or pet supplement use.',
              ],
            ],
          },
        },
      ],
    },
    {
      id: 'acceptable-use',
      category: 'Safety & Rights',
      title: 'Acceptable Use & User Content Policy',
      shortTitle: 'Acceptable Use',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Reviews, Q&A, Anti-Scraping & Fraud Rules`,
      summary:
        'Governs customer reviews, product questions, automated scraping bans, and license rights to display community feedback.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'privacy-policy', 'intellectual-property'],
      sections: [
        {
          id: 'ugc-license',
          heading: '1. User-Generated Content License & Moderation',
          paragraphs: [
            'By submitting product reviews, photographs, Q&A inquiries, or concierge messages, you grant Kinto Studio LLC a non-exclusive, worldwide, royalty-free, irrevocable license to display, translate, and moderate that content in connection with the marketplace.',
            'You confirm your review reflects genuine first-hand experience and is not defamatory, obscene, deceptive, or commercially compensated without disclosure.',
          ],
        },
        {
          id: 'prohibited-conduct',
          heading: '2. Prohibited Platform Conduct',
          paragraphs: [
            'Users and automated systems may not engage in any conduct that compromises platform availability, fairness, or trust:',
          ],
          bullets: [
            'Automated scraping, price harvesting, credential stuffing, or denial-of-service probing.',
            'Posting fabricated positive or malicious competitor reviews ("review manipulation").',
            'Abusive Cash on Delivery refusals, repeated friendly-fraud payment chargebacks, or promo-code exploitation.',
            'Impersonating Kinto Studio staff, Concierge specialists, or Partner Brands.',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property',
      category: 'Safety & Rights',
      title: 'Intellectual Property & DMCA Takedown Policy',
      shortTitle: 'IP & DMCA Policy',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · Copyright Act 2023, Trademarks & Notice Procedure`,
      summary:
        'Protects platform trademarks and provides rights holders a structured takedown and counter-notice procedure via legal@kintostudio.example.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['seller-agreement', 'prohibited-items', 'acceptable-use'],
      sections: [
        {
          id: 'platform-ip',
          heading: '1. Platform Trademarks & Editorial Assets',
          paragraphs: [
            'All Kinto Studio wordmarks, design systems, editorial copy, software architecture, and custom imagery are protected under the Copyright Act 2023 and Trademarks Act 2009 of Bangladesh and international treaties. No part may be reproduced or resold without prior written authorization.',
          ],
        },
        {
          id: 'takedown-procedure',
          heading: '2. Submitting a Copyright or Trademark Infringement Notice',
          paragraphs: [
            `Rights holders who believe a marketplace listing or user upload infringes their protected mark or copyright may send a signed written notice to ${LEGAL_ENTITY.legalEmail} with the subject line "IP Takedown Notice" containing:`,
          ],
          bullets: [
            'Identification of the copyrighted work or registered trademark claimed to be infringed.',
            'Exact product SKU, URL hash, or Seller Studio name on Kinto Studio.',
            'Claimant full legal name, organization, physical address, telephone, and email.',
            'Good-faith statement under penalty of perjury that the disputed use is unauthorized and that submitted information is accurate.',
          ],
        },
        {
          id: 'repeat-infringers',
          heading: '3. Counter-Notices & Repeat-Infringer Termination',
          paragraphs: [
            'Affected Seller Studios receive notice and may submit a documented counter-notice proving authorization or legitimate resale rights. Verified repeat infringers are permanently banned from Seller Studio.',
          ],
        },
      ],
    },
    {
      id: 'accessibility',
      category: 'Safety & Rights',
      title: 'Digital Accessibility Statement',
      shortTitle: 'Accessibility',
      subtitle: `Effective ${LEGAL_EFFECTIVE_DATE} · WCAG 2.1 Level AA Commitment & Support`,
      summary:
        'Our ongoing commitment to keyboard usability, screen-reader semantics, color contrast, reduced motion, and direct barrier assistance.',
      lastUpdated: LEGAL_EFFECTIVE_DATE,
      version: LEGAL_VERSION,
      relatedIds: ['terms', 'privacy-policy'],
      sections: [
        {
          id: 'standards',
          heading: '1. Conformance Target & Assistive Support',
          paragraphs: [
            'Kinto Studio LLC strives to maintain conformance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA across desktop, tablet, mobile browser, and installed PWA sessions—including keyboard focus navigation, labeled form controls, high-contrast light/dark themes, and prefers-reduced-motion compliance.',
          ],
        },
        {
          id: 'feedback-accommodation',
          heading: '2. Reporting Accessibility Barriers',
          paragraphs: [
            `If any part of the catalog, checkout, or policy reader presents an accessibility barrier, contact ${LEGAL_ENTITY.legalEmail} or ${LEGAL_ENTITY.conciergeEmail} with the page name and assistive technology details. We aim to respond with an accessible alternative or resolution within two (2) business days.`,
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
