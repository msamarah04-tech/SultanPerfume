import { Router } from 'express';
import { feedbackRepo } from '../repositories/feedback.repo.js';
import { validate } from '../middleware/validate.js';
import { createFeedbackSchema } from '../schemas/feedback.schema.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const items = feedbackRepo.list({ approvedOnly: true });
    res.json({ ok: true, data: items });
  } catch (err) { next(err); }
});

router.post('/', validate(createFeedbackSchema), (req, res, next) => {
  try {
    const item = feedbackRepo.create(req.body);
    res.status(201).json({ ok: true, data: item });
  } catch (err) { next(err); }
});

export default router;
