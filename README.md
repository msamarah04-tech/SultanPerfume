# السلطان للعطور — Al Sultan Perfume Jordan — Project Overview

> **For AI assistants:** This README is the single source of truth for this codebase. Read it fully before answering questions or suggesting changes. The project has no backend — all state lives in the browser. Keep that constraint in mind at all times.

---

## What Is This?

A luxury e-commerce storefront for **السلطان للعطور** (Al Sultan Perfume Jordan, `@alsultanperfumejo`). It is a fully client-side React application — no server, no database, no payment gateway. Orders are sent to the seller via a pre-filled WhatsApp message. The admin dashboard is browser-only and secured by a hardcoded password in `src/config.js`.

**Live workflow:** Customer browses → adds to cart → checks out → WhatsApp message opens on seller's phone → seller fulfils manually.

**Language & Direction:** The site is Arabic-only, right-to-left (`dir="rtl" lang="ar"`). The admin panel is left-to-right (wrapped in `dir="ltr"`) and may stay in English for owner convenience.

---

## Tech Stack

| Layer | Tool | Version |
|---|---|---|
| UI framework | React | 19 |
| Build tool | Vite | 8 |
| Styling | Tailwind CSS | 3 |
| RTL plugin | tailwindcss-rtl | 0.9 |
| Animations | Framer Motion | 12 |
| Routing | React Router DOM | 7 |
| Icons | Lucide React | latest |
| Language | JavaScript (JSX) | ES modules |

No TypeScript. No backend framework. No state management library (Context API only).

---

## Project Structure

```
perfume-store/
├── public/
│   ├── mp_.mp4              # Hero background video (do not replace)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── config.js            # ← ALL brand settings live here
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Router, providers
│   ├── index.css            # Global styles + Tailwind directives
│   ├── components/
│   │   ├── admin/           # AdminLayout.jsx (dir="ltr" wrapper)
│   │   ├── intro/           # IntroAnimation.jsx (cinematic entry)
│   │   ├── layout/          # Navbar, Footer, MobileMenu, PageTransition
│   │   ├── product/         # ProductCard.jsx
│   │   └── ui/              # Button, Input, Modal, Toast, Skeleton, etc.
│   ├── context/
│   │   ├── AuthContext.jsx  # Admin session auth (sessionStorage)
│   │   ├── CartContext.jsx  # Cart state (localStorage)
│   │   ├── ToastContext.jsx # Global toast notifications
│   │   └── ProtectedRoute.jsx
│   ├── data/
│   │   └── products.json    # ← Source of truth for the product catalog
│   ├── lib/
│   │   ├── motion.js        # Framer Motion constants + isRTL() helper
│   │   ├── format.js        # formatPrice() — JOD + Eastern Arabic numerals
│   │   ├── storage.js       # localStorage helpers
│   │   ├── validation.js    # Form validation (Jordan phone regex)
│   │   └── whatsapp.js      # Builds the wa.me Arabic checkout message
│   └── pages/
│       ├── Home.jsx         # Hero (video bg + sticky scroll), featured, newsletter
│       ├── Shop.jsx         # Full product grid with filters
│       ├── ProductDetail.jsx
│       ├── Cart.jsx
│       ├── Checkout.jsx     # Collects customer info → fires WhatsApp redirect
│       ├── About.jsx
│       ├── Contact.jsx
│       ├── OrderConfirmed.jsx
│       ├── NotFound.jsx
│       └── admin/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── Products.jsx  # CRUD for products
│           ├── ProductEdit.jsx
│           ├── Orders.jsx    # View + export orders
│           └── Settings.jsx
```

---

## Configuration — `src/config.js`

This is the only file you need to edit to rebrand or reconfigure the store.

