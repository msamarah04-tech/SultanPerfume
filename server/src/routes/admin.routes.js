import { Router } from 'express';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import { productsRepo } from '../repositories/products.repo.js';
import { ordersRepo } from '../repositories/orders.repo.js';
import { offersRepo } from '../repositories/offers.repo.js';
import { feedbackRepo } from '../repositories/feedback.repo.js';
import { settingsRepo } from '../repositories/settings.repo.js';
import { validate } from '../middleware/validate.js';
import { createProductSchema, updateProductSchema, patchProductSchema } from '../schemas/product.schema.js';
import { patchOrderSchema } from '../schemas/order.schema.js';
import { createOfferSchema, updateOfferSchema } from '../schemas/offer.schema.js';
import { createFeedbackSchema, patchFeedbackSchema } from '../schemas/feedback.schema.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';
import { generateProductId } from '../lib/ids.js';
import { piasterToJod } from '../lib/pricing.js';
import { config } from '../config.js';
import { addSseClient, removeSseClient } from '../lib/sse.js';

const router = Router();

// ─── Stats ───────────────────────────────────────────────────────────────────

router.get('/stats', (req, res, next) => {
  try {
    const orderStats = ordersRepo.stats();
    const productCount = productsRepo.list({ activeOnly: false, limit: 1 }).meta.total;
    const activeCount = productsRepo.list({ activeOnly: true, limit: 1 }).meta.total;

    res.json({
      ok: true,
      data: {
        totalRevenue: piasterToJod(orderStats.totalRevenue),
        totalOrders: orderStats.total,
        ordersByStatus: orderStats.statusCounts,
        totalProducts: productCount,
        activeProducts: activeCount,
        topProducts: orderStats.topProducts.map(p => ({
          ...p,
          revenue: piasterToJod(p.revenue),
        })),
      },
    });
  } catch (err) { next(err); }
});

// ─── Products ────────────────────────────────────────────────────────────────

router.get('/products/export', (req, res, next) => {
  try {
    const products = productsRepo.exportAll();
    res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(products, null, 2));
  } catch (err) { next(err); }
});

router.post('/products/import', (req, res, next) => {
  try {
    const data = Array.isArray(req.body) ? req.body : req.body.products;
    if (!Array.isArray(data)) {
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Body must be an array of products' } });
    }
    const results = data.map(p => productsRepo.upsert(p));
    res.json({ ok: true, data: { imported: results.length } });
  } catch (err) { next(err); }
});

router.get('/products', (req, res, next) => {
  try {
    const { category, featured, search, page, limit, sort } = req.query;
    const result = productsRepo.list({
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      search,
      activeOnly: false,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      sort,
    });
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/products/:id', (req, res, next) => {
  try {
    const product = productsRepo.findById(req.params.id, false);
    if (!product) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ ok: true, data: product });
  } catch (err) { next(err); }
});

router.post('/products', validate(createProductSchema), (req, res, next) => {
  try {
    const allIds = productsRepo.exportAll().map(p => p.id);
    const id = req.body.id || generateProductId(allIds);
    const product = productsRepo.create({ ...req.body, id });
    res.status(201).json({ ok: true, data: product });
  } catch (err) { next(err); }
});

router.put('/products/:id', validate(updateProductSchema), (req, res, next) => {
  try {
    const product = productsRepo.update(req.params.id, req.body);
    if (!product) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ ok: true, data: product });
  } catch (err) { next(err); }
});

router.patch('/products/:id', validate(patchProductSchema), (req, res, next) => {
  try {
    const product = productsRepo.patch(req.params.id, req.body);
    if (!product) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ ok: true, data: product });
  } catch (err) { next(err); }
});

