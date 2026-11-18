import type { CookieConsentState, PaymentMethodId } from '../types/commerce';

export interface VerifiedSocialLink {
  id: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'x';
  label: string;
  href: string;
}

/**
 * Only verified official social media URLs configured by Kinto Studio belong here.
 * Leave empty until official social accounts exist; UI renders nothing when empty.
 */
export const VERIFIED_SOCIAL_LINKS: ReadonlyArray<VerifiedSocialLink> = [];

export const STOREFRONT_PAYMENT_CANDIDATES: ReadonlyArray<PaymentMethodId> = [
  'cod',
  'bkash',
  'nagad',
  'rocket',
  'visa',
  'mastercard',
  'sslcommerz',
  'bank-transfer',
];

export function getCopyrightYear(referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear();
}

export function filterEnabledPaymentMethods(
  enabledIds?: ReadonlyArray<PaymentMethodId>
): PaymentMethodId[] {
  if (!Array.isArray(enabledIds)) {
    return ['cod'];
  }
  return enabledIds.filter((id) => STOREFRONT_PAYMENT_CANDIDATES.includes(id));
}

export type CookieConsentStatusKey =
  | 'cookieStatusAccepted'
  | 'cookieStatusEssential'
  | 'cookieStatusCustom'
  | 'cookieStatusUnset';

export function getCookieConsentStatusKey(
  status: CookieConsentState['status']
): CookieConsentStatusKey {
  switch (status) {
    case 'all':
      return 'cookieStatusAccepted';
    case 'essential-only':
      return 'cookieStatusEssential';
    case 'custom':
      return 'cookieStatusCustom';
    case 'unset':
    default:
      return 'cookieStatusUnset';
  }
}

export function scrollPageToTop(win?: {
  scrollTo: (opts: ScrollToOptions) => void;
  matchMedia?: (q: string) => { matches: boolean };
}): void {
  const target = win ?? (typeof window !== 'undefined' ? window : undefined);
  if (!target) return;
  const prefersReduced = Boolean(
    target.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  target.scrollTo({
    top: 0,
    behavior: prefersReduced ? 'auto' : 'smooth',
  });
}
