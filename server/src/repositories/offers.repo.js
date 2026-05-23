import getDb from '../db/connection.js';
import { offerRowToApi, offerApiToDb } from '../lib/mappers.js';
import { generateOfferId } from '../lib/ids.js';

export const offersRepo = {
  list({ activeOnly = false } = {}) {
    const db = getDb();
    const where = activeOnly ? 'WHERE active = 1' : '';
    const rows = db.prepare(`SELECT * FROM offers ${where} ORDER BY created_at DESC`).all();
    return rows.map(offerRowToApi);
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
    return row ? offerRowToApi(row) : null;
  },

  findByPromoCode(code) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM offers WHERE promo_code = ? AND active = 1').get(code);
    return row ? offerRowToApi(row) : null;
  },

  create(data) {
    const db = getDb();
    const id = generateOfferId();
    const now = new Date().toISOString();
    const row = offerApiToDb(data);
    db.prepare(`
      INSERT INTO offers (id, title, description, type, perfume_count, price,
        discount_percent, discount_amount, promo_code, product_ids, image_url,
        features, active, starts_at, ends_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, row.title, row.description, row.type, row.perfume_count, row.price,
      row.discount_percent, row.discount_amount, row.promo_code,
      row.product_ids, row.image_url, row.features, row.active,
      row.starts_at, row.ends_at, now, now);
    return this.findById(id);
  },

  update(id, data) {
    const db = getDb();
    const now = new Date().toISOString();
    const row = offerApiToDb(data);
    db.prepare(`
      UPDATE offers SET title = ?, description = ?, type = ?, perfume_count = ?, price = ?,
        discount_percent = ?, discount_amount = ?, promo_code = ?, product_ids = ?,
        image_url = ?, features = ?, active = ?, starts_at = ?, ends_at = ?, updated_at = ?
      WHERE id = ?
    `).run(row.title, row.description, row.type, row.perfume_count, row.price,
      row.discount_percent, row.discount_amount, row.promo_code,
      row.product_ids, row.image_url, row.features, row.active,
      row.starts_at, row.ends_at, now, id);
    return this.findById(id);
  },

  delete(id) {
    return getDb().prepare('DELETE FROM offers WHERE id = ?').run(id).changes > 0;
  },
};
