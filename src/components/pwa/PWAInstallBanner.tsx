import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { PWAInstallGuideModal } from './PWAInstallButton';

export const PWAInstallBanner: React.FC = () => {
  const { cookieConsent, cookieModalOpen, route, showToast } = useStore();
  const { isInstalled, isInstallable, isIOS, bannerDismissed, install, dismissBanner } =
    usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled || bannerDismissed) {
    return null;
  }

  // On small mobile screens, defer while the cookie consent bar is unset so only one bottom bar displays at a time
  const deferMobileToCookie = cookieConsent.status === 'unset' && !cookieModalOpen;
  // On Product Detail mobile, avoid stacking above the fixed sticky purchase bar
  const hideOnMobilePdp = route.name === 'product';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast(
          'Kinto Studio installed',
          'Launch anytime directly from your home screen or app dock.',
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
        <motion.aside
          key="pwa-install-banner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={STUDIO_TRANSITION.fast}
          role="region"
          aria-label="Install Kinto Studio app"
          className={`${
            hideOnMobilePdp
              ? 'hidden lg:flex'
              : deferMobileToCookie
              ? 'hidden sm:flex'
              : 'flex'
          } fixed bottom-2 left-2 right-2 sm:right-auto sm:left-5 sm:bottom-5 sm:max-w-[380px] z-40 rounded-lg bg-[#FFFFFF]/95 dark:bg-[#191917]/95 backdrop-blur-md border border-[#E5E3DD] dark:border-[#2C2C28] shadow-xl p-2.5 sm:p-3.5 items-center justify-between gap-3`}
          style={{ paddingBottom: 'calc(0.625rem + var(--sab, 0px))' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] border border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-center shrink-0">
              <Smartphone
                className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#171716] dark:text-[#F4F3EF] leading-snug truncate">
                Install Kinto Studio App
              </p>
              <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] leading-snug truncate">
                {isIOS
                  ? 'Add to Home Screen for standalone access'
                  : 'Fast app launch & offline catalog browsing'}
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
              <span>Install</span>
            </Button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss install prompt"
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      <PWAInstallGuideModal
        open={guideOpen}
        isIOS={isIOS}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
};
