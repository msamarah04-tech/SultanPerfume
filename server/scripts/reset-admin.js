// One-off script to force-resync the admin password from ADMIN_PASSWORD env
// to the DB. Use this when the bootstrap auto-sync is not yet deployed (e.g.
// you've been locked out on Render after rotating ADMIN_PASSWORD).
//
// Usage on Render:
//   1. Set ADMIN_PASSWORD env var to the password you want
//   2. Open the Render shell for the service
//   3. cd to the server directory and run: npm run reset-admin
import { ensureAdminUser } from '../src/db/seed.js';
import { migrate } from '../src/db/migrate.js';
import { closeDb } from '../src/db/connection.js';
import { config } from '../src/config.js';

migrate();
await ensureAdminUser();
console.log(`\n✓ Admin "${config.adminUsername}" is now in sync with ADMIN_PASSWORD env`);
closeDb();
