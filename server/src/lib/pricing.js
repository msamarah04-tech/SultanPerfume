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
 * Resolve the cart-wide tier matching a given total cart quantity.
 * Returns the matched tier or null.
 *   cartTiers: { enabled, tiers: [{ minQty, totalPrice }] }
 */
export function resolveCartTier(totalCartQty, cartTiers) {
  if (!cartTiers || !cartTiers.enabled || !Array.isArray(cartTiers.tiers) || !cartTiers.tiers.length) {
    return null;
  }
  const qty = Math.max(0, Math.floor(Number(totalCartQty) || 0));
  const match = [...cartTiers.tiers]
    .filter(t => Number(t.minQty) <= qty)
    .sort((a, b) => Number(b.minQty) - Number(a.minQty))[0];
  return match ?? null;
}

/**
 * Resolve the effective LINE TOTAL (JOD) for a given quantity. The tier's
 * `unitPrice` value is interpreted as the *total* price for the bracket (the
 * admin entered "buying N costs X JOD"). For qty above any tier's minQty, the
 * highest matching tier wins. If no tier matches, the cart pays base × qty.
 *
 *   - basePrice: the size's listed price (JOD)
 *   - productTiers: [{ minQty, unitPrice }] in JOD — unitPrice = bracket total
 *   - globalPricing: { enabled, tiers:[{minQty,discountPercent}] } — % off subtotal
 *
 * Per-product tiers replace the global default. If a product has no tiers,
 * the global percentage tiers apply to (base × qty).
 */
export function resolveTieredLineTotal(basePrice, quantity, productTiers, globalPricing) {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  const base = Number(basePrice) || 0;

  if (Array.isArray(productTiers) && productTiers.length > 0) {
    const match = [...productTiers]
      .filter(t => Number(t.minQty) <= qty)
      .sort((a, b) => Number(b.minQty) - Number(a.minQty))[0];
    if (match) return Number(match.unitPrice);
    return base * qty;
  }

  if (globalPricing && globalPricing.enabled && Array.isArray(globalPricing.tiers) && globalPricing.tiers.length) {
    const match = [...globalPricing.tiers]
      .filter(t => Number(t.minQty) <= qty)
      .sort((a, b) => Number(b.minQty) - Number(a.minQty))[0];
    if (match) {
      const pct = Math.max(0, Math.min(100, Number(match.discountPercent) || 0));
      return base * qty * (1 - pct / 100);
    }
  }

  return base * qty;
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
