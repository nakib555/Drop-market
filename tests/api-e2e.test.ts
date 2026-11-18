import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

process.env.KINTO_NO_LISTEN = '1';

const { createMarketplaceApp } = await import('../server.ts');

let server: http.Server;
let baseUrl = '';

before(async () => {
  const { httpServer } = await createMarketplaceApp({ enableVite: false });
  server = httpServer;
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

async function apiJson<T>(
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: T; text: string; headers: Headers; setCookies: string[] }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data = {} as T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    // plain text or XML response
  }
  const setCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : res.headers.get('set-cookie')
      ? [res.headers.get('set-cookie') as string]
      : [];
  return { status: res.status, data, text, headers: res.headers, setCookies };
}

test('health, robots.txt, and sitemap.xml endpoints serve expected SEO & health payloads', async () => {
  const health = await apiJson<{ ok: boolean }>('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.ok, true);

  const robots = await apiJson<unknown>('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.text, /Disallow: \/checkout/);
  assert.match(robots.text, /Disallow: \/api\//);
  assert.match(robots.text, /Sitemap: http:\/\/127\.0\.0\.1:\d+\/sitemap\.xml/);

  const sitemap = await apiJson<unknown>('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.text, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap.text, /\/category\/electronics-tech<\/loc>/);
  assert.match(sitemap.text, /\/legal<\/loc>/);
  assert.match(sitemap.text, /\/return-policy<\/loc>/);
  assert.match(sitemap.text, /\/reviews-policy<\/loc>/);
  assert.match(sitemap.text, /\/international-orders-policy<\/loc>/);
  assert.match(sitemap.text, /\/customer-support-policy<\/loc>/);
});

test('auth endpoints enforce password rules, return tokens, and validate /api/auth/me', async () => {
  const badLogin = await apiJson<{ error: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'rafiq.islam@kintostudio.bd', password: 'wrong' },
  });
  assert.equal(badLogin.status, 401);

  const login = await apiJson<{ token: string; user: { role: string; email: string } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: { email: 'rafiq.islam@kintostudio.bd', password: 'studio2026' },
    }
  );
  assert.equal(login.status, 200);
  assert.ok(login.data.token);
  assert.equal(login.data.user.role, 'customer');

  const me = await apiJson<{ user: { email: string } }>('/api/auth/me', {
    token: login.data.token,
  });
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, 'rafiq.islam@kintostudio.bd');

  const missingPolicyReg = await apiJson('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Test User',
      email: 'newbuyer@example.com',
      password: 'password123',
      role: 'customer',
    },
  });
  assert.equal(missingPolicyReg.status, 400);

  const validReg = await apiJson<{ token: string; user: { email: string } }>('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Test Shopper',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      role: 'customer',
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(validReg.status, 201);
  assert.ok(validReg.data.token);
});

