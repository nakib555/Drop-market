import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { getRouteKey } from './context/navigationController';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/navigation/Header';
import { SearchModal } from './components/navigation/SearchModal';
import { StorefrontRouter, preloadAccountPage } from './components/navigation/StorefrontRouter';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/product/QuickViewModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { BackToTopButton } from './components/ui/BackToTopButton';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { PWAStatusBanners } from './components/pwa/PWAStatusBanners';
import { CookieConsentBanner } from './components/legal/CookieConsentBanner';
import { LegalModalPreview } from './components/legal/LegalModalPreview';
import { FAQ_ITEMS } from './data/catalog';
import { LanguageCode } from './types/commerce';
import { applyDocumentSeo, resolveSeoMetadata } from './utils/seo';
import { t } from './utils/i18n';

const AppShell: React.FC = () => {
  const { language, route, navigationDirection, products, categories } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const meta = resolveSeoMetadata({
      route,
      products,
      categories,
      origin: typeof window !== 'undefined' ? window.location.origin : 'https://kintostudio.bd',
      faqItems: FAQ_ITEMS,
    });
    applyDocumentSeo(meta);
  }, [route, products, categories]);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      preloadAccountPage();
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  const routeKey = getRouteKey(route);
  const routeTransitionClass =
    route.name === 'login'
      ? 'page-enter-auth'
      : navigationDirection >= 0
      ? 'page-enter-forward'
      : 'page-enter-back';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ks-bg)] text-[var(--ks-text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[70] focus:px-4 focus:py-2.5 focus:rounded-[var(--ks-radius-md)] focus:bg-[var(--ks-action)] focus:text-[var(--ks-action-text)] focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        {t(language, 'skipToContent')}
      </a>
      <Header onOpenSearch={() => setSearchOpen(true)} />
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-clip focus:outline-none">
        <div key={routeKey} className={routeTransitionClass}>
          <StorefrontRouter route={route} />
        </div>
      </main>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
      <QuickViewModal />
      <BackToTopButton />
      <CookieConsentBanner />
      <LegalModalPreview />
      <PWAInstallBanner />
      <PWAStatusBanners />
      <ToastContainer />
    </div>
  );
};

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unexpected storefront error',
    };
  }

  handleResetSession = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('kinto-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Ignore storage access failures
    }
    window.location.reload();
  };

  readFallbackLanguage = (): LanguageCode => {
    try {
      const raw = window.localStorage.getItem('kinto-language');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed === 'en' || parsed === 'bn' || parsed === 'hi' || parsed === 'ar' || parsed === 'es' || parsed === 'fr') {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return 'en';
  };

  render() {
    if (this.state.hasError) {
      const lang = this.readFallbackLanguage();
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--ks-bg)] text-[var(--ks-text-primary)] px-4 py-12">
          <div className="max-w-md w-full rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] p-6 sm:p-8 text-center space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ks-accent)]">
              KINTO STUDIO
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-medium">
              {t(lang, 'recoveryTitle')}
            </h1>
            <p className="text-sm text-[var(--ks-text-secondary)]">
              {t(lang, 'recoveryDesc')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-[44px] px-4 py-2.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-action)] text-[var(--ks-action-text)] text-xs font-semibold cursor-pointer"
              >
                {t(lang, 'reloadStorefront')}
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="min-h-[44px] px-4 py-2.5 rounded-[var(--ks-radius-md)] border border-[var(--ks-border-strong)] text-xs font-semibold cursor-pointer"
              >
                {t(lang, 'resetLocalCache')}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <RootErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <StoreProvider>
            <AppShell />
          </StoreProvider>
        </ThemeProvider>
      </MotionConfig>
    </RootErrorBoundary>
  );
}
