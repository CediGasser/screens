import 'dotenv/config';
import { Router, json } from 'express';
import { logger } from './middlewares/logger';
import { errorMiddleware } from './middlewares/error';
import { devicesRouter } from './routes/devices';

const apiRouter = Router();
apiRouter.use(json());
apiRouter.use(logger);

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.get('/config', (req, res) => {
  res.json({
    oauth: {
      issuer: process.env['OAUTH_ISSUER'],
      clientId: process.env['OAUTH_CLIENT_ID'],
    },
  });
});

apiRouter.use('/devices', devicesRouter);

apiRouter.use(errorMiddleware);

export default apiRouter;
