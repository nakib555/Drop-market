import type { CurrencyCode, TypedAttributeValue } from '../types/commerce';

export type { CurrencyCode };

export const DEFAULT_BDT_RATE = 120.5;
export const BDT_RATE = DEFAULT_BDT_RATE;
export const FREE_SHIPPING_THRESHOLD_USD = 500;
export const STUDIO15_MIN_USD = 300;

let activeBdtRate = DEFAULT_BDT_RATE;

export function setGlobalBdtRate(rate: number): void {
  if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
    activeBdtRate = rate;
  }
}

export function getGlobalBdtRate(): number {
  return activeBdtRate;
}

export function isProductOutOfStock(product: { stockCount: number; availability?: string }): boolean {
  return (
    product.availability === 'out-of-stock' ||
    !Number.isFinite(product.stockCount) ||
    product.stockCount <= 0
  );
}

/**
 * Formats a base-USD amount into the active display currency using server-synced FX rate.
 */
export function formatCurrency(
  amountUsd: number,
  currency: CurrencyCode = 'BDT',
  rateOverride?: number
): string {
  const safeUsd = Number.isFinite(amountUsd) ? amountUsd : 0;
  if (currency === 'BDT') {
    const rate = rateOverride && rateOverride > 0 ? rateOverride : activeBdtRate;
    const bdt = Math.ceil(safeUsd * rate);
    return `৳${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(bdt)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: safeUsd % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeUsd);
}

/**
 * Formats an already-settled currency amount (for immutable order currency snapshots).
 */
export function formatDirectCurrency(amount: number, currency: CurrencyCode): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (currency === 'BDT') {
    return `৳${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(Math.ceil(safe))}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatTypedAttributeValue(
  value: TypedAttributeValue | undefined,
  unitFallback?: string
): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return unitFallback ? `${value} ${unitFallback}` : String(value);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(' · ');
  if ('value' in value && 'unit' in value) {
    return `${value.value} ${value.unit}`;
  }
  if ('min' in value && 'max' in value) {
    const u = value.unit || unitFallback || '';
    return value.min === value.max
      ? `${value.min}${u ? ` ${u}` : ''}`
      : `${value.min}–${value.max}${u ? ` ${u}` : ''}`;
  }
  return String(value);
}

export function getDiscountPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatShortDate(isoOrString: string): string {
  const date = new Date(isoOrString);
  if (Number.isNaN(date.getTime())) return isoOrString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Computes bounded Levenshtein distance for typo-tolerant catalog search.
 */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return Math.abs(m - n);
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export function fuzzyScoreText(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 85;
  if (t.includes(q)) return 70;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const tTokens = t.split(/[\s\-/,·]+/).filter(Boolean);
  let score = 0;

  for (const qt of qTokens) {
    if (t.includes(qt)) {
      score += 25;
      continue;
    }
    if (qt.length >= 4) {
      let bestDist = 99;
      for (const tt of tTokens) {
        const d = editDistance(qt, tt);
        if (d < bestDist) bestDist = d;
      }
      if (bestDist === 1) score += 18;
      else if (bestDist === 2 && qt.length >= 6) score += 10;
    }
  }
  return score;
}
