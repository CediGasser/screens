import 'dotenv/config';
import { Router, json } from 'express';
import { logger } from './middlewares/logger';
import { devicesRouter } from './routes/devices';

const apiRouter = Router();
apiRouter.use(json());
apiRouter.use(logger);

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/devices', devicesRouter);

export default apiRouter;
