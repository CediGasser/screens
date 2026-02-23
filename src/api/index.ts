import 'dotenv/config';
import { Router, json } from 'express';
import { createLogger } from './middlewares/logger';
import { errorMiddleware } from './middlewares/error';
import { authMiddleware, initializeAuth } from './middlewares/auth';
import { devicesRouter } from './routes/devices';
import { bulkActionsRouter } from './routes/bulk-actions';

await initializeAuth();

const apiRouter = Router();
apiRouter.use(json());
apiRouter.use(createLogger('Devices API'));
apiRouter.use(authMiddleware);

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
apiRouter.use('/devices/bulk-actions', bulkActionsRouter);

apiRouter.use(errorMiddleware);

export default apiRouter;
