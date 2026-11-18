import type { CookieConsentState } from '../types/commerce';

export interface OptionalTelemetryEvent {
  name: string;
  route?: string;
  category?: string;
  timestamp: string;
}

const telemetryBuffer: OptionalTelemetryEvent[] = [];

export function canTrackSearchHistory(consent: CookieConsentState): boolean {
  return consent.status !== 'unset' && Boolean(consent.saveSearchHistory);
}

export function canPersonalizeCatalog(consent: CookieConsentState): boolean {
  return consent.status !== 'unset' && Boolean(consent.personalizedCatalog);
}

export function canTrackAnalytics(consent: CookieConsentState): boolean {
  return consent.status === 'all' || (consent.status === 'custom' && Boolean(consent.analyticsOptIn));
}

export function recordOptionalEvent(
  consent: CookieConsentState,
  event: Omit<OptionalTelemetryEvent, 'timestamp'>
): boolean {
  if (!canTrackAnalytics(consent)) {
    return false;
  }
  const cleanName = event.name.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 64);
  if (!cleanName) return false;

  // Data-minimization: never log emails, phone numbers, tokens, or addresses
  telemetryBuffer.unshift({
    name: cleanName,
    route: event.route ? event.route.slice(0, 64) : undefined,
    category: event.category ? event.category.slice(0, 48) : undefined,
    timestamp: new Date().toISOString(),
  });
  if (telemetryBuffer.length > 50) {
    telemetryBuffer.length = 50;
  }
  return true;
}

export function getAnalyticsEventBuffer(): ReadonlyArray<OptionalTelemetryEvent> {
  return telemetryBuffer;
}

export function clearAnalyticsEventBuffer(): void {
  telemetryBuffer.length = 0;
}

export function clearGatedStorage(consent: CookieConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    if (!canTrackSearchHistory(consent)) {
      window.localStorage.removeItem('kinto-recent-searches');
    }
    if (!canPersonalizeCatalog(consent)) {
      window.localStorage.removeItem('kinto-recent-views');
    }
    if (!canTrackAnalytics(consent)) {
      clearAnalyticsEventBuffer();
    }
  } catch {
    // Ignore storage access exceptions cleanly
  }
}
