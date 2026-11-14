import React from 'react';
import { useStore } from '../../context/StoreContext';
import { RouteState } from '../../context/navigationController';
import { formatCurrency } from '../../utils/format';
import { HomePage } from '../../pages/HomePage';
import { ShopPage } from '../../pages/ShopPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { CartPage } from '../../pages/CartPage';
import { WishlistPage } from '../../pages/WishlistPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { AccountPage } from '../../pages/AccountPage';
import { OrderTrackingPage } from '../../pages/OrderTrackingPage';
import { ComparePage } from '../../pages/ComparePage';
import {
  AboutPage,
  BrandsPage,
  ContactPage,
  FaqPage,
  JournalPage,
  MaintenancePage,
  NotFoundPage,
  PolicyPage,
} from '../../pages/SupportingPages';

interface StorefrontRouterProps {
  route: RouteState;
}

export const StorefrontRouter: React.FC<StorefrontRouterProps> = ({ route }) => {
  const { currency, shippingConfig } = useStore();
  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;
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
