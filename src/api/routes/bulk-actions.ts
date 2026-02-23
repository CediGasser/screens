import { Router } from 'express';
import * as devices from '../controllers/devices';
import { DeviceDocument } from '../types';
import { UnauthorizedError, ValidationError } from '../errors';

export const bulkActionsRouter = Router();

interface BulkUpdateBody {
  updates?: Array<{ id: string; data: Partial<DeviceDocument> }>;
}

interface BulkDeleteBody {
  ids?: string[];
}

bulkActionsRouter.post('/update', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  const body = req.body as BulkUpdateBody;
  if (!Array.isArray(body.updates)) {
    throw new ValidationError('Request body must include an updates array');
  }

  const updatedDevices = await devices.bulkUpdateDevices(body.updates);
  logAdminAction(`${req.user.username} bulk updated ${updatedDevices.length} devices`);
  return res.status(200).json(updatedDevices);
});

bulkActionsRouter.post('/delete', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  const body = req.body as BulkDeleteBody;
  if (!Array.isArray(body.ids)) {
    throw new ValidationError('Request body must include an ids array');
  }

  const deletedCount = await devices.bulkDeleteDevices(body.ids);
  logAdminAction(`${req.user.username} bulk deleted ${deletedCount} devices`);
  return res.status(200).json({ deletedCount });
});

bulkActionsRouter.post('/create', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  if (!Array.isArray(req.body)) {
    throw new ValidationError('Request body must be an array of devices');
  }

  const createdDevices = await devices.bulkCreateDevices(req.body as DeviceDocument[]);
  logAdminAction(`${req.user.username} bulk created ${createdDevices.length} devices`);

  return res.status(201).json(createdDevices);
});

function ensureAuthenticated(isAuthenticated: boolean): asserts isAuthenticated {
  if (!isAuthenticated) {
    throw new UnauthorizedError('Unauthorized');
  }
}

function logAdminAction(text: string) {
  console.log(`[Admin Bulk Action] ${text}`);
}
