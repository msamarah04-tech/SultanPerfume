# Integration Audit — Al Sultan Perfumes
**Date:** 2026-05-21  
**Auditor:** Claude Code (automated + manual review)  
**Scope:** Backend integration health across all frontend features

---

## 1. Summary

Overall integration health is **good**. The core critical path (browse → cart → checkout → order confirmed → admin sees order → Excel export) is fully wired to the backend. Three disconnects were found and fixed. Two additional drifts in the order-display flow and price formatting require owner approval before fixing.

| Category | Count |
|---|---|
| Features fully connected | 15 |
| Features with drift (fixed) | 3 |
| Features with drift (RISKY — needs approval) | 2 |
| Pre-existing lint errors (out of scope) | 54 |
| Build errors | 0 |

---

## 2. Connection Map

| Frontend Feature | File(s) | Expected Endpoint | Method | Auth? | Status |
|---|---|---|---|---|---|
| Product catalog (storefront) | `Shop.jsx`, `Home.jsx` | `GET /api/products` | GET | No | ✅ Connected |
| Product detail | `ProductDetail.jsx` | `GET /api/products/:id` | GET | No | ✅ Connected (cache-then-API via `storage.js`) |
| Offers list (public) | `OfferSelection.jsx`, `Home.jsx`, `Shop.jsx` | `GET /api/offers` | GET | No | ✅ Connected |
| Public feedback (testimonials) | `Home.jsx` | `GET /api/feedback` | GET | No | ✅ Connected |
| Submit feedback | _(no storefront form)_ | `POST /api/feedback` | POST | No | ✅ Endpoint exists; no public submit form in UI — by design |
| Public settings | `Home.jsx` (homeSections) | `GET /api/settings/public` | GET | No | ✅ Connected |
| Contact info (Contact page) | `Contact.jsx` | `GET /api/settings/public` | GET | No | ✅ **Fixed** (was reading from static `CONFIG`) |
| Contact info (Footer) | `Footer.jsx` | `GET /api/settings/public` | GET | No | ✅ **Fixed** (was reading from static `CONFIG`) |
| Place order | `Checkout.jsx` | `POST /api/orders` | POST | No | ✅ Connected |
| View placed order | `OrderConfirmed.jsx` | `GET /api/orders/:id` | GET | No | ✅ Connected + **Fixed** (no error state) |
| Promo code validation | `Checkout.jsx` | `GET /api/offers` | GET | No | ✅ Connected (reuses offersApi.list()) |
| Admin login | `Login.jsx` + `AuthContext.jsx` | `POST /api/auth/login` | POST | No | ✅ Connected |
| Admin dashboard stats | `Dashboard.jsx` | `GET /api/admin/stats` | GET | Bearer | ✅ Connected |
| Admin products list | `Products.jsx` | `GET /api/admin/products` | GET | Bearer | ✅ Connected |
| Admin product create/edit | `ProductEdit.jsx` | `POST/PUT /api/admin/products/:id` | POST/PUT | Bearer | ✅ Connected |
| Admin product export | `Products.jsx` | `GET /api/admin/products/export` | GET | Bearer | ✅ Connected |
| Admin product import | `Products.jsx` | `POST /api/admin/products/import` | POST | Bearer | ✅ Connected |
| Admin orders list | `Orders.jsx` | `GET /api/admin/orders` | GET | Bearer | ✅ Connected |
| Admin order status patch | `Orders.jsx` | `PATCH /api/admin/orders/:id` | PATCH | Bearer | ✅ Connected |
| Admin CSV export | `Orders.jsx` | `GET /api/admin/orders/export` | GET | Bearer | ✅ Connected |
| Admin Excel export | `Orders.jsx` | `GET /api/admin/orders/export/excel` | GET | Bearer | ✅ Connected |
| Admin offers CRUD | `Offers.jsx` | `GET/POST/PUT/DELETE /api/admin/offers` | ALL | Bearer | ✅ Connected |
| Admin feedback moderation + create | `Feedback.jsx` | `GET/POST/PATCH/DELETE /api/admin/feedback` | ALL | Bearer | ✅ Connected |
| Admin settings | `Settings.jsx` | `GET/PUT /api/admin/settings` | GET/PUT | Bearer | ✅ Connected |
| Admin homepage layout | `HomepageLayout.jsx` | `GET/PUT /api/admin/settings` (homeSections) | GET/PUT | Bearer | ✅ Connected |
| Admin content management | _(no page implemented)_ | _(no route implemented)_ | — | — | ✅ Feature does not exist — not a gap |
| Cart | `CartContext.jsx` | _(localStorage by design)_ | — | — | ✅ Intentional — no API needed |
| JWT session | `AuthContext.jsx` | _(sessionStorage by design)_ | — | — | ✅ Intentional |
| Delivery fee display (Cart/Checkout preview) | `Cart.jsx`, `Checkout.jsx` | `GET /api/settings/public` | GET | No | ⚠️ Drift — reads static `CONFIG.deliveryFee` (RISKY) |
| Price formatting numeral system | `format.js` | `GET /api/settings/public` | GET | No | ⚠️ Drift — reads static `CONFIG.numeralSystem` / `currencySymbol` (RISKY) |

