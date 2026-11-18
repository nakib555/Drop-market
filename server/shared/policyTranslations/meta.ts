import type {
  CookieInventoryItem,
  LanguageCode,
  PaymentMethodId,
  PolicyCategory,
} from '../../../src/types/commerce.ts';
import type {
  GatewayTranslationMap,
  LocalizedCookieMeta,
  LocalizedDepartmentSafetyNotice,
  LocalizedFactsMeta,
  PolicyCategoryTranslationMap,
} from './types.ts';

export const POLICY_CATEGORY_TRANSLATIONS: PolicyCategoryTranslationMap = {
  Shopping: {
    en: 'Shopping',
    bn: 'কেনাকাটা ও ব্রাউজিং',
    hi: 'खरीदारी एवं उपयोग',
    ar: 'التسوق والطلبات',
    es: 'Compras y Uso',
    fr: 'Achats et Utilisation',
  },
  Payments: {
    en: 'Payments',
    bn: 'পেমেন্ট ও বিলিং',
    hi: 'भुगतान एवं बिलिंग',
    ar: 'المدفوعات والفواتير',
    es: 'Pagos y Facturación',
    fr: 'Paiements et Facturation',
  },
  'Orders & Delivery': {
    en: 'Orders & Delivery',
    bn: 'অর্ডার, বাতিল ও ডেলিভারি',
    hi: 'ऑर्डर एवं डिलीवरी',
    ar: 'الطلبات والتوصيل',
    es: 'Pedidos y Entregas',
    fr: 'Commandes et Livraison',
  },
  'Returns & Warranty': {
    en: 'Returns & Warranty',
    bn: 'রিটার্ন, রিফান্ড ও ওয়ারেন্টি',
    hi: 'रिटर्न, रिफंड एवं वारंटी',
    ar: 'الإرجاع والضمان',
    es: 'Devoluciones y Garantía',
    fr: 'Retours et Garantie',
  },
  'Privacy & Legal': {
    en: 'Privacy & Legal',
    bn: 'গোপনীয়তা ও আইনি বিধি',
    hi: 'गोपनीयता एवं विधिक नियम',
    ar: 'الخصوصية والشؤون القانونية',
    es: 'Privacidad y Marco Legal',
    fr: 'Confidentialité et Cadre Légal',
  },
  'Seller Information': {
    en: 'Seller Information',
    bn: 'বিক্রেতা ও মার্কেটপ্লেস নীতি',
    hi: 'विक्रेता एवं मार्केटप्लेस नियम',
    ar: 'معلومات البائعين والسوق',
    es: 'Información para Vendedores',
    fr: 'Informations Vendeurs',
  },
};

