import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
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
  X,
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
  const [confirmDeleteAddrId, setConfirmDeleteAddrId] = useState<string | null>(null);
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
            { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
            { label: t(language, 'signIn') },
          ]}
        />

        <div className="max-w-2xl space-y-2">
          <p className="ks-eyebrow text-[var(--ks-accent)]">{t(language, 'accountEyebrow')}</p>
          <h1 className="font-display text-3xl sm:text-5xl font-medium tracking-tight">
            {t(language, 'accountSignInHeadline')}
          </h1>
          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            {t(language, 'accountSignInDesc')}
          </p>
        </div>

        {profile.isAuthenticated && route.name === 'login' && (
          <div className="p-4 sm:p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                {t(language, 'activeSession')}
              </p>
              <p className="text-sm font-medium">
                {t(language, 'signedInAs', { name: profile.fullName, role: profile.studioRole })}
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
              <span>{t(language, 'openActiveWorkspace')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
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

  const navGroups: {
    groupTitle: string;
    items: {
      id: AccountSection;
      label: string;
      desc: string;
      Icon: React.FC<{ className?: string }>;
      visible: boolean;
    }[];
  }[] = [
    {
      groupTitle: t(language, 'accountOverview'),
      items: [
        {
          id: 'overview',
          label: t(language, 'accountOverview'),
          desc: t(language, 'descOrdersCount', { count: orders.length }),
          Icon: User,
          visible: true,
        },
      ],
    },
    {
      groupTitle: t(language, 'ordersAndReturns'),
      items: [
        {
          id: 'orders',
          label: t(language, 'orders'),
          desc: t(language, 'descOrdersCount', { count: orders.length }),
          Icon: Package,
          visible: true,
        },
        {
          id: 'returns',
          label: t(language, 'returns'),
          desc: t(language, 'descReturnsStatus', {
            active: returnRequestedOrders.length,
            eligible: returnEligibleOrders.length,
          }),
          Icon: RotateCcw,
          visible: true,
        },
        {
          id: 'support',
          label: t(language, 'support'),
          desc: t(language, 'descSupport'),
          Icon: HelpCircle,
          visible: true,
        },
      ],
    },
    {
      groupTitle: t(language, 'accountGroupSaved'),
      items: [
        {
          id: 'wishlist',
          label: t(language, 'wishlist'),
          desc: t(language, 'descSavedCount', { count: wishlistedProducts.length }),
          Icon: Heart,
          visible: true,
        },
        {
          id: 'addresses',
          label: t(language, 'addresses'),
          desc: t(language, 'descSavedCount', { count: addresses.length }),
          Icon: MapPin,
          visible: true,
        },
        {
          id: 'payments',
          label: t(language, 'paymentMethods'),
          desc: t(language, 'descSavedCount', { count: paymentMethods.length }),
          Icon: CreditCard,
          visible: true,
        },
      ],
    },
    {
      groupTitle: t(language, 'accountGroupProfile'),
      items: [
        {
          id: 'profile',
          label: t(language, 'personalInfo'),
          desc: t(language, 'descProfile'),
          Icon: User,
          visible: true,
        },
        {
          id: 'security',
          label: t(language, 'accountSecurity'),
          desc: t(language, 'descSecurity'),
          Icon: Lock,
          visible: true,
        },
      ],
    },
    {
      groupTitle: t(language, 'accountGroupWorkspace'),
      items: [
        {
          id: 'seller-hub',
          label: t(language, 'sellerWorkspace'),
          desc: t(language, 'descSellerHub'),
          Icon: Store,
          visible: profile.role === 'seller' || profile.role === 'admin',
        },
        {
          id: 'admin-console',
          label: t(language, 'adminWorkspace'),
          desc: t(language, 'descAdminConsole'),
          Icon: ShieldCheck,
          visible: profile.role === 'admin',
        },
      ],
    },
  ];

  const activeNavItem =
    navGroups.flatMap((g) => g.items).find((item) => item.id === section) || navGroups[0].items[0];

  const switchSection = (next: AccountSection) => {
    setSection(next);
    setConfirmDeleteAddrId(null);
    if (next === 'seller-hub') {
      navigate({ name: 'seller' });
    } else if (next === 'admin-console') {
      navigate({ name: 'admin' });
    } else {
      navigate({ name: 'account', accountTab: next });
    }
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatUniqueAddressLine = (parts: Array<string | undefined>) => {
    const cleaned: string[] = [];
    for (const part of parts) {
      const trimmed = part?.trim();
      if (!trimmed) continue;
      if (cleaned[cleaned.length - 1]?.toLowerCase() === trimmed.toLowerCase()) continue;
      cleaned.push(trimmed);
    }
    return cleaned.join(', ');
  };

  return (
    <div className="ks-container py-5 sm:py-8 lg:py-12 space-y-5 lg:space-y-8">
      {/* Mobile Sticky Subpage Back Bar */}
      {section !== 'overview' && (
        <div className="lg:hidden sticky top-14 z-30 -mx-4 px-4 py-2 bg-[var(--ks-bg)]/95 backdrop-blur-md border-b border-[var(--ks-border)] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => switchSection('overview')}
            className="inline-flex items-center gap-1.5 min-h-[44px] -ms-1 px-2 rounded-[var(--ks-radius-md)] text-xs font-semibold text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t(language, 'backToAccount')}</span>
          </button>
          <span className="text-xs font-medium text-[var(--ks-text-secondary)] truncate">
            {activeNavItem?.label}
          </span>
        </div>
      )}

      <div className={section !== 'overview' ? 'hidden lg:block' : ''}>
        <Breadcrumb
          items={[
            { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
            {
              label:
                section === 'admin-console'
                  ? t(language, 'adminWorkspace')
                  : section === 'seller-hub'
                  ? t(language, 'sellerWorkspace')
                  : t(language, 'myAccount'),
            },
          ]}
        />
      </div>

      {/* Identity Header: Full Greeting on Overview / Desktop, Compact Bar on Mobile Subpages */}
      {section === 'overview' ? (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--ks-border)]">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
              {profile.studioRole}
              {profile.studioName ? ` · ${profile.studioName}` : ''}
            </p>
            <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium mt-1 truncate">
              {profile.fullName || t(language, 'myAccount')}
            </h1>
            <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 font-mono-num truncate">
              {profile.email}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => {
              signOut();
              navigate({ name: 'login' });
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t(language, 'signOut')}</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 lg:px-0 lg:py-0 lg:pb-4 rounded-[var(--ks-radius-md)] lg:rounded-none bg-[var(--ks-surface)] lg:bg-transparent border lg:border-0 lg:border-b border-[var(--ks-border)]">
          <div className="min-w-0 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface-muted)] flex items-center justify-center text-[var(--ks-accent)] shrink-0">
              <User className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {profile.fullName || t(language, 'myAccount')}
              </p>
              <p className="text-[11px] text-[var(--ks-accent)] font-medium truncate">
                {profile.studioRole}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              signOut();
              navigate({ name: 'login' });
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t(language, 'signOut')}</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Desktop Grouped Sticky Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 p-3 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <nav aria-label="Account sections" className="space-y-4">
            {navGroups
              .map((group) => ({
                ...group,
                items: group.items.filter((i) => i.visible),
              }))
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.groupTitle} className="space-y-1">
                  {group.items[0]?.id !== 'overview' && (
                    <p className="px-3 pt-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-[var(--ks-text-muted)]">
                      {group.groupTitle}
                    </p>
                  )}
                  {group.items.map(({ id, label, Icon }) => {
                    const active = section === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => switchSection(id)}
                        className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[42px] rounded-[var(--ks-radius-md)] text-sm font-medium text-start transition-colors cursor-pointer ${
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
                        <span className="relative z-10 truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
          </nav>
        </aside>

        {/* Active Section Content */}
        <div className="lg:col-span-9 p-4 sm:p-6 lg:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-6">
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
                <div className="py-10 text-center space-y-4 max-w-md mx-auto">
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
                <div className="py-10 text-center space-y-4 max-w-md mx-auto">
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
              <div className="space-y-7">
                {/* Summary KPI Strip */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                  <div className="p-3 sm:p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-[11px] sm:text-xs text-[var(--ks-text-muted)] truncate">
                      {t(language, 'orders')}
                    </p>
                    <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-0.5 sm:mt-1">
                      {orders.length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-[11px] sm:text-xs text-[var(--ks-text-muted)] truncate">
                      {t(language, 'wishlist')}
                    </p>
                    <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-0.5 sm:mt-1">
                      {wishlistedProducts.length}
                    </p>
                  </div>
                  <div className="p-3 sm:p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
                    <p className="text-[11px] sm:text-xs text-[var(--ks-text-muted)] truncate">
                      {t(language, 'addresses')}
                    </p>
                    <p className="font-mono-num text-xl sm:text-2xl font-semibold mt-0.5 sm:mt-1">
                      {addresses.length}
                    </p>
                  </div>
                </div>

                {(profile.role === 'seller' || profile.role === 'admin') && (
                  <div className="p-4 sm:p-5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)] font-medium">
                        {t(language, 'accountGroupWorkspace')}
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {profile.role === 'admin'
                          ? t(language, 'adminPromptDesc')
                          : t(language, 'sellerPromptDesc')}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        switchSection(profile.role === 'admin' ? 'admin-console' : 'seller-hub')
                      }
                    >
                      {profile.role === 'admin'
                        ? t(language, 'openAdminConsole')
                        : t(language, 'openSellerDashboard')}
                    </Button>
                  </div>
                )}

                {/* Mobile Grouped Vertical Section Directory (replaces clipped mobile horizontal strip) */}
                <div className="lg:hidden space-y-5">
                  {navGroups
                    .slice(1)
                    .map((group) => ({
                      ...group,
                      items: group.items.filter((i) => i.visible),
                    }))
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <div key={group.groupTitle} className="space-y-1.5">
                        <h2 className="px-1 text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--ks-text-muted)]">
                          {group.groupTitle}
                        </h2>
                        <div className="rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)]/55 divide-y divide-[var(--ks-border)] overflow-hidden">
                          {group.items.map(({ id, label, desc, Icon }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => switchSection(id)}
                              className="w-full min-h-[58px] px-3.5 py-2.5 flex items-center gap-3 text-start hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                            >
                              <span className="w-9 h-9 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-accent)] shrink-0">
                                <Icon className="w-4 h-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug truncate">
                                  {label}
                                </p>
                                <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 truncate">
                                  {desc}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[var(--ks-text-muted)] shrink-0 rtl:rotate-180" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Recent Orders */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl sm:text-2xl font-medium">
                      {t(language, 'recentOrders')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => switchSection('orders')}
                      className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-1 text-xs font-medium text-[var(--ks-accent)] hover:underline cursor-pointer"
                    >
                      {t(language, 'viewAllOrders')}
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-[var(--ks-text-secondary)] py-4 border-y border-[var(--ks-border)]">
                      {t(language, 'noOrdersPlaced')}
                    </p>
                  ) : (
                    <div className="divide-y divide-[var(--ks-divider)] border-y border-[var(--ks-border)]">
                      {orders.slice(0, 3).map((ord) => (
                        <div
                          key={ord.id}
                          className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-mono-num font-semibold">
                              {t(language, 'orderNumberPrefix', { id: ord.id })}
                            </p>
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
                              {t(language, 'trackShort')}
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
                    setProfileError(t(language, 'errFullNameRequired'));
                    return;
                  }
                  if (phoneInput.trim() && !isValidContactPhone(phoneInput.trim(), 'Bangladesh')) {
                    setProfileError(t(language, 'errBdPhoneFormat'));
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
                <h2 className="font-display text-2xl font-medium">{t(language, 'personalInfo')}</h2>
                <Input
                  label={t(language, 'fullNameLabel')}
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
                {profile.role === 'seller' && (
                  <Input
                    label={t(language, 'studioBrandLabel')}
                    autoComplete="organization"
                    enterKeyHint="next"
                    value={studioInput}
                    onChange={(e) => setStudioInput(e.target.value)}
                  />
                )}
                <Input
                  label={t(language, 'emailLabel')}
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Input
                  label={t(language, 'bdMobileLabel')}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="done"
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
                  {t(language, 'saveProfileChanges')}
                </Button>
              </form>
            )}

            {section === 'addresses' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-medium">
                    {t(language, 'addressBook')}
                  </h2>
                  <Button variant="primary" size="sm" onClick={() => setShowAddrForm((p) => !p)}>
                    {showAddrForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{showAddrForm ? t(language, 'cancelLabel') : t(language, 'addAddress')}</span>
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
                      {t(language, 'saveAddress')}
                    </Button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<MapPin className="w-5 h-5" />}
                    title={t(language, 'noSavedAddressesTitle')}
                    description={t(language, 'noSavedAddressesDesc')}
                    actionLabel={t(language, 'addDeliveryAddress')}
                    onAction={() => setShowAddrForm(true)}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => {
                      const confirmingRemove = confirmDeleteAddrId === addr.id;
                      const formattedRegion = formatUniqueAddressLine([
                        addr.area,
                        addr.upazila,
                        addr.city,
                        addr.state,
                        addr.postalCode,
                      ]);
                      return (
                        <div
                          key={addr.id}
                          className="p-4 sm:p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)]/50 flex flex-col justify-between gap-3.5"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{addr.label}</p>
                              {addr.isDefault && (
                                <span className="text-xs font-medium text-[var(--ks-accent)]">
                                  {t(language, 'defaultBadge')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--ks-text-primary)] leading-snug">
                              {addr.streetAddress}
                            </p>
                            <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                              {formattedRegion} · {addr.country}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-[var(--ks-border)] text-xs">
                            {confirmingRemove ? (
                              <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                                <span className="text-[var(--ks-error)] font-medium">
                                  {t(language, 'removeAddressPrompt')}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="destructive"
                                    size="xs"
                                    onClick={() => {
                                      deleteAddress(addr.id);
                                      setConfirmDeleteAddrId(null);
                                    }}
                                  >
                                    {t(language, 'confirmRemove')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => setConfirmDeleteAddrId(null)}
                                  >
                                    {t(language, 'cancelLabel')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {!addr.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => setDefaultAddress(addr.id)}
                                    className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-1 font-medium hover:underline cursor-pointer"
                                  >
                                    {t(language, 'setAsDefault')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteAddrId(addr.id)}
                                  className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-2 text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer ms-auto"
                                >
                                  {t(language, 'remove')}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === 'orders' && (
              <div className="space-y-5">
                <h2 className="font-display text-2xl font-medium">
                  {t(language, 'orderHistory')}
                </h2>
                {orders.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<Package className="w-5 h-5" />}
                    title={t(language, 'orders')}
                    description={t(language, 'noOrdersPlaced')}
                    actionLabel={t(language, 'exploreCatalog')}
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
                            <p className="text-sm font-mono-num font-semibold">
                              {t(language, 'orderNumberPrefix', { id: ord.id })}
                            </p>
                            <p className="text-xs text-[var(--ks-text-secondary)] leading-snug">
                              {formatShortDate(ord.createdAt)} · {ord.items.length} ·{' '}
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
                            <span className="text-sm font-mono-num font-semibold me-1">
                              {ord.currencySnapshot
                                ? formatDirectCurrency(
                                    ord.currencySnapshot.chargedTotal,
                                    ord.currencySnapshot.transactionCurrency
                                  )
                                : formatCurrency(ord.total, currency)}
                            </span>
                            <Button variant="outline" size="xs" onClick={() => setSelectedOrder(ord)}>
                              {t(language, 'detailsBtn')}
                            </Button>
                            <Button variant="outline" size="xs" onClick={() => reorderFromOrder(ord)}>
                              {t(language, 'reorderBtn')}
                            </Button>
                            {canCancel && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => cancelOrder(ord.id)}
                                className="text-[var(--ks-error)]"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>{t(language, 'cancelLabel')}</span>
                              </Button>
                            )}
                            {canReturn && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => requestOrderReturn(ord.id)}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{t(language, 'returnBtn')}</span>
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                            >
                              {t(language, 'trackShort')}
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
                    {t(language, 'savedWishlist')} ({wishlistedProducts.length})
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => navigate({ name: 'wishlist' })}>
                    {t(language, 'openFullWishlist')}
                  </Button>
                </div>
                {wishlistedProducts.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<Heart className="w-5 h-5" />}
                    title={t(language, 'noWishlistTitle')}
                    description={t(language, 'noWishlistDesc')}
                    actionLabel={t(language, 'exploreCatalog')}
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
                            aria-label={`${t(language, 'viewProduct')}: ${item.name}`}
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
                              className="text-sm font-medium truncate cursor-pointer hover:text-[var(--ks-accent)] text-start block w-full"
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
                                <span>{outOfStock ? t(language, 'outOfStock') : t(language, 'addShort')}</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => toggleWishlist(item)}
                                className="text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer min-h-[44px] sm:min-h-[36px] inline-flex items-center px-2"
                              >
                                {t(language, 'remove')}
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
                  <h2 className="font-display text-2xl font-medium">
                    {t(language, 'paymentMethods')}
                  </h2>
                  <p className="text-xs text-[var(--ks-text-secondary)]">
                    {t(language, 'tokenizedPaymentsNote')}
                  </p>
                </div>

                {paymentMethods.length === 0 ? (
                  <EmptyState
                    compact
                    icon={<CreditCard className="w-5 h-5" />}
                    title={t(language, 'noPaymentMethodsTitle')}
                    description={t(language, 'noPaymentMethodsDesc')}
                    actionLabel={t(language, 'reviewPaymentPolicy')}
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
                            {pm.provider} {pm.isDefault ? `· ${t(language, 'defaultBadge')}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!pm.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultPaymentMethod(pm.id)}
                              className="min-h-[44px] sm:min-h-[36px] inline-flex items-center px-1 text-xs hover:underline cursor-pointer"
                            >
                              {t(language, 'setDefaultBtn')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deletePaymentMethod(pm.id)}
                            aria-label={t(language, 'remove')}
                            className="w-10 h-10 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer"
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
                    <h2 className="font-display text-2xl font-medium">
                      {t(language, 'returnsRefunds')}
                    </h2>
                    <p className="text-xs text-[var(--ks-text-secondary)] mt-1">
                      {t(language, 'returnsRefundsDesc')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate({ name: 'return-policy' })}>
                    {t(language, 'readReturnPolicy')}
                  </Button>
                </div>

                {returnRequestedOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
                      {t(language, 'activeReturnRequests')}
                    </h3>
                    <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)]">
                      {returnRequestedOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-mono-num font-semibold">
                              {t(language, 'orderNumberPrefix', { id: ord.id })}
                            </p>
                            <p className="text-xs text-[var(--ks-warning)] font-medium">
                              {ord.currentStage} · {ord.estimatedArrival}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => navigate({ name: 'track-order', orderId: ord.id })}
                          >
                            {t(language, 'viewTimeline')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] font-medium">
                    {t(language, 'eligibleDeliveredOrders')}
                  </h3>
                  {returnEligibleOrders.length === 0 ? (
                    <EmptyState
                      compact
                      icon={<RotateCcw className="w-5 h-5" />}
                      title={t(language, 'noEligibleReturnsTitle')}
                      description={t(language, 'noEligibleReturnsDesc')}
                      actionLabel={t(language, 'viewAllOrdersBtn')}
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
                              <p className="text-sm font-mono-num font-semibold">
                                {t(language, 'orderNumberPrefix', { id: ord.id })}
                              </p>
                              <p className="text-xs text-[var(--ks-text-secondary)]">
                                {ord.currentStage} · {ord.items.length} ·{' '}
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
                              aria-label={t(language, 'returnReasonPlaceholder')}
                              value={returnReasonMap[ord.id] || ''}
                              onChange={(e) =>
                                setReturnReasonMap((prev) => ({
                                  ...prev,
                                  [ord.id]: e.target.value,
                                }))
                              }
                              placeholder={t(language, 'returnReasonPlaceholder')}
                              className="flex-1 min-h-[44px] px-3.5 py-2 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none focus:border-[var(--ks-action)]"
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
                              {t(language, 'requestReturnPickup')}
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
                  <h2 className="font-display text-2xl font-medium">
                    {t(language, 'customerSupportTitle')}
                  </h2>
                  <p className="text-xs text-[var(--ks-text-secondary)]">
                    {t(language, 'customerSupportDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-start hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">{t(language, 'trackAnOrderCard')}</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      {t(language, 'trackAnOrderDesc')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'customer-support-policy' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-start hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">{t(language, 'grievancePolicyCard')}</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      {t(language, 'grievancePolicyDesc')}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'faq' })}
                    className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] text-start hover:border-[var(--ks-accent)] cursor-pointer space-y-1"
                  >
                    <p className="font-semibold text-sm">{t(language, 'helpFaq')}</p>
                    <p className="text-[var(--ks-text-secondary)]">
                      {t(language, 'helpFaqCardDesc')}
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
                    {t(language, 'sendSupportRequestHeading')}
                  </p>
                  {lastTicketRef && (
                    <p className="text-xs text-[var(--ks-success)] font-mono-num">
                      {lastTicketRef}
                    </p>
                  )}
                  <Input
                    label={t(language, 'orderNumber')}
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g., Order #KS-10482 delivery schedule"
                  />
                  <Textarea
                    label={t(language, 'support')}
                    required
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your question or shipment issue..."
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={supportSubmitting}>
                    {supportSubmitting
                      ? t(language, 'loggingTicket')
                      : t(language, 'submitSupportRequest')}
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
                      setPwdError(t(language, 'errPasswordMin6'));
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
                  <h2 className="font-display text-2xl font-medium">
                    {t(language, 'updatePasswordHeading')}
                  </h2>
                  <Input
                    label={t(language, 'currentPasswordLabel')}
                    type="password"
                    required
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                  />
                  <Input
                    label={t(language, 'newPasswordLabel')}
                    type="password"
                    required
                    helperText={t(language, 'atLeast6CharsPlaceholder')}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                  <Input
                    label={t(language, 'confirmPasswordLabel')}
                    type="password"
                    required
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    error={pwdError}
                  />
                  <Button type="submit" variant="primary" size="md" disabled={pwdSaving}>
                    {pwdSaving
                      ? t(language, 'updatingPassword')
                      : t(language, 'updatePasswordBtn')}
                  </Button>
                </form>

                {/* Notifications */}
                <div className="space-y-4 pb-8 border-b border-[var(--ks-border)]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[var(--ks-accent)]" />
                    <h3 className="text-lg font-medium">
                      {t(language, 'notificationPrefsHeading')}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <Checkbox
                      label={t(language, 'notifOrderUpdates')}
                      description={t(language, 'notifOrderUpdatesDesc')}
                      checked={notificationPrefs.orderUpdates}
                      onChange={(v) =>
                        setNotificationPrefs({ ...notificationPrefs, orderUpdates: v })
                      }
                    />
                    <Checkbox
                      label={t(language, 'notifRestockAlerts')}
                      description={t(language, 'notifRestockAlertsDesc')}
                      checked={notificationPrefs.restockAlerts}
                      onChange={(v) =>
                        setNotificationPrefs({ ...notificationPrefs, restockAlerts: v })
                      }
                    />
                    <Checkbox
                      label={t(language, 'notifJournal')}
                      description={t(language, 'notifJournalDesc')}
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
                    <h3 className="text-lg font-medium">
                      {t(language, 'privacyCookieSettingsHeading')}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <Checkbox
                      label={t(language, 'prefSaveSearchLabel')}
                      description={t(language, 'prefSaveSearchDesc')}
                      checked={privacyPrefs.saveSearchHistory}
                      onChange={(v) =>
                        setPrivacyPrefs({ ...privacyPrefs, saveSearchHistory: v })
                      }
                    />
                    <Checkbox
                      label={t(language, 'prefPersonalizedLabel')}
                      description={t(language, 'prefPersonalizedDesc')}
                      checked={privacyPrefs.personalizedCatalog}
                      onChange={(v) =>
                        setPrivacyPrefs({ ...privacyPrefs, personalizedCatalog: v })
                      }
                    />
                  </div>
                  <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {t(language, 'cookieConsentStatusLabel')}
                      </span>
                      <span className="font-mono-num capitalize text-[var(--ks-accent)]">
                        {cookieConsent.status === 'unset'
                          ? t(language, 'pendingSelection')
                          : cookieConsent.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={openCookiePreferences}>
                        {t(language, 'cookiePreferences')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ name: 'legal' })}
                      >
                        {t(language, 'openLegalCenter')}
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
        title={selectedOrder ? t(language, 'orderNumberPrefix', { id: selectedOrder.id }) : ''}
      >
        {selectedOrder && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'courierInfo')}</p>
                <p className="font-medium mt-0.5">{selectedOrder.courierName}</p>
                <p className="font-mono-num text-[var(--ks-text-secondary)]">
                  {selectedOrder.trackingNumber}
                </p>
                {selectedOrder.transactionRef && (
                  <p className="font-mono-num text-[var(--ks-accent)] mt-1">
                    {selectedOrder.transactionRef} ({selectedOrder.paymentStatus})
                  </p>
                )}
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'destination')}</p>
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
                  <span className="font-mono-num font-medium shrink-0 text-end tabular-nums">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-4 font-semibold text-base">
                <span className="min-w-0">
                  {t(language, 'orderTotal')} ({selectedOrder.paymentLabel})
                </span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
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
                  1 USD = ৳{selectedOrder.currencySnapshot.exchangeRate} ·{' '}
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
