import React, { useRef } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { AccountDirectoryEntry } from '../../types/commerce';
import { t, type UiStringKey } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { useOverlayLock } from '../../utils/scrollLock';
import { useFocusTrap } from '../ui/Primitives';
import { AuthPanel } from './AuthPanel';

export const AuthModal: React.FC = () => {
  const {
    language,
    authModalOpen,
    setAuthModalOpen,
    authModalTab,
    authModalStayOnPage,
    authPromptContext,
    authPrefill,
    cancelAuthPrompt,
    resumePendingActionAfterAuth,
    navigate,
  } = useStore();

  const panelRef = useRef<HTMLDivElement | null>(null);
  useOverlayLock(authModalOpen, 'auth-modal', cancelAuthPrompt);
  useFocusTrap(authModalOpen, panelRef);

  const handleSuccess = async (user: AccountDirectoryEntry) => {
    const stayHere = authModalStayOnPage;
    setAuthModalOpen(false);
    const handled = await resumePendingActionAfterAuth(user);
    if (!handled && !stayHere) {
      if (user.role === 'admin') {
        navigate({ name: 'admin' });
      } else if (user.role === 'seller') {
        navigate({ name: 'seller' });
      } else {
        navigate({ name: 'account', accountTab: 'overview' });
      }
    }
  };

  const titleText = authPromptContext
    ? t(language, authPromptContext.titleKey as UiStringKey)
    : t(language, 'authModalTitle');

  const descText = authPromptContext
    ? t(language, authPromptContext.descriptionKey as UiStringKey)
    : null;

  return (
    <AnimatePresence>
      {authModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-heading"
          data-testid="auth-modal-dialog"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={cancelAuthPrompt}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={STUDIO_TRANSITION.sheet}
            className="relative z-10 w-full sm:max-w-4xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain bg-[var(--ks-surface)] text-[var(--ks-text-primary)] rounded-t-2xl sm:rounded-[var(--ks-radius-lg)] border-t sm:border border-[var(--ks-border)] shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 focus:outline-none"
          >
            {/* Mobile Sheet Handle */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <span className="w-10 h-1 rounded-full bg-[var(--ks-border-strong)]" aria-hidden="true" />
            </div>

            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 px-5 sm:px-7 py-4 bg-[var(--ks-surface)]/95 backdrop-blur-sm border-b border-[var(--ks-border)]">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="auth-modal-heading"
                    className="font-display text-lg sm:text-xl font-medium tracking-tight"
                  >
                    {titleText}
                  </h2>
                  {authPromptContext?.itemName && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] text-[11px] font-medium text-[var(--ks-text-secondary)] max-w-[260px] truncate">
                      <Sparkles className="w-3 h-3 text-[var(--ks-accent)] shrink-0" />
                      <span className="truncate">{authPromptContext.itemName}</span>
                    </span>
                  )}
                </div>
                {descText && (
                  <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed max-w-2xl">
                    {descText}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={cancelAuthPrompt}
                aria-label={t(language, 'authCtxCloseButton')}
                data-testid="auth-modal-close"
                className="w-11 h-11 rounded-[var(--ks-radius-md)] flex items-center justify-center shrink-0 text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preserved State Banner */}
            {authPromptContext && (
              <div className="mx-5 sm:mx-7 mt-4 px-3.5 py-2.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ks-text-secondary)]">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                  <span>{t(language, 'authCtxPreservedHint')}</span>
                </span>
              </div>
            )}

            <div className="p-5 sm:p-7">
              <AuthPanel
                key={`${authModalTab}-${authModalOpen}-${authPromptContext?.actionId || 'default'}`}
                initialTab={authModalTab}
                compact
                promptContext={authPromptContext}
                prefill={authPrefill}
                onSuccess={handleSuccess}
                onDismiss={cancelAuthPrompt}
                onOpenFullPage={() => {
                  setAuthModalOpen(false);
                  navigate({ name: 'login', accountTab: authModalTab });
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
