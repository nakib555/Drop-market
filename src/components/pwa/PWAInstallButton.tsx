import React, { useState } from 'react';
import { Download, MonitorSmartphone, PlusSquare, Share, Smartphone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
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
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={isIOS ? 'Install on iPhone & iPad' : 'Install Kinto Studio App'}
    maxWidthClass="max-w-sm"
  >
    <div className="space-y-4 text-sm">
      <p className="text-xs text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
        Install Kinto Studio as a standalone app on your device for full-screen shopping, instant launch, and offline catalog access.
      </p>

      {isIOS ? (
        <ol className="space-y-3 text-xs text-[#171716] dark:text-[#F4F3EF]">
          <li className="flex items-start gap-3 p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
            <Share className="w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <span className="leading-snug">
              1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
            </span>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
            <PlusSquare className="w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <span className="leading-snug">
              2. Scroll down and select <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
            </span>
          </li>
        </ol>
      ) : (
        <ol className="space-y-3 text-xs text-[#171716] dark:text-[#F4F3EF]">
          <li className="flex items-start gap-3 p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
            <MonitorSmartphone className="w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <span className="leading-snug">
              1. Open your browser&apos;s menu or click the <strong>Install</strong> icon inside the address bar.
            </span>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28]">
            <Download className="w-4 h-4 mt-[2px] text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <span className="leading-snug">
              2. Choose <strong>Install Kinto Studio</strong> or <strong>Add to Home Screen</strong> to complete setup.
            </span>
          </li>
        </ol>
      )}

      <Button variant="primary" size="md" fullWidth onClick={onClose}>
        Got It
      </Button>
    </div>
  </Modal>
);

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'footer';
  onAction?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onAction,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { showToast } = useStore();
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
          'Kinto Studio installed',
          'Launch anytime directly from your home screen or app dock.',
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
          aria-label="Install Kinto Studio app"
          title="Install Kinto Studio app"
          className="hidden sm:inline-flex h-9 px-2 lg:px-2.5 rounded-md items-center gap-1.5 text-xs font-medium border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] hover:border-[#8F6438] dark:hover:border-[#C89B67] hover:text-[#8F6438] dark:hover:text-[#C89B67] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
          <span className="hidden lg:inline">Install App</span>
        </button>
      )}

      {variant === 'drawer' && (
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-2.5 px-3 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] hover:border-[#8F6438] dark:hover:border-[#C89B67] flex items-center justify-between gap-2 text-left text-xs font-medium text-[#171716] dark:text-[#F4F3EF] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <Smartphone className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
            <span className="truncate">
              {isIOS ? 'Install on iPhone / iPad' : 'Install Kinto Studio App'}
            </span>
          </span>
          <Download className="w-3.5 h-3.5 text-[#84827B] shrink-0" />
        </button>
      )}

      {variant === 'footer' && (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-left whitespace-nowrap hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
          <span>Install App</span>
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
