import { useEffect, useRef, useState } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    let reconnectTimer: number | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setJustReconnected(true);
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => {
          setJustReconnected(false);
        }, 3500);
      }
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setJustReconnected(false);
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, []);

  return { isOnline, justReconnected };
}
