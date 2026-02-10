import { MongoClient } from 'mongodb';
import type { DeviceDocument } from '../../types';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({
  instance: {
    dbName: 'screens',
  },
});

const URI = mongod.getUri();

export const getDbConnection = async () => {
  try {
    const client = await MongoClient.connect(URI);
    const db = client.db('screens');
    const devicesCollection = db.collection<DeviceDocument>('devices');
    return { db, devicesCollection, client };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const stopDb = async () => {
  await mongod.stop();
};
