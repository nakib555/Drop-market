import { useCallback, useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const INSTALL_DISMISSED_KEY = 'kinto-pwa-install-dismissed';

let earlyDeferredPrompt: BeforeInstallPromptEvent | null = null;
let earlyCaptureAttached = false;
let sharedIsInstalled = false;
let sharedBannerDismissed = false;

const promptSubscribers = new Set<(event: BeforeInstallPromptEvent | null) => void>();
const installedSubscribers = new Set<(installed: boolean) => void>();
const dismissedSubscribers = new Set<(dismissed: boolean) => void>();

function readBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
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

function notifyInstalled(next: boolean): void {
  sharedIsInstalled = next;
  installedSubscribers.forEach((cb) => cb(next));
}

function notifyDismissed(next: boolean): void {
  sharedBannerDismissed = next;
  dismissedSubscribers.forEach((cb) => cb(next));
}

export function captureEarlyInstallPrompt(): void {
  if (typeof window === 'undefined' || earlyCaptureAttached) return;
  earlyCaptureAttached = true;

  sharedIsInstalled = detectStandalone();
  sharedBannerDismissed = readBannerDismissed();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    earlyDeferredPrompt = e as BeforeInstallPromptEvent;
    promptSubscribers.forEach((cb) => cb(earlyDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    earlyDeferredPrompt = null;
    promptSubscribers.forEach((cb) => cb(null));
    notifyInstalled(true);
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () => sharedIsInstalled || detectStandalone()
  );
  const [isIOS, setIsIOS] = useState<boolean>(() => detectIOS());
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(
    () => sharedBannerDismissed || readBannerDismissed()
  );

  useEffect(() => {
    captureEarlyInstallPrompt();
    const standaloneNow = detectStandalone();
    if (standaloneNow) {
      notifyInstalled(true);
    }
    setIsIOS(detectIOS());
    if (earlyDeferredPrompt) {
      setDeferredPrompt(earlyDeferredPrompt);
    }

    // Check Web App Manifest related installed apps API where supported (Chrome/Android/Edge)
    const navWithRelated = window.navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<Array<{ id?: string; url?: string }>>;
    };
    if (typeof navWithRelated.getInstalledRelatedApps === 'function') {
      navWithRelated
        .getInstalledRelatedApps()
        .then((apps) => {
          if (Array.isArray(apps) && apps.length > 0) {
            notifyInstalled(true);
          }
        })
        .catch(() => {
          // Ignore unsupported platform security/origin errors
        });
    }

    const onPromptUpdate = (next: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(next);
    };
    const onInstalledUpdate = (next: boolean) => {
      setIsInstalled(next);
      if (next) {
        setDeferredPrompt(null);
      }
    };
    const onDismissedUpdate = (next: boolean) => {
      setBannerDismissed(next);
    };

    promptSubscribers.add(onPromptUpdate);
    installedSubscribers.add(onInstalledUpdate);
    dismissedSubscribers.add(onDismissedUpdate);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        notifyInstalled(true);
      }
    };

    mediaQuery.addEventListener('change', onDisplayModeChange);

    return () => {
      promptSubscribers.delete(onPromptUpdate);
      installedSubscribers.delete(onInstalledUpdate);
      dismissedSubscribers.delete(onDismissedUpdate);
      mediaQuery.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || earlyDeferredPrompt;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      earlyDeferredPrompt = null;
      promptSubscribers.forEach((cb) => cb(null));
      notifyInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    try {
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    } catch {
      // Ignore storage access failures
    }
    notifyDismissed(true);
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    bannerDismissed,
    install,
    dismissBanner,
  };
}