router.delete('/products/:id', (req, res, next) => {
  try {
    const deleted = productsRepo.delete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── Orders ──────────────────────────────────────────────────────────────────

// SSE stream — auth via query-param token (EventSource cannot send headers)
router.get('/orders/events', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  try {
    jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  res.write('event: connected\ndata: {}\n\n');
  addSseClient(res);
  req.on('close', () => removeSseClient(res));
});

router.get('/orders/export', (req, res, next) => {
  try {
    const rows = ordersRepo.exportCsv();
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Subtotal (JOD)', 'Delivery (JOD)', 'Total (JOD)', 'Status'];
    const csvRows = rows.map(o => [
      o.id,
      new Date(o.created_at).toLocaleDateString('en-GB'),
      `"${o.customer_name}"`,
      o.customer_phone,
      `"${o.customer_address}"`,
      piasterToJod(o.subtotal),
      piasterToJod(o.delivery_fee),
      piasterToJod(o.total),
      o.status,
    ]);
    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) { next(err); }
});

router.get('/orders/export/excel', async (req, res, next) => {
  try {
    const { from, to, ids } = req.query;
    const idList = ids ? ids.split(',').filter(Boolean) : undefined;
    // Explicit IDs → export those orders; otherwise export confirmed+fulfilled with optional date range
    const orders = ordersRepo.exportConfirmed({ dateFrom: from, dateTo: to, ids: idList });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Al Sultan Perfumes';
    const sheet = workbook.addWorksheet('Orders');

    // Column definitions
    sheet.columns = [
      { key: 'orderId',    header: 'Order ID',           width: 22 },
      { key: 'date',       header: 'Date',                width: 16 },
      { key: 'name',       header: 'Customer Name',       width: 26 },
      { key: 'phone',      header: 'Phone',               width: 18 },
      { key: 'address',    header: 'Address',             width: 36 },
      { key: 'products',   header: 'Products Ordered',    width: 60 },
      { key: 'itemCount',  header: 'Items (Count)',       width: 13 },
      { key: 'subtotal',   header: 'Subtotal (JOD)',      width: 16 },
      { key: 'delivery',   header: 'Delivery Fee (JOD)',  width: 18 },
      { key: 'total',      header: 'Total (JOD)',         width: 16 },
      { key: 'status',     header: 'Status',              width: 14 },
      { key: 'notes',      header: 'Notes',               width: 30 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 26;
    headerRow.eachCell(cell => {
      cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A0A0A' } };
      cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFD4AF37' } },
      };
    });

    // Data rows
    const DATA_START = 2;
    orders.forEach((order, idx) => {
      const rowNum = DATA_START + idx;
      const productsText = order.items
        .map(i => `${i.product_name} (${i.size}) x${i.quantity}`)
        .join('; ');

      const subtotalJod  = piasterToJod(order.subtotal);
      const deliveryJod  = piasterToJod(order.delivery_fee);
      const totalJod     = piasterToJod(order.total);

      const row = sheet.addRow({
        orderId:   order.id,
        date:      new Date(order.created_at).toISOString().slice(0, 10),
        name:      order.customer_name,
        phone:     order.customer_phone,
        address:   order.customer_address,
        products:  productsText,
        itemCount: order.items.length,
        subtotal:  subtotalJod,
        delivery:  deliveryJod,
        // Total: formula + pre-computed result so file opens without needing recalc
        total:     { formula: `H${rowNum}+I${rowNum}`, result: totalJod },
        status:    order.status,
        notes:     order.customer_notes || '',
      });

      // Currency format: H, I, J
      ['H', 'I', 'J'].forEach(col => {
        sheet.getCell(`${col}${rowNum}`).numFmt = '#,##0.000 "JOD"';
      });

      // Alternating row shading
      if (idx % 2 === 1) {
        row.eachCell(cell => {
          if (!cell.fill || cell.fill.type !== 'pattern' || !cell.fill.fgColor) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F4EE' } };
          }
        });
      }

      row.getCell('G').alignment = { horizontal: 'center' };
    });

    // Totals row
    const totalsRowNum = DATA_START + orders.length;
    if (orders.length > 0) {
      const sumH = orders.reduce((s, o) => s + piasterToJod(o.subtotal),    0);
      const sumI = orders.reduce((s, o) => s + piasterToJod(o.delivery_fee), 0);
      const sumJ = orders.reduce((s, o) => s + piasterToJod(o.total),       0);

      sheet.getCell(`A${totalsRowNum}`).value = {
        formula: `COUNTA(A${DATA_START}:A${totalsRowNum - 1})`,
        result: orders.length,
      };
      sheet.getCell(`B${totalsRowNum}`).value = 'Order Count ↑';
      sheet.getCell(`H${totalsRowNum}`).value = { formula: `SUM(H${DATA_START}:H${totalsRowNum - 1})`, result: sumH };
      sheet.getCell(`I${totalsRowNum}`).value = { formula: `SUM(I${DATA_START}:I${totalsRowNum - 1})`, result: sumI };
      sheet.getCell(`J${totalsRowNum}`).value = { formula: `SUM(J${DATA_START}:J${totalsRowNum - 1})`, result: sumJ };

      ['H', 'I', 'J'].forEach(col => {
        sheet.getCell(`${col}${totalsRowNum}`).numFmt = '#,##0.000 "JOD"';
      });

      const totalsRow = sheet.getRow(totalsRowNum);
      totalsRow.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE8D8' } };
        cell.border = { top: { style: 'medium', color: { argb: 'FFD4AF37' } } };
      });
    }

    // Freeze first row, auto-filter on header
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'A2' }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 12 } };

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="al-sultan-orders-${today}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

router.get('/orders', (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, page, limit } = req.query;
    const result = ordersRepo.list({
      status,
      dateFrom,
      dateTo,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/orders/:id', (req, res, next) => {
  try {
    const order = ordersRepo.findById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    res.json({ ok: true, data: order });
  } catch (err) { next(err); }
});

router.patch('/orders/:id', validate(patchOrderSchema), (req, res, next) => {
  try {
    const order = ordersRepo.patch(req.params.id, req.body);
    if (!order) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    res.json({ ok: true, data: order });
  } catch (err) { next(err); }
});

// ─── Offers ──────────────────────────────────────────────────────────────────

router.get('/offers', (req, res, next) => {
  try {
    res.json({ ok: true, data: offersRepo.list({ activeOnly: false }) });
  } catch (err) { next(err); }
});

router.post('/offers', validate(createOfferSchema), (req, res, next) => {
  try {
    const offer = offersRepo.create(req.body);
    res.status(201).json({ ok: true, data: offer });
  } catch (err) { next(err); }
});

router.put('/offers/:id', validate(updateOfferSchema), (req, res, next) => {
  try {
    const offer = offersRepo.update(req.params.id, req.body);
    if (!offer) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } });
    res.json({ ok: true, data: offer });
  } catch (err) { next(err); }
});

