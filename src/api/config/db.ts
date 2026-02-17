import { MongoClient } from 'mongodb';
import type { DeviceDocument } from '../types';
import { AppError } from '../errors';

const URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/screens';

export const getDbConnection = async (uri: string = URI) => {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db('screens');
    const devicesCollection = db.collection<DeviceDocument>('devices');
    return { db, devicesCollection, client };
  } catch (error) {
    console.error('MongoDB connection unavailable');
    throw new AppError(
      'Database unavailable. Please try again in a moment.',
      503,
      'DB_UNAVAILABLE',
    );
  }
};
