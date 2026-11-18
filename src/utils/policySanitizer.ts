import type { PolicySection } from '../types/commerce';

const UNSAFE_TAG_RE = /<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link|base)[^>]*>[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_UNSAFE_RE = /<(script|style|iframe|object|embed|svg|math|form|input|button|meta|link|base)[^>]*\/?>/gi;
const EVENT_HANDLER_RE = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTO_RE = /(?:javascript|vbscript|data):/gi;
const ALLOWED_INLINE_TAGS = new Set(['p', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a', 'br', 'code']);

const PLACEHOLDER_REGEX = /\[CONFIRM\s+[^\]]+\]/gi;
const PLACEHOLDER_TEST_RE = /\[CONFIRM\s+[^\]]+\]/i;

export function escapeHtml(raw: string): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripUnsafeMarkup(raw: string): string {
  if (typeof raw !== 'string') return '';
  let clean = raw
    .replace(UNSAFE_TAG_RE, '')
    .replace(SELF_CLOSING_UNSAFE_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JAVASCRIPT_PROTO_RE, 'blocked:');

  // Strip any remaining HTML tags outside the strict inline allowlist
  clean = clean.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (full, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_INLINE_TAGS.has(tag)) {
      return '';
    }
    const isClosing = full.startsWith('</');
    if (isClosing) return `</${tag}>`;
    if (tag === 'a') {
      const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const href = (hrefMatch?.[1] || hrefMatch?.[2] || '').trim();
      const safeHref =
        href.startsWith('https://') ||
        href.startsWith('http://') ||
        href.startsWith('mailto:') ||
        href.startsWith('/')
          ? escapeHtml(href)
          : '#';
      return `<a href="${safeHref}" rel="noopener noreferrer">`;
    }
    return `<${tag}>`;
  });

  return clean.trim();
}

export function sanitizePlainText(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(UNSAFE_TAG_RE, '')
    .replace(SELF_CLOSING_UNSAFE_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JAVASCRIPT_PROTO_RE, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeRichText(raw: string): string {
  return stripUnsafeMarkup(raw);
}

export function scanUnresolvedPlaceholders(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      const matches = node.match(PLACEHOLDER_REGEX);
      if (matches) {
        for (const m of matches) found.add(m.trim());
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === 'object') {
      for (const v of Object.values(node)) walk(v);
    }
  };
  walk(value);
  return Array.from(found);
}

export function isPlaceholderValue(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return true;
  return PLACEHOLDER_TEST_RE.test(value.trim());
}

export function stripInternalCounselNotes(text: string): string {
  if (!text) return '';
  return text
    .replace(/\bCounsel Review Note:[^\n.]*(?:\.|$)/gi, '')
    .replace(/\(Registered Trade License[^)]*\)/gi, '')
    .replace(/\[CONFIRM\s+[^\]]+\]/gi, 'verified company records')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizePolicySections(sections: PolicySection[]): PolicySection[] {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((sec, index) => {
      const id = sanitizePlainText(sec.id || `section-${index + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '') || `section-${index + 1}`;
      const heading = sanitizePlainText(sec.heading || `Section ${index + 1}`);
      const paragraphs = Array.isArray(sec.paragraphs)
        ? sec.paragraphs.map((p) => sanitizePlainText(p)).filter(Boolean)
        : [];
      const bullets = Array.isArray(sec.bullets)
        ? sec.bullets.map((b) => sanitizePlainText(b)).filter(Boolean)
        : undefined;
      const table =
        sec.table && Array.isArray(sec.table.headers) && Array.isArray(sec.table.rows)
          ? {
              headers: sec.table.headers.map((h) => sanitizePlainText(h)),
              rows: sec.table.rows.map((row) =>
                Array.isArray(row) ? row.map((cell) => sanitizePlainText(cell)) : []
              ),
            }
          : undefined;
      const notice = sec.notice
        ? {
            tone: (['info', 'warning', 'statutory'].includes(sec.notice.tone)
              ? sec.notice.tone
              : 'info') as 'info' | 'warning' | 'statutory',
            label: sanitizePlainText(sec.notice.label),
            body: sanitizePlainText(sec.notice.body),
          }
        : undefined;

      return {
        id,
        heading,
        paragraphs,
        ...(bullets && bullets.length > 0 ? { bullets } : {}),
        ...(table ? { table } : {}),
        ...(notice ? { notice } : {}),
      };
    })
    .filter((s) => s.heading.length > 0);
}
