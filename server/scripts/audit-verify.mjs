#!/usr/bin/env node
// Pricing-audit verification harness.
//
// Runs a battery of scenarios against a live server on :4000 and prints a
// pass/fail table. Each scenario sets up DB state, calls /orders/preview
// (and sometimes /orders to verify persistence), and compares numeric
// fields against an explicit expectation.
//
// Run after `npm run dev` is up:
//   node scripts/audit-verify.mjs

const BASE = 'http://localhost:4000/api';

function readEnv(file) {
  // Minimal .env parser so we don't need a dotenv dep here.
  // eslint-disable-next-line no-undef
  const text = require('node:fs').readFileSync(file, 'utf8');
  const out = {};
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

// ── tiny http helpers ──────────────────────────────────────────────────────
async function http(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function login() {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const env = require('node:fs').readFileSync(
    new URL('../.env', import.meta.url), 'utf8'
  );
  const username = (env.match(/^ADMIN_USERNAME=(.*)$/m) || [])[1] || 'admin';
  const password = (env.match(/^ADMIN_PASSWORD=(.*)$/m) || [])[1];
  if (!password) throw new Error('ADMIN_PASSWORD missing in server/.env');
  const { json } = await http('POST', '/auth/login', { body: { username, password } });
  if (!json?.ok) throw new Error('Login failed: ' + JSON.stringify(json));
  return json.data.token;
}

// ── reporter ───────────────────────────────────────────────────────────────
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
}
function approxEqual(a, b, tol = 0.001) { return Math.abs(Number(a) - Number(b)) <= tol; }

// ── runner ─────────────────────────────────────────────────────────────────
const token = await login();
const auth = { token };

// Snapshot settings so we can restore them at the end.
const snap = (await http('GET', '/admin/settings', auth)).json.data;

async function setSettings(patch) {
  return http('PUT', '/admin/settings', { body: patch, ...auth });
}
async function preview(items, promoCode) {
  return http('POST', '/orders/preview', { body: { items, promoCode } });
}
async function createOrder(items, promoCode) {
  return http('POST', '/orders', {
    body: {
      customer: { name: 'Test', phone: '0779999999', address: 'amman, jordan' },
      items,
      promoCode,
    },
  });
}

// 0. clean slate ── disable tiers, disable delivery
await setSettings({
  quantityPricing: { enabled: false, tiers: [] },
  cartQuantityTiers: { enabled: false, tiers: [] },
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
});

// ── 1. single item, no promo ───────────────────────────────────────────────
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }]);
  const d = r.json.data;
  check('1. single item, no promo', approxEqual(d.subtotal, 12) && approxEqual(d.total, 12) && d.appliedOffer === null,
    `subtotal=${d.subtotal} total=${d.total}`);
}

// ── 2. per-product tier (none seeded by default; create one via admin) ─────
// We use a bulk-tier API: 3-for-30 cart-wide replacement. We test per-product later.
{
  await setSettings({ cartQuantityTiers: { enabled: true, tiers: [{ minQty: 3, totalPrice: 30 }], excessUnitPrice: 5 } });
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 3 }]);
  const d = r.json.data;
  // 3 × 12 = 36, but cart tier replaces with 30
  check('2. cart-wide tier overrides subtotal', approxEqual(d.subtotal, 30) && approxEqual(d.total, 30),
    `subtotal=${d.subtotal} (expected 30)`);
}

// ── 2b. cart-wide tier CAPS at highest tier — excess at flat 5 JOD ─────────
{
  // Tier: 3 for 30 JOD. Cap = 3. excessUnitPrice = 5.
  // qty=5 → 30 + 2 × 5 = 40
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 5 }]);
  const d = r.json.data;
  check('2b. cart-tier caps; excess at 5 JOD/bottle', approxEqual(d.subtotal, 40) && approxEqual(d.total, 40),
    `qty=5 subtotal=${d.subtotal} (expected 40 = 30 + 2*5)`);
}

