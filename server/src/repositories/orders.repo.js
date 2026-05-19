import getDb from '../db/connection.js';
import { orderRowToApi } from '../lib/mappers.js';

function attachItems(db, orderRows) {
  if (!orderRows.length) return [];
  const ids = orderRows.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const items = db.prepare(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`
  ).all(...ids);

  return orderRows.map(row => {
    const rowItems = items.filter(i => i.order_id === row.id);
    return orderRowToApi(row, rowItems);
  });
}

export const ordersRepo = {
  list({ status, dateFrom, dateTo, page = 1, limit = 50 } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (dateFrom) { conditions.push('created_at >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('created_at <= ?'); params.push(dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM orders ${where}`).get(...params).cnt;
    const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      items: attachItems(db, rows),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  findById(id) {
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!row) return null;
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    return orderRowToApi(row, items);
  },

  create({ id, customer, itemRows, subtotal, deliveryFee, total, status = 'confirmed' }) {
    const db = getDb();
    const now = new Date().toISOString();

    const insert = db.transaction(() => {
      db.prepare(`
        INSERT INTO orders (id, customer_name, customer_phone, customer_address,
          customer_notes, subtotal, delivery_fee, total, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, customer.name, customer.phone, customer.address ?? '',
        customer.notes ?? '', subtotal, deliveryFee, total, status, now, now);

      const insItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, size, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of itemRows) {
        insItem.run(id, item.productId, item.productName, item.size,
          item.unitPrice, item.quantity, item.lineTotal);
      }
    });

    insert();
    return this.findById(id);
  },

  patch(id, fields) {
    const db = getDb();
    const sets = [];
    const params = [];

    // 'completed' is the API term; DB stores it as 'fulfilled'
    if (fields.status) {
      const dbStatus = fields.status === 'completed' ? 'fulfilled' : fields.status;
      sets.push('status = ?');
      params.push(dbStatus);
    }
    if (fields.whatsappSent !== undefined) {
      sets.push('whatsapp_sent = ?');
      params.push(fields.whatsappSent ? 1 : 0);
    }
    if (!sets.length) return this.findById(id);

    sets.push('updated_at = ?');
    params.push(new Date().toISOString(), id);
    db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  stats() {
    const db = getDb();
    const statusCounts = db.prepare(`
      SELECT CASE WHEN status = 'fulfilled' THEN 'completed' ELSE status END as status,
             COUNT(*) as cnt, SUM(total) as revenue
      FROM orders GROUP BY status
    `).all();

    const total = db.prepare('SELECT COUNT(*) as cnt FROM orders').get().cnt;
    const totalRevenue = db.prepare(
      "SELECT SUM(total) as rev FROM orders WHERE status IN ('confirmed','fulfilled')"
    ).get().rev ?? 0;

    const topProducts = db.prepare(`
      SELECT product_name, product_id, SUM(quantity) as units, SUM(line_total) as revenue
      FROM order_items
      GROUP BY product_name
      ORDER BY units DESC
      LIMIT 5
    `).all();

    return { statusCounts, total, totalRevenue, topProducts };
  },

  exportCsv() {
    const db = getDb();
    return db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  },

  exportConfirmed({ dateFrom, dateTo, ids } = {}) {
    const db = getDb();
    const conditions = [];
    const params = [];

    if (ids && ids.length > 0) {
      // Explicit ID list — export exactly these orders regardless of status
      const placeholders = ids.map(() => '?').join(',');
      conditions.push(`id IN (${placeholders})`);
      params.push(...ids);
    } else {
      conditions.push(`status IN ('confirmed', 'fulfilled')`);
      if (dateFrom) { conditions.push('created_at >= ?'); params.push(dateFrom); }
      if (dateTo)   { conditions.push('created_at <= ?'); params.push(dateTo); }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db.prepare(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC`
    ).all(...params);

    if (!rows.length) return [];

    const rowIds = rows.map(r => r.id);
    const placeholders = rowIds.map(() => '?').join(',');
    const items = db.prepare(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`
    ).all(...rowIds);

    return rows.map(row => ({
      ...row,
      items: items.filter(i => i.order_id === row.id),
    }));
  },
};