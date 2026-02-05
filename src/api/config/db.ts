import { MongoClient } from 'mongodb';
import type { DeviceDocument } from '../types';

let testUri: string | null = null;

/**
 * Set a custom MongoDB URI for testing. Call this before any DB operations.
 */
export const setTestDbUri = (uri: string) => {
  testUri = uri;
};

const getUri = () => testUri || process.env['MONGODB_URI'] || 'mongodb://localhost:27017/screens';

export const getDbConnection = async () => {
  const uri = getUri();
  const client = await MongoClient.connect(uri);
  const db = client.db('screens');

  const devicesCollection = db.collection<DeviceDocument>('devices');

  return { db, devicesCollection, client };
};
