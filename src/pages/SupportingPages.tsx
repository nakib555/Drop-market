import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Cookie,
  FileText,
  Layers,
  Mail,
  MapPin,
  Phone,
  Printer,
  Scale,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ATELIER_CRAFT_IMAGE,
  BRAND_STUDIOS,
  FAQ_ITEMS,
  JOURNAL_ARTICLES,
} from '../data/catalog';
import {
  getLegalDocumentById,
  getLegalDocuments,
  LEGAL_ENTITY,
  LEGAL_VERSION,
} from '../data/legalPolicies';
import { useStore } from '../context/StoreContext';
import { submitSupportInquiryApi } from '../services/api';
import { JournalArticle, LegalDocumentId } from '../types/commerce';
import { t } from '../utils/i18n';
import { STUDIO_TRANSITION } from '../utils/motion';
import { isValidContactPhone } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { Accordion, Breadcrumb, Drawer, Modal, ResilientImage } from '../components/ui/Primitives';

export const BrandsPage: React.FC = () => {
  const { navigate, products, language } = useStore();
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8 sm:space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'brands') },
        ]}
      />
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">
          {t(language, 'makerDirectoryEyebrow')}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">
          {t(language, 'partnerMakersTitle')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)]">
          {t(language, 'brandsSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BRAND_STUDIOS.map((studio) => {
          const studioProducts = products.filter((p) => p.brand === studio.name);
          return (
            <article
              key={studio.id}
              className="p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col justify-between gap-6"
            >
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--ks-text-muted)]">
                  <span className="min-w-0 truncate">{studio.origin}</span>
                  <span className="font-mono-num shrink-0">
                    {t(language, 'estYear', { year: studio.founded })}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-medium">{studio.name}</h2>
                <p className="text-xs font-medium text-[var(--ks-accent)]">
                  {studio.specialty}
                </p>
                <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                  {studio.summary}
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--ks-border)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <span className="text-xs font-mono-num text-[var(--ks-text-muted)] min-w-0">
                  {t(language, 'productsInCatalogCount', {
                    count: studioProducts.length,
                    label: studioProducts.length === 1 ? 'product' : 'products',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      name: 'shop',
                      category: studio.categories[0] || 'all',
                      brand: studio.name,
                    })
                  }
                  className="min-h-[36px] text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-end hover:underline cursor-pointer"
                >
                  <span>{t(language, 'exploreMakerBtn', { name: studio.name })}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export const JournalPage: React.FC = () => {
  const { navigate, language } = useStore();
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8 sm:space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'journal') },
        ]}
      />
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">
          {t(language, 'journalEyebrow')}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">
          {t(language, 'studioJournalTitle')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)]">
          {t(language, 'journalSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {JOURNAL_ARTICLES.map((article) => (
          <article
            key={article.slug}
            className="rounded-lg overflow-hidden bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col"
          >
            <div className="aspect-[16/10] bg-[var(--ks-surface-muted)]">
              <ResilientImage
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {article.category} · {article.publishedAt} · {article.readTime}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-medium leading-snug">
                  {article.title}
                </h2>
                <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[var(--ks-border)]">
                <span className="text-xs text-[var(--ks-text-muted)]">{article.author}</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedArticle(article)}>
                  {t(language, 'readEssayBtn')}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        open={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.category || 'Essay'}
      >
        {selectedArticle && (
          <div className="space-y-5">
            <h2 className="font-display text-3xl font-medium">{selectedArticle.title}</h2>
            <p className="text-xs text-[var(--ks-text-muted)]">
              By {selectedArticle.author} · {selectedArticle.publishedAt}
            </p>
            <ResilientImage
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full aspect-[16/9] object-cover rounded-md"
            />
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[var(--ks-text-secondary)]">
              {selectedArticle.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { navigate, categories, language } = useStore();
  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-12 sm:space-y-14">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'about') },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)]">
            {t(language, 'aboutEyebrow')}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-tight">
            {t(language, 'aboutHeadline')}
          </h1>
          <p className="text-base text-[var(--ks-text-secondary)] leading-relaxed">
            Kinto Studio began as an industrial design studio committed to repairable, honest-material everyday objects. Today we operate as a {categories.length}-department marketplace across Bangladesh—spanning technology, tailored fashion, home furnishings, botanical skincare, specialty grocery, outdoor travel carry, books, precision tools, baby care, and wellness.
          </p>
          <p className="text-base text-[var(--ks-text-secondary)] leading-relaxed">
            Every partner maker—from Copenhagen acoustic engineers and Kyoto textile mills to Nordic coffee roasters and local Dhaka studios—shares material provenance, repairability documentation, and transparent dual-currency pricing in BDT (৳) and USD ($).
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button variant="primary" size="md" onClick={() => navigate({ name: 'shop', category: 'all' })}>
              {t(language, 'exploreMarketplaceBtn')}
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate({ name: 'contact' })}>
              {t(language, 'contactOperationsBtn')}
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <ResilientImage
            src={ATELIER_CRAFT_IMAGE}
            alt="Kinto Studio prototyping and material archive workbench"
            className="w-full aspect-[16/10] object-cover rounded-[var(--ks-radius-lg)] border border-[var(--ks-border)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[var(--ks-border)]">
        <div className="p-6 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-2">
          <p className="font-display text-3xl font-medium">{categories.length} Departments</p>
          <p className="text-sm font-medium">
            Tech, Fashion, Home, Beauty, Grocery, Outdoors, Books, Tools, Baby Care &amp; Wellness
          </p>
          <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
            Every SKU is vetted for repairable construction, clean formulation, and everyday reliability.
          </p>
        </div>
        <div className="p-6 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-2">
          <p className="font-display text-3xl font-medium">6 Partner Studios</p>
          <p className="text-sm font-medium">Direct Studio, Mill &amp; Roastery Partnerships</p>
          <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
            Small-batch production across Dhaka, Copenhagen, Kyoto, Providence, Zurich, and Grasse.
          </p>
        </div>
        <div className="p-6 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-2">
          <p className="font-display text-3xl font-medium">64 Districts</p>
          <p className="text-sm font-medium">Bangladesh Fulfillment &amp; Warranty Support</p>
          <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
            Transparent metro &amp; nationwide courier slabs, BDT-settled checkout, and manufacturer warranty support.
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { navigate, showToast, language } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('client-care');
  const [message, setMessage] = useState('');
  const [submittedTicketRef, setSubmittedTicketRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.trim().length < 5) {
      setError('Please provide your name, a valid email address, and a message (at least 5 characters).');
      return;
    }
    if (phone.trim() && !isValidContactPhone(phone, 'Bangladesh')) {
      setError('Please enter a valid Bangladesh mobile number (e.g. +880 1711-000100) or leave it blank.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const inquiry = await submitSupportInquiryApi({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        topic,
        message: message.trim(),
      });
      setSubmittedTicketRef(inquiry.ticketRef);
      showToast(
        `Ticket ${inquiry.ticketRef} logged`,
        'Our customer care desk responds within 1 business day.',
        'success'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8 sm:space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'contact') },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">
        <div className="lg:col-span-5 space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl font-medium">
            {t(language, 'contactCustomerCareTitle')}
          </h1>
          <p className="text-sm sm:text-base text-[var(--ks-text-secondary)] leading-relaxed">
            Speak with our Bangladesh marketplace specialists regarding order tracking, courier delivery scheduling across all 64 districts, warranty assistance, or Seller Studio onboarding.
          </p>

          <div className="space-y-4 pt-2 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
              <div>
                <p className="font-medium leading-snug">Dhaka Operations &amp; Fulfillment Desk</p>
                <p className="text-xs text-[var(--ks-text-secondary)] leading-snug mt-0.5">
                  Online-first retail desk serving Dhaka Metro &amp; all 8 divisions · Sat–Thu 9:00am–7:00pm BST
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
              <span className="text-xs font-mono-num">{LEGAL_ENTITY.conciergeEmail}</span>
            </div>
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
              <span className="text-xs font-mono-num">{LEGAL_ENTITY.legalEmail} (Legal &amp; Notices)</span>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-[3px] text-[var(--ks-accent)] shrink-0" />
              <p className="text-xs text-[var(--ks-text-secondary)] leading-snug">
                Verified callback and courier coordination are scheduled automatically against submitted order &amp; support tickets.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-5 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          {submittedTicketRef ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[var(--ks-success)]" />
              <h2 className="font-display text-3xl font-medium">Message Received</h2>
              <p className="text-xs font-mono-num uppercase tracking-wider text-[var(--ks-accent)]">
                Reference: {submittedTicketRef}
              </p>
              <p className="text-sm text-[var(--ks-text-secondary)] max-w-md mx-auto">
                Thank you, {name}. Your support ticket has been recorded on the server. A customer care specialist will reply to {email} within one business day.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSubmittedTicketRef('');
                  setMessage('');
                }}
              >
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <h2 className="font-display text-2xl font-medium">
                {t(language, 'sendSupportInquiry')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
                <Input
                  label="Email Address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Bangladesh Mobile (Optional)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                />
                <Select
                  label="Inquiry Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  options={[
                    { value: 'client-care', label: 'Client Care & Product Specifications' },
                    { value: 'delivery', label: 'Dhaka & Nationwide Courier Logistics' },
                    { value: 'warranty', label: 'Returns, Refunds & Warranty Claims' },
                    { value: 'seller', label: 'Seller Onboarding & Trade Program' },
                  ]}
                />
              </div>
              <Textarea
                label="Message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your order number, question, or delivery details..."
              />
              {error && <p className="text-xs text-[var(--ks-error)]">{error}</p>}
              <p className="text-[11px] leading-snug text-[var(--ks-text-secondary)]">
                By submitting this form, you acknowledge that your inquiry details are processed under our{' '}
                <button
                  type="button"
                  onClick={() => navigate({ name: 'privacy-policy' })}
                  className="underline text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                >
                  {t(language, 'privacyPolicy')}
                </button>
                .
              </p>
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? t(language, 'subscribing') : t(language, 'submitInquiryBtn')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const { navigate, language } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-8 sm:space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'faqTitle') },
        ]}
      />
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">
          {t(language, 'support')}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">
          {t(language, 'faqTitle')}
        </h1>
      </div>
      <Accordion
        items={FAQ_ITEMS.map((item, idx) => ({
          id: `faq-${idx}`,
          meta: item.category,
          title: item.question,
          content: item.answer,
        }))}
      />
    </div>
  );
};

