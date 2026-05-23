import { migrate } from './db/migrate.js';
import { seed, ensureAdminUser } from './db/seed.js';
import { config } from './config.js';
import { createApp } from './app.js';
import getDb, { closeDb } from './db/connection.js';
import { jodToPiaster } from './lib/pricing.js';

// Baseline cart-wide config we want to exist on every deploy. Mirrors the
// values an admin previously configured by hand — captured here so the free-
// tier ephemeral disk wipe doesn't keep blanking the production cart.
const BASELINE_CART_QUANTITY_TIERS = {
  enabled: true,
  tiers: [
    { minQty: 2, totalPrice: 17 },
    { minQty: 3, totalPrice: 19 },
    { minQty: 4, totalPrice: 22 },
    { minQty: 5, totalPrice: 25 },
  ],
  excessUnitPrice: 5,
};
const BASELINE_QUANTITY_PRICING = {
  enabled: true,
  tiers: [
    { minQty: 2, discountPercent: 10 },
    { minQty: 4, discountPercent: 20 },
  ],
};
// Per-product baseline: each active product gets "buy 2 for 13 JOD" and
// "buy 3 for 20 JOD" if it has no tiers yet. Values in PIASTERS.
const BASELINE_PRODUCT_TIERS = [
  { minQty: 2, unitPrice: 13000 },
  { minQty: 3, unitPrice: 20000 },
];

function ensureBaselinePricing(db) {
  const upsertSettingIfMissing = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING'
  );
  upsertSettingIfMissing.run('cartQuantityTiers', JSON.stringify(BASELINE_CART_QUANTITY_TIERS));
  upsertSettingIfMissing.run('quantityPricing',   JSON.stringify(BASELINE_QUANTITY_PRICING));

  const productsWithoutTiers = db.prepare(`
    SELECT id FROM products WHERE active = 1
      AND id NOT IN (SELECT DISTINCT product_id FROM product_quantity_tiers)
  `).all();
  if (!productsWithoutTiers.length) return;

  const insertTier = db.prepare(
    'INSERT INTO product_quantity_tiers (product_id, min_qty, unit_price) VALUES (?, ?, ?)'
  );
  const seedAll = db.transaction(() => {
    for (const p of productsWithoutTiers) {
      for (const t of BASELINE_PRODUCT_TIERS) {
        insertTier.run(p.id, t.minQty, t.unitPrice);
      }
    }
  });
  seedAll();
  console.log(`✓ Baseline tiers applied to ${productsWithoutTiers.length} product(s)`);
}

async function bootstrap() {
  // Apply schema on startup (idempotent)
  migrate();

  // Auto-seed if database is empty (required for ephemeral hosting where DB is wiped on restart)
  const db = getDb();
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count === 0) {
    console.log('Products table is empty — running seed...');
    await seed();
  } else {
    // Products exist → seed() won't run, but we still need to keep the admin
    // password in sync with the ADMIN_PASSWORD env var on every boot.
    await ensureAdminUser();
  }

  // Ensure the default summer bundle offer exists (idempotent upsert)
  db.prepare(`
    INSERT OR IGNORE INTO offers
      (id, title, description, type, perfume_count, price, product_ids, active, created_at, updated_at)
    VALUES ('summer-5-for-25', 'عرض الصيف الاستثنائي',
      'اختر أي 5 عطور بسعر 25 دينار شامل التوصيل', 'bundle',
      5, ?, '[]', 1, datetime('now'), datetime('now'))
  `).run(jodToPiaster(25));

  // ── Baseline pricing (free-tier safe) ───────────────────────────────────────
  // On Render's free plan the SQLite file is wiped on every redeploy, so we
  // can't rely on admin edits surviving. This block re-applies the baseline
  // catalog config that we'd otherwise lose:
  //   • settings: cart-wide bundle tiers + global %-tier ladder
  //   • per-product tiers: every active product gets "2 for 13, 3 for 20"
  //                        unless it already has its own tiers
  //
  // Both are idempotent. Settings use INSERT OR IGNORE, so an admin who
  // overrides them at runtime won't be reset on the NEXT boot in a
  // persistent-disk setup. Per-product tiers only seed the products that
  // currently have none, so admin-edited tiers are preserved.
  ensureBaselinePricing(db);

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`\n🕌 Al Sultan Perfumes API`);
    console.log(`   Listening on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}\n`);
  });
}

bootstrap().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal} — shutting down...`);
  closeDb();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('exit', closeDb);
