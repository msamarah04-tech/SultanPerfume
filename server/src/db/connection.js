import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '../../', config.databasePath);

let _db = null;

export function getDb() {
  if (_db) return _db;

  mkdirSync(path.dirname(dbPath), { recursive: true });

  _db = new Database(dbPath);

  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  // Auto-checkpoint when WAL reaches 200 pages (~800 KB) instead of the default 1000
  _db.pragma('wal_autocheckpoint = 200');

  return _db;
}

// Flush WAL to the main DB file and close the connection.
export function closeDb() {
  if (!_db) return;
  try {
    _db.pragma('wal_checkpoint(TRUNCATE)');
    _db.close();
    console.log('✓ Database checkpointed and closed');
  } catch (err) {
    console.error('Error closing database:', err.message);
  } finally {
    _db = null;
  }
}

export default getDb;
