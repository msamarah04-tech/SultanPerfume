import { Router } from 'express';
import { ordersRepo } from '../repositories/orders.repo.js';
import { productsRepo } from '../repositories/products.repo.js';
import { offersRepo } from '../repositories/offers.repo.js';
import { settingsRepo } from '../repositories/settings.repo.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema } from '../schemas/order.schema.js';
import { generateOrderId } from '../lib/ids.js';
import { computeOrderTotals, jodToPiaster } from '../lib/pricing.js';
import { broadcastToAdmins } from '../lib/sse.js';

const router = Router();

router.post('/', validate(createOrderSchema), (req, res, next) => {
  try {
    const { customer, items } = req.body;

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
      resolvedItems.push({
        productId: item.productId,
        productName: product.name,
        size: item.size,
        unitPrice: jodToPiaster(sizeObj.price),   // piasters
        quantity: item.quantity,
        lineTotal: jodToPiaster(sizeObj.price) * item.quantity,
      });
    }

    // Fetch delivery settings
    const settings = settingsRepo.getAll();
    const deliveryFeePiaster = jodToPiaster(settings.deliveryFee ?? 0);
    const freeThresholdPiaster = jodToPiaster(settings.freeDeliveryThreshold ?? 0);

    const { subtotal, deliveryFee, total } = computeOrderTotals(
      resolvedItems.map(i => ({ unitPricePiaster: i.unitPrice, quantity: i.quantity })),
      deliveryFeePiaster,
      freeThresholdPiaster,
    );

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
