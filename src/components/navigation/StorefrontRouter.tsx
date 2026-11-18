import React, { Suspense } from 'react';
import { useStore } from '../../context/StoreContext';
import { RouteState } from '../../context/navigationController';
import { t } from '../../utils/i18n';
import { RouteSuspenseFallback } from '../ui/SkeletonLoaders';
import { Button } from '../ui/Button';
import { AccountPage } from '../../pages/AccountPage';

function lazyNamed<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey
) {
  type Component = TModule[TKey] extends React.ComponentType<infer P>
    ? React.ComponentType<P>
    : never;
  return React.lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as Component };
  });
}

const HomePage = lazyNamed(() => import('../../pages/HomePage'), 'HomePage');
const ShopPage = lazyNamed(() => import('../../pages/ShopPage'), 'ShopPage');
const ProductDetailPage = lazyNamed(
  () => import('../../pages/ProductDetailPage'),
  'ProductDetailPage'
);
const CartPage = lazyNamed(() => import('../../pages/CartPage'), 'CartPage');
const WishlistPage = lazyNamed(() => import('../../pages/WishlistPage'), 'WishlistPage');
const CheckoutPage = lazyNamed(() => import('../../pages/CheckoutPage'), 'CheckoutPage');
export const preloadAccountPage = () => {};
const OrderTrackingPage = lazyNamed(
  () => import('../../pages/OrderTrackingPage'),
  'OrderTrackingPage'
);
const ComparePage = lazyNamed(() => import('../../pages/ComparePage'), 'ComparePage');

const loadSupportingPages = () => import('../../pages/SupportingPages');
const AboutPage = lazyNamed(loadSupportingPages, 'AboutPage');
const BrandsPage = lazyNamed(loadSupportingPages, 'BrandsPage');
const ContactPage = lazyNamed(loadSupportingPages, 'ContactPage');
const FaqPage = lazyNamed(loadSupportingPages, 'FaqPage');
const JournalPage = lazyNamed(loadSupportingPages, 'JournalPage');
const LegalCenterPage = lazyNamed(loadSupportingPages, 'LegalCenterPage');
const MaintenancePage = lazyNamed(loadSupportingPages, 'MaintenancePage');
const NotFoundPage = lazyNamed(loadSupportingPages, 'NotFoundPage');
const PolicyPage = lazyNamed(loadSupportingPages, 'PolicyPage');

interface RouteChunkErrorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}

interface RouteChunkErrorBoundaryState {
  hasError: boolean;
}

const RouteErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { language } = useStore();
  return (
    <div className="min-h-[60vh] max-w-[var(--ks-container-max)] mx-auto px-4 sm:px-6 lg:px-10 py-16 flex items-center justify-center">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] text-center space-y-4">
        <h2 className="font-display text-2xl font-medium text-[var(--ks-text-primary)]">
          {t(language, 'unableToLoadView')}
        </h2>
        <p className="text-sm text-[var(--ks-text-secondary)]">
          {t(language, 'routeErrorDesc')}
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Button variant="primary" size="md" onClick={onRetry}>
            {t(language, 'retryView')}
          </Button>
          <Button variant="outline" size="md" onClick={() => window.location.reload()}>
            {t(language, 'reloadPage')}
          </Button>
        </div>
      </div>
    </div>
  );
};

class RouteChunkErrorBoundary extends React.Component<
  RouteChunkErrorBoundaryProps,
  RouteChunkErrorBoundaryState
> {
  state: RouteChunkErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteChunkErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: RouteChunkErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <RouteErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

interface StorefrontRouterProps {
  route: RouteState;
}

export const StorefrontRouter: React.FC<StorefrontRouterProps> = ({ route }) => {
  const renderRouteView = () => {
    switch (route.name) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage mode="shop" />;
      case 'category':
        return <ShopPage mode="category" />;
      case 'search':
        return <ShopPage mode="search" />;
      case 'offers':
        return <ShopPage mode="offers" />;
      case 'product':
        return <ProductDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'account':
      case 'login':
      case 'seller':
      case 'admin':
        return <AccountPage />;
      case 'track-order':
        return <OrderTrackingPage />;
      case 'compare':
        return <ComparePage />;
      case 'brands':
        return <BrandsPage />;
      case 'journal':
        return <JournalPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FaqPage />;
      case 'legal':
        return <LegalCenterPage />;
      case 'shipping-policy':
      case 'return-policy':
      case 'cancellation-policy':
      case 'payment-policy':
      case 'warranty-policy':
      case 'privacy-policy':
      case 'cookie-policy':
      case 'terms':
      case 'seller-agreement':
      case 'marketplace-terms':
      case 'prohibited-items':
      case 'product-safety':
      case 'acceptable-use':
      case 'intellectual-property':
      case 'customer-support-policy':
      case 'data-retention-policy':
      case 'accessibility':
      case 'reviews-policy':
      case 'promo-terms':
      case 'international-orders-policy':
        return <PolicyPage policyId={route.name} />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'not-found':
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <RouteChunkErrorBoundary resetKey={`${route.name}:${route.policyVersion || ''}`}>
      <Suspense fallback={<RouteSuspenseFallback routeName={route.name} />}>
        {renderRouteView()}
      </Suspense>
    </RouteChunkErrorBoundary>
  );
};
