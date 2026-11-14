import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  ShoppingBag,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BANGLADESH_DIVISIONS } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { DeliveryMethodId, Order, PaymentMethodId } from '../types/commerce';
import { formatCurrency } from '../utils/format';
import { STUDIO_TRANSITION } from '../utils/motion';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { EmptyState, ResilientImage } from '../components/ui/Primitives';

const STEPS = [
  'Customer',
  'Shipping',
  'Delivery',
  'Payment',
  'Review',
  'Confirmation',
] as const;

export const CheckoutPage: React.FC = () => {
  const {
    currency,
    cart,
    cartSubtotal,
    cartDiscount,
    cartTax,
    appliedPromo,
    profile,
    addresses,
    placeOrder,
    navigate,
  } = useStore();

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const [step, setStep] = useState<number>(1);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Step 1: Customer Info
  const [email, setEmail] = useState(profile.email || '');
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [phone, setPhone] = useState(profile.phone || '');

  // Step 2: Shipping Info
  const [country, setCountry] = useState(defaultAddr?.country || 'United States');
  const [stateDiv, setStateDiv] = useState(defaultAddr?.state || '');
  const [city, setCity] = useState(defaultAddr?.city || '');
  const [area, setArea] = useState(defaultAddr?.area || '');
  const [streetAddress, setStreetAddress] = useState(defaultAddr?.streetAddress || '');
  const [postalCode, setPostalCode] = useState(defaultAddr?.postalCode || '');
  const [instructions, setInstructions] = useState('');

  // Step 3: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodId>('standard');

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('card');
  const [cardLast4Input, setCardLast4Input] = useState('4242');
  const [cardExpiryInput, setCardExpiryInput] = useState('08/29');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('01700-000000');

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (cart.length === 0 && step < 6) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="Your bag is empty"
            description="Add electronics, fashion, skincare, coffee, outdoor gear, or home objects before checking out."
            actionLabel="Browse Catalog"
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
        </div>
      </div>
    );
  }

  const deliveryOptions: {
    id: DeliveryMethodId;
    title: string;
    eta: string;
    cost: number;
    description: string;
  }[] = [
    {
      id: 'standard',
      title: 'Standard Ground Delivery',
      eta: 'Arrives Nov 20 – Nov 22, 2026',
      cost: cartSubtotal >= 500 || appliedPromo?.discountType === 'shipping' ? 0 : 28,
      description: 'Insured doorstep delivery with live tracking updates.',
    },
    {
      id: 'express',
      title: 'Express Insured Courier',
      eta: 'Arrives Nov 16 – Nov 17, 2026',
      cost: appliedPromo?.discountType === 'shipping' ? 0 : 48,
      description: 'Priority air & regional hub dispatch.',
    },
    {
      id: 'white-glove',
      title: 'White-Glove Room Placement',
      eta: 'Scheduled Nov 21 – Nov 25, 2026',
      cost: 125,
      description: 'In-home placement, assembly, and packaging removal.',
    },
  ];

  const selectedDelivery =
    deliveryOptions.find((d) => d.id === deliveryMethod) || deliveryOptions[0];
  const finalTotal = Math.max(
    0,
    Number((cartSubtotal - cartDiscount + cartTax + selectedDelivery.cost).toFixed(2))
  );

  const isBangladesh = country === 'Bangladesh';
  const divisionNames = Object.keys(BANGLADESH_DIVISIONS);
  const activeDivision = divisionNames.includes(stateDiv) ? stateDiv : divisionNames[0];
  const districtOptions = BANGLADESH_DIVISIONS[activeDivision] || [];

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    if (nextCountry === 'Bangladesh') {
      const firstDiv = divisionNames[0];
      setStateDiv(firstDiv);
      setCity(BANGLADESH_DIVISIONS[firstDiv][0]);
      setPostalCode('1212');
    }
  };

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
      if (!stateDiv.trim()) nextErrors.stateDiv = 'State or division is required.';
      if (!city.trim()) nextErrors.city = 'City or district is required.';
      if (!streetAddress.trim()) nextErrors.streetAddress = 'Street address is required.';
      if (!postalCode.trim()) nextErrors.postalCode = 'Postal code is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const handleCompleteOrder = () => {
    const created = placeOrder({
      customerName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      shippingAddress: {
        country: country.trim(),
        state: stateDiv.trim(),
        city: city.trim(),
        area: area.trim() || city.trim(),
        streetAddress: streetAddress.trim(),
        postalCode: postalCode.trim(),
        instructions: instructions.trim() || undefined,
      },
      deliveryMethod,
      paymentMethod,
    });
    setPlacedOrder(created);
    setStep(6);
  };

  if (step === 6 && placedOrder) {
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
              Order #{placedOrder.id} Confirmed
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-medium">
              Thank you, {placedOrder.customerName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] max-w-md mx-auto">
              Your simulated order is recorded locally and ready to track in your Order History and Order Tracking view.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs">
            <div>
              <p className="text-[#84827B]">Delivery Estimate</p>
              <p className="font-medium mt-1 text-sm">{placedOrder.estimatedArrival}</p>
            </div>
            <div>
              <p className="text-[#84827B]">Payment Method</p>
              <p className="font-medium mt-1 text-sm">{placedOrder.paymentLabel}</p>
            </div>
            <div>
              <p className="text-[#84827B]">Order Total</p>
              <p className="font-mono-num font-semibold mt-1 text-sm">
                {formatCurrency(placedOrder.total, currency)}
              </p>
            </div>
          </div>

          <div className="text-left space-y-3 pt-2">
            <p className="text-xs uppercase tracking-wider text-[#84827B]">Itemized Receipt</p>
            <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
              {placedOrder.items.map((item) => (
                <li key={item.key} className="py-3 flex items-center justify-between gap-4 text-sm">
                  <span>
                    {item.name} × {item.quantity}{' '}
                    <span className="text-xs text-[#84827B]">({item.color})</span>
                  </span>
                  <span className="font-mono-num font-medium">
                    {formatCurrency(item.price * item.quantity, currency)}
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
          <p className="text-xs text-[#84827B] uppercase tracking-wider">Distraction-Free Checkout</p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium mt-1">Complete Your Order</h1>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
          <Lock className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
          <span>Simulated Local Checkout Preview (No Real Charge)</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 p-5 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
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
                    helperText="We will link your order confirmation to this email."
                    placeholder="name@domain.com"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      error={errors.fullName}
                      placeholder="Alex Mercer"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                      placeholder="+880 1700-000000"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-2xl font-medium">2. Shipping Information</h2>
                    {addresses.length > 0 && (
                      <select
                        aria-label="Fill from saved address"
                        onChange={(e) => {
                          const found = addresses.find((a) => a.id === e.target.value);
                          if (found) {
                            setCountry(found.country);
                            setStateDiv(found.state);
                            setCity(found.city);
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
                            {a.label} — {a.city}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Country / Region"
                      required
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      options={[
                        { value: 'United States', label: 'United States' },
                        { value: 'Bangladesh', label: 'Bangladesh' },
                        { value: 'Canada', label: 'Canada' },
                        { value: 'United Kingdom', label: 'United Kingdom' },
                      ]}
                    />

                    {isBangladesh ? (
                      <Select
                        label="Division"
                        required
                        value={activeDivision}
                        onChange={(e) => {
                          const div = e.target.value;
                          setStateDiv(div);
                          setCity(BANGLADESH_DIVISIONS[div][0]);
                        }}
                        options={divisionNames.map((d) => ({ value: d, label: d }))}
                      />
                    ) : (
                      <Input
                        label="State / Province"
                        required
                        value={stateDiv}
                        onChange={(e) => setStateDiv(e.target.value)}
                        error={errors.stateDiv}
                        placeholder="California"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isBangladesh ? (
                      <Select
                        label="District / City"
                        required
                        value={districtOptions.includes(city) ? city : districtOptions[0]}
                        onChange={(e) => setCity(e.target.value)}
                        options={districtOptions.map((d) => ({ value: d, label: d }))}
                      />
                    ) : (
                      <Input
                        label="City"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={errors.city}
                        placeholder="San Francisco"
                      />
                    )}
                    <Input
                      label="Area / Neighborhood"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder={isBangladesh ? 'Banani / Gulshan / Dhanmondi' : 'Pacific Heights'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Street Address"
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
                    placeholder="Elevator access, gate code, or concierge desk instructions..."
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-medium">3. Delivery Method</h2>
                  <div className="space-y-3">
                    {deliveryOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start justify-between gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          deliveryMethod === opt.id
                            ? 'border-[#171716] dark:border-[#F4F3EF] bg-[#F9F8F6] dark:bg-[#22221F]'
                            : 'border-[#E5E3DD] dark:border-[#2C2C28]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="delivery-method"
                            checked={deliveryMethod === opt.id}
                            onChange={() => setDeliveryMethod(opt.id)}
                            className="mt-1 accent-[#171716] dark:accent-[#F4F3EF]"
                          />
                          <div>
                            <p className="text-sm font-semibold">{opt.title}</p>
                            <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                              {opt.description}
                            </p>
                            <p className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] mt-1">
                              {opt.eta}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-mono-num font-semibold shrink-0">
                          {opt.cost === 0
                            ? 'Complimentary'
                            : formatCurrency(opt.cost, currency)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="font-display text-2xl font-medium">4. Payment Method</h2>
                  <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                    Select a simulated payment channel. Mobile wallet methods (bKash, Nagad, Rocket) and international cards run in local preview mode with zero live charge.
                  </p>
                  <div className="space-y-2.5">
                    {(
                      [
                        {
                          id: 'card',
                          label: 'Credit / Debit Card',
                          sub: 'Visa, Mastercard, Amex',
                          Icon: CreditCard,
                        },
                        {
                          id: 'bkash',
                          label: 'bKash Mobile Wallet (Demo)',
                          sub: 'Instant local mobile payment preview',
                          Icon: Smartphone,
                        },
                        {
                          id: 'nagad',
                          label: 'Nagad Mobile Wallet (Demo)',
                          sub: 'Instant local MFS confirmation preview',
                          Icon: Smartphone,
                        },
                        {
                          id: 'rocket',
                          label: 'Rocket Mobile Banking (Demo)',
                          sub: 'DBBL Rocket mobile channel preview',
                          Icon: Smartphone,
                        },
                        {
                          id: 'wallet',
                          label: 'Apple Pay / Express Wallet',
                          sub: 'One-tap digital wallet preview',
                          Icon: Wallet,
                        },
                        {
                          id: 'bank-transfer',
                          label: 'Direct Bank Transfer',
                          sub: 'ACH / SWIFT / BEFTN wire reference',
                          Icon: Building2,
                        },
                        {
                          id: 'cod',
                          label: 'Cash on Delivery (COD)',
                          sub: 'Pay courier upon doorstep inspection',
                          Icon: Truck,
                        },
                      ] as const
                    ).map(({ id, label, sub, Icon }) => (
                      <label
                        key={id}
                        className={`flex items-center justify-between gap-4 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                          paymentMethod === id
                            ? 'border-[#171716] dark:border-[#F4F3EF] bg-[#F9F8F6] dark:bg-[#22221F]'
                            : 'border-[#E5E3DD] dark:border-[#2C2C28]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="payment-method"
                            checked={paymentMethod === id}
                            onChange={() => setPaymentMethod(id)}
                            className="accent-[#171716] dark:accent-[#F4F3EF]"
                          />
                          <Icon className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
                          <div>
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{sub}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Demo Card Ending (4 digits)"
                        value={cardLast4Input}
                        maxLength={4}
                        onChange={(e) => setCardLast4Input(e.target.value)}
                      />
                      <Input
                        label="Expiration"
                        value={cardExpiryInput}
                        onChange={(e) => setCardExpiryInput(e.target.value)}
                      />
                    </div>
                  )}

                  {(paymentMethod === 'bkash' ||
                    paymentMethod === 'nagad' ||
                    paymentMethod === 'rocket') && (
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
                      <Input
                        label="Demo Mobile Wallet Number"
                        value={mobileWalletNumber}
                        onChange={(e) => setMobileWalletNumber(e.target.value)}
                        helperText="Simulated wallet entry — no real OTP or charge occurs."
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl font-medium">5. Order Review</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[#84827B]">Ship To</p>
                      <p className="font-medium">{fullName}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{streetAddress}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        {city}, {stateDiv} {postalCode} · {country}
                      </p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{phone}</p>
                    </div>

                    <div className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                      <p className="text-xs uppercase tracking-wider text-[#84827B]">
                        Delivery &amp; Payment
                      </p>
                      <p className="font-medium">{selectedDelivery.title}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        {selectedDelivery.eta}
                      </p>
                      <p className="text-xs text-[#8F6438] dark:text-[#C89B67] pt-1 uppercase font-mono-num">
                        Method: {paymentMethod.replace('-', ' ')}
                      </p>
                    </div>
                  </div>

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
                            {item.color} · {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-mono-num font-medium">
                          {formatCurrency(item.price * item.quantity, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

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
              <Button variant="primary" size="md" onClick={handleNext}>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="primary" size="lg" onClick={handleCompleteOrder}>
                <span>Place Order · {formatCurrency(finalTotal, currency)}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Sticky Bag Summary Sidebar */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5">
          <h3 className="font-display text-2xl font-medium">In Your Bag ({cart.length})</h3>
          <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] max-h-72 overflow-y-auto">
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
                <span className="text-sm font-mono-num">
                  {formatCurrency(item.price * item.quantity, currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 text-sm pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
            <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
              <span>Subtotal</span>
              <span className="font-mono-num">{formatCurrency(cartSubtotal, currency)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-[#1F6E43] dark:text-[#4ADE80]">
                <span>Promo ({appliedPromo?.code})</span>
                <span className="font-mono-num">-{formatCurrency(cartDiscount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
              <span>Estimated Tax (5%)</span>
              <span className="font-mono-num">{formatCurrency(cartTax, currency)}</span>
            </div>
            <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
              <span>Shipping ({selectedDelivery.title})</span>
              <span className="font-mono-num">
                {selectedDelivery.cost === 0
                  ? 'Complimentary'
                  : formatCurrency(selectedDelivery.cost, currency)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28] text-base font-semibold">
              <span>Total</span>
              <span className="font-mono-num">{formatCurrency(finalTotal, currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
