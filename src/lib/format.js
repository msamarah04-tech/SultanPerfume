import { CONFIG } from '../config';

const EASTERN = '٠١٢٣٤٥٦٧٨٩';

export function toEasternArabic(value) {
  return String(value).replace(/\d/g, d => EASTERN[d]);
}

export function formatPrice(amount) {
  const num = CONFIG.numeralSystem === 'arab'
    ? toEasternArabic(amount)
    : String(amount);
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
