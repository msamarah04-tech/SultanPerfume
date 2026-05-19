import getDb from '../db/connection.js';
import { productRowToApi, productApiToDb } from '../lib/mappers.js';
import { jodToPiaster } from '../lib/pricing.js';

function attachChildren(db, rows) {
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const sizes = db.prepare(
    `SELECT * FROM product_sizes WHERE product_id IN (${placeholders}) ORDER BY position`
  ).all(...ids);

  const images = db.prepare(
    `SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY position`
  ).all(...ids);

  return rows.map(row => {
    const rowSizes = sizes.filter(s => s.product_id === row.id);
    const rowImages = images.filter(img => img.product_id === row.id);
    return productRowToApi(row, rowSizes, rowImages);
  });
}

export const productsRepo = {
  list({ category, featured, search, activeOnly = true, page = 1, limit = 24, sort = 'name' } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (activeOnly) { conditions.push('active = 1'); }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (featured !== undefined) { conditions.push('featured = ?'); params.push(featured ? 1 : 0); }
    if (search) {
      conditions.push('(name LIKE ? OR brand LIKE ? OR description LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderCol = ['name', 'brand', 'created_at', 'stock'].includes(sort) ? sort : 'name';
    const offset = (page - 1) * limit;

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM products ${where}`).get(...params).cnt;
    const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY ${orderCol} LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      items: attachChildren(db, rows),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  findById(id, activeOnly = true) {
    const db = getDb();
    const where = activeOnly ? 'WHERE id = ? AND active = 1' : 'WHERE id = ?';
    const row = db.prepare(`SELECT * FROM products ${where}`).get(id);
    if (!row) return null;

    const sizes = db.prepare('SELECT * FROM product_sizes WHERE product_id = ? ORDER BY position').all(id);
    const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY position').all(id);
    return productRowToApi(row, sizes, images);
  },

  create(data) {
    const db = getDb();
    const now = new Date().toISOString();
    const row = productApiToDb(data);
    row.created_at = now;
    row.updated_at = now;

    db.prepare(`
      INSERT INTO products (id, name, name_ar, brand, description, category,
        top_notes, heart_notes, base_notes, stock, featured, active, created_at, updated_at)
      VALUES (@id, @name, @name_ar, @brand, @description, @category,
        @top_notes, @heart_notes, @base_notes, @stock, @featured, @active,
        @created_at, @updated_at)
    `).run(row);

    this._replaceSizes(db, data.id, data.sizes);
    this._replaceImages(db, data.id, data.images);
    return this.findById(data.id, false);
  },

  update(id, data) {
    const db = getDb();
    const now = new Date().toISOString();
    const row = productApiToDb({ ...data, id });
    row.updated_at = now;

    db.prepare(`
      UPDATE products SET
        name = @name, name_ar = @name_ar, brand = @brand, description = @description,
        category = @category, top_notes = @top_notes, heart_notes = @heart_notes,
        base_notes = @base_notes, stock = @stock, featured = @featured, active = @active,
        updated_at = @updated_at
      WHERE id = @id
    `).run(row);

    if (data.sizes !== undefined) this._replaceSizes(db, id, data.sizes);
    if (data.images !== undefined) this._replaceImages(db, id, data.images);
    return this.findById(id, false);
  },

  patch(id, fields) {
    const db = getDb();
    const allowed = ['name', 'name_ar', 'brand', 'description', 'category', 'stock', 'featured', 'active',
      'top_notes', 'heart_notes', 'base_notes'];
    const sets = [];
    const params = [];

    // Handle camelCase to snake_case for patch fields
    const camelToSnake = { nameAr: 'name_ar', topNotes: 'top_notes', heartNotes: 'heart_notes',
      baseNotes: 'base_notes' };

    for (const [k, v] of Object.entries(fields)) {
      const col = camelToSnake[k] ?? k;
      if (!allowed.includes(col)) continue;
      let val = v;
      if (col === 'featured' || col === 'active') val = v ? 1 : 0;
      sets.push(`${col} = ?`);
      params.push(val);
    }

    if (!sets.length) return this.findById(id, false);

    sets.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...params);

    if (fields.sizes !== undefined) this._replaceSizes(db, id, fields.sizes);
    if (fields.images !== undefined) this._replaceImages(db, id, fields.images);
    return this.findById(id, false);
  },

  delete(id) {
    const db = getDb();
    // CASCADE handles sizes/images
    return db.prepare('DELETE FROM products WHERE id = ?').run(id).changes > 0;
  },

  upsert(data) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(data.id);
    if (existing) {
      return this.update(data.id, data);
    }
    return this.create(data);
  },

  exportAll() {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products').all();
    return attachChildren(db, rows);
  },

  _replaceSizes(db, productId, sizes) {
    db.prepare('DELETE FROM product_sizes WHERE product_id = ?').run(productId);
    const ins = db.prepare('INSERT INTO product_sizes (product_id, size, price, position) VALUES (?, ?, ?, ?)');
    (sizes ?? []).forEach((s, i) => ins.run(productId, s.size, jodToPiaster(s.price ?? 0), i));
  },

  _replaceImages(db, productId, images) {
    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
    const ins = db.prepare('INSERT INTO product_images (product_id, url, position) VALUES (?, ?, ?)');
    (images ?? []).forEach((url, i) => ins.run(productId, url, i));
  },
};
