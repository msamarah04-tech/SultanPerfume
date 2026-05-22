import getDb from '../db/connection.js';
import { settingsRowsToApi } from '../lib/mappers.js';

export const settingsRepo = {
  // Public-safe keys that can be read without auth
  PUBLIC_KEYS: new Set([
    'deliveryFee', 'freeDeliveryThreshold', 'whatsappNumber', 'currency',
    'currencySymbol', 'numeralSystem', 'tagline', 'contactEmail', 'contactPhone',
    'contactAddress', 'socials', 'homeSections', 'quantityPricing',
    'cartQuantityTiers',
  ]),

  getAll() {
    const rows = getDb().prepare('SELECT key, value FROM settings').all();
    return settingsRowsToApi(rows);
  },

  getPublic() {
    const rows = getDb().prepare('SELECT key, value FROM settings').all()
      .filter(r => this.PUBLIC_KEYS.has(r.key));
    return settingsRowsToApi(rows);
  },

  update(data) {
    const db = getDb();
    const upsert = db.prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    const updateMany = db.transaction((entries) => {
      for (const [key, value] of entries) {
        upsert.run(key, JSON.stringify(value));
      }
    });
    updateMany(Object.entries(data));
    return this.getAll();
  },
};
