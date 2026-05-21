import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import getDb from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_VERSION = 2;

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
}

// Allow running directly: node src/db/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate();
  console.log('Migration complete.');
}
