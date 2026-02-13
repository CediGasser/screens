import { Filter, ObjectId, WithId } from 'mongodb';
import { getDbConnection } from '../config/db';
import { Device, DeviceDocument } from '../types';
import { NotFoundError, WtfError } from '../errors';

export interface DeviceQueryFilters {
  isDraft?: boolean;
  manufacturer?: string;
  name?: string;
  type?: Device['type'];
  releaseDateFrom?: string;
  releaseDateTo?: string;
  screenPixelWidthMin?: number;
  screenPixelWidthMax?: number;
  screenPixelHeightMin?: number;
  screenPixelHeightMax?: number;
  pixelDensityMin?: number;
  pixelDensityMax?: number;
  screenCornerRadiusMin?: number;
  screenCornerRadiusMax?: number;
}

export async function getDevices(filters: DeviceQueryFilters = {}): Promise<Device[]> {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find(buildDeviceMongoFilter(filters)).toArray();
  return docs.map(mapDocumentToDevice);
}

export async function getAllDevices() {
  return getDevices();
}

export async function getDeviceById(id: string): Promise<Device> {
  if (!ObjectId.isValid(id)) throw new NotFoundError('Device');

  const { devicesCollection } = await getDbConnection();
  const doc = await devicesCollection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new NotFoundError('Device');
  return mapDocumentToDevice(doc);
}

export async function getPublishedDevices(): Promise<Device[]> {
  return getDevices({ isDraft: false });
}

export async function getDraftDevices(): Promise<Device[]> {
  return getDevices({ isDraft: true });
}

export async function createDevice(device: DeviceDocument): Promise<Device> {
  const { devicesCollection } = await getDbConnection();
  const result = await devicesCollection.insertOne(device);
  const newDevice = await getDeviceById(result.insertedId.toString());
  if (!newDevice) throw new WtfError('Failed to retrieve newly created device');
  return newDevice;
}

export async function updateDevice(id: string, device: Partial<DeviceDocument>): Promise<Device> {
  if (!ObjectId.isValid(id)) throw new NotFoundError('Device');

  const { devicesCollection } = await getDbConnection();
  const result = await devicesCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: device },
    { returnDocument: 'after' },
  );
  if (!result) throw new NotFoundError('Device');
  return mapDocumentToDevice(result);
}

export async function deleteDevice(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const { devicesCollection } = await getDbConnection();
  const existing = await devicesCollection.findOne({ _id: new ObjectId(id) });
  if (!existing) throw new NotFoundError('Device');
  const result = await devicesCollection.deleteOne({ _id: new ObjectId(id) });
  return result.acknowledged;
}

function mapDocumentToDevice(doc: WithId<DeviceDocument>): Device {
  return {
    id: doc._id.toString(),
    manufacturer: doc.manufacturer,
    name: doc.name,
    type: doc.type,
    releaseDate: doc.releaseDate,
    screenSize: doc.screenSize,
    screenPixelHeight: doc.screenPixelHeight,
    screenPixelWidth: doc.screenPixelWidth,
    screenCornerRadius: doc.screenCornerRadius,
    isDraft: doc.isDraft,
  };
}

function buildDeviceMongoFilter(filters: DeviceQueryFilters): Filter<DeviceDocument> {
  const query: Filter<DeviceDocument> = {};

  if (typeof filters.isDraft === 'boolean') {
    query.isDraft = filters.isDraft;
  }

  if (filters.manufacturer) {
    query.manufacturer = new RegExp(`^${escapeRegex(filters.manufacturer)}$`, 'i');
  }

  if (filters.name) {
    query.name = { $regex: escapeRegex(filters.name), $options: 'i' };
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.releaseDateFrom || filters.releaseDateTo) {
    const range: { $gte?: string; $lte?: string } = {};
    if (filters.releaseDateFrom) range.$gte = filters.releaseDateFrom;
    if (filters.releaseDateTo) range.$lte = filters.releaseDateTo;
    query.releaseDate = range;
  }

  applyNumberRangeFilter(
    query,
    'screenPixelWidth',
    filters.screenPixelWidthMin,
    filters.screenPixelWidthMax,
  );
  applyNumberRangeFilter(
    query,
    'screenPixelHeight',
    filters.screenPixelHeightMin,
    filters.screenPixelHeightMax,
  );
  applyNumberRangeFilter(
    query,
    'screenCornerRadius',
    filters.screenCornerRadiusMin,
    filters.screenCornerRadiusMax,
  );

  const pixelDensityExpr: Record<string, unknown>[] = [];
  if (filters.pixelDensityMin != null) {
    pixelDensityExpr.push({
      $gte: [{ $divide: ['$screenPixelWidth', '$screenSize'] }, filters.pixelDensityMin],
    });
  }
  if (filters.pixelDensityMax != null) {
    pixelDensityExpr.push({
      $lte: [{ $divide: ['$screenPixelWidth', '$screenSize'] }, filters.pixelDensityMax],
    });
  }

  if (pixelDensityExpr.length === 1) {
    (query as Filter<DeviceDocument> & { $expr?: unknown }).$expr = pixelDensityExpr[0];
  } else if (pixelDensityExpr.length > 1) {
    (query as Filter<DeviceDocument> & { $expr?: unknown }).$expr = { $and: pixelDensityExpr };
  }

  return query;
}

function applyNumberRangeFilter(
  query: Filter<DeviceDocument>,
  field: 'screenPixelWidth' | 'screenPixelHeight' | 'screenCornerRadius',
  min?: number,
  max?: number,
) {
  const range: { $gte?: number; $lte?: number } = {};
  if (min != null) range.$gte = min;
  if (max != null) range.$lte = max;
  if (Object.keys(range).length > 0) {
    (query as Record<string, unknown>)[field] = range;
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