router.delete('/offers/:id', (req, res, next) => {
  try {
    const deleted = offersRepo.delete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } });
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── Feedback ────────────────────────────────────────────────────────────────

router.get('/feedback', (req, res, next) => {
  try {
    res.json({ ok: true, data: feedbackRepo.list({ approvedOnly: false }) });
  } catch (err) { next(err); }
});

router.post('/feedback', validate(createFeedbackSchema), (req, res, next) => {
  try {
    const item = feedbackRepo.create({ ...req.body, approved: req.body.approved !== false });
    res.status(201).json({ ok: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/feedback/:id', validate(patchFeedbackSchema), (req, res, next) => {
  try {
    const item = feedbackRepo.patch(req.params.id, req.body);
    if (!item) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } });
    res.json({ ok: true, data: item });
  } catch (err) { next(err); }
});

router.delete('/feedback/:id', (req, res, next) => {
  try {
    const deleted = feedbackRepo.delete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Feedback not found' } });
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ─── Settings ────────────────────────────────────────────────────────────────

router.get('/settings', (req, res, next) => {
  try {
    res.json({ ok: true, data: settingsRepo.getAll() });
  } catch (err) { next(err); }
});

router.put('/settings', validate(updateSettingsSchema), (req, res, next) => {
  try {
    const updated = settingsRepo.update(req.body);
    res.json({ ok: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
