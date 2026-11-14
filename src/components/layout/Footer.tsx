import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Button } from '../ui/Button';

export const Footer: React.FC = () => {
  const {
    categories,
    currency,
    currencyConfig,
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
    showToast('Subscribed to Studio Dispatch', 'Look for our seasonal monograph in your inbox.', 'success');
  };

  return (
    <footer className="bg-[#F2F0EC] dark:bg-[#161614] border-t border-[#E5E3DD] dark:border-[#2C2C28] text-[#171716] dark:text-[#F4F3EF] mt-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-12 border-b border-[#DCD9D0] dark:border-[#2C2C28]">
          {/* Newsletter & Identity */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="font-display text-2xl font-semibold tracking-[0.08em]">KINTO STUDIO</p>
              <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] mt-2 max-w-sm leading-relaxed">
                Universal 10-department marketplace across electronics, fashion, furniture, beauty, grocery, outdoors, books, tools, baby, and wellness—settled securely in BDT and USD.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="max-w-md space-y-2" noValidate>
              <label htmlFor="footer-newsletter" className="block text-xs font-medium">
                Receive Studio Dispatches &amp; New Releases
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
                  placeholder="name@domain.com"
                  className="flex-1 min-h-[42px] px-3.5 py-2 text-sm rounded-md bg-white dark:bg-[#1E1E1B] border border-[#DCD9D0] dark:border-[#2E2E2A] focus:border-[#171716] dark:focus:border-[#F4F3EF]"
                />
                <Button type="submit" variant="primary" size="md">
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              {emailError && (
                <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{emailError}</p>
              )}
            </form>
            <p className="text-[11px] font-mono-num text-[#84827B]">
              FX Reference: 1 USD = ৳{currencyConfig.rates.BDT.toFixed(2)} ({currencyConfig.source})
            </p>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <p className="text-xs uppercase tracking-wider text-[#84827B]">
                Departments ({categories.length})
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#5C5B57] dark:text-[#B4B2AC]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'shop', category: 'all' })}
                    className="hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer text-left leading-snug font-medium"
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'category', category: cat.slug })}
                      className="hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer text-left leading-snug"
                    >
                      {cat.shortName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-[#84827B]">Marketplace</p>
              <ul className="space-y-2.5 text-[#5C5B57] dark:text-[#B4B2AC]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'about' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'brands' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Partner Makers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'journal' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Journal
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'offers' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Special Offers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'compare' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Compare Products
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-[#84827B]">Client Care</p>
              <ul className="space-y-2.5 text-[#5C5B57] dark:text-[#B4B2AC]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'track-order' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Track Order
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'account', accountTab: 'overview' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Account &amp; Portals
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'seller' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Seller Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'contact' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Contact Concierge
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'faq' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-[#84827B]">Legal &amp; Policies</p>
              <ul className="space-y-2 text-[#5C5B57] dark:text-[#B4B2AC]">
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'legal' })}
                    className="text-left font-medium text-[#171716] dark:text-[#F4F3EF] leading-snug hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                  >
                    Legal Center
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'terms' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'privacy-policy' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'cookie-policy' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Cookie Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'shipping-policy' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Shipping Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'return-policy' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Returns &amp; Refunds
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'seller-agreement' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Seller Agreement
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'product-safety' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Safety Disclaimers
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'intellectual-property' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    IP &amp; DMCA Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'accessibility' })}
                    className="text-left leading-snug hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Accessibility
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
          <p>© 2026 Kinto Studio LLC · Bangladesh Law &amp; Dhaka Courts · legal@kintostudio.example</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="hidden lg:inline text-[#84827B]">
              Payments: bKash · Nagad · Rocket · Visa · Mastercard · COD
            </span>
            <span className="hidden lg:inline" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={toggleCurrency}
              className="font-mono-num text-left whitespace-nowrap hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
            >
              Currency: {currency === 'BDT' ? 'BDT (৳)' : 'USD ($)'}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="text-left whitespace-nowrap hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
            >
              Cookie Preferences
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => navigate({ name: 'maintenance' })}
              className="text-left whitespace-nowrap hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
            >
              Service Status
            </button>
            <PWAInstallButton variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
};
