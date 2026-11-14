import React, { useState } from 'react';
import {
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
import { AccountDirectoryEntry } from '../../types/commerce';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormFields';
import { SkeletonLoader } from '../ui/Primitives';

interface AuthPanelProps {
  initialTab?: 'signin' | 'register';
  compact?: boolean;
  onSuccess?: (user: AccountDirectoryEntry) => void;
  onOpenFullPage?: () => void;
}

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

  const [submitting, setSubmitting] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

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

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setFormError('Enter a valid marketplace email address.');
      return;
    }
    setSubmitting(true);
    const user = await loginDemo(loginEmail.trim(), loginPassword || undefined);
    setSubmitting(false);
    if (user) {
      routeForUser(user);
    } else {
      setFormError('Could not verify credentials. Select one of the role accounts to sign in instantly.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!regName.trim() || !regEmail.trim() || !regEmail.includes('@')) {
      setFormError('Full name and a valid email address are required.');
      return;
    }
    if (regPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const user = await registerAccount({
      fullName: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      role: regRole,
      studioName: regRole === 'seller' ? regStudioName.trim() : undefined,
    });
    setSubmitting(false);
    if (user) {
      routeForUser(user);
    }
  };

  const handleQuickRole = async (acc: AccountDirectoryEntry) => {
    setFormError('');
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
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl sm:text-3xl font-medium">
                  Sign In to Kinto Studio
                </h2>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
                  Enter your account email or choose an instant role workspace on the right.
                </p>
              </div>

              <Input
                label="Email Address"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="alex.mercer@studio.example"
              />

              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="studio2026 (optional for seeded roles)"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((p) => !p)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-[34px] w-7 h-7 rounded flex items-center justify-center text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#84827B] flex items-center gap-1">
                  <Lock className="w-3 h-3 shrink-0" />
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
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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
                    onClick={() => setRegRole(opt.id)}
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
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Jordan Rivera"
              />

              {regRole === 'seller' && (
                <Input
                  label="Studio / Brand Name"
                  required
                  value={regStudioName}
                  onChange={(e) => setRegStudioName(e.target.value)}
                  placeholder="Atelier Botanica"
                />
              )}

              <Input
                label="Email Address"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
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
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="6+ characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((p) => !p)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-[34px] w-7 h-7 rounded flex items-center justify-center text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{formError}</p>
              )}

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
              Account directory unavailable offline. Use the form on the left or ensure the Express backend server is running.
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

                    <span className="text-xs font-medium text-[#171716] dark:text-[#F4F3EF] group-hover:text-[#8F6438] dark:group-hover:text-[#C89B67] shrink-0 self-center transition-colors">
                      {isBusy ? 'Opening...' : 'Enter →'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#84827B] pt-3 border-t border-[#DCD9D0] dark:border-[#2C2C28]">
          All sessions synchronize via Express <span className="font-mono-num">/api/auth/*</span> and persist across pages.
        </p>
      </div>
    </div>
  );
};
