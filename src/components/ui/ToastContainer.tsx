import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { STUDIO_TRANSITION } from '../../utils/motion';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast, route } = useStore();

  const positionClass =
    route.name === 'product'
      ? 'top-16 sm:top-auto sm:bottom-16 lg:bottom-5 inset-x-3 sm:inset-x-auto sm:end-5'
      : 'top-16 sm:top-auto sm:bottom-5 inset-x-3 sm:inset-x-auto sm:end-5';

  return (
    <div
      aria-live="polite"
      className={`print:hidden fixed ${positionClass} z-[60] flex flex-col gap-2 w-auto sm:w-[calc(100vw-2.5rem)] max-w-sm sm:ms-auto pointer-events-none`}
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
              ? 'text-[var(--ks-error)]'
              : toast.variant === 'info'
              ? 'text-[var(--ks-accent)]'
              : 'text-[var(--ks-success)]';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={STUDIO_TRANSITION.base}
              role="status"
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)]/95 backdrop-blur-md text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)] shadow-[var(--ks-shadow-overlay)]"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] min-w-[36px] min-h-[36px] -me-1.5 -mt-1 flex items-center justify-center rounded cursor-pointer transition-colors"
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
