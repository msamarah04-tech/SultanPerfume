# Al Sultan Perfumes — Project Overview

## At a Glance

| Item | Detail |
|---|---|
| **Brand** | السلطان للعطور (Al Sultan Perfumes) |
| **Market** | Amman, Jordan — Arabic-only, RTL |
| **Type** | Boutique luxury perfume e-commerce SPA |
| **Fulfillment** | Orders sent via WhatsApp (no payment gateway) |
| **Currency** | JOD (د.أ) |
| **Products** | 109 perfumes in catalog |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 + `tailwindcss-rtl` plugin |
| Animations | Framer Motion 12 |
| Icons | Lucide React |
| State | React Context API + localStorage |
| Fonts | Amiri (headings) + Tajawal (body) via Google Fonts |
| AI SDK | @google/genai 2.3.0 (available, not yet wired) |
| Build | Vite, no TypeScript — pure JSX |
| Backend | Express + better-sqlite3 (port 4000) |
| Auth | JWT admin sessions |
| Realtime | Server-Sent Events (new orders → admin) |

---

## Architecture

**SPA frontend + Express/SQLite backend.** Two cooperating layers:

- **Frontend (Vite SPA)** — React 19 store + admin UI; cart persisted to `localStorage`, admin JWT in `sessionStorage`.
- **Backend (`server/`, port 4000)** — Express + better-sqlite3. Owns the source of truth for products, prices, offers, orders, settings, and feedback. Pricing is **server-authoritative** — the frontend mirrors the math for UX but the server always recomputes on order submit.
- **Seed** — `src/data/products.json` (109 items) is loaded into SQLite on first boot; subsequent edits happen through the admin API.

Orders flow: customer fills checkout form → frontend posts items to `POST /orders` → server recomputes prices and persists → response includes a pre-built Arabic WhatsApp link the customer opens to confirm with the owner.

---

## Pages & Routes

### Public (RTL store)

| Route | Page | Purpose |
|---|---|---|
| `/` | `Home.jsx` | Hero video, featured products, newsletter |
| `/shop` | `Shop.jsx` | Full catalog with category filters |
| `/product/:id` | `ProductDetail.jsx` | Product detail, size selector, scent pyramid |
| `/offer/:offerId` | `OfferSelection.jsx` | Bundles & special offers |
| `/cart` | `Cart.jsx` | Cart management |
| `/checkout` | `Checkout.jsx` | Customer info → WhatsApp order |
| `/order-confirmed/:id` | `OrderConfirmed.jsx` | Order confirmation |
| `/about` | `About.jsx` | Brand story |
| `/contact` | `Contact.jsx` | Contact info + form |

### Admin (LTR wrapper, password-protected)

| Route | Page | Purpose |
|---|---|---|
| `/admin/login` | `Login.jsx` | Hardcoded password gate |
| `/admin` | `Dashboard.jsx` | Revenue, orders & products stats |
| `/admin/products` | `Products.jsx` | CRUD, search, import/export JSON |
| `/admin/products/new` | `ProductEdit.jsx` | Create product |
| `/admin/products/edit/:id` | `ProductEdit.jsx` | Edit product |
| `/admin/orders` | `Orders.jsx` | View orders, export CSV |
| `/admin/offers` | `Offers.jsx` | Manage promotions |
| `/admin/feedback` | `Feedback.jsx` | Customer testimonials |
| `/admin/settings` | `Settings.jsx` | Global config panel |

---

## Project Structure

