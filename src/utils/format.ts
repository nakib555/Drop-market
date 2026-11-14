export type CurrencyCode = 'USD' | 'BDT';

export const BDT_RATE = 120;

export function formatCurrency(amountUsd: number, currency: CurrencyCode = 'USD'): string {
  if (currency === 'BDT') {
    const bdt = Math.round(amountUsd * BDT_RATE);
    return `৳${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(bdt)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amountUsd % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amountUsd);
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
