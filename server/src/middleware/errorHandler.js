import { config } from '../config.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = config.isDev ? err.message : 'Internal server error';

  res.status(status).json({ ok: false, error: { code, message } });
}
