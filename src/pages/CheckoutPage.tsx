import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
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
import { STUDIO_TRANSITION } from '../utils/motion';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { EmptyState, Modal, ResilientImage } from '../components/ui/Primitives';

const STEPS = [
  'Customer',
  'Shipping',
  'Delivery',
  'Payment',
  'Review',
  'Confirmation',
] as const;

const PAYMENT_CHANNEL_META: Array<{
  id: PaymentMethodId;
  label: string;
  sub: string;
  group: 'mfs' | 'card' | 'other';
}> = [
  {
    id: 'bkash',
    label: 'bKash Mobile Wallet',
    sub: 'Instant tokenized checkout via bKash Merchant PGW',
    group: 'mfs',
  },
  {
    id: 'nagad',
    label: 'Nagad MFS Wallet',
    sub: 'Server-verified Nagad e-commerce gateway',
    group: 'mfs',
  },
  {
    id: 'rocket',
    label: 'Rocket (DBBL)',
    sub: 'Dutch-Bangla Bank Rocket mobile account settlement',
    group: 'mfs',
  },
  {
    id: 'visa',
    label: 'Visa Debit / Credit Card',
    sub: 'Local BDT & Global 3DS Secure authorization',
    group: 'card',
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    sub: 'Mastercard Identity Check 3DS verification',
    group: 'card',
  },
  {
    id: 'sslcommerz',
    label: 'SSLCommerz Unified Gateway',
    sub: 'Cards, NetBanking & local wallets in one portal',
    group: 'other',
  },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer (NPSB / BEFTN)',
    sub: 'Verified local interbank & wire settlement',
    group: 'other',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery (COD)',
    sub: 'Pay courier in cash upon parcel inspection in Bangladesh',
    group: 'other',
  },
];

