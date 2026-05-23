import { CONFIG } from '../config';

const EASTERN = '٠١٢٣٤٥٦٧٨٩';

export function toEasternArabic(value) {
  return String(value).replace(/\d/g, d => EASTERN[d]);
}

// Round to piaster precision (3 decimals max) and strip trailing zeros, so
// proportional allocations like 10/3 don't render as "٣.٣٣٣٣٣٣٣٣٣ د.أ" and
// whole-JOD prices don't render as "12.000 د.أ".
function roundForDisplay(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  const fixed = rounded.toFixed(3);
  // Strip trailing zeros and the trailing dot if all-zeros.
  return fixed.replace(/\.?0+$/, '');
}

export function formatPrice(amount) {
  const rounded = roundForDisplay(amount);
  const num = CONFIG.numeralSystem === 'arab' ? toEasternArabic(rounded) : rounded;
  return `${num} ${CONFIG.currencySymbol}`;
}

// Keep alias for any remaining internal uses
export const formatCurrency = formatPrice;

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('ar-JO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function generateOrderId() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${randomChars}`;
}
