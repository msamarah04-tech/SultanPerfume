// Frontend mirror of the server-side resolvers in server/src/lib/pricing.js.

// Cart-wide tier matching the total non-bundle qty.
// cartTiers: { enabled, tiers: [{ minQty, totalPrice }] }
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


//
// A tier's `unitPrice` is interpreted as the LINE TOTAL for the bracket:
// admin enters "buying N costs X JOD" and that X is what the customer pays
// (not X per bottle).
//
// productTiers:  [{ minQty, unitPrice }]  — unitPrice = bracket total
// globalPricing: { enabled, tiers:[{minQty, discountPercent}] } — % off subtotal
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

// Render a human-readable tier ladder for the product page. Returns rows of
// { minQty, lineTotal, perUnit, savingsPercent } sorted by minQty asc.
export function describeTiers(basePrice, productTiers, globalPricing) {
  const base = Number(basePrice) || 0;
  let rows = [];

  if (Array.isArray(productTiers) && productTiers.length > 0) {
    rows = productTiers.map(t => ({
      minQty: Number(t.minQty),
      lineTotal: Number(t.unitPrice),
    }));
  } else if (globalPricing && globalPricing.enabled && Array.isArray(globalPricing.tiers)) {
    rows = globalPricing.tiers.map(t => {
      const pct = Math.max(0, Math.min(100, Number(t.discountPercent) || 0));
      return {
        minQty: Number(t.minQty),
        lineTotal: base * Number(t.minQty) * (1 - pct / 100),
      };
    });
  }

  return rows
    .map(r => {
      const undiscounted = base * r.minQty;
      return {
        minQty: r.minQty,
        lineTotal: r.lineTotal,
        perUnit: r.minQty > 0 ? r.lineTotal / r.minQty : 0,
        savingsPercent: undiscounted > 0
          ? Math.round((1 - r.lineTotal / undiscounted) * 100)
          : 0,
      };
    })
    .filter(r => r.minQty >= 1)
    .sort((a, b) => a.minQty - b.minQty);
}
