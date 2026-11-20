import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { subscribeNewsletterApi } from '../../services/api';
import {
  LANGUAGE_OPTIONS,
  t,
  translateDepartmentShortName,
} from '../../utils/i18n';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Button } from '../ui/Button';
import { MobileFooter } from './MobileFooter';

type FooterGroupId = 'departments' | 'shop' | 'care' | 'legal';

interface FooterLinkItem {
  label: string;
  onClick: () => void;
  emphasize?: boolean;
}

export const Footer: React.FC = () => {
  const {
    categories,
    currency,
    language,
    setLanguage,
    toggleCurrency,
    navigate,
    showToast,
    openCookiePreferences,
    publishedPolicies,
  } = useStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const policyCount = publishedPolicies.length || 20;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t(language, 'newsletterError'));
      return;
    }
    setEmailError('');
    setSubscribing(true);
    try {
      const res = await subscribeNewsletterApi(email.trim(), 'footer');
      setEmail('');
      showToast(
        res.alreadySubscribed ? 'Already subscribed' : 'Subscribed',
        res.message,
        res.alreadySubscribed ? 'info' : 'success'
      );
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Unable to subscribe right now.');
    } finally {
      setSubscribing(false);
    }
  };

  const desktopColumns: {
    id: FooterGroupId;
    title: string;
    links: FooterLinkItem[];
  }[] = [
    {
      id: 'departments',
      title: t(language, 'departmentsWithCount', { count: categories.length }),
      links: [
        {
          label: t(language, 'shopAll'),
          onClick: () => navigate({ name: 'shop', category: 'all' }),
          emphasize: true,
        },
        ...categories.map((cat) => ({
          label: translateDepartmentShortName(language, cat.slug, cat.shortName),
          onClick: () => navigate({ name: 'category', category: cat.slug }),
        })),
      ],
    },
    {
      id: 'shop',
      title: t(language, 'footerShopHeading'),
      links: [
        { label: t(language, 'aboutKinto'), onClick: () => navigate({ name: 'about' }) },
        { label: t(language, 'featuredBrands'), onClick: () => navigate({ name: 'brands' }) },
        {
          label: t(language, 'newArrivals'),
          onClick: () => navigate({ name: 'shop', collection: 'new-arrivals', category: 'all' }),
        },
        { label: t(language, 'specialOffers'), onClick: () => navigate({ name: 'offers' }) },
        { label: t(language, 'journal'), onClick: () => navigate({ name: 'journal' }) },
        {
          label: t(language, 'becomeSellerLink'),
          onClick: () => navigate({ name: 'login', accountTab: 'register' }),
        },
      ],
    },
    {
      id: 'care',
      title: t(language, 'footerCareHeading'),
      links: [
        { label: t(language, 'trackOrder'), onClick: () => navigate({ name: 'track-order' }) },
        {
          label: t(language, 'myAccount'),
          onClick: () => navigate({ name: 'account', accountTab: 'overview' }),
        },
        { label: t(language, 'shippingDelivery'), onClick: () => navigate({ name: 'shipping-policy' }) },
        { label: t(language, 'returnsRefunds'), onClick: () => navigate({ name: 'return-policy' }) },
        { label: t(language, 'warrantyPolicy'), onClick: () => navigate({ name: 'warranty-policy' }) },
        { label: t(language, 'contactSupport'), onClick: () => navigate({ name: 'contact' }) },
        { label: t(language, 'helpFaq'), onClick: () => navigate({ name: 'faq' }) },
        { label: t(language, 'accessibility'), onClick: () => navigate({ name: 'accessibility' }) },
      ],
    },
    {
      id: 'legal',
      title: t(language, 'footerLegalHeading'),
      links: [
        {
          label: `${t(language, 'policiesAndHelpCenter')} (${policyCount})`,
          onClick: () => navigate({ name: 'legal' }),
          emphasize: true,
        },
        { label: t(language, 'termsConditions'), onClick: () => navigate({ name: 'terms' }) },
        { label: t(language, 'privacyPolicy'), onClick: () => navigate({ name: 'privacy-policy' }) },
        { label: t(language, 'cookiePolicy'), onClick: () => navigate({ name: 'cookie-policy' }) },
        { label: t(language, 'cancellationPolicy'), onClick: () => navigate({ name: 'cancellation-policy' }) },
        { label: t(language, 'paymentPolicy'), onClick: () => navigate({ name: 'payment-policy' }) },
        { label: t(language, 'marketplaceTerms'), onClick: () => navigate({ name: 'marketplace-terms' }) },
        { label: t(language, 'sellerTerms'), onClick: () => navigate({ name: 'seller-agreement' }) },
        { label: t(language, 'reviewsPolicy'), onClick: () => navigate({ name: 'reviews-policy' }) },
      ],
    },
  ];

  return (
    <footer
      id="site-footer"
      className="print:hidden bg-[var(--ks-bg-secondary)] border-t border-[var(--ks-border)] text-[var(--ks-text-primary)] mt-10 sm:mt-12"
    >
      {/* Mobile-First Editorial Accordion Footer (< 768px) */}
      <MobileFooter />

      {/* Tablet & Desktop Multi-Column Architecture (>= 768px) */}
      <div className="hidden md:block ks-container py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-8 lg:pb-10 border-b border-[var(--ks-border-strong)]">
          {/* Newsletter & Brand Overview */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[0.07em]">
                KINTO STUDIO
              </p>
              <p className="text-sm text-[var(--ks-text-secondary)] mt-2 max-w-sm leading-relaxed">
                {t(language, 'footerOverview')}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="max-w-md space-y-2" noValidate>
              <label htmlFor="footer-newsletter" className="block text-xs font-medium text-[var(--ks-text-primary)]">
                {t(language, 'newsletterUpdates')}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  id="footer-newsletter"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder={t(language, 'newsletterPlaceholder')}
                  aria-invalid={Boolean(emailError)}
                  className="flex-1 h-11 px-3.5 py-2 text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none focus:border-[var(--ks-action)]"
                />
                <Button type="submit" variant="primary" size="md" className="h-11 shrink-0" disabled={subscribing}>
                  <span>{subscribing ? t(language, 'subscribing') : t(language, 'subscribe')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-[var(--ks-error)]" role="alert">
                  {emailError}
                </p>
              )}
            </form>

            <p className="text-xs text-[var(--ks-text-muted)] leading-relaxed">
              {t(language, 'footerSupportNote')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:col-span-8 gap-6 xl:gap-8 text-sm">
            {desktopColumns.map((col) => (
              <div key={col.id} className="space-y-3 min-w-0">
                <p className="ks-eyebrow">{col.title}</p>
                <ul className="space-y-2 text-xs sm:text-sm text-[var(--ks-text-secondary)]">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={link.onClick}
                        className={`text-start leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer ${
                          link.emphasize ? 'font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)]' : ''
                        }`}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Legal & Preferences Bar */}
        <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[var(--ks-text-secondary)]">
          <p>{t(language, 'footerCopyright')}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="hidden lg:inline text-[var(--ks-text-muted)]">
              {t(language, 'footerPayments')}
            </span>
            <span className="hidden lg:inline" aria-hidden="true">
              ·
            </span>
            <label className="inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]">
              <span>{t(language, 'languageLabel')}:</span>
              <select
                aria-label={t(language, 'languageLabel')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
                className="bg-transparent font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer focus:outline-none min-h-[36px]"
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
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={toggleCurrency}
              className="font-mono-num text-start whitespace-nowrap min-h-[36px] hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              {t(language, 'currencyLabel')}: {currency === 'BDT' ? 'BDT (৳)' : 'USD ($)'}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="text-start whitespace-nowrap min-h-[36px] hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              {t(language, 'cookiePreferences')}
            </button>
            <PWAInstallButton variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
};
