import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePlainText,
  sanitizePolicySections,
  scanUnresolvedPlaceholders,
  stripInternalCounselNotes,
  stripUnsafeMarkup,
} from '../src/utils/policySanitizer.ts';
import {
  canPersonalizeCatalog,
  canTrackAnalytics,
  canTrackSearchHistory,
  clearAnalyticsEventBuffer,
  getAnalyticsEventBuffer,
  recordOptionalEvent,
} from '../src/utils/consentGate.ts';
import {
  buildDefaultPolicyRecords,
  buildPolicyChecklistSummary,
  buildPublicFactsSummary,
  buildValidatedAcceptanceRecord,
  createInitialLegalReviewChecklist,
  createInitialPolicyFacts,
  getPublicPublishedPolicies,
  projectPublicPolicyDocument,
  savePolicyDraft,
  transitionPolicyStatus,
} from '../server/services/policyService.ts';
import type { CookieConsentState } from '../src/types/commerce.ts';

test('policySanitizer strips XSS vectors, counsel notes, and detects unresolved placeholders', () => {
  const dirty =
    '<script>alert(1)</script><img src=x onerror="steal()" />Visit <a href="javascript:evil()">here</a> or <a href="https://kintostudio.bd/legal">safe</a>';
  const cleanHtml = stripUnsafeMarkup(dirty);
  assert.equal(cleanHtml.includes('<script>'), false);
  assert.equal(cleanHtml.includes('onerror'), false);
  assert.equal(cleanHtml.includes('javascript:'), false);
  assert.ok(cleanHtml.includes('https://kintostudio.bd/legal'));

  const plain = sanitizePlainText(
    '<svg onload=alert(1)>x</svg><b>Returns within 14 days</b><script>alert(1)</script>'
  );
  assert.equal(plain, 'Returns within 14 days');

  const placeholders = scanUnresolvedPlaceholders({
    entity: '[CONFIRM BUSINESS LEGAL NAME]',
    nested: ['See [CONFIRM DBID REGISTRATION NO] before launch'],
  });
  assert.deepEqual(placeholders.sort(), [
    '[CONFIRM BUSINESS LEGAL NAME]',
    '[CONFIRM DBID REGISTRATION NO]',
  ]);

  const strippedNote = stripInternalCounselNotes(
    'Verified policy term. Counsel Review Note: Check Bangladesh Bank circular before enabling.'
  );
  assert.equal(strippedNote.includes('Counsel Review Note'), false);

  const sanitizedSections = sanitizePolicySections([
    {
      id: 'Scope & Rules!',
      heading: '<b>Refund Window</b><script>xss()</script>',
      paragraphs: ['14-day return window for sealed parcels.'],
      bullets: ['<iframe src="x"></iframe>Unopened packaging'],
    },
  ]);
  assert.equal(sanitizedSections.length, 1);
  assert.equal(sanitizedSections[0].heading, 'Refund Window');
  assert.equal(sanitizedSections[0].bullets?.[0], 'Unopened packaging');
});

test('consentGate strictly blocks optional search, catalog views, and telemetry when unset or essential-only', () => {
  clearAnalyticsEventBuffer();

  const unsetConsent: CookieConsentState = {
    version: '2026.11',
    necessary: true,
    status: 'unset',
    saveSearchHistory: false,
    personalizedCatalog: false,
    analyticsOptIn: false,
  };
  assert.equal(canTrackSearchHistory(unsetConsent), false);
  assert.equal(canPersonalizeCatalog(unsetConsent), false);
  assert.equal(canTrackAnalytics(unsetConsent), false);
  assert.equal(recordOptionalEvent(unsetConsent, { name: 'pdp_view', route: '/product/x' }), false);
  assert.equal(getAnalyticsEventBuffer().length, 0);

  const essentialOnly: CookieConsentState = {
    version: '2026.11',
    necessary: true,
    status: 'essential-only',
    saveSearchHistory: true,
    personalizedCatalog: false,
    analyticsOptIn: true,
  };
  assert.equal(canTrackAnalytics(essentialOnly), false);
  assert.equal(recordOptionalEvent(essentialOnly, { name: 'pdp_view' }), false);

  const customOptIn: CookieConsentState = {
    version: '2026.11',
    necessary: true,
    status: 'custom',
    saveSearchHistory: true,
    personalizedCatalog: true,
    analyticsOptIn: true,
  };
  assert.equal(canTrackSearchHistory(customOptIn), true);
  assert.equal(canPersonalizeCatalog(customOptIn), true);
  assert.equal(canTrackAnalytics(customOptIn), true);
  assert.equal(
    recordOptionalEvent(customOptIn, { name: 'policy_center_open', route: '/legal' }),
    true
  );
  assert.equal(getAnalyticsEventBuffer().length, 1);
  clearAnalyticsEventBuffer();
});

