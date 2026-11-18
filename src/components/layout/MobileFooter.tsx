import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Cookie,
  Globe,
  Info,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  filterEnabledPaymentMethods,
  getCookieConsentStatusKey,
  getCopyrightYear,
  scrollPageToTop,
  VERIFIED_SOCIAL_LINKS,
} from '../../data/brandConfig';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { subscribeNewsletterApi } from '../../services/api';
import type { LanguageCode, PaymentMethodId } from '../../types/commerce';
import { LANGUAGE_OPTIONS, t } from '../../utils/i18n';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Button } from '../ui/Button';

interface MobileAccordionLink {
  label: string;
  onClick: () => void;
  emphasize?: boolean;
}

interface MobileAccordionGroup {
  id: string;
  title: string;
  links: MobileAccordionLink[];
}

interface NewsletterFeedback {
  type: 'error' | 'success' | 'duplicate';
  text: string;
}

const PaymentMethodBadge: React.FC<{
  methodId: PaymentMethodId;
  language: LanguageCode;
}> = ({ methodId, language }) => {
  switch (methodId) {
    case 'cod':
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            aria-hidden="true"
            className="text-[var(--ks-accent)] shrink-0"
          >
            <rect
              x="1"
              y="2"
              width="16"
              height="10"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <circle cx="9" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.25" />
            <path d="M3.5 5v4M14.5 5v4" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <span>{t(language, 'paymentMarkCod')}</span>
        </span>
      );
    case 'visa':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-semibold tracking-wider text-[var(--ks-text-primary)]">
          <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true">
            <text
              x="0"
              y="10"
              fill="currentColor"
              fontSize="10"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              VISA
            </text>
          </svg>
          <span className="sr-only">Visa</span>
        </span>
      );
    case 'mastercard':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
            <circle cx="7" cy="6" r="4.5" fill="currentColor" fillOpacity="0.65" />
            <circle cx="13" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>Mastercard</span>
        </span>
      );
    case 'bkash':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <span>bKash</span>
        </span>
      );
    case 'nagad':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <span>Nagad</span>
        </span>
      );
    case 'rocket':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <span>Rocket</span>
        </span>
      );
    case 'sslcommerz':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <span>SSLCommerz</span>
        </span>
      );
    case 'bank-transfer':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-xs font-medium text-[var(--ks-text-primary)]">
          <span>NPSB / BEFTN</span>
        </span>
      );
    default:
      return null;
  }
};

