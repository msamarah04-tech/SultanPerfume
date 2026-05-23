import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

import jwt from 'jsonwebtoken';
import productsRoutes from './routes/public.products.routes.js';
import offersRoutes from './routes/public.offers.routes.js';
import feedbackRoutes from './routes/public.feedback.routes.js';
import settingsRoutes from './routes/public.settings.routes.js';
import ordersRoutes from './routes/public.orders.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { requireAuth } from './middleware/auth.js';
import { addSseClient, removeSseClient } from './lib/sse.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import getDb from './db/connection.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  if (config.isDev) app.use(morgan('dev'));

  // Global rate limiter. Skipped in dev — localhost is single-user and
  // React StrictMode double-fires effects. In prod we keep a per-IP cap
  // but exempt /api/admin: those endpoints require a JWT, so they aren't
  // a DDoS vector for an anonymous attacker, and a logged-in admin
  // loading the dashboard burns through 5–10 requests per page view.
  if (!config.isDev) {
    const globalLimiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path.startsWith('/api/admin'),
    });
    app.use(globalLimiter);
  }

  // Stricter limiter for write endpoints that could be abused. Skips
  // /api/orders/preview — it's a read-only pricing calculator the
  // checkout page calls on every cart change.
  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.isDev ? 200 : 60,
    skip: (req) => req.path === '/preview',
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    let dbOk = false;
    try { getDb().prepare('SELECT 1').get(); dbOk = true; } catch (e) { /* intentionally empty */ }
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

  // ── Admin SSE (auths via query-string token — EventSource can't send headers) ──
  // Mounted BEFORE requireAuth so its own verification runs.
  app.get('/api/admin/orders/events', (req, res) => {
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
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('event: connected\ndata: {}\n\n');
    addSseClient(res);
    req.on('close', () => removeSseClient(res));
  });

  // ── Admin (all other endpoints — bearer token in Authorization header) ────
  app.use('/api/admin', requireAuth, adminRoutes);

  // ── Catch-alls ────────────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
