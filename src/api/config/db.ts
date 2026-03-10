import { MongoClient } from 'mongodb';
import type { DeviceDocument } from '../types';
import { AppError } from '../errors';

const URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/screens';

const DEFAULT_MONGODB_TIMEOUT_MS = 5000;
const mongodbTimeoutFromEnv = Number(process.env['MONGODB_CONNECT_TIMEOUT_MS']);
const MONGODB_CONNECT_TIMEOUT_MS =
  Number.isFinite(mongodbTimeoutFromEnv) && mongodbTimeoutFromEnv > 0
    ? mongodbTimeoutFromEnv
    : DEFAULT_MONGODB_TIMEOUT_MS;

let clientPromise: Promise<MongoClient> | null = null;

export const getDbConnection = async (uri: string = URI) => {
  try {
    if (!clientPromise) {
      clientPromise = MongoClient.connect(uri, {
        connectTimeoutMS: MONGODB_CONNECT_TIMEOUT_MS,
        serverSelectionTimeoutMS: MONGODB_CONNECT_TIMEOUT_MS,
      });
    }
    const client = await clientPromise;
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
    // Reset clientPromise to null after an error to allow retries
    clientPromise = null;
  }
};