function createIdempotencyKey(): string {
  return `ks-idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CheckoutPage: React.FC = () => {
  const {
    currency,
    currencyConfig,
    shippingConfig,
    cart,
    cartSubtotal,
    cartDiscount,
    cartTax,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    profile,
    addresses,
    commitVerifiedOrder,
    showToast,
    navigate,
    openPolicyPreview,
  } = useStore();

  const defaultAddr = useMemo(
    () =>
      addresses.find((a) => a.isDefault && a.country === 'Bangladesh') ||
      addresses.find((a) => a.isDefault) ||
      addresses[0],
    [addresses]
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
  const [email, setEmail] = useState(profile.email || '');
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');

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
  const [streetAddress, setStreetAddress] = useState(
    defaultAddr?.streetAddress || 'House 18, Road 7, Block F'
  );
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || defaultArea.postalCode);
  const [instructions, setInstructions] = useState('');

  // Step 3 & 4: Delivery & Payment
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('bkash');
  const [cardLast4Input, setCardLast4Input] = useState('4242');
  const [cardExpiryInput, setCardExpiryInput] = useState('08/29');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('01711-000194');
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
      if (!['bkash', 'nagad', 'rocket', 'visa', 'mastercard', 'cod', 'sslcommerz', 'bank-transfer'].includes(paymentMethod)) {
        setPaymentMethod('bkash');
      }
    } else {
      setStateDiv('');
      setCity('');
      setUpazila('');
      setArea('');
      setPostalCode('');
      if (['bkash', 'nagad', 'rocket', 'cod'].includes(paymentMethod)) {
        setPaymentMethod('visa');
      }
    }
  };

  const handleDivisionChange = (divName: string) => {
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
    const upa =
      activeDistEntry.upazilas.find((u) => u.name === upaName) || activeDistEntry.upazilas[0];
    const ar = upa.areas[0];
    setUpazila(upa.name);
    setArea(ar.name);
    setPostalCode(ar.postalCode);
  };

  const handleAreaChange = (areaName: string) => {
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
        if (!cancelled) {
          setQuote(res);
          // Auto-reconcile delivery method if zone does not support current choice
          const selectedOpt = res.shippingQuote.options.find((o) => o.id === deliveryMethod);
          if (selectedOpt && !selectedOpt.available) {
            const fallbackOpt = res.shippingQuote.options.find((o) => o.available);
            if (fallbackOpt) setDeliveryMethod(fallbackOpt.id);
          }
          // Auto-reconcile payment method if disabled (e.g., COD capped or non-BD)
          if (!res.allowedPaymentMethods.includes(paymentMethod)) {
            setPaymentMethod(res.allowedPaymentMethods[0] || 'visa');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setQuoteError(
            err instanceof Error ? err.message : 'Unable to fetch server shipping & tax quote.'
          );
        }
      } finally {
        if (!cancelled) {
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
    paymentMethod,
    step,
  ]);

  if (cart.length === 0 && step < 6) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="Your bag is empty"
            description="Add items from any of our 10 departments before checking out."
            actionLabel="Browse Catalog"
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
        </div>
      </div>
    );
  }

  const shippingOptions = quote?.shippingQuote.options || [
    {
      id: 'standard' as DeliveryMethodId,
      title: 'Standard Tracked Courier',
      eta: '24–48 Hours',
      courier: 'Steadfast & Pathao Studio Ground',
      costUsd: shippingConfig.zones[0]?.standardFeeUsd ?? 0.7,
      costDisplay: 0,
      available: true,
    },
  ];

  const selectedDelivery =
    shippingOptions.find((d) => d.id === deliveryMethod) || shippingOptions[0];
  const isRestrictedZone = Boolean(quote?.shippingQuote.restricted);
  const summarySubtotalUsd = quote?.subtotalUsd ?? cartSubtotal;
  const summaryDiscountUsd = quote?.discountUsd ?? cartDiscount;
  const summaryTaxUsd = quote?.taxUsd ?? cartTax;
  const summaryShippingUsd = quote?.shippingUsd ?? selectedDelivery.costUsd;
  const summaryTotalUsd =
    quote?.totalUsd ??
    Math.max(
      0,
      Number((summarySubtotalUsd - summaryDiscountUsd + summaryTaxUsd + summaryShippingUsd).toFixed(2))
    );

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 1) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextErrors.email = 'Enter a valid email address for order receipts.';
      }
      if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
        nextErrors.phone = 'Enter a valid contact phone number.';
      }
    }
    if (targetStep === 2) {
      if (!country.trim()) nextErrors.country = 'Country is required.';
      if (!stateDiv.trim()) nextErrors.stateDiv = 'Division / State is required.';
      if (!city.trim()) nextErrors.city = 'District / City is required.';
      if (isBangladesh && !upazila.trim()) nextErrors.upazila = 'City / Upazila is required.';
      if (isBangladesh && !area.trim()) nextErrors.area = 'Area is required.';
      if (!streetAddress.trim()) nextErrors.streetAddress = 'Street address is required.';
      if (!postalCode.trim()) nextErrors.postalCode = 'Postal code is required.';
    }
    if (targetStep === 4) {
      if (paymentMethod === 'visa' || paymentMethod === 'mastercard' || paymentMethod === 'card') {
        if (!/^\d{4}$/.test(cardLast4Input.trim())) {
          nextErrors.cardLast4 = 'Enter the 4 ending digits of your card.';
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiryInput.trim())) {
          nextErrors.cardExpiry = 'Enter expiration in MM/YY format.';
        }
      }
      if (
        (paymentMethod === 'bkash' ||
          paymentMethod === 'nagad' ||
          paymentMethod === 'rocket') &&
        mobileWalletNumber.replace(/\D/g, '').length < 10
      ) {
        nextErrors.mobileWallet = 'Enter a valid 11-digit Bangladesh mobile wallet number.';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 2 && isRestrictedZone) {
      showToast(
        'Delivery Area Restricted',
        quote?.shippingQuote.restrictionReason || 'Select a serviceable area to proceed.',
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
      showToast('Restricted delivery zone', 'Please choose a serviceable area first.', 'error');
      return;
    }
    if (!acceptedCheckoutTerms) {
      const msg =
        'Please confirm the Terms of Service, Returns Policy, Shipping Policy, and Product Safety Disclaimers before proceeding.';
      setCheckoutConsentError(msg);
      showToast('Agreement required', msg, 'error');
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
        acceptedPolicies: buildPolicyAcceptance([
          'terms',
          'return-policy',
          'shipping-policy',
          'privacy-policy',
          'product-safety',
        ]),
      });
      setQuote(res.quote);
      setPaymentSession(res.session);
    } catch (err) {
      showToast(
        'Unable to start payment session',
        err instanceof Error ? err.message : 'Please review delivery & payment selection.',
        'error'
      );
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleVerifyGateway = async (outcome: 'paid' | 'failed' | 'cancelled' | 'cod_confirmed') => {
    if (!paymentSession) return;
    setVerifyingPayment(true);
    try {
      const res = await verifyPaymentApi({
        sessionId: paymentSession.id,
        outcome,
        walletNumber:
          paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket'
            ? mobileWalletNumber.trim()
            : cardLast4Input.trim(),
      });

      if (
        res.order &&
        (res.session.status === 'paid' || res.session.status === 'cod_pending')
      ) {
        commitVerifiedOrder(res.order);
        setPaymentSession(null);
        setPlacedOrder(res.order);
        setStep(6);
        showToast(
          res.session.status === 'cod_pending' ? 'COD Order Confirmed' : 'Payment Verified',
          `Order #${res.order.id} · Ref ${res.session.transactionRef}`,
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
              ? 'Payment cancelled before gateway settlement.'
              : 'Payment gateway declined authorization. No order was placed.'),
          ref: res.session.transactionRef,
        });
        showToast(
          isCancelled ? 'Payment Cancelled' : 'Payment Failed',
          'Your bag remains intact — retry or pick another payment channel.',
          isCancelled ? 'info' : 'error'
        );
      }
    } catch (err) {
      showToast(
        'Verification error',
        err instanceof Error ? err.message : 'Gateway verification failed.',
        'error'
      );
    } finally {
      setVerifyingPayment(false);
    }
  };

  if (step === 6 && placedOrder) {
    const snap = placedOrder.currencySnapshot;
    const settledDisplay = snap
      ? formatDirectCurrency(snap.chargedTotal, snap.transactionCurrency)
      : formatCurrency(placedOrder.total, currency);

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STUDIO_TRANSITION.base}
        className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8"
      >
        <div className="p-8 sm:p-10 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#1F6E43]/10 dark:bg-[#4ADE80]/15 text-[#1F6E43] dark:text-[#4ADE80] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-[#84827B] font-mono-num">
              Order #{placedOrder.id} ·{' '}
              {placedOrder.paymentStatus === 'cod_pending' ? 'COD Docket Confirmed' : 'Payment Verified'}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-medium">
              Thank you, {placedOrder.customerName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] max-w-md mx-auto">
              Server-verified receipt &amp; immutable currency snapshot recorded. You can monitor dispatch live in Order Tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs">
            <div className="min-w-0">
              <p className="text-[#84827B] leading-snug">Delivery Estimate</p>
              <p className="font-medium mt-1 text-sm leading-snug">{placedOrder.estimatedArrival}</p>
              <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 leading-snug">
                {placedOrder.courierName}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[#84827B] leading-snug">Payment &amp; Gateway Ref</p>
              <p className="font-medium mt-1 text-sm leading-snug">{placedOrder.paymentLabel}</p>
              <p className="text-[11px] font-mono-num text-[#8F6438] dark:text-[#C89B67] mt-0.5 leading-snug break-all">
                {placedOrder.transactionRef || placedOrder.paymentStatus}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[#84827B] leading-snug">Settled Order Total</p>
              <p className="font-mono-num font-semibold mt-1 text-sm leading-snug">{settledDisplay}</p>
              {snap && (
                <p className="text-[11px] font-mono-num text-[#84827B] mt-0.5 leading-snug">
                  Base ${snap.baseTotalUsd.toFixed(2)} USD · 1 USD = {snap.exchangeRate} BDT
                </p>
              )}
            </div>
          </div>

          <div className="text-left space-y-3 pt-2">
            <p className="text-xs uppercase tracking-wider text-[#84827B]">Itemized Receipt</p>
            <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
              {placedOrder.items.map((item) => (
                <li key={item.key} className="py-3 flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0">
                    {item.name} × {item.quantity}{' '}
                    <span className="text-xs text-[#84827B]">({item.color})</span>
                  </span>
                  <span className="font-mono-num font-medium shrink-0 text-right">
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

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate({ name: 'track-order', orderId: placedOrder.id })}
            >
              Track Order #{placedOrder.id}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate({ name: 'shop', category: 'all' })}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <p className="text-xs text-[#84827B] uppercase tracking-wider">
            Server-Verified Checkout · {isBangladesh ? 'Bangladesh (BDT Settlement)' : 'International Dispatch'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium mt-1">Complete Your Order</h1>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
          <Lock className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
          <span>Authoritative Server Quote &amp; Gateway Verification</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="space-y-2">
        <p className="sm:hidden text-xs font-mono-num font-medium text-[#8F6438] dark:text-[#C89B67]">
          Step {step} of {STEPS.length} — {STEPS[step - 1]}
        </p>
        <nav aria-label="Checkout progress" className="overflow-x-auto pb-1">
          <ol className="flex items-center gap-2 sm:gap-3 min-w-max">
            {STEPS.map((label, idx) => {
              const num = idx + 1;
              const active = num === step;
              const completed = num < step;
              return (
                <li key={label} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={num > step}
                    onClick={() => num < step && setStep(num)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#171716] text-white dark:bg-[#F4F3EF] dark:text-[#171716]'
                        : completed
                        ? 'bg-[#F2F0EC] dark:bg-[#22221F] text-[#171716] dark:text-[#F4F3EF] cursor-pointer'
                        : 'text-[#84827B]'
                    }`}
                  >
                    <span className="font-mono-num">{num}.</span>
                    <span>{label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <span className="text-[#E5E3DD] dark:text-[#2C2C28]">—</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {paymentBanner && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-[#B91C1C]/40 dark:border-[#F87171]/40 bg-[#FEF2F2] dark:bg-[#2B1717] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] dark:text-[#F87171] shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-[#B91C1C] dark:text-[#F87171]">
                {paymentBanner.type === 'cancelled'
                  ? 'Payment Cancelled Before Settlement'
                  : 'Payment Gateway Declined Authorization'}
              </p>
              <p className="text-[#5C5B57] dark:text-[#D5D3CD]">{paymentBanner.message}</p>
              {paymentBanner.ref && (
                <p className="font-mono-num text-[11px] text-[#84827B]">
                  Gateway Ref: {paymentBanner.ref}
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
              Switch Channel
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleInitiateCheckout}
              disabled={initiatingPayment}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 p-5 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-6">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={STUDIO_TRANSITION.fast}
          >
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="font-display text-2xl font-medium">1. Customer Information</h2>
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                    helperText="Order confirmation and gateway receipt will be linked to this email."
                    placeholder="name@domain.com"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={errors.fullName}
                      placeholder="Nadia Rahman"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                      placeholder="+880 1711-000194"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-2xl font-medium">2. Hierarchical Shipping Address</h2>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                        Country → Division → District → City/Upazila → Area
                      </p>
                    </div>
                    {addresses.length > 0 && (
                      <select
                        aria-label="Fill from saved address"
                        onChange={(e) => {
                          const found = addresses.find((a) => a.id === e.target.value);
                          if (found) {
                            setCountry(found.country);
                            setStateDiv(found.state);
                            setCity(found.city);
                            setUpazila(found.upazila || '');
                            setArea(found.area);
                            setStreetAddress(found.streetAddress);
                            setPostalCode(found.postalCode);
                          }
                        }}
                        className="h-9 px-3 text-xs rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]"
                      >
                        <option value="">Load saved address...</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label} — {a.area || a.city} ({a.country})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="1. Country / Region"
                      required
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      options={[
                        { value: 'Bangladesh', label: 'Bangladesh (BDT Settlement)' },
                        { value: 'United States', label: 'United States' },
                        { value: 'Canada', label: 'Canada' },
                        { value: 'United Kingdom', label: 'United Kingdom' },
                      ]}
                    />

                    {isBangladesh ? (
                      <Select
                        label="2. Division"
                        required
                        value={activeDivEntry.name}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        options={geoTree.map((d) => ({ value: d.name, label: d.name }))}
                      />
                    ) : (
                      <Input
                        label="2. State / Province"
                        required
                        value={stateDiv}
                        onChange={(e) => setStateDiv(e.target.value)}
                        error={errors.stateDiv}
                        placeholder="California"
                      />
                    )}
                  </div>

                  {isBangladesh ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Select
                        label="3. District"
                        required
                        value={activeDistEntry.name}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        options={activeDivEntry.districts.map((d) => ({
                          value: d.name,
                          label: d.name,
                        }))}
                      />
                      <Select
                        label="4. City / Upazila"
                        required
                        value={activeUpaEntry.name}
                        onChange={(e) => handleUpazilaChange(e.target.value)}
                        options={activeDistEntry.upazilas.map((u) => ({
                          value: u.name,
                          label: u.name,
                        }))}
                      />
                      <Select
                        label="5. Delivery Area"
                        required
                        value={areaOptions.some((a) => a.name === area) ? area : areaOptions[0]?.name || ''}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        options={areaOptions.map((a) => ({
                          value: a.name,
                          label: a.restricted ? `${a.name} (Restricted)` : a.name,
                        }))}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="3. City"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={errors.city}
                        placeholder="San Francisco"
                      />
                      <Input
                        label="4. Neighborhood / Area"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Pacific Heights"
                      />
                    </div>
                  )}

                  {isRestrictedZone && (
                    <div
                      role="alert"
                      className="p-4 rounded-md border border-[#B91C1C]/40 dark:border-[#F87171]/40 bg-[#FEF2F2] dark:bg-[#2B1717] flex items-start gap-3 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#B91C1C] dark:text-[#F87171] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-[#B91C1C] dark:text-[#F87171]">
                          Restricted Delivery Zone Detected
                        </p>
                        <p className="text-[#5C5B57] dark:text-[#D5D3CD]">
                          {quote?.shippingQuote.restrictionReason ||
                            'Selected offshore / char area is currently restricted for parcel dispatch. Choose another City/Upazila or District to proceed.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isBangladesh && (
                    <label className="flex items-start gap-2.5 p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowInternationalUsd}
                        onChange={(e) => setAllowInternationalUsd(e.target.checked)}
                        className="mt-[2px] shrink-0 accent-[#171716] dark:accent-[#F4F3EF]"
                      />
                      <span className="leading-snug">
                        Settle international order in USD (uncheck to process at live BDT equivalent)
                      </span>
                    </label>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Street Address / House & Road"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        error={errors.streetAddress}
                        placeholder={
                          isBangladesh
                            ? 'House 18, Road 7, Block F'
                            : '2140 Steiner Street, Apt 4B'
                        }
                      />
                    </div>
                    <Input
                      label="Postal Code"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      error={errors.postalCode}
                      placeholder={isBangladesh ? '1213' : '94115'}
                    />
                  </div>

                  <Textarea
                    label="Delivery Instructions (Optional)"
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Gate security pass, elevator floor, or preferred call window..."
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-2xl font-medium">3. Delivery Method</h2>
                    {quote && (
                      <span className="text-xs font-mono-num text-[#8F6438] dark:text-[#C89B67]">
                        Zone: {quote.shippingQuote.zoneLabel} · {quote.shippingQuote.totalWeightKg} kg
                        {quote.shippingQuote.hasBulkyItems ? ' · Bulky Handling' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {shippingOptions.map((opt) => {
                      const active = deliveryMethod === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start justify-between gap-4 p-4 rounded-lg border transition-colors ${
                            !opt.available
                              ? 'opacity-55 cursor-not-allowed border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413]'
                              : active
                              ? 'cursor-pointer border-[#171716] dark:border-[#F4F3EF] bg-[#F9F8F6] dark:bg-[#22221F]'
                              : 'cursor-pointer border-[#E5E3DD] dark:border-[#2C2C28]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input
                              type="radio"
                              name="delivery-method"
                              disabled={!opt.available}
                              checked={active}
                              onChange={() => opt.available && setDeliveryMethod(opt.id)}
                              className="mt-[3px] shrink-0 accent-[#171716] dark:accent-[#F4F3EF]"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold leading-snug">{opt.title}</p>
                              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 leading-snug">
                                Courier: {opt.courier}
                              </p>
                              <p className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] mt-1 leading-snug">
                                {opt.available ? opt.eta : opt.reason || 'Unavailable for this route'}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-mono-num font-semibold shrink-0 text-right">
                            {!opt.available
                              ? 'N/A'
                              : opt.costUsd === 0
                              ? 'Complimentary'
                              : formatCurrency(opt.costUsd, currency)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-display text-2xl font-medium">4. Payment Method</h2>
                    <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-1">
                      Provider-based gateway checkout. Bangladesh deliveries settle in BDT (৳) with server-side idempotency and verification.
                    </p>
                  </div>

                  {!quote?.shippingQuote.codEligible && quote?.shippingQuote.codReason && (
                    <div className="p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs text-[#B45309] dark:text-[#FBBF24]">
                      COD Notice: {quote.shippingQuote.codReason}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {PAYMENT_CHANNEL_META.map(({ id, label, sub, group }) => {
                      const allowed = quote ? quote.allowedPaymentMethods.includes(id) : true;
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
                      return (
                        <label
                          key={id}
                          className={`flex items-start justify-between gap-4 p-3.5 rounded-lg border transition-colors ${
                            !allowed
                              ? 'opacity-50 cursor-not-allowed border-[#E5E3DD] dark:border-[#2C2C28]'
                              : paymentMethod === id
                              ? 'cursor-pointer border-[#171716] dark:border-[#F4F3EF] bg-[#F9F8F6] dark:bg-[#22221F]'
                              : 'cursor-pointer border-[#E5E3DD] dark:border-[#2C2C28]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <input
                              type="radio"
                              name="payment-method"
                              disabled={!allowed}
                              checked={paymentMethod === id}
                              onChange={() => {
                                if (!allowed) return;
                                setPaymentMethod(id);
                                setPaymentBanner(null);
                                setErrors({});
                              }}
                              className="mt-[3px] shrink-0 accent-[#171716] dark:accent-[#F4F3EF]"
                            />
                            <Icon className="w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium leading-snug">{label}</p>
                              <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-snug mt-0.5">
                                {allowed ? sub : 'Unavailable for selected region / order tier'}
                              </p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {(paymentMethod === 'visa' ||
                    paymentMethod === 'mastercard' ||
                    paymentMethod === 'card') && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Card Ending (4 digits)"
                        value={cardLast4Input}
                        maxLength={4}
                        onChange={(e) => setCardLast4Input(e.target.value.replace(/\D/g, ''))}
                        error={errors.cardLast4}
                      />
                      <Input
                        label="Expiration (MM/YY)"
                        value={cardExpiryInput}
                        placeholder="08/29"
                        onChange={(e) => setCardExpiryInput(e.target.value)}
                        error={errors.cardExpiry}
                      />
                    </div>
                  )}

                  {(paymentMethod === 'bkash' ||
                    paymentMethod === 'nagad' ||
                    paymentMethod === 'rocket') && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
                      <Input
                        label="Bangladesh Mobile Wallet Number"
                        value={mobileWalletNumber}
                        onChange={(e) => setMobileWalletNumber(e.target.value)}
                        error={errors.mobileWallet}
                        helperText="Tokenized via server payment session — no secret merchant keys on client."
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">5. Server-Verified Order Review</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[#84827B]">Ship To</p>
                      <p className="font-medium">{fullName}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{streetAddress}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        {[area, upazila, city, stateDiv, postalCode].filter(Boolean).join(', ')} ·{' '}
                        {country}
                      </p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{phone}</p>
                    </div>

                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[#84827B]">
                        Delivery &amp; Gateway Channel
                      </p>
                      <p className="font-medium">{selectedDelivery.title}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        {selectedDelivery.eta} · {selectedDelivery.courier}
                      </p>
                      <p className="text-xs text-[#8F6438] dark:text-[#C89B67] pt-1 font-medium">
                        {PAYMENT_CHANNEL_META.find((p) => p.id === paymentMethod)?.label ||
                          paymentMethod}
                      </p>
                    </div>
                  </div>

                  {quote && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3 font-medium">
                        <span className="inline-flex items-start gap-1.5 min-w-0 leading-snug">
                          <ShieldCheck className="w-3.5 h-3.5 mt-[2px] text-[#1F6E43] dark:text-[#4ADE80] shrink-0" />
                          <span>Authoritative Currency Settlement ({quote.currency})</span>
                        </span>
                        <span className="font-mono-num font-semibold shrink-0 text-right">
                          {formatDirectCurrency(quote.totalCharged, quote.currency)}
                        </span>
                      </div>
                      <p className="text-[#5C5B57] dark:text-[#A3A19B] font-mono-num leading-snug">
                        FX: 1 USD = ৳{quote.currencySnapshot.exchangeRate} ({quote.currencySnapshot.rateSource})
                      </p>
                    </div>
                  )}

                  <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
                    {cart.map((item) => (
                      <li key={item.key} className="py-3.5 flex items-center gap-4">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-12 rounded-sm object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                            {item.color} · {item.size} · Qty {item.quantity} ·{' '}
                            {((item.weightKg || 1) * item.quantity).toFixed(1)} kg
                          </p>
                        </div>
                        <span className="text-sm font-mono-num font-medium shrink-0 text-right">
                          {formatCurrency(item.price * item.quantity, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Department Safety Advisories for Cart Items */}
                  {Array.from(new Set(cart.map((c) => c.category))).length > 0 && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
                      <p className="text-xs font-semibold text-[#171716] dark:text-[#F4F3EF]">
                        Applicable Product Safety &amp; Import Disclosures
                      </p>
                      <ul className="space-y-1.5 text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-snug">
                        {Array.from(new Set(cart.map((c) => c.category)))
                          .slice(0, 3)
                          .map((cat) => {
                            const notice = getDepartmentSafetyNotice(cat);
                            return (
                              <li key={cat}>
                                <span className="font-medium text-[#171716] dark:text-[#F4F3EF]">
                                  {notice.title}:
                                </span>{' '}
                                {notice.summary}
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}

                  {/* Mandatory Clickwrap Agreement */}
                  <div
                    className={`p-4 rounded-md border space-y-2 ${
                      checkoutConsentError
                        ? 'bg-[#B91C1C]/5 border-[#B91C1C] dark:border-[#F87171]'
                        : 'bg-[#F9F8F6] dark:bg-[#141413] border-[#E5E3DD] dark:border-[#2C2C28]'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[#5C5B57] dark:text-[#A3A19B] select-none">
                      <input
                        type="checkbox"
                        checked={acceptedCheckoutTerms}
                        onChange={(e) => {
                          setAcceptedCheckoutTerms(e.target.checked);
                          if (e.target.checked) setCheckoutConsentError('');
                        }}
                        aria-describedby={checkoutConsentError ? 'checkout-consent-err' : undefined}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[#171716] dark:accent-[#F4F3EF] cursor-pointer"
                      />
                      <span>
                        I confirm I am 18+ and agree to Kinto Studio LLC&apos;s{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('terms')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Terms of Service
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('return-policy')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Returns &amp; Refunds
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('shipping-policy')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Shipping &amp; Customs Policy
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('product-safety')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Product Safety Disclaimers
                        </button>
                        , and{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('privacy-policy')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Privacy Policy
                        </button>{' '}
                        under Bangladesh law (Dhaka courts).
                      </span>
                    </label>
                    {checkoutConsentError && (
                      <p
                        id="checkout-consent-err"
                        className="text-xs text-[#B91C1C] dark:text-[#F87171] pl-6"
                      >
                        {checkoutConsentError}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </motion.div>

          {/* Step Navigation Controls */}
          <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            {step > 1 ? (
              <Button variant="outline" size="md" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            ) : (
              <Button variant="ghost" size="md" onClick={() => navigate({ name: 'cart' })}>
                Return to Bag
              </Button>
            )}

            {step < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                disabled={step === 2 && isRestrictedZone}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleInitiateCheckout}
                disabled={initiatingPayment || isRestrictedZone || quoteLoading}
              >
                <span>
                  {initiatingPayment
                    ? 'Initiating Gateway...'
                    : paymentMethod === 'cod'
                    ? `Verify COD Order · ${
                        quote
                          ? formatDirectCurrency(quote.totalCharged, quote.currency)
                          : formatCurrency(summaryTotalUsd, currency)
                      }`
                    : `Proceed to Gateway · ${
                        quote
                          ? formatDirectCurrency(quote.totalCharged, quote.currency)
                          : formatCurrency(summaryTotalUsd, currency)
                      }`}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Sticky Bag Summary Sidebar */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-2xl font-medium">In Your Bag ({cart.length})</h3>
            {quoteLoading && (
              <span className="text-[11px] font-mono-num text-[#8F6438] dark:text-[#C89B67]">
                Calculating...
              </span>
            )}
          </div>

          {quoteError && (
            <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{quoteError}</p>
          )}

          <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] max-h-64 overflow-y-auto">
            {cart.map((item) => (
              <li key={item.key} className="py-3 flex items-center gap-3">
                <ResilientImage
                  src={item.image}
                  alt={item.name}
                  className="w-14 h-11 rounded-sm object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-[#84827B]">
                    Qty {item.quantity} · {item.color}
                  </p>
                </div>
                <span className="text-sm font-mono-num shrink-0 text-right">
                  {formatCurrency(item.price * item.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>

          <form
            onSubmit={handlePromoSubmit}
            className="space-y-2 pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]"
          >
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code (STUDIO15, FREESHIP)"
                className="flex-1 min-w-0 h-10 px-3 text-xs rounded-md bg-white dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] uppercase"
              />
              <Button type="submit" variant="outline" size="sm">
                Apply
              </Button>
            </div>
            {promoFeedback && (
              <p
                className={`text-[11px] ${
                  promoFeedback.ok
                    ? 'text-[#1F6E43] dark:text-[#4ADE80]'
                    : 'text-[#B91C1C] dark:text-[#F87171]'
                }`}
              >
                {promoFeedback.text}
              </p>
            )}
            {appliedPromo && (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] text-xs">
                <span className="inline-flex items-center gap-1.5 font-mono-num font-medium">
                  <Tag className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
                  {appliedPromo.code}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    removePromoCode();
                    setPromoFeedback(null);
                  }}
                  aria-label="Remove promo code"
                  className="w-8 h-8 rounded flex items-center justify-center text-[#5C5B57] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </form>

          <div className="space-y-2 text-sm pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
            <div className="flex items-baseline justify-between gap-4 text-[#5C5B57] dark:text-[#A3A19B]">
              <span className="min-w-0">Subtotal</span>
              <span className="font-mono-num shrink-0 text-right">
                {formatCurrency(summarySubtotalUsd, currency)}
              </span>
            </div>
            {summaryDiscountUsd > 0 && (
              <div className="flex items-baseline justify-between gap-4 text-[#1F6E43] dark:text-[#4ADE80]">
                <span className="min-w-0">Promo ({appliedPromo?.code})</span>
                <span className="font-mono-num shrink-0 text-right">
                  -{formatCurrency(summaryDiscountUsd, currency)}
                </span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 text-[#5C5B57] dark:text-[#A3A19B]">
              <span className="min-w-0">VAT / Tax (5%)</span>
              <span className="font-mono-num shrink-0 text-right">
                {formatCurrency(summaryTaxUsd, currency)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 text-[#5C5B57] dark:text-[#A3A19B]">
              <span className="min-w-0">Shipping ({selectedDelivery.title})</span>
              <span className="font-mono-num shrink-0 text-right">
                {isRestrictedZone
                  ? 'Restricted'
                  : summaryShippingUsd === 0
                  ? 'Complimentary'
                  : formatCurrency(summaryShippingUsd, currency)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28] text-base font-semibold">
              <span className="min-w-0">Total</span>
              <span className="font-mono-num shrink-0 text-right">
                {formatCurrency(summaryTotalUsd, currency)}
              </span>
            </div>

            {quote && quote.currency !== currency && (
              <div className="flex items-baseline justify-between gap-4 text-xs font-mono-num text-[#8F6438] dark:text-[#C89B67] pt-1">
                <span className="min-w-0">Authoritative Settlement ({quote.currency})</span>
                <span className="shrink-0 text-right">
                  {formatDirectCurrency(quote.totalCharged, quote.currency)}
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#84827B] pt-1 leading-snug">
              FX Rate: 1 USD = ৳{currencyConfig.rates.BDT.toFixed(2)} ·{' '}
              {quote?.shippingQuote.zoneLabel || 'Dhaka Metro'}
            </p>
          </div>
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
        title={paymentSession ? paymentSession.provider : 'Gateway Verification'}
        maxWidthClass="max-w-lg"
      >
        {paymentSession && (
          <div className="space-y-5 text-sm">
            <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
              <div className="flex items-baseline justify-between gap-4 text-xs text-[#84827B]">
                <span className="min-w-0">Transaction Reference</span>
                <span className="font-mono-num font-semibold text-[#171716] dark:text-[#F4F3EF] shrink-0 text-right">
                  {paymentSession.transactionRef}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-xs text-[#84827B]">
                <span className="min-w-0">Settlement Amount</span>
                <span className="font-mono-num text-base font-semibold text-[#8F6438] dark:text-[#C89B67] shrink-0 text-right">
                  {formatDirectCurrency(paymentSession.amount, paymentSession.currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-xs text-[#84827B]">
                <span className="min-w-0">Status</span>
                <span className="font-mono-num uppercase shrink-0 text-right">
                  {paymentSession.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
              {paymentSession.gatewayInstructions}
            </p>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={verifyingPayment}
                onClick={() =>
                  handleVerifyGateway(
                    paymentSession.paymentMethod === 'cod' ? 'cod_confirmed' : 'paid'
                  )
                }
              >
                {verifyingPayment
                  ? 'Verifying with Server...'
                  : paymentSession.paymentMethod === 'cod'
                  ? 'Confirm Cash on Delivery Docket'
                  : `Authorize & Verify ${formatDirectCurrency(
                      paymentSession.amount,
                      paymentSession.currency
                    )}`}
              </Button>

              {paymentSession.paymentMethod !== 'cod' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={verifyingPayment}
                    onClick={() => handleVerifyGateway('failed')}
                    className="text-[#B91C1C] dark:text-[#F87171]"
                  >
                    Simulate Failed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={verifyingPayment}
                    onClick={() => handleVerifyGateway('cancelled')}
                  >
                    Cancel Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
