export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details },
      });
    }
    req.body = result.data;
    next();
  };
}
