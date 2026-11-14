import React, { Suspense } from 'react';
import { useStore } from '../../context/StoreContext';
import { RouteState } from '../../context/navigationController';
import { formatCurrency } from '../../utils/format';
import { RouteSuspenseFallback } from '../ui/SkeletonLoaders';
import { Button } from '../ui/Button';

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
const AccountPage = lazyNamed(() => import('../../pages/AccountPage'), 'AccountPage');
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
      return (
        <div className="min-h-[60vh] max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-16 flex items-center justify-center">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] text-center space-y-4">
            <h2 className="font-display text-2xl font-medium">Unable to load view</h2>
            <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
              A temporary network interruption prevented loading this section.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                variant="primary"
                size="md"
                onClick={() => this.setState({ hasError: false })}
              >
                Retry View
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface StorefrontRouterProps {
  route: RouteState;
}

export const StorefrontRouter: React.FC<StorefrontRouterProps> = ({ route }) => {
  const { currency, shippingConfig } = useStore();
  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;

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
      case 'shipping-policy':
        return (
          <PolicyPage
            title="Bangladesh & International Shipping Policy"
            subtitle="Effective November 2026 · Dhaka Hub, All 64 Districts & Global Freight"
            sections={[
              {
                heading: '1. Hierarchical Bangladesh Coverage & Complimentary Threshold',
                body: `Dhaka Metro orders totaling ${formatCurrency(
                  dhakaThresholdUsd,
                  currency
                )} or more qualify for complimentary standard courier delivery (excluding oversized freight furniture). Weight-based and bulky-item handling rates scale transparently by Division, District, Upazila, and Area during checkout.`,
              },
              {
                heading: '2. Express & White-Glove Room Placement',
                body: 'Express same-day and next-day air dispatch operates across Dhaka Metro, Suburbs, Chattogram, and Sylhet city hubs. Two-person White-Glove assembly is available for travertine tables and hardwood seating.',
              },
              {
                heading: '3. Cash on Delivery & Restricted Maritime Zones',
                body: 'Cash on Delivery (COD) is available across eligible mainland Bangladesh zones up to zone order limits. Remote offshore marine routes (such as Sandwip, Saint Martin, and Monpura) are automatically flagged during checkout.',
              },
            ]}
          />
        );
      case 'return-policy':
        return (
          <PolicyPage
            title="Return & Refund Policy"
            subtitle="30-Day Residential Trial · Transparent Studio Returns"
            sections={[
              {
                heading: '1. 30-Day Return Window',
                body: 'Most in-stock Kinto Studio objects may be returned within 30 calendar days of delivery in original condition. Initiate a return directly from your Order History or via Client Care.',
              },
              {
                heading: '2. Furniture & Custom Orders',
                body: 'Made-to-order credenzas and custom-upholstered seating undergo craftsman verification prior to dispatch and carry a 14-day inspection window for manufacturing defects or transit variances.',
              },
              {
                heading: '3. Refund Processing',
                body: 'Refunds are issued to your original payment method within 3 to 5 business days after studio intake inspection.',
              },
            ]}
          />
        );
      case 'privacy-policy':
        return (
          <PolicyPage
            title="Privacy Policy"
            subtitle="Updated November 2026 · Client Data Stewardship"
            sections={[
              {
                heading: '1. Local Session & Preferences',
                body: 'This storefront stores your shopping bag, wishlist, saved addresses, and theme preferences locally in your browser storage so your session remains seamless across page reloads.',
              },
              {
                heading: '2. Zero Third-Party Data Brokering',
                body: 'Kinto Studio never sells or rents client contact information, architectural specifications, or residential addresses to external marketing brokers.',
              },
            ]}
          />
        );
      case 'terms':
        return (
          <PolicyPage
            title="Terms & Conditions"
            subtitle="Effective November 2026 · Kinto Studio LLC"
            sections={[
              {
                heading: '1. Natural Material Variation',
                body: 'Solid hardwoods, unlacquered brass, and Roman travertine exhibit organic grain, mineral pores, and tonal variations inherent to authentic architectural materials.',
              },
              {
                heading: '2. Pricing & Promotional Codes',
                body: 'Catalog base pricing is anchored in US Dollars (USD) with live BDT (৳) display equivalents available anytime in the header. Promotional codes such as STUDIO15 apply per eligible subtotal and cannot be combined retroactively after order dispatch.',
              },
            ]}
          />
        );
      case 'maintenance':
        return <MaintenancePage />;
      case 'not-found':
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <RouteChunkErrorBoundary resetKey={route.name}>
      <Suspense fallback={<RouteSuspenseFallback routeName={route.name} />}>
        {renderRouteView()}
      </Suspense>
    </RouteChunkErrorBoundary>
  );
};