---

## 3. Findings

| ID | Severity | Feature | File:Line | What's Wrong | Fix Applied / Proposal | Status |
|---|---|---|---|---|---|---|
| F-001 | MEDIUM | Contact page info | `Contact.jsx:4` | `contactEmail`, `contactPhone`, `whatsappNumber` read from static `CONFIG`. Admin edits in Settings panel update the DB but the Contact page never reflects them. | Added `settingsApi.getPublic()` call; values fall back to `CONFIG` if API unreachable. | ✅ Fixed |
| F-002 | MEDIUM | Footer contact + socials | `Footer.jsx:4` | `contactEmail`, `contactPhone`, `tagline`, and `socials.*` read from static `CONFIG`. Admin changes in Settings never propagate to the footer. | Added `settingsApi.getPublic()` call; falls back to `CONFIG`. | ✅ Fixed |
| F-003 | MEDIUM | Delivery fee preview in Cart | `Cart.jsx:58-60` | Delivery fee/threshold shown in Cart sidebar comes from `CONFIG.deliveryFee` (both zero). If admin sets a non-zero delivery fee in Settings, Cart still shows "مجاني". Server always recomputes the correct fee on order submission — so the **charged amount is always correct** — but the pre-checkout display misleads the customer. | Propose: load `/api/settings/public` in Cart and use those values for display. | ⚠️ **Awaiting approval** |
| F-004 | MEDIUM | Price formatting everywhere | `format.js:1,10,13` | `formatPrice()` reads `numeralSystem` and `currencySymbol` from static `CONFIG`. Admin can change these in Settings, but all storefront prices ignore the change until a new build is deployed. | Propose: add a lightweight settings context that fetches `/api/settings/public` once at app root and passes numeral system + currency symbol to `format.js`. This touches every component that renders a price. | ⚠️ **Awaiting approval (architectural change)** |
| F-005 | HIGH | Order confirmed page blank on error | `OrderConfirmed.jsx:16` | On API failure the component called `console.error` and rendered `null` — a completely blank page with no message or escape route. | Added `loadError` state; catch sets it; UI shows Arabic error message + "متابعة التسوّق" button. | ✅ Fixed |

---

## 4. Fixes Applied

| # | File | Change |
|---|---|---|
| 1 | `src/pages/OrderConfirmed.jsx` | Added `loadError` state; API `.catch(() => setLoadError(true))`; renders Arabic error message + shop link when load fails instead of blank page |
| 2 | `src/pages/Contact.jsx` | Added `settingsApi.getPublic()` useEffect; `contactEmail`, `contactPhone`, `whatsappNumber` now read from API response, falling back to `CONFIG` values |
| 3 | `src/components/layout/Footer.jsx` | Added `settingsApi.getPublic()` useEffect; `contactEmail`, `contactPhone`, `tagline`, `socials` now read from API response, falling back to `CONFIG` values |

---

## 5. Needs Your Approval (RISKY)

### R-001 — Cart delivery fee display reads static CONFIG (F-003)

**File:** `src/pages/Cart.jsx:58-60`

**What's wrong:**
```js
const isFreeDelivery = CONFIG.freeDeliveryThreshold > 0 && subtotal >= CONFIG.freeDeliveryThreshold;
const deliveryFee = isFreeDelivery ? 0 : CONFIG.deliveryFee;
```
Both `CONFIG.deliveryFee` and `CONFIG.freeDeliveryThreshold` are `0`, so the cart always shows "مجاني". The server correctly recomputes delivery on order submission, so the **amount charged is always right**. But if you set a delivery fee in admin Settings, the cart page won't show it.

**Proposed fix:** Load `settingsApi.getPublic()` in Cart (mirroring what Contact.jsx now does) and use `settings.deliveryFee` / `settings.freeDeliveryThreshold` for the display estimate.

**Why it's RISKY:** Touches the order flow's price display. Currently `deliveryFee = 0` is also shown in `Checkout.jsx` (same pattern). Both files would need updating together to avoid a confusing inconsistency where Cart and Checkout show different values.

**Same issue in Checkout.jsx:** `Checkout.jsx:240-242` has the same hardcoded zero delivery fee for display. If approving R-001, both files should be fixed together.

---

### R-002 — `format.js` reads `numeralSystem` and `currencySymbol` from static CONFIG (F-004)

**File:** `src/lib/format.js:1,10,13`

**What's wrong:**
```js
import { CONFIG } from '../config';
// ...
const num = CONFIG.numeralSystem === 'arab' ? toEasternArabic(amount) : String(amount);
return `${num} ${CONFIG.currencySymbol}`;
```
Admin can change `numeralSystem` to "Latin" or `currencySymbol` to "JOD" in Settings — these save to the DB — but `format.js` is a static import, so **every price displayed in the app (storefront and admin) ignores the change**.

