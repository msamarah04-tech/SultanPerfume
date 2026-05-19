// Generate product IDs in pNNN format
export function generateProductId(existingIds = []) {
  const nums = existingIds
    .filter(id => /^p\d+$/.test(id))
    .map(id => parseInt(id.slice(1), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `p${String(max + 1).padStart(3, '0')}`;
}

// Mirror the frontend generateOrderId() format: ORD-YYMMDD-XXXX
export function generateOrderId() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomChars}`;
}

// Short random ID for offers
export function generateOfferId() {
  return `OFR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
