import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
  }
}
