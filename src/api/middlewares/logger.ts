import type { Handler } from 'express';

export const createLogger =
  (prefix: string): Handler =>
  (req, _res, next) => {
    console.log(`[${prefix}] ${req.method} ${req.url}`);
    next();
  };
