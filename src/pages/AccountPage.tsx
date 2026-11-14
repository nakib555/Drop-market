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
  Shield,
  ShoppingBag,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types/commerce';
import { formatCurrency, formatShortDate } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Checkbox, Input } from '../components/ui/FormFields';
import { Breadcrumb, Modal, ResilientImage } from '../components/ui/Primitives';

type AccountSection =
  | 'overview'
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
    updateProfile,
    logoutDemo,
    loginDemo,
    orders,
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

  const [section, setSection] = useState<AccountSection>(
    (route.accountTab as AccountSection) || 'overview'
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit profile state
  const [nameInput, setNameInput] = useState(profile.fullName);
  const [emailInput, setEmailInput] = useState(profile.email);
  const [phoneInput, setPhoneInput] = useState(profile.phone);

  useEffect(() => {
    setNameInput(profile.fullName);
    setEmailInput(profile.email);
    setPhoneInput(profile.phone);
  }, [profile.fullName, profile.email, profile.phone]);

  useEffect(() => {
    if (route.accountTab) {
      setSection(route.accountTab as AccountSection);
    }
  }, [route.accountTab]);

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

  // Guest login form
  const [loginEmail, setLoginEmail] = useState(profile.email);

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const authoredReviews = products.flatMap((p) =>
    p.reviews.map((r) => ({ ...r, productName: p.name, productSlug: p.slug }))
  );

  if (!profile.isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-[#84827B]">Studio Account</p>
            <h1 className="font-display text-3xl font-medium">Sign In to Kinto Studio</h1>
            <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
              Demo session access: restore your local profile, saved addresses, and order history.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginDemo(loginEmail);
            }}
            className="space-y-4"
          >
            <Input
              label="Email Address"
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Sign In (Local Demo Session)
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: { id: AccountSection; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', Icon: User },
    { id: 'profile', label: 'Personal Information', Icon: User },
    { id: 'password', label: 'Change Password', Icon: Lock },
    { id: 'addresses', label: 'Address Book', Icon: MapPin },
    { id: 'orders', label: 'Order History', Icon: Package },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart },
    { id: 'reviews', label: 'Product Reviews', Icon: Star },
    { id: 'payments', label: 'Payment Methods', Icon: CreditCard },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'privacy', label: 'Privacy Settings', Icon: Shield },
  ];

  const switchSection = (next: AccountSection) => {
    setSection(next);
    navigate({ name: 'account', accountTab: next });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Customer Account' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67]">
            {profile.studioRole}
          </p>
          <h1 className="font-display text-[clamp(1.85rem,3.5vw,3rem)] font-medium mt-1">
            Welcome, {profile.fullName}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={logoutDemo}>
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Scrollable horizontal nav on mobile/tablet; sidebar on desktop */}
        <aside className="lg:col-span-3 p-2 sm:p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <nav
            aria-label="Account sections"
            className="flex overflow-x-auto lg:flex-col gap-1.5 pb-1 lg:pb-0"
          >
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchSection(id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 min-h-[40px] rounded-md text-xs sm:text-sm font-medium text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  section === id
                    ? 'bg-[#171716] text-white dark:bg-[#F4F3EF] dark:text-[#171716]'
                    : 'text-[#5C5B57] dark:text-[#B4B2AC] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Active Dashboard Panel */}
        <div className="lg:col-span-9 p-5 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-6">
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
                  <p className="text-xs text-[#84827B]">Saved Addresses</p>
                  <p className="font-mono-num text-2xl font-semibold mt-1">{addresses.length}</p>
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
                      <div className="flex items-center gap-3">
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
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile({
                  fullName: nameInput.trim(),
                  email: emailInput.trim(),
                  phone: phoneInput.trim(),
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
                showToast('Password updated', 'Your local session credentials have been refreshed.', 'success');
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
                {orders.map((ord) => (
                  <div key={ord.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-mono-num font-semibold">Order #{ord.id}</p>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                        Placed {formatShortDate(ord.createdAt)} · {ord.items.length} item(s) ·{' '}
                        <span className="font-medium text-[#171716] dark:text-[#F4F3EF]">
                          {ord.currentStage}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono-num font-semibold">
                        {formatCurrency(ord.total, currency)}
                      </span>
                      <Button variant="outline" size="xs" onClick={() => setSelectedOrder(ord)}>
                        Details
                      </Button>
                      <Button
                        variant="primary"
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
