import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
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
}
