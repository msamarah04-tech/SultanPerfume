import { Router } from 'express';
import { settingsRepo } from '../repositories/settings.repo.js';

const router = Router();

router.get('/public', (req, res, next) => {
  try {
    res.json({ ok: true, data: settingsRepo.getPublic() });
  } catch (err) { next(err); }
});

export default router;
