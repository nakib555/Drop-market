import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60 * 1000;
const UPDATE_CHECK_THROTTLE_MS = 15 * 1000;
const AUTO_RELOAD_GUARD_KEY = 'kinto-pwa-last-auto-reload';
const AUTO_RELOAD_COOLDOWN_MS = 10 * 1000;

function canSafelyAutoReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.sessionStorage.getItem(AUTO_RELOAD_GUARD_KEY);
    const last = raw ? Number(raw) : 0;
    if (Number.isFinite(last) && Date.now() - last < AUTO_RELOAD_COOLDOWN_MS) {
      return false;
    }
    window.sessionStorage.setItem(AUTO_RELOAD_GUARD_KEY, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateFnRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const reloadingRef = useRef(false);
  const hadControllerRef = useRef(
    typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      Boolean(navigator.serviceWorker.controller)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let intervalId: number | null = null;
    let reloadTimerId: number | null = null;
    let lastCheckAt = 0;
    let activeRegistration: ServiceWorkerRegistration | undefined;

    const triggerUpdateCheck = (force = false) => {
      if (!activeRegistration || document.hidden || !navigator.onLine) return;
      const now = Date.now();
      if (!force && now - lastCheckAt < UPDATE_CHECK_THROTTLE_MS) return;
      lastCheckAt = now;
      activeRegistration.update().catch(() => {});
    };

    const performAutoReload = () => {
      if (reloadingRef.current) return;
      if (!canSafelyAutoReload()) {
        setNeedRefresh(true);
        return;
      }
      reloadingRef.current = true;
      setUpdating(true);
      reloadTimerId = window.setTimeout(() => {
        window.location.reload();
      }, 450);
    };

    const onControllerChange = () => {
      if (!hadControllerRef.current) {
        hadControllerRef.current = true;
        return;
      }
      performAutoReload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdating(true);
        if (updateFnRef.current) {
          updateFnRef.current(true).catch(() => {
            setUpdating(false);
            setNeedRefresh(true);
          });
        } else {
          performAutoReload();
        }
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        activeRegistration = registration;
        triggerUpdateCheck(true);

        intervalId = window.setInterval(() => {
          triggerUpdateCheck();
        }, UPDATE_CHECK_INTERVAL_MS);
      },
      onRegisterError() {
        // Keep storefront resilient if SW registration is blocked by private browsing or iframe policy
      },
    });

    updateFnRef.current = updateSW;

    const onVisibilityChange = () => {
      if (!document.hidden) triggerUpdateCheck();
    };
    const onFocus = () => {
      triggerUpdateCheck();
    };
    const onOnline = () => {
      triggerUpdateCheck(true);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      if (intervalId) window.clearInterval(intervalId);
      if (reloadTimerId) window.clearTimeout(reloadTimerId);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateFnRef.current) {
      window.location.reload();
      return;
    }
    setUpdating(true);
    try {
      await updateFnRef.current(true);
    } finally {
      setUpdating(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    updating,
    applyUpdate,
    dismiss,
  };
}
