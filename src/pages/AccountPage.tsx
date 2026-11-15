import React, { useEffect, useState } from 'react';
import {
  Bell,
  CreditCard,
  Heart,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminDashboard } from '../components/account/AdminDashboard';
import { SellerDashboard } from '../components/account/SellerDashboard';
import { AuthPanel } from '../components/auth/AuthPanel';
import { Button } from '../components/ui/Button';
import { Checkbox, Input, Select, Textarea } from '../components/ui/FormFields';
import { Breadcrumb, EmptyState, Modal, ResilientImage } from '../components/ui/Primitives';
import { BANGLADESH_GEO_TREE } from '../../server/shared/marketplaceSchema';
import { useStore } from '../context/StoreContext';
import { submitSupportInquiryApi } from '../services/api';
import { Order } from '../types/commerce';
import {
  formatCurrency,
  formatDirectCurrency,
  formatShortDate,
  isProductOutOfStock,
} from '../utils/format';
import { t } from '../utils/i18n';
import { STUDIO_TRANSITION } from '../utils/motion';
import { isValidContactPhone } from '../utils/validation';

type AccountSection =
  | 'overview'
  | 'profile'
  | 'addresses'
  | 'orders'
  | 'wishlist'
  | 'payments'
  | 'returns'
  | 'support'
  | 'security'
  | 'seller-hub'
  | 'admin-console';

function normalizeAccountTab(raw?: string): AccountSection {
  if (!raw) return 'overview';
  if (raw === 'password' || raw === 'notifications' || raw === 'privacy') {
    return 'security';
  }
  if (
    raw === 'overview' ||
    raw === 'profile' ||
    raw === 'addresses' ||
    raw === 'orders' ||
    raw === 'wishlist' ||
    raw === 'payments' ||
    raw === 'returns' ||
    raw === 'support' ||
    raw === 'security' ||
    raw === 'seller-hub' ||
    raw === 'admin-console'
  ) {
    return raw;
  }
  return 'overview';
}

