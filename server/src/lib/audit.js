import getDb from '../db/connection.js';

// Append-only pricing audit log. Use whenever an admin action could change
// what a future order totals: offer create/update/delete, settings keys that
// feed pricing (deliveryFee, freeDeliveryThreshold, quantityPricing,
// cartQuantityTiers), promo activation toggles, etc.
//
// Never throws — auditing must not block the underlying mutation. Errors
// are logged and swallowed.
export function writePricingAudit({ actor, entity, entityKey, oldValue, newValue, note }) {
  try {
    getDb().prepare(`
      INSERT INTO pricing_audit (actor, entity, entity_key, old_value, new_value, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      actor ?? '',
      entity,
      String(entityKey ?? ''),
      oldValue == null ? null : JSON.stringify(oldValue),
      newValue == null ? null : JSON.stringify(newValue),
      note ?? '',
    );
  } catch (err) {
    console.error('[audit] failed to write pricing_audit row:', err.message);
  }
}

export function listPricingAudit({ entity, limit = 200 } = {}) {
  const db = getDb();
  const rows = entity
    ? db.prepare('SELECT * FROM pricing_audit WHERE entity = ? ORDER BY id DESC LIMIT ?').all(entity, limit)
    : db.prepare('SELECT * FROM pricing_audit ORDER BY id DESC LIMIT ?').all(limit);
  return rows.map(r => ({
    id: r.id,
    actor: r.actor,
    entity: r.entity,
    entityKey: r.entity_key,
    oldValue: r.old_value ? safeJson(r.old_value) : null,
    newValue: r.new_value ? safeJson(r.new_value) : null,
    note: r.note,
    at: r.at,
  }));
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return s; }
}
