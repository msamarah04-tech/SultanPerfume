import { existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from '../src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '../', config.databasePath);

console.log(`Resetting database at: ${dbPath}`);

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  console.log('✓ Existing database deleted');
}

// Run seed (which includes migrate)
const { seed } = await import('../src/db/seed.js');
await seed();

console.log('\n✓ Database reset complete');
