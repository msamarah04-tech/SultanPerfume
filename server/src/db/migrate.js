import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import getDb from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_VERSION = 1;

export function migrate() {
  const db = getDb();

  // Apply schema DDL
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);

  // Record the version if not already recorded
  const existing = db.prepare('SELECT version FROM schema_version WHERE version = ?').get(SCHEMA_VERSION);
  if (!existing) {
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(SCHEMA_VERSION);
    console.log(`✓ Schema version ${SCHEMA_VERSION} applied`);
  } else {
    console.log(`✓ Schema already at version ${SCHEMA_VERSION}`);
  }
}

// Allow running directly: node src/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate();
  console.log('Migration complete.');
}
