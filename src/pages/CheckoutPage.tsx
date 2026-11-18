import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Globe,
  Lock,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BANGLADESH_GEO_TREE, type BangladeshDivisionEntry } from '../../server/shared/marketplaceSchema';
import { useStore } from '../context/StoreContext';
import { buildPolicyAcceptance, getDepartmentSafetyNotice } from '../data/legalPolicies';
import {
  fetchShippingLocationsApi,
  initiatePaymentApi,
  quoteCheckoutApi,
  verifyPaymentApi,
} from '../services/api';
import type {
  CheckoutQuoteResponse,
  DeliveryMethodId,
  Order,
  PaymentMethodId,
  PaymentSession,
} from '../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../utils/format';
import { t } from '../utils/i18n';
import {
  getDirectionalSlideSign,
  slideFadeVariants,
  STUDIO_TRANSITION,
} from '../utils/motion';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { EmptyState, Modal, ResilientImage } from '../components/ui/Primitives';

const STEP_KEYS = [
  'stepCustomer',
  'stepShipping',
  'stepDelivery',
  'stepPayment',
  'stepReview',
  'stepConfirmation',
] as const;

const TOTAL_CHECKOUT_STEPS = STEP_KEYS.length;

const PAYMENT_CHANNEL_META: Array<{
  id: PaymentMethodId;
  group: 'mfs' | 'card' | 'other';
}> = [
  { id: 'bkash', group: 'mfs' },
  { id: 'nagad', group: 'mfs' },
  { id: 'rocket', group: 'mfs' },
  { id: 'visa', group: 'card' },
  { id: 'mastercard', group: 'card' },
  { id: 'sslcommerz', group: 'other' },
  { id: 'bank-transfer', group: 'other' },
  { id: 'cod', group: 'other' },
];

const BD_MOBILE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/[\s()-]/g, '');
}