```js
export const CONFIG = {
  brandName: "السلطان للعطور",
  tagline: "فنّ الرائحة",

  whatsappNumber: "9627XXXXXXXX",   // Jordan: 962 + number, no + sign — FILL IN
  whatsappGroupInvite: "https://chat.whatsapp.com/XXXXX",

  contactEmail: "info@alsultanperfume.jo",
  contactPhone: "+962 7X XXX XXXX",
  contactAddress: "عمّان، الأردن",

  socials: {
    instagram: "https://instagram.com/alsultanperfumejo",
    tiktok: "",       // leave empty to hide — Footer skips empty-string socials
    snapchat: "",
  },

  currency: "JOD",
  currencySymbol: "د.أ",
  deliveryFee: 3,               // flat fee in JOD
  freeDeliveryThreshold: 50,    // free delivery above 50 JOD; 0 to disable

  adminPassword: "admin",       // CHANGE before deploying
  enableCursorSpotlight: true,

  numeralSystem: "arab",        // 'arab' = ٠١٢٣ Eastern, 'latn' = 0123 Western
};
```

---

## Localization

The site is **Arabic-only, RTL**.

- `index.html`: `<html lang="ar" dir="rtl">`
- Fonts: **Amiri** (serif, headings) + **Tajawal** (sans-serif, body/UI) via Google Fonts
- Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) used throughout instead of physical `ml-`, `mr-`, etc.
- Plugin: `tailwindcss-rtl` registered in `tailwind.config.js`
- Price display: Eastern Arabic numerals via `toEasternArabic()` in `src/lib/format.js`
- Directional Framer Motion animations use `isRTL()` helper from `src/lib/motion.js`
- Admin panel is wrapped in `dir="ltr"` and may remain in English
- Phone/email inline runs wrapped in `<bdi dir="ltr">` to prevent bidi reordering
- Phone input field has `dir="ltr"` so Jordan numbers render correctly
- Phone validation regex accepts Jordanian numbers: `07[7-9] + 7 digits`, also `+962`/`962` prefix

---

## Design System

### Colors (Tailwind custom tokens)
| Token | Hex | Usage |
|---|---|---|
| `gold` | `#D4AF37` | Accents, CTAs, borders |
| `gold-light` | `#E8C77E` | Hover states |
| `gold-dark` | `#B8941F` | Pressed states |
| `ivory` | `#FAF7F2` | Page backgrounds |
| `jet` | `#0A0A0A` | Dark sections, hero |
| `charcoal` | `#1A1A1A` | Body text |

### Typography
- **Serif** — Amiri → headings, hero text, prices (elegant Arabic serif)
- **Sans** — Tajawal → body, labels, UI (clean Arabic sans-serif)

No `tracking-*` or `uppercase` on Arabic text — both break Arabic letterforms.

### Animation Constants (`src/lib/motion.js`)
```js
EASE.standard   // ease-out-expo — most UI transitions
EASE.cinematic  // ease-in-out-cubic — hero and intros
EASE.gentle     // material-style — page transitions

DURATION.micro     // 0.2s — button presses
DURATION.standard  // 0.45s — page elements
DURATION.cinematic // 0.9s — hero, intro overlay

isRTL()  // runtime RTL check — used to flip x-axis animations
```
Always import `useReducedMotion()` from `src/lib/motion.js` and pass it to animation variants to respect the system accessibility preference.

---

## Key Pages — What They Do

### `Home.jsx`
- Sticky hero section (`200vh` scroll area) with `mp_.mp4` as video background
- Hero overlay text: **عطور تروي حكاية** / **من قلب الأردن — عبق الشرق وأناقة الغرب**
- Scroll-driven animations via `useScroll + useTransform`: video parallaxes up, scales, and fades as you scroll; headline lifts and disappears
- Story teaser section: x-axis entry animation flipped for RTL via `isRTL()`
- Featured products grid (up to 4 `featured: true` products)
- Best sellers horizontal scroll row
- Newsletter sign-up strip

### `Shop.jsx`
- Full product catalog loaded from `localStorage` (falls back to `products.json`)
- Category filters: الكل / نسائي / رجالي / للجنسين (data values: `all`/`women`/`men`/`unisex` — unchanged)

### `ProductDetail.jsx`
- Size selector with `<bdi>` wrapping for mixed LTR/RTL content (e.g. `50ml`)
- Add to cart, Buy Now
- Note pyramid: مقدمة العطر / قلب العطر / قاعدة العطر

