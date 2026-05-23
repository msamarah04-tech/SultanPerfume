import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import getDb from './connection.js';
import { migrate } from './migrate.js';
import { jodToPiaster } from '../lib/pricing.js';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load products.json from the frontend src directory
const PRODUCTS_PATH = path.resolve(__dirname, '../../../src/data/products.json');
const products = require(PRODUCTS_PATH);

// Default settings mirroring the editable subset of src/config.js CONFIG
const DEFAULT_SETTINGS = {
  deliveryFee: 0,
  freeDeliveryThreshold: 0,
  whatsappNumber: '9627XXXXXXXX',
  currency: 'JOD',
  currencySymbol: 'د.أ',
  numeralSystem: 'arab',
  tagline: 'فنّ الرائحة',
  contactEmail: 'perfumealsultan@gmail.com',
  contactPhone: '+962 7 9019 5123',
  contactAddress: 'عمّان، الأردن',
  socials: {
    instagram: 'https://instagram.com/alsultanperfumejo',
    tiktok: '',
    snapchat: '',
  },
};

export async function seed() {
  migrate();
  const db = getDb();

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?')
    .get(config.adminUsername);

  if (!existingAdmin) {
    const hash = await bcrypt.hash(config.adminPassword, 12);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)')
      .run(config.adminUsername, hash);
    console.log(`✓ Admin user "${config.adminUsername}" created`);
  } else {
    console.log(`✓ Admin user "${config.adminUsername}" already exists`);
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  const upsertSetting = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING'
  );
  let settingsSeeded = 0;
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const result = upsertSetting.run(key, JSON.stringify(value));
    if (result.changes) settingsSeeded++;
  }
  console.log(`✓ Settings: ${settingsSeeded} new keys seeded (${Object.keys(DEFAULT_SETTINGS).length} total)`);

  // ── Products ────────────────────────────────────────────────────────────────
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, name_ar, brand, description, category,
      top_notes, heart_notes, base_notes, featured, active, created_at, updated_at)
    VALUES (@id, @name, @name_ar, @brand, @description, @category,
      @top_notes, @heart_notes, @base_notes, @featured, @active,
      @created_at, @updated_at)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertSize = db.prepare(`
    INSERT INTO product_sizes (product_id, size, price, position)
    VALUES (@product_id, @size, @price, @position)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, url, position)
    VALUES (@product_id, @url, @position)
  `);

  const hasProduct = db.prepare('SELECT id FROM products WHERE id = ?');

  const seedMany = db.transaction((prods) => {
    let inserted = 0;
    let skipped = 0;

    for (const p of prods) {
      const category = ['unisex', 'women', 'men'].includes(p.category) ? p.category : 'unisex';
      const exists = hasProduct.get(p.id);

      if (!exists) {
        insertProduct.run({
          id: p.id,
          name: p.name ?? '',
          name_ar: p.nameAr ?? '',
          brand: p.brand ?? '',
          description: p.description ?? '',
          category,
          top_notes: p.topNotes ?? '',
          heart_notes: p.heartNotes ?? '',
          base_notes: p.baseNotes ?? '',
          featured: p.featured ? 1 : 0,
          active: p.active !== false ? 1 : 0,
          created_at: p.createdAt ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        inserted++;
      } else {
        skipped++;
      }

      // Always refresh sizes and images (idempotent upsert for child rows)
      if (!exists) {
        const sizes = p.sizes ?? [];
        sizes.forEach((s, i) => {
          insertSize.run({
            product_id: p.id,
            size: s.size,
            price: jodToPiaster(s.price ?? 0),
            position: i,
          });
        });

        const images = p.images ?? [];
        images.forEach((url, i) => {
          insertImage.run({ product_id: p.id, url, position: i });
        });
      }
    }

    return { inserted, skipped };
  });

  const { inserted, skipped } = seedMany(products);
  console.log(`✓ Products: ${inserted} inserted, ${skipped} skipped (${products.length} total in source)`);
  console.log(`\nSeed complete: ${products.length} products, 1 admin, ${Object.keys(DEFAULT_SETTINGS).length} settings`);
}

// Allow running directly: node src/db/seed.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
