// All prices handled as INTEGER piasters (1 JOD = 1000 piasters) internally.
// Decimal JOD ↔ piaster conversion lives here.

export const JOD_TO_PIASTER = 1000;

export function jodToPiaster(jod) {
  return Math.round(Number(jod) * JOD_TO_PIASTER);
}

export function piasterToJod(piaster) {
  return piaster / JOD_TO_PIASTER;
}

/**
 * Compute order totals server-side.
 * @param {Array} items - [{unitPricePiaster, quantity}]
 * @param {number} deliveryFeePiaster
 * @param {number} freeThresholdPiaster - 0 = no free-delivery threshold
 * @returns {{ subtotal, deliveryFee, total }} all in piasters
 */
export function computeOrderTotals(items, deliveryFeePiaster, freeThresholdPiaster) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPricePiaster * item.quantity, 0);
  const isFreeDelivery = freeThresholdPiaster > 0 && subtotal >= freeThresholdPiaster;
  const deliveryFee = isFreeDelivery ? 0 : deliveryFeePiaster;
  const total = subtotal + deliveryFee;
  return { subtotal, deliveryFee, total };
}
