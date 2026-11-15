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
  } = {}
): Promise<{ status: number; data: T; text: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
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
  return { status: res.status, data, text };
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

