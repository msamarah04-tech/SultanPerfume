# Al Sultan Perfumes — Backend API

Express 4 + SQLite API for the Al Sultan Perfumes storefront.

## Setup

```bash
cd server
cp .env.example .env      # fill in JWT_SECRET and ADMIN_PASSWORD
npm install
npm run reset-db          # drops DB, runs schema, seeds 109 products
npm run dev               # starts on PORT (default 4000)
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `DATABASE_PATH` | SQLite file path (relative to `server/`) | `./data/alsultan.db` |
| `JWT_SECRET` | **Required.** Long random string for JWT signing | — |
| `JWT_EXPIRES_IN` | Token lifetime | `8h` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `ADMIN_PASSWORD` | **Required.** Admin login password (bcrypt-hashed in DB) | — |
| `RATE_LIMIT_WINDOW_MS` | Global rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Global rate limit max requests | `100` |

## Price Convention

All prices are stored as **INTEGER piasters** internally (1 JOD = 1000 piasters).  
The API always returns and accepts decimal JOD numbers (`0` = free, `15.5` = 15.500 JOD).  
Conversion lives in `src/lib/pricing.js`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Production start |
| `npm run migrate` | Apply schema (idempotent) |
| `npm run seed` | Seed products + admin + settings |
| `npm run reset-db` | Drop DB → migrate → seed |

---

## Endpoints

All responses: `{ ok: true, data: ... }` or `{ ok: false, error: { code, message } }`.  
List endpoints include `data.meta: { total, page, limit, pages }`.

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Uptime + DB status |

### Public — Products

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List active products. Query: `category`, `featured`, `search`, `page`, `limit`, `sort` |
| GET | `/api/products/:id` | Single product (active only) |

### Public — Orders

| Method | Path | Description |
|---|---|---|
| POST | `/api/orders` | Create order. Server re-computes all prices. Returns order + `whatsappUrl` |
| GET | `/api/orders/:id` | Fetch one order (for order-confirmed page) |

**POST /api/orders body:**
```json
{
  "customer": { "name": "أحمد", "phone": "0791234567", "address": "عمّان...", "notes": "" },
  "items": [{ "productId": "p001", "size": "100ml", "quantity": 1 }]
}
```

### Public — Offers

| Method | Path | Description |
|---|---|---|
| GET | `/api/offers` | List active offers |
| GET | `/api/offers/:id` | Single active offer |

### Public — Feedback

| Method | Path | Description |
|---|---|---|
| GET | `/api/feedback` | List approved testimonials |
| POST | `/api/feedback` | Submit testimonial (lands as unapproved, rate-limited) |

### Public — Settings

| Method | Path | Description |
|---|---|---|
| GET | `/api/settings/public` | Public-safe settings (fees, socials, contact, numerals) |

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | `{ username, password }` → `{ token }` |
| GET | `/api/auth/me` | Current admin info (requires Bearer token) |

### Admin (require `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/products` | All products (incl. inactive) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Full update |
| PATCH | `/api/admin/products/:id` | Partial update |
| DELETE | `/api/admin/products/:id` | Delete |
| GET | `/api/admin/products/export` | Export catalog as JSON download |
| POST | `/api/admin/products/import` | Bulk upsert from JSON array |
| GET | `/api/admin/orders` | List all orders. Query: `status`, `dateFrom`, `dateTo`, `page`, `limit` |
| GET | `/api/admin/orders/:id` | Order with items |
| PATCH | `/api/admin/orders/:id` | Update `status` / `whatsappSent` |
| GET | `/api/admin/orders/export` | Orders as CSV download |
| GET | `/api/admin/offers` | All offers |
| POST | `/api/admin/offers` | Create |
| PUT | `/api/admin/offers/:id` | Update |
| DELETE | `/api/admin/offers/:id` | Delete |
| GET | `/api/admin/feedback` | All feedback incl. unapproved |
| PATCH | `/api/admin/feedback/:id` | `{ approved: true/false }` |
| DELETE | `/api/admin/feedback/:id` | Delete |
| GET | `/api/admin/settings` | All settings |
| PUT | `/api/admin/settings` | Partial merge update |