```
perfume-store/
├── public/
│   ├── mp_.mp4                  # Hero background video
│   ├── hero.mp4 / hero-scrub.mp4
│   ├── logo.png
│   ├── icons.svg / favicon.svg
│   ├── images/                  # Product images
│   ├── frames/                  # Animation frames
│   └── generated/               # Generated assets
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminLayout.jsx  # Admin sidebar + LTR wrapper
│   │   ├── intro/
│   │   │   └── IntroAnimation.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MobileMenu.jsx
│   │   │   └── PageTransition.jsx
│   │   ├── product/
│   │   │   └── ProductCard.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── Skeleton.jsx
│   │       ├── ScrollProgressBar.jsx
│   │       ├── CursorSpotlight.jsx
│   │       ├── EmptyState.jsx
│   │       └── SpriteSequence.jsx
│   ├── context/                 # React Context providers
│   ├── data/
│   │   └── products.json        # 109-item product catalog
│   ├── lib/
│   │   ├── motion.js            # Framer Motion constants + RTL helpers
│   │   ├── format.js            # Price, date, numeral formatting
│   │   ├── storage.js           # localStorage wrappers + versioning
│   │   ├── validation.js        # Arabic form validation
│   │   └── whatsapp.js          # WhatsApp order message builder
│   ├── pages/
│   │   ├── admin/               # Admin panel pages
│   │   └── *.jsx                # Public store pages
│   ├── App.jsx                  # Root router
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global styles + Tailwind
│   └── config.js                # Central brand configuration
├── server/                      # Express + SQLite backend
│   ├── src/
│   │   ├── index.js             # Entry — boots Express on :4000
│   │   ├── app.js               # Route wiring, CORS, SSE
│   │   ├── config.js            # Server env config
│   │   ├── db/                  # schema.sql + seeder
│   │   ├── lib/
│   │   │   └── pricing.js       # Piaster math, tier resolvers, order totals
│   │   ├── middleware/          # JWT auth, error handler
│   │   ├── repositories/        # products, orders, offers, settings, feedback
│   │   ├── routes/              # public.* and admin.* route modules
│   │   └── schemas/             # Zod validation schemas
│   └── data/                    # SQLite db file (gitignored)
├── index.html                   # HTML root (lang="ar" dir="rtl")
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Design System

### Colors (`tailwind.config.js`)

| Token | Hex | Usage |
|---|---|---|
| `gold.DEFAULT` | `#D4AF37` | Primary brand accent |
| `gold.light` | `#E8C77E` | Hover states, subtle accents |
| `gold.dark` | `#B8941F` | Pressed states |
| `ivory` | `#FAF7F2` | Page background |
| `charcoal` | `#1A1A1A` | Body text |
| `jet` | `#0A0A0A` | Dark sections |

### Typography

| Font | Role |
|---|---|
| Amiri | Arabic serif headings |
| Tajawal | UI / body text |

### Animations

- Cinematic page transitions (Framer Motion `AnimatePresence`)
- Parallax hero scroll with sticky scrubbing
- Cursor spotlight effect (toggleable via `CONFIG.enableCursorSpotlight`)
- Scroll progress bar at page top
- Loading skeleton placeholders
- Frame sequence sprite player
- Stagger container variants for list reveals

### Numerals

Configurable via `CONFIG.numeralSystem`:
- `"arab"` → Eastern Arabic digits ٠١٢٣٤٥٦٧٨٩
- `"latn"` → Western digits 0123456789

---

## Key Library Files

| File | Purpose |
|---|---|
| `src/config.js` | Central brand config — WhatsApp, password, currency, delivery, social links |
| `src/lib/motion.js` | Easing/duration constants, `useReducedMotion()`, `isRTL()`, animation variants |
| `src/lib/format.js` | `formatPrice()`, `toEasternArabic()`, `formatDate()`, `generateOrderId()` |
| `src/lib/pricing.js` | `resolveTieredLineTotal()`, `resolveCartTier()`, `describeTiers()` — mirrors server math |
| `src/lib/api.js` | Typed fetch clients: `productsApi`, `ordersApi`, `offersApi`, `settingsApi`, `adminApi` |
| `src/lib/storage.js` | `storage.get/set`, `getProducts()`, `persistProducts()` with version fingerprint |
| `src/lib/validation.js` | Arabic error messages for required, min-length, Jordan phone regex |
| `src/lib/whatsapp.js` | `buildOrderMessage()`, `buildWaMeLink()` — formats Arabic WhatsApp order text |
| `server/src/lib/pricing.js` | `jodToPiaster()`, `piasterToJod()`, `computeOrderTotals()` — authoritative pricing |

---

## Product Data Shape

