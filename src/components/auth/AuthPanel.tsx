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
import { confirmPasswordResetApi, requestPasswordResetApi } from '../../services/api';
import { AccountDirectoryEntry } from '../../types/commerce';
import { t } from '../../utils/i18n';
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
  const { signIn, registerAccount, navigate, openPolicyPreview, showToast, language } = useStore();

  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'recover'>(initialTab);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Password recovery state
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStep, setRecoverStep] = useState<'request' | 'confirm'>('request');
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [showRecoverPassword, setShowRecoverPassword] = useState(false);
  const [recoverPreviewCode, setRecoverPreviewCode] = useState('');
  const [recoverStatusMsg, setRecoverStatusMsg] = useState('');

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
      setFormError(t(language, 'errEnterValidEmail'));
      return;
    }
    if (!loginPassword) {
      setFormError(t(language, 'errEnterPassword'));
      return;
    }

    setSubmitting(true);
    const user = await signIn(trimmedEmail, loginPassword);
    setSubmitting(false);
    if (user) {
      routeForUser(user);
    } else {
      setFormError(t(language, 'errInvalidCreds'));
    }
  };

  const handleRequestRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setRecoverStatusMsg('');
    setRecoverPreviewCode('');
    const clean = recoverEmail.trim();
    if (!clean || !EMAIL_PATTERN.test(clean)) {
      setFormError(t(language, 'errEnterValidEmail'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestPasswordResetApi(clean);
      setRecoverStatusMsg(res.message);
      if (res.previewCode) {
        setRecoverPreviewCode(res.previewCode);
      }
      setRecoverStep('confirm');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t(language, 'errRecoveryStart'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!recoverCode.trim()) {
      setFormError(t(language, 'errEnterCode'));
      return;
    }
    if (recoverNewPassword.trim().length < 6) {
      setFormError(t(language, 'errPasswordMin6'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await confirmPasswordResetApi({
        email: recoverEmail.trim(),
        code: recoverCode.trim(),
        newPassword: recoverNewPassword.trim(),
      });
      showToast(t(language, 'updatePasswordBtn'), res.message, 'success');
      setAuthMode('signin');
      setLoginEmail(recoverEmail.trim());
      setLoginPassword('');
      setRecoverStep('request');
      setRecoverCode('');
      setRecoverNewPassword('');
      setRecoverPreviewCode('');
      setRecoverStatusMsg('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t(language, 'errResetFailed'));
    } finally {
      setSubmitting(false);
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
      errors.fullName = t(language, 'errFullNameRequired');
    }
    if (regRole === 'seller' && !trimmedStudio) {
      errors.studioName = t(language, 'errStudioNameRequired');
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = t(language, 'errEmailExample');
    }
    if (trimmedPhone && !isValidContactPhone(trimmedPhone, 'Bangladesh')) {
      errors.phone = t(language, 'errBdPhoneFormat');
    }
    if (regPassword.length < 6) {
      errors.password = t(language, 'errPasswordMin6');
    }
    if (!regAccepted) {
      errors.policy =
        regRole === 'seller'
          ? t(language, 'errPolicySeller')
          : t(language, 'errPolicyCustomer');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const detailList = Object.values(errors).filter((v): v is string => Boolean(v));
      const onlyPolicyMissing = Boolean(errors.policy) && detailList.length === 1;
      if (onlyPolicyMissing) {
        setRegError({
          category: 'policy',
          title: t(language, 'errPolicyMissingTitle'),
          message: t(language, 'errPolicyMissingMsg'),
          details: detailList,
        });
      } else {
        setRegError(null);
      }
      window.requestAnimationFrame(() => {
        const firstInvalid = document.querySelector<HTMLElement>(
          'form [aria-invalid="true"]'
        );
        if (firstInvalid) {
          firstInvalid.focus({ preventScroll: true });
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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

    const errMsg = result.error?.message || t(language, 'errResetFailed');
    const status = result.error?.status;

    if (status === 409 || /already exists/i.test(errMsg)) {
      setFieldErrors({ email: t(language, 'errDuplicateTitle') });
      setRegError({
        category: 'duplicate_email',
        title: t(language, 'errDuplicateTitle'),
        message: t(language, 'errDuplicateMsg', { email: trimmedEmail }),
        email: trimmedEmail,
      });
    } else if (status === 400) {
      setRegError({
        category: 'validation',
        title: t(language, 'errEmailExample'),
        message: errMsg,
      });
    } else if (status === 0 || /network|fetch|reach/i.test(errMsg)) {
      setRegError({
        category: 'network',
        title: t(language, 'errNetworkTitle'),
        message: t(language, 'errNetworkMsg'),
      });
    } else {
      setRegError({
        category: 'server',
        title: t(language, 'errResetFailed'),
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
                  { id: 'signin', label: t(language, 'signIn') },
                  { id: 'register', label: t(language, 'createAccount') },
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
                    className={`relative min-h-[44px] pb-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
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
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--ks-text-primary)]"
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
                className="min-h-[44px] inline-flex items-center gap-1 pb-2 text-xs text-[var(--ks-accent)] hover:underline cursor-pointer whitespace-nowrap"
              >
                <span>{t(language, 'fullPageView')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>

          {authMode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  {t(language, 'signInTitle')}
                </h2>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'signInSubtitle')}
                </p>
              </div>

              <Input
                label={t(language, 'emailLabel')}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="name@example.com"
              />

              <div className="relative">
                <Input
                  label={t(language, 'passwordLabel')}
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  enterKeyHint="go"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder={t(language, 'enterPasswordPlaceholder')}
                  className="pe-11"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((p) => !p)}
                  aria-label={showLoginPassword ? t(language, 'hidePassword') : t(language, 'showPassword')}
                  className="absolute end-1.5 top-[25px] w-10 h-10 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {formError && (
                <p className="text-xs text-[var(--ks-error)]" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('recover');
                    setRecoverEmail(loginEmail);
                    setRecoverStep('request');
                    setRecoverPreviewCode('');
                    setRecoverStatusMsg('');
                    setFormError('');
                  }}
                  className="min-h-[44px] inline-flex items-center px-1 text-xs text-[var(--ks-accent)] hover:underline cursor-pointer"
                >
                  {t(language, 'forgotPassword')}
                </button>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
                <span>{submitting ? t(language, 'signingIn') : t(language, 'signIn')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          ) : authMode === 'recover' ? (
            recoverStep === 'request' ? (
              <form onSubmit={handleRequestRecoveryCode} noValidate className="space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-medium">
                    {t(language, 'recoverTitle')}
                  </h2>
                  <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                    {t(language, 'recoverDesc')}
                  </p>
                </div>

                <Input
                  label={t(language, 'registeredEmailLabel')}
                  type="email"
                  required
                  autoComplete="email"
                  value={recoverEmail}
                  onChange={(e) => {
                    setRecoverEmail(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="name@example.com"
                />

                {formError && (
                  <p className="text-xs text-[var(--ks-error)]" role="alert">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                    <span>{submitting ? t(language, 'requestingCode') : t(language, 'sendRecoveryCode')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setFormError('');
                    }}
                    className="min-h-[44px] inline-flex items-center px-2 text-xs text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] underline cursor-pointer"
                  >
                    {t(language, 'backToSignIn')}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPasswordReset} noValidate className="space-y-4">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl sm:text-3xl font-medium">
                    {t(language, 'enterCodeTitle')}
                  </h2>
                  {recoverStatusMsg && (
                    <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                      {recoverStatusMsg}
                    </p>
                  )}
                </div>

                {recoverPreviewCode && (
                  <div className="p-3 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border-strong)] text-xs space-y-1">
                    <p className="font-medium text-[var(--ks-text-primary)]">
                      {t(language, 'inAppCodeLabel')}
                    </p>
                    <p className="font-mono-num text-base tracking-widest text-[var(--ks-accent)]">
                      {recoverPreviewCode}
                    </p>
                  </div>
                )}

                <Input
                  label={t(language, 'verificationCodeLabel')}
                  required
                  value={recoverCode}
                  onChange={(e) => {
                    setRecoverCode(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="123456"
                />

                <div className="relative">
                  <Input
                    label={t(language, 'newPasswordLabel')}
                    type={showRecoverPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={recoverNewPassword}
                    onChange={(e) => {
                      setRecoverNewPassword(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder={t(language, 'atLeast6CharsPlaceholder')}
                    className="pe-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRecoverPassword((p) => !p)}
                    aria-label={showRecoverPassword ? t(language, 'hidePassword') : t(language, 'showPassword')}
                    className="absolute end-1.5 top-[25px] w-10 h-10 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    {showRecoverPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {formError && (
                  <p className="text-xs text-[var(--ks-error)]" role="alert">
                    {formError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                    <span>{submitting ? t(language, 'updatingPassword') : t(language, 'resetPasswordBtn')}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverStep('request');
                      setFormError('');
                    }}
                    className="min-h-[44px] inline-flex items-center px-2 text-xs text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] underline cursor-pointer"
                  >
                    {t(language, 'requestNewCode')}
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  {t(language, 'createAccountTitle')}
                </h2>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'createAccountSubtitle')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'customer', label: t(language, 'customerAccountOption') },
                      { id: 'seller', label: t(language, 'sellerStudioOption') },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={regRole === opt.id}
                      onClick={() => {
                        setRegRole(opt.id);
                        if (opt.id === 'customer') {
                          clearFieldError('studioName');
                        }
                        if (regError) setRegError(null);
                      }}
                      className={`min-h-[44px] py-2 px-3 rounded-[var(--ks-radius-md)] border text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                        regRole === opt.id
                          ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                          : 'border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-border-strong)] hover:text-[var(--ks-text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed px-0.5">
                  {regRole === 'seller'
                    ? t(language, 'sellerRoleDesc')
                    : t(language, 'customerRoleDesc')}
                </p>
              </div>

              <Input
                label={t(language, 'fullNameLabel')}
                required
                autoComplete="name"
                enterKeyHint="next"
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
                  label={t(language, 'studioBrandLabel')}
                  required
                  autoComplete="organization"
                  enterKeyHint="next"
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
                label={t(language, 'emailLabel')}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  clearFieldError('email');
                }}
                error={fieldErrors.email}
                placeholder="name@example.com"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label={t(language, 'bdMobileLabel')}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  enterKeyHint="next"
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
                    label={t(language, 'passwordLabel')}
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    enterKeyHint="done"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    error={fieldErrors.password}
                    placeholder={t(language, 'atLeast6CharsPlaceholder')}
                    className="pe-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    aria-label={showRegPassword ? t(language, 'hidePassword') : t(language, 'showPassword')}
                    className="absolute end-1.5 top-[25px] w-10 h-10 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
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
                      onClick={() => openPolicyPreview('privacy-policy')}
                      className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      {t(language, 'privacyPolicy')}
                    </button>
                    ,{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('acceptable-use')}
                      className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      {t(language, 'acceptableUseTitle')}
                    </button>
                    {regRole === 'seller' && (
                      <>
                        {' '}
                        {t(language, 'sellerAgreementPlus')}{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('seller-agreement')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'sellerAgreementTitle')}
                        </button>{' '}
                        &amp;{' '}
                        <button
                          type="button"
                          onClick={() => openPolicyPreview('prohibited-items')}
                          className="underline font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {t(language, 'prohibitedItemsTitle')}
                        </button>
                      </>
                    )}
                    {' '}{t(language, 'governedByBdLaw')}
                  </span>
                </label>
                {fieldErrors.policy && (
                  <p className="text-xs leading-snug text-[var(--ks-error)] flex items-start gap-1.5 ps-6">
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
                <span>{submitting ? t(language, 'creatingAccount') : t(language, 'createAccount')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Marketplace Account & Security Information */}
      <div className="lg:col-span-5 p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <p className="ks-eyebrow text-[var(--ks-accent)]">{t(language, 'accessEyebrow')}</p>
            <h3 className="font-display text-2xl font-medium">
              {t(language, 'accessTitle')}
            </h3>
            <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
              {t(language, 'accessDesc')}
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Lock className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">{t(language, 'protectedSessionTitle')}</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'protectedSessionDesc')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Truck className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">{t(language, 'guestTrackingTitle')}</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'guestTrackingPrefix')}{' '}
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="underline text-[var(--ks-accent)] font-medium cursor-pointer"
                  >
                    {t(language, 'trackOrderById')}
                  </button>
                  .
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex items-start gap-3">
              <Store className="w-4 h-4 text-[var(--ks-accent)] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">{t(language, 'partnerOnboardingTitle')}</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                  {t(language, 'partnerOnboardingDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--ks-border-strong)] flex items-center justify-between gap-3 text-[11px] text-[var(--ks-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
            {t(language, 'privacyProtectedNote')}
          </span>
          <button
            type="button"
            onClick={() => navigate({ name: 'legal' })}
            className="min-h-[44px] inline-flex items-center gap-1 hover:underline text-[var(--ks-text-secondary)] whitespace-nowrap cursor-pointer"
          >
            <span>{t(language, 'legalCenter')}</span>
            <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
