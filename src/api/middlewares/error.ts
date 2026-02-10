import { ErrorRequestHandler } from 'express';
import { AppError } from '../errors';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: 'Internal server error',
  });
};
