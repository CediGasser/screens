import { Router } from 'express';
import * as devices from '../controllers/devices';
import { Device, DeviceDocument } from '../types';
import { NotFoundError, UnauthorizedError } from '../errors';

export const devicesRouter = Router();

devicesRouter.get('/', async (req, res) => {
  const isAuthenticated = req.user.authenticated;
  const isDraftFilter = req.query['isDraft'];

  let filteredDevices;

  if (isDraftFilter === 'true') {
    // Only authenticated users can access drafts
    filteredDevices = isAuthenticated ? await devices.getDraftDevices() : [];
  } else if (isDraftFilter === 'false') {
    filteredDevices = await devices.getPublishedDevices();
  } else {
    // No filter: authenticated users see all, others see only published
    filteredDevices = isAuthenticated
      ? await devices.getAllDevices()
      : await devices.getPublishedDevices();
  }

  res.json(filteredDevices);
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

  const validatedCreateBody: Omit<Device, 'id'> = req.body; // TODO: Add validation logic here

  if (!isAuthenticated && !validatedCreateBody.isDraft) {
    throw new UnauthorizedError('Cannot create published device');
  }
  const createdDevice = await devices.createDevice(validatedCreateBody);
  return res.status(201).json(createdDevice);
});

devicesRouter.put('/:id', async (req, res) => {
  const isAuthenticated = req.user.authenticated;
  if (!isAuthenticated) {
    throw new UnauthorizedError('Unauthorized');
  }

  const validatedUpdateBody: Partial<DeviceDocument> = req.body; // TODO: Add validation logic here

  const updatedDevice = await devices.updateDevice(req.params.id, validatedUpdateBody);
  return res.status(200).json(updatedDevice);
});

devicesRouter.delete('/:id', async (req, res) => {
  const isAuthenticated = req.user.authenticated;

  if (!isAuthenticated) {
    throw new UnauthorizedError('Unauthorized');
  }

  await devices.deleteDevice(req.params.id);
  return res.status(204).send();
});
