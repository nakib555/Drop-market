import React, { useState } from 'react';
import { Download, MonitorSmartphone, PlusSquare, Share, Smartphone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { t } from '../../utils/i18n';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Primitives';

interface PWAInstallGuideModalProps {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  open,
  isIOS,
  onClose,
}) => {
  const { language } = useStore();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isIOS ? t(language, 'installIosTitle') : t(language, 'installAppTitle')}
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4 text-sm">
        <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
          {t(language, 'installDesc')}
        </p>

        {isIOS ? (
          <ol className="space-y-3 text-xs text-[var(--ks-text-primary)]">
            <li className="flex items-start gap-3 p-3 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <Share className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" />
              <span className="leading-snug">{t(language, 'installIosStep1')}</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <PlusSquare className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" />
              <span className="leading-snug">{t(language, 'installIosStep2')}</span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-xs text-[var(--ks-text-primary)]">
            <li className="flex items-start gap-3 p-3 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <MonitorSmartphone className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" />
              <span className="leading-snug">{t(language, 'installDesktopStep1')}</span>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)]">
              <Download className="w-4 h-4 mt-[2px] text-[var(--ks-accent)] shrink-0" />
              <span className="leading-snug">{t(language, 'installDesktopStep2')}</span>
            </li>
          </ol>
        )}

        <Button variant="primary" size="md" fullWidth onClick={onClose}>
          {t(language, 'gotIt')}
        </Button>
      </div>
    </Modal>
  );
};

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'footer';
  onAction?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onAction,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language, showToast } = useStore();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Suppress install CTA whenever the device already runs the installed PWA
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        showToast(
          t(language, 'installedToastTitle'),
          t(language, 'installedToastDesc'),
          'success'
        );
      }
      onAction?.();
      return;
    }

    setShowInstallGuide(true);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={t(language, 'installAppAria')}
          title={t(language, 'installAppAria')}
          className="hidden sm:inline-flex h-9 px-2 lg:px-2.5 rounded-md items-center gap-1.5 text-xs font-medium border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] hover:border-[var(--ks-accent)] hover:text-[var(--ks-accent)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
          <span className="hidden lg:inline">{t(language, 'installAppShort')}</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full min-h-[44px] py-2.5 px-3 rounded-md border border-[var(--ks-border)] bg-[var(--ks-bg)] hover:border-[var(--ks-accent)] flex items-center justify-between gap-2 text-start text-xs font-medium text-[var(--ks-text-primary)] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Smartphone className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
            <span className="truncate">
              {isIOS ? t(language, 'installIosTitle') : t(language, 'installAppTitle')}
            </span>
          </span>
          <Download className="w-3.5 h-3.5 text-[var(--ks-text-muted)] shrink-0" />
        </button>
      )}

      {variant === 'footer' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-start whitespace-nowrap min-h-[36px] hover:text-[var(--ks-text-primary)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
          <span>{t(language, 'installAppShort')}</span>
        </button>
      )}

      <PWAInstallGuideModal
        open={showInstallGuide}
        isIOS={isIOS}
        onClose={() => {
          setShowInstallGuide(false);
          onAction?.();
        }}
      />
    </>
  );
};
