import React from 'react';
import { ExternalLink, Scale } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getLegalDocumentById, LEGAL_ENTITY } from '../../data/legalPolicies';
import { t } from '../../utils/i18n';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Primitives';
import { PolicySectionContent } from './PolicySectionContent';

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
        <div className="space-y-5 text-sm">
          <div className="pb-3.5 border-b border-[var(--ks-border)] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ks-text-secondary)]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ks-text-primary)]">
                <Scale className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
                <span>{policyFactsPublic.tradingName}</span>
                <span className="text-[var(--ks-text-muted)]" aria-hidden="true">·</span>
                <span className="text-[var(--ks-text-secondary)] font-normal">{doc.policyCategory}</span>
              </span>
              <span className="font-mono-num tabular-nums text-[var(--ks-text-muted)]">
                v{doc.version} · {t(language, 'updatedLabel')} {doc.effectiveDate}
              </span>
            </div>
            <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
              {doc.summary || doc.subtitle}
            </p>
          </div>

          <PolicySectionContent sections={doc.sections} variant="modal" />

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