interface PolicyPageProps {
  policyId: LegalDocumentId;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyId }) => {
  const { navigate, shippingConfig, openCookiePreferences, language } = useStore();
  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;

  const docs = useMemo(() => getLegalDocuments({ dhakaThresholdUsd }), [dhakaThresholdUsd]);
  const doc = useMemo(
    () => getLegalDocumentById(policyId, { dhakaThresholdUsd }),
    [policyId, dhakaThresholdUsd]
  );

  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const [policyQuery, setPolicyQuery] = useState('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const categories: Array<
    'Core Agreements' | 'Commerce & Logistics' | 'Marketplace Governance' | 'Safety & Rights'
  > = [
    'Core Agreements',
    'Commerce & Logistics',
    'Marketplace Governance',
    'Safety & Rights',
  ];

  const filteredDocs = useMemo(() => {
    const q = policyQuery.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.shortTitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
    );
  }, [docs, policyQuery]);

  const scrollToSection = (sectionId: string) => {
    setMobileTocOpen(false);
    const target = document.getElementById(`legal-sec-${sectionId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 space-y-6 lg:space-y-8">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'legalCenter'), onClick: () => navigate({ name: 'legal' }) },
          { label: doc.shortTitle },
        ]}
      />

      {/* Policy Header */}
      <div className="pb-5 sm:pb-6 border-b border-[var(--ks-border)] flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)] font-medium">
            {doc.category} · v{doc.version} · {doc.lastUpdated}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-medium text-balance">
            {doc.title}
          </h1>
          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            {doc.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
          {policyId === 'cookie-policy' && (
            <Button variant="secondary" size="sm" onClick={openCookiePreferences}>
              <Cookie className="w-3.5 h-3.5" />
              <span>{t(language, 'manageCookiePreferences')}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            <span>{t(language, 'printDocument')}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'legal' })}>
            <span>{t(language, 'allPolicies')}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Button>
        </div>
      </div>

      {/* Custom Mobile / Tablet Policy Switcher + Clause Jump Accordion */}
      <div className="lg:hidden space-y-2.5 print:hidden">
        <button
          type="button"
          onClick={() => setPolicyDrawerOpen(true)}
          className="w-full min-h-[52px] px-4 py-2.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] hover:border-[var(--ks-accent)] flex items-center justify-between gap-3 text-start transition-colors cursor-pointer"
        >
          <div className="min-w-0 flex items-center gap-3">
            <span className="w-8 h-8 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface-muted)] flex items-center justify-center text-[var(--ks-accent)] shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                {t(language, 'switchLegalDocument', { count: docs.length })}
              </p>
              <p className="text-sm font-medium text-[var(--ks-text-primary)] truncate">
                {doc.title}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--ks-text-muted)] shrink-0" />
        </button>

        {doc.sections.length > 0 && (
          <div className="rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-surface)] overflow-hidden">
            <button
              type="button"
              aria-expanded={mobileTocOpen}
              onClick={() => setMobileTocOpen((p) => !p)}
              className="w-full min-h-[44px] px-4 py-2 flex items-center justify-between text-xs font-medium text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                <span>{t(language, 'inThisDocumentCount', { count: doc.sections.length })}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-150 ${
                  mobileTocOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {mobileTocOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={STUDIO_TRANSITION.accordion}
                  className="overflow-hidden border-t border-[var(--ks-border)]"
                >
                  <nav aria-label="Mobile document sections" className="p-2 space-y-0.5">
                    {doc.sections.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className="w-full min-h-[40px] px-3 rounded text-start text-xs text-[var(--ks-text-secondary)] hover:bg-[var(--ks-bg)] hover:text-[var(--ks-text-primary)] cursor-pointer flex items-center"
                      >
                        {sec.heading}
                      </button>
                    ))}
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Custom Searchable Grouped Drawer Sheet for all 17 Policies */}
      <Drawer
        open={policyDrawerOpen}
        onClose={() => setPolicyDrawerOpen(false)}
        title={`${t(language, 'legalCenter')} (${docs.length})`}
        side={language === 'ar' ? 'left' : 'right'}
      >
        <div className="p-4 space-y-5">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--ks-text-muted)] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={policyQuery}
              onChange={(e) => setPolicyQuery(e.target.value)}
              placeholder={t(language, 'searchLegalPlaceholder')}
              aria-label={t(language, 'searchLegalPlaceholder')}
              className="w-full min-h-[44px] ps-10 pe-10 py-2 text-base sm:text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border-strong)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none focus:border-[var(--ks-accent)]"
            />
            {policyQuery && (
              <button
                type="button"
                onClick={() => setPolicyQuery('')}
                aria-label={t(language, 'clearPolicySearch')}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {filteredDocs.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--ks-text-secondary)]">
              {t(language, 'noMatchingLegalDocs', { query: policyQuery })}
            </p>
          ) : (
            <div className="space-y-5">
              {categories.map((group) => {
                const groupDocs = filteredDocs.filter((d) => d.category === group);
                if (groupDocs.length === 0) return null;
                return (
                  <div key={group} className="space-y-1.5">
                    <p className="px-1 text-[11px] uppercase tracking-[0.12em] font-semibold text-[var(--ks-text-muted)]">
                      {group} ({groupDocs.length})
                    </p>
                    <div className="rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] divide-y divide-[var(--ks-border)] overflow-hidden">
                      {groupDocs.map((item) => {
                        const active = item.id === doc.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPolicyDrawerOpen(false);
                              setPolicyQuery('');
                              navigate({ name: item.id });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-full min-h-[52px] px-3.5 py-2.5 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer ${
                              active
                                ? 'bg-[var(--ks-surface-muted)] text-[var(--ks-text-primary)]'
                                : 'bg-[var(--ks-surface)] hover:bg-[var(--ks-bg)]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm leading-snug truncate ${
                                  active ? 'font-semibold text-[var(--ks-accent)]' : 'font-medium'
                                }`}
                              >
                                {item.title}
                              </p>
                              <p className="text-[11px] text-[var(--ks-text-secondary)] mt-0.5 truncate">
                                {t(language, 'clausesCount', { count: item.sections.length })} · v{item.version}
                              </p>
                            </div>
                            {active && (
                              <Check className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Desktop Index & Clause Navigation */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-5 print:hidden">
          <div className="p-5 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
              {t(language, 'inThisDocument')}
            </p>
            <nav aria-label="Document sections" className="space-y-1.5">
              {doc.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="block w-full text-start text-xs leading-snug py-1 text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] transition-colors cursor-pointer"
                >
                  {sec.heading}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 rounded-lg bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
              {t(language, 'allLegalDocumentsCount', { count: docs.length })}
            </p>
            <ul className="space-y-1.5 max-h-[42vh] overflow-y-auto pe-1">
              {docs.map((item) => {
                const active = item.id === doc.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ name: item.id })}
                      className={`w-full text-start text-xs py-1 transition-colors cursor-pointer ${
                        active
                          ? 'font-semibold text-[var(--ks-accent)]'
                          : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
                      }`}
                    >
                      {item.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main Policy Clauses */}
        <article className="lg:col-span-8 space-y-7 ks-reading-measure">
          <div className="p-4 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] space-y-1.5 text-xs">
            <p className="font-semibold text-[var(--ks-text-primary)] inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
              <span>{LEGAL_ENTITY.legalName} · {LEGAL_ENTITY.jurisdictionLabel}</span>
            </p>
            <p className="text-[var(--ks-text-secondary)] leading-relaxed">
              {LEGAL_ENTITY.counselAdvisory}
            </p>
          </div>

          <div className="space-y-7">
            {doc.sections.map((sec) => (
              <section
                key={sec.id}
                id={`legal-sec-${sec.id}`}
                className="scroll-mt-28 space-y-3 pb-6 border-b border-[var(--ks-border)] last:border-b-0"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--ks-text-primary)]">
                  {sec.heading}
                </h2>
                {sec.paragraphs.map((para, idx) => (
                  <p
                    key={idx}
                    className="text-sm leading-[1.7] text-[var(--ks-text-secondary)]"
                  >
                    {para}
                  </p>
                ))}
                {sec.bullets && (
                  <ul className="list-disc ps-5 space-y-2 text-sm leading-[1.7] text-[var(--ks-text-secondary)]">
                    {sec.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {sec.table && (
                  <div className="overflow-x-auto border border-[var(--ks-border)] rounded-md mt-3">
                    <table className="w-full text-start text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-[var(--ks-bg)] border-b border-[var(--ks-border)]">
                          {sec.table.headers.map((head) => (
                            <th key={head} className="px-4 py-2.5 font-semibold">
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--ks-border)]">
                        {sec.table.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-4 py-2.5 text-[var(--ks-text-secondary)] align-top"
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

          {/* Entity & Related Agreements Footer */}
          <div className="p-5 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4">
            <div className="space-y-1 text-xs text-[var(--ks-text-secondary)]">
              <p className="font-semibold text-[var(--ks-text-primary)]">
                {t(language, 'officialLegalNotices')}
              </p>
              <p>{LEGAL_ENTITY.registeredHub}</p>
              <p className="font-mono-num">{LEGAL_ENTITY.legalEmail}</p>
            </div>
            {doc.relatedIds.length > 0 && (
              <div className="pt-3 border-t border-[var(--ks-border)] space-y-2 print:hidden">
                <p className="text-xs font-medium text-[var(--ks-text-muted)]">
                  {t(language, 'relatedAgreements')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {doc.relatedIds.map((relId) => {
                    const relDoc = getLegalDocumentById(relId, { dhakaThresholdUsd });
                    return (
                      <Button
                        key={relId}
                        variant="outline"
                        size="sm"
                        onClick={() => navigate({ name: relId })}
                      >
                        {relDoc.shortTitle}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export const LegalCenterPage: React.FC = () => {
  const { navigate, shippingConfig, openCookiePreferences, cookieConsent, language } = useStore();
  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;
  const docs = getLegalDocuments({ dhakaThresholdUsd });

  const categories: Array<
    'Core Agreements' | 'Commerce & Logistics' | 'Marketplace Governance' | 'Safety & Rights'
  > = [
    'Core Agreements',
    'Commerce & Logistics',
    'Marketplace Governance',
    'Safety & Rights',
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'legalCenter') },
        ]}
      />

      <div className="max-w-3xl space-y-3 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)] font-medium">
          {t(language, 'legalCenter')} · {docs.length} · v{LEGAL_VERSION}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium text-balance">
          {t(language, 'legalCenterHeadline')}
        </h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)] leading-relaxed">
          {t(language, 'legalCenterSubtitle', { name: LEGAL_ENTITY.legalName })}
        </p>
      </div>

      {/* Jurisdiction & Governance Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            {t(language, 'entityCounselLabel')}
          </p>
          <p className="text-sm font-semibold">{LEGAL_ENTITY.legalName}</p>
          <p className="text-xs font-mono-num text-[var(--ks-accent)]">
            {LEGAL_ENTITY.legalEmail}
          </p>
        </div>
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
            {t(language, 'governingLawLabel')}
          </p>
          <p className="text-sm font-semibold">{t(language, 'lawsOfBangladesh')}</p>
          <p className="text-xs text-[var(--ks-text-secondary)]">
            {t(language, 'dhakaCourtsDesc')}
          </p>
        </div>
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
              {t(language, 'cookieTrackingStatus')}
            </p>
            <p className="text-sm font-semibold capitalize">
              {cookieConsent.status === 'unset'
                ? t(language, 'pendingSelection')
                : cookieConsent.status.replace('-', ' ')}
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={openCookiePreferences}>
              <Cookie className="w-3.5 h-3.5" />
              <span>{t(language, 'manageCookiePreferences')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Categorized Legal Document Index */}
      <div className="space-y-10">
        {categories.map((group) => {
          const groupDocs = docs.filter((d) => d.category === group);
          return (
            <section key={group} className="space-y-4">
              <h2 className="font-display text-2xl font-medium border-b border-[var(--ks-border)] pb-2">
                {group} ({groupDocs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {groupDocs.map((doc) => (
                  <article
                    key={doc.id}
                    className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--ks-text-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                          <span>{t(language, 'clausesCount', { count: doc.sections.length })}</span>
                        </span>
                        <span className="font-mono-num">v{doc.version}</span>
                      </div>
                      <h3 className="text-base font-semibold">{doc.title}</h3>
                      <p className="text-xs text-[var(--ks-text-secondary)] leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ name: doc.id })}
                      className="min-h-[36px] inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ks-accent)] hover:underline self-start cursor-pointer"
                    >
                      <span>{t(language, 'readDocBtn', { name: doc.shortTitle })}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-[var(--ks-text-secondary)] p-4 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface-muted)] border border-[var(--ks-border)]">
        {LEGAL_ENTITY.counselAdvisory}
      </p>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const { navigate, language } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 sm:py-24 text-center space-y-5">
      <p className="font-mono-num text-xs uppercase tracking-widest text-[var(--ks-text-muted)]">Error 404</p>
      <h1 className="font-display text-4xl sm:text-5xl font-medium">
        {t(language, 'pageNotFoundTitle')}
      </h1>
      <p className="text-sm text-[var(--ks-text-secondary)]">
        {t(language, 'notFoundSubtitle')}
      </p>
      <div className="pt-2 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => navigate({ name: 'home' })}>
          {t(language, 'returnHomeBtn')}
        </Button>
        <Button variant="outline" size="md" onClick={() => navigate({ name: 'shop', category: 'all' })}>
          {t(language, 'browseShopBtn')}
        </Button>
      </div>
    </div>
  );
};

export const MaintenancePage: React.FC = () => {
  const { navigate, language } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-20 sm:py-24 text-center space-y-5">
      <div className="w-12 h-12 mx-auto rounded-lg bg-[var(--ks-surface-muted)] flex items-center justify-center text-[var(--ks-accent)]">
        <Wrench className="w-5 h-5" />
      </div>
      <p className="font-mono-num text-xs uppercase tracking-widest text-[var(--ks-text-muted)]">
        {t(language, 'maintenanceNoticeEyebrow')}
      </p>
      <h1 className="font-display text-4xl font-medium">
        {t(language, 'catalogUpdateTitle')}
      </h1>
      <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
        {t(language, 'maintenanceNoticeSubtitle')}
      </p>
      <Button variant="primary" size="md" onClick={() => navigate({ name: 'home' })}>
        {t(language, 'returnToStorefrontBtn')}
      </Button>
    </div>
  );
};
