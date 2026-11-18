import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  History,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  fetchAdminPoliciesApi,
  notifyMaterialPolicyChangeApi,
  saveAdminPolicyDraftApi,
  transitionAdminPolicyApi,
  updateAdminLegalChecklistApi,
  updateAdminPolicyFactsApi,
} from '../../services/api';
import type {
  LegalDocumentId,
  LegalReviewChecklistItem,
  PolicyAcceptanceLedgerEntry,
  PolicyChecklistSummary,
  PolicyDocumentRecord,
  PolicyFactsConfig,
  PolicySection,
} from '../../types/commerce';
import { formatShortDate } from '../../utils/format';
import {
  sanitizePlainText,
  scanUnresolvedPlaceholders,
} from '../../utils/policySanitizer';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { SkeletonLoader } from '../ui/Primitives';

type CmsSubTab = 'policies' | 'facts' | 'checklist' | 'not-applicable' | 'ledger';

export const AdminPolicyCmsConsole: React.FC = () => {
  const { navigate, showToast, refreshPublishedPolicies } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<CmsSubTab>('policies');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [policies, setPolicies] = useState<PolicyDocumentRecord[]>([]);
  const [factsDraft, setFactsDraft] = useState<PolicyFactsConfig | null>(null);
  const [checklist, setChecklist] = useState<LegalReviewChecklistItem[]>([]);
  const [ledger, setLedger] = useState<PolicyAcceptanceLedgerEntry[]>([]);
  const [summary, setSummary] = useState<PolicyChecklistSummary | null>(null);

  // Selected Policy Editor State
  const [policyFilter, setPolicyFilter] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>('terms');
  const [editTitle, setEditTitle] = useState('');
  const [editShortTitle, setEditShortTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editEffectiveDate, setEditEffectiveDate] = useState('');
  const [editSections, setEditSections] = useState<PolicySection[]>([]);
  const [editChangeNote, setEditChangeNote] = useState('');
  const [editMaterialChange, setEditMaterialChange] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [forceAllowPlaceholders, setForceAllowPlaceholders] = useState(false);
  const [showSanitizedPreview, setShowSanitizedPreview] = useState(false);

  // Material change notice form
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialSummary, setMaterialSummary] = useState('');

  // Checklist draft notes
  const [checklistDrafts, setChecklistDrafts] = useState<
    Record<string, { status: LegalReviewChecklistItem['status']; reviewer: string; notes: string }>
  >({});

  const activePolicies = useMemo(
    () => policies.filter((p) => p.applicability !== 'not_applicable'),
    [policies]
  );

  const notApplicablePolicies = useMemo(
    () => policies.filter((p) => p.applicability === 'not_applicable'),
    [policies]
  );

  const filteredActivePolicies = useMemo(() => {
    const q = policyFilter.trim().toLowerCase();
    if (!q) return activePolicies;
    return activePolicies.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [activePolicies, policyFilter]);

  const selectedPolicy = useMemo(
    () => activePolicies.find((p) => p.slug === selectedSlug) || activePolicies[0] || null,
    [activePolicies, selectedSlug]
  );

  const hydrateEditorFromPolicy = useCallback((pol: PolicyDocumentRecord) => {
    const source = pol.draftContent || {
      title: pol.title,
      shortTitle: pol.shortTitle,
      subtitle: pol.subtitle,
      summary: pol.summary,
      effectiveDate: pol.effectiveDate,
      sections: pol.sections,
      changeNote: '',
      materialChange: false,
    };
    setEditTitle(source.title);
    setEditShortTitle(source.shortTitle || pol.shortTitle);
    setEditSubtitle(source.subtitle || pol.subtitle);
    setEditSummary(source.summary);
    setEditEffectiveDate(source.effectiveDate || pol.effectiveDate);
    setEditSections(
      source.sections.map((s) => ({
        ...s,
        paragraphs: [...s.paragraphs],
        bullets: s.bullets ? [...s.bullets] : undefined,
      }))
    );
    setEditChangeNote(source.changeNote || '');
    setEditMaterialChange(Boolean(source.materialChange));
    setScheduleDate(pol.scheduledFor ? pol.scheduledFor.slice(0, 16) : '');
    setForceAllowPlaceholders(false);
    setShowSanitizedPreview(false);
  }, []);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminPoliciesApi();
      setPolicies(res.policies);
      setFactsDraft(res.policyFacts);
      setChecklist(res.legalReviewChecklist);
      setLedger(res.policyAcceptanceLedger);
      setSummary(res.policyChecklistSummary);

      const nextDrafts: Record<
        string,
        { status: LegalReviewChecklistItem['status']; reviewer: string; notes: string }
      > = {};
      for (const item of res.legalReviewChecklist) {
        nextDrafts[item.id] = {
          status: item.status,
          reviewer: item.reviewer,
          notes: item.notes,
        };
      }
      setChecklistDrafts(nextDrafts);

      const currentMatch =
        res.policies.find(
          (p) => p.slug === selectedSlug && p.applicability !== 'not_applicable'
        ) || res.policies.find((p) => p.applicability !== 'not_applicable');
      if (currentMatch) {
        setSelectedSlug(currentMatch.slug);
        hydrateEditorFromPolicy(currentMatch);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Policy CMS.');
    } finally {
      setLoading(false);
    }
  }, [hydrateEditorFromPolicy, selectedSlug]);

  useEffect(() => {
    void loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPolicy = (pol: PolicyDocumentRecord) => {
    setSelectedSlug(pol.slug);
    hydrateEditorFromPolicy(pol);
  };

  const draftPlaceholders = useMemo(() => {
    const tokens = new Set<string>();
    for (const tok of scanUnresolvedPlaceholders(editTitle)) tokens.add(tok);
    for (const tok of scanUnresolvedPlaceholders(editSummary)) tokens.add(tok);
    for (const sec of editSections) {
      for (const tok of scanUnresolvedPlaceholders(sec.heading)) tokens.add(tok);
      for (const p of sec.paragraphs) {
        for (const tok of scanUnresolvedPlaceholders(p)) tokens.add(tok);
      }
      for (const b of sec.bullets || []) {
        for (const tok of scanUnresolvedPlaceholders(b)) tokens.add(tok);
      }
    }
    return Array.from(tokens);
  }, [editTitle, editSummary, editSections]);

  const handleSaveDraft = async () => {
    if (!selectedPolicy) return;
    setBusyKey('save-draft');
    try {
      const sanitizedSections: PolicySection[] = editSections.map((sec) => ({
        ...sec,
        heading: sanitizePlainText(sec.heading),
        paragraphs: sec.paragraphs.map((p) => sanitizePlainText(p)).filter(Boolean),
        bullets: sec.bullets
          ? sec.bullets.map((b) => sanitizePlainText(b)).filter(Boolean)
          : undefined,
      }));
      const res = await saveAdminPolicyDraftApi(selectedPolicy.slug, {
        title: sanitizePlainText(editTitle),
        shortTitle: sanitizePlainText(editShortTitle),
        subtitle: sanitizePlainText(editSubtitle),
        summary: sanitizePlainText(editSummary),
        effectiveDate: editEffectiveDate.trim(),
        sections: sanitizedSections,
        changeNote: sanitizePlainText(editChangeNote),
        materialChange: editMaterialChange,
      });
      setPolicies((prev) => prev.map((p) => (p.slug === res.policy.slug ? res.policy : p)));
      setSummary(res.policyChecklistSummary);
      hydrateEditorFromPolicy(res.policy);
      showToast(
        'Policy draft saved',
        `${res.policy.title} sanitized & stored for review.`,
        'success'
      );
    } catch (err) {
      showToast('Draft save failed', err instanceof Error ? err.message : 'Check fields.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleTransition = async (action: 'submit_review' | 'schedule' | 'publish' | 'archive') => {
    if (!selectedPolicy) return;
    if (action === 'schedule' && !scheduleDate.trim()) {
      showToast('Schedule date required', 'Pick a target date/time before scheduling.', 'error');
      return;
    }
    setBusyKey(`transition-${action}`);
    try {
      const res = await transitionAdminPolicyApi(selectedPolicy.slug, {
        action,
        scheduledFor: action === 'schedule' ? new Date(scheduleDate).toISOString() : undefined,
        forceAllowPlaceholders,
      });
      setPolicies((prev) => prev.map((p) => (p.slug === res.policy.slug ? res.policy : p)));
      setSummary(res.policyChecklistSummary);
      hydrateEditorFromPolicy(res.policy);
      if (action === 'publish') {
        await refreshPublishedPolicies();
      }
      showToast(
        action === 'publish'
          ? `Published v${res.policy.currentVersion}`
          : `Policy moved to ${res.policy.status}`,
        res.newVersionPublished
          ? `${res.policy.title} snapshot v${res.newVersionPublished.version} is now live.`
          : `${res.policy.title} workflow updated.`,
        'success'
      );
    } catch (err) {
      showToast(
        'Transition blocked',
        err instanceof Error ? err.message : 'Unable to transition policy state.',
        'error'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveFacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factsDraft) return;
    setBusyKey('save-facts');
    try {
      const res = await updateAdminPolicyFactsApi(factsDraft);
      setFactsDraft(res.policyFacts);
      setSummary(res.policyChecklistSummary);
      await Promise.all([refreshPublishedPolicies(), loadPolicies()]);
      showToast(
        'Owner facts synchronized',
        'Verified entity and SLA terms synced across all policy templates.',
        'success'
      );
    } catch (err) {
      showToast('Save failed', err instanceof Error ? err.message : 'Check input values.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveChecklistItem = async (id: string) => {
    const draft = checklistDrafts[id];
    if (!draft) return;
    setBusyKey(`chk-${id}`);
    try {
      const res = await updateAdminLegalChecklistApi(id, draft);
      setChecklist(res.legalReviewChecklist);
      setSummary(res.policyChecklistSummary);
      showToast('Checklist item saved', 'Legal review audit state updated.', 'success');
    } catch (err) {
      showToast('Save failed', err instanceof Error ? err.message : 'API error.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const handleNotifyMaterialChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim() || !materialSummary.trim()) {
      showToast('Notice incomplete', 'Enter both title and summary for the material change log.', 'error');
      return;
    }
    setBusyKey('notify-material');
    try {
      const res = await notifyMaterialPolicyChangeApi({
        title: sanitizePlainText(materialTitle.trim()),
        summary: sanitizePlainText(materialSummary.trim()),
      });
      setLedger((prev) => [res.entry, ...prev]);
      setMaterialTitle('');
      setMaterialSummary('');
      showToast(
        'Material change logged',
        `Recorded ${res.entry.versionTag} in Policy Acceptance Ledger.`,
        'success'
      );
    } catch (err) {
      showToast('Publish failed', err instanceof Error ? err.message : 'API error.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  if (loading && policies.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-20 w-full" />
          ))}
        </div>
        <SkeletonLoader className="h-72 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3">
        <p className="text-sm font-medium text-[var(--ks-error)]">{error}</p>
        <Button variant="outline" size="sm" onClick={loadPolicies}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & KPI Readiness Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[var(--ks-accent)]" />
            <span>Policy CMS, Owner Facts &amp; Legal Governance</span>
          </h3>
          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
            Draft, review, schedule, publish versioned policies, and resolve owner business confirmation flags without exposing placeholders publicly.
          </p>
        </div>
        <Button variant="outline" size="xs" onClick={loadPolicies}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh CMS</span>
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <p className="text-[var(--ks-text-muted)]">Active Public Policies</p>
            <p className="font-mono-num text-xl font-semibold mt-1">{summary.publishedCount} / {summary.totalActivePolicies}</p>
          </div>
          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <p className="text-[var(--ks-text-muted)]">Not Applicable Scope</p>
            <p className="font-mono-num text-xl font-semibold mt-1">{summary.totalNotApplicable}</p>
          </div>
          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <p className="text-[var(--ks-text-muted)]">Draft / Review</p>
            <p className="font-mono-num text-xl font-semibold mt-1">{summary.draftOrReviewCount}</p>
          </div>
          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <p className="text-[var(--ks-text-muted)]">Owner Fact Flags</p>
            <p className={`font-mono-num text-xl font-semibold mt-1 ${summary.pendingOwnerFactsCount > 0 ? 'text-[var(--ks-warning)]' : 'text-[var(--ks-success)]'}`}>
              {summary.pendingOwnerFactsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)]">
            <p className="text-[var(--ks-text-muted)]">Legal Review Open</p>
            <p className={`font-mono-num text-xl font-semibold mt-1 ${summary.pendingLegalReviewCount > 0 ? 'text-[var(--ks-warning)]' : 'text-[var(--ks-success)]'}`}>
              {summary.pendingLegalReviewCount}
            </p>
          </div>
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--ks-border)] pb-3">
        {(
          [
            { id: 'policies', label: `Policy Editor (${activePolicies.length})` },
            { id: 'facts', label: 'Owner Facts & Entity' },
            { id: 'checklist', label: `Legal Checklist (${checklist.length})` },
            { id: 'not-applicable', label: `Not Applicable (${notApplicablePolicies.length})` },
            { id: 'ledger', label: `Acceptance Ledger (${ledger.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-3 py-1.5 min-h-[38px] rounded-[var(--ks-radius-md)] text-xs font-medium border cursor-pointer transition-colors ${
              subTab === tab.id
                ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                : 'bg-[var(--ks-bg)] border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:border-[var(--ks-border-strong)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. POLICY EDITOR */}
      {subTab === 'policies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Policy Selector List */}
          <div className="lg:col-span-4 space-y-3">
            <Input
              label="Filter policies"
              value={policyFilter}
              onChange={(e) => setPolicyFilter(e.target.value)}
              placeholder="Search title, slug, or category..."
            />
            <div className="max-h-[540px] overflow-y-auto divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)]">
              {filteredActivePolicies.map((pol) => {
                const isSelected = selectedPolicy?.slug === pol.slug;
                return (
                  <button
                    key={pol.slug}
                    type="button"
                    onClick={() => handleSelectPolicy(pol)}
                    className={`w-full text-start p-3 space-y-1 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--ks-surface-muted)] border-s-2 border-[var(--ks-accent)]'
                        : 'hover:bg-[var(--ks-surface)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--ks-text-primary)] truncate">
                        {pol.shortTitle}
                      </span>
                      <span
                        className={`text-[10px] font-mono-num uppercase px-1.5 py-0.5 rounded ${
                          pol.status === 'published'
                            ? 'bg-[var(--ks-success)]/15 text-[var(--ks-success)]'
                            : pol.status === 'review' || pol.status === 'scheduled'
                            ? 'bg-[var(--ks-accent)]/15 text-[var(--ks-accent)]'
                            : 'bg-[var(--ks-warning)]/15 text-[var(--ks-warning)]'
                        }`}
                      >
                        {pol.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--ks-text-muted)] font-mono-num truncate">
                      /{pol.slug} · v{pol.currentVersion}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor Workspace */}
          {selectedPolicy && (
            <div className="lg:col-span-8 p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[var(--ks-border)]">
                <div className="space-y-1">
                  <p className="text-[11px] font-mono-num uppercase text-[var(--ks-accent)]">
                    {selectedPolicy.category} · v{selectedPolicy.currentVersion} · Status:{' '}
                    {selectedPolicy.status}
                  </p>
                  <h4 className="font-display text-2xl font-medium">{selectedPolicy.title}</h4>
                  {selectedPolicy.scheduledFor && (
                    <p className="text-xs text-[var(--ks-accent)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled for {selectedPolicy.scheduledFor}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setShowSanitizedPreview((v) => !v)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showSanitizedPreview ? 'Edit Sections' : 'Sanitized Preview'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate({ name: selectedPolicy.slug as LegalDocumentId })}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Live</span>
                  </Button>
                </div>
              </div>

              {draftPlaceholders.length > 0 && (
                <div className="p-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-warning)]/40 bg-[var(--ks-warning)]/10 text-xs space-y-1.5">
                  <p className="font-semibold text-[var(--ks-warning)] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Unresolved Confirmation Tags Detected ({draftPlaceholders.length})
                  </p>
                  <p className="text-[var(--ks-text-secondary)]">
                    Public views automatically omit unresolved tags. Resolve them in the text or via Owner Facts, or check the override below if publishing an interim policy:
                  </p>
                  <ul className="list-disc ps-5 font-mono-num text-[11px] text-[var(--ks-text-primary)]">
                    {draftPlaceholders.slice(0, 4).map((tok) => (
                      <li key={tok}>{tok}</li>
                    ))}
                  </ul>
                  <label className="inline-flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceAllowPlaceholders}
                      onChange={(e) => setForceAllowPlaceholders(e.target.checked)}
                    />
                    <span>Allow publish with confirmation flags (sanitized publicly)</span>
                  </label>
                </div>
              )}

              {showSanitizedPreview ? (
                <div className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-4">
                  <p className="text-xs font-mono-num uppercase text-[var(--ks-text-muted)]">
                    Sanitized Preview (HTML/XSS stripped before persistence)
                  </p>
                  <h5 className="font-display text-2xl">{sanitizePlainText(editTitle)}</h5>
                  <p className="text-sm text-[var(--ks-text-secondary)]">
                    {sanitizePlainText(editSummary)}
                  </p>
                  {editSections.map((sec) => (
                    <div key={sec.id} className="space-y-2 pt-3 border-t border-[var(--ks-divider)]">
                      <h6 className="font-semibold text-sm">{sanitizePlainText(sec.heading)}</h6>
                      {sec.paragraphs.map((p, idx) => (
                        <p key={idx} className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                          {sanitizePlainText(p)}
                        </p>
                      ))}
                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="list-disc ps-5 text-xs text-[var(--ks-text-secondary)] space-y-1">
                          {sec.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{sanitizePlainText(b)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Policy Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <Input
                      label="Short Title (Nav)"
                      value={editShortTitle}
                      onChange={(e) => setEditShortTitle(e.target.value)}
                    />
                    <Input
                      label="Subtitle"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                    />
                    <Input
                      label="Effective Date"
                      value={editEffectiveDate}
                      onChange={(e) => setEditEffectiveDate(e.target.value)}
                    />
                  </div>
                  <Textarea
                    label="Policy Summary"
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                  />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
                        Sections ({editSections.length})
                      </p>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          setEditSections((prev) => [
                            ...prev,
                            {
                              id: `sec-${Date.now()}`,
                              heading: 'New Policy Clause',
                              paragraphs: ['Add clause copy here.'],
                            },
                          ])
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Section</span>
                      </Button>
                    </div>
                    {editSections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        className="p-3.5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono-num text-[var(--ks-text-muted)]">
                            Section {idx + 1}
                          </span>
                          {editSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditSections((prev) => prev.filter((_, i) => i !== idx))
                              }
                              aria-label={`Remove section ${sec.heading}`}
                              className="text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <Input
                          label="Section Heading"
                          value={sec.heading}
                          onChange={(e) =>
                            setEditSections((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, heading: e.target.value } : item
                              )
                            )
                          }
                        />
                        <Textarea
                          label="Paragraphs (blank line separates paragraphs)"
                          rows={3}
                          value={sec.paragraphs.join('\n\n')}
                          onChange={(e) =>
                            setEditSections((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      paragraphs: e.target.value
                                        .split(/\n{2,}/)
                                        .map((p) => p.trim())
                                        .filter(Boolean),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                        <Textarea
                          label="Bullets (one per line, optional)"
                          rows={2}
                          value={(sec.bullets || []).join('\n')}
                          onChange={(e) =>
                            setEditSections((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      bullets: e.target.value
                                        .split('\n')
                                        .map((b) => b.trim())
                                        .filter(Boolean),
                                    }
                                  : item
                              )
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--ks-border)]">
                    <Input
                      label="Version Change Note"
                      value={editChangeNote}
                      onChange={(e) => setEditChangeNote(e.target.value)}
                      placeholder="e.g., Clarified courier cutoffs"
                    />
                    <div className="flex items-end pb-2">
                      <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editMaterialChange}
                          onChange={(e) => setEditMaterialChange(e.target.checked)}
                        />
                        <span>Flag as Material Policy Change</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Workflow Action Bar */}
              <div className="pt-4 border-t border-[var(--ks-border)] flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyKey === 'save-draft'}
                  onClick={handleSaveDraft}
                >
                  Save Draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyKey === 'transition-submit_review'}
                  onClick={() => handleTransition('submit_review')}
                >
                  Submit for Review
                </Button>
                <div className="flex items-center gap-1.5">
                  <input
                    type="datetime-local"
                    aria-label="Schedule publish date and time"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="min-h-[36px] px-2 text-xs rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] bg-[var(--ks-surface)]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyKey === 'transition-schedule'}
                    onClick={() => handleTransition('schedule')}
                  >
                    Schedule
                  </Button>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busyKey === 'transition-publish'}
                  onClick={() => handleTransition('publish')}
                >
                  Publish Live Version
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyKey === 'transition-archive'}
                  onClick={() => handleTransition('archive')}
                >
                  Archive
                </Button>
              </div>

              {/* Immutable Version History */}
              {selectedPolicy.versionHistory.length > 0 && (
                <div className="pt-4 border-t border-[var(--ks-border)] space-y-2 text-xs">
                  <p className="font-semibold flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                    <span>Immutable Version Snapshots ({selectedPolicy.versionHistory.length})</span>
                  </p>
                  <div className="divide-y divide-[var(--ks-divider)] border border-[var(--ks-border)] rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)]">
                    {selectedPolicy.versionHistory.map((ver) => (
                      <div key={ver.version} className="p-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-mono-num font-semibold">v{ver.version}</span>
                          <span className="text-[var(--ks-text-muted)]">
                            {' '}· Effective {ver.effectiveDate} · by {ver.publishedBy}
                          </span>
                          {ver.changeNote && (
                            <p className="text-[11px] text-[var(--ks-text-secondary)]">
                              {ver.changeNote}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate({
                              name: selectedPolicy.slug as LegalDocumentId,
                              policyVersion: ver.version,
                            })
                          }
                          className="underline text-[var(--ks-accent)] cursor-pointer"
                        >
                          Open ?version={ver.version}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. OWNER FACTS CONFIG */}
      {subTab === 'facts' && factsDraft && (
        <form
          onSubmit={handleSaveFacts}
          className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-5"
        >
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">
              Verified Bangladesh Entity &amp; SLA Configuration
            </h4>
            <p className="text-xs text-[var(--ks-text-secondary)]">
              Replace any <code className="font-mono-num">[CONFIRM ...]</code> flags with verified trade license, DBID, VAT/BIN, address, and operational SLAs. Unconfirmed tags are suppressed from public routes automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Legal Entity Name"
              value={factsDraft.legalEntityName}
              onChange={(e) => setFactsDraft({ ...factsDraft, legalEntityName: e.target.value })}
            />
            <Input
              label="Trading Name"
              value={factsDraft.tradingName}
              onChange={(e) => setFactsDraft({ ...factsDraft, tradingName: e.target.value })}
            />
            <Input
              label="Trade License No."
              value={factsDraft.registrationTradeLicense}
              onChange={(e) =>
                setFactsDraft({ ...factsDraft, registrationTradeLicense: e.target.value })
              }
            />
            <Input
              label="DBID Number"
              value={factsDraft.registrationDbid}
              onChange={(e) => setFactsDraft({ ...factsDraft, registrationDbid: e.target.value })}
            />
            <Input
              label="BIN / VAT Registration"
              value={factsDraft.registrationBinVat}
              onChange={(e) => setFactsDraft({ ...factsDraft, registrationBinVat: e.target.value })}
            />
            <Input
              label="TIN Registration"
              value={factsDraft.registrationTin}
              onChange={(e) => setFactsDraft({ ...factsDraft, registrationTin: e.target.value })}
            />
            <Input
              label="Registered Dhaka Address"
              value={factsDraft.registeredAddress}
              onChange={(e) => setFactsDraft({ ...factsDraft, registeredAddress: e.target.value })}
            />
            <Input
              label="Support Email"
              type="email"
              value={factsDraft.supportEmail}
              onChange={(e) => setFactsDraft({ ...factsDraft, supportEmail: e.target.value })}
            />
            <Input
              label="Legal / Grievance Email"
              type="email"
              value={factsDraft.legalEmail}
              onChange={(e) => setFactsDraft({ ...factsDraft, legalEmail: e.target.value })}
            />
            <Input
              label="Support Phone"
              value={factsDraft.supportPhone}
              onChange={(e) => setFactsDraft({ ...factsDraft, supportPhone: e.target.value })}
            />
            <Input
              label="Support Operating Hours"
              value={factsDraft.supportHours}
              onChange={(e) => setFactsDraft({ ...factsDraft, supportHours: e.target.value })}
            />
            <Input
              label="Return Window (Days)"
              type="number"
              min={1}
              max={90}
              value={String(factsDraft.returnWindowDays)}
              onChange={(e) =>
                setFactsDraft({
                  ...factsDraft,
                  returnWindowDays: Math.max(1, Number(e.target.value) || 14),
                })
              }
            />
            <Input
              label="Defect / Wrong-Item Report (Hours)"
              type="number"
              min={1}
              max={168}
              value={String(factsDraft.defectReportHours)}
              onChange={(e) =>
                setFactsDraft({
                  ...factsDraft,
                  defectReportHours: Math.max(1, Number(e.target.value) || 48),
                })
              }
            />
            <Input
              label="Refund SLA"
              value={factsDraft.refundSlaBusinessDays}
              onChange={(e) =>
                setFactsDraft({ ...factsDraft, refundSlaBusinessDays: e.target.value })
              }
            />
            <Input
              label="Pre-Dispatch Cancellation Cutoff"
              value={factsDraft.cancelPreDispatchCutoff}
              onChange={(e) =>
                setFactsDraft({ ...factsDraft, cancelPreDispatchCutoff: e.target.value })
              }
            />
            <Input
              label="Seller Commission Summary"
              value={factsDraft.sellerCommissionSummary}
              onChange={(e) =>
                setFactsDraft({ ...factsDraft, sellerCommissionSummary: e.target.value })
              }
            />
            <Input
              label="Seller Payout Cycle"
              value={factsDraft.sellerPayoutCycle}
              onChange={(e) => setFactsDraft({ ...factsDraft, sellerPayoutCycle: e.target.value })}
            />
            <Input
              label="Governing Law"
              value={factsDraft.governingLaw}
              onChange={(e) => setFactsDraft({ ...factsDraft, governingLaw: e.target.value })}
            />
          </div>
          <Button type="submit" variant="primary" size="md" disabled={busyKey === 'save-facts'}>
            Save &amp; Sync Owner Facts
          </Button>
        </form>
      )}

      {/* 3. LEGAL CHECKLIST */}
      {subTab === 'checklist' && (
        <div className="space-y-3">
          {checklist.map((item) => {
            const draft = checklistDrafts[item.id] || {
              status: item.status,
              reviewer: item.reviewer,
              notes: item.notes,
            };
            return (
              <div
                key={item.id}
                className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{item.topic}</p>
                    <p className="text-[var(--ks-text-muted)]">
                      {item.jurisdiction} · {item.statutoryReference}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      draft.status === 'verified'
                        ? 'text-[var(--ks-success)]'
                        : 'text-[var(--ks-warning)]'
                    }`}
                  >
                    {draft.status === 'verified' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {draft.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Review Status"
                    value={draft.status}
                    onChange={(e) =>
                      setChecklistDrafts((prev) => ({
                        ...prev,
                        [item.id]: {
                          ...draft,
                          status: e.target.value as LegalReviewChecklistItem['status'],
                        },
                      }))
                    }
                    options={[
                      { value: 'needs_legal_review', label: 'Needs Legal Review' },
                      {
                        value: 'needs_business_confirmation',
                        label: 'Needs Business Confirmation',
                      },
                      { value: 'verified', label: 'Verified by Counsel' },
                    ]}
                  />
                  <Input
                    label="Reviewer"
                    value={draft.reviewer}
                    onChange={(e) =>
                      setChecklistDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, reviewer: e.target.value },
                      }))
                    }
                  />
                  <Input
                    label="Audit Notes"
                    value={draft.notes}
                    onChange={(e) =>
                      setChecklistDrafts((prev) => ({
                        ...prev,
                        [item.id]: { ...draft, notes: e.target.value },
                      }))
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={busyKey === `chk-${item.id}`}
                  onClick={() => handleSaveChecklistItem(item.id)}
                >
                  Save Review Item
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. NOT APPLICABLE MATRIX */}
      {subTab === 'not-applicable' && (
        <div className="space-y-3 text-xs">
          <p className="text-[var(--ks-text-secondary)]">
            These e-commerce policy modules were evaluated and explicitly marked{' '}
            <code className="font-mono-num">not_applicable</code> so no placeholder or misleading customer guarantees exist on the public storefront:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notApplicablePolicies.map((pol) => (
              <div
                key={pol.id}
                className="p-4 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                    {pol.title}
                  </span>
                  <span className="font-mono-num text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--ks-surface-muted)] text-[var(--ks-text-muted)]">
                    not_applicable
                  </span>
                </div>
                <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                  {pol.notApplicableReason || pol.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ACCEPTANCE LEDGER & MATERIAL CHANGE NOTICE */}
      {subTab === 'ledger' && (
        <div className="space-y-6">
          <form
            onSubmit={handleNotifyMaterialChange}
            className="p-5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-3 max-w-2xl"
          >
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-[var(--ks-accent)]" />
              <span>Record Material Policy Change Notice</span>
            </h4>
            <Input
              label="Notice Title"
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              placeholder="e.g., Updated 14-day return & 48h defect reporting notice"
            />
            <Textarea
              label="Material Change Summary"
              rows={2}
              value={materialSummary}
              onChange={(e) => setMaterialSummary(e.target.value)}
              placeholder="Concise summary of material changes requiring customer notice..."
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={busyKey === 'notify-material'}
            >
              Publish Material Change Log Entry
            </Button>
          </form>

          <div className="overflow-x-auto rounded-[var(--ks-radius-md)] border border-[var(--ks-border)]">
            <table className="w-full text-start text-xs">
              <thead className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)] text-[var(--ks-text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Context</th>
                  <th className="py-2.5 px-3 font-medium">Subject</th>
                  <th className="py-2.5 px-3 font-medium">Version Tag</th>
                  <th className="py-2.5 px-3 font-medium">Policies</th>
                  <th className="py-2.5 px-3 font-medium">Marketing Opt-In</th>
                  <th className="py-2.5 px-3 font-medium text-end">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-divider)]">
                {ledger.slice(0, 40).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-2.5 px-3 font-mono-num uppercase text-[var(--ks-accent)]">
                      {entry.context}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{entry.subjectRef}</td>
                    <td className="py-2.5 px-3 font-mono-num">{entry.versionTag}</td>
                    <td className="py-2.5 px-3 text-[var(--ks-text-secondary)]">
                      {entry.policyIds.length} docs
                    </td>
                    <td className="py-2.5 px-3 font-mono-num">
                      {typeof entry.marketingOptIn === 'boolean'
                        ? entry.marketingOptIn
                          ? 'Yes'
                          : 'No'
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono-num text-end text-[var(--ks-text-muted)]">
                      {formatShortDate(entry.acceptedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
