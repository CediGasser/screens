import { Router } from 'express';
import * as devices from '../controllers/devices';
import { DeviceDocument } from '../types';
import { NotFoundError, UnauthorizedError } from '../errors';
import {
  parseDeviceQueryFilters,
  validateCreateDevicePayload,
  validateUpdateDevicePayload,
} from '../validators/device';

export const devicesRouter = Router();

devicesRouter.get('/', async (req, res) => {
  const isAuthenticated = req.user.authenticated;
  const queryFilters = parseDeviceQueryFilters(req.query);

  if (queryFilters.isDraft === true && !isAuthenticated) {
    return res.json([]);
  }

  if (queryFilters.isDraft == null && !isAuthenticated) {
    queryFilters.isDraft = false;
  }

  const filteredDevices = await devices.getDevices(queryFilters);

  return res.json(filteredDevices);
});

devicesRouter.get('/meta', async (req, res) => {
  const includeDrafts = req.user.authenticated;
  const metadata = await devices.getDevicesMetadata(includeDrafts);
  return res.json(metadata);
});

devicesRouter.get('/:id', async (req, res) => {
  const isAuthenticated = req.user.authenticated;
  const device = await devices.getDeviceById(req.params.id);

  if (isAuthenticated || !device.isDraft) {
    return res.json(device);
  } else {
    throw new NotFoundError('Device'); // Hide draft devices from non-authenticated users
  }
});

devicesRouter.post('/', async (req, res) => {
  const isAuthenticated = req.user.authenticated;

  const validatedCreateBody = validateCreateDevicePayload(req.body);

  if (!isAuthenticated && !validatedCreateBody.isDraft) {
    throw new UnauthorizedError('Cannot create published device');
  }
  const createdDevice = await devices.createDevice(validatedCreateBody);
  if (isAuthenticated) {
    logAdminAction(`${req.user.username} created a new device: ${createdDevice.name}`);
  }
  return res.status(201).json(createdDevice);
});

devicesRouter.put('/:id', async (req, res) => {
  const isAuthenticated = req.user.authenticated;
  if (!isAuthenticated) {
    throw new UnauthorizedError('Unauthorized');
  }

  const validatedUpdateBody: Partial<DeviceDocument> = validateUpdateDevicePayload(req.body);

  const updatedDevice = await devices.updateDevice(req.params.id, validatedUpdateBody);
  if (!updatedDevice) {
    throw new NotFoundError('Device');
  }

  logAdminAction(`${req.user.username} updated device ${req.params.id}`);
  return res.status(200).json(updatedDevice);
});

devicesRouter.delete('/:id', async (req, res) => {
  const isAuthenticated = req.user.authenticated;

  if (!isAuthenticated) {
    throw new UnauthorizedError('Unauthorized');
  }

  await devices.deleteDevice(req.params.id);
  logAdminAction(`${req.user.username} deleted device ${req.params.id}`);
  return res.status(204).send();
});

function logAdminAction(text: string) {
  console.log(`[Admin Action] ${text}`);
}