test('checkout quote, payment session initiation/verification, direct POST /api/orders block, and order tracking verification', async () => {
  // Direct client order creation must remain disabled (403)
  const directOrder = await apiJson('/api/orders', {
    method: 'POST',
    body: { items: [], total: 1 },
  });
  assert.equal(directOrder.status, 403);

  // Authoritative quote
  const quoteRes = await apiJson<{
    quote: {
      subtotalUsd: number;
      discountUsd: number;
      currency: string;
      promoApplied: string;
    };
  }>('/api/checkout/quote', {
    method: 'POST',
    body: {
      items: [{ productId: 'prod-aeterna-headphones', quantity: 2 }],
      address: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
      },
      deliveryMethod: 'standard',
      promoCode: 'STUDIO15',
    },
  });
  assert.equal(quoteRes.status, 200);
  assert.equal(quoteRes.data.quote.subtotalUsd, 840);
  assert.equal(quoteRes.data.quote.promoApplied, 'STUDIO15');
  assert.equal(quoteRes.data.quote.discountUsd, 126);
  assert.equal(quoteRes.data.quote.currency, 'BDT');

  // Restricted area payment initiation must fail cleanly
  const restrictedPay = await apiJson('/api/payments/initiate', {
    method: 'POST',
    body: {
      paymentMethod: 'cod',
      customerName: 'Island Buyer',
      email: 'island@example.com',
      phone: '+8801711111111',
      shippingAddress: {
        country: 'Bangladesh',
        state: 'Chattogram',
        city: 'Chattogram',
        upazila: 'Sandwip Upazila',
        area: 'Sandwip Offshore Island',
        streetAddress: 'Road 1',
      },
      deliveryMethod: 'standard',
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(restrictedPay.status, 400);

  // Valid COD payment initiate + verify flow
  const guestEmail = `cod-buyer-${Date.now()}@example.com`;
  const initPay = await apiJson<{
    session: { id: string; status: string };
  }>('/api/payments/initiate', {
    method: 'POST',
    body: {
      idempotencyKey: `e2e-cod-${Date.now()}`,
      paymentMethod: 'cod',
      customerName: 'Mahmudul Hasan',
      email: guestEmail,
      phone: '+8801712345678',
      shippingAddress: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
        streetAddress: 'House 22, Road 12',
      },
      deliveryMethod: 'standard',
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(initPay.status, 201);
  assert.equal(initPay.data.session.status, 'cod_pending');

  // COD cannot verify as prepaid 'paid'
  const invalidCodOutcome = await apiJson('/api/payments/verify', {
    method: 'POST',
    body: { sessionId: initPay.data.session.id, outcome: 'paid' },
  });
  assert.equal(invalidCodOutcome.status, 400);

  // Verify COD order creation
  const verifyCod = await apiJson<{
    order: { id: string; currentStage: string; paymentStatus: string };
  }>('/api/payments/verify', {
    method: 'POST',
    body: { sessionId: initPay.data.session.id, outcome: 'cod_confirmed' },
  });
  assert.equal(verifyCod.status, 200);
  assert.ok(verifyCod.data.order.id.startsWith('KS-'));
  assert.equal(verifyCod.data.order.paymentStatus, 'cod_pending');

  // Guest tracking verification rules
  const orderId = verifyCod.data.order.id;
  const unauthNoContact = await apiJson(`/api/orders/track?id=${encodeURIComponent(orderId)}`);
  assert.equal(unauthNoContact.status, 401);

  const unauthWrongContact = await apiJson(
    `/api/orders/track?id=${encodeURIComponent(orderId)}&contact=wrong@example.com`
  );
  assert.equal(unauthWrongContact.status, 403);

  const unauthMatchedEmail = await apiJson<{ order: { id: string } }>(
    `/api/orders/track?id=${encodeURIComponent(orderId)}&contact=${encodeURIComponent(guestEmail)}`
  );
  assert.equal(unauthMatchedEmail.status, 200);
  assert.equal(unauthMatchedEmail.data.order.id, orderId);
});

test('seller and admin RBAC endpoints enforce roles and return zero initial ratings', async () => {
  const customerLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'rafiq.islam@kintostudio.bd', password: 'studio2026' },
  });
  const sellerLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'elena@aeterna-loom.studio', password: 'seller2026' },
  });
  const adminLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@kintostudio.bd', password: 'admin2026' },
  });

  const unauthSeller = await apiJson('/api/seller/dashboard');
  assert.equal(unauthSeller.status, 401);

  const customerOnSeller = await apiJson('/api/seller/dashboard', {
    token: customerLogin.data.token,
  });
  assert.equal(customerOnSeller.status, 403);

  const sellerDash = await apiJson<{ kpis: { avgRating: number } }>('/api/seller/dashboard', {
    token: sellerLogin.data.token,
  });
  assert.equal(sellerDash.status, 200);
  assert.equal(sellerDash.data.kpis.avgRating, 0);

  const newSellerProduct = await apiJson<{
    product: { id: string; rating: number; reviewCount: number };
  }>('/api/seller/products', {
    method: 'POST',
    token: sellerLogin.data.token,
    body: {
      name: 'Studio Ceramic Dripper E2E',
      price: 68,
      stockCount: 12,
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(newSellerProduct.status, 201);
  assert.equal(newSellerProduct.data.product.rating, 0);
  assert.equal(newSellerProduct.data.product.reviewCount, 0);

  const sellerOnAdmin = await apiJson('/api/admin/dashboard', {
    token: sellerLogin.data.token,
  });
  assert.equal(sellerOnAdmin.status, 403);

  const adminDash = await apiJson<{ kpis: { activeCategories: number } }>('/api/admin/dashboard', {
    token: adminLogin.data.token,
  });
  assert.equal(adminDash.status, 200);
  assert.ok(adminDash.data.kpis.activeCategories >= 10);
});

test('support inquiries, newsletter deduplication, password recovery, and admin readiness RBAC work end-to-end', async () => {
  // Support inquiry validation & persistence
  const badInquiry = await apiJson('/api/support/inquiries', {
    method: 'POST',
    body: { name: 'A', email: 'bad', message: 'hi' },
  });
  assert.equal(badInquiry.status, 400);

  const createdInquiry = await apiJson<{ inquiry: { ticketRef: string; status: string } }>(
    '/api/support/inquiries',
    {
      method: 'POST',
      body: {
        name: 'Tasnim Ahmed',
        email: 'tasnim@example.com',
        phone: '+8801711000222',
        topic: 'delivery',
        message: 'Checking Dhaka courier schedule for studio order.',
      },
    }
  );
  assert.equal(createdInquiry.status, 201);
  assert.match(createdInquiry.data.inquiry.ticketRef, /^KS-TKT-\d+/);

  // Newsletter subscription + deduplication
  const subEmail = `newsletter-${Date.now()}@example.com`;
  const subFirst = await apiJson<{ alreadySubscribed: boolean }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: { email: subEmail, source: 'footer' },
  });
  assert.equal(subFirst.status, 201);
  assert.equal(subFirst.data.alreadySubscribed, false);

  const subSecond = await apiJson<{ alreadySubscribed: boolean }>('/api/newsletter/subscribe', {
    method: 'POST',
    body: { email: subEmail, source: 'footer' },
  });
  assert.equal(subSecond.status, 200);
  assert.equal(subSecond.data.alreadySubscribed, true);

  // Register a disposable account and exercise forgot-password -> reset-password
  const tempEmail = `recover-${Date.now()}@example.com`;
  const regRes = await apiJson<{ token: string }>('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Recovery Tester',
      email: tempEmail,
      password: 'oldPassword123',
      role: 'customer',
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(regRes.status, 201);

  const forgotRes = await apiJson<{ ok: boolean; previewCode?: string; deliveryMode: string }>(
    '/api/auth/forgot-password',
    {
      method: 'POST',
      body: { email: tempEmail },
    }
  );
  assert.equal(forgotRes.status, 200);
  assert.equal(forgotRes.data.deliveryMode, 'in-app-preview');
  assert.ok(forgotRes.data.previewCode);

  const resetRes = await apiJson<{ ok: boolean }>('/api/auth/reset-password', {
    method: 'POST',
    body: {
      email: tempEmail,
      code: forgotRes.data.previewCode,
      newPassword: 'newPassword456',
    },
  });
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.ok, true);

  // Prior token must be invalidated and old password rejected
  const staleMe = await apiJson('/api/auth/me', { token: regRes.data.token });
  assert.equal(staleMe.status, 401);

  const newLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: tempEmail, password: 'newPassword456' },
  });
  assert.equal(newLogin.status, 200);
  assert.ok(newLogin.data.token);

  // Admin readiness RBAC check
  const unauthReadiness = await apiJson('/api/admin/readiness');
  assert.equal(unauthReadiness.status, 401);

  const customerReadiness = await apiJson('/api/admin/readiness', {
    token: newLogin.data.token,
  });
  assert.equal(customerReadiness.status, 403);

  const adminLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@kintostudio.bd', password: 'admin2026' },
  });
  const adminReadiness = await apiJson<{
    persistence: { status: string };
    paymentGateways: Array<{ id: string; status: string }>;
    metrics: { openSupportInquiries: number; newsletterSubscribers: number };
  }>('/api/admin/readiness', { token: adminLogin.data.token });
  assert.equal(adminReadiness.status, 200);
  assert.equal(adminReadiness.data.persistence.status, 'in-memory');
  assert.ok(adminReadiness.data.paymentGateways.length >= 7);
  assert.ok(adminReadiness.data.metrics.openSupportInquiries >= 1);
  assert.ok(adminReadiness.data.metrics.newsletterSubscribers >= 1);
});