export const POLICY_FACTS_TRANSLATIONS: Record<LanguageCode, LocalizedFactsMeta> = {
  en: {
    operatingCountry: 'Bangladesh',
    governingLaw: 'Laws of the People’s Republic of Bangladesh',
    competentCourts: 'Competent Courts in Dhaka, Bangladesh',
    marketplaceModelLabel: 'Direct Studio Editions & Independent Partner Seller Studios',
    defaultSupportHours: 'Customer Support Desk (Email & Ticket Portal)',
    defaultRefundSlaBusinessDays: '7 to 10 business days after quality inspection',
    defaultCancelPreDispatchCutoff: 'Any time before order status advances to Packed or Shipped',
    operatorFallbackSuffix: '(Operator details configured in Store Legal Settings)',
    operatorTradingAs: (entity, trading) => `${entity} trading as ${trading}`,
    commissionOnboardingFallback: 'as confirmed in onboarding',
    payoutSettingsFallback: 'published in Seller Settings upon sign-off',
    suspendedStatus: 'Currently Suspended',
    prepaidRestrictedStatus: 'Prepaid / Restricted',
    prepaidOnlyStatus: 'Prepaid Only',
    upToCodUsd: (usd) => `Up to $${usd} USD eq. BDT`,
    defaultNationwideLabel: 'Bangladesh Nationwide & Dhaka Metro',
    defaultNationwideWindow: '1–5 Business Days',
    defaultNationwideCod: 'Zone & Cap Dependent',
    activeAtCheckout: 'Active at Checkout',
    pendingGatewayActivation: 'Pending Gateway Activation',
    disabledUntilVerified: 'Disabled until merchant credentials are verified',
    promoWaivesBaseFee: 'Waives standard base fee',
    promoPercentOff: (pct) => `${pct}% off subtotal`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} USD (approx. ${bdtFormatted} BDT)`,
    promoNoMinimum: 'No minimum subtotal',
  },
  bn: {
    operatingCountry: 'বাংলাদেশ',
    governingLaw: 'গণপ্রজাতন্ত্রী বাংলাদেশের প্রচলিত আইন',
    competentCourts: 'ঢাকায় অবস্থিত এখতিয়ারভুক্ত আদালত, বাংলাদেশ',
    marketplaceModelLabel: 'সরাসরি স্টুডিও সংস্করণ ও স্বাধীন অংশীদার বিক্রেতা স্টুডিও',
    defaultSupportHours: 'গ্রাহক সহায়তা ডেস্ক (ইমেইল ও টিকিট পোর্টাল)',
    defaultRefundSlaBusinessDays: 'গুণগত পরিদর্শনের পর ৭ থেকে ১০ কর্মদিবসের মধ্যে',
    defaultCancelPreDispatchCutoff: 'অর্ডারের অবস্থা “প্যাকেজ প্রস্তুত” বা “প্রেরিত” পর্যায়ে উন্নীত হওয়ার পূর্ব পর্যন্ত যেকোনো সময়',
    operatorFallbackSuffix: '(পরিচালনাকারী প্রতিষ্ঠানের বিবরণ স্টোরের আইনি সেটিংসে সংরক্ষিত)',
    operatorTradingAs: (entity, trading) => `${entity} (বাণিজ্যিক নাম: ${trading})`,
    commissionOnboardingFallback: 'অনবোর্ডিং চুক্তিতে নির্ধারিত হারে',
    payoutSettingsFallback: 'অনুমোদনের পর বিক্রেতা সেটিংসে প্রকাশিত সূচি অনুযায়ী',
    suspendedStatus: 'সাময়িকভাবে স্থগিত',
    prepaidRestrictedStatus: 'অগ্রিম পরিশোধযোগ্য / সীমাবদ্ধ অঞ্চল',
    prepaidOnlyStatus: 'শুধুমাত্র অগ্রিম পেমেন্ট',
    upToCodUsd: (usd) => `সর্বোচ্চ $${usd} মার্কিন ডলার সমপরিমাণ টাকা পর্যন্ত`,
    defaultNationwideLabel: 'সমগ্র বাংলাদেশ ও ঢাকা মেট্রো',
    defaultNationwideWindow: '১–৫ কর্মদিবস',
    defaultNationwideCod: 'অঞ্চল ও অর্ডার সীমা সাপেক্ষে',
    activeAtCheckout: 'চেকআউটে সক্রিয়',
    pendingGatewayActivation: 'গেটওয়ে সক্রিয়করণের অপেক্ষমাণ',
    disabledUntilVerified: 'মার্চেন্ট সনদ যাচাই সম্পন্ন না হওয়া পর্যন্ত নিষ্ক্রিয়',
    promoWaivesBaseFee: 'মানসম্মত ভিত্তি ডেলিভারি মাশুল মওকুফ',
    promoPercentOff: (pct) => `উপমোটের ওপর ${pct}% ছাড়`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} মার্কিন ডলার (আনুমানিক ${bdtFormatted} টাকা)`,
    promoNoMinimum: 'ন্যূনতম ক্রয়সীমা প্রযোজ্য নয়',
  },
  hi: {
    operatingCountry: 'बांग्लादेश',
    governingLaw: 'बांग्लादेश जनवादी गणराज्य के प्रचलित विधि-विधान',
    competentCourts: 'ढाका, बांग्लादेश स्थित सक्षम न्यायालय',
    marketplaceModelLabel: 'प्रत्यक्ष स्टूडियो संस्करण एवं स्वतंत्र भागीदार विक्रेता स्टूडियो',
    defaultSupportHours: 'ग्राहक सहायता डेस्क (ईमेल एवं टिकट पोर्टल)',
    defaultRefundSlaBusinessDays: 'गुणवत्ता निरीक्षण पूर्ण होने के पश्चात 7 से 10 कार्यदिवसों के भीतर',
    defaultCancelPreDispatchCutoff: 'ऑर्डर की स्थिति "पैक्ड" या "शिप्ड" होने से पूर्व किसी भी समय',
    operatorFallbackSuffix: '(संचालक का विवरण स्टोर की विधिक सेटिंग्स में दर्ज है)',
    operatorTradingAs: (entity, trading) => `${entity} (व्यापारिक नाम: ${trading})`,
    commissionOnboardingFallback: 'ऑनबोर्डिंग अनुबंध में यथा-निर्धारित',
    payoutSettingsFallback: 'अनुमोदन के पश्चात विक्रेता सेटिंग्स में प्रकाशित',
    suspendedStatus: 'वर्तमान में स्थगित',
    prepaidRestrictedStatus: 'पूर्व-भुगतान / प्रतिबंधित क्षेत्र',
    prepaidOnlyStatus: 'केवल पूर्व-भुगतान (Prepaid)',
    upToCodUsd: (usd) => `$${usd} अमेरिकी डॉलर समतुल्य BDT तक`,
    defaultNationwideLabel: 'संपूर्ण बांग्लादेश एवं ढाका मेट्रो',
    defaultNationwideWindow: '1–5 कार्यदिवस',
    defaultNationwideCod: 'क्षेत्र एवं ऑर्डर सीमा के अधीन',
    activeAtCheckout: 'चेकआउट पर सक्रिय',
    pendingGatewayActivation: 'गेटवे सक्रियण लंबित',
    disabledUntilVerified: 'मर्चेंट प्रमाण-पत्र सत्यापित होने तक निष्क्रिय',
    promoWaivesBaseFee: 'मानक आधार शिपिंग शुल्क में छूट',
    promoPercentOff: (pct) => `उप-योग पर ${pct}% की छूट`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} USD (लगभग ${bdtFormatted} BDT)`,
    promoNoMinimum: 'कोई न्यूनतम उप-योग आवश्यक नहीं',
  },
  ar: {
    operatingCountry: 'بنغلاديش',
    governingLaw: 'قوانين جمهورية بنغلاديش الشعبية',
    competentCourts: 'المحاكم المختصة في دكا، بنغلاديش',
    marketplaceModelLabel: 'إصدارات الاستوديو المباشرة واستوديوهات البائعين الشركاء المستقلين',
    defaultSupportHours: 'مكتب دعم العملاء (البريد الإلكتروني وبوابة التذاكر)',
    defaultRefundSlaBusinessDays: 'خلال 7 إلى 10 أيام عمل بعد إتمام فحص الجودة',
    defaultCancelPreDispatchCutoff: 'في أي وقت قبل انتقال حالة الطلب إلى «تم التغليف» أو «تم الشحن»',
    operatorFallbackSuffix: '(تفاصيل الجهة المشغلة مضبوطة في الإعدادات القانونية للمتجر)',
    operatorTradingAs: (entity, trading) => `${entity} العاملة بالاسم التجاري ${trading}`,
    commissionOnboardingFallback: 'وفق ما تم تأكيده في اتفاقية الانضمام',
    payoutSettingsFallback: 'منشورة في إعدادات البائع فور الاعتماد الرسمي',
    suspendedStatus: 'معلّق حالياً',
    prepaidRestrictedStatus: 'دفع مسبق / منطقة مقيدة',
    prepaidOnlyStatus: 'دفع إلكتروني مسبق فقط',
    upToCodUsd: (usd) => `حتى ما يعادل $${usd} دولاراً أمريكياً بالتكافؤ البنغلاديشي`,
    defaultNationwideLabel: 'جميع أنحاء بنغلاديش ومنطقة دكا الكبرى',
    defaultNationwideWindow: 'من 1 إلى 5 أيام عمل',
    defaultNationwideCod: 'رهناً بالنطاق الجغرافي والحد الأقصى للطلب',
    activeAtCheckout: 'نشط عند إتمام الطلب',
    pendingGatewayActivation: 'بانتظار تفعيل بوابة الدفع',
    disabledUntilVerified: 'معطّل إلى حين التحقق من بيانات التاجر المعتمدة',
    promoWaivesBaseFee: 'إعفاء من رسوم التوصيل القياسية الأساسية',
    promoPercentOff: (pct) => `خصم ${pct}% على المجموع الفرعي`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} USD (نحو ${bdtFormatted} BDT)`,
    promoNoMinimum: 'دون حد أدنى للمجموع الفرعي',
  },
  es: {
    operatingCountry: 'Bangladés',
    governingLaw: 'Leyes de la República Popular de Bangladés',
    competentCourts: 'Tribunales Competentes de Daca, Bangladés',
    marketplaceModelLabel: 'Ediciones Directas del Estudio y Estudios Vendedores Asociados Independientes',
    defaultSupportHours: 'Mesa de Atención al Cliente (Correo Electrónico y Portal de Solicitudes)',
    defaultRefundSlaBusinessDays: 'de 7 a 10 días hábiles tras la inspección de calidad',
    defaultCancelPreDispatchCutoff: 'En cualquier momento antes de que el pedido pase a estado Empacado o Enviado',
    operatorFallbackSuffix: '(Datos del operador configurados en la Configuración Legal de la Tienda)',
    operatorTradingAs: (entity, trading) => `${entity} operando comercialmente como ${trading}`,
    commissionOnboardingFallback: 'según lo confirmado en el alta comercial',
    payoutSettingsFallback: 'publicado en Configuración del Vendedor tras la validación',
    suspendedStatus: 'Suspendido temporalmente',
    prepaidRestrictedStatus: 'Prepago / Zona restringida',
    prepaidOnlyStatus: 'Solo pago anticipado',
    upToCodUsd: (usd) => `Hasta el equivalente en BDT a $${usd} USD`,
    defaultNationwideLabel: 'Todo Bangladés y Área Metropolitana de Daca',
    defaultNationwideWindow: '1–5 días hábiles',
    defaultNationwideCod: 'Según zona y límite del pedido',
    activeAtCheckout: 'Activo en el pago',
    pendingGatewayActivation: 'Activación de pasarela pendiente',
    disabledUntilVerified: 'Deshabilitado hasta verificar credenciales comerciales',
    promoWaivesBaseFee: 'Exime la tarifa base de envío estándar',
    promoPercentOff: (pct) => `${pct}% de descuento sobre el subtotal`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} USD (aprox. ${bdtFormatted} BDT)`,
    promoNoMinimum: 'Sin subtotal mínimo',
  },
  fr: {
    operatingCountry: 'Bangladesh',
    governingLaw: 'Lois de la République Populaire du Bangladesh',
    competentCourts: 'Juridictions compétentes de Dacca, Bangladesh',
    marketplaceModelLabel: 'Éditions Directes du Studio et Studios Vendeurs Partenaires Indépendants',
    defaultSupportHours: 'Service d’Assistance Clientèle (Courriel & Portail de Demandes)',
    defaultRefundSlaBusinessDays: 'sous 7 à 10 jours ouvrés après contrôle qualité',
    defaultCancelPreDispatchCutoff: 'À tout moment avant le passage de la commande au statut Emballée ou Expédiée',
    operatorFallbackSuffix: '(Informations de l’exploitant configurées dans les Paramètres Légaux de la Boutique)',
    operatorTradingAs: (entity, trading) => `${entity} exerçant sous l’enseigne ${trading}`,
    commissionOnboardingFallback: 'selon les conditions validées lors de l’adhésion',
    payoutSettingsFallback: 'publié dans les Paramètres Vendeur après validation',
    suspendedStatus: 'Temporairement suspendu',
    prepaidRestrictedStatus: 'Prépaiement / Zone restreinte',
    prepaidOnlyStatus: 'Prépaiement uniquement',
    upToCodUsd: (usd) => `Jusqu’à l’équivalent en BDT de $${usd} USD`,
    defaultNationwideLabel: 'Ensemble du Bangladesh et Grand Dacca',
    defaultNationwideWindow: '1 à 5 jours ouvrés',
    defaultNationwideCod: 'Selon la zone et le plafond de commande',
    activeAtCheckout: 'Actif au paiement',
    pendingGatewayActivation: 'Activation de passerelle en attente',
    disabledUntilVerified: 'Désactivé jusqu’à vérification des identifiants marchands',
    promoWaivesBaseFee: 'Exonère les frais d’expédition standard de base',
    promoPercentOff: (pct) => `${pct} % de remise sur le sous-total`,
    promoMinSubtotal: (usd, bdtFormatted) => `$${usd} USD (env. ${bdtFormatted} BDT)`,
    promoNoMinimum: 'Aucun minimum d’achat requis',
  },
};

const DATE_LOCALE_TAG: Record<LanguageCode, string> = {
  en: 'en-US',
  bn: 'bn-BD',
  hi: 'hi-IN',
  ar: 'ar-EG',
  es: 'es-ES',
  fr: 'fr-FR',
};

export function formatPolicyDateForLanguage(dateText: string, lang: LanguageCode): string {
  if (lang === 'en') return dateText;
  const parsed = Date.parse(dateText);
  if (Number.isNaN(parsed)) return dateText;
  try {
    return new Intl.DateTimeFormat(DATE_LOCALE_TAG[lang], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(parsed));
  } catch {
    return dateText;
  }
}

export const GATEWAY_TRANSLATIONS: GatewayTranslationMap = {
  cod: {
    en: {
      label: 'Cash on Delivery (COD)',
      scope: 'Eligible Bangladesh delivery zones within order cap',
    },
    bn: {
      label: 'ক্যাশ অন ডেলিভারি (COD)',
      scope: 'নির্ধারিত অর্ডার সীমার মধ্যে বাংলাদেশের যোগ্য ডেলিভারি অঞ্চলসমূহ',
    },
    hi: {
      label: 'कैश ऑन डिलीवरी (COD)',
      scope: 'निर्धारित ऑर्डर सीमा के भीतर पात्र बांग्लादेश डिलीवरी क्षेत्र',
    },
    ar: {
      label: 'الدفع نقداً عند الاستلام (COD)',
      scope: 'مناطق التوصيل المؤهلة داخل بنغلاديش ضمن الحد الأقصى للطلب',
    },
    es: {
      label: 'Pago contra entrega (COD)',
      scope: 'Zonas elegibles en Bangladés dentro del límite por pedido',
    },
    fr: {
      label: 'Paiement à la livraison (COD)',
      scope: 'Zones éligibles au Bangladesh dans la limite du plafond autorisé',
    },
  },
  bkash: {
    en: {
      label: 'bKash Mobile Wallet',
      scope: 'Bangladesh BDT Checkout (Env Credentials)',
    },
    bn: {
      label: 'বিকাশ মোবাইল ওয়ালেট',
      scope: 'বাংলাদেশি টাকায় (BDT) চেকআউট (সার্ভার সনদ সাপেক্ষে)',
    },
    hi: {
      label: 'bKash मोबाइल वॉलेट',
      scope: 'बांग्लादेश BDT चेकआउट (पर्यावरण प्रमाण-पत्र आधारित)',
    },
    ar: {
      label: 'محفظة bKash الإلكترونية',
      scope: 'الدفع بالتكافؤ البنغلاديشي BDT (بيانات الاعتماد الرسمية)',
    },
    es: {
      label: 'Billetera móvil bKash',
      scope: 'Pago en BDT dentro de Bangladés (credenciales de entorno)',
    },
    fr: {
      label: 'Portefeuille mobile bKash',
      scope: 'Règlement en BDT au Bangladesh (identifiants serveur)',
    },
  },
  nagad: {
    en: {
      label: 'Nagad Mobile Wallet',
      scope: 'Bangladesh BDT Checkout (Env Credentials)',
    },
    bn: {
      label: 'নগদ মোবাইল ওয়ালেট',
      scope: 'বাংলাদেশি টাকায় (BDT) চেকআউট (সার্ভার সনদ সাপেক্ষে)',
    },
    hi: {
      label: 'Nagad मोबाइल वॉलेट',
      scope: 'बांग्लादेश BDT चेकआउट (पर्यावरण प्रमाण-पत्र आधारित)',
    },
    ar: {
      label: 'محفظة Nagad الإلكترونية',
      scope: 'الدفع بالتكافؤ البنغلاديشي BDT (بيانات الاعتماد الرسمية)',
    },
    es: {
      label: 'Billetera móvil Nagad',
      scope: 'Pago en BDT dentro de Bangladés (credenciales de entorno)',
    },
    fr: {
      label: 'Portefeuille mobile Nagad',
      scope: 'Règlement en BDT au Bangladesh (identifiants serveur)',
    },
  },
  rocket: {
    en: {
      label: 'Rocket (DBBL)',
      scope: 'Bangladesh BDT Checkout (Env Credentials)',
    },
    bn: {
      label: 'রকেট (ডাচ্‌-বাংলা ব্যাংক)',
      scope: 'বাংলাদেশি টাকায় (BDT) চেকআউট (সার্ভার সনদ সাপেক্ষে)',
    },
    hi: {
      label: 'Rocket (DBBL)',
      scope: 'बांग्लादेश BDT चेकआउट (पर्यावरण प्रमाण-पत्र आधारित)',
    },
    ar: {
      label: 'محفظة Rocket (DBBL)',
      scope: 'الدفع بالتكافؤ البنغلاديشي BDT (بيانات الاعتماد الرسمية)',
    },
    es: {
      label: 'Rocket (DBBL)',
      scope: 'Pago en BDT dentro de Bangladés (credenciales de entorno)',
    },
    fr: {
      label: 'Rocket (DBBL)',
      scope: 'Règlement en BDT au Bangladesh (identifiants serveur)',
    },
  },
  sslcommerz: {
    en: {
      label: 'SSLCommerz Gateway',
      scope: 'Bangladesh & Cards (Env Credentials)',
    },
    bn: {
      label: 'এসএসএলকমার্জ ইউনিফায়েড গেটওয়ে',
      scope: 'বাংলাদেশি কার্ড ও নেটব্যাংকিং (সার্ভার সনদ সাপেক্ষে)',
    },
    hi: {
      label: 'SSLCommerz एकीकृत गेटवे',
      scope: 'बांग्लादेश एवं कार्ड भुगतान (पर्यावरण प्रमाण-पत्र आधारित)',
    },
    ar: {
      label: 'بوابة الدفع الموحدة SSLCommerz',
      scope: 'بنغلاديش والبطاقات المصرفية (بيانات الاعتماد الرسمية)',
    },
    es: {
      label: 'Pasarela unificada SSLCommerz',
      scope: 'Bangladés y tarjetas bancarias (credenciales de entorno)',
    },
    fr: {
      label: 'Passerelle unifiée SSLCommerz',
      scope: 'Bangladesh et cartes bancaires (identifiants serveur)',
    },
  },
  visa: {
    en: {
      label: 'Visa / Mastercard 3DS',
      scope: 'Domestic & International (Stripe/SSLCommerz Env)',
    },
    bn: {
      label: 'ভিসা / মাস্টারকার্ড থ্রিডি-সিকিউর (3DS)',
      scope: 'দেশীয় ও আন্তর্জাতিক (সার্ভার গেটওয়ে সনদ সাপেক্ষে)',
    },
    hi: {
      label: 'Visa / Mastercard 3DS सुरक्षित',
      scope: 'घरेलू एवं अंतर्राष्ट्रीय (Stripe/SSLCommerz प्रमाण-पत्र)',
    },
    ar: {
      label: 'بطاقات Visa / Mastercard بتقنية 3DS',
      scope: 'المعاملات المحلية والدولية (بيانات الاعتماد الرسمية)',
    },
    es: {
      label: 'Visa / Mastercard 3DS',
      scope: 'Nacional e internacional (credenciales Stripe/SSLCommerz)',
    },
    fr: {
      label: 'Visa / Mastercard 3DS',
      scope: 'National et international (identifiants Stripe/SSLCommerz)',
    },
  },
  'bank-transfer': {
    en: {
      label: 'Bank Transfer (NPSB / BEFTN)',
      scope: 'Manual Verified Settlement (Env Account)',
    },
    bn: {
      label: 'ব্যাংক ট্রান্সফার (NPSB / BEFTN)',
      scope: 'যাচাইকৃত আন্তঃব্যাংক নিষ্পত্তি (সার্ভার ব্যাংক হিসাব)',
    },
    hi: {
      label: 'बैंक ट्रांसफर (NPSB / BEFTN)',
      scope: 'सत्यापित अंतर-बैंक निपटान (मर्चेंट बैंक खाता)',
    },
    ar: {
      label: 'التحويل المصرفي (NPSB / BEFTN)',
      scope: 'تسوية مصرفية موثقة يدوياً (حساب التاجر المعتمد)',
    },
    es: {
      label: 'Transferencia bancaria (NPSB / BEFTN)',
      scope: 'Liquidación interbancaria verificada (cuenta oficial)',
    },
    fr: {
      label: 'Virement bancaire (NPSB / BEFTN)',
      scope: 'Règlement interbancaire vérifié (compte marchand)',
    },
  },
};

export const COOKIE_TRANSLATIONS: Record<string, Record<LanguageCode, LocalizedCookieMeta>> = {
  'HttpOnly Session Token Cookie': {
    en: {
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Server',
      duration: 'Session / 7 days',
      purpose: 'Maintains authenticated Buyer, Seller, or Admin login state securely.',
    },
    bn: {
      classification: 'অত্যাবশ্যকীয়',
      provider: 'কিন্টো স্টুডিও সার্ভার',
      duration: 'সেশন / ৭ দিন',
      purpose: 'ক্রেতা, বিক্রেতা বা প্রশাসকের যাচাইকৃত লগইন সেশন নিরাপদে সংরক্ষণ করে।',
    },
    hi: {
      classification: 'अत्यंत आवश्यक',
      provider: 'Kinto Studio सर्वर',
      duration: 'सत्र / 7 दिन',
      purpose: 'सत्यापित क्रेता, विक्रेता अथवा व्यवस्थापक लॉगिन सत्र को सुरक्षित रखता है।',
    },
    ar: {
      classification: 'ضروري للغاية',
      provider: 'خادم Kinto Studio',
      duration: 'الجلسة / 7 أيام',
      purpose: 'يحافظ بأمان على حالة تسجيل الدخول الموثقة للمشتري أو البائع أو المسؤول.',
    },
    es: {
      classification: 'Estrictamente necesario',
      provider: 'Servidor Kinto Studio',
      duration: 'Sesión / 7 días',
      purpose: 'Mantiene de forma segura la sesión autenticada de Comprador, Vendedor o Administrador.',
    },
    fr: {
      classification: 'Strictement nécessaire',
      provider: 'Serveur Kinto Studio',
      duration: 'Session / 7 jours',
      purpose: 'Maintient de façon sécurisée l’état de connexion authentifié (Acheteur, Vendeur ou Administrateur).',
    },
  },
  'kinto-cart / kinto-saved / kinto-promo': {
    en: {
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Storefront',
      duration: 'Persistent until cleared or checkout',
      purpose: 'Preserves your shopping bag, saved items, and applied promotional code.',
    },
    bn: {
      classification: 'অত্যাবশ্যকীয়',
      provider: 'কিন্টো স্টুডিও স্টোরফ্রন্ট',
      duration: 'পরিষ্কার বা চেকআউট সম্পন্ন না হওয়া পর্যন্ত স্থায়ী',
      purpose: 'আপনার শপিং ব্যাগ, সংরক্ষিত পণ্য এবং প্রয়োগকৃত প্রোমো কোড সংরক্ষণ করে।',
    },
    hi: {
      classification: 'अत्यंत आवश्यक',
      provider: 'Kinto Studio स्टोरफ्रंट',
      duration: 'हटाए जाने या चेकआउट तक स्थायी',
      purpose: 'आपके शॉपिंग बैग, सहेजे गए उत्पादों एवं लागू प्रोमो कोड को सुरक्षित रखता है।',
    },
    ar: {
      classification: 'ضروري للغاية',
      provider: 'واجهة متجر Kinto Studio',
      duration: 'مستمر حتى الإزالة أو إتمام الشراء',
      purpose: 'يحفظ محتويات حقيبة التسوق والمنتجات المحفوظة ورمز الخصم المفعّل.',
    },
    es: {
      classification: 'Estrictamente necesario',
      provider: 'Tienda Kinto Studio',
      duration: 'Persistente hasta vaciar o finalizar compra',
      purpose: 'Conserva su bolsa de compra, artículos guardados y código promocional aplicado.',
    },
    fr: {
      classification: 'Strictement nécessaire',
      provider: 'Boutique Kinto Studio',
      duration: 'Persistant jusqu’à suppression ou validation de commande',
      purpose: 'Conserve votre panier, vos articles sauvegardés et le code promotionnel appliqué.',
    },
  },
  'kinto-language / kinto-currency / kinto-theme': {
    en: {
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Storefront',
      duration: 'Persistent user setting',
      purpose: 'Remembers interface language, BDT/USD currency display, and contrast mode.',
    },
    bn: {
      classification: 'অত্যাবশ্যকীয়',
      provider: 'কিন্টো স্টুডিও স্টোরফ্রন্ট',
      duration: 'ব্যবহারকারীর স্থায়ী পছন্দ',
      purpose: 'ইন্টারফেসের ভাষা, BDT/USD মুদ্রা প্রদর্শন এবং লাইট/ডার্ক থিম মনে রাখে।',
    },
    hi: {
      classification: 'अत्यंत आवश्यक',
      provider: 'Kinto Studio स्टोरफ्रंट',
      duration: 'स्थायी उपयोगकर्ता सेटिंग',
      purpose: 'इंटरफ़ेस भाषा, BDT/USD मुद्रा प्रदर्शन एवं लाइट/डार्क थीम को याद रखता है।',
    },
    ar: {
      classification: 'ضروري للغاية',
      provider: 'واجهة متجر Kinto Studio',
      duration: 'إعداد دائم للمستخدم',
      purpose: 'يحفظ لغة الواجهة وعملة العرض (BDT/USD) ووضع التباين المختار.',
    },
    es: {
      classification: 'Estrictamente necesario',
      provider: 'Tienda Kinto Studio',
      duration: 'Preferencia persistente del usuario',
      purpose: 'Recuerda el idioma de interfaz, la divisa BDT/USD y el tema visual.',
    },
    fr: {
      classification: 'Strictement nécessaire',
      provider: 'Boutique Kinto Studio',
      duration: 'Paramètre utilisateur persistant',
      purpose: 'Mémorise la langue d’interface, l’affichage BDT/USD et le mode de contraste.',
    },
  },
  'kinto-cookie-consent / kinto-privacy-prefs': {
    en: {
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Privacy Controls',
      duration: 'Persistent until preferences updated',
      purpose: 'Stores your granular consent choices so optional tracking stays blocked when declined.',
    },
    bn: {
      classification: 'অত্যাবশ্যকীয়',
      provider: 'কিন্টো স্টুডিও গোপনীয়তা নিয়ন্ত্রণ',
      duration: 'পছন্দ হালনাগাদ না করা পর্যন্ত স্থায়ী',
      purpose: 'আপনার সুনির্দিষ্ট সম্মতির পছন্দ সংরক্ষণ করে যাতে প্রত্যাখ্যাত ঐচ্ছিক ট্র্যাকিং বন্ধ থাকে।',
    },
    hi: {
      classification: 'अत्यंत आवश्यक',
      provider: 'Kinto Studio गोपनीयता नियंत्रण',
      duration: 'प्राथमिकताएँ अद्यतन होने तक स्थायी',
      purpose: 'आपकी विस्तृत सहमति प्राथमिकताओं को सहेजता है ताकि अस्वीकृत वैकल्पिक ट्रैकिंग अवरुद्ध रहे।',
    },
    ar: {
      classification: 'ضروري للغاية',
      provider: 'ضوابط الخصوصية في Kinto Studio',
      duration: 'مستمر حتى تحديث التفضيلات',
      purpose: 'يحفظ خيارات موافقتك التفصيلية لضمان استمرار حظر التتبع الاختياري عند رفضه.',
    },
    es: {
      classification: 'Estrictamente necesario',
      provider: 'Controles de Privacidad Kinto Studio',
      duration: 'Persistente hasta actualizar preferencias',
      purpose: 'Almacena sus opciones granulares de consentimiento para bloquear rastreos rechazados.',
    },
    fr: {
      classification: 'Strictement nécessaire',
      provider: 'Contrôles de Confidentialité Kinto Studio',
      duration: 'Persistant jusqu’à modification des préférences',
      purpose: 'Enregistre vos choix granulaires de consentement afin de bloquer tout suivi refusé.',
    },
  },
  'kinto-guest-order-ids / kinto-pending-action': {
    en: {
      classification: 'Strictly Necessary',
      provider: 'Kinto Studio Checkout & Auth Resume',
      duration: 'Browser tab session (max 15 min pending action)',
      purpose: 'Allows guest order tracking handoff and resumes an action after sign-in.',
    },
    bn: {
      classification: 'অত্যাবশ্যকীয়',
      provider: 'কিন্টো স্টুডিও চেকআউট ও অথেনটিকেশন রিজিউম',
      duration: 'ব্রাউজার ট্যাব সেশন (মুলতুবি কার্যক্রমের ক্ষেত্রে সর্বোচ্চ ১৫ মিনিট)',
      purpose: 'অতিথি অর্ডার ট্র্যাকিং সংযোগ ও সাইন-ইনের পর মুলতুবি কার্যক্রম পুনরায় চালু করতে সহায়তা করে।',
    },
    hi: {
      classification: 'अत्यंत आवश्यक',
      provider: 'Kinto Studio चेकआउट एवं प्रमाणीकरण',
      duration: 'ब्राउज़र टैब सत्र (लंबित कार्य हेतु अधिकतम 15 मिनट)',
      purpose: 'अतिथि ऑर्डर ट्रैकिंग हैंडऑफ़ तथा साइन-इन के पश्चात लंबित क्रिया को पुनः आरंभ करने की अनुमति देता है।',
    },
    ar: {
      classification: 'ضروري للغاية',
      provider: 'استئناف المصادقة وإتمام الشراء في Kinto Studio',
      duration: 'جلسة تبويب المتصفح (بحد أقصى 15 دقيقة للإجراء المعلّق)',
      purpose: 'يتيح متابعة طلبات الضيوف واستئناف الإجراء المطلوب بعد تسجيل الدخول.',
    },
    es: {
      classification: 'Estrictamente necesario',
      provider: 'Pago y Reanudación de Sesión Kinto Studio',
      duration: 'Sesión de pestaña (máx. 15 min para acción pendiente)',
      purpose: 'Permite el seguimiento de pedidos de invitados y reanudar una acción tras iniciar sesión.',
    },
    fr: {
      classification: 'Strictement nécessaire',
      provider: 'Paiement et Reprise d’Action Kinto Studio',
      duration: 'Session d’onglet (15 min max pour une action en attente)',
      purpose: 'Permet le suivi des commandes invité et la reprise d’une action après connexion.',
    },
  },
  'kinto-recent-searches': {
    en: {
      classification: 'Optional Preference',
      provider: 'Kinto Studio Search',
      duration: 'Cleared immediately when toggled off',
      purpose: 'Stores recent storefront search queries only when Save Search History consent is granted.',
    },
    bn: {
      classification: 'ঐচ্ছিক পছন্দ',
      provider: 'কিন্টো স্টুডিও অনুসন্ধান',
      duration: 'সুইচ বন্ধ করার সঙ্গে সঙ্গে মুছে ফেলা হয়',
      purpose: 'শুধুমাত্র অনুসন্ধান ইতিহাস সংরক্ষণের সম্মতি প্রদত্ত হলে সাম্প্রতিক অনুসন্ধানগুলো সংরক্ষণ করে।',
    },
    hi: {
      classification: 'वैकल्पिक प्राथमिकता',
      provider: 'Kinto Studio खोज',
      duration: 'बंद करते ही तत्काल मिटा दिया जाता है',
      purpose: 'केवल खोज इतिहास सहेजने की सहमति मिलने पर हाल की खोज क्वेरी सहेजता है।',
    },
    ar: {
      classification: 'تفضيل اختياري',
      provider: 'بحث Kinto Studio',
      duration: 'يُحذف فوراً عند إيقاف التفعيل',
      purpose: 'يحفظ استعلامات البحث الأخيرة فقط عند منح موافقة حفظ سجل البحث.',
    },
    es: {
      classification: 'Preferencia opcional',
      provider: 'Buscador Kinto Studio',
      duration: 'Se elimina de inmediato al desactivarse',
      purpose: 'Guarda búsquedas recientes solo cuando se otorga el consentimiento de historial de búsqueda.',
    },
    fr: {
      classification: 'Préférence optionnelle',
      provider: 'Recherche Kinto Studio',
      duration: 'Effacé immédiatement dès désactivation',
      purpose: 'Enregistre les recherches récentes uniquement lorsque le consentement d’historique est accordé.',
    },
  },
  'kinto-recent-views': {
    en: {
      classification: 'Optional Preference',
      provider: 'Kinto Studio Catalog Personalization',
      duration: 'Cleared immediately when toggled off',
      purpose: 'Powers Recently Viewed product shelves only when Personalized Catalog consent is granted.',
    },
    bn: {
      classification: 'ঐচ্ছিক পছন্দ',
      provider: 'কিন্টো স্টুডিও ক্যাটালগ ব্যক্তিগতকরণ',
      duration: 'সুইচ বন্ধ করার সঙ্গে সঙ্গে মুছে ফেলা হয়',
      purpose: 'শুধুমাত্র ব্যক্তিগতকৃত ক্যাটালগ সম্মতি প্রদত্ত হলে “সম্প্রতি দেখা পণ্য” তালিকা প্রদর্শন করে।',
    },
    hi: {
      classification: 'वैकल्पिक प्राथमिकता',
      provider: 'Kinto Studio कैटलॉग वैयक्तिकरण',
      duration: 'बंद करते ही तत्काल मिटा दिया जाता है',
      purpose: 'केवल वैयक्तिकृत कैटलॉग सहमति मिलने पर “हाल ही में देखे गए उत्पाद” अनुभाग संचालित करता है।',
    },
    ar: {
      classification: 'تفضيل اختياري',
      provider: 'تخصيص كتالوج Kinto Studio',
      duration: 'يُحذف فوراً عند إيقاف التفعيل',
      purpose: 'يشغّل قائمة المنتجات المشاهدة مؤخراً فقط عند الموافقة على تخصيص الكتالوج.',
    },
    es: {
      classification: 'Preferencia opcional',
      provider: 'Personalización de Catálogo Kinto Studio',
      duration: 'Se elimina de inmediato al desactivarse',
      purpose: 'Habilita la sección de vistos recientemente solo con consentimiento de catálogo personalizado.',
    },
    fr: {
      classification: 'Préférence optionnelle',
      provider: 'Personnalisation Catalogue Kinto Studio',
      duration: 'Effacé immédiatement dès désactivation',
      purpose: 'Alimente la section « Vus récemment » uniquement avec le consentement de personnalisation.',
    },
  },
  'Privacy-Minimized Route Diagnostics (In-Memory)': {
    en: {
      classification: 'Optional Analytics',
      provider: 'Kinto Studio (No 3rd-Party Ad Pixels Installed)',
      duration: 'In-memory session only',
      purpose: 'Records non-personal page-view/feature telemetry only when Analytics Opt-In is enabled.',
    },
    bn: {
      classification: 'ঐচ্ছিক বিশ্লেষণ',
      provider: 'কিন্টো স্টুডিও (কোনো তৃতীয়-পক্ষ বিজ্ঞাপন পিক্সেল সংযুক্ত নয়)',
      duration: 'শুধুমাত্র ইন-মেমোরি সেশন',
      purpose: 'শুধুমাত্র বিশ্লেষণ অপ্ট-ইন সক্রিয় থাকলেই ব্যক্তিগত তথ্যবিহীন পৃষ্ঠা-প্রদর্শন ও কার্যকারিতা তথ্য লিপিবদ্ধ করে।',
    },
    hi: {
      classification: 'वैकल्पिक विश्लेषण',
      provider: 'Kinto Studio (कोई तृतीय-पक्ष विज्ञापन पिक्सेल स्थापित नहीं)',
      duration: 'केवल इन-मेमोरी सत्र',
      purpose: 'केवल विश्लेषण ऑप्ट-इन सक्रिय होने पर ही गैर-व्यक्तिगत पृष्ठ-दृश्य एवं प्रदर्शन निदान दर्ज करता है।',
    },
    ar: {
      classification: 'تحليلات اختيارية',
      provider: 'Kinto Studio (دون أي بكسلات إعلانية خارجية)',
      duration: 'جلسة في الذاكرة فقط',
      purpose: 'يسجل قياسات تقنية غير شخصية لأداء الصفحات فقط عند تفعيل خيار الموافقة على التحليلات.',
    },
    es: {
      classification: 'Analítica opcional',
      provider: 'Kinto Studio (sin píxeles publicitarios de terceros)',
      duration: 'Solo sesión en memoria',
      purpose: 'Registra telemetría técnica no personal solo cuando el usuario activa la analítica.',
    },
    fr: {
      classification: 'Analytique optionnelle',
      provider: 'Kinto Studio (aucun pixel publicitaire tiers installé)',
      duration: 'Session en mémoire uniquement',
      purpose: 'Enregistre une télémétrie technique non personnelle uniquement si l’option analytique est activée.',
    },
  },
};

export const DEPARTMENT_SAFETY_TRANSLATIONS: Record<
  string,
  Record<LanguageCode, LocalizedDepartmentSafetyNotice>
> = {
  'beauty-care': {
    en: {
      title: 'Cosmetic, Topical & Personal Care Advisory',
      summary:
        'Formulations are offered strictly for external cosmetic use and do not constitute medical treatment or dermatological prescriptions.',
      points: [
        'Perform a 24-hour patch test on clean skin before full application, particularly for active botanical extracts, acids, or essential oils.',
        'Discontinue use immediately and consult a qualified physician if irritation, rash, or allergic reaction occurs.',
        'Opened, unsealed, or used beauty and hygiene items are ineligible for return once sanitary seals are broken.',
      ],
    },
    bn: {
      title: 'প্রসাধনী, বাহ্যিক ব্যবহার্য ও ব্যক্তিগত যত্ন সংক্রান্ত নির্দেশিকা',
      summary:
        'এই ফর্মুলেশনসমূহ শুধুমাত্র বাহ্যিক প্রসাধনী ব্যবহারের জন্য সরবরাহ করা হয় এবং এগুলো কোনো চিকিৎসাসেবা বা চর্মরোগ বিষয়ক ব্যবস্থাপত্র হিসেবে গণ্য নয়।',
      points: [
        'পূর্ণাঙ্গ ব্যবহারের পূর্বে পরিষ্কার ত্বকে ২৪ ঘণ্টার প্যাচ-টেস্ট সম্পন্ন করুন; বিশেষত সক্রিয় ভেষজ নির্যাস, অ্যাসিড বা এসেনশিয়াল অয়েলযুক্ত পণ্যের ক্ষেত্রে।',
        'ত্বকে জ্বালাপোড়া, ফুসকুড়ি বা অ্যালার্জিক প্রতিক্রিয়া দেখা দিলে তাৎক্ষণিকভাবে ব্যবহার বন্ধ করুন এবং নিবন্ধিত চিকিৎসকের পরামর্শ গ্রহণ করুন।',
        'স্বাস্থ্যসুরক্ষা সিল খোলা, মোড়ক উন্মোচিত বা ব্যবহৃত প্রসাধনী ও হাইজিন পণ্য ফেরতযোগ্য নয়।',
      ],
    },
    hi: {
      title: 'प्रसाधन, बाह्य उपयोग एवं व्यक्तिगत देखभाल परामर्श',
      summary:
        'ये उत्पाद केवल बाह्य सौंदर्य उपयोग हेतु प्रदान किए जाते हैं और किसी चिकित्सीय उपचार या चर्म-रोग नुस्खे का विकल्प नहीं हैं।',
      points: [
        'पूर्ण उपयोग से पूर्व स्वच्छ त्वचा पर 24 घंटे का पैच परीक्षण करें, विशेषकर सक्रिय वानस्पतिक अर्क, अम्ल अथवा आवश्यक तेल युक्त उत्पादों के लिए।',
        'जलन, चकत्ते या एलर्जी प्रतिक्रिया होने पर उपयोग तुरंत बंद करें और योग्य चिकित्सक से परामर्श लें।',
        'स्वच्छता सील टूटने, पैकेज खुलने या उपयोग किए जाने के बाद सौंदर्य व स्वच्छता उत्पाद वापसी योग्य नहीं हैं।',
      ],
    },
    ar: {
      title: 'إرشادات مستحضرات التجميل والعناية الشخصية الموضعية',
      summary:
        'تُعرض هذه التركيبات للاستخدام التجميلي الخارجي حصراً، ولا تُعد علاجاً طبياً أو وصفة جلدية معتمدة.',
      points: [
        'يُرجى إجراء اختبار حساسية لمدة 24 ساعة على بشرة نظيفة قبل الاستخدام الكامل، خاصة للمستخلصات النباتية النشطة أو الأحماض أو الزيوت العطرية.',
        'توقّف عن الاستخدام فوراً واستشر طبيباً مختصاً عند حدوث تهيّج أو طفح جلدي أو رد فعل تحسسي.',
        'منتجات التجميل والعناية الشخصية التي تم فتحها أو كسر ختمها الصحي غير مؤهلة للإرجاع.',
      ],
    },
    es: {
      title: 'Aviso sobre Cosméticos, Uso Tópico y Cuidado Personal',
      summary:
        'Las formulaciones se ofrecen exclusivamente para uso cosmético externo y no constituyen tratamiento médico ni prescripción dermatológica.',
      points: [
        'Realice una prueba de parche de 24 horas sobre piel limpia antes de la aplicación completa, especialmente con extractos botánicos activos, ácidos o aceites esenciales.',
        'Suspenda su uso de inmediato y consulte a un médico cualificado si presenta irritación, sarpullido o reacción alérgica.',
        'Los artículos de belleza e higiene abiertos o con precinto sanitario roto no son elegibles para devolución.',
      ],
    },
    fr: {
      title: 'Avis Cosmétique, Application Topique et Soins Personnels',
      summary:
        'Les formulations sont proposées strictement pour un usage cosmétique externe et ne constituent ni un traitement médical ni une prescription dermatologique.',
      points: [
        'Effectuez un test cutané préalable de 24 heures sur peau propre avant toute application complète, notamment pour les actifs botaniques, acides ou huiles essentielles.',
        'Cessez immédiatement l’utilisation et consultez un médecin qualifié en cas d’irritation, d’éruption cutanée ou de réaction allergique.',
        'Les articles de beauté et d’hygiène ouverts ou descellés ne sont pas éligibles au retour une fois le sceau sanitaire brisé.',
      ],
    },
  },
  'grocery-food-household': {
    en: {
      title: 'Food, Beverage, Allergen & Perishable Handling Notice',
      summary:
        'Specialty pantry goods, coffee beans, and teas may be processed in facilities handling tree nuts, dairy, gluten, soy, or sesame.',
      points: [
        'Verify allergen declarations, BSTI/food-safety markings where applicable, best-before dates, and storage directions immediately upon parcel arrival.',
        'Kinto Studio makes no therapeutic, medicinal, or disease-prevention claims regarding specialty grocery products.',
        'Report damaged, spoiled, or tampered seals promptly with photographic evidence.',
      ],
    },
    bn: {
      title: 'খাদ্য, পানীয়, অ্যালার্জেন ও পচনশীল পণ্য সংরক্ষণ বিজ্ঞপ্তি',
      summary:
        'বিশেষায়িত প্যান্ট্রি সামগ্রী, কফি বিন এবং চা এমন কারখানায় প্রক্রিয়াজাত হতে পারে যেখানে বাদাম, দুগ্ধজাত উপাদান, গ্লুটেন, সয়া বা তিল প্রক্রিয়াকরণ করা হয়।',
      points: [
        'পার্সেল প্রাপ্তির সঙ্গে সঙ্গে অ্যালার্জেন ঘোষণা, প্রযোজ্য ক্ষেত্রে বিএসটিআই/খাদ্য নিরাপত্তা চিহ্ন, মেয়াদোত্তীর্ণের তারিখ এবং সংরক্ষণ নির্দেশিকা যাচাই করুন।',
        'বিশেষায়িত মুদি পণ্যের ক্ষেত্রে কিন্টো স্টুডিও কোনো রোগ নিরাময় বা ঔষধি গুণাগুণের দাবি করে না।',
        'ক্ষতিগ্রস্ত, নষ্ট বা সিল ভাঙা পণ্য প্রাপ্ত হলে আলোকচিত্র প্রমাণসহ দ্রুত অবহিত করুন।',
      ],
    },
    hi: {
      title: 'खाद्य, पेय, एलर्जन एवं शीघ्र-नष्ट होने योग्य सामग्री सूचना',
      summary:
        'विशिष्ट पैंट्री उत्पाद, कॉफ़ी बीन्स और चाय ऐसे संयंत्रों में प्रसंस्कृत हो सकते हैं जहाँ मेवे, डेयरी, ग्लूटेन, सोया या तिल का उपयोग होता है।',
      points: [
        'पार्सल प्राप्त होते ही एलर्जन विवरण, लागू खाद्य-सुरक्षा मानक चिह्न, उपभोग अवधि तथा भंडारण निर्देश की जांच करें।',
        'Kinto Studio विशिष्ट किराना उत्पादों के संबंध में किसी भी चिकित्सीय या रोग-निवारक प्रभाव का दावा नहीं करता है।',
        'क्षतिग्रस्त, खराब या छेड़छाड़ की गई सील की सूचना फ़ोटो साक्ष्य के साथ शीघ्र दर्ज कराएं।',
      ],
    },
    ar: {
      title: 'إشعار الأغذية والمشروبات ومسببات الحساسية والسلع القابلة للتلف',
      summary:
        'قد تُعالج المنتجات الغذائية المتخصصة وحبوب القهوة والشاي في منشآت تتعامل مع المكسرات والألبان والغلوتين والصويا أو السمسم.',
      points: [
        'تحقق فور استلام الطرد من بيانات مسببات الحساسية وعلامات السلامة الغذائية المعتمدة وتواريخ الصلاحية وإرشادات التخزين.',
        'لا تقدم Kinto Studio أي ادعاءات علاجية أو طبية أو وقائية من الأمراض بشأن منتجات البقالة المتخصصة.',
        'أبلغ فوراً عن أي تلف أو فساد أو عبث بالأختام مرفقاً بأدلة مصورة.',
      ],
    },
    es: {
      title: 'Aviso sobre Alimentos, Bebidas, Alérgenos y Perecederos',
      summary:
        'Los productos de despensa, granos de café y tés pueden procesarse en instalaciones que manipulan frutos secos, lácteos, gluten, soja o sésamo.',
      points: [
        'Verifique declaraciones de alérgenos, sellos sanitarios aplicables, fechas de consumo preferente e instrucciones de conservación al recibir el paquete.',
        'Kinto Studio no formula declaraciones terapéuticas, medicinales ni de prevención de enfermedades sobre productos alimentarios.',
        'Reporte de inmediato precintos alterados, productos dañados o en mal estado con evidencia fotográfica.',
      ],
    },
    fr: {
      title: 'Avis Denrées Alimentaires, Allergènes et Produits Périssables',
      summary:
        'Les produits d’épicerie fine, grains de café et thés peuvent être conditionnés dans des ateliers manipulant fruits à coque, lait, gluten, soja ou sésame.',
      points: [
        'Vérifiez dès réception les mentions d’allergènes, marquages de sécurité alimentaire applicables, dates limites et consignes de conservation.',
        'Kinto Studio ne formule aucune allégation thérapeutique, médicinale ou préventive concernant les produits alimentaires.',
        'Signalez sans délai tout sceau altéré, avarie ou détérioration avec justificatifs photographiques.',
      ],
    },
  },
  'baby-kids-toys-hobbies': {
    en: {
      title: 'Child Safety, Age Grading & Supervision Warning',
      summary:
        'Toys, nursery pieces, and craft kits must only be used in accordance with manufacturer minimum age recommendations and adult supervision.',
      points: [
        'Choking Hazard: Products containing small detachable parts, marbles, cords, or craft fasteners are unsuitable for children under 3 years unless explicitly rated.',
        'Inspect wooden dowels, joints, finishes, and textile seams periodically for wear and remove any loose components.',
      ],
    },
    bn: {
      title: 'শিশু নিরাপত্তা, বয়সসীমা ও অভিভাবকীয় তত্ত্বাবধান সতর্কতা',
      summary:
        'খেলনা, নার্সারি সামগ্রী এবং ক্রাফট কিট শুধুমাত্র প্রস্তুতকারকের নির্ধারিত ন্যূনতম বয়সসীমা ও প্রাপ্তবয়স্কের তত্ত্বাবধানেই ব্যবহারযোগ্য।',
      points: [
        'শ্বাসরোধের ঝুঁকি: ক্ষুদ্র বিচ্ছিন্নযোগ্য অংশ, মার্বেল, দড়ি বা কারুশিল্পের ক্লিপযুক্ত পণ্য স্পষ্টভাবে অনুমোদিত না হলে ৩ বছরের কম বয়সী শিশুদের জন্য অনুপযুক্ত।',
        'কাঠের ডোয়েল, সংযোগস্থল, ফিনিশ এবং কাপড়ের সেলাই নিয়মিত পরীক্ষা করুন এবং কোনো আলগা অংশ থাকলে অপসারণ করুন।',
      ],
    },
    hi: {
      title: 'बाल सुरक्षा, आयु वर्ग एवं पर्यवेक्षण चेतावनी',
      summary:
        'खिलौने, नर्सरी सामग्री और शिल्प किट का उपयोग केवल निर्माता द्वारा निर्धारित न्यूनतम आयु अनुशंसा एवं वयस्क पर्यवेक्षण में ही किया जाना चाहिए।',
      points: [
        'दम घुटने का खतरा: छोटे अलग होने वाले भागों, कांच की गोलियों, डोरियों या फास्टनर वाले उत्पाद स्पष्ट प्रमाणन के बिना 3 वर्ष से कम आयु के बच्चों के लिए उपयुक्त नहीं हैं।',
        'लकड़ी के जोड़, सतह की फिनिश तथा कपड़े की सिलाई की नियमित जांच करें और किसी भी ढीले हिस्से को तुरंत हटा दें।',
      ],
    },
    ar: {
      title: 'تحذير سلامة الأطفال والفئة العمرية والإشراف',
      summary:
        'يجب استخدام الألعاب ومستلزمات الأطفال وأدوات الحرف حصراً وفق الحد الأدنى للعمر الموصى به من المصنّع وتحت إشراف شخص بالغ.',
      points: [
        'خطر الاختناق: المنتجات التي تحتوي على أجزاء صغيرة قابلة للفصل أو خيوط أو مثبتات غير مناسبة للأطفال دون سن 3 سنوات ما لم يُنص صراحةً على ملاءمتها.',
        'افحص الوصلات الخشبية والطلاءات والدرزات القماشية بانتظام وأزل أي أجزاء مفكوكة فوراً.',
      ],
    },
    es: {
      title: 'Advertencia de Seguridad Infantil, Edad Mínima y Supervisión',
      summary:
        'Los juguetes, artículos infantiles y kits creativos deben utilizarse únicamente conforme a la edad mínima del fabricante y bajo supervisión adulta.',
      points: [
        'Riesgo de asfixia: Los artículos con piezas pequeñas desmontables, canicas, cordones o cierres no son aptos para menores de 3 años salvo indicación expresa.',
        'Inspeccione periódicamente ensamblajes de madera, acabados y costuras textiles, y retire cualquier componente suelto.',
      ],
    },
    fr: {
      title: 'Avertissement Sécurité Enfant, Âge Recommandé et Surveillance',
      summary:
        'Les jouets, articles de puériculture et kits créatifs doivent être utilisés conformément à l’âge minimal indiqué par le fabricant et sous surveillance d’un adulte.',
      points: [
        'Risque d’étouffement : Les produits contenant de petites pièces détachables, billes, cordons ou attaches ne conviennent pas aux enfants de moins de 3 ans sauf mention explicite.',
        'Inspectez régulièrement les assemblages en bois, finitions et coutures textiles et retirez tout élément desserré.',
      ],
    },
  },
  'electronics-tech': {
    en: {
      title: 'Electrical Rating, Voltage & Lithium Battery Notice',
      summary:
        'Verify mains voltage compatibility (220–240V / 50Hz in Bangladesh or multi-voltage rating) and surge protection prior to energizing audio or precision electronics.',
      points: [
        'Use only manufacturer-certified USB-PD or DC power adapters; unauthorized adapters may void partner hardware warranties.',
        'Items containing high-capacity lithium-ion batteries may be restricted from express air transit and routed via ground courier.',
      ],
    },
    bn: {
      title: 'বৈদ্যুতিক মান, ভোল্টেজ ও লিথিয়াম ব্যাটারি সংক্রান্ত বিজ্ঞপ্তি',
      summary:
        'অডিও বা সূক্ষ্ম ইলেকট্রনিক যন্ত্রপাতি সংযোগ করার পূর্বে বৈদ্যুতিক ভোল্টেজ সামঞ্জস্য (বাংলাদেশে ২২০–২৪০ ভোল্ট / ৫০ হার্জ অথবা মাল্টি-ভোল্টেজ রেটিং) ও সার্জ সুরক্ষা নিশ্চিত করুন।',
      points: [
        'শুধুমাত্র প্রস্তুতকারক-অনুমোদিত USB-PD বা DC পাওয়ার অ্যাডাপ্টার ব্যবহার করুন; অননুমোদিত অ্যাডাপ্টার ব্যবহারে হার্ডওয়্যার ওয়ারেন্টি বাতিল হতে পারে।',
        'উচ্চ-ক্ষমতাসম্পন্ন লিথিয়াম-আয়ন ব্যাটারিযুক্ত পণ্য দ্রুত বিমান পরিবহনে সীমাবদ্ধ হতে পারে এবং স্থলপথে কুরিয়ারের মাধ্যমে প্রেরিত হতে পারে।',
      ],
    },
    hi: {
      title: 'विद्युत रेटिंग, वोल्टेज एवं लिथियम बैटरी सूचना',
      summary:
        'ऑडियो अथवा संवेदनशील इलेक्ट्रॉनिक उपकरणों को विद्युत आपूर्ति से जोड़ने से पूर्व वोल्टेज अनुकूलता (बांग्लादेश में 220–240V / 50Hz या मल्टी-वोल्टेज) एवं सर्ज सुरक्षा सुनिश्चित करें।',
      points: [
        'केवल निर्माता द्वारा प्रमाणित USB-PD या DC पावर एडॉप्टर का ही उपयोग करें; अनधिकृत एडॉप्टर से हार्डवेयर वारंटी समाप्त हो सकती है।',
        'उच्च क्षमता वाली लिथियम-आयन बैटरी युक्त वस्तुएँ हवाई एक्सप्रेस परिवहन से प्रतिबंधित हो सकती हैं और स्थल कूरियर द्वारा भेजी जा सकती हैं।',
      ],
    },
    ar: {
      title: 'إشعار الجهد الكهربائي والقدرة وبطاريات الليثيوم',
      summary:
        'تحقق من توافق الجهد الكهربائي (220–240 فولت / 50 هرتز في بنغلاديش أو التوافق متعدد الفولتية) وحماية التيار قبل تشغيل الأجهزة الصوتية أو الإلكترونية الدقيقة.',
      points: [
        'استخدم حصراً محولات الطاقة المعتمدة من المصنّع (USB-PD أو DC)؛ فقد يؤدي استخدام محولات غير معتمدة إلى إبطال الضمان.',
        'قد تُقيد المنتجات المزودة ببطاريات ليثيوم أيون عالية السعة من الشحن الجوي السريع ويتم توجيهها عبر النقل البري.',
      ],
    },
    es: {
      title: 'Aviso sobre Tensión Eléctrica, Voltaje y Baterías de Litio',
      summary:
        'Verifique la compatibilidad eléctrica (220–240 V / 50 Hz en Bangladés o rango multivoltaje) y la protección contra sobretensiones antes de conectar equipos electrónicos.',
      points: [
        'Utilice únicamente adaptadores USB-PD o CC certificados por el fabricante; los cargadores no autorizados pueden anular la garantía.',
        'Los dispositivos con baterías de iones de litio de alta capacidad pueden estar restringidos en transporte aéreo urgente y enviarse por vía terrestre.',
      ],
    },
    fr: {
      title: 'Avis Tension Électrique, Normes et Batteries au Lithium',
      summary:
        'Vérifiez la compatibilité secteur (220–240 V / 50 Hz au Bangladesh ou multi-tension) et la protection contre les surtensions avant la mise sous tension des appareils électroniques.',
      points: [
        'Utilisez exclusivement des adaptateurs USB-PD ou CC certifiés par le fabricant ; tout adaptateur non agréé peut annuler la garantie matérielle.',
        'Les articles intégrant des batteries lithium-ion de forte capacité peuvent être exclus du fret aérien express et acheminés par voie terrestre.',
      ],
    },
  },
  'automotive-tools-industrial': {
    en: {
      title: 'Mechanical Skill, PPE & Assumption of Risk Notice',
      summary:
        'Power tools, torque instruments, and automotive accessories require proper personal protective equipment (eye, ear, hand protection) and mechanical competence.',
      points: [
        'Never exceed rated RPM, load limits, voltage, or torque specifications printed in the manufacturer manual.',
        'Improper installation or modified safety guards voids warranty coverage and creates injury risk.',
      ],
    },
    bn: {
      title: 'যান্ত্রিক দক্ষতা, ব্যক্তিগত সুরক্ষা সরঞ্জাম (PPE) ও ঝুঁকি অবহিতকরণ',
      summary:
        'পাওয়ার টুলস, টর্ক যন্ত্রপাতি এবং গাড়ির যন্ত্রাংশ পরিচালনার ক্ষেত্রে উপযুক্ত ব্যক্তিগত সুরক্ষা সরঞ্জাম (চোখ, কান ও হাতের সুরক্ষা) এবং কারিগরি দক্ষতা আবশ্যক।',
      points: [
        'প্রস্তুতকারকের নির্দেশিকায় উল্লিখিত অনুমোদিত RPM, ভারসীমা, ভোল্টেজ বা টর্ক সীমা কখনোই অতিক্রম করবেন না।',
        'ত্রুটিপূর্ণ সংস্থাপন বা নিরাপত্তা গার্ড পরিবর্তন করলে ওয়ারেন্টি বাতিল হয় এবং আঘাতের ঝুঁকি সৃষ্টি হয়।',
      ],
    },
    hi: {
      title: 'यांत्रिक कौशल, सुरक्षा उपकरण (PPE) एवं जोखिम सूचना',
      summary:
        'पावर टूल्स, टॉर्क उपकरण एवं ऑटोमोटिव सहायक सामग्री के संचालन हेतु उपयुक्त व्यक्तिगत सुरक्षा उपकरण (आंख, कान व हाथ की सुरक्षा) और तकनीकी दक्षता आवश्यक है।',
      points: [
        'निर्माता पुस्तिका में उल्लिखित निर्धारित RPM, भार सीमा, वोल्टेज अथवा टॉर्क सीमा से अधिक संचालन कदापि न करें।',
        'अनुचित स्थापना या सुरक्षा गार्ड में परिवर्तन करने से वारंटी शून्य हो जाती है और गंभीर चोट का जोखिम बढ़ता है।',
      ],
    },
    ar: {
      title: 'إشعار الكفاءة الميكانيكية ومعدات الوقاية الشخصية وتحمّل المخاطر',
      summary:
        'تتطلب الأدوات الكهربائية وأدوات العزم وملحقات السيارات استخدام معدات الوقاية الشخصية المناسبة (حماية العين والأذن واليد) والخبرة الفنية السليمة.',
      points: [
        'يُحظر تجاوز حدود السرعة الدورانية (RPM) أو الأحمال أو الجهد أو العزم المحددة في دليل المصنّع.',
        'يؤدي التركيب غير السليم أو تعديل حواجز السلامة إلى إلغاء تغطية الضمان والتعرض لمخاطر الإصابة.',
      ],
    },
    es: {
      title: 'Aviso sobre Destreza Mecánica, EPI y Asunción de Riesgos',
      summary:
        'Las herramientas eléctricas, instrumentos de torsión y accesorios automotrices requieren equipo de protección individual adecuado (ojos, oídos y manos) y competencia técnica.',
      points: [
        'Nunca exceda las especificaciones nominales de RPM, carga, voltaje o par impresas en el manual del fabricante.',
        'Una instalación inadecuada o la modificación de protecciones de seguridad anula la garantía y genera riesgo de lesión.',
      ],
    },
    fr: {
      title: 'Avis Compétence Mécanique, EPI et Prévention des Risques',
      summary:
        'Les outils électroportatifs, instruments dynamométriques et accessoires automobiles exigent le port d’équipements de protection individuelle (yeux, ouïe, mains) et une maîtrise technique.',
      points: [
        'Ne dépassez jamais les régimes (tr/min), capacités de charge, tensions ou couples nominaux précisés dans le manuel du fabricant.',
        'Toute installation incorrecte ou modification des carters de protection annule la garantie et expose à un risque de blessure.',
      ],
    },
  },
  'health-wellness-pets': {
    en: {
      title: 'Wellness, Supplement & Pet Care Disclaimer',
      summary:
        'Wellness devices, nutritional supplements, and pet supplies are not intended to diagnose, treat, cure, or prevent any human or veterinary medical condition.',
      points: [
        'Consult a licensed physician or veterinarian before introducing supplements, therapeutic accessories, or specialized pet formulations.',
        'Keep wellness capsules, essential oils, and pet remedies out of reach of children and unintended pets.',
      ],
    },
    bn: {
      title: 'স্বাস্থ্য সুরক্ষা, সম্পূরক খাদ্য ও পোষা প্রাণী পরিচর্যা সংক্রান্ত সতর্কবার্তা',
      summary:
        'ওয়েলনেস যন্ত্র, পুষ্টিকর সাপ্লিমেন্ট এবং পোষা প্রাণীর সামগ্রী কোনো মানবদেহ বা প্রাণীর রোগ নির্ণয়, চিকিৎসা, নিরাময় বা প্রতিরোধের উদ্দেশ্যে নির্মিত নয়।',
      points: [
        'যেকোনো সাপ্লিমেন্ট, থেরাপিউটিক সরঞ্জাম বা বিশেষায়িত পোষা প্রাণীর ফর্মুলা ব্যবহারের পূর্বে নিবন্ধিত চিকিৎসক বা পশুচিকিৎসকের পরামর্শ নিন।',
        'ওয়েলনেস ক্যাপসুল, এসেনশিয়াল অয়েল এবং পোষা প্রাণীর সামগ্রী শিশুদের ও অনাকাঙ্ক্ষিত প্রাণীর নাগালের বাইরে সংরক্ষণ করুন।',
      ],
    },
    hi: {
      title: 'स्वास्थ्य, पोषण अनुपूरक एवं पालतू देखभाल अस्वीकरण',
      summary:
        'वेलनेस उपकरण, पोषण अनुपूरक तथा पालतू देखभाल सामग्री किसी भी मानवीय या पशु-चिकित्सीय रोग के निदान, उपचार, निवारण या रोकथाम के लिए अभिप्रेत नहीं हैं।',
      points: [
        'किसी भी अनुपूरक, चिकित्सीय सहायक सामग्री या विशिष्ट पालतू उत्पाद का उपयोग आरंभ करने से पहले पंजीकृत चिकित्सक या पशु चिकित्सक से परामर्श लें।',
        'वेलनेस कैप्सूल, आवश्यक तेल और पालतू उत्पादों को बच्चों तथा अन्य पालतू पशुओं की पहुंच से दूर रखें।',
      ],
    },
    ar: {
      title: 'إخلاء مسؤولية العافية والمكملات الغذائية ورعاية الحيوانات الأليفة',
      summary:
        'لا تهدف أجهزة العافية والمكملات الغذائية ومستلزمات الحيوانات الأليفة إلى تشخيص أي حالة طبية بشرية أو بيطرية أو علاجها أو الشفاء منها أو الوقاية منها.',
      points: [
        'استشر طبيباً بشرياً أو طبيباً بيطرياً مرخصاً قبل البدء بالمكملات أو الملحقات العلاجية أو التركيبات البيطرية المتخصصة.',
        'احفظ كبسولات العافية والزيوت العطرية ومستحضرات الحيوانات الأليفة بعيداً عن متناول الأطفال والحيوانات غير المستهدفة.',
      ],
    },
    es: {
      title: 'Descargo de Responsabilidad sobre Bienestar, Suplementos y Mascotas',
      summary:
        'Los dispositivos de bienestar, suplementos nutricionales y suministros para mascotas no están destinados a diagnosticar, tratar, curar ni prevenir afecciones médicas humanas o veterinarias.',
      points: [
        'Consulte a un médico o veterinario autorizado antes de incorporar suplementos, accesorios terapéuticos o fórmulas específicas para mascotas.',
        'Mantenga cápsulas de bienestar, aceites esenciales y remedios veterinarios fuera del alcance de niños y otras mascotas.',
      ],
    },
    fr: {
      title: 'Clause de Non-Responsabilité Bien-être, Compléments et Animaux',
      summary:
        'Les appareils de bien-être, compléments nutritionnels et produits pour animaux ne sont pas destinés à diagnostiquer, traiter, guérir ou prévenir une quelconque pathologie humaine ou vétérinaire.',
      points: [
        'Consultez un médecin ou un vétérinaire agréé avant d’introduire des compléments alimentaires, accessoires thérapeutiques ou formules vétérinaires.',
        'Conservez gélules de bien-être, huiles essentielles et produits animaliers hors de portée des enfants et des autres animaux.',
      ],
    },
  },
  default: {
    en: {
      title: 'Marketplace Authenticity & Usage Disclosure',
      summary:
        'Operate and care for each item strictly according to the maker specification sheet and enclosed care instructions.',
      points: [
        'Third-party Seller Studio listings are fulfilled and warranted directly by the identified partner seller alongside non-waivable statutory consumer protections.',
        'Inspect parcels at delivery; report transit damage or wrong-item fulfillment within 48 hours of receipt.',
      ],
    },
    bn: {
      title: 'মার্কেটপ্লেস প্রকৃতপণ্য নিশ্চয়তা ও ব্যবহার সংক্রান্ত ঘোষণা',
      summary:
        'প্রতিটি পণ্য প্রস্তুতকারকের নির্দিষ্ট বিবরণী ও সংযুক্ত পরিচর্যা নির্দেশিকা অনুসারে পরিচালনা ও সংরক্ষণ করুন।',
      points: [
        'তৃতীয়-পক্ষ বিক্রেতা স্টুডিওর পণ্যসমূহ অপরিহার্য বিধিবদ্ধ ভোক্তা সুরক্ষার পাশাপাশি উল্লিখিত অংশীদার বিক্রেতা কর্তৃক সরাসরি সরবরাহ ও ওয়ারেন্টিপ্রাপ্ত।',
        'ডেলিভারির সময় পার্সেল পরীক্ষা করুন; পরিবহনজনিত ক্ষতি বা ভুল পণ্য প্রাপ্ত হলে গ্রহণের ৪৮ ঘণ্টার মধ্যে প্রতিবেদন দাখিল করুন।',
      ],
    },
    hi: {
      title: 'मार्केटप्लेस प्रामाणिकता एवं उपयोग प्रकटीकरण',
      summary:
        'प्रत्येक उत्पाद का संचालन व रखरखाव निर्माता की विनिर्देश पुस्तिका एवं संलग्न देखभाल निर्देशों के अनुरूप ही करें।',
      points: [
        'तृतीय-पक्ष विक्रेता स्टूडियो की सूचीबद्ध वस्तुओं की आपूर्ति व वारंटी अप्रतिहार्य वैधानिक उपभोक्ता अधिकारों के साथ चिह्नित भागीदार विक्रेता द्वारा दी जाती है।',
        'डिलीवरी के समय पार्सल की जांच करें; पारगमन क्षति या गलत वस्तु की सूचना प्राप्ति के 48 घंटों के भीतर दर्ज करें।',
      ],
    },
    ar: {
      title: 'إفصاح أصالة المنتجات وشروط الاستخدام في السوق',
      summary:
        'يُرجى تشغيل كل منتج والعناية به حصراً وفق ورقة المواصفات المعتمدة من الصانع وإرشادات العناية المرفقة.',
      points: [
        'يتم تنفيذ قوائم استوديوهات البائعين المستقلين وضمانها مباشرة من قِبل البائع الشريك المحدد، وذلك إلى جانب حقوق المستهلك القانونية غير القابلة للتنازل.',
        'افحص الطرد عند الاستلام وأبلغ عن أي ضرر أثناء النقل أو خطأ في الصنف خلال 48 ساعة من الاستلام.',
      ],
    },
    es: {
      title: 'Divulgación de Autenticidad y Uso en el Mercado',
      summary:
        'Opere y cuide cada artículo estrictamente conforme a la ficha técnica del fabricante y las instrucciones de conservación incluidas.',
      points: [
        'Los productos de Estudios Vendedores asociados son despachados y garantizados directamente por el vendedor identificado, sin perjuicio de los derechos legales irrenunciables del consumidor.',
        'Inspeccione los paquetes en el momento de la entrega y reporte daños de tránsito o envíos erróneos dentro de las 48 horas posteriores.',
      ],
    },
    fr: {
      title: 'Déclaration d’Authenticité et d’Usage sur la Place de Marché',
      summary:
        'Utilisez et entretenez chaque article strictement selon la fiche technique du fabricant et la notice d’entretien jointe.',
      points: [
        'Les offres des Studios Vendeurs tiers sont expédiées et garanties directement par le vendeur partenaire identifié, sans préjudice des garanties légales impératives.',
        'Inspectez vos colis à la livraison et signalez toute avarie de transport ou erreur d’article dans un délai de 48 heures.',
      ],
    },
  },
};

export function translateCookieInventoryItems(
  items: CookieInventoryItem[],
  lang: LanguageCode
): CookieInventoryItem[] {
  if (lang === 'en') return items;
  return items.map((item) => {
    const tr = COOKIE_TRANSLATIONS[item.key]?.[lang];
    if (!tr) return item;
    return {
      ...item,
      classification: tr.classification,
      provider: tr.provider,
      duration: tr.duration,
      purpose: tr.purpose,
    };
  });
}

export function getLocalizedDepartmentSafetyNotice(
  category: string | undefined,
  lang: LanguageCode = 'en'
): LocalizedDepartmentSafetyNotice {
  const key = category && DEPARTMENT_SAFETY_TRANSLATIONS[category] ? category : 'default';
  return (
    DEPARTMENT_SAFETY_TRANSLATIONS[key]?.[lang] ||
    DEPARTMENT_SAFETY_TRANSLATIONS.default[lang] ||
    DEPARTMENT_SAFETY_TRANSLATIONS.default.en
  );
}
