import { ObjectId, WithId } from 'mongodb';
import { getDbConnection } from '../config/db';
import { Device, DeviceDocument } from '../types';
import { AppError, NotFoundError, WtfError } from '../errors';

export async function getAllDevices() {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find().toArray();
  return docs.map(mapDocumentToDevice);
}

export async function getDeviceById(id: string): Promise<Device> {
  if (!ObjectId.isValid(id)) throw new NotFoundError('Device');

  const { devicesCollection } = await getDbConnection();
  const doc = await devicesCollection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new NotFoundError('Device');
  return mapDocumentToDevice(doc);
}

export async function getPublishedDevices(): Promise<Device[]> {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find({ isDraft: false }).toArray();
  return docs.map(mapDocumentToDevice);
}

export async function getDraftDevices(): Promise<Device[]> {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find({ isDraft: true }).toArray();
  return docs.map(mapDocumentToDevice);
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
