import React from 'react';
import { ExternalLink, Scale } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getLegalDocumentById, LEGAL_ENTITY } from '../../data/legalPolicies';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Primitives';

export const LegalModalPreview: React.FC = () => {
  const {
    previewPolicyId,
    closePolicyPreview,
    navigate,
    shippingConfig,
  } = useStore();

  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;

  const doc = previewPolicyId
    ? getLegalDocumentById(previewPolicyId, { dhakaThresholdUsd })
    : null;

  return (
    <Modal
      open={Boolean(doc)}
      onClose={closePolicyPreview}
      title={doc ? doc.title : 'Legal Document'}
      maxWidthClass="max-w-2xl"
    >
      {doc && (
        <div className="space-y-6 text-sm">
          <div className="p-3.5 rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ks-text-secondary)]">
            <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ks-text-primary)]">
              <Scale className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
              <span>{LEGAL_ENTITY.legalName}</span>
            </span>
            <span className="font-mono-num">
              v{doc.version} · Updated {doc.lastUpdated}
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
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm leading-relaxed text-[#5C5B57] dark:text-[#B4B2AC]">
                    {section.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="overflow-x-auto border border-[#E5E3DD] dark:border-[#2C2C28] rounded-md">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28]">
                          {section.table.headers.map((head) => (
                            <th key={head} className="px-3 py-2 font-semibold">
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3 py-2 text-[#5C5B57] dark:text-[#B4B2AC] align-top"
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
              Legal Inquiries: {LEGAL_ENTITY.legalEmail}
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
                <span>Open Full Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              <Button variant="primary" size="sm" onClick={closePolicyPreview}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