// ── 2c. far beyond cap — total scales linearly at 5 JOD ────────────────────
{
  // qty=10 → 30 + 7 × 5 = 65
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 10 }]);
  const d = r.json.data;
  check('2c. cart-tier cap holds at large qty', approxEqual(d.subtotal, 65) && approxEqual(d.total, 65),
    `qty=10 subtotal=${d.subtotal} (expected 65 = 30 + 7*5)`);
}

// ── 2d. excessUnitPrice can be customised ──────────────────────────────────
{
  await setSettings({ cartQuantityTiers: { enabled: true, tiers: [{ minQty: 3, totalPrice: 30 }], excessUnitPrice: 8 } });
  // qty=5 → 30 + 2 × 8 = 46
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 5 }]);
  const d = r.json.data;
  check('2d. admin-configurable excess rate', approxEqual(d.subtotal, 46),
    `qty=5 subtotal=${d.subtotal} (expected 46 = 30 + 2*8)`);
  await setSettings({ cartQuantityTiers: { enabled: true, tiers: [{ minQty: 3, totalPrice: 30 }], excessUnitPrice: 5 } });
}

// ── 3. global % tier ───────────────────────────────────────────────────────
{
  await setSettings({
    cartQuantityTiers: { enabled: false, tiers: [] },
    quantityPricing: { enabled: true, tiers: [{ minQty: 2, discountPercent: 25 }] },
  });
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 2 }]);
  const d = r.json.data;
  // 2 × 12 × 0.75 = 18
  check('3. global % tier applies', approxEqual(d.subtotal, 18) && approxEqual(d.total, 18),
    `subtotal=${d.subtotal} (expected 18)`);
}

// ── reset to baseline ──────────────────────────────────────────────────────
await setSettings({
  quantityPricing: { enabled: false, tiers: [] },
  cartQuantityTiers: { enabled: false, tiers: [] },
});

// ── 4. percentage promo applied ────────────────────────────────────────────
const save10 = (await http('POST', '/admin/offers', {
  body: { title: 'Save 10', description: '', type: 'percentage', discountPercent: 10, promoCode: 'SAVE10', productIds: [], features: [], active: true },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 2 }], 'SAVE10');
  const d = r.json.data;
  // subtotal 24, 10% off = 2.4, total 21.6
  check('4. percentage promo applies', approxEqual(d.subtotal, 24) && approxEqual(d.discount, 2.4) && approxEqual(d.total, 21.6),
    `subtotal=${d.subtotal} discount=${d.discount} total=${d.total}`);
}

// ── 5. fixed promo applied ─────────────────────────────────────────────────
const flat5 = (await http('POST', '/admin/offers', {
  body: { title: 'Flat 5 off', description: '', type: 'fixed', discountAmount: 5, promoCode: 'FLAT5', productIds: [], features: [], active: true },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 2 }], 'FLAT5');
  const d = r.json.data;
  // subtotal 24, fixed -5 = 19
  check('5. fixed promo applies', approxEqual(d.discount, 5) && approxEqual(d.total, 19),
    `discount=${d.discount} total=${d.total}`);
}

// ── 6. promo > subtotal capped at subtotal ─────────────────────────────────
const huge = (await http('POST', '/admin/offers', {
  body: { title: 'Huge', description: '', type: 'fixed', discountAmount: 999, promoCode: 'HUGE', productIds: [], features: [], active: true },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'HUGE');
  const d = r.json.data;
  check('6. discount caps at subtotal', approxEqual(d.discount, 12) && approxEqual(d.total, 0),
    `discount=${d.discount} total=${d.total}`);
}

// ── 7. invalid promo rejected ──────────────────────────────────────────────
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'NOPE');
  check('7. invalid promo → PROMO_INVALID', r.status === 422 && r.json.error.code === 'PROMO_INVALID',
    `status=${r.status} code=${r.json?.error?.code}`);
}

