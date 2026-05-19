import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import getDb from '../db/connection.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/settings.schema.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } });
    }

    const token = jwt.sign(
      { sub: admin.id, username: admin.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );

    res.json({ ok: true, data: { token, username: admin.username } });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, data: { username: req.admin.username } });
});

export default router;
