import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Clock, Layers, Search, Store, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BRAND_STUDIOS } from '../../data/catalog';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, fuzzyScoreText } from '../../utils/format';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { ResilientImage, useFocusTrap } from '../ui/Primitives';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'iPhone',
  'MacBook',
  'Perfume',
  'Watch',
  'Shoes',
  'Sofa',
];

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const {
    categories,
    products,
    currency,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    navigate,
  } = useStore();
  const [term, setTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, panelRef);

  useEffect(() => {
    setActiveIndex(-1);
  }, [term, open]);

  useEffect(() => {
    if (!open) {
      setTerm('');
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const matchingCategories = useMemo(() => {
    const q = term.trim();
    if (!q) return [];
    return categories
      .map((c) => {
        const subNames = c.subcategories.map((s) => s.name).join(' ');
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
  }, [categories, term]);

  const matchingBrands = useMemo(() => {
    const q = term.trim();
    if (!q) return [];
    return BRAND_STUDIOS.map((b) => ({
      brand: b,
      score: Math.max(fuzzyScoreText(q, b.name), fuzzyScoreText(q, b.specialty)),
    }))
      .filter((entry) => entry.score >= 18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((e) => e.brand);
  }, [term]);

  const suggestions = useMemo(() => {
    const q = term.trim();
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
  }, [products, term]);

  const submitSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    addRecentSearch(clean);
    onClose();
    navigate({ name: 'search', query: clean });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      const chosen = suggestions[activeIndex];
      addRecentSearch(term || chosen.name);
      onClose();
      navigate({ name: 'product', slug: chosen.slug });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={STUDIO_TRANSITION.fast}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-start justify-center pt-10 sm:pt-16 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search Kinto Studio"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            key="search-panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={STUDIO_TRANSITION.base}
            className="w-full max-w-2xl rounded-lg bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] border border-[#E5E3DD] dark:border-[#2C2C28] shadow-2xl overflow-hidden focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(term);
              }}
              className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-[#E5E3DD] dark:border-[#2C2C28]"
            >
              <Search className="w-4 h-4 text-[#84827B] shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search products, brands, or categories (typo-tolerant)..."
                aria-label="Search catalog"
                className="flex-1 bg-transparent text-sm text-[#171716] dark:text-[#F4F3EF] placeholder:text-[#84827B] focus:outline-none"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  aria-label="Clear search query"
                  className="text-xs text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] px-2 py-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="w-10 h-10 -mr-1 rounded-md flex items-center justify-center text-[#5C5B57] dark:text-[#A3A19B] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            <div className="p-5 max-h-[72vh] overflow-y-auto space-y-6">
              {term.trim() ? (
                <div className="space-y-5">
                  {/* Category & Brand Matches */}
                  {(matchingCategories.length > 0 || matchingBrands.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {matchingCategories.map((cat) => (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate({ name: 'category', category: cat.slug });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] text-xs font-medium hover:border-[#171716] border border-transparent dark:hover:border-[#F4F3EF] cursor-pointer transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
                          <span>Department: {cat.name}</span>
                        </button>
                      ))}
                      {matchingBrands.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate({
                              name: 'shop',
                              category: b.categories[0] || 'all',
                              brand: b.name,
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs font-medium hover:border-[#171716] dark:hover:border-[#F4F3EF] cursor-pointer transition-colors"
                        >
                          <Store className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
                          <span>Brand: {b.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Fuzzy-matched Products */}
                  <div>
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <p className="text-xs font-medium text-[#84827B] min-w-0">
                        Matching Products ({suggestions.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => submitSearch(term)}
                        className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] inline-flex items-center gap-1 hover:underline cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <span>View all results</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] py-4">
                        No direct matches for &ldquo;{term}&rdquo;. Try browsing a department or press Enter for full search options.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                        {suggestions.map((item, idx) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                addRecentSearch(term);
                                onClose();
                                navigate({ name: 'product', slug: item.slug });
                              }}
                              className={`w-full py-3 flex items-center gap-4 text-left px-2.5 -mx-2.5 rounded-md transition-colors cursor-pointer ${
                                idx === activeIndex
                                  ? 'bg-[#F2F0EC] dark:bg-[#22221F]'
                                  : 'hover:bg-[#F9F8F6] dark:hover:bg-[#22221F]'
                              }`}
                            >
                              <ResilientImage
                                src={item.images[0]}
                                alt={item.name}
                                className="w-14 h-11 object-cover rounded-sm shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] truncate">
                                  {item.brand} · {item.categoryLabel}
                                </p>
                              </div>
                              <span className="text-sm font-mono-num font-medium shrink-0">
                                {formatCurrency(item.price, currency)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <p className="text-xs font-medium text-[#84827B]">Recent Searches</p>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs text-[#84827B] hover:text-[#171716] dark:hover:text-[#F4F3EF] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => submitSearch(q)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs hover:border-[#171716] dark:hover:border-[#F4F3EF] cursor-pointer transition-colors"
                          >
                            <Clock className="w-3 h-3 text-[#84827B]" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-[#84827B] mb-2.5">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => submitSearch(q)}
                          className="px-3 py-1.5 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] text-xs font-medium hover:bg-[#E5E3DD] dark:hover:bg-[#2E2E2A] cursor-pointer transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#84827B] mb-2.5">
                      Browse All Departments ({categories.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.slug}
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate({ name: 'category', category: cat.slug });
                          }}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#171716] dark:hover:border-[#F4F3EF] text-left cursor-pointer transition-colors"
                        >
                          <span className="text-sm font-medium min-w-0 truncate">{cat.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#84827B] shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
