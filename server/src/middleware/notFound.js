export function notFound(req, res) {
  res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: `${req.method} ${req.path} not found` } });
}
