import { Router } from 'express';
import { ordersRepo } from '../repositories/orders.repo.js';
import { productsRepo } from '../repositories/products.repo.js';
import { offersRepo } from '../repositories/offers.repo.js';
import { settingsRepo } from '../repositories/settings.repo.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/order.schema.js';
import { generateOrderId } from '../lib/ids.js';
import { jodToPiaster, resolveTieredLineTotal, resolveCartTier } from '../lib/pricing.js';
import { broadcastToAdmins } from '../lib/sse.js';

const router = Router();

router.post('/', validate(createOrderSchema), (req, res, next) => {
  try {
    const { customer, items } = req.body;

    // Load settings once — needed for quantity-tier global fallback + cart-wide tier
    const settings = settingsRepo.getAll();
    const globalPricing = settings.quantityPricing || null;
    const cartTiers = settings.cartQuantityTiers || null;

    // Re-fetch every product/size price from the DB — never trust client prices
    const resolvedItems = [];
    for (const item of items) {
      // Bundle items (offer-selection page) carry a 'bundle:<offerId>' product ID
      if (item.productId.startsWith('bundle:')) {
        const offerId = item.productId.slice(7);
        const offer = offersRepo.findById(offerId);
        if (!offer || !offer.active) {
          return res.status(422).json({
            ok: false,
            error: { code: 'OFFER_NOT_FOUND', message: `Offer ${offerId} not found or inactive` },
          });
        }
        resolvedItems.push({
          productId: item.productId,
          productName: offer.titleAr || offer.title || 'عرض مخصص',
          size: item.size,
          unitPrice: jodToPiaster(offer.price),
          quantity: item.quantity,
          lineTotal: jodToPiaster(offer.price) * item.quantity,
          isBundle: true,
        });
        continue;
      }

      const product = productsRepo.findById(item.productId, true);
      if (!product) {
        return res.status(422).json({
          ok: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: `Product ${item.productId} not found or inactive` },
        });
      }
      const sizeObj = product.sizes.find(s => s.size === item.size);
      if (!sizeObj) {
        return res.status(422).json({
          ok: false,
          error: { code: 'SIZE_NOT_FOUND', message: `Size "${item.size}" not available for ${product.name}` },
        });
      }
      // Per-line baseline: per-product tiers override base; global % is a fallback.
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

    // ── Cart-wide tier: counts ALL non-bundle bottles, overrides the subtotal ──
    const nonBundleIdxs = resolvedItems
      .map((it, i) => ({ it, i }))
      .filter(x => !x.it.isBundle);
    const cartQty = nonBundleIdxs.reduce((s, x) => s + x.it.quantity, 0);
    const cartTierMatch = resolveCartTier(cartQty, cartTiers);

    if (cartTierMatch && nonBundleIdxs.length) {
      const cartTierTotalPiaster = jodToPiaster(Number(cartTierMatch.totalPrice) || 0);
      // Proportion by raw catalog (base × qty), not by per-line resolved totals,
      // so a pre-existing global % discount doesn't skew the split.
      const rawSum = nonBundleIdxs.reduce((s, x) => s + x.it.rawCatalog, 0);

      let allocated = 0;
      nonBundleIdxs.forEach((x, idx) => {
        const isLast = idx === nonBundleIdxs.length - 1;
        let share;
        if (isLast) {
          share = cartTierTotalPiaster - allocated;
        } else if (rawSum > 0) {
          share = Math.round((x.it.rawCatalog / rawSum) * cartTierTotalPiaster);
        } else {
          share = Math.round(cartTierTotalPiaster / nonBundleIdxs.length);
        }
        allocated += share;
        resolvedItems[x.i].lineTotal = share;
        resolvedItems[x.i].unitPrice = Math.floor(share / x.it.quantity);
      });
    }

    // Strip the helper flags before persisting
    resolvedItems.forEach(i => { delete i.isBundle; delete i.rawCatalog; });

    const deliveryFeePiaster = jodToPiaster(settings.deliveryFee ?? 0);
    const freeThresholdPiaster = jodToPiaster(settings.freeDeliveryThreshold ?? 0);

    const subtotal = resolvedItems.reduce((s, i) => s + i.lineTotal, 0);
    const isFreeDelivery = freeThresholdPiaster > 0 && subtotal >= freeThresholdPiaster;
    const deliveryFee = isFreeDelivery ? 0 : deliveryFeePiaster;
    const total = subtotal + deliveryFee;

    const orderId = generateOrderId();
    const order = ordersRepo.create({
      id: orderId,
      customer,
      itemRows: resolvedItems,
      subtotal,
      deliveryFee,
      total,
      status: 'new',
    });

    // Push to all connected admin panels in real-time
    broadcastToAdmins('new-order', order);

    res.status(201).json({ ok: true, data: order });
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const order = ordersRepo.findById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    res.json({ ok: true, data: order });
  } catch (err) { next(err); }
});

export default router;
