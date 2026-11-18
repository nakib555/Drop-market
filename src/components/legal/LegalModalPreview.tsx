import React from 'react';
import { ExternalLink, Scale } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getLegalDocumentById, LEGAL_ENTITY } from '../../data/legalPolicies';
import { t } from '../../utils/i18n';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Primitives';

export const LegalModalPreview: React.FC = () => {
  const {
    language,
    previewPolicyId,
    closePolicyPreview,
    navigate,
    publishedPolicies,
    policyFactsPublic,
  } = useStore();

  const doc = previewPolicyId
    ? getLegalDocumentById(previewPolicyId, { publishedRecords: publishedPolicies })
    : null;

  return (
    <Modal
      open={Boolean(doc)}
      onClose={closePolicyPreview}
      title={doc ? doc.title : t(language, 'legalDocumentFallback')}
      maxWidthClass="max-w-2xl"
    >
      {doc && (
        <div className="space-y-6 text-sm">
          <div className="p-3.5 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ks-text-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ks-text-primary)]">
              <Scale className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
              <span>{policyFactsPublic.tradingName}</span>
            </span>
            <span className="font-mono-num">
              v{doc.version} · {t(language, 'updatedLabel')} {doc.effectiveDate}
            </span>
          </div>

          <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
            {doc.subtitle}
          </p>

          <div className="space-y-6">
            {doc.sections.map((section) => (
              <section key={section.id} className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[var(--ks-text-primary)]">
                  {section.heading}
                </h3>
                {section.paragraphs.map((para, idx) => (
                  <p
                    key={idx}
                    className="text-xs sm:text-sm leading-relaxed text-[var(--ks-text-secondary)]"
                  >
                    {para}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc ps-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-[var(--ks-text-secondary)]">
                    {section.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.notice && (
                  <div className="p-3 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border-strong)] text-xs space-y-1">
                    <p className="font-semibold text-[var(--ks-text-primary)]">{section.notice.label}</p>
                    <p className="text-[var(--ks-text-secondary)] leading-relaxed">{section.notice.body}</p>
                  </div>
                )}
                {section.table && (
                  <div className="overflow-x-auto border border-[var(--ks-border)] rounded-md">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)]">
                          {section.table.headers.map((head) => (
                            <th key={head} className="px-3 py-2 font-semibold">
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ks-border)]">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3 py-2 text-[var(--ks-text-secondary)] align-top"
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

          <div className="pt-4 border-t border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--ks-text-muted)] font-mono-num">
              {t(language, 'legalInquiriesLabel')}: {LEGAL_ENTITY.legalEmail}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = doc.id;
                  closePolicyPreview();
                  navigate({ name: target });
                }}
              >
                <span>{t(language, 'openFullPage')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button variant="primary" size="sm" onClick={closePolicyPreview}>
                {t(language, 'closeLabel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
