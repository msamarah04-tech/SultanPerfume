import getDb from '../db/connection.js';
import { feedbackRowToApi } from '../lib/mappers.js';

export const feedbackRepo = {
  list({ approvedOnly = false } = {}) {
    const db = getDb();
    const where = approvedOnly ? 'WHERE approved = 1' : '';
    const rows = db.prepare(`SELECT * FROM feedback ${where} ORDER BY created_at DESC`).all();
    return rows.map(feedbackRowToApi);
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
    return row ? feedbackRowToApi(row) : null;
  },

  create({ customerName, rating, message }) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO feedback (customer_name, rating, message) VALUES (?, ?, ?)'
    ).run(customerName, rating ?? null, message);
    return this.findById(result.lastInsertRowid);
  },

  patch(id, { approved }) {
    const db = getDb();
    db.prepare('UPDATE feedback SET approved = ? WHERE id = ?').run(approved ? 1 : 0, id);
    return this.findById(id);
  },

  delete(id) {
    return getDb().prepare('DELETE FROM feedback WHERE id = ?').run(id).changes > 0;
  },
};
