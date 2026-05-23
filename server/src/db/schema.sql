-- Al Sultan Perfumes — SQLite Schema
-- Prices are stored as INTEGER piasters (1 JOD = 1000 piasters) to avoid
-- floating-point rounding. The API layer converts to/from decimal JOD.

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version    INTEGER NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Admin users (bcrypt-hashed passwords)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  name_ar     TEXT NOT NULL DEFAULT '',
  brand       TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'unisex'
    CHECK (category IN ('unisex', 'women', 'men')),
  top_notes   TEXT NOT NULL DEFAULT '',
  heart_notes TEXT NOT NULL DEFAULT '',
  base_notes    TEXT NOT NULL DEFAULT '',
  sections_json TEXT NOT NULL DEFAULT '[]',
  featured    INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_active    ON products(active);

-- Product sizes (one-to-many; price in piasters)
CREATE TABLE IF NOT EXISTS product_sizes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL,
  price      INTEGER NOT NULL DEFAULT 0,  -- piasters
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);

-- Per-product quantity-tier pricing (one-to-many).
-- Each row says: when ordering >= min_qty of this product (any size), the
-- effective per-unit price becomes unit_price (piasters). The tier with the
-- largest min_qty ≤ ordered quantity wins. If no row matches, the size's
-- base price is used.
CREATE TABLE IF NOT EXISTS product_quantity_tiers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_qty    INTEGER NOT NULL CHECK (min_qty >= 1),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0)  -- piasters
);

CREATE INDEX IF NOT EXISTS idx_product_qty_tiers_product ON product_quantity_tiers(product_id);

-- Product images (one-to-many, ordered by position)
CREATE TABLE IF NOT EXISTS product_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT PRIMARY KEY,
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  customer_address    TEXT NOT NULL DEFAULT '',
  customer_notes      TEXT NOT NULL DEFAULT '',
  subtotal            INTEGER NOT NULL,  -- piasters, PRE-discount
  discount            INTEGER NOT NULL DEFAULT 0,  -- piasters
  applied_promo_code  TEXT,                            -- nullable
  delivery_fee        INTEGER NOT NULL DEFAULT 0,  -- piasters
  total               INTEGER NOT NULL,  -- piasters; = max(0, subtotal - discount) + delivery_fee
  status              TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'confirmed', 'fulfilled', 'cancelled')),
  whatsapp_sent       INTEGER NOT NULL DEFAULT 0 CHECK (whatsapp_sent IN (0, 1)),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order items (snapshot at order time — prices in piasters)
CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   TEXT,  -- nullable: preserve history if product is later deleted
  product_name TEXT NOT NULL,
  size         TEXT NOT NULL,
  unit_price   INTEGER NOT NULL,  -- piasters, snapshot
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  line_total   INTEGER NOT NULL   -- piasters
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Offers / promotions
CREATE TABLE IF NOT EXISTS offers (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  type             TEXT NOT NULL DEFAULT 'bundle',
  discount_percent INTEGER,
  discount_amount  INTEGER,  -- piasters, for fixed-amount offers
  promo_code       TEXT,     -- optional coupon code
  product_ids      TEXT NOT NULL DEFAULT '[]',  -- JSON array of product ids
  perfume_count    INTEGER,           -- bundle: number of bottles
  price            INTEGER,           -- bundle: fixed price in piasters
  image_url        TEXT NOT NULL DEFAULT '',
  features         TEXT NOT NULL DEFAULT '[]',  -- JSON array of bullet point strings
  active           INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  starts_at        TEXT,
  ends_at          TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);

-- Customer feedback / testimonials
CREATE TABLE IF NOT EXISTS feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL DEFAULT '',
  rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
  message       TEXT NOT NULL DEFAULT '',
  image_url     TEXT NOT NULL DEFAULT '',
  approved      INTEGER NOT NULL DEFAULT 0 CHECK (approved IN (0, 1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_approved ON feedback(approved);

-- Site settings (key/value; value is JSON-encoded)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL  -- JSON-encoded
);

-- Audit log for pricing-affecting changes (offer create/update, settings
-- edits to delivery/tiers, etc). Append-only; read from /admin/audit/pricing.
-- Used to investigate "why did this order total what it totalled".
CREATE TABLE IF NOT EXISTS pricing_audit (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT NOT NULL DEFAULT '',
  entity     TEXT NOT NULL,            -- 'offers' | 'settings' | 'orders' | ...
  entity_key TEXT NOT NULL,            -- e.g. offer id, setting key, order id
  old_value  TEXT,                     -- JSON or NULL
  new_value  TEXT,                     -- JSON or NULL
  note       TEXT NOT NULL DEFAULT '',
  at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pricing_audit_entity ON pricing_audit(entity);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_at     ON pricing_audit(at);
