import React, { useEffect, useState } from 'react';
import { Cookie, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { LEGAL_VERSION } from '../../data/legalPolicies';
import { PrivacyPrefs } from '../../types/commerce';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/FormFields';
import { Modal } from '../ui/Primitives';

export const CookieConsentBanner: React.FC = () => {
  const {
    language,
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
    publishedPolicies,
    policyFactsPublic,
    cookieInventory,
  } = useStore();

  const [draftPrefs, setDraftPrefs] = useState<PrivacyPrefs>(privacyPrefs);
  const cookiePolicyVersion =
    publishedPolicies.find((p) => p.id === 'cookie-policy')?.currentVersion || LEGAL_VERSION;

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
            data-cookie-banner="true"
            role="region"
            aria-label={t(language, 'cookiesTitle')}
            className="fixed bottom-2 inset-x-2 sm:inset-x-auto sm:end-5 sm:bottom-5 sm:max-w-md z-40 rounded-lg bg-[var(--ks-surface)]/95 backdrop-blur-md border border-[var(--ks-border)] shadow-xl p-2.5 sm:p-4 print:hidden"
            style={{ paddingBottom: 'calc(0.625rem + var(--sab, 0px))' }}
          >
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-start gap-2 sm:gap-2.5">
                <Cookie
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ks-accent)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <p className="hidden sm:block text-xs font-semibold text-[var(--ks-text-primary)]">
                    {t(language, 'cookiesTitle')}
                  </p>
                  <p className="text-[11px] leading-snug text-[var(--ks-text-secondary)]">
                    <span className="sm:hidden font-semibold text-[var(--ks-text-primary)]">
                      {t(language, 'cookiesTitle')}:{' '}
                    </span>
                    {t(language, 'cookiesShortDesc')}{' '}
                    <button
                      type="button"
                      onClick={() => openPolicyPreview('cookie-policy')}
                      className="underline text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                    >
                      {t(language, 'cookiePolicy')}
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
                  {t(language, 'essentialOnly')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCookiePreferences}
                  className="!px-2.5 sm:!px-3.5 text-[11px] sm:text-xs"
                >
                  {t(language, 'customize')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={acceptAllCookies}
                  className="!px-3 sm:!px-4 text-[11px] sm:text-xs"
                >
                  {t(language, 'acceptAll')}
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Modal
        open={cookieModalOpen}
        onClose={closeCookiePreferences}
        title={t(language, 'cookiesTitle')}
        maxWidthClass="max-w-lg"
      >
        <div className="space-y-5 text-sm">
          <p className="text-xs leading-relaxed text-[var(--ks-text-secondary)]">
            {t(language, 'cookieManagePrefsIntro', {
              name: policyFactsPublic.tradingName,
              version: cookiePolicyVersion,
            })}
          </p>

          <div className="p-3.5 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-semibold inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
                <span>{t(language, 'strictlyNecessaryTitle')}</span>
              </p>
              <p className="text-[11px] text-[var(--ks-text-secondary)] leading-snug">
                {t(language, 'strictlyNecessaryDesc')}
              </p>
            </div>
            <span className="text-[11px] font-mono-num font-medium text-[var(--ks-success)] shrink-0 whitespace-nowrap">
              {t(language, 'alwaysActive')}
            </span>
          </div>

          <div className="space-y-4">
            <Checkbox
              label={t(language, 'prefSaveSearchLabel')}
              description={t(language, 'prefSaveSearchDesc')}
              checked={draftPrefs.saveSearchHistory}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, saveSearchHistory: checked }))
              }
            />
            <Checkbox
              label={t(language, 'prefPersonalizedLabel')}
              description={t(language, 'prefPersonalizedDesc')}
              checked={draftPrefs.personalizedCatalog}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, personalizedCatalog: checked }))
              }
            />
            <Checkbox
              label={t(language, 'prefAnalyticsLabel')}
              description={t(language, 'prefAnalyticsDesc')}
              checked={draftPrefs.analyticsOptIn}
              onChange={(checked) =>
                setDraftPrefs((prev) => ({ ...prev, analyticsOptIn: checked }))
              }
            />
          </div>

          {cookieInventory.length > 0 && (
            <details className="rounded-md border border-[var(--ks-border)] bg-[var(--ks-bg)] p-3 text-[11px]">
              <summary className="font-medium text-[var(--ks-text-primary)] cursor-pointer select-none">
                {t(language, 'cookieInventorySummary', { count: cookieInventory.length })}
              </summary>
              <div className="mt-2.5 space-y-2 max-h-36 overflow-y-auto pe-1">
                {cookieInventory.map((item) => (
                  <div
                    key={item.key}
                    className="pt-2 border-t border-[var(--ks-border)] first:border-t-0 first:pt-0"
                  >
                    <p className="font-mono-num font-medium text-[var(--ks-text-primary)]">
                      {item.key} · <span className="text-[var(--ks-accent)]">{item.classification}</span>
                    </p>
                    <p className="text-[var(--ks-text-secondary)]">{item.purpose}</p>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="pt-2 border-t border-[var(--ks-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                closeCookiePreferences();
                navigate({ name: 'cookie-policy' });
              }}
              className="text-xs underline text-start text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              {t(language, 'readCookiePolicy')}
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={rejectNonEssentialCookies}>
                {t(language, 'essentialOnly')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveCookiePreferences(draftPrefs)}
              >
                {t(language, 'savePreferences')}
              </Button>
              <Button variant="primary" size="sm" onClick={acceptAllCookies}>
                {t(language, 'acceptAll')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