// ── 8. expired promo rejected ──────────────────────────────────────────────
const expired = (await http('POST', '/admin/offers', {
  body: { title: 'Expired', description: '', type: 'percentage', discountPercent: 10, promoCode: 'EXPIRED', productIds: [], features: [], active: true, endsAt: '2020-01-01T00:00:00Z' },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'EXPIRED');
  check('8. expired promo → PROMO_EXPIRED', r.status === 422 && r.json.error.code === 'PROMO_EXPIRED',
    `code=${r.json?.error?.code}`);
}

// ── 9. future-dated promo rejected ─────────────────────────────────────────
const future = (await http('POST', '/admin/offers', {
  body: { title: 'Future', description: '', type: 'percentage', discountPercent: 10, promoCode: 'FUTURE', productIds: [], features: [], active: true, startsAt: '2099-01-01T00:00:00Z' },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'FUTURE');
  check('9. future promo → PROMO_NOT_STARTED', r.status === 422 && r.json.error.code === 'PROMO_NOT_STARTED',
    `code=${r.json?.error?.code}`);
}

// ── 10. inactive promo rejected ────────────────────────────────────────────
const inactive = (await http('POST', '/admin/offers', {
  body: { title: 'Inactive', description: '', type: 'percentage', discountPercent: 10, promoCode: 'INACTIVE', productIds: [], features: [], active: false },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'INACTIVE');
  // findByPromoCode filters on active=1 → returns null → reports PROMO_INVALID
  check('10. inactive promo rejected', r.status === 422 && /PROMO_/.test(r.json.error.code),
    `code=${r.json?.error?.code}`);
}

// ── 11. wrong-type (bundle) code rejected ──────────────────────────────────
// Create a bundle offer that also has a promo_code, just to test the type gate.
const bundleWithCode = (await http('POST', '/admin/offers', {
  body: { title: 'Bundle code', description: '', type: 'bundle', perfumeCount: 3, price: 20, promoCode: 'BUNDLECODE', productIds: [], features: [], active: true },
  ...auth,
})).json.data;
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }], 'BUNDLECODE');
  check('11. bundle-type code → PROMO_WRONG_TYPE', r.status === 422 && r.json.error.code === 'PROMO_WRONG_TYPE',
    `code=${r.json?.error?.code}`);
}

// ── 12. delivery fee added ─────────────────────────────────────────────────
await setSettings({ deliveryFee: 3, freeDeliveryThreshold: 0 });
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 1 }]);
  const d = r.json.data;
  check('12. delivery fee added', approxEqual(d.deliveryFee, 3) && approxEqual(d.total, 15),
    `deliveryFee=${d.deliveryFee} total=${d.total}`);
}

// ── 13. free-delivery threshold waives fee ─────────────────────────────────
await setSettings({ deliveryFee: 3, freeDeliveryThreshold: 20 });
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 2 }]);
  const d = r.json.data;
  // subtotal 24 ≥ 20 → free delivery, total = 24
  check('13. free-delivery threshold waives fee', approxEqual(d.deliveryFee, 0) && approxEqual(d.total, 24),
    `deliveryFee=${d.deliveryFee} total=${d.total}`);
}

// ── 14. free-delivery threshold uses PRE-discount subtotal ─────────────────
{
  const r = await preview([{ productId: "p050", size: '100ml', quantity: 2 }], 'SAVE10');
  const d = r.json.data;
  // subtotal pre-discount = 24 ≥ 20, so deliveryFee = 0
  // discount = 2.4, total = (24 - 2.4) + 0 = 21.6
  check('14. free-delivery uses PRE-discount subtotal', approxEqual(d.deliveryFee, 0) && approxEqual(d.total, 21.6),
    `deliveryFee=${d.deliveryFee} total=${d.total}`);
}

// ── 15. bundle item priced from offer ──────────────────────────────────────
await setSettings({ deliveryFee: 0, freeDeliveryThreshold: 0 });
{
  const r = await preview([{ productId: 'bundle:summer-5-for-25', size: '5 bottles', quantity: 1 }]);
  const d = r.json.data;
  check('15. bundle item uses offer.price (25 JOD)', approxEqual(d.subtotal, 25) && approxEqual(d.total, 25),
    `subtotal=${d.subtotal}`);
}

