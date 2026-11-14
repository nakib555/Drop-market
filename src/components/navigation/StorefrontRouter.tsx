import React from 'react';
import { RouteState } from '../../context/navigationController';
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
          title="Shipping & White-Glove Policy"
          subtitle="Effective November 2026 · Contiguous United States & Canada"
          sections={[
            {
              heading: '1. Standard Ground & Complimentary Threshold',
              body: 'Orders totaling $500 USD or more qualify for complimentary insured ground shipping across the 48 contiguous United States. In-stock lighting, ceramics, and textiles dispatch from our Portland fulfillment studio within 24 to 48 business hours.',
            },
            {
              heading: '2. White-Glove Room Placement',
              body: 'Monolithic stone tables, credenzas, and lounge chairs travel via dedicated blanket-wrap and crated furniture carriers. Our two-person delivery team schedules a two-hour arrival window, places each piece in your desired room, levels feet if required, and removes all crating materials.',
            },
            {
              heading: '3. Transit Inspection',
              body: 'Every shipment is fully insured against transit damage. Please inspect crated stone and timber surfaces upon arrival and note any exterior carton concerns on the carrier bill of lading.',
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
              body: 'All prices are listed in US Dollars (USD). Promotional privileges such as STUDIO15 apply per eligible subtotal and cannot be combined retroactively after order dispatch.',
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
