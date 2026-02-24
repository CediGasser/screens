import { Router } from 'express';
import * as devices from '../controllers/devices';
import { UnauthorizedError } from '../errors';
import {
  validateBulkCreateDevicesPayload,
  validateBulkDeleteDevicesPayload,
  validateBulkUpdateDevicesPayload,
} from '../validators/device';

export const bulkActionsRouter = Router();

bulkActionsRouter.post('/update', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  const updates = validateBulkUpdateDevicesPayload(req.body);

  const updatedDevices = await devices.bulkUpdateDevices(updates);
  logAdminAction(`${req.user.username} bulk updated ${updatedDevices.length} devices`);
  return res.status(200).json(updatedDevices);
});

bulkActionsRouter.post('/delete', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  const ids = validateBulkDeleteDevicesPayload(req.body);

  const deletedCount = await devices.bulkDeleteDevices(ids);
  logAdminAction(`${req.user.username} bulk deleted ${deletedCount} devices`);
  return res.status(200).json({ deletedCount });
});

bulkActionsRouter.post('/create', async (req, res) => {
  ensureAuthenticated(req.user.authenticated);

  const devicesToCreate = validateBulkCreateDevicesPayload(req.body);

  const createdDevices = await devices.bulkCreateDevices(devicesToCreate);
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
