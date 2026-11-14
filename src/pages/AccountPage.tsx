import React, { useEffect, useState } from 'react';
import {
  Bell,
  CreditCard,
  Heart,
  Lock,
  LogOut,
  MapPin,
  Package,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AdminDashboard } from '../components/account/AdminDashboard';
import { SellerDashboard } from '../components/account/SellerDashboard';
import { AuthPanel } from '../components/auth/AuthPanel';
import { Button } from '../components/ui/Button';
import { Checkbox, Input } from '../components/ui/FormFields';
import { Breadcrumb, Modal, ResilientImage } from '../components/ui/Primitives';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/commerce';
import { formatCurrency, formatShortDate } from '../utils/format';
import { STUDIO_TRANSITION } from '../utils/motion';

type AccountSection =
  | 'overview'
  | 'seller-hub'
  | 'admin-console'
  | 'profile'
  | 'password'
  | 'addresses'
  | 'orders'
  | 'wishlist'
  | 'reviews'
  | 'notifications'
  | 'payments'
  | 'privacy';

export const AccountPage: React.FC = () => {
  const {
    currency,
    route,
    navigate,
    profile,
    authAccounts,
    updateProfile,
    logoutDemo,
    switchDemoAccount,
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
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    notificationPrefs,
    setNotificationPrefs,
    privacyPrefs,
    setPrivacyPrefs,
    showToast,
  } = useStore();

  const initialTab: AccountSection =
    route.name === 'seller'
      ? 'seller-hub'
      : route.name === 'admin'
      ? 'admin-console'
      : (route.accountTab as AccountSection) || 'overview';

  const [section, setSection] = useState<AccountSection>(initialTab);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit profile state
  const [nameInput, setNameInput] = useState(profile.fullName);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [phoneInput, setPhoneInput] = useState(profile.phone);
  const [studioInput, setStudioInput] = useState(profile.studioName || '');

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
      setSection(route.accountTab as AccountSection);
    }
  }, [route.name, route.accountTab]);

  // Change password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Add address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');

  // Add payment card form
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardExp, setCardExp] = useState('');

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const authoredReviews = products.flatMap((p) =>
    p.reviews.map((r) => ({ ...r, productName: p.name, productSlug: p.slug }))
  );

  const primaryRoleAccounts = ['customer', 'seller', 'admin']
    .map((roleKey) => authAccounts.find((a) => a.role === roleKey))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  if (!profile.isAuthenticated || route.name === 'login') {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: () => navigate({ name: 'home' }) },
            { label: 'Sign In & Marketplace Portals' },
          ]}
        />

        <div className="max-w-2xl space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8F6438] dark:text-[#C89B67] font-medium">
            Kinto Studio Access
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-medium tracking-tight">
            Account Sign In &amp; Role Portals
          </h1>
          <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
            Sign in or select a role workspace below to unlock your Customer Orders, Wishlist, Seller Studio inventory, or Platform Admin Console.
          </p>
        </div>

        {profile.isAuthenticated && route.name === 'login' && (
          <div className="p-4 sm:p-5 rounded-lg bg-[#F2F0EC] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
                Active Session Detected
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
              Continue to Active Pages →
            </Button>
          </div>
        )}

        <AuthPanel
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
    { id: 'overview', label: 'Overview', Icon: User, visible: true },
    {
      id: 'seller-hub',
      label: 'Seller Studio',
      Icon: Store,
      visible: profile.role === 'seller' || profile.role === 'admin',
    },
    {
      id: 'admin-console',
      label: 'Admin Console',
      Icon: ShieldCheck,
      visible: profile.role === 'admin',
    },
    { id: 'orders', label: 'Order History', Icon: Package, visible: true },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart, visible: true },
    { id: 'addresses', label: 'Address Book', Icon: MapPin, visible: true },
    { id: 'payments', label: 'Payment Methods', Icon: CreditCard, visible: true },
    { id: 'profile', label: 'Personal Information', Icon: User, visible: true },
    { id: 'password', label: 'Change Password', Icon: Lock, visible: true },
    { id: 'reviews', label: 'Product Reviews', Icon: Star, visible: true },
    { id: 'notifications', label: 'Notifications', Icon: Bell, visible: true },
    { id: 'privacy', label: 'Privacy Settings', Icon: Shield, visible: true },
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          {
            label:
              section === 'admin-console'
                ? 'Admin Console'
                : section === 'seller-hub'
                ? 'Seller Studio'
                : 'Account Workspace',
          },
        ]}
      />

      {/* Header with Live API Role Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
            {profile.studioRole}
            {profile.studioName ? ` · ${profile.studioName}` : ''}
          </p>
          <h1 className="font-display text-[clamp(1.85rem,3.5vw,3rem)] font-medium mt-1">
            Welcome, {profile.fullName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryRoleAccounts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-md bg-[#F2F0EC] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
              <span className="text-[11px] text-[#84827B] px-2 inline-flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Role:
              </span>
              {primaryRoleAccounts.map((acc) => {
                const active = profile.role === acc.role;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={async () => {
                      const ok = await switchDemoAccount(acc.id);
                      if (ok) {
                        if (acc.role === 'seller') switchSection('seller-hub');
                        else if (acc.role === 'admin') switchSection('admin-console');
                        else switchSection('overview');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium capitalize cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#171716] text-white dark:bg-[#F4F3EF] dark:text-[#171716]'
                        : 'text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                    }`}
                  >
                    {acc.role}
                  </button>
                );
              })}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={logoutDemo}>
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Role-aware Sidebar */}
        <aside className="lg:col-span-3 p-2 sm:p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
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
                    className={`relative flex items-center gap-2.5 px-3.5 py-2.5 min-h-[40px] rounded-md text-xs sm:text-sm font-medium text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'text-white dark:text-[#171716]'
                        : 'text-[#5C5B57] dark:text-[#B4B2AC] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="account-nav-pill"
                        transition={STUDIO_TRANSITION.springTab}
                        className="absolute inset-0 rounded-md bg-[#171716] dark:bg-[#F4F3EF]"
                      />
                    )}
                    <Icon className="w-4 h-4 shrink-0 relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
          </nav>
        </aside>

        {/* Active Panel */}
        <div className="lg:col-span-9 p-5 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={STUDIO_TRANSITION.fast}
            >
          {section === 'seller-hub' &&
            (profile.role === 'seller' || profile.role === 'admin' ? (
              <SellerDashboard />
            ) : (
              <div className="py-10 text-center space-y-4 max-w-md mx-auto">
                <Store className="w-7 h-7 mx-auto text-[#8F6438] dark:text-[#C89B67]" />
                <h2 className="font-display text-2xl font-medium">Seller Studio Access Required</h2>
                <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
                  Switch to a Verified Seller Studio account from the role bar above to manage inventory and dispatch orders.
                </p>
                {primaryRoleAccounts.find((a) => a.role === 'seller') && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      const seller = primaryRoleAccounts.find((a) => a.role === 'seller');
                      if (seller) switchDemoAccount(seller.id);
                    }}
                  >
                    Switch to Seller Studio Account
                  </Button>
                )}
              </div>
            ))}

          {section === 'admin-console' &&
            (profile.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <div className="py-10 text-center space-y-4 max-w-md mx-auto">
                <ShieldCheck className="w-7 h-7 mx-auto text-[#8F6438] dark:text-[#C89B67]" />
                <h2 className="font-display text-2xl font-medium">Platform Admin Access Required</h2>
                <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
                  Administrator privileges are required to moderate sellers, users, and dynamic marketplace departments.
                </p>
                {primaryRoleAccounts.find((a) => a.role === 'admin') && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      const admin = primaryRoleAccounts.find((a) => a.role === 'admin');
                      if (admin) switchDemoAccount(admin.id);
                    }}
                  >
                    Switch to Platform Admin Account
                  </Button>
                )}
              </div>
            ))}

          {section === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
                  <p className="text-xs text-[#84827B]">Total Orders</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{orders.length}</p>
                </div>
                <div className="p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
                  <p className="text-xs text-[#84827B]">Saved Wishlist</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{wishlistedProducts.length}</p>
                </div>
                <div className="p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
                  <p className="text-xs text-[#84827B]">Account Role</p>
                  <p className="font-mono-num text-xl font-semibold mt-1 capitalize">{profile.role}</p>
                </div>
              </div>

              {(profile.role === 'seller' || profile.role === 'admin') && (
                <div className="p-5 rounded-md bg-[#F2F0EC] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
                      Active Workspace Shortcut
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {profile.role === 'admin'
                        ? 'Open Platform Admin Console to moderate orders, sellers & categories.'
                        : 'Open Seller Studio to update inventory stock, prices, or fulfill shipments.'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      switchSection(profile.role === 'admin' ? 'admin-console' : 'seller-hub')
                    }
                  >
                    {profile.role === 'admin' ? 'Open Admin Console' : 'Open Seller Studio'}
                  </Button>
                </div>
              )}

              {/* Quick Launcher for All Post-Login Pages */}
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-medium">Your Account Pages</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'orders' as AccountSection,
                      title: 'Order History',
                      desc: `${orders.length} orders · Track, reorder & returns`,
                      Icon: Package,
                      visible: true,
                    },
                    {
                      id: 'wishlist' as AccountSection,
                      title: 'Saved Wishlist',
                      desc: `${wishlistedProducts.length} saved pieces`,
                      Icon: Heart,
                      visible: true,
                    },
                    {
                      id: 'addresses' as AccountSection,
                      title: 'Address Book',
                      desc: `${addresses.length} shipping destinations`,
                      Icon: MapPin,
                      visible: true,
                    },
                    {
                      id: 'payments' as AccountSection,
                      title: 'Payment Methods',
                      desc: `${paymentMethods.length} saved cards`,
                      Icon: CreditCard,
                      visible: true,
                    },
                    {
                      id: 'profile' as AccountSection,
                      title: 'Personal Information',
                      desc: 'Name, email & contact phone',
                      Icon: User,
                      visible: true,
                    },
                    {
                      id: 'notifications' as AccountSection,
                      title: 'Notifications & Alerts',
                      desc: 'Dispatch, restock & journal prefs',
                      Icon: Bell,
                      visible: true,
                    },
                    {
                      id: 'seller-hub' as AccountSection,
                      title: 'Seller Studio',
                      desc: 'Inventory, listings & dispatch',
                      Icon: Store,
                      visible: profile.role === 'seller' || profile.role === 'admin',
                    },
                    {
                      id: 'admin-console' as AccountSection,
                      title: 'Admin Console',
                      desc: 'Platform GMV, sellers & categories',
                      Icon: ShieldCheck,
                      visible: profile.role === 'admin',
                    },
                  ]
                    .filter((card) => card.visible)
                    .map(({ id, title, desc, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => switchSection(id)}
                        className="group p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#8F6438] dark:hover:border-[#C89B67] text-left transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <span className="w-8 h-8 rounded bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-center text-[#8F6438] dark:text-[#C89B67] shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:text-[#8F6438] dark:group-hover:text-[#C89B67] transition-colors">
                            {title}
                          </p>
                          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 truncate">
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
                    className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
                  >
                    View all orders
                  </button>
                </div>
                <div className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                          {formatShortDate(ord.createdAt)} · {ord.currentStage}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-mono-num font-medium">
                          {formatCurrency(ord.total, currency)}
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
              </div>
            </div>
          )}

          {section === 'profile' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
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
              />
              <Button type="submit" variant="primary" size="md">
                Save Profile Changes
              </Button>
            </form>
          )}

          {section === 'password' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!currentPwd || newPwd.length < 8 || newPwd !== confirmPwd) {
                  setPwdError('Ensure new password is at least 8 characters and matches confirmation.');
                  return;
                }
                setPwdError('');
                setCurrentPwd('');
                setNewPwd('');
                setConfirmPwd('');
                showToast('Password updated', 'Your session credentials have been refreshed.', 'success');
              }}
              className="max-w-lg space-y-5"
            >
              <h2 className="font-display text-2xl font-medium">Change Password</h2>
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
              <Button type="submit" variant="primary" size="md">
                Update Password
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
                    if (!addrLabel.trim() || !addrStreet.trim() || !addrCity.trim()) return;
                    saveAddress({
                      label: addrLabel.trim(),
                      fullName: profile.fullName,
                      phone: profile.phone,
                      country: 'United States',
                      state: addrState.trim() || 'CA',
                      city: addrCity.trim(),
                      area: addrCity.trim(),
                      streetAddress: addrStreet.trim(),
                      postalCode: addrZip.trim() || '94115',
                      isDefault: false,
                    });
                    setAddrLabel('');
                    setAddrStreet('');
                    setAddrCity('');
                    setAddrState('');
                    setAddrZip('');
                    setShowAddrForm(false);
                  }}
                  className="p-5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Label (e.g., Residence, Loft)"
                      required
                      value={addrLabel}
                      onChange={(e) => setAddrLabel(e.target.value)}
                    />
                    <Input
                      label="Street Address"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                    />
                    <Input
                      label="City"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="State"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                      />
                      <Input
                        label="Postal Code"
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    Save Address
                  </Button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{addr.label}</p>
                        {addr.isDefault && (
                          <span className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{addr.streetAddress}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] text-xs">
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
                        className="text-[#84827B] hover:text-[#B91C1C] cursor-pointer ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'orders' && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-medium">Order History</h2>
              <div className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
                {orders.map((ord) => {
                  const canCancel = ['Confirmed', 'Processing'].includes(ord.currentStage);
                  const canReturn = ord.currentStage === 'Delivered';
                  return (
                    <div key={ord.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                          Placed {formatShortDate(ord.createdAt)} · {ord.items.length} item(s) ·{' '}
                          <span
                            className={`font-medium ${
                              ord.currentStage === 'Cancelled'
                                ? 'text-[#B91C1C] dark:text-[#F87171]'
                                : ord.currentStage === 'Return Requested'
                                ? 'text-[#B45309] dark:text-[#FBBF24]'
                                : 'text-[#171716] dark:text-[#F4F3EF]'
                            }`}
                          >
                            {ord.currentStage}
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-mono-num font-semibold mr-1">
                          {formatCurrency(ord.total, currency)}
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
                            className="text-[#B91C1C] dark:text-[#F87171]"
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
            </div>
          )}

          {section === 'wishlist' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-medium">
                  Saved Wishlist ({wishlistedProducts.length})
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigate({ name: 'wishlist' })}>
                  Open Dedicated Wishlist
                </Button>
              </div>
              {wishlistedProducts.length === 0 ? (
                <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
                  No objects saved yet. Tap the heart icon on any piece to save it here.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedProducts.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] flex gap-4 items-center"
                    >
                      <ResilientImage
                        src={item.images[0]}
                        alt={item.name}
                        onClick={() => navigate({ name: 'product', slug: item.slug })}
                        className="w-20 h-16 rounded-sm object-cover shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p
                          onClick={() => navigate({ name: 'product', slug: item.slug })}
                          className="text-sm font-medium truncate cursor-pointer hover:text-[#8F6438] dark:hover:text-[#C89B67]"
                        >
                          {item.name}
                        </p>
                        <p className="text-xs font-mono-num font-semibold">
                          {formatCurrency(item.price, currency)}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() =>
                              addToCart(
                                item,
                                item.colors[0].name,
                                item.colors[0].hex,
                                item.sizes[0],
                                1,
                                true
                              )
                            }
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Add</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(item)}
                            className="text-xs text-[#84827B] hover:text-[#B91C1C] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === 'reviews' && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-medium">Community &amp; Verified Reviews</h2>
              <div className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                {authoredReviews.slice(0, 6).map((rev) => (
                  <div key={rev.id} className="py-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#84827B]">
                      <button
                        type="button"
                        onClick={() => navigate({ name: 'product', slug: rev.productSlug })}
                        className="font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
                      >
                        {rev.productName}
                      </button>
                      <span className="font-mono-num">{rev.rating}.0 / 5.0</span>
                    </div>
                    <p className="text-sm font-medium">{rev.title}</p>
                    <p className="text-xs text-[#5C5B57] dark:text-[#B4B2AC]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'payments' && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-medium">Saved Payment Methods (Demo)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-4 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium font-mono-num">
                        {pm.brand} •••• {pm.last4}
                      </p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        Expires {pm.expiry} {pm.isDefault ? '· Default' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!pm.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultPaymentMethod(pm.id)}
                          className="text-xs hover:underline cursor-pointer"
                        >
                          Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deletePaymentMethod(pm.id)}
                        aria-label="Remove payment card"
                        className="text-[#84827B] hover:text-[#B91C1C] cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (cardLast4.length !== 4 || !cardExp.trim()) return;
                  addPaymentMethod({
                    brand: cardBrand,
                    last4: cardLast4,
                    expiry: cardExp,
                    holderName: profile.fullName,
                    isDefault: false,
                  });
                  setCardLast4('');
                  setCardExp('');
                }}
                className="p-4 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <Input label="Card Network" value={cardBrand} onChange={(e) => setCardBrand(e.target.value)} />
                <Input
                  label="Last 4 Digits"
                  maxLength={4}
                  placeholder="9012"
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                />
                <Input
                  label="Expiry (MM/YY)"
                  placeholder="09/29"
                  value={cardExp}
                  onChange={(e) => setCardExp(e.target.value)}
                />
                <Button type="submit" variant="primary" size="md">
                  Add Card
                </Button>
              </form>
            </div>
          )}

          {section === 'notifications' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="font-display text-2xl font-medium">Notification Preferences</h2>
              <div className="space-y-4">
                <Checkbox
                  label="Order & Courier Dispatch Updates"
                  description="Receive stage transitions from processing through white-glove delivery."
                  checked={notificationPrefs.orderUpdates}
                  onChange={(v) => setNotificationPrefs({ ...notificationPrefs, orderUpdates: v })}
                />
                <Checkbox
                  label="Kiln & Atelier Restock Alerts"
                  description="Be notified when small-batch ceramics and timber editions return."
                  checked={notificationPrefs.restockAlerts}
                  onChange={(v) => setNotificationPrefs({ ...notificationPrefs, restockAlerts: v })}
                />
                <Checkbox
                  label="Studio Journal Monograph"
                  description="Monthly essays on acoustic craft, textiles, botanical skincare, and interiors."
                  checked={notificationPrefs.studioJournal}
                  onChange={(v) => setNotificationPrefs({ ...notificationPrefs, studioJournal: v })}
                />
                <Checkbox
                  label="Private Archive & Trade Offers"
                  description="Seasonal invitations to floor-sample releases."
                  checked={notificationPrefs.privateOffers}
                  onChange={(v) => setNotificationPrefs({ ...notificationPrefs, privateOffers: v })}
                />
              </div>
            </div>
          )}

          {section === 'privacy' && (
            <div className="space-y-5 max-w-lg">
              <h2 className="font-display text-2xl font-medium">Privacy Settings</h2>
              <div className="space-y-4">
                <Checkbox
                  label="Save Local Search History"
                  description="Keep recent catalog searches on this device for quicker lookup."
                  checked={privacyPrefs.saveSearchHistory}
                  onChange={(v) => setPrivacyPrefs({ ...privacyPrefs, saveSearchHistory: v })}
                />
                <Checkbox
                  label="Personalized Object Recommendations"
                  description="Display related objects based on recently viewed items."
                  checked={privacyPrefs.personalizedCatalog}
                  onChange={(v) => setPrivacyPrefs({ ...privacyPrefs, personalizedCatalog: v })}
                />
                <Checkbox
                  label="Anonymous Performance Diagnostics"
                  description="Help refine storefront speed and responsiveness."
                  checked={privacyPrefs.analyticsOptIn}
                  onChange={(v) => setPrivacyPrefs({ ...privacyPrefs, analyticsOptIn: v })}
                />
              </div>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
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
                <p className="text-[#84827B]">Courier &amp; Tracking</p>
                <p className="font-medium mt-0.5">{selectedOrder.courierName}</p>
                <p className="font-mono-num text-[#5C5B57] dark:text-[#A3A19B]">
                  {selectedOrder.trackingNumber}
                </p>
              </div>
              <div>
                <p className="text-[#84827B]">Shipping Destination</p>
                <p className="font-medium mt-0.5">{selectedOrder.shippingAddress.streetAddress}</p>
                <p className="text-[#5C5B57] dark:text-[#A3A19B]">
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                  {selectedOrder.shippingAddress.postalCode}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28]">
              {selectedOrder.items.map((item) => (
                <li key={item.key} className="py-3 flex justify-between gap-4">
                  <span>
                    {item.name} × {item.quantity} ({item.color})
                  </span>
                  <span className="font-mono-num font-medium">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between font-semibold text-base">
              <span>Total Paid ({selectedOrder.paymentLabel})</span>
              <span className="font-mono-num">{formatCurrency(selectedOrder.total, currency)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
