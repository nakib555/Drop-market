import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { STUDIO_TRANSITION } from '../../utils/motion';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, route } = useStore();

  const bottomOffsetClass =
    route.name === 'product' ? 'bottom-16 lg:bottom-5' : 'bottom-4 sm:bottom-5';

  return (
    <div
      aria-live="polite"
      className={`fixed ${bottomOffsetClass} right-4 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none`}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'error'
              ? AlertCircle
              : toast.variant === 'info'
              ? Info
              : CheckCircle2;
          const iconColor =
            toast.variant === 'error'
              ? 'text-[#B91C1C] dark:text-[#F87171]'
              : toast.variant === 'info'
              ? 'text-[#8F6438] dark:text-[#C89B67]'
              : 'text-[#1F6E43] dark:text-[#4ADE80]';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={STUDIO_TRANSITION.base}
              role="status"
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] border border-[#E5E3DD] dark:border-[#2C2C28] shadow-lg"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5 truncate">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] p-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
