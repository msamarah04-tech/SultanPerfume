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

---

## Architecture

**Fully client-side.** No server, no database, no API. All data lives in:
- `src/data/products.json` — seeded product catalog (109 items)
- `localStorage` — cart, admin-edited products, placed orders
- `sessionStorage` — admin login session

Orders flow: customer fills checkout form → pre-filled Arabic WhatsApp message → sent to owner's phone.

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
| `src/lib/storage.js` | `storage.get/set`, `getProducts()`, `persistProducts()` with version fingerprint |
| `src/lib/validation.js` | Arabic error messages for required, min-length, Jordan phone regex |
| `src/lib/whatsapp.js` | `buildOrderMessage()`, `buildWaMeLink()` — formats Arabic WhatsApp order text |

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

109 products total (p001–p109). All prices currently `0` — awaiting configuration.

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
products.json (seed)
       │
       ▼
  localStorage ◄──── Admin panel edits
       │
       ▼
  React Context  ──── Cart / Orders
       │
       ▼
  Checkout form
       │
       ▼
  WhatsApp link  ──── wa.me/CONFIG.whatsappNumber?text=...
```

---

## Known Limitations & Pre-Deploy Checklist

- [ ] Change `adminPassword` in `src/config.js` (currently `"admin"`)
- [ ] Set real `whatsappNumber` (currently placeholder `9627XXXXXXXX`)
- [ ] Configure all product prices (currently `0`)
- [ ] Use CDN URLs for product images (localStorage ~5MB limit — Base64 images fill it fast)
- [ ] Admin product edits must be exported as JSON and redeployed to persist permanently
- [ ] No real authentication — admin session cleared on tab close
- [ ] No payment processing — fulfillment is entirely manual via WhatsApp
- [ ] No inventory deduction on order — stock numbers are decorative

---

## Development Commands

```bash
npm run dev      # Start dev server (Vite HMR)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```