// ── 16. bundle bypasses cart-wide tier ────────────────────────────────────
await setSettings({ cartQuantityTiers: { enabled: true, tiers: [{ minQty: 1, totalPrice: 5 }] } });
{
  // Bundle + 1 catalog item: the cart-tier counts 1 non-bundle qty → totalPrice 5
  // Bundle stays at 25. Subtotal = 25 + 5 = 30.
  const r = await preview([
    { productId: 'bundle:summer-5-for-25', size: '5 bottles', quantity: 1 },
    { productId: "p050", size: '100ml', quantity: 1 },
  ]);
  const d = r.json.data;
  check('16. bundle excluded from cart-tier allocation',
    approxEqual(d.items[0].lineTotal, 25) && approxEqual(d.items[1].lineTotal, 5) && approxEqual(d.subtotal, 30),
    `bundle=${d.items[0].lineTotal} catalog=${d.items[1].lineTotal} subtotal=${d.subtotal}`);
}

// ── reset for persistence tests ────────────────────────────────────────────
await setSettings({
  quantityPricing: { enabled: false, tiers: [] },
  cartQuantityTiers: { enabled: false, tiers: [] },
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
});

// ── 17. /orders/preview matches /orders exactly ────────────────────────────
{
  const items = [{ productId: "p050", size: '100ml', quantity: 2 }];
  const code = 'SAVE10';
  const p = (await preview(items, code)).json.data;
  const o = (await createOrder(items, code)).json.data;
  check('17. preview total == create total (no drift)',
    approxEqual(p.total, o.total) && approxEqual(p.subtotal, o.subtotal) && approxEqual(p.discount, o.discount),
    `preview total=${p.total} create total=${o.total}`);
}

// ── 18. persisted order has discount + applied_promo_code ──────────────────
{
  const o = (await createOrder([{ productId: "p050", size: '100ml', quantity: 1 }], 'SAVE10')).json.data;
  const fetched = (await http('GET', `/admin/orders/${o.id}`, auth)).json.data;
  check('18. discount + applied_promo_code persisted',
    approxEqual(fetched.discount, 1.2) && fetched.appliedPromoCode === 'SAVE10',
    `discount=${fetched.discount} code=${fetched.appliedPromoCode}`);
}

// ── 19. audit log written for offer creation ──────────────────────────────
{
  const r = await http('GET', '/admin/audit/pricing?entity=offers', auth);
  const rows = r.json.data;
  const hit = rows.find(x => x.entityKey === save10.id);
  check('19. audit log records offer create', !!hit, hit ? `actor=${hit.actor} note=${hit.note}` : 'no row found');
}

// ── 20. audit log written for settings change ─────────────────────────────
{
  const r = await http('GET', '/admin/audit/pricing?entity=settings', auth);
  const hits = r.json.data.filter(x => x.entityKey === 'pricing' || x.entityKey === 'cartQuantityTiers');
  check('20. audit log records settings change', hits.length > 0, `${hits.length} settings-audit rows`);
}

// ── cleanup: delete test offers, restore settings ──────────────────────────
for (const o of [save10, flat5, huge, expired, future, inactive, bundleWithCode]) {
  if (o?.id) await http('DELETE', `/admin/offers/${o.id}`, auth);
}
await setSettings({
  quantityPricing: snap.quantityPricing,
  cartQuantityTiers: snap.cartQuantityTiers,
  deliveryFee: snap.deliveryFee,
  freeDeliveryThreshold: snap.freeDeliveryThreshold,
});

// ── summary ────────────────────────────────────────────────────────────────
const passed = results.filter(r => r.ok).length;
console.log(`\n${passed}/${results.length} scenarios passed`);
process.exit(passed === results.length ? 0 : 1);