test('policyService builds 20 active policies + 10 not_applicable, omits placeholders publicly, and enforces draft/review/publish versioning', () => {
  const facts = createInitialPolicyFacts();
  const checklist = createInitialLegalReviewChecklist();
  const records = buildDefaultPolicyRecords({ facts });

  const active = records.filter((p) => p.applicability !== 'not_applicable');
  const notApplicable = records.filter((p) => p.applicability === 'not_applicable');
  assert.equal(active.length, 20);
  assert.equal(notApplicable.length, 10);

  const publicDocs = getPublicPublishedPolicies(records);
  assert.equal(publicDocs.length, 20);

  // Public output must never leak [CONFIRM ...] tokens or Counsel Review Notes
  const serializedPublic = JSON.stringify(publicDocs);
  assert.equal(/\[CONFIRM\s+/i.test(serializedPublic), false);
  assert.equal(/Counsel Review Note/i.test(serializedPublic), false);

  const publicFacts = buildPublicFactsSummary(facts);
  assert.equal(publicFacts.returnWindowDays, 14);
  assert.equal(publicFacts.defectReportHours, 48);
  assert.equal(publicFacts.hasConfirmedEntityDetails, false);
  assert.equal(publicFacts.supportPhone, undefined);

  // Draft -> Review -> Publish workflow with immutable version snapshot
  const target = records.find((p) => p.slug === 'return-policy')!;
  const initialVersion = target.currentVersion;
  const drafted = savePolicyDraft(target, {
    title: 'Return, Exchange & Refund Policy',
    summary: 'Updated 14-day studio return standards with 48h defect escalation.<script>bad()</script>',
    sections: [
      {
        id: 'window',
        heading: '14-Day Return Window',
        paragraphs: ['Unopened studio goods qualify within 14 calendar days.'],
      },
    ],
    changeNote: 'Clarified 48h DOA inspection path',
    materialChange: true,
    updatedBy: 'Compliance Officer',
  });
  assert.equal(drafted.status, 'draft');
  assert.ok(drafted.draftContent);
  assert.equal(drafted.draftContent?.summary.includes('<script>'), false);

  const reviewed = transitionPolicyStatus(drafted, 'submit_review', 'Compliance Officer').updated;
  assert.equal(reviewed.status, 'review');

  const publishedRes = transitionPolicyStatus(reviewed, 'publish', 'Compliance Officer');
  const published = publishedRes.updated;
  assert.equal(published.status, 'published');
  assert.notEqual(published.currentVersion, initialVersion);
  assert.ok(published.versionHistory.length >= 2);

  // Historical snapshot lookup yields immutable original version
  const historicalView = projectPublicPolicyDocument(published, initialVersion);
  assert.ok(historicalView);
  assert.equal(historicalView.currentVersion, initialVersion);

  const acceptance = buildValidatedAcceptanceRecord({
    policies: records,
    requestedPolicyIds: ['terms', 'return-policy', 'privacy-policy'],
    marketingOptIn: false,
  });
  assert.equal(acceptance.marketingOptIn, false);
  assert.equal(acceptance.scope.length, 3);
  assert.ok(acceptance.acceptedPolicyVersions?.['return-policy']);

  const checklistSummary = buildPolicyChecklistSummary(records, facts, checklist);
  assert.equal(checklistSummary.totalActivePolicies, 20);
  assert.equal(checklistSummary.totalNotApplicable, 10);
});
