import React from 'react';
import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';

export const PWAStatusBanners: React.FC = () => {
  const { language, route } = useStore();
  const { isOnline, justReconnected } = useOnlineStatus();
  const { needRefresh, updating, applyUpdate, dismiss } = usePWAUpdate();

  const bottomOffsetClass =
    route.name === 'product' ? 'bottom-16 lg:bottom-5' : 'bottom-4 sm:bottom-5';

  return (
    <div
      aria-live="polite"
      className={`print:hidden fixed ${bottomOffsetClass} start-3 sm:start-5 z-50 flex flex-col gap-2 max-w-[calc(100vw-5.5rem)] sm:max-w-sm pointer-events-none pb-[env(safe-area-inset-bottom,0px)]`}
    >
      <AnimatePresence mode="popLayout">
        {!isOnline && (
          <motion.div
            key="pwa-offline-banner"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={STUDIO_TRANSITION.base}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg bg-[var(--ks-action)] text-[var(--ks-action-text)] border border-[var(--ks-accent)]/50 shadow-lg"
          >
            <WifiOff className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-snug">{t(language, 'offlineModeTitle')}</p>
              <p className="text-[11px] opacity-80 leading-snug mt-0.5">
                {t(language, 'offlineModeDesc')}
              </p>
            </div>
          </motion.div>
        )}

        {isOnline && justReconnected && (
          <motion.div
            key="pwa-reconnected-banner"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={STUDIO_TRANSITION.base}
            role="status"
            className="pointer-events-auto flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-success)]/40 shadow-lg"
          >
            <Wifi className="w-4 h-4 text-[var(--ks-success)] shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium leading-snug">{t(language, 'reconnectedMsg')}</p>
          </motion.div>
        )}

        {(updating || needRefresh) && (
          <motion.div
            key="pwa-update-banner"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={STUDIO_TRANSITION.base}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border)] shadow-lg"
          >
            <RefreshCw
              className={`w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0 ${
                updating ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-snug">
                {updating ? t(language, 'updatingAppTitle') : t(language, 'updateReadyTitle')}
              </p>
              <p className="text-[11px] text-[var(--ks-text-secondary)] leading-snug mt-0.5">
                {updating ? t(language, 'updatingAppDesc') : t(language, 'updateReadyDesc')}
              </p>
              {!updating && needRefresh && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyUpdate}
                    className="min-h-[44px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded bg-[var(--ks-action)] text-[var(--ks-action-text)] text-xs sm:text-[11px] font-medium hover:bg-[var(--ks-action-hover)] cursor-pointer"
                  >
                    {t(language, 'reloadApp')}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="min-h-[44px] sm:min-h-0 text-xs sm:text-[11px] text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] px-2 py-1.5 sm:px-1.5 sm:py-1 cursor-pointer"
                  >
                    {t(language, 'laterLabel')}
                  </button>
                </div>
              )}
            </div>
            {!updating && (
              <button
                type="button"
                onClick={dismiss}
                aria-label={t(language, 'dismissUpdate')}
                className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 -me-2 -mt-2 sm:me-0 sm:mt-0 flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] p-1.5 cursor-pointer shrink-0 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