### `Cart.jsx` → `Checkout.jsx`
- Cart persisted in `localStorage` via `CartContext`
- Checkout collects: name, phone (LTR dir), address, notes
- Phone input has `dir="ltr"` and `inputMode="tel"` for correct numpad
- On submit: saves order to `localStorage`, builds an Arabic WhatsApp `wa.me` message, redirects the user

### Admin (`/admin/login`)
- Password from `CONFIG.adminPassword`
- Session stored in `sessionStorage` (clears on tab close)
- Admin layout wrapped in `dir="ltr"` — stays LTR/English
- **Products tab**: full CRUD, images stored as Base64 in localStorage
- **Orders tab**: view orders saved at checkout, export CSV
- **Export JSON**: download updated `products.json` to make product changes permanent

---

## Data Flow

### Products
```
src/data/products.json  ←  source of truth (shipped with the build)
        ↓
localStorage['products']  ←  admin edits layer on top
        ↓
All pages read localStorage first, fall back to products.json
```

To permanently save admin changes: **Admin → Products → Export JSON** → replace `src/data/products.json` → rebuild.

### Cart
```
CartContext (useState)  ←→  localStorage['cart']
```
Cart survives page refresh. Cleared after order is placed.

### Orders
```
Checkout.jsx  →  localStorage['orders']  →  Admin Orders tab
```

---

## Product Data Shape

```json
{
  "id": "p001",
  "name": "عود رويال",
  "description": "عطر عود عميق ودخاني ممزوج بالورد والعنبر.",
  "category": "unisex",
  "sizes": [
    { "size": "50ml", "price": 35 },
    { "size": "100ml", "price": 55 }
  ],
  "stock": 25,
  "topNotes": "برغموت، زعفران",
  "heartNotes": "ورد، عود",
  "baseNotes": "عنبر، مسك",
  "images": ["/images/products/sample-1.jpg"],
  "featured": true,
  "active": true,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

- `active: false` hides the product from all customer-facing pages
- `featured: true` puts it in the Home page Featured Collection (max 4 shown)
- `images` is an array; first item is used as the card thumbnail
- `sizes` drives the size selector and pricing on ProductDetail
- `category` must be one of `men` / `women` / `unisex` — the data value, not the Arabic display label

---

## Common Tasks

### Add a new product permanently
1. Edit `src/data/products.json` directly, following the shape above
2. Rebuild: `npm run build`

### Change the WhatsApp number
Edit `CONFIG.whatsappNumber` in `src/config.js` (Jordan format: `962` + number, no `+`).

### Change the admin password
Edit `CONFIG.adminPassword` in `src/config.js`.

### Change the hero video
Replace `public/mp_.mp4` with any `.mp4`. The video is referenced in `src/pages/Home.jsx` as `/mp_.mp4`.

### Change delivery fee or free-delivery threshold
Edit `CONFIG.deliveryFee` (JOD) and `CONFIG.freeDeliveryThreshold` in `src/config.js`.

### Switch to Western numerals (0123)
Set `CONFIG.numeralSystem: "latn"` in `src/config.js`.

### Add a new social link
Add it to `CONFIG.socials` in `src/config.js`. Footer/Contact skip any social whose URL is an empty string.

### Add a new page
1. Create `src/pages/MyPage.jsx`
2. Add a `<Route>` in `src/App.jsx`
3. Link it from `Navbar.jsx` if needed

---

## Known Limitations

| Limitation | Detail |
|---|---|
| No real auth | Admin password is hardcoded in config. Anyone with DevTools can read it. |
| localStorage quota | ~5MB. Base64 product images eat this fast. Use CDN URLs in production. |
| No payments | WhatsApp only. No Tap, PayFort, or Stripe integration. |
| No real orders DB | Orders live in the browser that placed them. Clearing localStorage loses them. |
| No inventory sync | Stock numbers in products.json are static and not decremented at checkout. |
| Arabic-only | Site is Arabic/RTL only. No i18n layer — all strings are hardcoded in Arabic. |

---

## Development

```bash
npm install       # install dependencies
npm run dev       # start dev server at localhost:5173
npm run build     # production build → dist/
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

---

## License

Proprietary — Do not distribute.
