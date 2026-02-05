import { ObjectId, WithId } from 'mongodb';
import { getDbConnection } from '../config/db';
import { Device, DeviceDocument } from '../types';

export async function getAllDevices() {
  const { devicesCollection } = await getDbConnection();
  const docs = await devicesCollection.find().toArray();
  return docs.map(mapDocumentToDevice);
}

export async function getDeviceById(id: string): Promise<Device | null> {
  if (!ObjectId.isValid(id)) return null;

  const { devicesCollection } = await getDbConnection();
  const doc = await devicesCollection.findOne({ _id: new ObjectId(id) });
  return doc ? mapDocumentToDevice(doc) : null;
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
  return newDevice ? newDevice : Promise.reject('Failed to create device');
}

export async function updateDevice(
  id: string,
  device: Partial<DeviceDocument>,
): Promise<Device | null> {
  if (!ObjectId.isValid(id)) return null;

  const { devicesCollection } = await getDbConnection();
  const result = await devicesCollection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: device },
    { returnDocument: 'after' },
  );
  return result ? mapDocumentToDevice(result) : null;
}

export async function deleteDevice(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const { devicesCollection } = await getDbConnection();
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
