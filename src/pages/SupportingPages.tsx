import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cookie,
  FileText,
  Mail,
  MapPin,
  Phone,
  Printer,
  Scale,
  Wrench,
} from 'lucide-react';
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
import { isValidContactPhone } from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { Accordion, Breadcrumb, Modal, ResilientImage } from '../components/ui/Primitives';

export const BrandsPage: React.FC = () => {
  const { navigate, products } = useStore();
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'Partner Makers' }]}
      />
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">
          Maker Directory
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Partner Makers &amp; Studios</h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)]">
          Independent acoustic labs, textile weavers, botanical formulators, specialty roasters, and architectural foundries behind Kinto Studio.
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
                  <span className="font-mono-num shrink-0">Est. {studio.founded}</span>
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
                  {studioProducts.length} {studioProducts.length === 1 ? 'product' : 'products'} in catalog
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
                  className="text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-right hover:underline cursor-pointer"
                >
                  <span>Explore {studio.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
  const { navigate } = useStore();
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'Studio Journal' }]}
      />
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">
          Monographs &amp; Essays
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">The Studio Journal</h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)]">
          Field notes on acoustic engineering, textile provenance, botanical formulation, and living rituals.
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
                  Read Essay
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
  const { navigate, categories } = useStore();
  return (
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-14">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'About Us' }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)]">
            Dhaka Operations &amp; Curated Global Makers
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-tight">
            One curated standard for everything you live, travel, and work with.
          </h1>
          <p className="text-base text-[var(--ks-text-secondary)] leading-relaxed">
            Kinto Studio began as an industrial design studio committed to repairable, honest-material everyday objects. Today we operate as a {categories.length}-department marketplace across Bangladesh—spanning technology, tailored fashion, home furnishings, botanical skincare, specialty grocery, outdoor travel carry, books, precision tools, baby care, and wellness.
          </p>
          <p className="text-base text-[var(--ks-text-secondary)] leading-relaxed">
            Every partner maker—from Copenhagen acoustic engineers and Kyoto textile mills to Nordic coffee roasters and local Dhaka studios—shares material provenance, repairability documentation, and transparent dual-currency pricing in BDT (৳) and USD ($).
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button variant="primary" size="md" onClick={() => navigate({ name: 'shop', category: 'all' })}>
              Explore Marketplace
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate({ name: 'contact' })}>
              Contact Operations Desk
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
  const { navigate, showToast } = useStore();
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
    <div className="max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'Contact Us' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl font-medium">Contact &amp; Customer Care</h1>
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

        <div className="lg:col-span-7 p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
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
              <h2 className="font-display text-2xl font-medium">Send a Support Inquiry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
                <Input
                  label="Email Address"
                  type="email"
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
                  Privacy Policy
                </button>
                .
              </p>
              <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const { navigate } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Frequently Asked Questions' },
        ]}
      />
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-[var(--ks-accent)]">Support</p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Frequently Asked Questions</h1>
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
  const { navigate, shippingConfig, openCookiePreferences } = useStore();
  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;

  const docs = getLegalDocuments({ dhakaThresholdUsd });
  const doc = getLegalDocumentById(policyId, { dhakaThresholdUsd });

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(`legal-sec-${sectionId}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Legal Center', onClick: () => navigate({ name: 'legal' }) },
          { label: doc.title },
        ]}
      />

      {/* Policy Header */}
      <div className="pb-6 border-b border-[var(--ks-border)] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)] font-medium">
            {doc.category} · Version {doc.version}
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-medium text-balance">
            {doc.title}
          </h1>
          <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
            {doc.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
          {policyId === 'cookie-policy' && (
            <Button variant="secondary" size="sm" onClick={openCookiePreferences}>
              <Cookie className="w-3.5 h-3.5" />
              <span>Manage Cookie Preferences</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            <span>Print Document</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate({ name: 'legal' })}>
            <span>All Policies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Responsive Mobile / Tablet Agreement Switcher */}
      <div className="lg:hidden space-y-3 print:hidden">
        <Select
          label="Switch Legal Document"
          value={doc.id}
          onChange={(e) => navigate({ name: e.target.value as LegalDocumentId })}
          options={docs.map((item) => ({
            value: item.id,
            label: `${item.category}: ${item.title}`,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Desktop Index & Clause Navigation */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-6 print:hidden">
          <div className="p-5 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
              In This Document
            </p>
            <nav aria-label="Document sections" className="space-y-1.5">
              {doc.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="block w-full text-left text-xs leading-snug py-1 text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] transition-colors cursor-pointer"
                >
                  {sec.heading}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5 rounded-lg bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ks-text-muted)]">
              All Legal Documents
            </p>
            <ul className="space-y-1.5">
              {docs.map((item) => {
                const active = item.id === doc.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ name: item.id })}
                      className={`w-full text-left text-xs py-1 transition-colors cursor-pointer ${
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
        <article className="lg:col-span-8 space-y-8 max-w-3xl">
          <div className="p-4 rounded-md bg-[var(--ks-surface-muted)] border border-[var(--ks-border)] space-y-1.5 text-xs">
            <p className="font-semibold text-[var(--ks-text-primary)] inline-flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[var(--ks-accent)] shrink-0" />
              <span>{LEGAL_ENTITY.legalName} · {LEGAL_ENTITY.jurisdictionLabel}</span>
            </p>
            <p className="text-[var(--ks-text-secondary)] leading-relaxed">
              {LEGAL_ENTITY.counselAdvisory}
            </p>
          </div>

          <div className="space-y-8">
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
                    className="text-sm leading-relaxed text-[var(--ks-text-secondary)]"
                  >
                    {para}
                  </p>
                ))}
                {sec.bullets && (
                  <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-[var(--ks-text-secondary)]">
                    {sec.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {sec.table && (
                  <div className="overflow-x-auto border border-[var(--ks-border)] rounded-md mt-3">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
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
                Official Legal Notices &amp; Disputes
              </p>
              <p>{LEGAL_ENTITY.registeredHub}</p>
              <p className="font-mono-num">Email: {LEGAL_ENTITY.legalEmail}</p>
            </div>
            {doc.relatedIds.length > 0 && (
              <div className="pt-3 border-t border-[var(--ks-border)] space-y-2 print:hidden">
                <p className="text-xs font-medium text-[var(--ks-text-muted)]">Related Agreements</p>
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
  const { navigate, shippingConfig, openCookiePreferences, cookieConsent } = useStore();
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
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Legal Center' },
        ]}
      />

      <div className="max-w-3xl space-y-3 pb-6 border-b border-[var(--ks-border)]">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--ks-accent)] font-medium">
          Legal Governance · {docs.length} Policies · Version {LEGAL_VERSION}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium text-balance">
          Legal Center, Policies &amp; Marketplace Agreements
        </h1>
        <p className="text-sm sm:text-base text-[var(--ks-text-secondary)] leading-relaxed">
          Complete contractual terms, Bangladesh consumer and commerce rules, Seller Studio covenants, department safety notices, privacy disclosures, and intellectual property procedures for {LEGAL_ENTITY.legalName}.
        </p>
      </div>

      {/* Jurisdiction & Governance Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">Entity &amp; Counsel Contact</p>
          <p className="text-sm font-semibold">{LEGAL_ENTITY.legalName}</p>
          <p className="text-xs font-mono-num text-[var(--ks-accent)]">
            {LEGAL_ENTITY.legalEmail}
          </p>
        </div>
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">Governing Law &amp; Courts</p>
          <p className="text-sm font-semibold">Laws of Bangladesh</p>
          <p className="text-xs text-[var(--ks-text-secondary)]">
            Competent courts situated in Dhaka, aligned with consumer &amp; digital commerce principles.
          </p>
        </div>
        <div className="p-5 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">Cookie &amp; Tracking Status</p>
            <p className="text-sm font-semibold capitalize">
              {cookieConsent.status === 'unset' ? 'Pending Selection' : cookieConsent.status.replace('-', ' ')}
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={openCookiePreferences}>
              <Cookie className="w-3.5 h-3.5" />
              <span>Manage Cookie Preferences</span>
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
                          <span>{doc.sections.length} Clauses</span>
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
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ks-accent)] hover:underline self-start cursor-pointer"
                    >
                      <span>Read {doc.shortTitle}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
  const { navigate } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <p className="font-mono-num text-xs uppercase tracking-widest text-[var(--ks-text-muted)]">Error 404</p>
      <h1 className="font-display text-4xl sm:text-5xl font-medium">Page Not Found</h1>
      <p className="text-sm text-[var(--ks-text-secondary)]">
        The requested catalog view or studio archive page could not be found.
      </p>
      <div className="pt-2 flex justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => navigate({ name: 'home' })}>
          Return Home
        </Button>
        <Button variant="outline" size="md" onClick={() => navigate({ name: 'shop', category: 'all' })}>
          Browse Shop
        </Button>
      </div>
    </div>
  );
};

export const MaintenancePage: React.FC = () => {
  const { navigate } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <div className="w-12 h-12 mx-auto rounded-lg bg-[var(--ks-surface-muted)] flex items-center justify-center text-[var(--ks-accent)]">
        <Wrench className="w-5 h-5" />
      </div>
      <p className="font-mono-num text-xs uppercase tracking-widest text-[var(--ks-text-muted)]">
        Scheduled Atelier Maintenance
      </p>
      <h1 className="font-display text-4xl font-medium">Catalog Update in Progress</h1>
      <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">
        This preview illustrates the Kinto Studio maintenance notice state. All storefront browsing remains active in this session.
      </p>
      <Button variant="primary" size="md" onClick={() => navigate({ name: 'home' })}>
        Return to Storefront
      </Button>
    </div>
  );
};
