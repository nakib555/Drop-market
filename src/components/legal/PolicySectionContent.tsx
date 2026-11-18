import React from 'react';
import type { PolicySection } from '../../types/commerce';

interface PolicySectionContentProps {
  sections: PolicySection[];
  variant?: 'page' | 'modal';
}

function splitStructuredPoint(raw: string): { label?: string; body: string } {
  const colonIdx = raw.indexOf(':');
  if (colonIdx > 1 && colonIdx <= 48) {
    const candidateLabel = raw.slice(0, colonIdx).trim();
    const candidateBody = raw.slice(colonIdx + 1).trim();
    // Avoid splitting URLs like https:// or times like 24:00
    if (
      candidateBody.length > 0 &&
      !candidateBody.startsWith('//') &&
      !/^\d+$/.test(candidateBody.slice(0, 2)) &&
      !/^https?$/i.test(candidateLabel)
    ) {
      return { label: candidateLabel, body: candidateBody };
    }
  }
  return { body: raw };
}

export const PolicySectionContent: React.FC<PolicySectionContentProps> = ({
  sections,
  variant = 'page',
}) => {
  const isModal = variant === 'modal';

  return (
    <div className={isModal ? 'space-y-6 divide-y divide-[var(--ks-border)]' : 'divide-y divide-[var(--ks-border)]'}>
      {sections.map((sec, idx) => (
        <section
          key={sec.id}
          id={isModal ? undefined : `legal-sec-${sec.id}`}
          className={
            isModal
              ? `${idx === 0 ? '' : 'pt-5'} space-y-3`
              : `${idx === 0 ? 'pb-7' : 'py-7'} scroll-mt-28 space-y-4`
          }
        >
          {isModal ? (
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--ks-text-primary)]">
              {sec.heading}
            </h3>
          ) : (
            <h2 className="font-display text-[clamp(1.375rem,1.15rem+0.85vw,1.75rem)] font-medium tracking-tight text-[var(--ks-text-primary)]">
              {sec.heading}
            </h2>
          )}

          {sec.paragraphs.length > 0 && (
            <div className="space-y-2">
              {sec.paragraphs.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className={
                    isModal
                      ? 'text-sm sm:text-[0.9375rem] leading-relaxed text-[var(--ks-text-secondary)]'
                      : 'ks-body-reading text-[var(--ks-text-secondary)]'
                  }
                >
                  {para}
                </p>
              ))}
            </div>
          )}

          {sec.bullets && sec.bullets.length > 0 && (
            <ul className={isModal ? 'space-y-2.5 pt-0.5' : 'space-y-3 pt-1'}>
              {sec.bullets.map((bullet, bIdx) => {
                const { label, body } = splitStructuredPoint(bullet);
                return (
                  <li
                    key={bIdx}
                    className={`flex items-start gap-2.5 ${
                      isModal
                        ? 'text-xs sm:text-sm leading-relaxed'
                        : 'text-[clamp(0.9rem,0.86rem+0.15vw,0.975rem)] leading-[1.65]'
                    } text-[var(--ks-text-secondary)]`}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.58em] w-1.5 h-1.5 rounded-full bg-[var(--ks-accent)] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {label ? (
                        <>
                          <span className="font-semibold text-[var(--ks-text-primary)]">
                            {label}:
                          </span>{' '}
                          <span>{body}</span>
                        </>
                      ) : (
                        <span>{body}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {sec.notice && (
            <div
              className={`rounded-md px-4 py-3 text-xs sm:text-sm space-y-1 border ${
                sec.notice.tone === 'warning'
                  ? 'bg-[var(--ks-surface-muted)]/70 border-[var(--ks-accent)]/35'
                  : 'bg-[var(--ks-surface-muted)]/50 border-[var(--ks-border)]'
              }`}
            >
              <p className="font-semibold uppercase tracking-[0.08em] text-xs text-[var(--ks-accent)]">
                {sec.notice.label}
              </p>
              <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                {sec.notice.body}
              </p>
            </div>
          )}

          {sec.table && sec.table.headers.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-[var(--ks-border)] mt-2">
              <table className="w-full text-start border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[var(--ks-surface-muted)]/55 border-b border-[var(--ks-border)]">
                    {sec.table.headers.map((head) => (
                      <th
                        key={head}
                        className={`${
                          isModal ? 'px-3 py-2.5' : 'px-4 py-3'
                        } font-semibold text-start text-[var(--ks-text-primary)] whitespace-nowrap`}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ks-border)]">
                  {sec.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-[var(--ks-surface)]/40">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`${
                            isModal ? 'px-3 py-2.5' : 'px-4 py-3'
                          } align-top leading-relaxed tabular-nums ${
                            cIdx === 0
                              ? 'font-medium text-[var(--ks-text-primary)]'
                              : 'text-[var(--ks-text-secondary)]'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
