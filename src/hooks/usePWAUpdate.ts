import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const updateFnRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let intervalId: number | null = null;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          intervalId = window.setInterval(() => {
            if (!document.hidden && navigator.onLine) {
              registration.update().catch(() => {});
            }
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError() {
        // Keep storefront resilient if SW registration is blocked by private browsing or iframe policy
      },
    });

    updateFnRef.current = updateSW;

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateFnRef.current) return;
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
