import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { scrollPageToTop } from '../../data/brandConfig';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';

export const BackToTopButton: React.FC = () => {
  const { route, language, cookieConsent, cookieModalOpen } = useStore();
  const { isInstalled, bannerDismissed } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [nearFooterEnd, setNearFooterEnd] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y > 520);
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      setNearFooterEnd(y + winHeight >= docHeight - 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [route.name]);

  const hasCookieBanner = cookieConsent.status === 'unset' && !cookieModalOpen;
  const hasPwaBanner =
    !isInstalled && !bannerDismissed && !hasCookieBanner && route.name !== 'product';
  const hasMobileBottomBanner = hasCookieBanner || hasPwaBanner;

  const bottomClass =
    route.name === 'product'
      ? 'bottom-20 lg:bottom-6'
      : hasMobileBottomBanner
      ? 'bottom-[max(6.25rem,calc(env(safe-area-inset-bottom,0px)+5.5rem))] sm:bottom-6'
      : nearFooterEnd
      ? 'bottom-[max(4.25rem,calc(env(safe-area-inset-bottom,0px)+3.5rem))] sm:bottom-16'
      : 'bottom-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] sm:bottom-6';

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          type="button"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={STUDIO_TRANSITION.base}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scrollPageToTop()}
          data-scroll-top-btn="true"
          aria-label={t(language, 'scrollBackToTop')}
          className={`print:hidden fixed ${bottomClass} end-4 sm:end-6 z-30 w-11 h-11 rounded-[var(--ks-radius-md)] bg-[var(--ks-action)]/92 text-[var(--ks-action-text)] border border-[var(--ks-border-strong)] shadow-lg backdrop-blur-sm flex items-center justify-center cursor-pointer transition-[bottom] duration-200`}
        >
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