test('HttpOnly cookie sessions, CSRF guard, logout revocation, and protected account routes enforce isolation', async () => {
  // Unauthenticated session probe always returns 200 { authenticated: false }
  const guestSession = await apiJson<{ authenticated: boolean; user: unknown; policy: { checkoutAuthRequired: boolean } }>(
    '/api/auth/session'
  );
  assert.equal(guestSession.status, 200);
  assert.equal(guestSession.data.authenticated, false);
  assert.equal(guestSession.data.user, null);
  assert.equal(guestSession.data.policy.checkoutAuthRequired, false);

  // Protected account endpoints must reject unauthenticated guests with 401
  assert.equal((await apiJson('/api/account/wishlist')).status, 401);
  assert.equal(
    (await apiJson('/api/account/wishlist/toggle', { method: 'POST', body: { productId: 'prod-aeterna-headphones' } })).status,
    401
  );
  assert.equal(
    (await apiJson('/api/account/cart/merge', { method: 'POST', body: { guestItems: [] } })).status,
    401
  );
  assert.equal((await apiJson('/api/account/addresses')).status, 401);
  assert.equal(
    (await apiJson('/api/products/prod-aeterna-headphones/reviews', { method: 'POST', body: { rating: 5, comment: 'Great studio finish' } })).status,
    401
  );

  // Login sets HttpOnly SameSite=Lax ks_session cookie
  const loginRes = await apiJson<{ user: { id: string; email: string } }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'rafiq.islam@kintostudio.bd', password: 'studio2026' },
  });
  assert.equal(loginRes.status, 200);
  const rawSetCookie = loginRes.setCookies.find((c) => c.startsWith('ks_session='));
  assert.ok(rawSetCookie, 'Expected Set-Cookie ks_session header');
  assert.match(rawSetCookie, /HttpOnly/i);
  assert.match(rawSetCookie, /SameSite=Lax/i);
  const cookiePair = rawSetCookie.split(';')[0];

  // Cookie session validates /api/auth/session without Bearer header
  const authedSession = await apiJson<{ authenticated: boolean; user: { email: string } }>('/api/auth/session', {
    headers: { Cookie: cookiePair },
  });
  assert.equal(authedSession.status, 200);
  assert.equal(authedSession.data.authenticated, true);
  assert.equal(authedSession.data.user.email, 'rafiq.islam@kintostudio.bd');

  // CSRF guard blocks cookie-authenticated mutations missing X-Kinto-Request: 1
  const csrfMissing = await apiJson('/api/account/wishlist/toggle', {
    method: 'POST',
    headers: { Cookie: cookiePair },
    body: { productId: 'prod-aeterna-headphones' },
  });
  assert.equal(csrfMissing.status, 403);

  // CSRF guard blocks cross-origin Origin headers even when X-Kinto-Request is present
  const csrfCrossOrigin = await apiJson('/api/account/wishlist/toggle', {
    method: 'POST',
    headers: {
      Cookie: cookiePair,
      'X-Kinto-Request': '1',
      Origin: 'https://evil.example',
    },
    body: { productId: 'prod-aeterna-headphones' },
  });
  assert.equal(csrfCrossOrigin.status, 403);

  // Valid cookie + X-Kinto-Request + matching Origin succeeds
  const wishlistToggle = await apiJson<{ wishlistIds: string[]; added: boolean }>('/api/account/wishlist/toggle', {
    method: 'POST',
    headers: {
      Cookie: cookiePair,
      'X-Kinto-Request': '1',
      Origin: baseUrl,
    },
    body: { productId: 'prod-botanical-serum' },
  });
  assert.equal(wishlistToggle.status, 200);
  assert.equal(wishlistToggle.data.added, true);
  assert.ok(wishlistToggle.data.wishlistIds.includes('prod-botanical-serum'));

  // Guest cart merges cleanly via cookie auth
  const cartMerge = await apiJson<{ items: Array<{ productId: string; quantity: number }>; report: { guestItemsMerged: number } }>(
    '/api/account/cart/merge',
    {
      method: 'POST',
      headers: { Cookie: cookiePair, 'X-Kinto-Request': '1' },
      body: {
        guestItems: [
          {
            productId: 'prod-aeterna-headphones',
            variantId: 'default',
            variantName: 'Obsidian Matte',
            quantity: 2,
          },
        ],
      },
    }
  );
  assert.equal(cartMerge.status, 200);
  assert.ok(cartMerge.data.items.some((i) => i.productId === 'prod-aeterna-headphones' && i.quantity >= 2));

  // Saving address persists per authenticated user and stays isolated from another user
  const savedAddr = await apiJson<{ addresses: Array<{ id: string; streetAddress: string }> }>('/api/account/addresses', {
    method: 'POST',
    headers: { Cookie: cookiePair, 'X-Kinto-Request': '1' },
    body: {
      label: 'Studio',
      fullName: 'Rafiq Islam',
      phone: '+8801711223344',
      city: 'Dhaka',
      streetAddress: 'House 14, Road 6, Banani',
      isDefault: true,
    },
  });
  assert.equal(savedAddr.status, 201);
  assert.ok(savedAddr.data.addresses.some((a) => a.streetAddress === 'House 14, Road 6, Banani'));

  // Register a second customer and verify isolation (second customer sees empty wishlist/addresses & cannot cancel Rafiq's order)
  const secondEmail = `isolated-${Date.now()}@example.com`;
  const secondReg = await apiJson<{ token: string }>('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Nadia Rahman',
      email: secondEmail,
      password: 'password123',
      role: 'customer',
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(secondReg.status, 201);

  const secondAddresses = await apiJson<{ addresses: Array<{ streetAddress: string }> }>('/api/account/addresses', {
    token: secondReg.data.token,
  });
  assert.equal(secondAddresses.status, 200);
  assert.equal(secondAddresses.data.addresses.length, 0);

  // Guest COD checkout with matching email, then claim order into Nadia's account
  const initGuestCod = await apiJson<{ session: { id: string } }>('/api/payments/initiate', {
    method: 'POST',
    body: {
      idempotencyKey: `claim-test-${Date.now()}`,
      paymentMethod: 'cod',
      customerName: 'Nadia Rahman',
      email: secondEmail,
      phone: '+8801715556667',
      shippingAddress: {
        country: 'Bangladesh',
        state: 'Dhaka',
        city: 'Dhaka',
        upazila: 'Dhaka North City Corporation',
        area: 'Banani',
        streetAddress: 'Plot 8, Kemal Ataturk Ave',
      },
      deliveryMethod: 'standard',
      items: [{ productId: 'prod-aeterna-headphones', quantity: 1 }],
      acceptedPolicies: { accepted: true, version: '2026-11' },
    },
  });
  assert.equal(initGuestCod.status, 201);
  const verifyGuestCod = await apiJson<{ order: { id: string; userId?: string } }>('/api/payments/verify', {
    method: 'POST',
    body: { sessionId: initGuestCod.data.session.id, outcome: 'cod_confirmed' },
  });
  assert.equal(verifyGuestCod.status, 200);
  const claimedOrderId = verifyGuestCod.data.order.id;

  const claimRes = await apiJson<{ claimedCount: number; orders: Array<{ id: string }> }>(
    '/api/account/claim-orders',
    {
      method: 'POST',
      token: secondReg.data.token,
      body: { orderIds: [claimedOrderId] },
    }
  );
  assert.equal(claimRes.status, 200);
  assert.ok(claimRes.data.claimedCount >= 1);
  assert.ok(claimRes.data.orders.some((o) => o.id === claimedOrderId));

  // Rafiq cannot cancel Nadia's order
  const crossUserCancel = await apiJson(`/api/orders/${encodeURIComponent(claimedOrderId)}/action`, {
    method: 'POST',
    headers: { Cookie: cookiePair, 'X-Kinto-Request': '1' },
    body: { action: 'cancel', reason: 'Unauthorized attempt' },
  });
  assert.equal(crossUserCancel.status, 403);

  // Authenticated review submission succeeds for signed-in user (when policy does not require prior delivered purchase, or fails with 403 if enabled)
  const reviewRes = await apiJson<{ review?: { author: string } }>('/api/products/prod-aeterna-headphones/reviews', {
    method: 'POST',
    headers: { Cookie: cookiePair, 'X-Kinto-Request': '1' },
    body: { rating: 5, title: 'Crisp studio tuning', comment: 'Clean build quality and neutral staging.' },
  });
  assert.equal(reviewRes.status, 201);
  assert.equal(reviewRes.data.review?.author, 'Rafiqul Islam');

  // Logout clears ks_session cookie and invalidates session
  const logoutRes = await apiJson<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
    headers: { Cookie: cookiePair, 'X-Kinto-Request': '1' },
  });
  assert.equal(logoutRes.status, 200);
  assert.equal(logoutRes.data.ok, true);
  const clearedCookie = logoutRes.setCookies.find((c) => c.startsWith('ks_session='));
  assert.ok(clearedCookie && /Max-Age=0/i.test(clearedCookie), 'Expected Max-Age=0 session cookie clearance');

  const postLogoutSession = await apiJson<{ authenticated: boolean }>('/api/auth/session', {
    headers: { Cookie: cookiePair },
  });
  assert.equal(postLogoutSession.status, 200);
  assert.equal(postLogoutSession.data.authenticated, false);
});

