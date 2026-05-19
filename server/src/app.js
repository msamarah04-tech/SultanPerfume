import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

import productsRoutes from './routes/public.products.routes.js';
import offersRoutes from './routes/public.offers.routes.js';
import feedbackRoutes from './routes/public.feedback.routes.js';
import settingsRoutes from './routes/public.settings.routes.js';
import ordersRoutes from './routes/public.orders.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import getDb from './db/connection.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  if (config.isDev) app.use(morgan('dev'));

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Stricter limiters for sensitive endpoints
  const strictLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    let dbOk = false;
    try { getDb().prepare('SELECT 1').get(); dbOk = true; } catch (_) { /* intentionally empty */ }
    res.json({ ok: true, data: { uptime: process.uptime(), dbOk } });
  });

  // ── Public routes ─────────────────────────────────────────────────────────
  app.use('/api/products', productsRoutes);
  app.use('/api/offers', offersRoutes);
  app.use('/api/feedback', strictLimiter, feedbackRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/orders', strictLimiter, ordersRoutes);

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.use('/api/auth', strictLimiter, authRoutes);

  // ── Admin (all protected) ─────────────────────────────────────────────────
  app.use('/api/admin', requireAuth, adminRoutes);

  // ── Catch-alls ────────────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