export const AccountPage: React.FC = () => {
  const {
    language,
    currency,
    route,
    navigate,
    profile,
    updateProfile,
    changePassword,
    signOut,
    orders,
    reorderFromOrder,
    cancelOrder,
    requestOrderReturn,
    addresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    wishlistIds,
    toggleWishlist,
    addToCart,
    products,
    paymentMethods,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    notificationPrefs,
    setNotificationPrefs,
    privacyPrefs,
    setPrivacyPrefs,
    cookieConsent,
    openCookiePreferences,
    showToast,
  } = useStore();

  const initialTab: AccountSection =
    route.name === 'seller'
      ? 'seller-hub'
      : route.name === 'admin'
      ? 'admin-console'
      : normalizeAccountTab(route.accountTab);

  const [section, setSection] = useState<AccountSection>(initialTab);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit profile state
  const [nameInput, setNameInput] = useState(profile.fullName);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [phoneInput, setPhoneInput] = useState(profile.phone);
  const [studioInput, setStudioInput] = useState(profile.studioName || '');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setNameInput(profile.fullName);
    setEmailInput(profile.email);
    setPhoneInput(profile.phone);
    setStudioInput(profile.studioName || '');
  }, [profile.fullName, profile.email, profile.phone, profile.studioName]);

  useEffect(() => {
    if (route.name === 'seller') {
      setSection('seller-hub');
    } else if (route.name === 'admin') {
      setSection('admin-console');
    } else if (route.accountTab) {
      setSection(normalizeAccountTab(route.accountTab));
    }
  }, [route.name, route.accountTab]);

  // Change password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Return reason state
  const [returnReasonMap, setReturnReasonMap] = useState<Record<string, string>>({});

  // Support quick inquiry
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [lastTicketRef, setLastTicketRef] = useState('');

  // Add address form (defaults to Bangladesh 5-level hierarchy)
  const bdDefaultDiv = BANGLADESH_GEO_TREE[0];
  const bdDefaultDist = bdDefaultDiv.districts[0];
  const bdDefaultUpa = bdDefaultDist.upazilas[0];
  const bdDefaultArea = bdDefaultUpa.areas[0];

  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrCountry, setAddrCountry] = useState('Bangladesh');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrState, setAddrState] = useState(bdDefaultDiv.name);
  const [addrCity, setAddrCity] = useState(bdDefaultDist.name);
  const [addrUpazila, setAddrUpazila] = useState(bdDefaultUpa.name);
  const [addrArea, setAddrArea] = useState(bdDefaultArea.name);
  const [addrZip, setAddrZip] = useState(bdDefaultArea.postalCode);
  const [addrError, setAddrError] = useState('');

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const returnEligibleOrders = orders.filter((o) => o.currentStage === 'Delivered');
  const returnRequestedOrders = orders.filter((o) => o.currentStage === 'Return Requested');

  if (!profile.isAuthenticated || route.name === 'login') {
    return (
      <div className="ks-container py-8 lg:py-12 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: () => navigate({ name: 'home' }) },
            { label: t(language, 'signIn') },
          ]}
        />

        <div className="max-w-2xl space-y-2">
          <p className="ks-eyebrow text-[var(--ks-accent)]">Kinto Studio Account</p>
          <h1 className="font-display text-3xl sm:text-5xl font-medium tracking-tight">
            Sign In or Create Account
          </h1>
          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            Access your orders, Bangladesh shipping addresses, tokenized payment preferences, or verified Seller Studio workspace.
          </p>
        </div>

        {profile.isAuthenticated && route.name === 'login' && (
          <div className="p-4 sm:p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                Active Session
              </p>
              <p className="text-sm font-medium">
                Signed in as {profile.fullName} ({profile.studioRole})
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate({
                  name:
                    profile.role === 'admin'
                      ? 'admin'
                      : profile.role === 'seller'
                      ? 'seller'
                      : 'account',
                  accountTab: 'overview',
                })
              }
            >
              Open Active Workspace →
            </Button>
          </div>
        )}

        <AuthPanel
          key={route.accountTab === 'register' ? 'register' : 'signin'}
          initialTab={route.accountTab === 'register' ? 'register' : 'signin'}
          onSuccess={(user) => {
            if (user.role === 'admin') {
              setSection('admin-console');
              navigate({ name: 'admin' });
            } else if (user.role === 'seller') {
              setSection('seller-hub');
              navigate({ name: 'seller' });
            } else {
              setSection('overview');
              navigate({ name: 'account', accountTab: 'overview' });
            }
          }}
        />
      </div>
    );
  }

  const navItems: {
    id: AccountSection;
    label: string;
    Icon: React.FC<{ className?: string }>;
    visible: boolean;
  }[] = [
    { id: 'overview', label: t(language, 'accountOverview'), Icon: User, visible: true },
    { id: 'profile', label: t(language, 'personalInfo'), Icon: User, visible: true },
    { id: 'addresses', label: t(language, 'addresses'), Icon: MapPin, visible: true },
    { id: 'orders', label: t(language, 'orders'), Icon: Package, visible: true },
    { id: 'wishlist', label: t(language, 'wishlist'), Icon: Heart, visible: true },
    { id: 'payments', label: t(language, 'paymentMethods'), Icon: CreditCard, visible: true },
    { id: 'returns', label: t(language, 'returns'), Icon: RotateCcw, visible: true },
    { id: 'support', label: t(language, 'support'), Icon: HelpCircle, visible: true },
    { id: 'security', label: t(language, 'accountSecurity'), Icon: Lock, visible: true },
    {
      id: 'seller-hub',
      label: t(language, 'sellerWorkspace'),
      Icon: Store,
      visible: profile.role === 'seller' || profile.role === 'admin',
    },
    {
      id: 'admin-console',
      label: t(language, 'adminWorkspace'),
      Icon: ShieldCheck,
      visible: profile.role === 'admin',
    },
  ];

  const switchSection = (next: AccountSection) => {
    setSection(next);
    if (next === 'seller-hub') {
      navigate({ name: 'seller' });
    } else if (next === 'admin-console') {
      navigate({ name: 'admin' });
    } else {
      navigate({ name: 'account', accountTab: next });
    }
  };

  return (
    <div className="ks-container py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          {
            label:
              section === 'admin-console'
                ? 'Admin Console'
                : section === 'seller-hub'
                ? 'Seller Dashboard'
                : t(language, 'myAccount'),
          },
        ]}
      />

      {/* Authenticated Account Header (zero role-switching shortcuts) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--ks-border)]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
            {profile.studioRole}
            {profile.studioName ? ` · ${profile.studioName}` : ''}
          </p>
          <h1 className="font-display text-[clamp(1.85rem,3.5vw,3rem)] font-medium mt-1">
            {profile.fullName || 'My Account'}
          </h1>
          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 font-mono-num">
            {profile.email}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            signOut();
            navigate({ name: 'login' });
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t(language, 'signOut')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Role-scoped Sidebar */}
        <aside className="lg:col-span-3 p-2 sm:p-3 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <nav
            aria-label="Account sections"
            className="flex overflow-x-auto lg:flex-col gap-1 pb-1 lg:pb-0 no-scrollbar"
          >
            {navItems
              .filter((item) => item.visible)
              .map(({ id, label, Icon }) => {
                const active = section === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchSection(id)}
                    className={`relative flex items-center gap-2.5 px-3.5 py-2.5 min-h-[40px] rounded-[var(--ks-radius-md)] text-xs sm:text-sm font-medium text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'text-[var(--ks-action-text)]'
                        : 'text-[var(--ks-text-secondary)] hover:bg-[var(--ks-surface-muted)] hover:text-[var(--ks-text-primary)]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="account-nav-pill"
                        transition={STUDIO_TRANSITION.springTab}
                        className="absolute inset-0 rounded-[var(--ks-radius-md)] bg-[var(--ks-action)]"
                      />
                    )}
                    <Icon className="w-4 h-4 shrink-0 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* Active Section Content */}
        <div className="lg:col-span-9 p-5 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-6">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={STUDIO_TRANSITION.fast}
          >
            {section === 'seller-hub' &&
              (profile.role === 'seller' || profile.role === 'admin' ? (
                <SellerDashboard />
              ) : (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <Store className="w-7 h-7 mx-auto text-[var(--ks-accent)]" />
                  <h2 className="font-display text-2xl font-medium">Seller Authorization Required</h2>
                  <p className="text-sm text-[var(--ks-text-secondary)]">
                    This workspace is restricted to approved Seller Studio accounts and platform administrators.
                  </p>
                  <Button variant="primary" size="md" onClick={() => switchSection('overview')}>
                    Return to Account Overview
                  </Button>
                </div>
              ))}

            {section === 'admin-console' &&
              (profile.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <ShieldCheck className="w-7 h-7 mx-auto text-[var(--ks-accent)]" />
                  <h2 className="font-display text-2xl font-medium">Administrator Access Required</h2>
                  <p className="text-sm text-[var(--ks-text-secondary)]">
                    Platform Administration tools are restricted to authorized admin sessions.
                  </p>
                  <Button variant="primary" size="md" onClick={() => switchSection('overview')}>
                    Return to Account Overview
                  </Button>
                </div>
              ))}

            {section === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-xs text-[var(--ks-text-muted)]">Total Orders</p>
                    <p className="font-mono-num text-2xl font-semibold mt-1">{orders.length}</p>
                  </div>
                  <div className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-xs text-[var(--ks-text-muted)]">Saved Wishlist</p>
                    <p className="font-mono-num text-2xl font-semibold mt-1">
                      {wishlistedProducts.length}
                    </p>
                  </div>
                  <div className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-xs text-[var(--ks-text-muted)]">Account Role</p>
                    <p className="font-mono-num text-xl font-semibold mt-1 capitalize">
                      {profile.role}
                    </p>
                  </div>
                </div>

                {(profile.role === 'seller' || profile.role === 'admin') && (
                  <div className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                        Partner Workspace
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {profile.role === 'admin'
                          ? 'Open Platform Admin Console to manage orders, sellers, promotions, and categories.'
                          : 'Open Seller Dashboard to manage inventory, shipments, returns, and payouts.'}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        switchSection(profile.role === 'admin' ? 'admin-console' : 'seller-hub')
                      }
                    >
                      {profile.role === 'admin' ? 'Open Admin Console' : 'Open Seller Dashboard'}
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  <h2 className="font-display text-2xl font-medium">Account Sections</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'orders' as AccountSection,
                        title: 'Orders',
                        desc: `${orders.length} orders · Track, reorder & cancel`,
                        Icon: Package,
                      },
                      {
                        id: 'wishlist' as AccountSection,
                        title: 'Wishlist',
                        desc: `${wishlistedProducts.length} saved products`,
                        Icon: Heart,
                      },
                      {
                        id: 'addresses' as AccountSection,
                        title: 'Addresses',
                        desc: `${addresses.length} delivery destinations`,
                        Icon: MapPin,
                      },
                      {
                        id: 'payments' as AccountSection,
                        title: 'Payment Methods',
                        desc: `${paymentMethods.length} tokenized methods`,
                        Icon: CreditCard,
                      },
                      {
                        id: 'returns' as AccountSection,
                        title: 'Returns',
                        desc: `${returnRequestedOrders.length} active · ${returnEligibleOrders.length} eligible`,
                        Icon: RotateCcw,
                      },
                      {
                        id: 'support' as AccountSection,
                        title: 'Support',
                        desc: 'Order help, FAQ & customer care',
                        Icon: HelpCircle,
                      },
                      {
                        id: 'profile' as AccountSection,
                        title: 'Personal Information',
                        desc: 'Name, email & phone number',
                        Icon: User,
                      },
                      {
                        id: 'security' as AccountSection,
                        title: 'Account Security',
                        desc: 'Password, alerts & privacy',
                        Icon: Shield,
                      },
                    ].map(({ id, title, desc, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => switchSection(id)}
                        className="group p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] hover:border-[var(--ks-accent)] text-left transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <span className="w-8 h-8 mt-0.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-accent)] shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug truncate group-hover:text-[var(--ks-accent)] transition-colors">
                            {title}
                          </p>
                          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 truncate leading-snug">
                            {desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-medium">Recent Orders</h2>
                    <button
                      type="button"
                      onClick={() => switchSection('orders')}
                      className="text-xs font-medium text-[var(--ks-accent)] hover:underline cursor-pointer"
                    >
                      View all orders
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-[var(--ks-text-secondary)] py-4 border-y border-[var(--ks-border)]">
                      No orders recorded yet. Explore the marketplace catalog to place your first order.
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--ks-divider)] border-y border-[var(--ks-border)]">
                      {orders.slice(0, 3).map((ord) => (
                        <div
                          key={ord.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                            <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 leading-snug">
                              {formatShortDate(ord.createdAt)} · {ord.currentStage} ·{' '}
                              <span className="uppercase font-mono-num">{ord.paymentStatus}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-sm font-mono-num font-medium">
                              {ord.currencySnapshot
                                ? formatDirectCurrency(
                                    ord.currencySnapshot.chargedTotal,
                                    ord.currencySnapshot.transactionCurrency
                                  )
                                : formatCurrency(ord.total, currency)}
                            </span>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                            >
                              Track
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'profile' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!nameInput.trim() || !emailInput.trim()) {
                    setProfileError('Full name and email address are required.');
                    return;
                  }
                  if (phoneInput.trim() && !isValidContactPhone(phoneInput.trim(), 'Bangladesh')) {
                    setProfileError('Enter a valid Bangladesh phone number (e.g. +880 1711-000100) or international format.');
                    return;
                  }
                  setProfileError('');
                  await updateProfile({
                    fullName: nameInput.trim(),
                    email: emailInput.trim(),
                    phone: phoneInput.trim(),
                    studioName: profile.role === 'seller' ? studioInput.trim() : undefined,
                  });
                }}
                className="max-w-lg space-y-5"
              >
                <h2 className="font-display text-2xl font-medium">Personal Information</h2>
                <Input
                  label="Full Name"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                {profile.role === 'seller' && (
                  <Input
                    label="Seller Studio Name"
                    value={studioInput}
                    onChange={(e) => setStudioInput(e.target.value)}
                  />
                )}
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Input
                  label="Phone Number"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+880 1711-000100"
                />
                {profileError && (
                  <p className="text-xs text-[var(--ks-error)]" role="alert">
                    {profileError}
                  </p>
                )}
                <Button type="submit" variant="primary" size="md">
                  Save Profile Changes
                </Button>
              </form>
            )}

            {section === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-medium">Address Book</h2>
                  <Button variant="primary" size="sm" onClick={() => setShowAddrForm((p) => !p)}>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </Button>
                </div>

                {showAddrForm && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!addrLabel.trim() || !addrStreet.trim() || !addrCity.trim()) {
                        setAddrError('Label, street address, and city/district are required.');
                        return;
                      }
                      setAddrError('');
                      saveAddress({
                        label: addrLabel.trim(),
                        fullName: profile.fullName || 'Customer',
                        phone: profile.phone,
                        country: addrCountry,
                        state: addrState.trim() || (addrCountry === 'Bangladesh' ? 'Dhaka' : ''),
                        city: addrCity.trim(),
                        upazila: addrCountry === 'Bangladesh' ? addrUpazila.trim() : undefined,
                        area: addrArea.trim() || addrCity.trim(),
                        streetAddress: addrStreet.trim(),
                        postalCode: addrZip.trim() || (addrCountry === 'Bangladesh' ? '1213' : ''),
                        isDefault: false,
                      });
                      setAddrLabel('');
                      setAddrStreet('');
                      setShowAddrForm(false);
                    }}
                    className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Label (e.g., Home, Office)"
                        required
                        value={addrLabel}
                        onChange={(e) => {
                          setAddrLabel(e.target.value);
                          setAddrError('');
                        }}
                      />
                      <Select
                        label="Country / Region"
                        value={addrCountry}
                        onChange={(e) => {
                          const next = e.target.value;
                          setAddrCountry(next);
                          setAddrError('');
                          if (next === 'Bangladesh') {
                            setAddrState(bdDefaultDiv.name);
                            setAddrCity(bdDefaultDist.name);
                            setAddrUpazila(bdDefaultUpa.name);
                            setAddrArea(bdDefaultArea.name);
                            setAddrZip(bdDefaultArea.postalCode);
                          } else {
                            setAddrState('');
                            setAddrCity('');
                            setAddrUpazila('');
                            setAddrArea('');
                            setAddrZip('');
                          }
                        }}
                        options={[
                          { value: 'Bangladesh', label: 'Bangladesh' },
                          { value: 'United States', label: 'United States' },
                          { value: 'Canada', label: 'Canada' },
                          { value: 'United Kingdom', label: 'United Kingdom' },
                        ]}
                      />

                      {addrCountry === 'Bangladesh' ? (
                        (() => {
                          const divObj =
                            BANGLADESH_GEO_TREE.find((d) => d.name === addrState) ||
                            BANGLADESH_GEO_TREE[0];
                          const distObj =
                            divObj.districts.find((d) => d.name === addrCity) || divObj.districts[0];
                          const upaObj =
                            distObj.upazilas.find((u) => u.name === addrUpazila) ||
                            distObj.upazilas[0];
                          return (
                            <>
                              <Select
                                label="Division"
                                value={divObj.name}
                                onChange={(e) => {
                                  const d =
                                    BANGLADESH_GEO_TREE.find((x) => x.name === e.target.value) ||
                                    BANGLADESH_GEO_TREE[0];
                                  const dist = d.districts[0];
                                  const upa = dist.upazilas[0];
                                  const ar = upa.areas[0];
                                  setAddrState(d.name);
                                  setAddrCity(dist.name);
                                  setAddrUpazila(upa.name);
                                  setAddrArea(ar.name);
                                  setAddrZip(ar.postalCode);
                                }}
                                options={BANGLADESH_GEO_TREE.map((d) => ({
                                  value: d.name,
                                  label: d.name,
                                }))}
                              />
                              <Select
                                label="District"
                                value={distObj.name}
                                onChange={(e) => {
                                  const dist =
                                    divObj.districts.find((x) => x.name === e.target.value) ||
                                    divObj.districts[0];
                                  const upa = dist.upazilas[0];
                                  const ar = upa.areas[0];
                                  setAddrCity(dist.name);
                                  setAddrUpazila(upa.name);
                                  setAddrArea(ar.name);
                                  setAddrZip(ar.postalCode);
                                }}
                                options={divObj.districts.map((d) => ({
                                  value: d.name,
                                  label: d.name,
                                }))}
                              />
                              <Select
                                label="City / Upazila"
                                value={upaObj.name}
                                onChange={(e) => {
                                  const upa =
                                    distObj.upazilas.find((x) => x.name === e.target.value) ||
                                    distObj.upazilas[0];
                                  const ar = upa.areas[0];
                                  setAddrUpazila(upa.name);
                                  setAddrArea(ar.name);
                                  setAddrZip(ar.postalCode);
                                }}
                                options={distObj.upazilas.map((u) => ({
                                  value: u.name,
                                  label: u.name,
                                }))}
                              />
                              <Select
                                label="Area / Neighborhood"
                                value={
                                  upaObj.areas.some((a) => a.name === addrArea)
                                    ? addrArea
                                    : upaObj.areas[0]?.name || ''
                                }
                                onChange={(e) => {
                                  const ar = upaObj.areas.find((x) => x.name === e.target.value);
                                  setAddrArea(e.target.value);
                                  if (ar) setAddrZip(ar.postalCode);
                                }}
                                options={upaObj.areas.map((a) => ({
                                  value: a.name,
                                  label: a.name,
                                }))}
                              />
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <Input
                            label="State / Province"
                            value={addrState}
                            onChange={(e) => setAddrState(e.target.value)}
                          />
                          <Input
                            label="City"
                            required
                            value={addrCity}
                            onChange={(e) => {
                              setAddrCity(e.target.value);
                              setAddrArea(e.target.value);
                              setAddrError('');
                            }}
                          />
                        </>
                      )}

                      <Input
                        label="Street / House / Road"
                        required
                        value={addrStreet}
                        onChange={(e) => {
                          setAddrStreet(e.target.value);
                          setAddrError('');
                        }}
                      />
                      <Input
                        label="Postal Code"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                      />
                    </div>
                    {addrError && <p className="text-xs text-[var(--ks-error)]">{addrError}</p>}
                    <Button type="submit" variant="primary" size="sm">
                      Save Address
                    </Button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <EmptyState
                    icon={<MapPin className="w-5 h-5" />}
                    title="No saved addresses"
                    description="Add a Bangladesh division, district, upazila, and street address for faster checkout."
                    actionLabel="Add Delivery Address"
                    onAction={() => setShowAddrForm(true)}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{addr.label}</p>
                            {addr.isDefault && (
                              <span className="text-xs font-medium text-[var(--ks-accent)]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--ks-text-secondary)]">
                            {addr.streetAddress}
                          </p>
                          <p className="text-xs text-[var(--ks-text-secondary)]">
                            {[addr.area, addr.upazila, addr.city, addr.state, addr.postalCode]
                              .filter(Boolean)
                              .join(', ')}{' '}
                            · {addr.country}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 pt-2 border-t border-[var(--ks-border)] text-xs">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(addr.id)}
                              className="font-medium hover:underline cursor-pointer"
                            >
                              Set as default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteAddress(addr.id)}
                            className="text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer ml-auto"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'orders' && (
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-medium">Order History</h2>
                {orders.length === 0 ? (
                  <EmptyState
                    icon={<Package className="w-5 h-5" />}
                    title="No orders placed yet"
                    description="Completed marketplace orders and shipment tracking details will appear here."
                    actionLabel="Browse Catalog"
                    onAction={() => navigate({ name: 'shop', category: 'all' })}
                  />
                ) : (
                  <div className="divide-y divide-[var(--ks-divider)] border-y border-[var(--ks-border)]">
                    {orders.map((ord) => {
                      const canCancel = ['Confirmed', 'Processing'].includes(ord.currentStage);
                      const canReturn = ord.currentStage === 'Delivered';
                      return (
                        <div
                          key={ord.id}
                          className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                            <p className="text-xs text-[var(--ks-text-secondary)] leading-snug">
                              Placed {formatShortDate(ord.createdAt)} · {ord.items.length} item(s) ·{' '}
                              <span
                                className={`font-medium ${
                                  ord.currentStage === 'Cancelled'
                                    ? 'text-[var(--ks-error)]'
                                    : ord.currentStage === 'Return Requested'
                                    ? 'text-[var(--ks-warning)]'
                                    : 'text-[var(--ks-text-primary)]'
                                }`}
                              >
                                {ord.currentStage}
                              </span>{' '}
                              · <span className="uppercase font-mono-num">{ord.paymentStatus}</span>
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span className="text-sm font-mono-num font-semibold mr-1">
                              {ord.currencySnapshot
                                ? formatDirectCurrency(
                                    ord.currencySnapshot.chargedTotal,
                                    ord.currencySnapshot.transactionCurrency
                                  )
                                : formatCurrency(ord.total, currency)}
                            </span>
                            <Button variant="outline" size="xs" onClick={() => setSelectedOrder(ord)}>
                              Details
                            </Button>
                            <Button variant="outline" size="xs" onClick={() => reorderFromOrder(ord)}>
                              Reorder
                            </Button>
                            {canCancel && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => cancelOrder(ord.id)}
                                className="text-[var(--ks-error)]"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Cancel</span>
                              </Button>
                            )}
                            {canReturn && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => requestOrderReturn(ord.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Return</span>
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                            >
                              Track
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === 'wishlist' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-medium">
                    Saved Wishlist ({wishlistedProducts.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigate({ name: 'wishlist' })}>
                    Open Full Wishlist
                  </Button>
                </div>
                {wishlistedProducts.length === 0 ? (
                  <EmptyState
                    icon={<Heart className="w-5 h-5" />}
                    title="No objects saved yet"
                    description="Tap the heart icon on any product to save it for later."
                    actionLabel="Explore Catalog"
                    onAction={() => navigate({ name: 'shop', category: 'all' })}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistedProducts.map((item) => {
                      const outOfStock = isProductOutOfStock(item);
                      const primaryColor = item.colors[0] || { name: 'Standard', hex: '#84827B' };
                      const primarySize = item.sizes[0] || 'Standard';
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] flex gap-4 items-center"
                        >
                          <button
                            type="button"
                            onClick={() => navigate({ name: 'product', slug: item.slug })}
                            aria-label={`View ${item.name}`}
                            className="w-20 h-16 rounded-[var(--ks-radius-sm)] overflow-hidden shrink-0 cursor-pointer block"
                          >
                            <ResilientImage
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <button
                              type="button"
                              onClick={() => navigate({ name: 'product', slug: item.slug })}
                              className="text-sm font-medium truncate cursor-pointer hover:text-[var(--ks-accent)] text-left block w-full"
                            >
                              {item.name}
                            </button>
                            <p className="text-xs font-mono-num font-semibold">
                              {formatCurrency(item.price, currency)}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                variant="primary"
                                size="xs"
                                disabled={outOfStock}
                                onClick={() =>
                                  addToCart(
                                    item,
                                    primaryColor.name,
                                    primaryColor.hex,
                                    primarySize,
                                    1,
                                    true
                                  )
                                }
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{outOfStock ? 'Out of Stock' : 'Add'}</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => toggleWishlist(item)}
                                className="text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer min-h-[32px] px-1.5"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === 'payments' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-medium">Payment Methods</h2>
                  <p className="text-xs text-[var(--ks-text-secondary)]">
                    Kinto Studio never stores raw card numbers or PINs on local servers. Only gateway-tokenized wallet or card references saved via bKash, Nagad, or SSLCommerz appear here.
                  </p>
                </div>

                {paymentMethods.length === 0 ? (
                  <EmptyState
                    icon={<CreditCard className="w-5 h-5" />}
                    title="No saved tokenized payment methods"
                    description="Tokenized wallets and cards authorized through bKash, Nagad, or SSLCommerz during checkout will appear here."
                    actionLabel="Review Payment Policy"
                    onAction={() => navigate({ name: 'payment-policy' })}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium font-mono-num truncate">
                            {pm.brand} · {pm.referenceMasked}
                          </p>
                          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
                            {pm.provider} {pm.isDefault ? '· Default' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!pm.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultPaymentMethod(pm.id)}
                              className="text-xs hover:underline cursor-pointer"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deletePaymentMethod(pm.id)}
                            aria-label="Remove payment method"
                            className="w-9 h-9 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'returns' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-medium">Returns &amp; Refunds</h2>
                    <p className="text-xs text-[var(--ks-text-secondary)] mt-1">
                      Submit a return claim for delivered orders or monitor open return authorizations.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate({ name: 'return-policy' })}>
                    Read Return Policy
                  </Button>
                </div>

                {returnRequestedOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
                      Active Return Requests
                    </h3>
                    <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
                      {returnRequestedOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                            <p className="text-xs text-[var(--ks-warning)] font-medium">
                              {ord.currentStage} · {ord.estimatedArrival}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                          >
                            View Timeline
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
                    Eligible Delivered Orders
                  </h3>
                  {returnEligibleOrders.length === 0 ? (
                    <EmptyState
                      icon={<RotateCcw className="w-5 h-5" />}
                      title="No delivered orders eligible for new returns"
                      description="Once an order is marked Delivered, you may initiate a return pickup request here."
                      actionLabel="View All Orders"
                      onAction={() => switchSection('orders')}
                    />
                  ) : (
                    <div className="space-y-4">
                      {returnEligibleOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                              <p className="text-xs text-[var(--ks-text-secondary)]">
                                Delivered · {ord.items.length} item(s) ·{' '}
                                {ord.currencySnapshot
                                  ? formatDirectCurrency(
                                      ord.currencySnapshot.chargedTotal,
                                      ord.currencySnapshot.transactionCurrency
                                    )
                                  : formatCurrency(ord.total, currency)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={returnReasonMap[ord.id] || ''}
                              onChange={(e) =>
                                setReturnReasonMap((prev) => ({
                                  ...prev,
                                  [ord.id]: e.target.value,
                                }))
                              }
                              placeholder="Reason for return (e.g., damaged parcel, wrong variant)"
                              className="flex-1 h-9 px-3 text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                requestOrderReturn(
                                  ord.id,
                                  returnReasonMap[ord.id]?.trim() ||
                                    'Return requested via Customer Account'
                                )
                              }
                            >
                              Request Return Pickup
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === 'support' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-medium">Customer Support</h2>
                  <p className="text-xs text-[var(--ks-text-secondary)]">
                    Direct assistance for orders, courier issues, warranty claims, and Bangladesh payment inquiries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-left hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">Track an Order</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      Inspect courier milestones with your Order ID.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'customer-support-policy' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-left hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">Grievance &amp; SLA Policy</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      Response timelines &amp; escalation channels.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'faq' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-left hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">Help &amp; FAQ</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      Shipping zones, COD limits &amp; returns guide.
                    </p>
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!supportSubject.trim() || supportMessage.trim().length < 5) {
                      showToast(
                        'Incomplete message',
                        'Enter an order ID or topic and details (5+ characters).',
                        'error'
                      );
                      return;
                    }
                    setSupportSubmitting(true);
                    try {
                      const inquiry = await submitSupportInquiryApi({
                        name: profile.fullName || 'Account Member',
                        email: profile.email || 'support@kintostudio.bd',
                        phone: profile.phone || undefined,
                        topic: supportSubject.trim(),
                        orderId: supportSubject.trim().toUpperCase().startsWith('KS-')
                          ? supportSubject.trim().toUpperCase()
                          : undefined,
                        message: supportMessage.trim(),
                      });
                      setLastTicketRef(inquiry.ticketRef);
                      setSupportSubject('');
                      setSupportMessage('');
                      showToast(
                        `Support ticket ${inquiry.ticketRef} logged`,
                        'Our Dhaka customer care team will reply to your email within 1 business day.',
                        'success'
                      );
                    } catch (err) {
                      showToast(
                        'Could not log ticket',
                        err instanceof Error ? err.message : 'Try again shortly.',
                        'error'
                      );
                    } finally {
                      setSupportSubmitting(false);
                    }
                  }}
                  className="p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-4 max-w-xl"
                >
                  <p className="text-sm font-semibold">
                    Send Support Request (Desk: support@kintostudio.bd)
                  </p>
                  {lastTicketRef && (
                    <p className="text-xs text-[var(--ks-success)] font-mono-num">
                      Latest logged ticket reference: {lastTicketRef}
                    </p>
                  )}
                  <Input
                    label="Order ID or Topic"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g., Order #KS-10482 delivery schedule"
                  />
                  <Textarea
                    label="Message"
                    required
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your question or shipment issue..."
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={supportSubmitting}>
                    {supportSubmitting ? 'Logging Ticket...' : 'Submit Support Request'}
                  </Button>
                </form>
              </div>
            )}

            {section === 'security' && (
              <div className="space-y-10 max-w-xl">
                {/* Password Update */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentPwd || newPwd.length < 8 || newPwd !== confirmPwd) {
                      setPwdError(
                        'Enter your current password and ensure the new password is at least 8 characters and matches.'
                      );
                      return;
                    }
                    setPwdError('');
                    setPwdSaving(true);
                    const res = await changePassword(currentPwd, newPwd);
                    setPwdSaving(false);
                    if (res.ok) {
                      setCurrentPwd('');
                      setNewPwd('');
                      setConfirmPwd('');
                    } else if (res.error) {
                      setPwdError(res.error);
                    }
                  }}
                  className="space-y-4 pb-8 border-b border-[var(--ks-border)]"
                >
                  <h2 className="font-display text-2xl font-medium">Account Security</h2>
                  <Input
                    label="Current Password"
                    type="password"
                    required
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    required
                    helperText="Minimum 8 characters."
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    error={pwdError}
                  />
                  <Button type="submit" variant="primary" size="md" disabled={pwdSaving}>
                    {pwdSaving ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>

                {/* Notifications */}
                <div className="space-y-4 pb-8 border-b border-[var(--ks-border)]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--ks-accent)]" />
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                  </div>
                  <div className="space-y-3">
                    <Checkbox
                      label="Order & Courier Dispatch Updates"
                      description="Receive stage transitions from confirmation through delivery."
                      checked={notificationPrefs.orderUpdates}
                      onChange={(v) =>
                        setNotificationPrefs({ ...notificationPrefs, orderUpdates: v })
                      }
                    />
                    <Checkbox
                      label="Restock Alerts"
                      description="Be notified when wishlisted items return to stock."
                      checked={notificationPrefs.restockAlerts}
                      onChange={(v) =>
                        setNotificationPrefs({ ...notificationPrefs, restockAlerts: v })
                      }
                    />
                    <Checkbox
                      label="Studio Journal Updates"
                      description="Periodic notes across departments and curated collections."
                      checked={notificationPrefs.studioJournal}
                      onChange={(v) =>
                        setNotificationPrefs({ ...notificationPrefs, studioJournal: v })
                      }
                    />
                  </div>
                </div>

                {/* Privacy & Cookie Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--ks-accent)]" />
                    <h3 className="text-lg font-medium">Privacy &amp; Cookie Consent</h3>
                  </div>
                  <div className="space-y-3">
                    <Checkbox
                      label="Save Local Search History"
                      description="Keep recent catalog searches on this device for quicker lookup."
                      checked={privacyPrefs.saveSearchHistory}
                      onChange={(v) =>
                        setPrivacyPrefs({ ...privacyPrefs, saveSearchHistory: v })
                      }
                    />
                    <Checkbox
                      label="Personalized Recommendations"
                      description="Display related objects based on recently viewed items."
                      checked={privacyPrefs.personalizedCatalog}
                      onChange={(v) =>
                        setPrivacyPrefs({ ...privacyPrefs, personalizedCatalog: v })
                      }
                    />
                  </div>
                  <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Cookie Consent Status</span>
                      <span className="font-mono-num capitalize text-[var(--ks-accent)]">
                        {cookieConsent.status === 'unset'
                          ? 'Pending Selection'
                          : cookieConsent.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={openCookiePreferences}>
                        Cookie Preferences
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ name: 'legal' })}
                      >
                        Open Legal Center
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${selectedOrder.id}` : ''}
      >
        {selectedOrder && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[var(--ks-text-muted)]">Courier &amp; Tracking</p>
                <p className="font-medium mt-0.5">{selectedOrder.courierName}</p>
                <p className="font-mono-num text-[var(--ks-text-secondary)]">
                  {selectedOrder.trackingNumber}
                </p>
                {selectedOrder.transactionRef && (
                  <p className="font-mono-num text-[var(--ks-accent)] mt-1">
                    Ref: {selectedOrder.transactionRef} ({selectedOrder.paymentStatus})
                  </p>
                )}
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">Shipping Destination</p>
                <p className="font-medium mt-0.5">{selectedOrder.shippingAddress.streetAddress}</p>
                <p className="text-[var(--ks-text-secondary)]">
                  {[
                    selectedOrder.shippingAddress.area,
                    selectedOrder.shippingAddress.upazila,
                    selectedOrder.shippingAddress.city,
                    selectedOrder.shippingAddress.state,
                    selectedOrder.shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  · {selectedOrder.shippingAddress.country}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-[var(--ks-divider)] border-y border-[var(--ks-border)]">
              {selectedOrder.items.map((item) => (
                <li key={item.key} className="py-3 flex items-baseline justify-between gap-4">
                  <span className="min-w-0">
                    {item.name} × {item.quantity} ({item.color})
                  </span>
                  <span className="font-mono-num font-medium shrink-0 text-right">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-4 font-semibold text-base">
                <span className="min-w-0">Settled Total ({selectedOrder.paymentLabel})</span>
                <span className="font-mono-num shrink-0 text-right">
                  {selectedOrder.currencySnapshot
                    ? formatDirectCurrency(
                        selectedOrder.currencySnapshot.chargedTotal,
                        selectedOrder.currencySnapshot.transactionCurrency
                      )
                    : formatCurrency(selectedOrder.total, currency)}
                </span>
              </div>
              {selectedOrder.currencySnapshot && (
                <p className="text-[11px] font-mono-num text-[var(--ks-text-muted)]">
                  Snapshot: 1 USD = ৳{selectedOrder.currencySnapshot.exchangeRate} ·{' '}
                  {selectedOrder.currencySnapshot.rateSource}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
