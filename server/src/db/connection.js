import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve relative DATABASE_PATH from server/ root (../../ from src/db/)
const dbPath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '../../', config.databasePath);

let _db = null;

export function getDb() {
  if (_db) return _db;

  // Ensure the data directory exists (required on platforms with ephemeral filesystems)
  mkdirSync(path.dirname(dbPath), { recursive: true });

  _db = new Database(dbPath);

  // Enable WAL mode and foreign key enforcement on every connection.
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  return _db;
}

export default getDb;