```json
{
  "id": "p001",
  "name": "Ana Abiyedh - Lattafa",
  "brand": "Lattafa",
  "description": "...",
  "category": "unisex | women | men",
  "sizes": [
    { "size": "100ml", "price": 0 }
  ],
  "stock": 10,
  "topNotes": "",
  "heartNotes": "",
  "baseNotes": "",
  "images": ["/images/products/p001.png"],
  "featured": true,
  "active": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

109 products total (p001–p109). Seed prices are in **JOD** (whole units); on first boot the seeder converts them to piasters and persists them into SQLite. After that, the admin panel is the authoritative editor.

---

## Pricing, Buying & Discounts

Pricing is **server-authoritative**: the frontend mirrors every formula in `src/lib/pricing.js` purely for UX (live cart totals, tier ladder display), but the order endpoint recomputes everything from the database before persisting. The client price is never trusted.

### Price Model

| Concern | Detail |
|---|---|
| Display currency | JOD (د.أ) — `CONFIG.currency`, `CONFIG.currencySymbol` |
| DB storage | **INTEGER piasters** (1 JOD = 1000 piasters) — avoids float rounding |
| Seed JSON | JOD whole units in `sizes[].price` (e.g. `12` = 12 JOD) |
| Conversion | `jodToPiaster()` / `piasterToJod()` in `server/src/lib/pricing.js` |
| Formatting | `formatPrice()` in `src/lib/format.js` — respects `CONFIG.numeralSystem` (Eastern Arabic by default) |

### Buying Flow

```
ProductDetail  → pick size + qty → resolveTieredLineTotal() → "Add to Cart" / "Buy Now"
       │
       ▼
CartContext    → cart in localStorage; refreshPrices() pulls fresh basePrice + tiers from API
       │         priceCart() re-applies per-line tiers, then cart-wide tier, exposes subtotal
       ▼
Cart page      → qty adjustments, delivery fee preview, activeCartTier badge
       │
       ▼
Checkout      → form (name, phone, city, district, street, building, landmark, notes)
       │       + optional promo code (validated against /offers list, applied to subtotal)
       │
       ▼
POST /orders   → server recomputes prices, totals, delivery fee server-side
       │       → generates order id `ORD-YYMMDD-XXXX`, inserts order + order_items
       │       → broadcasts to admins via SSE
       ▼
OrderConfirmed → clears cart, shows order id, opens pre-built Arabic WhatsApp link to owner
```

### Quantity Tiers (three layers)

Tiers compose in this order — first match wins per line, then the cart-wide tier can replace the subtotal:

| Layer | Source | Shape | Semantics |
|---|---|---|---|
| **Per-product** | `product_quantity_tiers` table | `{ minQty, unitPrice }` | `unitPrice` is the **line total** for that bracket (admin enters "buying N costs X"), not a per-bottle price |
| **Global %** | `settings.quantityPricing` | `{ enabled, tiers: [{ minQty, discountPercent }] }` | Fallback when product has no per-product tiers — % off the line |
| **Cart-wide total** | `settings.cartQuantityTiers` | `{ enabled, tiers: [{ minQty, totalPrice }] }` | When total non-bundle qty meets threshold, **replaces** the subtotal with a fixed JOD figure (allocated proportionally across items) |

Bundle items never participate in tier math — they are always priced at their fixed bundle price.

### Offers & Discounts

Offers live in the `offers` table and are managed at `/admin/offers`. Three types:

| Type | Fields | Effect |
|---|---|---|
| `bundle` | `perfumeCount`, `price`, `features[]` | Customer picks N perfumes on `/offer/:offerId`; cart line ID becomes `bundle:<offerId>` and is priced at the fixed bundle `price`. Excluded from quantity tiers. |
| `percentage` | `promoCode`, `discountPercent` | At checkout: `discount = subtotal × discountPercent / 100` |
| `fixed` | `promoCode`, `discountAmount` | At checkout: `discount = discountAmount` (flat JOD off) |

Promo codes are validated client-side against `offersApi.list()` and then re-validated on the server during order creation. An `active: false` offer is rejected. `total = max(0, subtotal − discount + deliveryFee)`.

### Delivery Fee

Controlled by two `settings` keys (also mirrored in `src/config.js` for static fallback):

- `deliveryFee` (JOD) — flat per-order charge
- `freeDeliveryThreshold` (JOD) — if `> 0` and `subtotal ≥ threshold`, delivery is waived

Both default to `0` (no charge, no threshold) until an admin configures them.

### Order Totals (server formula)

```
subtotal       = Σ line_total                       (after per-line tiers)
subtotal      ← cartTier.totalPrice                 (if cart-wide tier matched)
discount       = promo discount (percentage or fixed, capped at subtotal)
deliveryFee    = 0 if (freeDeliveryThreshold > 0 && subtotal ≥ threshold) else CONFIG.deliveryFee
total          = max(0, subtotal − discount) + deliveryFee
```

All math runs in piasters server-side via `computeOrderTotals()` in `server/src/lib/pricing.js`, then the result is mapped back to JOD for the API response.

### Key Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/products` | Catalog with sizes + tiers (piasters → JOD on the way out) |
| `GET` | `/offers` | Active offers (bundles + promo codes) |
| `GET` | `/settings/public` | `deliveryFee`, `freeDeliveryThreshold`, `quantityPricing`, `cartQuantityTiers` |
| `POST` | `/orders` | Create order — recomputes all pricing server-side, returns order + totals |
| `GET` | `/admin/orders` (JWT) | List orders with status filter; SSE stream for live updates |

