import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { PWAInstallGuideModal } from './PWAInstallButton';

export const PWAInstallBanner: React.FC = () => {
  const { language, cookieConsent, cookieModalOpen, route, showToast } = useStore();
  const { isInstalled, isInstallable, isIOS, bannerDismissed, install, dismissBanner } =
    usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  // Defer while CookieConsentBanner is unset so floating bottom banners never stack simultaneously
  const deferToCookie = cookieConsent.status === 'unset' && !cookieModalOpen;
  // On Product Detail mobile, avoid stacking above the fixed sticky purchase bar
  const hideOnMobilePdp = route.name === 'product';
  const showBanner = !isInstalled && !bannerDismissed && !deferToCookie;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast(
          t(language, 'installedToastTitle'),
          t(language, 'installedToastDesc'),
          'success'
        );
      }
      return;
    }
    setGuideOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.aside
            key="pwa-install-banner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={STUDIO_TRANSITION.fast}
            role="region"
            aria-label={t(language, 'installAppAria')}
            className={`print:hidden ${
              hideOnMobilePdp || deferToCookie ? 'hidden lg:flex' : 'flex'
            } fixed bottom-2 inset-x-2 sm:inset-x-auto sm:start-5 sm:bottom-5 sm:max-w-[380px] z-40 rounded-lg bg-[var(--ks-surface)]/95 backdrop-blur-md border border-[var(--ks-border)] shadow-xl p-2.5 sm:p-3.5 items-center justify-between gap-3`}
            style={{ paddingBottom: 'calc(0.625rem + var(--sab, 0px))' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] flex items-center justify-center shrink-0">
                <Smartphone
                  className="w-4 h-4 text-[var(--ks-accent)]"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--ks-text-primary)] leading-snug truncate">
                  {t(language, 'installAppTitle')}
                </p>
                <p className="text-[11px] text-[var(--ks-text-secondary)] leading-snug truncate">
                  {isIOS
                    ? t(language, 'installBannerIosSub')
                    : t(language, 'installBannerSub')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                className="!px-3 text-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t(language, 'installAppBtn')}</span>
              </Button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label={t(language, 'dismissInstallPrompt')}
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <PWAInstallGuideModal
        open={guideOpen}
        isIOS={isIOS}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
};
