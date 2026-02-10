import type { Handler } from 'express';

export const logger: Handler = (req, _res, next) => {
  console.log(`[Logger Middleware] ${req.method} ${req.url}`);
  next();
};
