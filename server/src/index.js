import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import { config } from './config.js';
import { createApp } from './app.js';
import getDb from './db/connection.js';
import { jodToPiaster } from './lib/pricing.js';

async function bootstrap() {
  // Apply schema on startup (idempotent)
  migrate();

  // Auto-seed if database is empty (required for ephemeral hosting where DB is wiped on restart)
  const db = getDb();
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count === 0) {
    console.log('Products table is empty — running seed...');
    await seed();
  }

  // Ensure the default summer bundle offer exists (idempotent upsert)
  db.prepare(`
    INSERT OR IGNORE INTO offers
      (id, title, description, type, perfume_count, price, product_ids, active, created_at, updated_at)
    VALUES ('summer-5-for-25', 'عرض الصيف الاستثنائي',
      'اختر أي 5 عطور بسعر 25 دينار شامل التوصيل', 'bundle',
      5, ?, '[]', 1, datetime('now'), datetime('now'))
  `).run(jodToPiaster(25));

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