---

## Central Configuration (`src/config.js`)

```js
export const CONFIG = {
  brandName: "السلطان للعطور",
  tagline: "فنّ الرائحة",
  whatsappNumber: "9627XXXXXXXX",       // Jordan format: 962 + number, no +
  whatsappGroupInvite: "https://chat.whatsapp.com/XXXXX",
  contactEmail: "perfumealsultan@gmail.com",
  contactPhone: "+962 7 9019 5123",
  contactAddress: "عمّان، الأردن",
  socials: {
    instagram: "https://instagram.com/alsultanperfumejo",
    tiktok: "",
    snapchat: "",
  },
  currency: "JOD",
  currencySymbol: "د.أ",
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  adminPassword: "admin",               // MUST CHANGE before deploying
  enableCursorSpotlight: true,
  numeralSystem: "arab",                // 'arab' = ٠١٢٣, 'latn' = 0123
};
```

---

## Data Flow

```
products.json (seed, JOD)
       │  first boot
       ▼
   SQLite (piasters)  ◄──── Admin panel edits (JWT, /admin/* routes)
       │                       │
       │ GET /products         │ POST/PUT/DELETE
       ▼                       ▼
  React (api.js)         Live SSE stream → admin Dashboard / Orders
       │
       ▼
  CartContext (localStorage) ──── priceCart() mirrors server math
       │
       ▼
  Checkout form  ──── POST /orders (server recomputes totals)
       │
       ▼
  WhatsApp link  ──── wa.me/CONFIG.whatsappNumber?text=...
```

---

## Known Limitations & Pre-Deploy Checklist

- [ ] Change admin credentials / `JWT_SECRET` in the server env (default values must not ship)
- [ ] Set real `whatsappNumber` in `src/config.js` (currently placeholder `9627XXXXXXXX`)
- [ ] Review every product price + tier in the admin panel before launch (seeds may be placeholders)
- [ ] Configure `deliveryFee`, `freeDeliveryThreshold`, `quantityPricing`, `cartQuantityTiers` in admin Settings
- [ ] Use CDN URLs for product images (keep `images[]` light; large Base64 bloats the DB and API responses)
- [ ] Back up `server/data/*.sqlite` regularly — it is the source of truth for orders + edits
- [ ] No payment processing — fulfillment is still manual via WhatsApp
- [ ] No inventory deduction on order — `stock` is decorative; admin must reconcile manually

---

## Development Commands

```bash
# Frontend (project root)
npm run dev      # Start dev server (Vite HMR) on :5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check

# Backend (server/)
cd server && npm run dev    # Start Express on :4000 (nodemon)
cd server && npm start      # Production server
```
