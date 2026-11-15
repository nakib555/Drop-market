const BD_MOBILE_CLEAN_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;
const INTL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

/**
 * Strips spaces, hyphens, and parentheses before checking local Bangladesh or international format.
 */
export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/[\s\-().]/g, '').trim();
}

export function isValidBangladeshPhone(raw: string): boolean {
  const cleaned = normalizePhoneDigits(raw);
  return BD_MOBILE_CLEAN_REGEX.test(cleaned);
}

export function isValidContactPhone(raw: string, country = 'Bangladesh'): boolean {
  const cleaned = normalizePhoneDigits(raw);
  if (!cleaned) return false;
  if (country.trim().toLowerCase() === 'bangladesh') {
    return BD_MOBILE_CLEAN_REGEX.test(cleaned);
  }
  return BD_MOBILE_CLEAN_REGEX.test(cleaned) || INTL_PHONE_REGEX.test(cleaned);
}

/**
 * Normalizes legitimate BD input formats (e.g. 01711-000100, 8801711000100, +880 1711 000100)
 * into clean +880 1XXX-XXXXXX display format when valid.
 */
export function formatBangladeshPhone(raw: string): string {
  const cleaned = normalizePhoneDigits(raw);
  const match = cleaned.match(/^(?:\+?88)?(01[3-9]\d{2})(\d{6})$/);
  if (!match) return raw.trim();
  return `+88${match[1]}-${match[2]}`;
}
