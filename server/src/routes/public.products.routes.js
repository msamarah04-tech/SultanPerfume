import { Router } from 'express';
import { productsRepo } from '../repositories/products.repo.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { category, featured, search, page, limit, sort } = req.query;
    const result = productsRepo.list({
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      search,
      activeOnly: true,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 24,
      sort,
    });
    res.json({ ok: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const product = productsRepo.findById(req.params.id, true);
    if (!product) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ ok: true, data: product });
  } catch (err) { next(err); }
});

export default router;
