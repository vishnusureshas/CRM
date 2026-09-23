import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || statusCode < 500;

  // Log: operational as warn, programming errors as error
  if (isOperational) {
    req.log?.warn({ err, requestId: req.id, statusCode }, err.message);
  } else {
    req.log?.error({ err, requestId: req.id, statusCode }, 'Unhandled error');
  }

  const response = {
    success: false,
    message: isOperational || env.NODE_ENV !== 'production' ? err.message : 'Internal server error',
  };

  if (err.errors) response.errors = err.errors;

  // Never leak stack in production for 500s
  if (env.NODE_ENV !== 'production' && !isOperational) {
    response.stack = err.stack;
  }

  // Prisma known errors → map to 400/409
  if (err.code === 'P2002') {
    response.message = `Duplicate value for ${err.meta?.target ?? 'field'}`;
    return res.status(409).json({ success: false, message: response.message });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  return res.status(statusCode).json(response);
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};
