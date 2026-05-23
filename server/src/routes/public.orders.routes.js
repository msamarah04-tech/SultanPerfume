import { Router } from 'express';
import { ordersRepo } from '../repositories/orders.repo.js';
import { productsRepo } from '../repositories/products.repo.js';
import { offersRepo } from '../repositories/offers.repo.js';
import { settingsRepo } from '../repositories/settings.repo.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, previewOrderSchema } from '../schemas/order.schema.js';
import { generateOrderId } from '../lib/ids.js';
import { computeOrderPricing, PricingError, piasterToJod } from '../lib/pricing.js';
import { broadcastToAdmins } from '../lib/sse.js';

const router = Router();

const repoDeps = { productsRepo, offersRepo, settingsRepo };

// Map a PricingError to the existing { ok:false, error:{code,message} } shape.
function sendPricingError(res, err) {
  return res.status(err.status || 422).json({
    ok: false,
    error: { code: err.code, message: err.message },
  });
}

// POST /orders/preview — compute totals without persisting.
// Mounted BEFORE the param route so '/preview' isn't swallowed by '/:id'.
router.post('/preview', validate(previewOrderSchema), (req, res, next) => {
  try {
    const { items, promoCode } = req.body;
    const pricing = computeOrderPricing(
      { items, promoCode, now: new Date() },
      repoDeps,
    );
    res.json({
      ok: true,
      data: {
        items: pricing.resolvedItems.map(i => ({
          productId: i.productId,
          name: i.productName,
          size: i.size,
          quantity: i.quantity,
          unitPrice: piasterToJod(i.unitPrice),
          lineTotal: piasterToJod(i.lineTotal),
        })),
        subtotal: piasterToJod(pricing.subtotalPiaster),
        discount: piasterToJod(pricing.discountPiaster),
        deliveryFee: piasterToJod(pricing.deliveryFeePiaster),
        total: piasterToJod(pricing.totalPiaster),
        appliedOffer: pricing.appliedOffer,
        cartTier: pricing.cartTier,
      },
    });
  } catch (err) {
    if (err instanceof PricingError) return sendPricingError(res, err);
    next(err);
  }
});

router.post('/', validate(createOrderSchema), (req, res, next) => {
  try {
    const { customer, items, promoCode } = req.body;

    let pricing;
    try {
      pricing = computeOrderPricing(
        { items, promoCode, now: new Date() },
        repoDeps,
      );
    } catch (err) {
      if (err instanceof PricingError) return sendPricingError(res, err);
      throw err;
    }

    const orderId = generateOrderId();
    const order = ordersRepo.create({
      id: orderId,
      customer,
      itemRows: pricing.resolvedItems,
      subtotal: pricing.subtotalPiaster,
      discount: pricing.discountPiaster,
      appliedPromoCode: pricing.appliedOffer?.code ?? null,
      deliveryFee: pricing.deliveryFeePiaster,
      total: pricing.totalPiaster,
      status: 'new',
    });

    // Include appliedOffer (id + type) on the response so the confirmation
    // page and WhatsApp message can show what the customer saved.
    const enriched = { ...order, appliedOffer: pricing.appliedOffer };

    broadcastToAdmins('new-order', enriched);
    res.status(201).json({ ok: true, data: enriched });
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
