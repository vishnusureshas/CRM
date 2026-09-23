import { ValidationError } from '../utils/errors.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Replace with parsed (coerced) values
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    return next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const issues = err.issues ?? err.errors ?? [];
      const errors = issues.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message,
      }));
      return next(new ValidationError('Validation failed', errors));
    }
    return next(err);
  }
};
