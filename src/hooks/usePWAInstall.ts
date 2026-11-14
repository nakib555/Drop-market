import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let earlyDeferredPrompt: BeforeInstallPromptEvent | null = null;
let earlyCaptureAttached = false;
const promptSubscribers = new Set<(event: BeforeInstallPromptEvent | null) => void>();

export function captureEarlyInstallPrompt(): void {
  if (typeof window === 'undefined' || earlyCaptureAttached) return;
  earlyCaptureAttached = true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    earlyDeferredPrompt = e as BeforeInstallPromptEvent;
    promptSubscribers.forEach((cb) => cb(earlyDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    earlyDeferredPrompt = null;
    promptSubscribers.forEach((cb) => cb(null));
  });
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isClassicIOS = /iphone|ipad|ipod/.test(ua);
  const isIPadOS =
    window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return isClassicIOS || isIPadOS;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => detectStandalone());
  const [isIOS, setIsIOS] = useState<boolean>(() => detectIOS());

  useEffect(() => {
    captureEarlyInstallPrompt();
    setIsInstalled(detectStandalone());
    setIsIOS(detectIOS());
    if (earlyDeferredPrompt) {
      setDeferredPrompt(earlyDeferredPrompt);
    }

    const onPromptUpdate = (next: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(next);
    };
    promptSubscribers.add(onPromptUpdate);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      earlyDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    mediaQuery.addEventListener('change', onDisplayModeChange);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      promptSubscribers.delete(onPromptUpdate);
      mediaQuery.removeEventListener('change', onDisplayModeChange);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || earlyDeferredPrompt;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      earlyDeferredPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
