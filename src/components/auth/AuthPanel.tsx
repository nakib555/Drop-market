import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { buildPolicyAcceptance } from '../../data/legalPolicies';
import { AccountDirectoryEntry } from '../../types/commerce';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { SkeletonLoader } from '../ui/Primitives';
import {
  RegistrationErrorAlert,
  type RegistrationErrorInfo,
} from './RegistrationErrorAlert';

interface AuthPanelProps {
  initialTab?: 'signin' | 'register';
  compact?: boolean;
  onSuccess?: (user: AccountDirectoryEntry) => void;
  onOpenFullPage?: () => void;
}

interface RegFieldErrors {
  fullName?: string;
  studioName?: string;
  email?: string;
  password?: string;
  policy?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_META: Record<
  'customer' | 'seller' | 'admin',
  {
    badge: string;
    pagesSummary: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  customer: {
    badge: 'Member',
    pagesSummary: 'Overview · Order History · Wishlist · Addresses · Tracking',
    Icon: User,
  },
  seller: {
    badge: 'Seller Studio',
    pagesSummary: 'Seller Studio · Live Inventory · Add Products · Fulfillment Queue',
    Icon: Store,
  },
  admin: {
    badge: 'Platform Admin',
    pagesSummary: 'Admin Console · All Orders · Seller Approvals · Users & Categories',
    Icon: ShieldCheck,
  },
};

export const AuthPanel: React.FC<AuthPanelProps> = ({
  initialTab = 'signin',
  compact = false,
  onSuccess,
  onOpenFullPage,
}) => {
  const {
    profile,
    authAccounts,
    authLoading,
    loginDemo,
    switchDemoAccount,
    registerAccount,
    navigate,
    openPolicyPreview,
  } = useStore();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>(initialTab);
  const [loginEmail, setLoginEmail] = useState(
    profile.email && profile.email.includes('@') ? profile.email : 'alex.mercer@studio.example'
  );
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'customer' | 'seller'>('customer');
  const [regStudioName, setRegStudioName] = useState('');
  const [regAccepted, setRegAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegFieldErrors>({});
  const [regError, setRegError] = useState<RegistrationErrorInfo | null>(null);

  const primaryRoleAccounts = (['customer', 'seller', 'admin'] as const)
    .map((roleKey) => authAccounts.find((a) => a.role === roleKey))
    .filter((a): a is AccountDirectoryEntry => Boolean(a));

  const routeForUser = (user: AccountDirectoryEntry) => {
    if (onSuccess) {
      onSuccess(user);
      return;
    }
    if (user.role === 'admin') {
      navigate({ name: 'admin' });
    } else if (user.role === 'seller') {
      navigate({ name: 'seller' });
    } else {
      navigate({ name: 'account', accountTab: 'overview' });
    }
  };

  const clearFieldError = (field: keyof RegFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (regError) setRegError(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setRegError(null);
    setSubmitting(true);
    const user = await loginDemo(loginEmail.trim(), loginPassword || undefined);
    setSubmitting(false);
    if (user) {
      routeForUser(user);
    } else {
      setFormError('Could not complete sign in. Select a workspace on the right or try again.');
    }
  };

  const runRegistration = async () => {
    setFormError('');
    setRegError(null);

    const errors: RegFieldErrors = {};
    const trimmedName = regName.trim();
    const trimmedStudio = regStudioName.trim();
    const trimmedEmail = regEmail.trim();

    if (!trimmedName) {
      errors.fullName = 'Enter your full name.';
    }
    if (regRole === 'seller' && !trimmedStudio) {
      errors.studioName = 'Enter a studio or brand name for your Seller account.';
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address (for example, name@example.com).';
    }
    if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (!regAccepted) {
      errors.policy =
        regRole === 'seller'
          ? 'Accept the Terms of Service, Privacy Policy, Seller Marketplace Agreement, and Prohibited Items Policy.'
          : 'Accept the Terms of Service, Privacy Policy, and Acceptable Use Policy.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const detailList = Object.values(errors).filter((v): v is string => Boolean(v));
      const onlyPolicyMissing = Boolean(errors.policy) && detailList.length === 1;
      setRegError({
        category: onlyPolicyMissing ? 'policy' : 'validation',
        title: onlyPolicyMissing
          ? 'Policy consent required'
          : 'Please review the highlighted fields',
        message: onlyPolicyMissing
          ? 'You must confirm the marketplace legal agreements before creating an account.'
          : 'Some required registration details are missing or need correction:',
        details: onlyPolicyMissing ? detailList : detailList,
      });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    const scope =
      regRole === 'seller'
        ? ['terms', 'privacy-policy', 'acceptable-use', 'seller-agreement', 'prohibited-items']
        : ['terms', 'privacy-policy', 'acceptable-use'];

    const result = await registerAccount({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: regPhone.trim(),
      password: regPassword,
      role: regRole,
      studioName: regRole === 'seller' ? trimmedStudio : undefined,
      acceptedPolicies: buildPolicyAcceptance(scope),
    });

    setSubmitting(false);

    if (result.user) {
      routeForUser(result.user);
      return;
    }

    const errMsg = result.error?.message || 'Unable to register your account right now.';
    const status = result.error?.status;

    if (status === 409 || /already exists/i.test(errMsg)) {
      setFieldErrors({ email: 'An account with this email already exists.' });
      setRegError({
        category: 'duplicate_email',
        title: 'Email address already registered',
        message: `There is already a Kinto Studio account using ${trimmedEmail}. Sign in to that account instead, or use a different email address.`,
        email: trimmedEmail,
      });
    } else if (status === 400) {
      setRegError({
        category: 'validation',
        title: 'Registration details could not be verified',
        message: errMsg,
      });
    } else if (status === 0 || /network|fetch|reach/i.test(errMsg)) {
      setRegError({
        category: 'network',
        title: 'Connection interrupted',
        message: 'We could not reach the registration service. Check your connection and try again.',
      });
    } else {
      setRegError({
        category: 'server',
        title: 'Registration could not be completed',
        message: errMsg,
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runRegistration();
  };

  const handleQuickRole = async (acc: AccountDirectoryEntry) => {
    setFormError('');
    setRegError(null);
    setSwitchingId(acc.id);
    const user = await switchDemoAccount(acc.id);
    setSwitchingId(null);
    if (user) {
      routeForUser(user);
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 ${compact ? 'gap-6' : 'gap-8'} items-stretch`}>
      {/* Form Column */}
      <div className="lg:col-span-6 p-6 sm:p-7 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Segmented Tabs */}
          <div className="flex items-center justify-between border-b border-[#E5E3DD] dark:border-[#2C2C28]">
            <div className="flex items-center gap-6">
              {(
                [
                  { id: 'signin', label: 'Sign In' },
                  { id: 'register', label: 'Create Account' },
                ] as const
              ).map((tab) => {
                const active = authMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setAuthMode(tab.id);
                      setFormError('');
                      setRegError(null);
                      setFieldErrors({});
                    }}
                    className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? 'text-[#171716] dark:text-[#F4F3EF]'
                        : 'text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {active && (
                      <motion.span
                        layoutId={compact ? 'auth-modal-tab-bar' : 'auth-page-tab-bar'}
                        transition={STUDIO_TRANSITION.springTab}
                        className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#171716] dark:bg-[#F4F3EF]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {onOpenFullPage && (
              <button
                type="button"
                onClick={onOpenFullPage}
                className="pb-3 text-xs text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
              >
                Full page view →
              </button>
            )}
          </div>

          {authMode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  Sign In to Kinto Studio
                </h2>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
                  Enter any email or name, leave fields blank for instant access, or pick a workspace on the right.
                </p>
              </div>

              <Input
                label="Email or Name (Optional)"
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Any email, name, or leave blank"
              />

              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="Password (Optional)"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Optional — enter anything or leave blank"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((p) => !p)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-[29px] w-7 h-7 rounded flex items-center justify-center text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] leading-snug text-[#84827B] flex items-start gap-1">
                  <Lock className="w-3 h-3 shrink-0 mt-[2px]" />
                  <span>Hints: studio2026 · seller2026 · admin2026</span>
                </p>
              </div>

              {formError && (
                <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{formError}</p>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
                <span>{submitting ? 'Signing In...' : 'Sign In & Open Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  Create Marketplace Account
                </h2>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
                  Join as a Member or register a partner Seller Studio with live inventory tools.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'customer', label: 'Customer Account' },
                    { id: 'seller', label: 'Seller Studio' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRegRole(opt.id);
                      if (opt.id === 'customer') {
                        clearFieldError('studioName');
                      }
                      if (regError) setRegError(null);
                    }}
                    className={`py-2 px-3 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                      regRole === opt.id
                        ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                        : 'border-[#E5E3DD] dark:border-[#2C2C28] text-[#5C5B57] dark:text-[#A3A19B] hover:border-[#171716] dark:hover:border-[#F4F3EF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <Input
                label="Full Name"
                required
                value={regName}
                onChange={(e) => {
                  setRegName(e.target.value);
                  clearFieldError('fullName');
                }}
                error={fieldErrors.fullName}
                placeholder="Jordan Rivera"
              />

              {regRole === 'seller' && (
                <Input
                  label="Studio / Brand Name"
                  required
                  value={regStudioName}
                  onChange={(e) => {
                    setRegStudioName(e.target.value);
                    clearFieldError('studioName');
                  }}
                  error={fieldErrors.studioName}
                  placeholder="Atelier Botanica"
                />
              )}

              <Input
                label="Email Address"
                type="email"
                required
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  clearFieldError('email');
                }}
                error={fieldErrors.email}
                placeholder="jordan@studio.example"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 415 555 0100"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    error={fieldErrors.password}
                    placeholder="6+ characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-[29px] w-7 h-7 rounded flex items-center justify-center text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border space-y-2 transition-colors ${
                  fieldErrors.policy
                    ? 'border-[#B91C1C] dark:border-[#F87171]'
                    : 'border-[#E5E3DD] dark:border-[#2C2C28]'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[#5C5B57] dark:text-[#A3A19B] select-none">
                  <input
                    type="checkbox"
                    checked={regAccepted}
                    aria-invalid={Boolean(fieldErrors.policy)}
                    onChange={(e) => {
                      setRegAccepted(e.target.checked);
                      clearFieldError('policy');
                    }}
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
                      onClick={() => openPolicyPreview('privacy-policy')}
                      className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    , and{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('acceptable-use')}
                      className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                    >
                      Acceptable Use Policy
                    </button>
                    {regRole === 'seller' && (
                      <>
                        {' '}
                        plus the{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('seller-agreement')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Seller Marketplace Agreement
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('prohibited-items')}
                          className="underline font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                        >
                          Prohibited Items Policy
                        </button>
                      </>
                    )}
                    {' '}(governed by Bangladesh law &amp; Dhaka courts).
                  </span>
                </label>
                {fieldErrors.policy && (
                  <p className="text-xs leading-snug text-[#B91C1C] dark:text-[#F87171] flex items-start gap-1.5 pl-6">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[2px]" aria-hidden="true" />
                    <span>{fieldErrors.policy}</span>
                  </p>
                )}
              </div>

              <RegistrationErrorAlert
                error={regError}
                onDismiss={() => setRegError(null)}
                onSwitchToSignIn={(email) => {
                  setAuthMode('signin');
                  setLoginEmail(email);
                  setRegError(null);
                  setFieldErrors({});
                  setFormError('');
                }}
                onRetry={() => {
                  void runRegistration();
                }}
              />

              <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
                <span>{submitting ? 'Creating Account...' : 'Create Account & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Instant API Multi-Role Portals */}
      <div className="lg:col-span-6 p-6 sm:p-7 rounded-lg bg-[#F2F0EC] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8F6438] dark:text-[#C89B67] font-medium">
              Instant Role Portals
            </p>
            <h3 className="font-display text-2xl font-medium">
              1-Click Workspace Access
            </h3>
            <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
              Choose an account below to sign in and open its dedicated post-login pages immediately.
            </p>
          </div>

          {authLoading ? (
            <div className="space-y-3">
              <SkeletonLoader className="h-24 w-full" />
              <SkeletonLoader className="h-24 w-full" />
              <SkeletonLoader className="h-24 w-full" />
            </div>
          ) : primaryRoleAccounts.length === 0 ? (
            <div className="p-4 rounded-md bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] text-xs text-[#5C5B57] dark:text-[#A3A19B]">
              Marketplace account directory is temporarily unavailable. Use the sign-in form on the left or try refreshing shortly.
            </div>
          ) : (
            <div className="space-y-3">
              {primaryRoleAccounts.map((acc) => {
                const meta = ROLE_META[acc.role];
                const Icon = meta.Icon;
                const isActiveSession =
                  profile.isAuthenticated && profile.id === acc.id;
                const isBusy = switchingId === acc.id;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={Boolean(switchingId)}
                    onClick={() => handleQuickRole(acc)}
                    className={`group w-full p-4 rounded-md border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActiveSession
                        ? 'bg-[#FFFFFF] dark:bg-[#191917] border-[#8F6438] dark:border-[#C89B67]'
                        : 'bg-[#FFFFFF] dark:bg-[#191917] border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#171716] dark:hover:border-[#F4F3EF]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] flex items-center justify-center shrink-0 text-[#8F6438] dark:text-[#C89B67] mt-0.5">
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold truncate">{acc.fullName}</span>
                          <span className="text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded bg-[#F2F0EC] dark:bg-[#22221F] text-[#8F6438] dark:text-[#C89B67]">
                            {meta.badge}
                          </span>
                          {isActiveSession && (
                            <span className="text-[10px] uppercase tracking-wider font-medium text-[#15803D] dark:text-[#4ADE80]">
                              · Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] truncate">
                          {acc.studioName ? `${acc.studioName} · ` : ''}
                          {acc.email}
                        </p>
                        <p className="text-[11px] text-[#84827B] leading-snug">
                          {meta.pagesSummary}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-[#171716] dark:text-[#F4F3EF] group-hover:text-[#8F6438] dark:group-hover:text-[#C89B67] shrink-0 self-start sm:self-center mt-0.5 sm:mt-0 whitespace-nowrap transition-colors">
                      {isBusy ? 'Opening...' : 'Enter →'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#84827B] pt-3 border-t border-[#DCD9D0] dark:border-[#2C2C28]">
          Sessions stay synchronized securely across storefront, seller, and admin workspaces.
        </p>
      </div>
    </div>
  );
};
