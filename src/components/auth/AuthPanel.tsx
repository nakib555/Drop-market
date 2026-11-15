import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { buildPolicyAcceptance } from '../../data/legalPolicies';
import { AccountDirectoryEntry } from '../../types/commerce';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { isValidContactPhone } from '../../utils/validation';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
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
  phone?: string;
  password?: string;
  policy?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AuthPanel: React.FC<AuthPanelProps> = ({
  initialTab = 'signin',
  compact = false,
  onSuccess,
  onOpenFullPage,
}) => {
  const { loginDemo, registerAccount, navigate, openPolicyPreview } = useStore();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>(initialTab);
  const [loginEmail, setLoginEmail] = useState('');
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
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegFieldErrors>({});
  const [regError, setRegError] = useState<RegistrationErrorInfo | null>(null);

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

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError('Enter your registered email address.');
      return;
    }
    if (!loginPassword) {
      setFormError('Enter your account password.');
      return;
    }

    setSubmitting(true);
    const user = await loginDemo(trimmedEmail, loginPassword);
    setSubmitting(false);
    if (user) {
      routeForUser(user);
    } else {
      setFormError('Invalid email or password. Check your credentials and try again.');
    }
  };

  const runRegistration = async () => {
    setFormError('');
    setRegError(null);

    const errors: RegFieldErrors = {};
    const trimmedName = regName.trim();
    const trimmedStudio = regStudioName.trim();
    const trimmedEmail = regEmail.trim();
    const trimmedPhone = regPhone.trim();

    if (!trimmedName) {
      errors.fullName = 'Enter your full name.';
    }
    if (regRole === 'seller' && !trimmedStudio) {
      errors.studioName = 'Enter a studio or store name for your Seller account.';
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address (for example, name@domain.com).';
    }
    if (trimmedPhone && !isValidContactPhone(trimmedPhone, 'Bangladesh')) {
      errors.phone = 'Enter a valid Bangladesh mobile number (e.g. +880 1711-000100 or 01711000100).';
    }
    if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }
    if (!regAccepted) {
      errors.policy =
        regRole === 'seller'
          ? 'Accept the Terms & Conditions, Privacy Policy, Seller Marketplace Agreement, and Prohibited Items Policy.'
          : 'Accept the Terms & Conditions, Privacy Policy, and Acceptable Use Policy.';
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
        details: detailList,
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
      phone: trimmedPhone,
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

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 ${compact ? 'gap-6' : 'gap-8'} items-stretch`}>
      {/* Form Column */}
      <div className="lg:col-span-7 p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Segmented Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--ks-border)]">
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
                    className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'text-[var(--ks-text-primary)]'
                        : 'text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {active && (
                      <motion.span
                        layoutId={compact ? 'auth-modal-tab-bar' : 'auth-page-tab-bar'}
                        transition={STUDIO_TRANSITION.springTab}
                        className="absolute left-0 right-0 -bottom-px h-0.5 bg-[var(--ks-text-primary)]"
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
                className="pb-3 text-xs text-[var(--ks-accent)] hover:underline cursor-pointer whitespace-nowrap"
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
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  Enter your registered email address and password to access your orders, saved addresses, or partner portal.
                </p>
              </div>

              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="name@example.com"
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((p) => !p)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-[29px] w-7 h-7 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formError && (
                <p className="text-xs text-[var(--ks-error)]" role="alert">
                  {formError}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
                <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  Create Marketplace Account
                </h2>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  Register as a Customer or apply as a partner Seller Studio on Kinto Studio Bangladesh.
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
                    className={`py-2 px-3 rounded-[var(--ks-radius-md)] border text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      regRole === opt.id
                        ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                        : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-border-strong)] hover:text-[var(--ks-text-primary)]'
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
                placeholder="Tasnim Ahmed"
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
                  placeholder="Dhaka Craft Atelier"
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
                placeholder="name@example.com"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Bangladesh Mobile"
                  value={regPhone}
                  onChange={(e) => {
                    setRegPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  error={fieldErrors.phone}
                  placeholder="+880 1711-000100"
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
                    className="absolute right-2.5 top-[29px] w-7 h-7 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border space-y-2 transition-colors ${
                  fieldErrors.policy
                    ? 'border-[var(--ks-error)]'
                    : 'border-[var(--ks-border)]'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed text-[var(--ks-text-secondary)] select-none">
                  <input
                    type="checkbox"
                    checked={regAccepted}
                    aria-invalid={Boolean(fieldErrors.policy)}
                    onChange={(e) => {
                      setRegAccepted(e.target.checked);
                      clearFieldError('policy');
                    }}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-[var(--ks-action)] cursor-pointer"
                  />
                  <span>
                    I confirm I am 18+ and agree to Kinto Studio&apos;s{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('terms')}
                      className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      Terms &amp; Conditions
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('privacy-policy')}
                      className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                    , and{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('acceptable-use')}
                      className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
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
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          Seller Marketplace Agreement
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('prohibited-items')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          Prohibited Items Policy
                        </button>
                      </>
                    )}
                    {' '}(governed by Bangladesh law &amp; Dhaka courts).
                  </span>
                </label>
                {fieldErrors.policy && (
                  <p className="text-xs leading-snug text-[var(--ks-error)] flex items-start gap-1.5 pl-6">
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
                <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Marketplace Account & Security Information */}
      <div className="lg:col-span-5 p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <p className="ks-eyebrow text-[var(--ks-accent)]">Bangladesh Marketplace Access</p>
            <h3 className="font-display text-2xl font-medium">
              Unified Account Security
            </h3>
            <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
              Manage orders, courier tracking, saved Bangladesh delivery addresses, tokenized payments, and verified seller tools from one authenticated account.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">Protected Session Controls</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  Role-isolated sessions enforce strict Customer, Seller Studio, and Platform Admin authorization across every order and storefront record.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Truck className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">Guest Order Tracking</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  Checking an existing shipment without signing in?{' '}
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="underline text-[var(--ks-accent)] font-medium cursor-pointer"
                  >
                    Track your order by Order ID
                  </button>
                  .
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Store className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">Partner Maker Onboarding</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  Apply as a verified Seller Studio under the Bangladesh marketplace framework with BDT settlement and courier integration.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--ks-border-strong)] flex items-center justify-between gap-3 text-[11px] text-[var(--ks-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
            Protected under Kinto Studio Privacy Policy
          </span>
          <button
            type="button"
            onClick={() => navigate({ name: 'legal' })}
            className="hover:underline text-[var(--ks-text-secondary)] whitespace-nowrap cursor-pointer"
          >
            Legal Center →
          </button>
        </div>
      </div>
    </div>
  );
};
