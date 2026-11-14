import React, { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { getRouteKey } from './context/navigationController';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/navigation/Header';
import { SearchModal } from './components/navigation/SearchModal';
import { StorefrontRouter } from './components/navigation/StorefrontRouter';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/product/QuickViewModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { BackToTopButton } from './components/ui/BackToTopButton';
import { PWAStatusBanners } from './components/pwa/PWAStatusBanners';
import { CookieConsentBanner } from './components/legal/CookieConsentBanner';
import { LegalModalPreview } from './components/legal/LegalModalPreview';

const AppShell: React.FC = () => {
  const { route, navigationDirection } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

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

  const routeKey = getRouteKey(route);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] dark:bg-[#111110] text-[#171716] dark:text-[#F4F3EF]">
      <Header onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-x-clip">
        <div
          key={routeKey}
          className={navigationDirection >= 0 ? 'page-enter-forward' : 'page-enter-back'}
        >
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-[#111110] text-[#171716] dark:text-[#F4F3EF] px-4 py-12">
          <div className="max-w-md w-full rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] p-6 sm:p-8 text-center space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8F6438] dark:text-[#C89B67]">
              KINTO STUDIO
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-medium">
              Storefront Recovery
            </h1>
            <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC]">
              A temporary rendering issue interrupted this view. Reload the page or reset local session cache to continue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2.5 rounded bg-[#171716] dark:bg-[#F4F3EF] text-[#FFFFFF] dark:text-[#171716] text-xs font-semibold cursor-pointer"
              >
                Reload Storefront
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="px-4 py-2.5 rounded border border-[#D4D1C9] dark:border-[#3A3934] text-xs font-semibold cursor-pointer"
              >
                Reset Local Cache
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
