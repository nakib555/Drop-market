import React, { useEffect, useState } from 'react';
import { Cookie, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { LEGAL_ENTITY, LEGAL_VERSION } from '../../data/legalPolicies';
import { PrivacyPrefs } from '../../types/commerce';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/FormFields';
import { Modal } from '../ui/Primitives';

export const CookieConsentBanner: React.FC = () => {
  const {
    cookieConsent,
    cookieModalOpen,
    openCookiePreferences,
    closeCookiePreferences,
    acceptAllCookies,
    rejectNonEssentialCookies,
    saveCookiePreferences,
    privacyPrefs,
    navigate,
    openPolicyPreview,
  } = useStore();

  const [draftPrefs, setDraftPrefs] = useState<PrivacyPrefs>(privacyPrefs);

  useEffect(() => {
    if (cookieModalOpen) {
      setDraftPrefs(privacyPrefs);
    }
  }, [cookieModalOpen, privacyPrefs]);

  const showBanner = cookieConsent.status === 'unset' && !cookieModalOpen;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.aside
            key="cookie-consent-banner"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={STUDIO_TRANSITION.fast}
            role="region"
            aria-label="Cookie and storage consent"
            className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-5 sm:bottom-5 sm:max-w-md z-40 rounded-lg bg-[#FFFFFF]/95 dark:bg-[#191917]/95 backdrop-blur-md border border-[#E5E3DD] dark:border-[#2C2C28] shadow-xl p-2.5 sm:p-4"
            style={{ paddingBottom: 'calc(0.625rem + var(--sab, 0px))' }}
          >
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <Cookie
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="hidden sm:block text-xs font-semibold text-[#171716] dark:text-[#F4F3EF]">
                    Cookies &amp; Privacy Preferences
                  </p>
                  <p className="text-[11px] leading-snug text-[#5C5B57] dark:text-[#A3A19B]">
                    <span className="sm:hidden font-semibold text-[#171716] dark:text-[#F4F3EF]">
                      Cookies &amp; Privacy:{' '}
                    </span>
                    Essential storage runs bag &amp; currency; optional preferences stay under your control.{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('cookie-policy')}
                      className="underline text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                    >
                      Cookie Policy
                    </button>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rejectNonEssentialCookies}
                  className="!px-2.5 sm:!px-3.5 text-[11px] sm:text-xs"
                >
                  Essential Only
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCookiePreferences}
                  className="!px-2.5 sm:!px-3.5 text-[11px] sm:text-xs"
                >
                  Customize
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={acceptAllCookies}
                  className="!px-3 sm:!px-4 text-[11px] sm:text-xs"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Modal
        open={cookieModalOpen}
        onClose={closeCookiePreferences}
        title="Cookie & Privacy Preferences"
        maxWidthClass="max-w-lg"
      >
        <div className="space-y-5 text-sm">
          <p className="text-xs leading-relaxed text-[#5C5B57] dark:text-[#A3A19B]">
            Manage how {LEGAL_ENTITY.legalName} stores browser data and optional storefront preferences (Policy v{LEGAL_VERSION}). Changes apply immediately across this browser.
          </p>

          <div className="p-3.5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
                <span>Strictly Necessary Cookies &amp; Session Storage</span>
              </p>
              <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] leading-snug">
                Required for shopping bag state, account login tokens, CSRF protection, currency selection, and offline PWA navigation.
              </p>
            </div>
            <span className="text-[11px] font-mono-num font-medium text-[#1F6E43] dark:text-[#4ADE80] shrink-0 whitespace-nowrap">
              Always Active
            </span>
          </div>

          <div className="space-y-4">
            <Checkbox
              label="Save Local Search History"
              description="Keep recent catalog lookups in local storage for faster repeat queries."
              checked={draftPrefs.saveSearchHistory}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, saveSearchHistory: checked }))
              }
            />
            <Checkbox
              label="Personalized Catalog & Recently Viewed"
              description="Remember viewed objects to tailor related studio recommendations."
              checked={draftPrefs.personalizedCatalog}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, personalizedCatalog: checked }))
              }
            />
            <Checkbox
              label="Anonymous Performance Diagnostics"
              description="Allow aggregated responsiveness and storefront reliability measurements."
              checked={draftPrefs.analyticsOptIn}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, analyticsOptIn: checked }))
              }
            />
          </div>

          <div className="pt-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                closeCookiePreferences();
                navigate({ name: 'cookie-policy' });
              }}
              className="text-xs underline text-left text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
            >
              Read full Cookie &amp; Storage Policy
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={rejectNonEssentialCookies}>
                Essential Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveCookiePreferences(draftPrefs)}
              >
                Save Preferences
              </Button>
              <Button variant="primary" size="sm" onClick={acceptAllCookies}>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
