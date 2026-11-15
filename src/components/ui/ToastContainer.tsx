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
              ? 'text-[var(--ks-error)]'
              : toast.variant === 'info'
              ? 'text-[var(--ks-accent)]'
              : 'text-[var(--ks-success)]';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={STUDIO_TRANSITION.base}
              role="status"
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border)] shadow-lg"
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5 truncate">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] p-1.5 cursor-pointer transition-colors"
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
