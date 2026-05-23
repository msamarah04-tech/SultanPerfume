import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import getDb from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function migrate() {
  const db = getDb();

  // Apply schema DDL (CREATE TABLE IF NOT EXISTS — safe for fresh DBs)
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);

  // Record version 1 if not already recorded
  const v1 = db.prepare('SELECT version FROM schema_version WHERE version = 1').get();
  if (!v1) {
    db.prepare('INSERT INTO schema_version (version) VALUES (1)').run();
    console.log('✓ Schema version 1 applied');
  } else {
    console.log('✓ Schema already at version 1');
  }

  // Version 2: add sections_json to existing products table
  const v2 = db.prepare('SELECT version FROM schema_version WHERE version = 2').get();
  if (!v2) {
    try {
      db.exec("ALTER TABLE products ADD COLUMN sections_json TEXT NOT NULL DEFAULT '[]'");
      console.log('✓ Schema version 2 applied (sections_json column added)');
    } catch {
      // Column already exists (fresh DB from schema.sql — nothing to do)
      console.log('✓ Schema version 2: sections_json column already present');
    }
    db.prepare('INSERT INTO schema_version (version) VALUES (2)').run();
  } else {
    console.log('✓ Schema already at version 2');
  }

  // Version 3: per-product quantity-tier pricing
  const v3 = db.prepare('SELECT version FROM schema_version WHERE version = 3').get();
  if (!v3) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS product_quantity_tiers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        min_qty    INTEGER NOT NULL CHECK (min_qty >= 1),
        unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
      );
      CREATE INDEX IF NOT EXISTS idx_product_qty_tiers_product
        ON product_quantity_tiers(product_id);
    `);
    db.prepare('INSERT INTO schema_version (version) VALUES (3)').run();
    console.log('✓ Schema version 3 applied (product_quantity_tiers)');
  } else {
    console.log('✓ Schema already at version 3');
  }

  // Version 4: admin-editable offer features (bullet list)
  const v4 = db.prepare('SELECT version FROM schema_version WHERE version = 4').get();
  if (!v4) {
    try {
      db.exec("ALTER TABLE offers ADD COLUMN features TEXT NOT NULL DEFAULT '[]'");
      console.log('✓ Schema version 4 applied (offers.features column added)');
    } catch {
      console.log('✓ Schema version 4: offers.features column already present');
    }
    db.prepare('INSERT INTO schema_version (version) VALUES (4)').run();
  } else {
    console.log('✓ Schema already at version 4');
  }

  // Version 5: remove unused products.stock column
  const v5 = db.prepare('SELECT version FROM schema_version WHERE version = 5').get();
  if (!v5) {
    try {
      db.exec('ALTER TABLE products DROP COLUMN stock');
      console.log('✓ Schema version 5 applied (products.stock column dropped)');
    } catch {
      // Column already gone (fresh DB from updated schema.sql) — nothing to do
      console.log('✓ Schema version 5: products.stock column already absent');
    }
    db.prepare('INSERT INTO schema_version (version) VALUES (5)').run();
  } else {
    console.log('✓ Schema already at version 5');
  }

  // Version 6: photo-first feedback — store screenshots/photos
  const v6 = db.prepare('SELECT version FROM schema_version WHERE version = 6').get();
  if (!v6) {
    try {
      db.exec("ALTER TABLE feedback ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
      console.log('✓ Schema version 6 applied (feedback.image_url column added)');
    } catch {
      console.log('✓ Schema version 6: feedback.image_url column already present');
    }
    db.prepare('INSERT INTO schema_version (version) VALUES (6)').run();
  } else {
    console.log('✓ Schema already at version 6');
  }
}

// Allow running directly: node src/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate();
  console.log('Migration complete.');
}
