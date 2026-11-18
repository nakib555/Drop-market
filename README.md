# Kinto Studio — Guest-First Marketplace & Contextual Authentication

Kinto Studio is a multi-category Bangladesh & international storefront engineered with a **guest-first shopping architecture** and **action-preserving contextual authentication**.

## Core UX & Auth Architecture

### 1. Guest-First Storefront (`src/policy/authPolicy.ts`)
- Visitors browse departments, search, filter, compare, manage a local shopping bag, apply promo codes, track orders (via Order ID + email/phone verification), and complete **guest checkout** without forced sign-in walls or interruption popups.
- Protected operations (`ProtectedActionId`) are centrally gated via `evaluateActionAccess(actionId, profile, policy)` against `DEFAULT_STORE_POLICY`:
  - `checkoutAuthRequired`: `false` (guest checkout enabled by default; configurable)
  - `wishlistAuthRequired`: `true` (saving items to a cloud-synced wishlist prompts contextual auth and automatically toggles the item upon sign-in)
  - `reviewAuthRequired`: `true` (customer reviews stay linked to verified accounts)
  - `addressSaveAuthRequired`, `paymentSaveAuthRequired`, `orderCancelAuthRequired`, `orderReturnAuthRequired`, `orderClaimAuthRequired`

### 2. Contextual Authentication & Action Resumption
- Triggering an account-only action as a guest stores a TTL-bounded `PendingAction` (`sessionStorage['kinto-pending-action']`, default 15 min) along with the active `returnRoute` and opens `<AuthModal />`:
  - Desktop (`sm+`): centered dialog (`z-[60]`) with focus trap (`useFocusTrap`) and LIFO overlay stack (`useOverlayLock`).
  - Mobile (`<640px`): bottom-anchored sheet (`rounded-t-2xl max-h-[92dvh]`) with action-specific benefits and `Continue browsing as guest` dismissal.
- Signing in or registering automatically invokes `resumePendingActionAfterAuth(user)` to complete the saved action (wishlist toggle, review unlock, address/payment save, order claim, or role portal) right where the shopper left off.

### 3. Session Security, CSRF Defense & Multi-Tab Sync (`server.ts`, `server/mockDb.ts`)
- Authentication sets an `HttpOnly; SameSite=Lax; Path=/` session cookie (`ks_session`) backed by server-side session storage; tokens and passwords are never written to `localStorage`.
- `GET /api/auth/session` returns HTTP `200` with `{ authenticated, user, policy }` for silent guest bootstrapping without console `401` noise.
- Cookie-authenticated unsafe requests (`POST`, `PUT`, `PATCH`, `DELETE`) under `/api/*` validate same-origin (`Origin` / `Host` match) plus the custom `X-Kinto-Request: 1` header.
- `BroadcastChannel('kinto-auth-sync')` synchronizes sign-in, sign-out, cart, and wishlist state across open browser tabs, and sign-out revokes the server session (`POST /api/auth/logout`) and clears private client state.

### 4. Cart Merge & Guest Order Claiming (`src/utils/cartMerge.ts`)
- Signing in merges the local guest bag into the customer's server cart deterministically, summing variant quantities, capping at authoritative catalog stock counts, and exposing adjustment details.
- Post-checkout guest confirmations offer one-click account creation/linking (`POST /api/account/claim-orders`) prefilled from checkout customer details.

## Development & Verification

```bash
# Install dependencies
npm install

# Run unit & end-to-end API tests (node:test via tsx)
npm test

# Type-check & production Vite build
npm run lint
npm run build

# Start development server on port 3000
npm run dev
```
