import { Router } from 'express';
import { offersRepo } from '../repositories/offers.repo.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const items = offersRepo.list({ activeOnly: true });
    res.json({ ok: true, data: items });
  } catch (err) { next(err); }
});

router.get('/:id', (req, res, next) => {
  try {
    const offer = offersRepo.findById(req.params.id);
    if (!offer || !offer.active) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } });
    }
    res.json({ ok: true, data: offer });
  } catch (err) { next(err); }
});

export default router;
