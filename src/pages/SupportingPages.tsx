import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, Wrench } from 'lucide-react';
import {
  ATELIER_CRAFT_IMAGE,
  BRAND_STUDIOS,
  FAQ_ITEMS,
  JOURNAL_ARTICLES,
} from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { JournalArticle } from '../types/commerce';
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
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67]">
          Maker Directory
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Partner Makers &amp; Studios</h1>
        <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC]">
          Independent acoustic labs, textile weavers, botanical formulators, specialty roasters, and architectural foundries behind Kinto Studio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BRAND_STUDIOS.map((studio) => {
          const studioProducts = products.filter((p) => p.brand === studio.name);
          return (
            <article
              key={studio.id}
              className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col justify-between gap-6"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#84827B]">
                  <span>{studio.origin}</span>
                  <span className="font-mono-num">Est. {studio.founded}</span>
                </div>
                <h2 className="font-display text-2xl font-medium">{studio.name}</h2>
                <p className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67]">
                  {studio.specialty}
                </p>
                <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                  {studio.summary}
                </p>
              </div>
              <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-between">
                <span className="text-xs font-mono-num text-[#84827B]">
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
                  className="text-xs font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Explore {studio.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
      <div className="max-w-2xl space-y-2 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67]">
          Monographs &amp; Essays
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">The Studio Journal</h1>
        <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC]">
          Field notes on acoustic engineering, textile provenance, botanical formulation, and living rituals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {JOURNAL_ARTICLES.map((article) => (
          <article
            key={article.slug}
            className="rounded-lg overflow-hidden bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] flex flex-col"
          >
            <div className="aspect-[16/10] bg-[#EFECE5] dark:bg-[#22221F]">
              <ResilientImage
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <p className="text-xs text-[#84827B]">
                  {article.category} · {article.publishedAt} · {article.readTime}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-medium leading-snug">
                  {article.title}
                </h2>
                <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
                <span className="text-xs text-[#84827B]">{article.author}</span>
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
            <p className="text-xs text-[#84827B]">
              By {selectedArticle.author} · {selectedArticle.publishedAt}
            </p>
            <ResilientImage
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full aspect-[16/9] object-cover rounded-md"
            />
            <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#5C5B57] dark:text-[#B4B2AC]">
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
  const { navigate } = useStore();
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-14">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'About Us' }]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8F6438] dark:text-[#C89B67]">
            Founded 2018 · Portland, Oregon
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium leading-tight">
            One curated standard for everything you live, travel, and work with.
          </h1>
          <p className="text-base text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
            Kinto Studio began as an industrial design studio committed to repairable, honest-material furniture. Today we operate as a universal 8-department marketplace—extending that exact standard to wireless audio, tailored fashion, botanical skincare, specialty coffee, outdoor travel carry, office instruments, and curated gifts.
          </p>
          <p className="text-base text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
            Every partner maker—from Copenhagen acoustic engineers to Kyoto shuttle-loom mills and Oregon micro-lot coffee roasters—shares full ingredient provenance, repairability documentation, and transparent pricing in USD ($) and BDT (৳).
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button variant="primary" size="md" onClick={() => navigate({ name: 'shop', category: 'all' })}>
              Explore Marketplace
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate({ name: 'contact' })}>
              Visit Our Showrooms
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <ResilientImage
            src={ATELIER_CRAFT_IMAGE}
            alt="Kinto Studio prototyping and material archive workbench"
            className="w-full aspect-[16/10] object-cover rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
        <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
          <p className="font-display text-3xl font-medium">8 Departments</p>
          <p className="text-sm font-medium">Tech, Fashion, Home, Beauty, Grocery, Outdoor, Office &amp; Gifts</p>
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
            Every SKU is vetted for reparable construction, clean formulation, and enduring utility.
          </p>
        </div>
        <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
          <p className="font-display text-3xl font-medium">6 Makers</p>
          <p className="text-sm font-medium">Direct Studio, Mill &amp; Roastery Partnerships</p>
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
            Small-batch production across Portland, Copenhagen, Kyoto, Providence, and Grasse.
          </p>
        </div>
        <div className="p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2">
          <p className="font-display text-3xl font-medium">Multi-Year</p>
          <p className="text-sm font-medium">Maker Warranty &amp; Spare Parts Support</p>
          <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] leading-relaxed">
            Replaceable headphone earpads, modular watch straps, and 10-year structural furniture backing.
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
  const [topic, setTopic] = useState('client-care');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message.trim()) {
      setError('Please provide your name, a valid email address, and your message.');
      return;
    }
    setError('');
    setSubmitted(true);
    showToast('Inquiry received', 'Our studio concierge responds within 1 business day.', 'success');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: 'Contact Us' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <h1 className="font-display text-4xl sm:text-5xl font-medium">Contact &amp; Showrooms</h1>
          <p className="text-sm sm:text-base text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
            Speak with our residential specialists regarding material samples, white-glove scheduling, or architectural trade orders.
          </p>

          <div className="space-y-4 pt-2 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
              <div>
                <p className="font-medium">Portland Flagship Atelier</p>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                  1420 NW Flanders St, Portland, OR 97209 · Tue–Sun 10am–6pm
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
              <div>
                <p className="font-medium">New York SoHo Gallery</p>
                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                  84 Crosby St, New York, NY 10012 · Daily 11am–7pm
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
              <span className="text-xs font-mono-num">concierge@kintostudio.example</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
              <span className="text-xs font-mono-num">+1 (503) 555-0182</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          {submitted ? (
            <div className="py-10 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#1F6E43] dark:text-[#4ADE80]" />
              <h2 className="font-display text-3xl font-medium">Message Received</h2>
              <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] max-w-md mx-auto">
                Thank you, {name}. A studio specialist will reply to {email} within one business day.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
              >
                Send Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <h2 className="font-display text-2xl font-medium">Send a Studio Inquiry</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>
              <Select
                label="Inquiry Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                options={[
                  { value: 'client-care', label: 'Client Care & Product Specifications' },
                  { value: 'trade', label: 'Trade & Architectural Program' },
                  { value: 'delivery', label: 'White-Glove & Order Logistics' },
                  { value: 'press', label: 'Press & Monograph Requests' },
                ]}
              />
              <Textarea
                label="Message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your space, timeline, or question..."
              />
              {error && <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{error}</p>}
              <Button type="submit" variant="primary" size="lg">
                Submit Inquiry
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
        <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67]">Support</p>
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
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ title, subtitle, sections }) => {
  const { navigate } = useStore();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[{ label: 'Home', onClick: () => navigate({ name: 'home' }) }, { label: title }]}
      />
      <div className="space-y-2 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <p className="text-xs uppercase tracking-wider text-[#84827B]">Studio Documentation</p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">{title}</h1>
        <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">{subtitle}</p>
      </div>
      <div className="space-y-8">
        {sections.map((sec) => (
          <section key={sec.heading} className="space-y-2">
            <h2 className="text-lg font-semibold">{sec.heading}</h2>
            <p className="text-sm leading-relaxed text-[#5C5B57] dark:text-[#B4B2AC]">{sec.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const { navigate } = useStore();
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <p className="font-mono-num text-xs uppercase tracking-widest text-[#84827B]">Error 404</p>
      <h1 className="font-display text-4xl sm:text-5xl font-medium">Page Not Found</h1>
      <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC]">
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
      <div className="w-12 h-12 mx-auto rounded-lg bg-[#F2F0EC] dark:bg-[#22221F] flex items-center justify-center text-[#8F6438] dark:text-[#C89B67]">
        <Wrench className="w-5 h-5" />
      </div>
      <p className="font-mono-num text-xs uppercase tracking-widest text-[#84827B]">
        Scheduled Atelier Maintenance
      </p>
      <h1 className="font-display text-4xl font-medium">Catalog Update in Progress</h1>
      <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC] leading-relaxed">
        This preview illustrates the Kinto Studio maintenance notice state. All storefront browsing remains active in this session.
      </p>
      <Button variant="primary" size="md" onClick={() => navigate({ name: 'home' })}>
        Return to Storefront
      </Button>
    </div>
  );
};
