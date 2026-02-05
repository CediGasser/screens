import type { Handler } from 'express';

const logger: Handler = (req, res, next) => {
  console.log(`[Logger Middleware] ${req.method} ${req.url}`);
  next();
};

export { logger };
