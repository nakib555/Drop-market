import React, { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { getRouteKey } from './context/navigationController';
import { ThemeProvider } from './context/ThemeContext';
import { slideFadeVariants } from './utils/motion';
import { Header } from './components/navigation/Header';
import { SearchModal } from './components/navigation/SearchModal';
import { StorefrontRouter } from './components/navigation/StorefrontRouter';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickViewModal } from './components/product/QuickViewModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { BackToTopButton } from './components/ui/BackToTopButton';

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
        <AnimatePresence mode="wait" initial={false} custom={navigationDirection}>
          <motion.div
            key={routeKey}
            custom={navigationDirection}
            variants={slideFadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <StorefrontRouter route={route} />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
      <QuickViewModal />
      <BackToTopButton />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
