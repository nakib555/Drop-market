import React from 'react';
import { AlertCircle, ArrowRight, RefreshCw, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { t } from '../../utils/i18n';

export type RegistrationErrorCategory =
  | 'duplicate_email'
  | 'validation'
  | 'policy'
  | 'network'
  | 'server';

export interface RegistrationErrorInfo {
  category: RegistrationErrorCategory;
  title: string;
  message: string;
  details?: string[];
  email?: string;
}

interface RegistrationErrorAlertProps {
  error: RegistrationErrorInfo | null;
  onDismiss: () => void;
  onSwitchToSignIn?: (email: string) => void;
  onRetry?: () => void;
}

export const RegistrationErrorAlert: React.FC<RegistrationErrorAlertProps> = ({
  error,
  onDismiss,
  onSwitchToSignIn,
  onRetry,
}) => {
  const { language } = useStore();
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-3.5 rounded-md border border-[#F5C2C0] dark:border-[#7F1D1D] bg-[#FEF2F2] dark:bg-[#2A1215] text-[#7F1D1D] dark:text-[#FECACA] space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertCircle
            className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C] dark:text-[#F87171]"
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1">
            <h3 className="text-xs font-semibold text-[#991B1B] dark:text-[#FCA5A5]">
              {error.title}
            </h3>
            <p className="text-xs leading-relaxed text-[#7F1D1D] dark:text-[#FECACA]">
              {error.message}
            </p>
            {error.details && error.details.length > 0 && (
              <ul className="list-disc ps-4 space-y-0.5 text-[11px] leading-snug text-[#991B1B] dark:text-[#FCA5A5]">
                {error.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label={t(language, 'dismissError')}
          className="min-w-[44px] min-h-[44px] sm:min-w-[34px] sm:min-h-[34px] -me-1.5 -mt-1.5 flex items-center justify-center rounded text-[#991B1B] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#3F1A1D] transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {(error.category === 'duplicate_email' && error.email && onSwitchToSignIn) ||
      ((error.category === 'network' || error.category === 'server') && onRetry) ? (
        <div className="flex flex-wrap items-center gap-2 ps-6 pt-0.5">
          {error.category === 'duplicate_email' && error.email && onSwitchToSignIn && (
            <button
              type="button"
              onClick={() => onSwitchToSignIn(error.email!)}
              className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs sm:text-[11px] font-medium bg-[#171716] text-white hover:bg-[#2C2C2A] dark:bg-[#F4F3EF] dark:text-[#171716] dark:hover:bg-[#E5E3DD] transition-colors cursor-pointer"
            >
              <span>{t(language, 'signInWithEmail', { email: error.email })}</span>
              <ArrowRight className="w-3 h-3 rtl:rotate-180" aria-hidden="true" />
            </button>
          )}
          {(error.category === 'network' || error.category === 'server') && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded text-xs sm:text-[11px] font-medium border border-[#DC2626]/40 dark:border-[#F87171]/40 text-[#991B1B] dark:text-[#FCA5A5] hover:bg-[#FEE2E2] dark:hover:bg-[#3F1A1D] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>{t(language, 'tryAgain')}</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
