import { Filter, ObjectId, WithId } from 'mongodb';
import { getDbConnection } from '../config/db';
import { Device, DeviceDocument } from '../types';
import { NotFoundError, WtfError } from '../errors';
import type { DeviceQueryFilters, DeviceMetadata } from '../types';

export async function getDevices(filters: DeviceQueryFilters = {}): Promise<Device[]> {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find(buildDeviceMongoFilter(filters)).toArray();
  return docs.map(mapDocumentToDevice);
}

export async function getDevicesMetadata(includeDrafts: boolean): Promise<DeviceMetadata> {
  const { devicesCollection } = await getDbConnection();
  const baseMatch = includeDrafts ? {} : { isDraft: false };

  const [boundaryDoc, manufacturers, totalDevices, draftDevices, publishedDevices] =
    await Promise.all([
      devicesCollection
        .aggregate<{
          minReleaseDate: string | null;
          maxReleaseDate: string | null;
          minScreenSize: number | null;
          maxScreenSize: number | null;
          minScreenPixelWidth: number | null;
          maxScreenPixelWidth: number | null;
          minScreenPixelHeight: number | null;
          maxScreenPixelHeight: number | null;
          minPixelDensity: number | null;
          maxPixelDensity: number | null;
          minScreenCornerRadius: number | null;
          maxScreenCornerRadius: number | null;
        }>([
          { $match: baseMatch },
          {
            $group: {
              _id: null,
              minReleaseDate: { $min: '$releaseDate' },
              maxReleaseDate: { $max: '$releaseDate' },
              minScreenSize: { $min: '$screenSize' },
              maxScreenSize: { $max: '$screenSize' },
              minScreenPixelWidth: { $min: '$screenPixelWidth' },
              maxScreenPixelWidth: { $max: '$screenPixelWidth' },
              minScreenPixelHeight: { $min: '$screenPixelHeight' },
              maxScreenPixelHeight: { $max: '$screenPixelHeight' },
              minPixelDensity: { $min: { $divide: ['$screenPixelWidth', '$screenSize'] } },
              maxPixelDensity: { $max: { $divide: ['$screenPixelWidth', '$screenSize'] } },
              minScreenCornerRadius: { $min: '$screenCornerRadius' },
              maxScreenCornerRadius: { $max: '$screenCornerRadius' },
            },
          },
        ])
        .next(),
      devicesCollection.distinct('manufacturer', baseMatch),
      devicesCollection.countDocuments(baseMatch),
      includeDrafts ? devicesCollection.countDocuments({ isDraft: true }) : Promise.resolve(0),
      includeDrafts
        ? devicesCollection.countDocuments({ isDraft: false })
        : devicesCollection.countDocuments(baseMatch),
    ]);

  return {
    boundaries: {
      minReleaseDate: boundaryDoc?.minReleaseDate ?? null,
      maxReleaseDate: boundaryDoc?.maxReleaseDate ?? null,
      minScreenSize: boundaryDoc?.minScreenSize ?? null,
      maxScreenSize: boundaryDoc?.maxScreenSize ?? null,
      minScreenPixelWidth: boundaryDoc?.minScreenPixelWidth ?? null,
      maxScreenPixelWidth: boundaryDoc?.maxScreenPixelWidth ?? null,
      minScreenPixelHeight: boundaryDoc?.minScreenPixelHeight ?? null,
      maxScreenPixelHeight: boundaryDoc?.maxScreenPixelHeight ?? null,
      minPixelDensity: boundaryDoc?.minPixelDensity ?? null,
      maxPixelDensity: boundaryDoc?.maxPixelDensity ?? null,
      minScreenCornerRadius: boundaryDoc?.minScreenCornerRadius ?? null,
      maxScreenCornerRadius: boundaryDoc?.maxScreenCornerRadius ?? null,
    },
    manufacturers: manufacturers.sort((a, b) => a.localeCompare(b)),
    counts: {
      totalDevices,
      draftDevices,
      publishedDevices,
    },
  };
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