export const MobileFooter: React.FC = () => {
  const {
    currency,
    language,
    setLanguage,
    toggleCurrency,
    navigate,
    showToast,
    cookieConsent,
    cookieModalOpen,
    openCookiePreferences,
    enabledPaymentMethods,
  } = useStore();

  const { isInstalled, bannerDismissed } = usePWAInstall();

  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [feedback, setFeedback] = useState<NewsletterFeedback | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const copyrightYear = getCopyrightYear();
  const activePaymentMethods = filterEnabledPaymentMethods(enabledPaymentMethods);

  // Add extra clearance at footer end only while a floating mobile bottom banner is visible
  const hasVisibleBottomBanner =
    (cookieConsent.status === 'unset' && !cookieModalOpen) || (!isInstalled && !bannerDismissed);

  const accordionGroups: MobileAccordionGroup[] = [
    {
      id: 'customer-service',
      title: t(language, 'footerCustomerServiceHeading'),
      links: [
        { label: t(language, 'contactUsLink'), onClick: () => navigate({ name: 'contact' }) },
        { label: t(language, 'helpCenterLink'), onClick: () => navigate({ name: 'faq' }) },
        { label: t(language, 'trackOrder'), onClick: () => navigate({ name: 'track-order' }) },
        { label: t(language, 'returnsRefunds'), onClick: () => navigate({ name: 'return-policy' }) },
      ],
    },
    {
      id: 'shopping',
      title: t(language, 'footerShoppingHeading'),
      links: [
        {
          label: t(language, 'allCategoriesLink'),
          onClick: () => navigate({ name: 'shop', category: 'all' }),
        },
        {
          label: t(language, 'newArrivals'),
          onClick: () =>
            navigate({ name: 'shop', collection: 'new-arrivals', category: 'all' }),
        },
        { label: t(language, 'offersLink'), onClick: () => navigate({ name: 'offers' }) },
        { label: t(language, 'featuredBrands'), onClick: () => navigate({ name: 'brands' }) },
      ],
    },
    {
      id: 'policies-legal',
      title: t(language, 'footerLegalHeading'),
      links: [
        {
          label: t(language, 'policiesAndHelpCenter'),
          onClick: () => navigate({ name: 'legal' }),
          emphasize: true,
        },
        { label: t(language, 'termsConditions'), onClick: () => navigate({ name: 'terms' }) },
        { label: t(language, 'privacyPolicy'), onClick: () => navigate({ name: 'privacy-policy' }) },
        { label: t(language, 'cookiePolicy'), onClick: () => navigate({ name: 'cookie-policy' }) },
        {
          label: t(language, 'shippingPolicyShort'),
          onClick: () => navigate({ name: 'shipping-policy' }),
        },
        {
          label: t(language, 'returnPolicyShort'),
          onClick: () => navigate({ name: 'return-policy' }),
        },
      ],
    },
    {
      id: 'for-sellers',
      title: t(language, 'footerForSellersHeading'),
      links: [
        {
          label: t(language, 'becomeSellerLink'),
          onClick: () => navigate({ name: 'login', accountTab: 'register' }),
        },
        {
          label: t(language, 'sellerAgreementLink'),
          onClick: () => navigate({ name: 'seller-agreement' }),
        },
        {
          label: t(language, 'sellerPoliciesLink'),
          onClick: () => navigate({ name: 'marketplace-terms' }),
        },
        { label: t(language, 'sellerSupportLink'), onClick: () => navigate({ name: 'contact' }) },
      ],
    },
  ];

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setFeedback({ type: 'error', text: t(language, 'newsletterError') });
      return;
    }

    setFeedback(null);
    setSubscribing(true);
    try {
      const res = await subscribeNewsletterApi(cleaned, 'footer');
      setEmail('');
      setFeedback({
        type: res.alreadySubscribed ? 'duplicate' : 'success',
        text: res.message,
      });
      showToast(
        res.alreadySubscribed ? 'Already subscribed' : 'Subscribed',
        res.message,
        res.alreadySubscribed ? 'info' : 'success'
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to subscribe right now.',
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div
      data-mobile-footer="true"
      className={`md:hidden ks-container pt-9 ${
        hasVisibleBottomBanner
          ? 'pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+5rem))]'
          : 'pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]'
      }`}
    >
      {/* Section A — Brand Introduction */}
      <div className="pb-6 border-b border-[var(--ks-divider)]">
        <p className="font-display text-2xl font-semibold tracking-[0.07em] text-[var(--ks-text-primary)]">
          KINTO STUDIO
        </p>
        <p className="text-sm text-[var(--ks-text-secondary)] mt-1.5 leading-relaxed">
          {t(language, 'footerShortSubtitle')}
        </p>
      </div>

      {/* Section B — Newsletter Subscription */}
      <section aria-labelledby="mobile-newsletter-heading" className="py-6 border-b border-[var(--ks-divider)] space-y-3.5">
        <div className="space-y-1">
          <h2
            id="mobile-newsletter-heading"
            className="[font-family:var(--ks-font-sans)] text-[17px] font-semibold tracking-tight text-[var(--ks-text-primary)]"
          >
            {t(language, 'newsletterUpdates')}
          </h2>
          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            {t(language, 'newsletterSubtext')}
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="space-y-2.5" noValidate>
          <label htmlFor="mobile-footer-newsletter" className="sr-only">
            {t(language, 'newsletterUpdates')}
          </label>
          <input
            id="mobile-footer-newsletter"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (feedback?.type === 'error') setFeedback(null);
            }}
            placeholder={t(language, 'newsletterPlaceholder')}
            aria-invalid={feedback?.type === 'error'}
            aria-describedby={feedback ? 'mobile-footer-newsletter-feedback' : undefined}
            className={`w-full min-h-[52px] px-4 py-3 text-base rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none transition-colors ${
              feedback?.type === 'error'
                ? 'border-[var(--ks-error)]'
                : 'border-[var(--ks-border-strong)] focus:border-[var(--ks-action)]'
            }`}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={subscribing}
            className="!min-h-[52px]"
          >
            <span>{subscribing ? t(language, 'subscribing') : t(language, 'subscribe')}</span>
            {!subscribing && <ArrowRight className="w-4 h-4 rtl:rotate-180 shrink-0" aria-hidden="true" />}
          </Button>

          {feedback && (
            <p
              id="mobile-footer-newsletter-feedback"
              role={feedback.type === 'error' ? 'alert' : 'status'}
              aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
              className={`flex items-start gap-2 text-xs leading-snug pt-0.5 ${
                feedback.type === 'error'
                  ? 'text-[var(--ks-error)]'
                  : feedback.type === 'success'
                  ? 'text-[var(--ks-success)]'
                  : 'text-[var(--ks-text-primary)]'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--ks-accent)]" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </p>
          )}
        </form>

        <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
          {t(language, 'newsletterPrivacyPrefix')}{' '}
          <button
            type="button"
            onClick={() => navigate({ name: 'privacy-policy' })}
            className="underline text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] inline-flex items-center min-h-[44px] py-1 -my-2.5 cursor-pointer"
          >
            {t(language, 'privacyPolicy')}
          </button>
          .
        </p>
      </section>

      {/* Section C — Social Media (renders only when verified business URLs exist) */}
      {VERIFIED_SOCIAL_LINKS.length > 0 && (
        <section
          aria-label={t(language, 'followUsHeading')}
          className="py-5 border-b border-[var(--ks-divider)] flex items-center justify-between gap-3 flex-wrap"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--ks-text-muted)]">
            {t(language, 'followUsHeading')}
          </p>
          <div className="flex items-center gap-2">
            {VERIFIED_SOCIAL_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="min-w-[44px] min-h-[44px] px-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-surface)] text-xs font-medium text-[var(--ks-text-primary)] hover:border-[var(--ks-action)] inline-flex items-center justify-center"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Section D — Four Expandable Accordion Navigation Groups */}
      <nav
        aria-label={t(language, 'footerNavAria')}
        className="border-b border-[var(--ks-divider)] divide-y divide-[var(--ks-divider)]"
      >
        {accordionGroups.map((group) => {
          const isOpen = Boolean(openGroups[group.id]);
          const triggerId = `footer-acc-btn-${group.id}`;
          const panelId = `footer-acc-panel-${group.id}`;
          return (
            <div key={group.id}>
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.id)}
                  className="w-full min-h-[54px] py-3 flex items-center justify-between gap-3 text-start text-[16px] font-semibold text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer transition-colors"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-[18px] h-[18px] text-[var(--ks-text-muted)] shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
                      isOpen ? 'rotate-180 text-[var(--ks-text-primary)]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="pb-3.5 pt-0.5 space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <button
                          type="button"
                          tabIndex={isOpen ? 0 : -1}
                          onClick={link.onClick}
                          className={`w-full min-h-[44px] py-2 flex items-center text-start text-[15px] leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer transition-colors ${
                            link.emphasize
                              ? 'font-medium text-[var(--ks-text-primary)]'
                              : 'text-[var(--ks-text-secondary)]'
                          }`}
                        >
                          <span>{link.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Section E — Shopping Preferences */}
      <section aria-labelledby="mobile-preferences-heading" className="py-6 border-b border-[var(--ks-divider)] space-y-3">
        <p id="mobile-preferences-heading" className="ks-eyebrow">
          {t(language, 'shoppingPreferencesHeading')}
        </p>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5">
          <label className="min-h-[48px] px-3 py-1.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] focus-within:border-[var(--ks-action)] flex items-center justify-between gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ks-text-muted)] shrink-0">
              <Globe className="w-3.5 h-3.5 text-[var(--ks-accent)]" aria-hidden="true" />
              <span>{t(language, 'languageLabel')}</span>
            </span>
            <select
              aria-label={t(language, 'languageLabel')}
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="min-w-0 flex-1 bg-transparent text-end text-sm font-medium text-[var(--ks-text-primary)] focus:outline-none min-h-[40px] cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option
                  key={opt.code}
                  value={opt.code}
                  className="bg-[var(--ks-surface)] text-[var(--ks-text-primary)]"
                >
                  {opt.nativeName}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={toggleCurrency}
            aria-label={`${t(language, 'currencyLabel')}: ${
              currency === 'BDT' ? 'BDT (৳)' : 'USD ($)'
            }`}
            className="min-h-[48px] px-3 py-1.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] hover:border-[var(--ks-action)] flex items-center justify-between gap-2 text-start cursor-pointer min-w-0"
          >
            <span className="text-xs text-[var(--ks-text-muted)] truncate">
              {t(language, 'currencyLabel')}
            </span>
            <span className="font-mono-num text-sm font-medium text-[var(--ks-text-primary)] shrink-0">
              {currency === 'BDT' ? 'BDT (৳)' : 'USD ($)'}
            </span>
          </button>
        </div>

        <p className="text-xs text-[var(--ks-text-muted)] leading-snug">
          {t(language, 'currencySettlementNote')}
        </p>

        <button
          type="button"
          onClick={openCookiePreferences}
          className="w-full min-h-[48px] px-3.5 py-2.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] hover:border-[var(--ks-action)] flex items-center justify-between gap-3 text-start cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Cookie className="w-4 h-4 text-[var(--ks-accent)] shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--ks-text-primary)] truncate">
              {t(language, 'cookiePreferences')}
            </span>
          </span>
          <span className="font-mono-num text-xs font-medium text-[var(--ks-accent)] shrink-0">
            {t(language, getCookieConsentStatusKey(cookieConsent.status))}
          </span>
        </button>

        <PWAInstallButton variant="drawer" />
      </section>

      {/* Section F — Payment Methods (strictly active verified checkout channels) */}
      {activePaymentMethods.length > 0 && (
        <section
          aria-labelledby="mobile-payments-heading"
          className="py-5 border-b border-[var(--ks-divider)] space-y-2.5"
        >
          <p id="mobile-payments-heading" className="ks-eyebrow">
            {t(language, 'acceptedPaymentsHeading')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {activePaymentMethods.map((methodId) => (
              <PaymentMethodBadge key={methodId} methodId={methodId} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* Section G — Copyright, Legal Bottom Bar & Docked Non-Obstructive Back-to-Top */}
      <div className="pt-5 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
            {t(language, 'footerAllRightsReserved', { year: String(copyrightYear) })}
          </p>

          <button
            type="button"
            onClick={() => scrollPageToTop()}
            aria-label={t(language, 'scrollBackToTop')}
            className="w-11 h-11 rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] hover:border-[var(--ks-action)] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ks-text-secondary)]">
          <button
            type="button"
            onClick={() => navigate({ name: 'privacy-policy' })}
            className="min-h-[44px] px-1 inline-flex items-center hover:text-[var(--ks-text-primary)] cursor-pointer"
          >
            {t(language, 'footerShortPrivacy')}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => navigate({ name: 'terms' })}
            className="min-h-[44px] px-1 inline-flex items-center hover:text-[var(--ks-text-primary)] cursor-pointer"
          >
            {t(language, 'footerShortTerms')}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => navigate({ name: 'cookie-policy' })}
            className="min-h-[44px] px-1 inline-flex items-center hover:text-[var(--ks-text-primary)] cursor-pointer"
          >
            {t(language, 'footerShortCookies')}
          </button>
        </div>
      </div>
    </div>
  );
};
