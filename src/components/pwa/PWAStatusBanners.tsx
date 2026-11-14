import React from 'react';
import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { STUDIO_TRANSITION } from '../../utils/motion';

export const PWAStatusBanners: React.FC = () => {
  const { route } = useStore();
  const { isOnline, justReconnected } = useOnlineStatus();
  const { needRefresh, updating, applyUpdate, dismiss } = usePWAUpdate();

  const bottomOffsetClass =
    route.name === 'product' ? 'bottom-16 lg:bottom-5' : 'bottom-4 sm:bottom-5';

  const hasBanner = !isOnline || justReconnected || needRefresh;
  if (!hasBanner) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed ${bottomOffsetClass} left-3 sm:left-5 z-50 flex flex-col gap-2 max-w-[calc(100vw-5.5rem)] sm:max-w-sm pointer-events-none pb-[env(safe-area-inset-bottom,0px)]`}
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
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg bg-[#171716] dark:bg-[#191917] text-[#F9F8F6] border border-[#8F6438]/50 dark:border-[#C89B67]/40 shadow-lg"
          >
            <WifiOff className="w-4 h-4 mt-[2px] text-[#E2B887] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-snug">Offline Mode</p>
              <p className="text-[11px] text-[#D5D3CD] leading-snug mt-0.5">
                Cached catalog active. Connect to place orders.
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
            className="pointer-events-auto flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] border border-[#1F6E43]/40 dark:border-[#4ADE80]/40 shadow-lg"
          >
            <Wifi className="w-4 h-4 text-[#1F6E43] dark:text-[#4ADE80] shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium leading-snug">Connection restored</p>
          </motion.div>
        )}

        {needRefresh && (
          <motion.div
            key="pwa-update-banner"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={STUDIO_TRANSITION.base}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] border border-[#E5E3DD] dark:border-[#2C2C28] shadow-lg"
          >
            <RefreshCw
              className={`w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0 ${
                updating ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-snug">Studio Update Ready</p>
              <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] leading-snug mt-0.5">
                Reload to apply the latest catalog enhancements.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={updating}
                  onClick={applyUpdate}
                  className="px-2.5 py-1 rounded bg-[#171716] dark:bg-[#F4F3EF] text-white dark:text-[#171716] text-[11px] font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Updating...' : 'Reload App'}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] hover:text-[#171716] dark:hover:text-[#F4F3EF] px-1.5 py-1 cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss update notification"
              className="text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] p-1 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
