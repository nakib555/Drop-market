import { useEffect, useId, useRef } from 'react';

const activeScrollLocks = new Set<string>();
const escapeStack: Array<{ id: string; handler: () => void }> = [];
let keyListenerAttached = false;

function handleWindowKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  if (escapeStack.length === 0) return;
  e.preventDefault();
  e.stopImmediatePropagation?.();
  dispatchTopEscape();
}

function syncKeyListener() {
  if (typeof window === 'undefined') return;
  if (escapeStack.length > 0 && !keyListenerAttached) {
    window.addEventListener('keydown', handleWindowKeyDown, true);
    keyListenerAttached = true;
  } else if (escapeStack.length === 0 && keyListenerAttached) {
    window.removeEventListener('keydown', handleWindowKeyDown, true);
    keyListenerAttached = false;
  }
}

export function acquireScrollLock(id: string): void {
  const wasEmpty = activeScrollLocks.size === 0;
  activeScrollLocks.add(id);
  if (wasEmpty && typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = 'hidden';
  }
}

export function releaseScrollLock(id: string): void {
  activeScrollLocks.delete(id);
  if (activeScrollLocks.size === 0 && typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = '';
  }
}

export function getActiveScrollLockCount(): number {
  return activeScrollLocks.size;
}

export function registerEscapeHandler(id: string, handler: () => void): () => void {
  const existingIdx = escapeStack.findIndex((entry) => entry.id === id);
  if (existingIdx !== -1) {
    escapeStack.splice(existingIdx, 1);
  }
  escapeStack.push({ id, handler });
  syncKeyListener();

  return () => {
    const idx = escapeStack.findIndex((entry) => entry.id === id);
    if (idx !== -1) {
      escapeStack.splice(idx, 1);
    }
    syncKeyListener();
  };
}

export function dispatchTopEscape(): boolean {
  if (escapeStack.length === 0) return false;
  const top = escapeStack[escapeStack.length - 1];
  top.handler();
  return true;
}

export function getEscapeStackSize(): number {
  return escapeStack.length;
}

export function resetOverlayManagerForTest(): void {
  activeScrollLocks.clear();
  escapeStack.length = 0;
  syncKeyListener();
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.overflow = '';
  }
}

export function useOverlayLock(
  open: boolean,
  idPrefix: string,
  onClose: () => void
): void {
  const reactId = useId();
  const overlayId = `${idPrefix}:${reactId}`;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    acquireScrollLock(overlayId);
    const unregisterEscape = registerEscapeHandler(overlayId, () => {
      onCloseRef.current();
    });
    return () => {
      unregisterEscape();
      releaseScrollLock(overlayId);
    };
  }, [open, overlayId]);
}
