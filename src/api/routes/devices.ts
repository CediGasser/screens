import { Router } from 'express';
import * as devices from '../controllers/devices';
import { Device, DeviceDocument } from '../types';

export const devicesRouter = Router();

devicesRouter.get('/', async (req, res) => {
  const isAdmin = true; // TODO: Replace with actual authentication logic
  const filteredDevices = isAdmin
    ? await devices.getAllDevices()
    : await devices.getPublishedDevices();
  res.json(filteredDevices);
});

devicesRouter.get('/:id', async (req, res) => {
  const isAdmin = true; // TODO: Replace with actual authentication logic
  const device = await devices.getDeviceById(req.params.id);

  if (device && (isAdmin || !device.isDraft)) {
    return res.json(device);
  } else {
    return res.status(404).json({ error: 'Device not found' });
  }
});

devicesRouter.post('/', async (req, res) => {
  const isAdmin = true; // TODO: Replace with actual authentication logic

  const validatedCreateBody: Omit<Device, 'id'> = req.body; // TODO: Add validation logic here

  if (!isAdmin && !validatedCreateBody.isDraft) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const createdDevice = await devices.createDevice(validatedCreateBody);
  return res.status(201).json(createdDevice);
});

devicesRouter.put('/:id', async (req, res) => {
  const isAdmin = true; // TODO: Replace with actual authentication logic
  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const validatedUpdateBody: Partial<DeviceDocument> = req.body; // TODO: Add validation logic here

  const updatedDevice = await devices.updateDevice(req.params.id, validatedUpdateBody);
  if (!updatedDevice) {
    return res.status(404).json({ error: 'Device not found' });
  }
  return res.json(updatedDevice);
});

devicesRouter.delete('/:id', async (req, res) => {
  const isAdmin = true; // TODO: Replace with actual authentication logic
  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const currentDevice = await devices.getDeviceById(req.params.id);
  if (!currentDevice) {
    return res.status(404).json({ error: 'Device not found' });
  }

  await devices.deleteDevice(req.params.id);
  return res.status(204).send();
});
