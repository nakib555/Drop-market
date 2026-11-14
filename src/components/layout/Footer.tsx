import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const {
    categories,
    currency,
    toggleCurrency,
    navigate,
    showToast,
    openCookiePreferences,
  } = useStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setEmail('');
    showToast('Subscribed', 'You are added to Kinto Studio product updates.', 'success');
  };

  return (
    <footer className="bg-[var(--ks-bg-secondary)] border-t border-[var(--ks-border)] text-[var(--ks-text-primary)] mt-20">
      <div className="ks-container py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-[var(--ks-border-strong)]">
          {/* Newsletter & Brand Overview */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[0.07em]">
                KINTO STUDIO
              </p>
              <p className="text-sm text-[var(--ks-text-secondary)] mt-2 max-w-sm leading-relaxed">
                Everyday essentials across ten departments—technology, fashion, home, beauty, grocery, outdoors, books, tools, baby care, and wellness—with BDT and USD pricing across Bangladesh.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="max-w-md space-y-2" noValidate>
              <label htmlFor="footer-newsletter" className="block text-xs font-medium text-[var(--ks-text-primary)]">
                Newsletter Updates
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="footer-newsletter"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Enter your email address"
                  aria-invalid={Boolean(emailError)}
                  className="flex-1 min-h-[var(--ks-height-md)] px-3.5 py-2 text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none focus:border-[var(--ks-action)]"
                />
                <Button type="submit" variant="primary" size="md">
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-[var(--ks-error)]" role="alert">
                  {emailError}
                </p>
              )}
            </form>

            <p className="text-xs text-[var(--ks-text-muted)]">
              Support channels and registered business contact details are maintained under Contact &amp; Legal Center.
            </p>
          </div>

          {/* Footer Link Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <p className="ks-eyebrow">Departments ({categories.length})</p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--ks-text-secondary)]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'shop', category: 'all' })}
                    className="hover:text-[var(--ks-text-primary)] cursor-pointer text-left leading-snug font-medium"
                  >
                    Shop All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'category', category: cat.slug })}
                      className="hover:text-[var(--ks-text-primary)] cursor-pointer text-left leading-snug"
                    >
                      {cat.shortName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="ks-eyebrow">Shop</p>
              <ul className="space-y-2.5 text-[var(--ks-text-secondary)]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'about' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    About Kinto Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'brands' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Featured Brands
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'shop', collection: 'new-arrivals', category: 'all' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    New Arrivals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'offers' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Special Offers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'journal' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Journal
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="ks-eyebrow">Customer Care</p>
              <ul className="space-y-2.5 text-[var(--ks-text-secondary)]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Track Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'account', accountTab: 'overview' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    My Account
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'shipping-policy' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Delivery Information
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'return-policy' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Returns &amp; Refunds
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'contact' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Contact &amp; Support
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'faq' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Help &amp; FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="ks-eyebrow">Policies &amp; Legal</p>
              <ul className="space-y-2 text-[var(--ks-text-secondary)]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'legal' })}
                    className="text-left font-medium text-[var(--ks-text-primary)] leading-snug hover:text-[var(--ks-accent)] cursor-pointer"
                  >
                    Legal Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'terms' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'privacy-policy' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'cookie-policy' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'seller-agreement' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Seller Terms
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'product-safety' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Product Safety
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'intellectual-property' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    IP Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'accessibility' })}
                    className="text-left leading-snug hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    Accessibility
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--ks-text-secondary)]">
          <p>© 2026 Kinto Studio · Operated for Bangladesh retail</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="hidden lg:inline text-[var(--ks-text-muted)]">
              Payments: bKash · Nagad · Rocket · Cards · COD
            </span>
            <span className="hidden lg:inline" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={toggleCurrency}
              className="font-mono-num text-left whitespace-nowrap hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              Currency: {currency === 'BDT' ? 'BDT (৳)' : 'USD ($)'}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="text-left whitespace-nowrap hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              Cookie Preferences
            </button>
            <PWAInstallButton variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
};