test('Public policy endpoints, historical snapshot projection, and Admin Policy CMS RBAC workflow succeed end-to-end', async () => {
  const pubRes = await apiJson<{
    policies: Array<{ id: string; slug: string; currentVersion: string }>;
    policyFactsPublic: { returnWindowDays: number; defectReportHours: number };
    cookieInventory: Array<{ key: string }>;
  }>('/api/policies');
  assert.equal(pubRes.status, 200);
  assert.equal(pubRes.data.policies.length, 20);
  assert.equal(pubRes.data.policyFactsPublic.returnWindowDays, 14);
  assert.equal(pubRes.data.policyFactsPublic.defectReportHours, 48);
  assert.ok(pubRes.data.cookieInventory.length >= 6);
  assert.equal(/\[CONFIRM\s+/i.test(pubRes.text), false);

  // Unauthenticated and customer access to /api/admin/policies blocked
  assert.equal((await apiJson('/api/admin/policies')).status, 401);
  const custLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'rafiq.islam@kintostudio.bd', password: 'studio2026' },
  });
  assert.equal(
    (await apiJson('/api/admin/policies', { token: custLogin.data.token })).status,
    403
  );

  // Admin logs in and exercises Draft (with XSS payload) -> Review -> Publish
  const adminLogin = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@kintostudio.bd', password: 'admin2026' },
  });
  assert.equal(adminLogin.status, 200);

  const adminPolicies = await apiJson<{
    policies: Array<{ slug: string; applicability: string; currentVersion: string }>;
  }>('/api/admin/policies', { token: adminLogin.data.token });
  assert.equal(adminPolicies.status, 200);
  assert.equal(adminPolicies.data.policies.length, 30);

  const originalPromoVer =
    adminPolicies.data.policies.find((p) => p.slug === 'promo-terms')?.currentVersion || '2026.11';

  const saveDraft = await apiJson<{ policy: { status: string; draftContent?: { summary: string } } }>(
    '/api/admin/policies/promo-terms/draft',
    {
      method: 'POST',
      token: adminLogin.data.token,
      body: {
        title: 'Promotions, Coupon Codes & Offer Terms',
        summary: 'Updated promotional transparency.<script>evil()</script>',
        sections: [
          {
            id: 'promo-e2e',
            heading: 'Single Promo Stack Rule',
            paragraphs: ['Only one coupon applies per order quote.'],
          },
        ],
        changeNote: 'E2E compliance revision',
      },
    }
  );
  assert.equal(saveDraft.status, 200);
  assert.equal(saveDraft.data.policy.status, 'draft');
  assert.equal(saveDraft.data.policy.draftContent?.summary.includes('<script>'), false);

  const reviewRes = await apiJson<{ policy: { status: string } }>(
    '/api/admin/policies/promo-terms/transition',
    {
      method: 'POST',
      token: adminLogin.data.token,
      body: { action: 'submit_review' },
    }
  );
  assert.equal(reviewRes.status, 200);
  assert.equal(reviewRes.data.policy.status, 'review');

  const publishRes = await apiJson<{
    policy: { status: string; currentVersion: string };
    newVersionPublished?: { version: string };
  }>('/api/admin/policies/promo-terms/transition', {
    method: 'POST',
    token: adminLogin.data.token,
    body: { action: 'publish' },
  });
  assert.equal(publishRes.status, 200);
  assert.equal(publishRes.data.policy.status, 'published');
  assert.notEqual(publishRes.data.policy.currentVersion, originalPromoVer);

  // Verify historical snapshot query returns previous immutable version
  const oldSnapshot = await apiJson<{
    policy: { currentVersion: string };
    requestedVersion: string;
  }>(`/api/policies/promo-terms?version=${encodeURIComponent(originalPromoVer)}`);
  assert.equal(oldSnapshot.status, 200);
  assert.equal(oldSnapshot.data.policy.currentVersion, originalPromoVer);

  // Owner facts update syncs public returnWindowDays
  const factsPatch = await apiJson<{
    policyFacts: { returnWindowDays: number };
  }>('/api/admin/policies/facts', {
    method: 'PATCH',
    token: adminLogin.data.token,
    body: { returnWindowDays: 14, supportHours: 'Sat-Thu 09:00-19:00 BST' },
  });
  assert.equal(factsPatch.status, 200);
  assert.equal(factsPatch.data.policyFacts.returnWindowDays, 14);

  // Localized /api/policies, /api/policies/:slug, and /api/storefront/state across all non-English locales
  const localeChecks: Array<{ lang: string; titlePattern: RegExp; lawPattern: RegExp }> = [
    { lang: 'bn', titlePattern: /[\u0980-\u09FF]/, lawPattern: /[\u0980-\u09FF]/ },
    { lang: 'hi', titlePattern: /[\u0900-\u097F]/, lawPattern: /[\u0900-\u097F]/ },
    { lang: 'ar', titlePattern: /[\u0600-\u06FF]/, lawPattern: /[\u0600-\u06FF]/ },
    { lang: 'es', titlePattern: /Términos|Política|Devoluciones|Privacidad|Envío/i, lawPattern: /Leyes|Bangladés/i },
    { lang: 'fr', titlePattern: /Conditions|Politique|Retour|Confidentialité|Livraison/i, lawPattern: /Lois|Bangladesh/i },
  ];

  for (const { lang, titlePattern, lawPattern } of localeChecks) {
    const listRes = await apiJson<{
      policies: Array<{ id: string; title: string; sections: Array<{ heading: string }> }>;
      policyFactsPublic: { governingLaw: string; competentCourts: string };
      cookieInventory: Array<{ classification: string; purpose: string }>;
    }>(`/api/policies?lang=${lang}`);
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.policies.length, 20);
    const terms = listRes.data.policies.find((p) => p.id === 'terms');
    assert.ok(terms);
    assert.match(terms.title, titlePattern);
    assert.match(listRes.data.policyFactsPublic.governingLaw, lawPattern);
    assert.ok(listRes.data.cookieInventory.length >= 6);

    const singleRes = await apiJson<{
      policy: { id: string; title: string; sections: Array<{ heading: string }> };
    }>(`/api/policies/return-policy?lang=${lang}`);
    assert.equal(singleRes.status, 200);
    assert.match(singleRes.data.policy.title, titlePattern);
    assert.ok(singleRes.data.policy.sections.length > 0);
  }

  const syncAr = await apiJson<{
    publishedPolicies: Array<{ id: string; title: string }>;
    policyFactsPublic: { governingLaw: string };
  }>('/api/storefront/state?lang=ar');
  assert.equal(syncAr.status, 200);
  assert.equal(syncAr.data.publishedPolicies.length, 20);
  assert.match(syncAr.data.policyFactsPublic.governingLaw, /[\u0600-\u06FF]/);
});