**Proposed fix:** Introduce a lightweight `SettingsContext` that fetches `/api/settings/public` once at app root (`App.jsx`), stores the result, and exposes `numeralSystem` and `currencySymbol`. `format.js` would become a function that accepts these values (or they'd be read from context inside a `useFormatPrice` hook).

**Why it's RISKY:** This is the most impactful change. It requires:
1. A new context/provider wrapping the app.
2. Updating every call site of `formatPrice()` — approximately 15 components.
3. Admin panels that currently use `formatCurrency()` would also be affected.

This is a meaningful refactor. I recommend handling it in a dedicated pass rather than mixing it into this audit fix.

---

## 6. Out of Scope (Observations)

| # | File | Observation |
|---|---|---|
| OBS-01 | `src/lib/storage.js:51,70` | Two empty `catch {}` blocks generate `no-empty` ESLint errors. Intentional silent swallows — add `// intentional` comment or `catch (_e) {}` to silence. |
| OBS-02 | Multiple files | 54 pre-existing ESLint errors (mostly `no-unused-vars`, `react-refresh/only-export-components`, `react-hooks` warnings). None are integration issues; none were introduced by this audit. |
| OBS-03 | `src/pages/admin/ProductEdit.jsx:38-50` | Loads product for editing via a direct `fetch()` instead of going through `adminApi`. The bearer token is included correctly and the URL uses `VITE_API_BASE_URL` — no security gap. Minor inconsistency with the rest of the admin, which uses `adminApi` helpers. |
| OBS-04 | `src/lib/format.js:29-33` | `generateOrderId()` is exported but the server generates order IDs on its own. This client-side function appears unused in the order flow (server-generated IDs are used). Verify it can be removed in a cleanup pass. |
| OBS-05 | `src/pages/admin/Offers.jsx` | Offer image is uploaded as a base64 Data URL inside the `imageUrl` field (stored in SQLite). For a small catalogue this is workable, but large images will bloat the DB and slow API responses. Out of scope for this audit. |
| OBS-06 | Build | Bundle is ~897 kB (228 kB gzip). Vite recommends splitting at >500 kB. Out of scope, but worth a future lazy-loading pass on admin pages. |
| OBS-07 | `src/config.js` | `adminPassword: "admin"` exists in the config. This is a dead field — admin auth is JWT-based via the server. The field can be removed in a cleanup pass. |

---

## 7. Static Audit Results

### localStorage usage
| Location | Key | Verdict |
|---|---|---|
| `CartContext.jsx:8,14` | `cart` | ✅ Intentional — client-only cart |
| `lib/storage.js:36,44,58` | `products_cache` | ✅ Intentional — stale-while-revalidate cache |
| `Shop.jsx:33,37` | `shopViewMode` | ✅ Intentional — UI preference |
| `admin/ProductEdit.jsx:112` | `geminiApiKey` | ✅ Intentional — local-only AI key, documented |
| `admin/Settings.jsx:130,131` | `geminiApiKey` | ✅ Same |

No suspicious localStorage reads of products, orders, offers, settings, or feedback were found outside the approved cache pattern.

### products.json imports
All four components that import `productsData` from `src/data/products.json` (`Home.jsx`, `Shop.jsx`, `ProductDetail.jsx`, `OfferSelection.jsx`) pass it **only as the `seedData` argument to `getProducts()`**. `getProducts()` immediately kicks off an API call and replaces the seed with live data. This is intentional and correct.

### Hardcoded localhost references
`api.js`, `Products.jsx`, `ProductEdit.jsx`, and `Orders.jsx` all use the pattern:
```js
import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
```
This is correct — the env var takes precedence in production; the fallback is only for local dev.

### WhatsApp / order-flow
No `src/lib/whatsapp.js` file exists. The only WhatsApp references are the contact-page link (`Contact.jsx`) and the admin settings field — both correct uses.

### Mock / placeholder data
`DEFAULT_OFFERS` and `DEFAULT_SUMMER_OFFER` are fallback constants used when the API returns an empty list. These are not hardcoded production data — they're graceful degradations. No `mockProducts`, `dummyOrders`, or similar arrays were found.

---

## 8. Verdict

**The critical path is fully operational:**
- Browse (products from DB) ✅
- Cart (localStorage, by design) ✅
- Checkout (POST /api/orders, server recomputes price) ✅
- Order confirmed (GET /api/orders/:id, + error state now added) ✅
- Admin sees order (GET /api/admin/orders) ✅
- Admin changes status (PATCH /api/admin/orders/:id) ✅
- Excel export (GET /api/admin/orders/export/excel) ✅
- Admin edits product → storefront reflects it ✅ (via cache-busting in storage.js)

**Two issues remain open and need your decision (see Section 5):**
1. **R-001:** Delivery fee display in Cart/Checkout shows static config — order charge is correct, but the display preview won't update if you change the delivery fee in admin Settings.
2. **R-002:** Price numeral system and currency symbol are baked in at build time — admin Settings changes to these won't take effect until a new build is deployed.

Please review Section 5 and confirm whether to proceed with these two fixes.
