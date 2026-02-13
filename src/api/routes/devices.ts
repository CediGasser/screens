import { Router } from 'express';
import * as devices from '../controllers/devices';
import { Device, DeviceDocument } from '../types';
import { NotFoundError, UnauthorizedError } from '../errors';

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

function parseDeviceQueryFilters(query: Record<string, unknown>): devices.DeviceQueryFilters {
  const type = readStringQuery(query['type']);
  return {
    isDraft: parseBooleanQuery(query['isDraft']),
    manufacturer: readStringQuery(query['manufacturer']),
    name: readStringQuery(query['name']),
    type: isDeviceType(type) ? type : undefined,
    releaseDateFrom: readStringQuery(query['releaseDateFrom']),
    releaseDateTo: readStringQuery(query['releaseDateTo']),
    screenPixelWidthMin: parseNumberQuery(query['screenPixelWidthMin']),
    screenPixelWidthMax: parseNumberQuery(query['screenPixelWidthMax']),
    screenPixelHeightMin: parseNumberQuery(query['screenPixelHeightMin']),
    screenPixelHeightMax: parseNumberQuery(query['screenPixelHeightMax']),
    pixelDensityMin: parseNumberQuery(query['pixelDensityMin']),
    pixelDensityMax: parseNumberQuery(query['pixelDensityMax']),
    screenCornerRadiusMin: parseNumberQuery(query['screenCornerRadiusMin']),
    screenCornerRadiusMax: parseNumberQuery(query['screenCornerRadiusMax']),
  };
}

function readStringQuery(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim() !== '') {
    return value[0].trim();
  }
  return undefined;
}

function parseBooleanQuery(value: unknown): boolean | undefined {
  const text = readStringQuery(value);
  if (text === 'true') return true;
  if (text === 'false') return false;
  return undefined;
}

function parseNumberQuery(value: unknown): number | undefined {
  const text = readStringQuery(value);
  if (text == null) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDeviceType(value: unknown): value is Device['type'] {
  return (
    value === 'smartphone' ||
    value === 'tablet' ||
    value === 'laptop' ||
    value === 'desktop' ||
    value === 'wearable' ||
    value === 'other'
  );
}
