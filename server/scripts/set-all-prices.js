// One-shot: force every product size's price to 12 JOD (1200 piasters).
// Run with: npm --prefix server run set-prices   (or: node server/scripts/set-all-prices.js)

import getDb from '../src/db/connection.js';
import { jodToPiaster } from '../src/lib/pricing.js';

const TARGET_JOD = 12;
const TARGET_PIASTERS = jodToPiaster(TARGET_JOD);

const db = getDb();
const before = db.prepare('SELECT COUNT(*) AS cnt FROM product_sizes').get().cnt;
const result = db.prepare('UPDATE product_sizes SET price = ?').run(TARGET_PIASTERS);

console.log(`✓ Updated ${result.changes} of ${before} size rows to ${TARGET_JOD} JOD (${TARGET_PIASTERS} piasters)`);
