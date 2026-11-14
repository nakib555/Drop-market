import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Globe,
  Heart,
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
  User,
  UserCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/format';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { ScrollProgressHairline } from '../ui/MotionPrimitives';
import { ResilientImage } from '../ui/Primitives';

interface HeaderProps {
  onOpenSearch: () => void;
}

const ANNOUNCEMENTS = [
  'Complimentary shipping on orders over $500 · Use code STUDIO15 for 15% off',
  '8 Curated Departments: Tech, Fashion, Home, Beauty, Grocery, Outdoor, Office & Gifts',
  'Nationwide & US Shipping · Instant BDT (৳) & USD ($) pricing toggle available',
];

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const {
    route,
    navigate,
    categories,
    products,
    currency,
    toggleCurrency,
    cartItemCount,
    wishlistIds,
    compareIds,
    setCartDrawerOpen,
    profile,
    logoutDemo,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
  } = useStore();
  const { theme, toggleTheme } = useTheme();

  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCatSlug, setHoveredCatSlug] = useState<string>(
    categories[0]?.slug || 'electronics-tech'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesExpanded, setMobileCategoriesExpanded] = useState(true);
  const closeTimeoutRef = useRef<number | null>(null);
  const notifContainerRef = useRef<HTMLDivElement | null>(null);
  const accountContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!notifOpen && !accountMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        notifOpen &&
        notifContainerRef.current &&
        !notifContainerRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
      if (
        accountMenuOpen &&
        accountContainerRef.current &&
        !accountContainerRef.current.contains(e.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen, accountMenuOpen]);

  useEffect(() => {
    if (!announcementVisible) return;
    const timer = window.setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [announcementVisible]);

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
    navigate(next);
  };

  return (
    <>
      {/* Level 1: Rotating Announcement Bar */}
      <AnimatePresence initial={false}>
        {announcementVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={STUDIO_TRANSITION.fast}
            className="overflow-hidden bg-[#171716] dark:bg-[#191917] text-[#FAF9F6] text-[11px] sm:text-xs border-b border-white/10"
          >
            <div className="py-1.5 sm:py-2 px-3 sm:px-6 max-w-[1440px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
              <span className="hidden lg:inline text-[#A3A19B] whitespace-nowrap">
                Worldwide · US &amp; Bangladesh Hubs
              </span>

              <div className="flex-1 min-w-0 text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={announcementIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={STUDIO_TRANSITION.instant}
                    className="truncate"
                  >
                    {announcementIdx === 0 ? (
                      <>
                        Complimentary shipping $500+ · Code{' '}
                        <span className="font-mono-num font-medium text-[#E2B887]">STUDIO15</span>{' '}
                        for 15% off
                      </>
                    ) : (
                      ANNOUNCEMENTS[announcementIdx]
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleCurrency}
                  aria-label="Toggle display currency"
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono-num cursor-pointer transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>{currency}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementVisible(false)}
                  aria-label="Dismiss announcement"
                  className="text-[#A3A19B] hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-shadow duration-200 ${
          scrolled
            ? 'bg-[#F9F8F6]/98 dark:bg-[#111110]/98 border-[#DCD9D0] dark:border-[#343430] shadow-sm'
            : 'bg-[#F9F8F6]/95 dark:bg-[#111110]/95 border-[#E5E3DD] dark:border-[#2C2C28]'
        }`}
        onMouseLeave={scheduleCloseMegaMenu}
        onMouseEnter={() => {
          if (closeTimeoutRef.current) {
            window.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
        }}
      >
        {/* Level 2: Main Header — Logo, Prominent Search Bar, Utilities */}
        <div
          className={`max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-10 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 transition-[height] duration-200 ${
            scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'
          }`}
        >
          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="w-10 h-10 -ml-1.5 rounded-md flex items-center justify-center text-[#171716] dark:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Wordmark */}
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              go({ name: 'home' });
            }}
            className="font-display text-base sm:text-xl lg:text-2xl font-semibold tracking-[0.04em] sm:tracking-[0.08em] text-[#171716] dark:text-[#F4F3EF] whitespace-nowrap shrink-0"
          >
            KINTO STUDIO
          </a>

          {/* Prominent Marketplace Search Trigger (Tablet & Desktop) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden md:flex flex-1 max-w-xl h-9 lg:h-10 px-3.5 rounded-md bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#8F6438] dark:hover:border-[#C89B67] items-center justify-between gap-3 text-left text-xs lg:text-sm text-[#84827B] transition-colors cursor-pointer"
          >
            <span className="inline-flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 shrink-0 text-[#5C5B57] dark:text-[#A3A19B]" />
              <span className="truncate">
                Search electronics, fashion, furniture, skincare, grocery, outdoor...
              </span>
            </span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono-num rounded border border-[#E5E3DD] dark:border-[#2C2C28] text-[#84827B]">
              /
            </kbd>
          </button>

          {/* Utility Controls */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search catalog"
              className="md:hidden w-10 h-10 rounded-md flex items-center justify-center text-[#171716] dark:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              onClick={toggleCurrency}
              aria-label={`Switch currency (currently ${currency})`}
              className="hidden sm:flex h-9 px-2.5 rounded-md items-center gap-1 text-xs font-mono-num font-medium border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] hover:border-[#171716] dark:hover:border-[#F4F3EF] transition-colors cursor-pointer"
            >
              <span>{currency === 'USD' ? '$ USD' : '৳ BDT'}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="hidden sm:flex w-9 h-9 rounded-md items-center justify-center text-[#171716] dark:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-[17px] h-[17px]" />
              ) : (
                <Moon className="w-[17px] h-[17px]" />
              )}
            </button>

            {/* Notification Bell Center */}
            <div ref={notifContainerRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setNotifOpen((p) => !p)}
                aria-label={`Notifications (${unreadNotificationCount} unread)`}
                aria-expanded={notifOpen}
                className="relative w-9 h-9 rounded-md flex items-center justify-center text-[#171716] dark:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
              >
                <Bell className="w-[17px] h-[17px]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#8F6438] dark:bg-[#C89B67] text-white dark:text-[#171716] text-[9px] font-mono-num font-semibold flex items-center justify-center">
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
                    className="absolute right-0 mt-2 w-80 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-medium text-[#84827B]">
                        Marketplace Alerts
                      </span>
                      <span className="text-[11px] font-mono-num text-[#8F6438] dark:text-[#C89B67] capitalize">
                        {profile.role} View
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-xs text-[#5C5B57] dark:text-[#A3A19B]">
                          All caught up — no pending alerts.
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
                            className={`w-full p-3.5 text-left hover:bg-[#F9F8F6] dark:hover:bg-[#22221F] transition-colors cursor-pointer space-y-1 ${
                              !n.read ? 'bg-[#F9F8F6]/70 dark:bg-[#20201D]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold truncate">{n.title}</span>
                              <span className="text-[10px] font-mono-num text-[#84827B] shrink-0">
                                {n.createdAt}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] leading-snug">
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

            {/* Sign In Button (Guest) OR Account Menu Dropdown (Signed In) — Visible Across Mobile, Tablet & Desktop */}
            {!profile.isAuthenticated ? (
              <button
                type="button"
                onClick={() => go({ name: 'login' })}
                aria-label="Sign in to account"
                className="h-9 px-2.5 sm:px-3.5 rounded-md flex items-center gap-1.5 text-xs font-medium border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] hover:border-[#8F6438] dark:hover:border-[#C89B67] hover:text-[#8F6438] dark:hover:text-[#C89B67] transition-colors cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </button>
            ) : (
              <div ref={accountContainerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen((p) => !p);
                    setNotifOpen(false);
                  }}
                  aria-label="Open account & workspace menu"
                  aria-expanded={accountMenuOpen}
                  className="h-9 px-2 sm:px-3 rounded-md flex items-center gap-1.5 text-xs font-medium border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] hover:border-[#8F6438] dark:hover:border-[#C89B67] transition-colors cursor-pointer shrink-0"
                >
                  {profile.role === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
                  ) : profile.role === 'seller' ? (
                    <Store className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67] shrink-0" />
                  ) : (
                    <User className="w-4 h-4 shrink-0" />
                  )}
                  <span className="max-w-[58px] sm:max-w-[110px] truncate">
                    {profile.fullName.split(' ')[0]}
                  </span>
                  {profile.role !== 'customer' && (
                    <span className="hidden lg:inline uppercase tracking-wider text-[10px] text-[#8F6438] dark:text-[#C89B67] font-semibold">
                      {profile.role}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#84827B] transition-transform duration-150 ${
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
                      className="absolute right-0 mt-2 w-72 sm:w-80 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] shadow-xl overflow-hidden z-50"
                    >
                      {/* Active User Summary */}
                      <div className="p-4 bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold truncate">{profile.fullName}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] text-[#8F6438] dark:text-[#C89B67] shrink-0">
                            {profile.role}
                          </span>
                        </div>
                        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] truncate">
                          {profile.studioName ? `${profile.studioName} · ` : ''}
                          {profile.email}
                        </p>
                      </div>

                      {/* Role Workspace Links */}
                      <div className="p-2 space-y-0.5">
                        <p className="px-2.5 pt-1 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-[#84827B]">
                          Your Workspace Pages
                        </p>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'overview' })}
                          className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-medium hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5 text-[#84827B]" />
                            Account Overview
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'orders' })}
                          className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-medium hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Package className="w-3.5 h-3.5 text-[#84827B]" />
                            Order History &amp; Returns
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'wishlist' })}
                          className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-medium hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <Heart className="w-3.5 h-3.5 text-[#84827B]" />
                            Saved Wishlist ({wishlistIds.length})
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'addresses' })}
                          className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-medium hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <MapPin className="w-3.5 h-3.5 text-[#84827B]" />
                            Addresses &amp; Payments
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>

                        {(profile.role === 'seller' || profile.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'seller' })}
                            className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-semibold text-[#8F6438] dark:text-[#C89B67] bg-[#F9F8F6] dark:bg-[#141413] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <Store className="w-3.5 h-3.5" />
                              Seller Studio Portal
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {profile.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'admin' })}
                            className="w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs font-semibold text-[#8F6438] dark:text-[#C89B67] bg-[#F9F8F6] dark:bg-[#141413] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Admin Operations Console
                            </span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Switch Role / Sign Out */}
                      <div className="p-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex items-center gap-2 bg-[#F9F8F6] dark:bg-[#141413]">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            go({ name: 'login' });
                          }}
                          className="flex-1 py-2 px-2.5 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] hover:border-[#8F6438] dark:hover:border-[#C89B67] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
                          <span>Switch Role</span>
                        </button>
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
                          className="py-2 px-3 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] hover:text-[#B91C1C] dark:hover:text-[#F87171] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              type="button"
              onClick={() => go({ name: 'wishlist' })}
              aria-label={`Wishlist (${wishlistIds.length} saved)`}
              className="hidden sm:flex relative w-9 h-9 rounded-md items-center justify-center text-[#171716] dark:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] transition-colors cursor-pointer"
            >
              <Heart className="w-[17px] h-[17px]" />
              {wishlistIds.length > 0 && (
                <motion.span
                  key={wishlistIds.length}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={STUDIO_TRANSITION.fast}
                  className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-[#8F6438] dark:bg-[#C89B67] text-white dark:text-[#171716] text-[9px] font-mono-num font-medium flex items-center justify-center"
                >
                  {wishlistIds.length}
                </motion.span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`Shopping bag (${cartItemCount} items)`}
              className="relative h-9 px-2.5 sm:px-3 rounded-md flex items-center gap-1.5 bg-[#171716] dark:bg-[#F4F3EF] text-white dark:text-[#171716] hover:bg-[#2E2D2A] dark:hover:bg-[#E2E0D8] transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <motion.span
                key={cartItemCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={STUDIO_TRANSITION.fast}
                className="text-xs font-mono-num font-medium"
              >
                {cartItemCount}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Level 3: Desktop & Tablet Category Navigation Strip */}
        <div className="hidden md:block border-t border-[#E5E3DD]/70 dark:border-[#2C2C28]/70 bg-[#FFFFFF]/85 dark:bg-[#141413]/85">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-10 flex items-center justify-between gap-4">
            <nav
              aria-label="Category navigation"
              className="flex items-center gap-4 lg:gap-5 overflow-x-auto no-scrollbar text-xs font-medium text-[#5C5B57] dark:text-[#B4B2AC]"
            >
              <button
                type="button"
                onMouseEnter={() => openMegaMenu(categories[0]?.slug)}
                onClick={() => setMegaMenuOpen((prev) => !prev)}
                aria-expanded={megaMenuOpen}
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1.5 transition-colors cursor-pointer ${
                  megaMenuOpen
                    ? 'text-[#8F6438] dark:text-[#C89B67]'
                    : 'text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67]'
                }`}
              >
                <span>All Categories</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    megaMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <span className="h-3.5 w-px bg-[#E5E3DD] dark:bg-[#2C2C28] shrink-0" aria-hidden="true" />

              {categories.slice(0, 6).map((cat) => {
                const isActive =
                  (route.name === 'category' || route.name === 'shop') &&
                  route.category === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onMouseEnter={() => openMegaMenu(cat.slug)}
                    onClick={() => go({ name: 'category', category: cat.slug })}
                    className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#171716] dark:border-[#F4F3EF] text-[#171716] dark:text-[#F4F3EF]'
                        : 'border-transparent hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                    }`}
                  >
                    {cat.shortName}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => go({ name: 'shop', collection: 'new-arrivals', category: 'all' })}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                  route.collection === 'new-arrivals'
                    ? 'border-[#171716] dark:border-[#F4F3EF] text-[#171716] dark:text-[#F4F3EF]'
                    : 'border-transparent hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                }`}
              >
                New Arrivals
              </button>

              <button
                type="button"
                onClick={() => go({ name: 'offers' })}
                className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                  route.name === 'offers'
                    ? 'border-[#8F6438] text-[#8F6438] dark:border-[#C89B67] dark:text-[#C89B67]'
                    : 'border-transparent text-[#8F6438] dark:text-[#C89B67] hover:opacity-80'
                }`}
              >
                Offers
              </button>
            </nav>

            <div className="hidden xl:flex items-center gap-4 text-xs text-[#5C5B57] dark:text-[#A3A19B] shrink-0">
              {!profile.isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => go({ name: 'login' })}
                    className="font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'login', accountTab: 'register' })}
                    className="hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    go({
                      name:
                        profile.role === 'admin'
                          ? 'admin'
                          : profile.role === 'seller'
                          ? 'seller'
                          : 'account',
                      accountTab: 'overview',
                    })
                  }
                  className="font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                >
                  {profile.role === 'admin'
                    ? 'Admin Console'
                    : profile.role === 'seller'
                    ? 'Seller Studio'
                    : 'My Account'}
                </button>
              )}
              <button
                type="button"
                onClick={() => go({ name: 'brands' })}
                className="hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
              >
                Partner Brands
              </button>
              <button
                type="button"
                onClick={() => go({ name: 'track-order' })}
                className="hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Mega Menu */}
        <AnimatePresence>
          {megaMenuOpen && (
            <motion.div
              key="mega-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={STUDIO_TRANSITION.fast}
              className="hidden md:block absolute left-0 right-0 top-full bg-[#FFFFFF] dark:bg-[#191917] border-b border-[#E5E3DD] dark:border-[#2C2C28] shadow-xl"
            >
              <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-6 grid grid-cols-12 gap-6 lg:gap-8">
                <div className="col-span-4 border-r border-[#E5E3DD] dark:border-[#2C2C28] pr-5">
                  <p className="text-[11px] uppercase tracking-wider text-[#84827B] mb-3">
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
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left text-sm cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#F2F0EC] dark:bg-[#22221F] text-[#171716] dark:text-[#F4F3EF] font-medium'
                                : 'text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF]'
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                                active ? 'opacity-100 text-[#8F6438] dark:text-[#C89B67]' : 'opacity-30'
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="col-span-3 border-r border-[#E5E3DD] dark:border-[#2C2C28] pr-5 space-y-5">
                  {activeHoverCat && (
                    <>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-[#84827B] mb-2.5">
                          In {activeHoverCat.shortName}
                        </p>
                        <ul className="space-y-2 text-sm text-[#5C5B57] dark:text-[#B4B2AC]">
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                go({ name: 'category', category: activeHoverCat.slug })
                              }
                              className="font-medium text-[#171716] dark:text-[#F4F3EF] hover:text-[#8F6438] dark:hover:text-[#C89B67] cursor-pointer"
                            >
                              Shop All {activeHoverCat.shortName}
                            </button>
                          </li>
                          {activeHoverCat.subcategories.map((sub) => (
                            <li key={sub.slug}>
                              <button
                                type="button"
                                onClick={() =>
                                  go({
                                    name: 'category',
                                    category: activeHoverCat.slug,
                                    subcategory: sub.slug,
                                  })
                                }
                                className="hover:text-[#171716] dark:hover:text-[#F4F3EF] transition-colors cursor-pointer"
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
                        <p className="text-[11px] uppercase tracking-wider text-[#84827B] mb-2.5">
                          Featured Brands
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#5C5B57] dark:text-[#B4B2AC]">
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
                                className="hover:text-[#8F6438] dark:hover:text-[#C89B67] transition-colors cursor-pointer"
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
                    <p className="text-[11px] uppercase tracking-wider text-[#84827B]">
                      Featured in {activeHoverCat?.shortName}
                    </p>
                    <button
                      type="button"
                      onClick={() => go({ name: 'shop', category: 'all' })}
                      className="text-xs font-medium text-[#8F6438] dark:text-[#C89B67] hover:underline cursor-pointer"
                    >
                      View Full Catalog →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {featuredProducts.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => go({ name: 'product', slug: item.slug })}
                        className={`group text-left rounded-md overflow-hidden border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] cursor-pointer ${
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
                          <p className="text-[11px] uppercase tracking-wider text-[#84827B] truncate">
                            {item.brand}
                          </p>
                          <p className="text-sm font-medium text-[#171716] dark:text-[#F4F3EF] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs font-mono-num font-semibold text-[#8F6438] dark:text-[#C89B67]">
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

        {/* Scroll Progress Hairline */}
        <ScrollProgressHairline />
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
              key="mobile-nav-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={STUDIO_TRANSITION.drawer}
              className="w-[86vw] max-w-sm h-full bg-[#FFFFFF] dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] flex flex-col border-r border-[#E5E3DD] dark:border-[#2C2C28]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
                <span className="font-display text-lg font-semibold tracking-[0.06em]">
                  KINTO STUDIO
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-10 h-10 -mr-2 rounded-md flex items-center justify-center cursor-pointer"
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
                    className="w-full py-2.5 text-left text-base font-medium text-[#8F6438] dark:text-[#C89B67] cursor-pointer"
                  >
                    Special Offers
                  </button>
                </div>

                <div className="border-t border-[#E5E3DD] dark:border-[#2C2C28] pt-4">
                  <button
                    type="button"
                    onClick={() => setMobileCategoriesExpanded((p) => !p)}
                    className="w-full flex items-center justify-between py-2 text-xs uppercase tracking-wider text-[#84827B] cursor-pointer"
                  >
                    <span>All Categories ({categories.length})</span>
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
                        <div className="mt-2 space-y-1 pl-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.slug}
                              type="button"
                              onClick={() => go({ name: 'category', category: cat.slug })}
                              className="w-full py-2 text-left text-sm text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-[#E5E3DD] dark:border-[#2C2C28] pt-4 space-y-2.5">
                  {!profile.isAuthenticated ? (
                    <div className="p-3.5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2.5">
                      <p className="text-[11px] uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67] font-medium">
                        Member, Seller &amp; Admin Portals
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            go({ name: 'login' });
                          }}
                          className="py-2 px-3 rounded-md bg-[#171716] dark:bg-[#F4F3EF] text-white dark:text-[#171716] text-xs font-medium cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            go({ name: 'login', accountTab: 'register' });
                          }}
                          className="py-2 px-3 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] text-xs font-medium cursor-pointer"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-md bg-[#F9F8F6] dark:bg-[#141413] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{profile.fullName}</p>
                          <p className="text-[11px] text-[#5C5B57] dark:text-[#A3A19B] truncate">
                            {profile.studioRole}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            go({ name: 'login' });
                          }}
                          className="text-[11px] font-medium text-[#8F6438] dark:text-[#C89B67] shrink-0 cursor-pointer"
                        >
                          Switch
                        </button>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'overview' })}
                          className="w-full py-1.5 flex items-center justify-between text-xs font-medium cursor-pointer"
                        >
                          <span>Account Overview</span>
                          <User className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => go({ name: 'account', accountTab: 'orders' })}
                          className="w-full py-1.5 flex items-center justify-between text-xs font-medium cursor-pointer"
                        >
                          <span>Order History</span>
                          <Package className="w-3.5 h-3.5 text-[#84827B]" />
                        </button>
                        {(profile.role === 'seller' || profile.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'seller' })}
                            className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-[#8F6438] dark:text-[#C89B67] cursor-pointer"
                          >
                            <span>Seller Studio Portal</span>
                            <Store className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {profile.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => go({ name: 'admin' })}
                            className="w-full py-1.5 flex items-center justify-between text-xs font-semibold text-[#8F6438] dark:text-[#C89B67] cursor-pointer"
                          >
                            <span>Admin Operations Console</span>
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            logoutDemo();
                            navigate({ name: 'login' });
                          }}
                          className="w-full py-1.5 flex items-center justify-between text-xs text-[#B91C1C] dark:text-[#F87171] cursor-pointer"
                        >
                          <span>Sign Out</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => go({ name: 'wishlist' })}
                    className="w-full py-2.5 flex items-center justify-between text-sm font-medium cursor-pointer"
                  >
                    <span>Wishlist ({wishlistIds.length})</span>
                    <Heart className="w-4 h-4 text-[#84827B]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'track-order' })}
                    className="w-full py-2 text-left text-sm text-[#5C5B57] dark:text-[#B4B2AC] cursor-pointer"
                  >
                    Track Order
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'compare' })}
                    className="w-full py-2 text-left text-sm text-[#5C5B57] dark:text-[#B4B2AC] cursor-pointer"
                  >
                    Compare Products ({compareIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'brands' })}
                    className="w-full py-2 text-left text-sm text-[#5C5B57] dark:text-[#B4B2AC] cursor-pointer"
                  >
                    Partner Brands
                  </button>
                  <button
                    type="button"
                    onClick={() => go({ name: 'faq' })}
                    className="w-full py-2 text-left text-sm text-[#5C5B57] dark:text-[#B4B2AC] cursor-pointer"
                  >
                    FAQ &amp; Support
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs font-mono-num font-medium cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{currency === 'USD' ? '$ USD' : '৳ BDT'}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs font-medium cursor-pointer"
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
