import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Layers,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Sun,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_STUDIOS } from '../../data/catalog';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, fuzzyScoreText } from '../../utils/format';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { ResilientImage, useFocusTrap } from '../ui/Primitives';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const {
    route,
    navigate,
    categories,
    products,
    currency,
    language,
    shippingConfig,
    setCurrency,
    toggleCurrency,
    toggleLanguage,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    cartItemCount,
    setCartDrawerOpen,
    wishlistIds,
    profile,
    logoutDemo,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
  } = useStore();
  const { theme, toggleTheme } = useTheme();

  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCatSlug, setHoveredCatSlug] = useState<string>(
    categories[0]?.slug || 'electronics-tech'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(true);
  const [expandedMobileDept, setExpandedMobileDept] = useState<string | null>('electronics-tech');

  // Prominent inline live search dropdown state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchActiveIdx, setSearchActiveIdx] = useState(-1);

  const closeTimeoutRef = useRef<number | null>(null);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);
  const accountContainerRef = useRef<HTMLDivElement | null>(null);
  const currencyContainerRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileNavPanelRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(mobileMenuOpen, mobileNavPanelRef);

  const dhakaFreeThresholdUsd = useMemo(
    () => shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd,
    [shippingConfig]
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!hoveredCatSlug && categories[0]?.slug) {
      setHoveredCatSlug(categories[0].slug);
    }
  }, [categories, hoveredCatSlug]);

  useEffect(() => {
    if (!notifOpen && !accountMenuOpen && !currencyMenuOpen && !searchDropdownOpen && !megaMenuOpen) {
      return;
    }
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifOpen && notifContainerRef.current && !notifContainerRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (
        accountMenuOpen &&
        accountContainerRef.current &&
        !accountContainerRef.current.contains(target)
      ) {
        setAccountMenuOpen(false);
      }
      if (
        currencyMenuOpen &&
        currencyContainerRef.current &&
        !currencyContainerRef.current.contains(target)
      ) {
        setCurrencyMenuOpen(false);
      }
      if (
        searchDropdownOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setSearchDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setAccountMenuOpen(false);
        setCurrencyMenuOpen(false);
        setSearchDropdownOpen(false);
        setMegaMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen, accountMenuOpen, currencyMenuOpen, searchDropdownOpen, megaMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const matchingSearchCategories = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return [];
    return categories
      .map((c) => {
        const subNames = c.subcategories
          .flatMap((s) => [s.name, ...(s.children?.map((ch) => ch.name) || [])])
          .join(' ');
        const score = Math.max(
          fuzzyScoreText(q, c.name),
          fuzzyScoreText(q, `${c.shortName} ${subNames}`)
        );
        return { cat: c, score };
      })
      .filter((entry) => entry.score >= 18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((e) => e.cat);
  }, [categories, searchTerm]);

  const matchingSearchBrands = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return [];
    return BRAND_STUDIOS.map((b) => ({
      brand: b,
      score: Math.max(fuzzyScoreText(q, b.name), fuzzyScoreText(q, b.specialty)),
    }))
      .filter((entry) => entry.score >= 18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((e) => e.brand);
  }, [searchTerm]);

  const searchSuggestions = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return [];
    return products
      .map((p) => {
        const score = Math.max(
          fuzzyScoreText(q, p.name) * 1.2,
          fuzzyScoreText(q, p.brand),
          fuzzyScoreText(q, `${p.categoryLabel} ${p.subcategoryLabel} ${p.tags.join(' ')}`),
          fuzzyScoreText(q, p.shortDescription) * 0.6
        );
        return { product: p, score };
      })
      .filter((entry) => entry.score >= 16)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((e) => e.product);
  }, [products, searchTerm]);

  const activeHoverCat =
    categories.find((c) => c.slug === hoveredCatSlug) || categories[0];

  const featuredProducts = products
    .filter((p) => p.category === activeHoverCat?.slug)
    .slice(0, 2);

  const openMegaMenu = (slug?: string) => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (slug) setHoveredCatSlug(slug);
    setSearchDropdownOpen(false);
    setMegaMenuOpen(true);
  };

  const scheduleCloseMegaMenu = () => {
    if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => {
      setMegaMenuOpen(false);
    }, 140);
  };

  const go = (next: Parameters<typeof navigate>[0]) => {
    setMegaMenuOpen(false);
    setMobileMenuOpen(false);
    setNotifOpen(false);
    setAccountMenuOpen(false);
    setCurrencyMenuOpen(false);
    setSearchDropdownOpen(false);
    navigate(next);
  };

  const submitHeaderSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    addRecentSearch(clean);
    setSearchDropdownOpen(false);
    navigate({ name: 'search', query: clean });
  };

  const handleHeaderSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchDropdownOpen(false);
      desktopSearchInputRef.current?.blur();
      return;
    }
    if (!searchDropdownOpen || searchSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchActiveIdx((prev) => (prev + 1) % searchSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchActiveIdx((prev) =>
        prev <= 0 ? searchSuggestions.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter' && searchActiveIdx >= 0 && searchSuggestions[searchActiveIdx]) {
      e.preventDefault();
      const chosen = searchSuggestions[searchActiveIdx];
      addRecentSearch(searchTerm || chosen.name);
      setSearchDropdownOpen(false);
      navigate({ name: 'product', slug: chosen.slug });
    }
  };

  return (
    <>
      {/* Tier 1: Calm Announcement Strip */}
      <AnimatePresence initial={false}>
        {announcementVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={STUDIO_TRANSITION.fast}
            className="overflow-hidden bg-[#222220] dark:bg-[#191917] text-[#FAF9F6] text-[11px] sm:text-xs border-b border-white/10"
          >
            <div className="py-1.5 sm:py-2 px-3 sm:px-6 lg:px-10 max-w-[var(--ks-container-max)] mx-auto grid grid-cols-[2rem_1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
              <span className="lg:hidden w-8" aria-hidden="true" />
              <span className="hidden lg:inline text-[#B4B2AC] whitespace-nowrap justify-self-start truncate">
                {t(language, 'deliveryNotice')}
              </span>

              <p className="min-w-0 text-center truncate">
                {dhakaFreeThresholdUsd ? (
                  <>
                    Free Dhaka Metro delivery from{' '}
                    <span className="font-mono-num">{formatCurrency(dhakaFreeThresholdUsd, currency)}</span>
                    {' · '}
                  </>
                ) : null}
                Use code <span className="font-mono-num font-medium text-[#E2B887]">STUDIO15</span> for 15% off qualifying orders
              </p>

              <button
                type="button"
                onClick={() => setAnnouncementVisible(false)}
                aria-label="Dismiss announcement"
                className="justify-self-end text-[#B4B2AC] hover:text-white p-1.5 -mr-1 cursor-pointer transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-shadow duration-200 ${
          scrolled
            ? 'bg-[var(--ks-bg)]/98 border-[var(--ks-border-strong)] shadow-sm'
            : 'bg-[var(--ks-bg)]/95 border-[var(--ks-border)]'
        }`}
        onMouseLeave={scheduleCloseMegaMenu}
        onMouseEnter={() => {
          if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        }}
      >
        {/* Tier 2: Logo, Prominent Search, Account, Wishlist & Bag */}
        <div
          className={`max-w-[var(--ks-container-max)] mx-auto px-3 sm:px-6 lg:px-10 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 transition-[height] duration-200 ${
            scrolled ? 'h-13 sm:h-14' : 'h-14 sm:h-16'
          }`}
        >
          {/* Mobile menu button + Brand Wordmark */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden w-10 h-10 -ml-1.5 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                go({ name: 'home' });
              }}
              className="font-display text-base min-[380px]:text-lg sm:text-xl lg:text-2xl font-semibold tracking-[0.04em] sm:tracking-[0.07em] text-[var(--ks-text-primary)] whitespace-nowrap truncate"
            >
              KINTO STUDIO
            </a>
          </div>

          {/* Central Inline Search Bar (Tablet & Desktop) */}
          <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitHeaderSearch(searchTerm);
              }}
              className={`flex items-center gap-2.5 h-9 lg:h-10 px-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border transition-colors ${
                searchDropdownOpen
                  ? 'border-[var(--ks-accent)] ring-1 ring-[var(--ks-accent)]/20'
                  : 'border-[var(--ks-border)] hover:border-[var(--ks-border-strong)]'
              }`}
            >
              <Search className="w-4 h-4 shrink-0 text-[var(--ks-text-secondary)]" />
              <input
                ref={desktopSearchInputRef}
                type="search"
                value={searchTerm}
                onFocus={() => setSearchDropdownOpen(true)}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSearchActiveIdx(-1);
                  setSearchDropdownOpen(true);
                }}
                onKeyDown={handleHeaderSearchKeyDown}
                placeholder={t(language, 'searchPlaceholder')}
                aria-label="Search products"
                aria-expanded={searchDropdownOpen}
                className="flex-1 min-w-0 bg-transparent text-xs lg:text-sm text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSearchActiveIdx(-1);
                    desktopSearchInputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="text-[11px] text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] px-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 rounded-[var(--ks-radius-sm)] bg-[var(--ks-action)] text-[var(--ks-action-text)] text-[11px] font-medium hover:bg-[var(--ks-action-hover)] cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            <AnimatePresence>
              {searchDropdownOpen && (
                <motion.div
                  key="header-search-dropdown"
                  initial={{ opacity: 0, y: 6, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.99 }}
                  transition={STUDIO_TRANSITION.fast}
                  className="absolute left-0 right-0 mt-2 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] shadow-[var(--ks-shadow-overlay)] overflow-hidden z-50"
                >
                  <div className="p-4 max-h-[68vh] overflow-y-auto space-y-4">
                    {searchTerm.trim() ? (
                      <>
                        {(matchingSearchCategories.length > 0 || matchingSearchBrands.length > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {matchingSearchCategories.map((cat) => (
                              <button
                                key={cat.slug}
                                type="button"
                                onClick={() => go({ name: 'category', category: cat.slug })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface-muted)] text-xs font-medium hover:border-[var(--ks-action)] border border-transparent cursor-pointer"
                              >
                                <Layers className="w-3 h-3 text-[var(--ks-accent)]" />
                                <span>{cat.name}</span>
                              </button>
                            ))}
                            {matchingSearchBrands.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() =>
                                  go({
                                    name: 'shop',
                                    category: b.categories[0] || 'all',
                                    brand: b.name,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--ks-radius-sm)] border border-[var(--ks-border)] text-xs hover:border-[var(--ks-accent)] cursor-pointer"
                              >
                                <Store className="w-3 h-3 text-[var(--ks-accent)]" />
                                <span>{b.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                              Matching Products
                            </p>
                            <button
                              type="button"
                              onClick={() => submitHeaderSearch(searchTerm)}
                              className="text-xs font-medium text-[var(--ks-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View all results</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          {searchSuggestions.length === 0 ? (
                            <p className="text-xs text-[var(--ks-text-secondary)] py-3">
                              No direct product matches for &ldquo;{searchTerm}&rdquo;. Press Enter to search all products.
                            </p>
                          ) : (
                            <ul className="divide-y divide-[var(--ks-divider)]">
                              {searchSuggestions.map((item, idx) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      addRecentSearch(searchTerm || item.name);
                                      go({ name: 'product', slug: item.slug });
                                    }}
                                    className={`w-full py-2.5 px-2 rounded-[var(--ks-radius-md)] flex items-center gap-3 text-left transition-colors cursor-pointer ${
                                      idx === searchActiveIdx
                                        ? 'bg-[var(--ks-surface-muted)]'
                                        : 'hover:bg-[var(--ks-bg)]'
                                    }`}
                                  >
                                    <ResilientImage
                                      src={item.images[0]}
                                      alt={item.name}
                                      className="w-12 h-9 object-cover rounded-[var(--ks-radius-sm)] shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-medium truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[11px] text-[var(--ks-text-secondary)] truncate">
                                        {item.brand ? `${item.brand} · ${item.categoryLabel}` : item.categoryLabel}
                                      </p>
                                    </div>
                                    <span className="text-xs font-mono-num font-semibold shrink-0">
                                      {formatCurrency(item.price, currency)}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {recentSearches.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                                Recent Searches
                              </p>
                              <button
                                type="button"
                                onClick={clearRecentSearches}
                                className="text-[11px] text-[var(--ks-text-muted)] hover:text-[var(--ks-text-primary)] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Clear</span>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {recentSearches.map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => submitHeaderSearch(q)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--ks-radius-sm)] border border-[var(--ks-border)] text-xs hover:border-[var(--ks-action)] cursor-pointer"
                                >
                                  <Clock className="w-3 h-3 text-[var(--ks-text-muted)]" />
                                  <span>{q}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)] mb-2">
                            Popular Searches
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Wireless Headphones',
                              'Brushless Drill',
                              'Botanical Serum',
                              'Montessori Toys',
                              'Merino Overshirt',
                            ].map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => submitHeaderSearch(q)}
                                className="px-2.5 py-1 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface-muted)] text-xs font-medium hover:bg-[var(--ks-border)] cursor-pointer"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Utility Controls (Balanced for Mobile & Desktop) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search products"
              className="md:hidden w-10 h-10 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <PWAInstallButton variant="header" />

            {/* Language Switcher (Tablet & Desktop) */}
            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={`Switch language (currently ${language === 'en' ? 'English' : 'বাংলা'})`}
              className="hidden sm:inline-flex h-9 px-2.5 rounded-[var(--ks-radius-md)] items-center gap-1 text-xs font-medium border border-[var(--ks-border)] bg-[var(--ks-surface)] hover:border-[var(--ks-accent)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className={language === 'en' ? 'font-semibold text-[var(--ks-text-primary)]' : 'text-[var(--ks-text-muted)]'}>
                EN
              </span>
              <span className="text-[var(--ks-text-muted)]">|</span>
              <span className={language === 'bn' ? 'font-semibold text-[var(--ks-accent)]' : 'text-[var(--ks-text-muted)]'}>
                বাংলা
              </span>
            </button>

            {/* Currency Switcher (Tablet & Desktop) */}
            <div ref={currencyContainerRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCurrencyMenuOpen((p) => !p)}
                aria-label={`Select currency (currently ${currency})`}
                aria-expanded={currencyMenuOpen}
                className="flex h-9 px-2.5 rounded-[var(--ks-radius-md)] items-center gap-1.5 text-xs font-mono-num font-medium border border-[var(--ks-border)] bg-[var(--ks-surface)] hover:border-[var(--ks-accent)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>{currency === 'BDT' ? '৳ BDT' : '$ USD'}</span>
                <ChevronDown className="w-3 h-3 text-[var(--ks-text-muted)]" />
              </button>

              <AnimatePresence>
                {currencyMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={STUDIO_TRANSITION.fast}
                    className="absolute right-0 mt-2 w-56 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] shadow-[var(--ks-shadow-overlay)] p-2 z-50 space-y-1"
                  >
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                      {t(language, 'currencyLabel')}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('BDT');
                        setCurrencyMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs cursor-pointer ${
                        currency === 'BDT'
                          ? 'bg-[var(--ks-surface-muted)] font-semibold'
                          : 'hover:bg-[var(--ks-bg)]'
                      }`}
                    >
                      <span>Bangladesh Taka (BDT)</span>
                      <span className="font-mono-num">৳</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('USD');
                        setCurrencyMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-[var(--ks-surface-muted)] font-semibold'
                          : 'hover:bg-[var(--ks-bg)]'
                      }`}
                    >
                      <span>US Dollar (USD)</span>
                      <span className="font-mono-num">$</span>
                    </button>
                    <div className="px-2 pt-1.5 pb-0.5 border-t border-[var(--ks-border)] text-[10px] text-[var(--ks-text-muted)]">
                      {t(language, 'bangladeshSettlementNote')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle (Tablet & Desktop) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="hidden sm:flex w-9 h-9 rounded-[var(--ks-radius-md)] items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-[17px] h-[17px]" />
              ) : (
                <Moon className="w-[17px] h-[17px]" />
              )}
            </button>

            {/* Notifications (Desktop & Tablet when signed in or alerts exist) */}
            <div ref={notifContainerRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setNotifOpen((p) => !p)}
                aria-label={`Notifications (${unreadNotificationCount} unread)`}
                aria-expanded={notifOpen}
                className="relative w-9 h-9 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
              >
                <Bell className="w-[17px] h-[17px]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[var(--ks-accent)] text-[var(--ks-accent-text)] text-[9px] font-mono-num font-semibold flex items-center justify-center">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={STUDIO_TRANSITION.fast}
                    className="absolute right-0 mt-2 w-80 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] shadow-[var(--ks-shadow-overlay)] overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[var(--ks-border)] flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-medium text-[var(--ks-text-muted)]">
                        Notifications
                      </span>
                      <span className="text-[11px] font-mono-num text-[var(--ks-accent)]">
                        {unreadNotificationCount} unread
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[var(--ks-divider)]">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-xs text-[var(--ks-text-secondary)]">
                          You have no notifications right now.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                              if (n.orderId) {
                                go({ name: 'track-order', orderId: n.orderId });
                              } else if (n.targetTab) {
                                go({ name: 'account', accountTab: n.targetTab });
                              }
                            }}
                            className={`w-full p-3.5 text-left hover:bg-[var(--ks-bg)] transition-colors cursor-pointer space-y-1 ${
                              !n.read ? 'bg-[var(--ks-bg)]/70' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">{n.title}</span>
                              <span className="text-[10px] font-mono-num text-[var(--ks-text-muted)] shrink-0">
                                {n.createdAt}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--ks-text-secondary)] leading-snug">
                              {n.message}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sign In / Account Dropdown */}
            {!profile.isAuthenticated ? (
              <button
                type="button"
                onClick={() => go({ name: 'login' })}
                aria-label="Sign in"
                className="h-9 px-2.5 sm:px-3.5 rounded-[var(--ks-radius-md)] flex items-center gap-1.5 text-xs font-medium border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] hover:border-[var(--ks-accent)] hover:text-[var(--ks-accent)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden min-[380px]:inline">{t(language, 'signIn')}</span>
              </button>
            ) : (
              <div ref={accountContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((p) => !p);
                    setNotifOpen(false);
                  }}
                  aria-label="Open account menu"
                  aria-expanded={accountMenuOpen}
                  className="h-9 px-2 sm:px-3 rounded-[var(--ks-radius-md)] flex items-center gap-1.5 text-xs font-medium border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] hover:border-[var(--ks-accent)] transition-colors cursor-pointer shrink-0"
                >
                  {profile.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                  ) : profile.role === 'seller' ? (
                    <Store className="w-4 h-4 text-[var(--ks-accent)] shrink-0" />
                  ) : (
                    <User className="w-4 h-4 shrink-0" />
                  )}
                  <span className="hidden min-[380px]:inline max-w-[60px] sm:max-w-[110px] truncate">
                    {profile.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[var(--ks-text-muted)] transition-transform duration-150 ${
                      accountMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {accountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={STUDIO_TRANSITION.fast}
                      className="absolute right-0 mt-2 w-72 sm:w-80 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] shadow-[var(--ks-shadow-overlay)] overflow-hidden z-50"
                    >
                      <div className="p-4 bg-[var(--ks-bg)] border-b border-[var(--ks-border)] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">{profile.fullName}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-[var(--ks-radius-sm)] bg-[var(--ks-surface)] border border-[var(--ks-border)] text-[var(--ks-accent)] shrink-0">
                            {profile.role}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ks-text-secondary)] truncate">
                          {profile.studioName ? `${profile.studioName} · ` : ''}
                          {profile.email}
                        </p>
                      </div>

                      <div className="p-2 space-y-0.5">
                        <p className="px-2.5 pt-1 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--ks-text-muted)]">
                          Account
                        </p>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'overview' })}
                          className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-medium hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                            Account Overview
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'orders' })}
                          className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-medium hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Package className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                            Orders &amp; Returns
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'wishlist' })}
                          className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-medium hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Heart className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                            Wishlist ({wishlistIds.length})
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'addresses' })}
                          className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-medium hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <MapPin className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                            Saved Addresses
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--ks-text-muted)]" />
                        </button>

                        {(profile.role === 'seller' || profile.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'seller' })}
                            className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-semibold text-[var(--ks-accent)] bg-[var(--ks-bg)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <Store className="w-3.5 h-3.5" />
                              {t(language, 'sellerWorkspace')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {profile.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'admin' })}
                            className="w-full px-2.5 py-2 rounded-[var(--ks-radius-md)] flex items-center justify-between text-xs font-semibold text-[var(--ks-accent)] bg-[var(--ks-bg)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {t(language, 'adminWorkspace')}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="p-2 border-t border-[var(--ks-border)] bg-[var(--ks-bg)]">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            logoutDemo();
                            if (
                              route.name === 'account' ||
                              route.name === 'seller' ||
                              route.name === 'admin'
                            ) {
                              navigate({ name: 'login' });
                            }
                          }}
                          className="w-full py-2 px-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-surface)] hover:text-[var(--ks-error)] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t(language, 'signOut')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Wishlist (Tablet & Desktop) */}
            <button
              type="button"
              onClick={() => go({ name: 'wishlist' })}
              aria-label={`Wishlist (${wishlistIds.length} saved)`}
              className="hidden sm:flex relative w-9 h-9 rounded-[var(--ks-radius-md)] items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer"
            >
              <Heart className="w-[17px] h-[17px]" />
              {wishlistIds.length > 0 && (
                <motion.span
                  key={wishlistIds.length}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={STUDIO_TRANSITION.fast}
                  className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[var(--ks-accent)] text-[var(--ks-accent-text)] text-[9px] font-mono-num font-medium flex items-center justify-center"
                >
                  {wishlistIds.length}
                </motion.span>
              )}
            </button>

            {/* Shopping Bag / Cart Trigger (Mobile, Tablet & Desktop) */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`Open shopping bag (${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'})`}
              className="relative w-10 h-10 sm:w-9 sm:h-9 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)] transition-colors cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {cartItemCount > 0 && (
                <motion.span
                  key={cartItemCount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={STUDIO_TRANSITION.fast}
                  className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--ks-action)] text-[var(--ks-action-text)] text-[9px] font-mono-num font-semibold flex items-center justify-center"
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Tier 3: Desktop & Tablet Department Navigation Strip */}
        <div className="hidden md:block border-t border-[var(--ks-border)]/75 bg-[var(--ks-surface)]/85">
          <div className="max-w-[var(--ks-container-max)] mx-auto px-6 lg:px-10 h-10 flex items-center justify-between gap-4">
            <nav
              aria-label="Department navigation"
              className="flex items-center gap-4 lg:gap-5 overflow-x-auto no-scrollbar text-xs font-medium text-[var(--ks-text-secondary)]"
            >
              <button
                type="button"
                onMouseEnter={() => openMegaMenu(categories[0]?.slug)}
                onClick={() => setMegaMenuOpen((prev) => !prev)}
                aria-expanded={megaMenuOpen}
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1.5 border-b-2 border-transparent leading-none transition-colors cursor-pointer ${
                  megaMenuOpen
                    ? 'text-[var(--ks-accent)]'
                    : 'text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)]'
                }`}
              >
                <span>{t(language, 'allDepartments')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    megaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <span className="h-3.5 w-px bg-[var(--ks-border)] shrink-0" aria-hidden="true" />

              {categories.slice(0, 5).map((cat) => {
                const isActive =
                  (route.name === 'category' || route.name === 'shop') &&
                  route.category === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onMouseEnter={() => openMegaMenu(cat.slug)}
                    onClick={() => go({ name: 'category', category: cat.slug })}
                    className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 leading-none transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[var(--ks-text-primary)] text-[var(--ks-text-primary)]'
                        : 'border-transparent hover:text-[var(--ks-text-primary)]'
                    }`}
                  >
                    {cat.shortName}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => go({ name: 'shop', collection: 'new-arrivals', category: 'all' })}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 leading-none transition-colors cursor-pointer ${
                  route.collection === 'new-arrivals'
                    ? 'border-[var(--ks-text-primary)] text-[var(--ks-text-primary)]'
                    : 'border-transparent hover:text-[var(--ks-text-primary)]'
                }`}
              >
                {t(language, 'newArrivals')}
              </button>

              <button
                type="button"
                onClick={() => go({ name: 'offers' })}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 leading-none transition-colors cursor-pointer ${
                  route.name === 'offers'
                    ? 'border-[var(--ks-accent)] text-[var(--ks-accent)]'
                    : 'border-transparent text-[var(--ks-accent)] hover:opacity-80'
                }`}
              >
                {t(language, 'offers')}
              </button>
            </nav>

            <div className="hidden xl:flex items-center gap-5 text-xs text-[var(--ks-text-secondary)] shrink-0">
              <button
                type="button"
                onClick={() => go({ name: 'brands' })}
                className="whitespace-nowrap shrink-0 hover:text-[var(--ks-text-primary)] transition-colors cursor-pointer"
              >
                {t(language, 'brands')}
              </button>
              <button
                type="button"
                onClick={() => go({ name: 'track-order' })}
                className="whitespace-nowrap shrink-0 hover:text-[var(--ks-text-primary)] transition-colors cursor-pointer"
              >
                {t(language, 'trackOrder')}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Mega Menu (10 Departments + Subcollections + Featured Items) */}
        <AnimatePresence>
          {megaMenuOpen && (
            <motion.div
              key="mega-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={STUDIO_TRANSITION.fast}
              className="hidden md:block absolute left-0 right-0 top-full bg-[var(--ks-surface)] border-b border-[var(--ks-border)] shadow-[var(--ks-shadow-overlay)]"
            >
              <div className="max-w-[var(--ks-container-max)] mx-auto px-6 lg:px-10 py-6 grid grid-cols-12 gap-6 lg:gap-8">
                <div className="col-span-4 border-r border-[var(--ks-border)] pr-5">
                  <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)] mb-3">
                    Departments ({categories.length})
                  </p>
                  <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {categories.map((cat) => {
                      const active = cat.slug === activeHoverCat?.slug;
                      return (
                        <li key={cat.slug}>
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredCatSlug(cat.slug)}
                            onClick={() => go({ name: 'category', category: cat.slug })}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[var(--ks-radius-md)] text-left text-sm cursor-pointer transition-colors ${
                              active
                                ? 'bg-[var(--ks-surface-muted)] text-[var(--ks-text-primary)] font-medium'
                                : 'text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                                active ? 'opacity-100 text-[var(--ks-accent)]' : 'opacity-30'
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="col-span-3 border-r border-[var(--ks-border)] pr-5 space-y-5">
                  {activeHoverCat && (
                    <>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)] mb-2.5">
                          In {activeHoverCat.shortName}
                        </p>
                        <ul className="space-y-2 text-sm text-[var(--ks-text-secondary)]">
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                go({ name: 'category', category: activeHoverCat.slug })
                              }
                              className="text-left leading-snug font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer"
                            >
                              Shop All {activeHoverCat.shortName}
                            </button>
                          </li>
                          {activeHoverCat.subcategories.map((sub) => (
                            <li key={sub.slug} className="space-y-1">
                              <button
                                type="button"
                                onClick={() =>
                                  go({
                                    name: 'category',
                                    category: activeHoverCat.slug,
                                    subcategory: sub.slug,
                                  })
                                }
                                className="text-left leading-snug hover:text-[var(--ks-text-primary)] font-medium transition-colors cursor-pointer"
                              >
                                {sub.name}
                              </button>
                              {sub.children && sub.children.length > 0 && (
                                <ul className="pl-3 space-y-1 border-l border-[var(--ks-border)] text-xs text-[var(--ks-text-muted)]">
                                  {sub.children.map((child) => (
                                    <li key={child.slug}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          go({
                                            name: 'category',
                                            category: activeHoverCat.slug,
                                            subcategory: child.slug,
                                          })
                                        }
                                        className="text-left leading-snug hover:text-[var(--ks-accent)] cursor-pointer"
                                      >
                                        {child.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-[var(--ks-border)]">
                        <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)] mb-2.5">
                          Brands
                        </p>
                        <ul className="space-y-1.5 text-xs text-[var(--ks-text-secondary)]">
                          {activeHoverCat.featuredBrands.map((brand) => (
                            <li key={brand}>
                              <button
                                type="button"
                                onClick={() =>
                                  go({
                                    name: 'category',
                                    category: activeHoverCat.slug,
                                    brand,
                                  })
                                }
                                className="text-left leading-snug hover:text-[var(--ks-accent)] transition-colors cursor-pointer"
                              >
                                {brand}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>

                <div className="col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                      Featured in {activeHoverCat?.shortName}
                    </p>
                    <button
                      type="button"
                      onClick={() => go({ name: 'shop', category: 'all' })}
                      className="text-xs font-medium text-[var(--ks-accent)] hover:underline cursor-pointer"
                    >
                      Shop All Products →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {featuredProducts.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go({ name: 'product', slug: item.slug })}
                        className={`group text-left rounded-[var(--ks-radius-md)] overflow-hidden border border-[var(--ks-border)] bg-[var(--ks-bg)] cursor-pointer ${
                          idx === 1 ? 'hidden lg:block' : ''
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <ResilientImage
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3 space-y-0.5">
                          <p className="text-[11px] tracking-wide text-[var(--ks-text-muted)] truncate">
                            {item.brand}
                          </p>
                          <p className="text-sm font-medium text-[var(--ks-text-primary)] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs font-mono-num font-semibold text-[var(--ks-accent)]">
                            {formatCurrency(item.price, currency)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Navigation Drawer (< 768px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={STUDIO_TRANSITION.fast}
            className="fixed inset-0 z-50 md:hidden bg-black/55 backdrop-blur-[1px] flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              ref={mobileNavPanelRef}
              tabIndex={-1}
              key="mobile-nav-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={STUDIO_TRANSITION.drawer}
              className="w-[86vw] max-w-sm h-full bg-[var(--ks-surface)] text-[var(--ks-text-primary)] flex flex-col border-r border-[var(--ks-border)] focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--ks-border)]">
                <span className="font-display text-lg font-semibold tracking-[0.06em]">
                  KINTO STUDIO
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-10 h-10 -mr-2 rounded-[var(--ks-radius-md)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => go({ name: 'home' })}
                    className="w-full py-2.5 text-left text-base font-medium cursor-pointer"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'shop', category: 'all' })}
                    className="w-full py-2.5 text-left text-base font-medium cursor-pointer"
                  >
                    Shop All Products
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      go({ name: 'shop', collection: 'new-arrivals', category: 'all' })
                    }
                    className="w-full py-2.5 text-left text-base font-medium cursor-pointer"
                  >
                    New Arrivals
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      go({ name: 'shop', collection: 'best-sellers', category: 'all' })
                    }
                    className="w-full py-2.5 text-left text-base font-medium cursor-pointer"
                  >
                    Best Sellers
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'offers' })}
                    className="w-full py-2.5 text-left text-base font-medium text-[var(--ks-accent)] cursor-pointer"
                  >
                    Special Offers
                  </button>
                </div>

                <div className="border-t border-[var(--ks-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesExpanded((p) => !p)}
                    className="w-full flex items-center justify-between py-2 text-xs uppercase tracking-wider text-[var(--ks-text-muted)] cursor-pointer"
                  >
                    <span>Departments ({categories.length})</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-150 ${
                        mobileCategoriesExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileCategoriesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={STUDIO_TRANSITION.fast}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1.5 pl-1">
                          {categories.map((cat) => {
                            const isOpen = expandedMobileDept === cat.slug;
                            return (
                              <div key={cat.slug} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => go({ name: 'category', category: cat.slug })}
                                    className="flex-1 py-2 text-left text-sm font-medium text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] cursor-pointer truncate"
                                  >
                                    {cat.name}
                                  </button>
                                  {cat.subcategories.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedMobileDept((prev) =>
                                          prev === cat.slug ? null : cat.slug
                                        )
                                      }
                                      aria-label={`Toggle ${cat.name} subcategories`}
                                      className="w-9 h-9 rounded-[var(--ks-radius-md)] flex items-center justify-center text-[var(--ks-text-muted)] hover:bg-[var(--ks-surface-muted)] cursor-pointer"
                                    >
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                          isOpen ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                  )}
                                </div>
                                {isOpen && cat.subcategories.length > 0 && (
                                  <div className="pl-3 space-y-1 border-l border-[var(--ks-border)]">
                                    {cat.subcategories.map((sub) => (
                                      <button
                                        key={sub.slug}
                                        type="button"
                                        onClick={() =>
                                          go({
                                            name: 'category',
                                            category: cat.slug,
                                            subcategory: sub.slug,
                                          })
                                        }
                                        className="w-full py-1.5 text-left leading-snug text-xs text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                                      >
                                        {sub.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-[var(--ks-border)] pt-4 space-y-2.5">
                  {!profile.isAuthenticated ? (
                    <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-2.5">
                      <p className="text-xs font-medium text-[var(--ks-text-primary)]">
                        Sign in to view orders and saved addresses.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => go({ name: 'login' })}
                          className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-[var(--ks-radius-md)] bg-[var(--ks-action)] text-[var(--ks-action-text)] text-xs font-medium cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => go({ name: 'login', accountTab: 'register' })}
                          className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] bg-[var(--ks-surface)] text-xs font-medium cursor-pointer"
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate">{profile.fullName}</p>
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--ks-radius-sm)] border border-[var(--ks-border)] bg-[var(--ks-surface)] text-[var(--ks-accent)] shrink-0">
                            {profile.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ks-text-secondary)] truncate">
                          {profile.email}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[var(--ks-border)]">
                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'overview' })}
                          className="w-full py-1.5 flex items-center justify-between gap-2 text-left text-xs font-medium cursor-pointer"
                        >
                          <span className="truncate">{t(language, 'myAccount')}</span>
                          <User className="w-3.5 h-3.5 text-[var(--ks-text-muted)] shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'orders' })}
                          className="w-full py-1.5 flex items-center justify-between gap-2 text-left text-xs font-medium cursor-pointer"
                        >
                          <span className="truncate">{t(language, 'orders')}</span>
                          <Package className="w-3.5 h-3.5 text-[var(--ks-text-muted)] shrink-0" />
                        </button>
                        {(profile.role === 'seller' || profile.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'seller' })}
                            className="w-full py-1.5 flex items-center justify-between gap-2 text-left text-xs font-semibold text-[var(--ks-accent)] cursor-pointer"
                          >
                            <span className="truncate">{t(language, 'sellerWorkspace')}</span>
                            <Store className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                        {profile.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'admin' })}
                            className="w-full py-1.5 flex items-center justify-between gap-2 text-left text-xs font-semibold text-[var(--ks-accent)] cursor-pointer"
                          >
                            <span className="truncate">{t(language, 'adminWorkspace')}</span>
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logoutDemo();
                            navigate({ name: 'login' });
                          }}
                          className="w-full py-1.5 flex items-center justify-between gap-2 text-left text-xs text-[var(--ks-error)] cursor-pointer"
                        >
                          <span className="truncate">{t(language, 'signOut')}</span>
                          <LogOut className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setCartDrawerOpen(true);
                    }}
                    className="w-full py-2.5 flex items-center justify-between gap-2 text-left text-sm font-medium cursor-pointer"
                  >
                    <span className="truncate">{t(language, 'shoppingBag')} ({cartItemCount})</span>
                    <ShoppingBag className="w-4 h-4 text-[var(--ks-text-muted)] shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'wishlist' })}
                    className="w-full py-2.5 flex items-center justify-between gap-2 text-left text-sm font-medium cursor-pointer"
                  >
                    <span className="truncate">{t(language, 'wishlist')} ({wishlistIds.length})</span>
                    <Heart className="w-4 h-4 text-[var(--ks-text-muted)] shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'track-order' })}
                    className="w-full py-2 text-left text-sm text-[var(--ks-text-secondary)] cursor-pointer"
                  >
                    {t(language, 'trackOrder')}
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'brands' })}
                    className="w-full py-2 text-left text-sm text-[var(--ks-text-secondary)] cursor-pointer"
                  >
                    Featured {t(language, 'brands')}
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'faq' })}
                    className="w-full py-2 text-left text-sm text-[var(--ks-text-secondary)] cursor-pointer"
                  >
                    Help &amp; {t(language, 'faq')}
                  </button>
                  <div className="pt-2">
                    <PWAInstallButton variant="drawer" onAction={() => setMobileMenuOpen(false)} />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--ks-border)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-medium whitespace-nowrap cursor-pointer"
                >
                  <span className={language === 'en' ? 'font-semibold' : 'text-[var(--ks-text-muted)]'}>EN</span>
                  <span className="text-[var(--ks-text-muted)]">|</span>
                  <span className={language === 'bn' ? 'font-semibold text-[var(--ks-accent)]' : 'text-[var(--ks-text-muted)]'}>বাংলা</span>
                </button>
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-mono-num font-medium whitespace-nowrap cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{currency === 'USD' ? '$ USD' : '৳ BDT'}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-medium whitespace-nowrap cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5" /> Light
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" /> Dark
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
