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

// Thrown by computeOrderPricing for any client-correctable validation failure.
// Route layer catches it and emits a structured 422.
export class PricingError extends Error {
  constructor(code, message, status = 422) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Compute every line of an order's pricing from raw client input.
 * Used by BOTH POST /orders (persisting) and POST /orders/preview
 * (non-persisting). They MUST stay identical — that is the entire
 * point of factoring this out.
 *
 *   items:      [{ productId, size, quantity }]
 *   promoCode:  optional string
 *   now:        Date — injected so callers can simulate time (and tests can)
 *   deps:       { productsRepo, offersRepo, settingsRepo } — injected to keep
 *               this module free of repo imports / circular deps
 *
 * Returns an object with everything the route layer needs:
 *   {
 *     resolvedItems: [{ productId, productName, size, unitPrice, quantity, lineTotal }]
 *         — all prices in piasters, ready to persist into order_items
 *     subtotalPiaster, discountPiaster, deliveryFeePiaster, totalPiaster
 *     appliedOffer: { id, type, code } | null
 *     cartTier: matched tier | null
 *   }
 *
 * Throws PricingError on any validation issue (unknown product, missing
 * size, invalid/inactive/out-of-window promo, etc.) — never silently drops.
 */
export function computeOrderPricing({ items, promoCode, now }, deps) {
  const { productsRepo, offersRepo, settingsRepo } = deps;
  if (!Array.isArray(items) || items.length === 0) {
    throw new PricingError('EMPTY_CART', 'Order has no items');
  }

  const settings = settingsRepo.getAll();
  const globalPricing = settings.quantityPricing || null;
  const cartTiers = settings.cartQuantityTiers || null;

  // ── Per-line resolution (re-fetch from DB; client prices never trusted) ──
  const resolvedItems = [];
  for (const item of items) {
    if (typeof item.productId !== 'string' || !item.productId) {
      throw new PricingError('INVALID_ITEM', 'Item is missing productId');
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new PricingError('INVALID_QUANTITY', `Invalid quantity for ${item.productId}`);
    }

    // Bundle line: productId is `bundle:<offerId>`; price comes from the offer.
    if (item.productId.startsWith('bundle:')) {
      const offerId = item.productId.slice(7);
      const offer = offersRepo.findById(offerId);
      if (!offer || !offer.active) {
        throw new PricingError('OFFER_NOT_FOUND', `Offer ${offerId} not found or inactive`);
      }
      // Bundle offers with a date window: enforce it. (starts_at/ends_at
      // are already in the schema; before this audit they were unenforced.)
      if (offer.startsAt && new Date(offer.startsAt) > now) {
        throw new PricingError('OFFER_NOT_STARTED', `Offer ${offerId} has not started yet`);
      }
      if (offer.endsAt && new Date(offer.endsAt) < now) {
        throw new PricingError('OFFER_EXPIRED', `Offer ${offerId} has expired`);
      }
      const unitPricePiaster = jodToPiaster(offer.price);
      resolvedItems.push({
        productId: item.productId,
        productName: offer.title || 'عرض مخصص',
        size: item.size,
        unitPrice: unitPricePiaster,
        quantity: item.quantity,
        lineTotal: unitPricePiaster * item.quantity,
        rawCatalog: unitPricePiaster * item.quantity,
        isBundle: true,
      });
      continue;
    }

    // Catalog line: real product + size.
    const product = productsRepo.findById(item.productId, true);
    if (!product) {
      throw new PricingError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found or inactive`);
    }
    const sizeObj = product.sizes.find(s => s.size === item.size);
    if (!sizeObj) {
      throw new PricingError('SIZE_NOT_FOUND', `Size "${item.size}" not available for ${product.name}`);
    }

    const lineTotalJod = resolveTieredLineTotal(
      sizeObj.price,
      item.quantity,
      product.quantityTiers,
      globalPricing,
    );
    const lineTotalPiaster = jodToPiaster(lineTotalJod);
    const unitPricePiaster = Math.floor(lineTotalPiaster / item.quantity);

    resolvedItems.push({
      productId: item.productId,
      productName: product.name,
      size: item.size,
      unitPrice: unitPricePiaster,
      quantity: item.quantity,
      lineTotal: lineTotalPiaster,
      rawCatalog: jodToPiaster(sizeObj.price) * item.quantity,
      isBundle: false,
    });
  }

  // ── Cart-wide tier (counts non-bundle bottles, overrides their subtotal) ──
  //
  // The deal is "buy N bottles for totalPrice". The highest tier's minQty is
  // the cap — beyond it, every additional bottle costs `excessUnitPrice` JOD
  // (default 5). So with "5 for 25" + excess rate 5: qty 6 = 30, qty 7 = 35.
  const nonBundleIdxs = resolvedItems
    .map((it, i) => ({ it, i }))
    .filter(x => !x.it.isBundle);
  const cartQty = nonBundleIdxs.reduce((s, x) => s + x.it.quantity, 0);
  const cartTier = resolveCartTier(cartQty, cartTiers);

  if (cartTier && nonBundleIdxs.length) {
    const cartTierTotalPiaster = jodToPiaster(Number(cartTier.totalPrice) || 0);
    const rawSum = nonBundleIdxs.reduce((s, x) => s + x.it.rawCatalog, 0);

    // Cap = the largest minQty configured across all enabled tiers.
    const cap = cartTiers?.enabled && Array.isArray(cartTiers.tiers) && cartTiers.tiers.length
      ? Math.max(...cartTiers.tiers.map(t => Math.max(1, Math.floor(Number(t.minQty) || 1))))
      : null;

    // Excess rate is part of the cart-tier config. Default 5 JOD per bottle
    // if the admin hasn't explicitly set it (so older settings rows still
    // get sane behaviour without a migration).
    const excessUnitPiaster = jodToPiaster(
      cartTiers?.excessUnitPrice != null ? Number(cartTiers.excessUnitPrice) : 5
    );

    let effectiveSubtotalPiaster;
    if (!cap || cartQty <= cap) {
      effectiveSubtotalPiaster = cartTierTotalPiaster;
    } else {
      const excess = cartQty - cap;
      effectiveSubtotalPiaster = cartTierTotalPiaster + excess * excessUnitPiaster;
    }

    let allocated = 0;
    nonBundleIdxs.forEach((x, idx) => {
      const isLast = idx === nonBundleIdxs.length - 1;
      let share;
      if (isLast) {
        share = effectiveSubtotalPiaster - allocated;
      } else if (rawSum > 0) {
        share = Math.round((x.it.rawCatalog / rawSum) * effectiveSubtotalPiaster);
      } else {
        share = Math.round(effectiveSubtotalPiaster / nonBundleIdxs.length);
      }
      allocated += share;
      resolvedItems[x.i].lineTotal = share;
      resolvedItems[x.i].unitPrice = Math.floor(share / x.it.quantity);
    });
  }

  const subtotalPiaster = resolvedItems.reduce((s, i) => s + i.lineTotal, 0);

  // ── Promo code (percentage / fixed) ──
  // Validates the code, re-fetches the offer from DB, applies any date
  // window, computes the discount, caps it at the subtotal so total never
  // dips below 0.
  let discountPiaster = 0;
  let appliedOffer = null;
  if (promoCode) {
    const code = String(promoCode).trim().toUpperCase();
    if (code) {
      const offer = offersRepo.findByPromoCode(code);
      if (!offer) {
        throw new PricingError('PROMO_INVALID', `Promo code "${code}" is invalid`);
      }
      if (!offer.active) {
        throw new PricingError('PROMO_INACTIVE', `Promo code "${code}" is not active`);
      }
      if (offer.type !== 'percentage' && offer.type !== 'fixed') {
        throw new PricingError('PROMO_WRONG_TYPE', `Promo code "${code}" is not a discount code`);
      }
      if (offer.startsAt && new Date(offer.startsAt) > now) {
        throw new PricingError('PROMO_NOT_STARTED', `Promo code "${code}" has not started yet`);
      }
      if (offer.endsAt && new Date(offer.endsAt) < now) {
        throw new PricingError('PROMO_EXPIRED', `Promo code "${code}" has expired`);
      }
          
      if (offer.type === 'percentage') {
        const pct = Math.max(0, Math.min(100, Number(offer.discountPercent) || 0));
        discountPiaster = Math.round((subtotalPiaster * pct) / 100);
      } else {
        // fixed: discountAmount is JOD on the API surface
        discountPiaster = jodToPiaster(Number(offer.discountAmount) || 0);
      }
      discountPiaster = Math.max(0, Math.min(discountPiaster, subtotalPiaster));

      appliedOffer = { id: offer.id, type: offer.type, code };
    }
  }

  // ── Delivery fee (free-delivery threshold checks PRE-discount subtotal) ──
  const deliveryFeeSetting = jodToPiaster(settings.deliveryFee ?? 0);
  const freeThresholdPiaster = jodToPiaster(settings.freeDeliveryThreshold ?? 0);
  const isFreeDelivery = freeThresholdPiaster > 0 && subtotalPiaster >= freeThresholdPiaster;
  const deliveryFeePiaster = isFreeDelivery ? 0 : deliveryFeeSetting;

  const totalPiaster = Math.max(0, subtotalPiaster - discountPiaster) + deliveryFeePiaster;

  // Strip helper flags so callers can persist resolvedItems directly.
  resolvedItems.forEach(i => { delete i.isBundle; delete i.rawCatalog; });

  return {
    resolvedItems,
    subtotalPiaster,
    discountPiaster,
    deliveryFeePiaster,
    totalPiaster,
    appliedOffer,
    cartTier,
  };
}
