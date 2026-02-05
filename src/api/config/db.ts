import { MongoClient } from 'mongodb';
import type { DeviceDocument } from '../types';

const uri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/screens';

export const getDbConnection = async () => {
  const client = await MongoClient.connect(uri);
  const db = client.db('screens');

  const devicesCollection = db.collection<DeviceDocument>('devices');

  return { db, devicesCollection, client };
};