function createIdempotencyKey(): string {
  return `ks-idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCardExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export const CheckoutPage: React.FC = () => {
  const {
    language,
    currency,
    currencyConfig,
    cart,
    cartSubtotal,
    cartDiscount,
    cartTax,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    profile,
    addresses,
    saveAddress,
    storePolicy,
    runProtectedAction,
    claimOrders,
    commitVerifiedOrder,
    showToast,
    navigate,
    openPolicyPreview,
    publishedPolicies,
    policyFactsPublic,
  } = useStore();

  const defaultAddr = useMemo(
    () =>
      profile.isAuthenticated
        ? addresses.find((a) => a.isDefault && a.country === 'Bangladesh') ||
          addresses.find((a) => a.isDefault) ||
          addresses[0]
        : undefined,
    [profile.isAuthenticated, addresses]
  );

  const [geoTree, setGeoTree] = useState<BangladeshDivisionEntry[]>(BANGLADESH_GEO_TREE);

  useEffect(() => {
    let active = true;
    fetchShippingLocationsApi()
      .then((res) => {
        if (active && Array.isArray(res.divisions) && res.divisions.length > 0) {
          setGeoTree(res.divisions);
        }
      })
      .catch(() => {
        // Fallback to static BANGLADESH_GEO_TREE
      });
    return () => {
      active = false;
    };
  }, []);

  const [step, setStep] = useState<number>(1);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Step 1: Customer Info
  const [email, setEmail] = useState(() => (profile.isAuthenticated ? profile.email : ''));
  const [fullName, setFullName] = useState(() =>
    profile.isAuthenticated ? profile.fullName : ''
  );
  const [phone, setPhone] = useState(() => (profile.isAuthenticated ? profile.phone : ''));

  // Step 2: 5-Level Hierarchical Address (Country -> Division -> District -> Upazila -> Area)
  const initialCountry = defaultAddr?.country || 'Bangladesh';
  const defaultDiv = geoTree[0];
  const defaultDist = defaultDiv.districts[0];
  const defaultUpa = defaultDist.upazilas[0];
  const defaultArea = defaultUpa.areas[0];

  const [country, setCountry] = useState(initialCountry);
  const [stateDiv, setStateDiv] = useState(
    initialCountry === 'Bangladesh' ? defaultAddr?.state || defaultDiv.name : defaultAddr?.state || ''
  );
  const [city, setCity] = useState(
    initialCountry === 'Bangladesh' ? defaultAddr?.city || defaultDist.name : defaultAddr?.city || ''
  );
  const [upazila, setUpazila] = useState(
    initialCountry === 'Bangladesh' ? defaultAddr?.upazila || defaultUpa.name : defaultAddr?.upazila || ''
  );
  const [area, setArea] = useState(
    initialCountry === 'Bangladesh' ? defaultAddr?.area || defaultArea.name : defaultAddr?.area || ''
  );
  const [streetAddress, setStreetAddress] = useState(() => defaultAddr?.streetAddress || '');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || defaultArea.postalCode);
  const [instructions, setInstructions] = useState('');

  // Step 3 & 4: Delivery & Payment
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('cod');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('');
  const [cardLast4, setCardLast4] = useState('4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [allowInternationalUsd, setAllowInternationalUsd] = useState(true);

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Server-authoritative Quote & Gateway Session State
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => createIdempotencyKey());
  const [initiatingPayment, setInitiatingPayment] = useState<boolean>(false);
  const [verifyingPayment, setVerifyingPayment] = useState<boolean>(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<{
    type: 'error' | 'cancelled';
    message: string;
    ref?: string;
  } | null>(null);
  const [acceptedCheckoutTerms, setAcceptedCheckoutTerms] = useState(false);
  const [checkoutConsentError, setCheckoutConsentError] = useState('');
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);

  const customerEditedRef = useRef(false);
  const addressEditedRef = useRef(false);
  const quoteSeqRef = useRef(0);
  const prevStepRef = useRef(step);
  const stepPillRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const stepDirection = step >= prevStepRef.current ? 1 : -1;
  useEffect(() => {
    prevStepRef.current = step;
    const activePill = stepPillRefs.current[step - 1];
    if (activePill && typeof activePill.scrollIntoView === 'function') {
      activePill.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [step]);

  useEffect(() => {
    if (!profile.isAuthenticated || customerEditedRef.current) return;
    if (profile.email && !email) setEmail(profile.email);
    if (profile.fullName && !fullName) setFullName(profile.fullName);
    if (profile.phone && !phone) setPhone(profile.phone);
  }, [profile.isAuthenticated, profile.email, profile.fullName, profile.phone, email, fullName, phone]);

  useEffect(() => {
    if (!defaultAddr || addressEditedRef.current || streetAddress.trim()) return;
    setCountry(defaultAddr.country);
    setStateDiv(defaultAddr.state);
    setCity(defaultAddr.city);
    setUpazila(defaultAddr.upazila || '');
    setArea(defaultAddr.area);
    setStreetAddress(defaultAddr.streetAddress);
    setPostalCode(defaultAddr.postalCode);
  }, [defaultAddr, streetAddress]);

  const isBangladesh = country === 'Bangladesh';

  // Hierarchical Location Selectors for Bangladesh
  const activeDivEntry = useMemo(
    () => geoTree.find((d) => d.name === stateDiv) || geoTree[0],
    [geoTree, stateDiv]
  );
  const activeDistEntry = useMemo(
    () => activeDivEntry.districts.find((d) => d.name === city) || activeDivEntry.districts[0],
    [activeDivEntry, city]
  );
  const activeUpaEntry = useMemo(
    () =>
      activeDistEntry.upazilas.find((u) => u.name === upazila) || activeDistEntry.upazilas[0],
    [activeDistEntry, upazila]
  );
  const areaOptions = activeUpaEntry.areas;

  const handleCountryChange = (nextCountry: string) => {
    addressEditedRef.current = true;
    setCountry(nextCountry);
    setPaymentBanner(null);
    if (nextCountry === 'Bangladesh') {
      const div = geoTree[0];
      const dist = div.districts[0];
      const upa = dist.upazilas[0];
      const ar = upa.areas[0];
      setStateDiv(div.name);
      setCity(dist.name);
      setUpazila(upa.name);
      setArea(ar.name);
      setPostalCode(ar.postalCode);
      setPaymentMethod('cod');
    } else {
      setStateDiv('');
      setCity('');
      setUpazila('');
      setArea('');
      setPostalCode('');
    }
  };

  const handleDivisionChange = (divName: string) => {
    addressEditedRef.current = true;
    const div = geoTree.find((d) => d.name === divName) || geoTree[0];
    const dist = div.districts[0];
    const upa = dist.upazilas[0];
    const ar = upa.areas[0];
    setStateDiv(div.name);
    setCity(dist.name);
    setUpazila(upa.name);
    setArea(ar.name);
    setPostalCode(ar.postalCode);
  };

  const handleDistrictChange = (distName: string) => {
    addressEditedRef.current = true;
    const dist =
      activeDivEntry.districts.find((d) => d.name === distName) || activeDivEntry.districts[0];
    const upa = dist.upazilas[0];
    const ar = upa.areas[0];
    setCity(dist.name);
    setUpazila(upa.name);
    setArea(ar.name);
    setPostalCode(ar.postalCode);
  };

  const handleUpazilaChange = (upaName: string) => {
    addressEditedRef.current = true;
    const upa =
      activeDistEntry.upazilas.find((u) => u.name === upaName) || activeDistEntry.upazilas[0];
    const ar = upa.areas[0];
    setUpazila(upa.name);
    setArea(ar.name);
    setPostalCode(ar.postalCode);
  };

  const handleAreaChange = (areaName: string) => {
    addressEditedRef.current = true;
    setArea(areaName);
    const matched = areaOptions.find((a) => a.name === areaName);
    if (matched) {
      setPostalCode(matched.postalCode);
    }
  };

  // Authoritative Server Quote Sync
  useEffect(() => {
    if (cart.length === 0 || step >= 6) return;
    let cancelled = false;
    const reqSeq = ++quoteSeqRef.current;
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError('');
      try {
        const res = await quoteCheckoutApi({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color,
            colorHex: item.colorHex,
            size: item.size,
          })),
          address: {
            country,
            state: stateDiv,
            city,
            upazila,
            area,
          },
          deliveryMethod,
          promoCode: appliedPromo?.code,
          requestedCurrency: currency,
          allowInternationalUsd,
        });
        if (!cancelled && reqSeq === quoteSeqRef.current) {
          setQuote(res);
          const selectedOpt = res.shippingQuote.options.find((o) => o.id === deliveryMethod);
          if (selectedOpt && !selectedOpt.available) {
            const fallbackOpt = res.shippingQuote.options.find((o) => o.available);
            if (fallbackOpt) setDeliveryMethod(fallbackOpt.id);
          }
        }
      } catch (err) {
        if (!cancelled && reqSeq === quoteSeqRef.current) {
          setQuote(null);
          setQuoteError(
            err instanceof Error ? err.message : t(language, 'unableResolveQuote')
          );
        }
      } finally {
        if (!cancelled && reqSeq === quoteSeqRef.current) {
          setQuoteLoading(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    cart,
    country,
    stateDiv,
    city,
    upazila,
    area,
    deliveryMethod,
    appliedPromo?.code,
    currency,
    allowInternationalUsd,
    language,
    step,
  ]);

  useEffect(() => {
    const allowed = quote?.allowedPaymentMethods;
    if (allowed && allowed.length > 0 && !allowed.includes(paymentMethod)) {
      setPaymentMethod(allowed[0]);
    }
  }, [quote?.allowedPaymentMethods, paymentMethod]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, placedOrder]);

  if (cart.length === 0 && step < 6) {
    return (
      <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title={t(language, 'checkoutEmptyTitle')}
            description={t(language, 'checkoutEmptyDesc')}
            actionLabel={t(language, 'browseProducts')}
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
        </div>
      </div>
    );
  }

  if (storePolicy.checkoutAuthRequired && !profile.isAuthenticated && step < 6) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-accent)]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-medium">
              {t(language, 'authCtxCheckoutTitle')}
            </h1>
            <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
              {t(language, 'authCtxCheckoutDesc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              onClick={() => void runProtectedAction('checkout:proceed', () => {})}
            >
              {t(language, 'signIn')} / {t(language, 'createAccount')}
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate({ name: 'cart' })}>
              {t(language, 'returnToBagBtn')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const persistCheckoutAddressIfRequested = () => {
    if (!saveAddressToAccount || !profile.isAuthenticated) return;
    const alreadyExists = addresses.some(
      (a) =>
        a.streetAddress.trim().toLowerCase() === streetAddress.trim().toLowerCase() &&
        a.postalCode.trim().toLowerCase() === postalCode.trim().toLowerCase()
    );
    if (alreadyExists) return;
    saveAddress({
      label: area.trim() || city.trim() || 'Delivery',
      fullName: fullName.trim() || profile.fullName || 'Customer',
      phone: phone.trim() || profile.phone,
      country: country.trim(),
      state: stateDiv.trim(),
      city: city.trim(),
      upazila: upazila.trim() || undefined,
      area: area.trim() || city.trim(),
      streetAddress: streetAddress.trim(),
      postalCode: postalCode.trim(),
      isDefault: addresses.length === 0,
    });
  };

  const shippingOptions = quote?.shippingQuote.options ?? [];
  const selectedDelivery =
    shippingOptions.find((d) => d.id === deliveryMethod) || shippingOptions[0] || null;
  const isRestrictedZone = Boolean(quote?.shippingQuote.restricted);
  const allowedPaymentIds = quote?.allowedPaymentMethods ?? [];
  const hasOperationalPayment =
    quote !== null &&
    allowedPaymentIds.length > 0 &&
    allowedPaymentIds.includes(paymentMethod);
  const summarySubtotalUsd = quote?.subtotalUsd ?? cartSubtotal;
  const summaryDiscountUsd = quote?.discountUsd ?? cartDiscount;
  const summaryTaxUsd = quote?.taxUsd ?? cartTax;
  const summaryShippingUsd = quote?.shippingUsd ?? selectedDelivery?.costUsd ?? 0;
  const summaryTotalUsd =
    quote?.totalUsd ??
    Math.max(
      0,
      Number(
        (summarySubtotalUsd - summaryDiscountUsd + summaryTaxUsd + summaryShippingUsd).toFixed(2)
      )
    );

  const isMfsMethod =
    paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket';
  const isCardMethod = paymentMethod === 'visa' || paymentMethod === 'mastercard';

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 1) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = t(language, 'errValidEmailReceipt');
      }
      if (!fullName.trim()) nextErrors.fullName = t(language, 'errNameRequired');
      const compactPhone = normalizePhoneDigits(phone);
      if (isBangladesh) {
        if (!BD_MOBILE_REGEX.test(compactPhone)) {
          nextErrors.phone = t(language, 'errBdMobileValid');
        }
      } else if (compactPhone.replace(/\D/g, '').length < 7) {
        nextErrors.phone = t(language, 'errContactPhoneValid');
      }
    }
    if (targetStep === 2) {
      if (!country.trim()) nextErrors.country = t(language, 'errCountryRequired');
      if (!stateDiv.trim()) nextErrors.stateDiv = t(language, 'errStateRequired');
      if (!city.trim()) nextErrors.city = t(language, 'errCityRequired');
      if (isBangladesh && !upazila.trim()) nextErrors.upazila = t(language, 'errUpazilaRequired');
      if (isBangladesh && !area.trim()) nextErrors.area = t(language, 'errAreaRequired');
      if (!streetAddress.trim()) nextErrors.streetAddress = t(language, 'errStreetRequired');
      if (!postalCode.trim()) nextErrors.postalCode = t(language, 'errPostalRequired');
    }
    if (targetStep === 3) {
      if (!selectedDelivery || !selectedDelivery.available) {
        nextErrors.delivery = t(language, 'errSelectCourier');
      }
    }
    if (targetStep === 4) {
      if (!hasOperationalPayment) {
        nextErrors.payment = t(language, 'errNoPaymentChannel');
      }
      if (isMfsMethod) {
        if (!BD_MOBILE_REGEX.test(normalizePhoneDigits(mobileWalletNumber))) {
          nextErrors.mobileWallet = t(language, 'errWalletDigits');
        }
      }
      if (isCardMethod) {
        if (!/^\d{4}$/.test(cardLast4.trim())) {
          nextErrors.cardLast4 = t(language, 'errCardLast4');
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
          nextErrors.cardExpiry = t(language, 'errCardExpiry');
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 2 && isRestrictedZone) {
      showToast(
        t(language, 'deliveryAreaRestrictedTitle'),
        quote?.shippingQuote.restrictionReason || t(language, 'selectServiceableArea'),
        'error'
      );
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(promoInput);
    setPromoFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setPromoInput('');
  };

  const handleInitiateCheckout = async () => {
    if (isRestrictedZone) {
      showToast(
        t(language, 'deliveryAreaRestrictedTitle'),
        t(language, 'selectServiceableArea'),
        'error'
      );
      return;
    }
    if (!hasOperationalPayment) {
      showToast(
        t(language, 'errNoPaymentChannel'),
        t(language, 'reviewDeliveryPayment'),
        'error'
      );
      return;
    }
    if (!acceptedCheckoutTerms) {
      const msg = t(language, 'errCheckoutConsent');
      setCheckoutConsentError(msg);
      showToast(t(language, 'agreementRequiredTitle'), msg, 'error');
      return;
    }
    setCheckoutConsentError('');
    setInitiatingPayment(true);
    setPaymentBanner(null);
    try {
      const res = await initiatePaymentApi({
        idempotencyKey,
        paymentMethod,
        customerName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        shippingAddress: {
          country: country.trim(),
          state: stateDiv.trim(),
          city: city.trim(),
          upazila: upazila.trim() || undefined,
          area: area.trim() || city.trim(),
          streetAddress: streetAddress.trim(),
          postalCode: postalCode.trim(),
          instructions: instructions.trim() || undefined,
        },
        deliveryMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          colorHex: item.colorHex,
          size: item.size,
          name: item.name,
          brand: item.brand,
          category: item.category,
          slug: item.slug,
        })),
        promoCode: appliedPromo?.code,
        requestedCurrency: currency,
        allowInternationalUsd,
        acceptedPolicies: (() => {
          const scopeIds = [
            'terms',
            'return-policy',
            'shipping-policy',
            'cancellation-policy',
            'payment-policy',
            'privacy-policy',
            'product-safety',
            'marketplace-terms',
            ...(isBangladesh ? [] : ['international-orders-policy']),
          ];
          const acceptedPolicyVersions: Record<string, string> = {};
          for (const pid of scopeIds) {
            const match = publishedPolicies.find((p) => p.id === pid || p.slug === pid);
            acceptedPolicyVersions[pid] = match?.currentVersion || '2026-11.1';
          }
          return buildPolicyAcceptance(scopeIds, {
            version: acceptedPolicyVersions.terms || '2026-11.1',
            acceptedPolicyVersions,
            marketingOptIn: false,
          });
        })(),
      });
      setQuote(res.quote);

      if (paymentMethod === 'cod') {
        const verified = await verifyPaymentApi({
          sessionId: res.session.id,
          outcome: 'cod_confirmed',
        });
        if (verified.order && verified.session.status === 'cod_pending') {
          persistCheckoutAddressIfRequested();
          commitVerifiedOrder(verified.order);
          setPaymentSession(null);
          setPlacedOrder(verified.order);
          setStep(6);
          showToast(
            t(language, 'orderConfirmedTitle'),
            `${t(language, 'orderNumberPrefix', { id: verified.order.id })} · ${t(language, 'cashOnDelivery')}`,
            'success'
          );
        } else {
          setIdempotencyKey(createIdempotencyKey());
          showToast(
            t(language, 'unableConfirmOrder'),
            verified.session.failureReason || t(language, 'pleaseTryAgain'),
            'error'
          );
        }
      } else {
        setPaymentSession(res.session);
      }
    } catch (err) {
      showToast(
        t(language, 'unablePlaceOrder'),
        err instanceof Error ? err.message : t(language, 'reviewDeliveryPayment'),
        'error'
      );
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleVerifyGateway = async (
    outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed'
  ) => {
    if (!paymentSession) return;
    setVerifyingPayment(true);
    try {
      const res = await verifyPaymentApi({
        sessionId: paymentSession.id,
        outcome,
        walletNumber: isMfsMethod ? mobileWalletNumber.trim() : undefined,
        cardLast4: isCardMethod ? cardLast4.trim() : undefined,
      });

      if (
        res.order &&
        (res.session.status === 'paid' || res.session.status === 'cod_pending')
      ) {
        persistCheckoutAddressIfRequested();
        commitVerifiedOrder(res.order);
        setPaymentSession(null);
        setPlacedOrder(res.order);
        setStep(6);
        showToast(
          res.session.status === 'cod_pending'
            ? t(language, 'orderConfirmedTitle')
            : t(language, 'paymentVerifiedTitle'),
          `${t(language, 'orderNumberPrefix', { id: res.order.id })} · ${t(language, 'refShortPrefix', { ref: res.session.transactionRef })}`,
          'success'
        );
      } else {
        setPaymentSession(null);
        setIdempotencyKey(createIdempotencyKey());
        const isCancelled = res.session.status === 'cancelled';
        setPaymentBanner({
          type: isCancelled ? 'cancelled' : 'error',
          message:
            res.session.failureReason ||
            (isCancelled
              ? t(language, 'paymentCancelledBeforeBanner')
              : t(language, 'paymentDeclinedBanner')),
          ref: res.session.transactionRef,
        });
        showToast(
          isCancelled ? t(language, 'paymentCancelledTitle') : t(language, 'paymentFailedTitle'),
          t(language, 'bagIntactRetry'),
          isCancelled ? 'info' : 'error'
        );
      }
    } catch (err) {
      setPaymentSession(null);
      setIdempotencyKey(createIdempotencyKey());
      showToast(
        t(language, 'verificationErrorTitle'),
        err instanceof Error ? err.message : t(language, 'gatewayVerificationFailed'),
        'error'
      );
    } finally {
      setVerifyingPayment(false);
    }
  };

  const activeStepClamped = Math.min(Math.max(step, 1), TOTAL_CHECKOUT_STEPS);
  const progressPercent = Math.round((activeStepClamped / TOTAL_CHECKOUT_STEPS) * 100);
  const activeStepLabel = t(language, STEP_KEYS[activeStepClamped - 1]);

  const renderCheckoutHeaderAndStepper = () => (
    <div className="space-y-5 pb-5 border-b border-[var(--ks-border)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[var(--ks-text-muted)] uppercase tracking-[0.14em]">
            {t(language, 'checkoutFlowHeader')} ·{' '}
            {isBangladesh ? t(language, 'checkoutZoneBd') : t(language, 'checkoutZoneIntl')}
          </p>
          <h1 className="ks-heading-page mt-1">
            {t(language, 'completeYourOrder')}
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--ks-text-muted)] shrink-0">
          <Lock className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
          <span>{t(language, 'checkoutSubtitleLock')}</span>
        </div>
      </div>

      {/* Unified Progress Bar + 6-Step Horizontal Rail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-mono-num font-medium text-[var(--ks-text-secondary)]">
            {t(language, 'stepOf', {
              step: activeStepClamped,
              total: TOTAL_CHECKOUT_STEPS,
              label: activeStepLabel,
            })}
          </p>
          <span className="text-xs font-mono-num font-semibold text-[var(--ks-accent)] tabular-nums">
            {progressPercent}%
          </span>
        </div>

        {/* Continuous Animated Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={activeStepClamped}
          aria-valuemin={1}
          aria-valuemax={TOTAL_CHECKOUT_STEPS}
          aria-label={`${t(language, 'checkout')}: ${activeStepLabel}`}
          className="relative h-1.5 w-full rounded-full bg-[var(--ks-surface-muted)] overflow-hidden"
        >
          <motion.div
            initial={false}
            animate={{ scaleX: progressPercent / 100 }}
            transition={STUDIO_TRANSITION.base}
            className="h-full w-full origin-left rtl:origin-right rounded-full bg-[var(--ks-action)]"
          />
        </div>

        {/* 6-Step Horizontal Stepper Rail */}
        <nav aria-label={t(language, 'checkout')} className="overflow-x-auto no-scrollbar pt-0.5">
          <ol className="flex items-center gap-2 min-w-max">
            {STEP_KEYS.map((stepKey, idx) => {
              const label = t(language, stepKey);
              const num = idx + 1;
              const active = num === activeStepClamped;
              const completed = num < activeStepClamped;
              const canJumpBack = completed && activeStepClamped < 6;

              return (
                <li key={stepKey}>
                  <button
                    ref={(el) => {
                      stepPillRefs.current[idx] = el;
                    }}
                    type="button"
                    disabled={!canJumpBack && !active}
                    aria-current={active ? 'step' : undefined}
                    onClick={() => canJumpBack && setStep(num)}
                    className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)]'
                        : canJumpBack
                        ? 'bg-[var(--ks-surface)] text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] cursor-pointer'
                        : completed
                        ? 'bg-[var(--ks-surface)]/70 text-[var(--ks-text-secondary)]'
                        : 'text-[var(--ks-text-muted)]'
                    }`}
                  >
                    {completed && (
                      <Check className="w-3.5 h-3.5 text-[var(--ks-success)] shrink-0" aria-hidden="true" />
                    )}
                    <span className="font-mono-num">{num}.</span>
                    <span>{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );

  if (step === 6 && placedOrder) {
    const snap = placedOrder.currencySnapshot;
    const settledDisplay = snap
      ? formatDirectCurrency(snap.chargedTotal, snap.transactionCurrency)
      : formatCurrency(placedOrder.total, currency);

    return (
      <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
        {renderCheckoutHeaderAndStepper()}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STUDIO_TRANSITION.base}
          className="max-w-3xl mx-auto"
        >
          <div className="p-6 sm:p-10 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] text-center space-y-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--ks-success)]/12 text-[var(--ks-success)] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-text-muted)] font-mono-num">
                {t(language, 'orderNumberPrefix', { id: placedOrder.id })} ·{' '}
                {placedOrder.paymentStatus === 'cod_pending'
                  ? t(language, 'codConfirmedTag')
                  : t(language, 'paymentVerifiedTitle')}
              </p>
              <h2 className="ks-heading-page">
                {t(language, 'thankYouCustomer', {
                  name: placedOrder.customerName.split(' ')[0],
                })}
              </h2>
              <p className="text-sm sm:text-base text-[var(--ks-text-secondary)] max-w-md mx-auto">
                {t(language, 'orderReceiptSavedDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-start p-5 rounded-md bg-[var(--ks-bg)]/70 text-xs">
              <div className="min-w-0">
                <p className="text-[var(--ks-text-muted)] leading-snug">
                  {t(language, 'deliveryEstimateLabel')}
                </p>
                <p className="font-medium mt-1 text-sm leading-snug">{placedOrder.estimatedArrival}</p>
                <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                  {placedOrder.courierName}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[var(--ks-text-muted)] leading-snug">
                  {t(language, 'paymentRefLabel')}
                </p>
                <p className="font-medium mt-1 text-sm leading-snug">{placedOrder.paymentLabel}</p>
                <p className="text-xs font-mono-num text-[var(--ks-accent)] mt-0.5 leading-snug break-all">
                  {placedOrder.transactionRef || placedOrder.paymentStatus}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[var(--ks-text-muted)] leading-snug">
                  {t(language, 'orderTotal')}
                </p>
                <p className="font-mono-num font-semibold mt-1 text-sm leading-snug tabular-nums">
                  {settledDisplay}
                </p>
                {snap && snap.transactionCurrency !== 'USD' && (
                  <p className="text-xs font-mono-num text-[var(--ks-text-muted)] mt-0.5 leading-snug tabular-nums">
                    ${snap.baseTotalUsd.toFixed(2)} USD · 1 USD = ৳{snap.exchangeRate}
                  </p>
                )}
              </div>
            </div>

            <div className="text-start space-y-3 pt-1">
              <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                {t(language, 'itemizedReceiptLabel')}
              </p>
              <ul className="divide-y divide-[var(--ks-border)] border-y border-[var(--ks-border)]">
                {placedOrder.items.map((item) => (
                  <li key={item.key} className="py-3 flex items-baseline justify-between gap-4 text-sm">
                    <span className="min-w-0">
                      {item.name} × {item.quantity}{' '}
                      <span className="text-xs text-[var(--ks-text-muted)]">({item.color})</span>
                    </span>
                    <span className="font-mono-num font-medium shrink-0 text-end tabular-nums">
                      {snap
                        ? formatDirectCurrency(
                            snap.transactionCurrency === 'BDT'
                              ? item.price * item.quantity * snap.exchangeRate
                              : item.price * item.quantity,
                            snap.transactionCurrency
                          )
                        : formatCurrency(item.price * item.quantity, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {!profile.isAuthenticated && (
              <div className="p-4 rounded-md bg-[var(--ks-bg)]/70 text-start flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[var(--ks-text-primary)]">
                    {t(language, 'checkoutGuestClaimTitle')}
                  </h3>
                  <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                    {t(language, 'checkoutGuestClaimDesc', { orderId: placedOrder.id })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    void runProtectedAction(
                      'order:claim',
                      async () => {
                        await claimOrders([placedOrder.id]);
                      },
                      {
                        orderId: placedOrder.id,
                        itemName: `#${placedOrder.id}`,
                        preferredTab: 'register',
                        prefill: {
                          fullName: placedOrder.customerName,
                          email: placedOrder.email,
                          phone: placedOrder.phone,
                        },
                      }
                    );
                  }}
                >
                  {t(language, 'checkoutGuestClaimCta')}
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate({ name: 'track-order', orderId: placedOrder.id })}
              >
                {t(language, 'trackOrder')} #{placedOrder.id}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate({ name: 'shop', category: 'all' })}
              >
                {t(language, 'continueShopping')}
              </Button>
            </div>

            <div className="pt-4 border-t border-[var(--ks-border)] text-xs text-[var(--ks-text-muted)] flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>Order Policies:</span>
              {(
                [
                  { id: 'terms', label: 'Terms' },
                  { id: 'return-policy', label: 'Returns' },
                  { id: 'shipping-policy', label: 'Shipping' },
                  { id: 'cancellation-policy', label: 'Cancellation' },
                  { id: 'privacy-policy', label: 'Privacy' },
                ] as const
              ).map((pol) => {
                const snapVer =
                  placedOrder.policyAcceptance?.acceptedPolicyVersions?.[pol.id] ||
                  placedOrder.policyAcceptance?.version;
                return (
                  <button
                    key={pol.id}
                    type="button"
                    onClick={() =>
                      navigate({
                        name: pol.id,
                        policyVersion: snapVer,
                      })
                    }
                    className="underline text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                  >
                    {pol.label}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const operationalChannels = PAYMENT_CHANNEL_META.filter(({ id }) =>
    quote ? quote.allowedPaymentMethods.includes(id) : true
  );
  const unconfiguredChannels = PAYMENT_CHANNEL_META.filter(({ id }) => {
    const avail = quote?.paymentMethodAvailability?.[id];
    return avail && !avail.enabled;
  });

  const selectedPaymentLabel =
    t(language, `payLabel_${paymentMethod}` as Parameters<typeof t>[1]) || paymentMethod;
  const activePaymentSuffix = isCardMethod && cardLast4.trim()
    ? ` (•••• ${cardLast4.trim()})`
    : isMfsMethod && mobileWalletNumber.trim().length >= 4
    ? ` (${mobileWalletNumber.trim().slice(-4)})`
    : '';

  const renderOrderSummaryCard = (listMaxHeightClass: string, isSidebar: boolean) => (
    <div
      className={`${
        isSidebar ? 'p-6' : 'p-5 sm:p-6'
      } rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-5`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-[clamp(1.375rem,1.15rem+0.8vw,1.65rem)] font-medium">
          {t(language, 'inYourBagCount', { count: cart.length })}
        </h2>
        {quoteLoading && (
          <span className="text-xs font-mono-num text-[var(--ks-accent)]">
            {t(language, 'calculatingQuote')}
          </span>
        )}
      </div>

      {quoteError && <p className="text-xs text-[var(--ks-error)]">{quoteError}</p>}

      <ul className={`divide-y divide-[var(--ks-border)] ${listMaxHeightClass} overflow-y-auto`}>
        {cart.map((item) => (
          <li key={item.key} className="py-3 flex items-center gap-3">
            <ResilientImage
              src={item.image}
              alt={item.name}
              className="w-14 h-11 rounded-sm object-cover bg-[var(--ks-surface-muted)] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-[var(--ks-text-muted)]">
                {t(language, 'qtyShort', { count: item.quantity })} · {item.color}
              </p>
            </div>
            <span className="text-sm font-mono-num shrink-0 text-end tabular-nums">
              {formatCurrency(item.price * item.quantity, currency)}
            </span>
          </li>
        ))}
      </ul>

      <form
        onSubmit={handlePromoSubmit}
        className="space-y-2 pt-4 border-t border-[var(--ks-border)]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            aria-label={t(language, 'promoCode')}
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder={t(language, 'promoPlaceholder')}
            className="flex-1 min-w-0 min-h-[44px] px-3 text-base sm:text-xs rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] uppercase text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)]"
          />
          <Button type="submit" variant="outline" size="md">
            {t(language, 'apply')}
          </Button>
        </div>
        {promoFeedback && (
          <p
            className={`text-xs ${
              promoFeedback.ok ? 'text-[var(--ks-success)]' : 'text-[var(--ks-error)]'
            }`}
          >
            {promoFeedback.text}
          </p>
        )}
        {appliedPromo && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[var(--ks-surface-muted)] text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono-num font-medium">
                <Tag className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                {appliedPromo.code}
              </span>
              <button
                type="button"
                onClick={() => {
                  removePromoCode();
                  setPromoFeedback(null);
                }}
                aria-label={t(language, 'remove')}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded flex items-center justify-center text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {summarySubtotalUsd < appliedPromo.minSubtotal && (
              <p className="text-xs text-[var(--ks-warning)]" role="status">
                {t(language, 'promoMinNotMet', {
                  code: appliedPromo.code,
                  amount: formatCurrency(appliedPromo.minSubtotal, currency),
                })}
              </p>
            )}
          </div>
        )}
      </form>

      <div className="space-y-2 text-sm pt-4 border-t border-[var(--ks-border)]">
        <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
          <span className="min-w-0">{t(language, 'subtotal')}</span>
          <span className="font-mono-num shrink-0 text-end tabular-nums">
            {formatCurrency(summarySubtotalUsd, currency)}
          </span>
        </div>
        {summaryDiscountUsd > 0 && (
          <div className="flex items-baseline justify-between gap-4 text-[var(--ks-success)]">
            <span className="min-w-0">
              {t(language, 'discountCodeLabel', { code: appliedPromo?.code || '' })}
            </span>
            <span className="font-mono-num shrink-0 text-end tabular-nums">
              -{formatCurrency(summaryDiscountUsd, currency)}
            </span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
          <span className="min-w-0">{t(language, 'estimatedTax')}</span>
          <span className="font-mono-num shrink-0 text-end tabular-nums">
            {formatCurrency(summaryTaxUsd, currency)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
          <span className="min-w-0">
            {t(language, 'estimatedShipping')}{selectedDelivery ? ` (${selectedDelivery.title})` : ''}
          </span>
          <span className="font-mono-num shrink-0 text-end tabular-nums">
            {isRestrictedZone
              ? t(language, 'restrictedBadge')
              : !quote
              ? '...'
              : summaryShippingUsd === 0
              ? t(language, 'complimentary')
              : formatCurrency(summaryShippingUsd, currency)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-[var(--ks-border)] text-base font-semibold">
          <span className="min-w-0">{t(language, 'orderTotal')}</span>
          <span className="font-mono-num shrink-0 text-end tabular-nums">
            {formatCurrency(summaryTotalUsd, currency)}
          </span>
        </div>

        {quote && quote.currency !== currency && (
          <div className="flex items-baseline justify-between gap-4 text-xs font-mono-num text-[var(--ks-accent)] pt-1">
            <span className="min-w-0">{t(language, 'settlementLabel', { currency: quote.currency })}</span>
            <span className="shrink-0 text-end tabular-nums">
              {formatDirectCurrency(quote.totalCharged, quote.currency)}
            </span>
          </div>
        )}

        <p className="text-xs text-[var(--ks-text-muted)] pt-1 leading-snug">
          {t(language, 'fxRateLine', {
            rate: currencyConfig.rates.BDT.toFixed(2),
            zone: quote?.shippingQuote.zoneLabel || t(language, 'resolvingZone'),
          })}
        </p>
      </div>
    </div>
  );

  const primaryAmountLabel = quote
    ? formatDirectCurrency(quote.totalCharged, quote.currency)
    : formatCurrency(summaryTotalUsd, currency);

  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
      {renderCheckoutHeaderAndStepper()}

      {paymentBanner && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-[var(--ks-error)]/40 bg-[var(--ks-error)]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--ks-error)] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-[var(--ks-error)]">
                {paymentBanner.type === 'cancelled'
                  ? t(language, 'paymentCancelledBeforeBanner')
                  : t(language, 'paymentDeclinedBanner')}
              </p>
              <p className="text-[var(--ks-text-secondary)]">{paymentBanner.message}</p>
              {paymentBanner.ref && (
                <p className="font-mono-num text-xs text-[var(--ks-text-muted)]">
                  {t(language, 'gatewayRefLabel', { ref: paymentBanner.ref })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setPaymentBanner(null);
                setStep(4);
              }}
            >
              {t(language, 'switchChannelBtn')}
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleInitiateCheckout}
              disabled={initiatingPayment}
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t(language, 'retryBtn')}</span>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
        <div className="lg:col-span-7 p-5 sm:p-8 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-6">
          <AnimatePresence
            mode="wait"
            initial={false}
            custom={getDirectionalSlideSign(stepDirection, language === 'ar')}
          >
            <motion.div
              key={step}
              custom={getDirectionalSlideSign(stepDirection, language === 'ar')}
              variants={slideFadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display text-[clamp(1.4rem,1.15rem+0.9vw,1.75rem)] font-medium">{t(language, 'step1Title')}</h2>
                  <Input
                    label={t(language, 'emailLabel')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      customerEditedRef.current = true;
                      setEmail(e.target.value);
                    }}
                    error={errors.email}
                    helperText={t(language, 'emailHelperText')}
                    placeholder="name@example.com"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t(language, 'fullNameLabel')}
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(e) => {
                        customerEditedRef.current = true;
                        setFullName(e.target.value);
                      }}
                      error={errors.fullName}
                      placeholder={t(language, 'recipientNamePlaceholder')}
                    />
                    <Input
                      label={t(language, 'mobilePhoneLabel')}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        customerEditedRef.current = true;
                        setPhone(e.target.value);
                      }}
                      error={errors.phone}
                      placeholder={isBangladesh ? '+880 1711-000194' : '+1 555 0100'}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-[clamp(1.4rem,1.15rem+0.9vw,1.75rem)] font-medium">
                    {t(language, 'step2HierarchicalHeading')}
                  </h2>

                  {profile.isAuthenticated && addresses.length > 0 && (
                    <select
                      aria-label={t(language, 'fillFromSavedAddress')}
                      onChange={(e) => {
                        const found = addresses.find((a) => a.id === e.target.value);
                        if (found) {
                          addressEditedRef.current = true;
                          setCountry(found.country);
                          setStateDiv(found.state);
                          setCity(found.city);
                          setUpazila(found.upazila || '');
                          setArea(found.area);
                          setStreetAddress(found.streetAddress);
                          setPostalCode(found.postalCode);
                        }
                      }}
                      className="w-full min-h-[44px] px-3 text-base sm:text-xs rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] text-[var(--ks-text-primary)]"
                    >
                      <option value="">{t(language, 'loadSavedAddress')}</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} — {a.area || a.city} ({a.country})
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label={t(language, 'countryRegionField')}
                      required
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      options={[
                        { value: 'Bangladesh', label: t(language, 'bdSettlementOption') },
                        { value: 'United States', label: 'United States' },
                        { value: 'Canada', label: 'Canada' },
                        { value: 'United Kingdom', label: 'United Kingdom' },
                      ]}
                    />

                    {isBangladesh ? (
                      <Select
                        label={t(language, 'divisionField')}
                        required
                        value={activeDivEntry.name}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        options={geoTree.map((d) => ({ value: d.name, label: d.name }))}
                      />
                    ) : (
                      <Input
                        label={t(language, 'stateProvinceField')}
                        required
                        value={stateDiv}
                        onChange={(e) => setStateDiv(e.target.value)}
                        error={errors.stateDiv}
                        placeholder={t(language, 'stateProvincePlaceholder')}
                      />
                    )}
                  </div>

                  {isBangladesh ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select
                        label={t(language, 'districtField')}
                        required
                        value={activeDistEntry.name}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        options={activeDivEntry.districts.map((d) => ({
                          value: d.name,
                          label: d.name,
                        }))}
                      />
                      <Select
                        label={t(language, 'upazilaField')}
                        required
                        value={activeUpaEntry.name}
                        onChange={(e) => handleUpazilaChange(e.target.value)}
                        options={activeDistEntry.upazilas.map((u) => ({
                          value: u.name,
                          label: u.name,
                        }))}
                      />
                      <Select
                        label={t(language, 'deliveryAreaField')}
                        required
                        value={areaOptions.some((a) => a.name === area) ? area : areaOptions[0]?.name || ''}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        options={areaOptions.map((a) => ({
                          value: a.name,
                          label: a.restricted ? `${a.name} (${t(language, 'restrictedBadge')})` : a.name,
                        }))}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t(language, 'cityField')}
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={errors.city}
                        placeholder={t(language, 'cityField')}
                      />
                      <Input
                        label={t(language, 'neighborhoodAreaField')}
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder={t(language, 'neighborhoodPlaceholder')}
                      />
                    </div>
                  )}

                  {isRestrictedZone && (
                    <div
                      role="alert"
                      className="p-4 rounded-md border border-[var(--ks-error)]/40 bg-[var(--ks-error)]/8 flex items-start gap-3 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-[var(--ks-error)] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--ks-error)]">
                          {t(language, 'restrictedZoneDetected')}
                        </p>
                        <p className="text-[var(--ks-text-secondary)]">
                          {quote?.shippingQuote.restrictionReason ||
                            t(language, 'restrictedZoneDefaultDesc')}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isBangladesh && (
                    <div className="space-y-2 pt-1">
                      <label className="flex items-start gap-2.5 min-h-[40px] py-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowInternationalUsd}
                          onChange={(e) => setAllowInternationalUsd(e.target.checked)}
                          className="mt-[2px] w-4 h-4 shrink-0 accent-[var(--ks-action)]"
                        />
                        <span className="leading-snug">{t(language, 'quoteIntlUsdLabel')}</span>
                      </label>
                      <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                        Cross-border dispatches settle in USD and may incur destination customs duties.{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('international-orders-policy')}
                          className="underline font-medium text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          International &amp; Customs Policy
                        </button>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label={t(language, 'streetHouseRoadField')}
                        autoComplete="street-address"
                        required
                        value={streetAddress}
                        onChange={(e) => {
                          addressEditedRef.current = true;
                          setStreetAddress(e.target.value);
                        }}
                        error={errors.streetAddress}
                        placeholder={
                          isBangladesh
                            ? t(language, 'streetBdPlaceholder')
                            : t(language, 'streetIntlPlaceholder')
                        }
                      />
                    </div>
                    <Input
                      label={t(language, 'postalCodeField')}
                      autoComplete="postal-code"
                      required
                      value={postalCode}
                      onChange={(e) => {
                        addressEditedRef.current = true;
                        setPostalCode(e.target.value);
                      }}
                      error={errors.postalCode}
                      placeholder={isBangladesh ? '1213' : 'Postal / ZIP'}
                    />
                  </div>

                  <Textarea
                    label={t(language, 'deliveryInstructionsField')}
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder={t(language, 'deliveryInstructionsPlaceholder')}
                  />

                  {profile.isAuthenticated && (
                    <label className="flex items-center gap-2.5 min-h-[40px] py-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddressToAccount}
                        onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                        className="w-4 h-4 shrink-0 accent-[var(--ks-action)]"
                      />
                      <span className="leading-snug text-[var(--ks-text-secondary)]">
                        {t(language, 'checkoutSaveAddressToggle')}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-[clamp(1.4rem,1.15rem+0.9vw,1.75rem)] font-medium">{t(language, 'step3Title')}</h2>
                    {quote && (
                      <p className="text-xs font-mono-num text-[var(--ks-accent)]">
                        {t(language, 'zoneWeightSummary', {
                          zone: quote.shippingQuote.zoneLabel,
                          weight: quote.shippingQuote.totalWeightKg,
                        })}
                        {quote.shippingQuote.hasBulkyItems
                          ? ` · ${t(language, 'bulkyHandlingTag')}`
                          : ''}
                      </p>
                    )}
                  </div>

                  {shippingOptions.length === 0 ? (
                    <div className="p-6 rounded-lg border border-[var(--ks-border)] bg-[var(--ks-bg)] text-sm text-[var(--ks-text-secondary)]">
                      {quoteLoading
                        ? t(language, 'calculatingRoutes')
                        : t(language, 'unableResolveRoutes')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shippingOptions.map((opt) => {
                        const active = deliveryMethod === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-start justify-between gap-4 min-h-[64px] p-4 rounded-lg border transition-colors ${
                              !opt.available
                                ? 'opacity-55 cursor-not-allowed border-[var(--ks-border)] bg-[var(--ks-bg)]'
                                : active
                                ? 'cursor-pointer border-[var(--ks-action)] bg-[var(--ks-surface-muted)]'
                                : 'cursor-pointer border-[var(--ks-border)] hover:border-[var(--ks-border-strong)]'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <input
                                type="radio"
                                name="delivery-method"
                                disabled={!opt.available}
                                checked={active}
                                onChange={() => opt.available && setDeliveryMethod(opt.id)}
                                className="mt-[3px] shrink-0 accent-[var(--ks-action)]"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold leading-snug">{opt.title}</p>
                                <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                                  {t(language, 'courierPrefix', { name: opt.courier })}
                                </p>
                                <p className="text-xs font-medium text-[var(--ks-accent)] mt-1 leading-snug">
                                  {opt.available
                                    ? opt.eta
                                    : opt.reason || t(language, 'unavailableRoute')}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-mono-num font-semibold shrink-0 text-end tabular-nums">
                              {!opt.available
                                ? 'N/A'
                                : opt.costUsd === 0
                                ? t(language, 'complimentary')
                                : formatCurrency(opt.costUsd, currency)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {errors.delivery && <p className="text-xs text-[var(--ks-error)]">{errors.delivery}</p>}

                  <p className="pt-1 text-xs text-[var(--ks-text-muted)] leading-relaxed">
                    Free pre-dispatch cancellation ({policyFactsPublic.cancelPreDispatchCutoff.toLowerCase()}).{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('shipping-policy')}
                      className="underline text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      Shipping Policy
                    </button>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('cancellation-policy')}
                      className="underline text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      Cancellation Policy
                    </button>
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-[clamp(1.4rem,1.15rem+0.9vw,1.75rem)] font-medium">{t(language, 'step4Title')}</h2>
                    <p className="text-xs text-[var(--ks-text-secondary)] mt-1">
                      {t(language, 'paymentChannelsHintLive')}
                    </p>
                  </div>

                  {!quote?.shippingQuote.codEligible && quote?.shippingQuote.codReason && (
                    <div className="p-3 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] text-xs text-[var(--ks-warning)]">
                      {t(language, 'codNoticePrefix', { reason: quote.shippingQuote.codReason })}
                    </div>
                  )}

                  {quote && allowedPaymentIds.length === 0 ? (
                    <div
                      role="alert"
                      className="p-4 rounded-md border border-[var(--ks-error)]/40 bg-[var(--ks-error)]/8 text-xs space-y-1.5"
                    >
                      <p className="font-semibold text-[var(--ks-error)]">
                        {t(language, 'noGatewayConfigured')}
                      </p>
                      <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                        {isBangladesh
                          ? t(language, 'noGatewayBdDesc')
                          : t(language, 'noGatewayIntlDesc')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {operationalChannels.map(({ id, group }) => {
                        const label = t(language, `payLabel_${id}` as Parameters<typeof t>[1]);
                        const sub = t(language, `paySub_${id}` as Parameters<typeof t>[1]);
                        const Icon =
                          group === 'mfs'
                            ? Smartphone
                            : group === 'card'
                            ? CreditCard
                            : id === 'cod'
                            ? Truck
                            : id === 'bank-transfer'
                            ? Building2
                            : Globe;
                        const active = paymentMethod === id;
                        return (
                          <label
                            key={id}
                            className={`flex items-start justify-between gap-4 min-h-[56px] p-4 rounded-lg border transition-colors cursor-pointer ${
                              active
                                ? 'border-[var(--ks-action)] bg-[var(--ks-surface-muted)]'
                                : 'border-[var(--ks-border)] hover:border-[var(--ks-border-strong)]'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <input
                                type="radio"
                                name="payment-method"
                                checked={active}
                                onChange={() => {
                                  setPaymentMethod(id);
                                  setPaymentBanner(null);
                                  setErrors({});
                                }}
                                className="mt-[3px] shrink-0 accent-[var(--ks-action)]"
                              />
                              <Icon className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug">{label}</p>
                                <p className="text-xs text-[var(--ks-text-secondary)] leading-snug mt-0.5">
                                  {sub}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {isMfsMethod && hasOperationalPayment && (
                    <div className="p-4 rounded-md bg-[var(--ks-bg)]/70">
                      <Input
                        label={t(language, 'bdWalletNumberLabel')}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={mobileWalletNumber}
                        onChange={(e) => setMobileWalletNumber(e.target.value)}
                        error={errors.mobileWallet}
                        placeholder="017XXXXXXXX"
                        helperText={t(language, 'bdWalletHelper')}
                      />
                    </div>
                  )}

                  {isCardMethod && hasOperationalPayment && (
                    <div className="p-4 rounded-md bg-[var(--ks-bg)]/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t(language, 'cardEndingLabel')}
                        inputMode="numeric"
                        maxLength={4}
                        value={cardLast4}
                        onChange={(e) =>
                          setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        error={errors.cardLast4}
                        placeholder="4242"
                      />
                      <Input
                        label={t(language, 'cardExpiryLabel')}
                        inputMode="numeric"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatCardExpiryInput(e.target.value))}
                        error={errors.cardExpiry}
                        placeholder="08/28"
                      />
                    </div>
                  )}

                  {unconfiguredChannels.length > 0 && (
                    <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
                      {t(language, 'pendingMerchantCredsDesc', {
                        channels: unconfiguredChannels
                          .map((c) => t(language, `payLabel_${c.id}` as Parameters<typeof t>[1]))
                          .join(', '),
                      })}
                    </p>
                  )}

                  <p className="pt-1 text-xs text-[var(--ks-text-muted)] leading-relaxed">
                    Payments settle securely against verified order quotes.{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('payment-policy')}
                      className="underline text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      Payment &amp; Billing Policy
                    </button>
                  </p>

                  {errors.payment && (
                    <p className="text-xs text-[var(--ks-error)]">{errors.payment}</p>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="font-display text-[clamp(1.4rem,1.15rem+0.9vw,1.75rem)] font-medium">
                    {t(language, 'step5ReviewHeading')}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-md bg-[var(--ks-bg)]/70 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                        {t(language, 'shipToHeading')}
                      </p>
                      <p className="font-medium">{fullName}</p>
                      <p className="text-xs text-[var(--ks-text-secondary)]">{streetAddress}</p>
                      <p className="text-xs text-[var(--ks-text-secondary)]">
                        {[area, upazila, city, stateDiv, postalCode].filter(Boolean).join(', ')} ·{' '}
                        {country}
                      </p>
                      <p className="text-xs text-[var(--ks-text-secondary)]">{phone}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                        {t(language, 'deliveryGatewayChannelHeading')}
                      </p>
                      <p className="font-medium">
                        {selectedDelivery ? selectedDelivery.title : t(language, 'pendingZoneQuote')}
                      </p>
                      {selectedDelivery && (
                        <p className="text-xs text-[var(--ks-text-secondary)]">
                          {selectedDelivery.eta} · {selectedDelivery.courier}
                        </p>
                      )}
                      <p className="text-xs text-[var(--ks-accent)] pt-1 font-medium">
                        {selectedPaymentLabel}
                        {activePaymentSuffix}
                      </p>
                    </div>
                  </div>

                  <ul className="divide-y divide-[var(--ks-border)] border-y border-[var(--ks-border)]">
                    {cart.map((item) => (
                      <li key={item.key} className="py-3.5 flex items-center gap-4">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-12 rounded-sm object-cover bg-[var(--ks-surface-muted)] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-[var(--ks-text-secondary)]">
                            {item.color} · {item.size} · {t(language, 'qtyShort', { count: item.quantity })} ·{' '}
                            {((item.weightKg || 1) * item.quantity).toFixed(1)} kg
                          </p>
                        </div>
                        <span className="text-sm font-mono-num font-medium shrink-0 text-end tabular-nums">
                          {formatCurrency(item.price * item.quantity, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {quote && (
                    <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-[var(--ks-text-primary)]">
                        {t(language, 'authoritativeSettlement', { currency: quote.currency })}
                      </span>
                      <div className="text-end">
                        <span className="font-mono-num font-semibold text-[var(--ks-accent)] tabular-nums">
                          {formatDirectCurrency(quote.totalCharged, quote.currency)}
                        </span>
                        <p className="text-xs font-mono-num text-[var(--ks-text-muted)] tabular-nums">
                          1 USD = ৳{quote.currencySnapshot.exchangeRate}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[var(--ks-border)] space-y-2.5 text-xs text-[var(--ks-text-secondary)]">
                    <p className="font-medium text-[var(--ks-text-primary)]">
                      Order &amp; Buyer Protection Summary
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 leading-snug">
                      <li>
                        <span className="font-medium text-[var(--ks-text-primary)]">Returns:</span>{' '}
                        {policyFactsPublic.returnWindowDays}-day return ({policyFactsPublic.defectReportHours}h defect notice)
                      </li>
                      <li>
                        <span className="font-medium text-[var(--ks-text-primary)]">Cancellation:</span>{' '}
                        {policyFactsPublic.cancelPreDispatchCutoff}
                      </li>
                      <li>
                        <span className="font-medium text-[var(--ks-text-primary)]">Refunds:</span>{' '}
                        {policyFactsPublic.refundSlaBusinessDays}
                      </li>
                      <li>
                        <span className="font-medium text-[var(--ks-text-primary)]">Consumer Rights:</span>{' '}
                        Protected under Bangladesh Consumer Rights Act 2009
                      </li>
                    </ul>
                    {Array.from(new Set(cart.map((c) => c.category))).length > 0 && (
                      <div className="pt-1 text-xs text-[var(--ks-text-muted)] space-y-1">
                        {Array.from(new Set(cart.map((c) => c.category)))
                          .slice(0, 2)
                          .map((cat) => {
                            const notice = getDepartmentSafetyNotice(cat);
                            return (
                              <p key={cat}>
                                <span className="font-medium text-[var(--ks-text-secondary)]">
                                  {notice.title}:
                                </span>{' '}
                                {notice.summary}
                              </p>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Mandatory Clickwrap Agreement */}
                  <div
                    className={`space-y-2 pt-2 ${
                      checkoutConsentError
                        ? 'p-3.5 rounded-md bg-[var(--ks-error)]/6 border border-[var(--ks-error)]'
                        : ''
                    }`}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[var(--ks-text-secondary)] select-none">
                      <input
                        type="checkbox"
                        checked={acceptedCheckoutTerms}
                        onChange={(e) => {
                          setAcceptedCheckoutTerms(e.target.checked);
                          if (e.target.checked) setCheckoutConsentError('');
                        }}
                        aria-describedby={checkoutConsentError ? 'checkout-consent-err' : undefined}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--ks-action)] cursor-pointer"
                      />
                      <span>
                        {t(language, 'agePolicyConfirmPrefix')}{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('terms')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'termsConditions')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('return-policy')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'returnsRefunds')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('shipping-policy')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'shippingCustomsPolicy')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('cancellation-policy')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'cancellationPolicy')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('payment-policy')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'paymentPolicy')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('product-safety')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'productSafetyDisclaimers')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('marketplace-terms')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'marketplaceTerms')}
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('privacy-policy')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'privacyPolicy')}
                        </button>{' '}
                        {t(language, 'underBdLawCourts')}
                      </span>
                    </label>
                    {checkoutConsentError && (
                      <p id="checkout-consent-err" className="text-xs text-[var(--ks-error)] ps-6">
                        {checkoutConsentError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Step Navigation Controls: Primary CTA on top on mobile, right-aligned on desktop */}
          <div className="pt-4 border-t border-[var(--ks-border)] flex flex-col sm:flex-row-reverse sm:items-center sm:justify-between gap-3">
            {step < 5 ? (
              <Button
                variant="primary"
                size="lg"
                onClick={handleNext}
                className="w-full sm:w-auto"
                disabled={
                  (step === 2 && isRestrictedZone) ||
                  (step === 3 && (!selectedDelivery || !selectedDelivery.available || quoteLoading)) ||
                  (step === 4 && !hasOperationalPayment)
                }
              >
                <span>{t(language, 'continueBtn')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleInitiateCheckout}
                disabled={
                  initiatingPayment ||
                  isRestrictedZone ||
                  quoteLoading ||
                  !hasOperationalPayment
                }
                className="w-full sm:w-auto whitespace-normal text-center leading-snug"
              >
                <span>
                  {initiatingPayment
                    ? paymentMethod === 'cod'
                      ? t(language, 'confirmingOrder')
                      : t(language, 'startingGateway')
                    : paymentMethod === 'cod'
                    ? t(language, 'placeCodOrderBtn', { amount: primaryAmountLabel })
                    : t(language, 'proceedToGatewayBtn', { amount: primaryAmountLabel })}
                </span>
              </Button>
            )}

            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep((s) => s - 1)}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t(language, 'backBtn')}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigate({ name: 'cart' })}
                className="w-full sm:w-auto"
              >
                {t(language, 'returnToBagBtn')}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Inline Bag Summary Below Step Card */}
        <div className="lg:hidden">{renderOrderSummaryCard('max-h-64', false)}</div>

        {/* Sticky Desktop Bag Summary Sidebar */}
        <aside className="hidden lg:block lg:col-span-5 lg:sticky lg:top-28">
          {renderOrderSummaryCard('max-h-72', true)}
        </aside>
      </div>

      {/* Server-Side Gateway Verification Modal */}
      <Modal
        open={Boolean(paymentSession)}
        onClose={() => {
          if (!verifyingPayment) {
            handleVerifyGateway('cancelled');
          }
        }}
        title={paymentSession ? paymentSession.provider : t(language, 'gatewayVerificationTitle')}
        maxWidthClass="max-w-lg"
      >
        {paymentSession && (
          <div className="space-y-5 text-sm">
            <div className="pb-4 border-b border-[var(--ks-border)] space-y-2.5">
              <div className="flex items-baseline justify-between gap-4 text-xs text-[var(--ks-text-muted)]">
                <span className="min-w-0">{t(language, 'transactionRefLabel')}</span>
                <span className="font-mono-num font-medium text-[var(--ks-text-primary)] shrink-0 text-end">
                  {paymentSession.transactionRef}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-xs text-[var(--ks-text-muted)]">
                <span className="min-w-0">{t(language, 'settlementAmountLabel')}</span>
                <span className="font-mono-num text-base font-semibold text-[var(--ks-accent)] shrink-0 text-end tabular-nums">
                  {formatDirectCurrency(paymentSession.amount, paymentSession.currency)}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
              {paymentSession.gatewayInstructions}
            </p>

            <div className="space-y-2.5 pt-1">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={verifyingPayment}
                onClick={() => handleVerifyGateway('paid')}
              >
                {verifyingPayment
                  ? t(language, 'verifyingWithServer')
                  : t(language, 'authorizeVerifyBtn', {
                      amount: formatDirectCurrency(
                        paymentSession.amount,
                        paymentSession.currency
                      ),
                    })}
              </Button>

              <Button
                variant="outline"
                size="sm"
                fullWidth
                disabled={verifyingPayment}
                onClick={() => handleVerifyGateway('cancelled')}
              >
                {t(language, 'cancelPaymentBtn')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
