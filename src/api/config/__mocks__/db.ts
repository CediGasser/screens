import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppError } from '../../errors';
import { getDbConnection as actualGetDbConnection } from '../db';

const mongod = await MongoMemoryServer.create({
  instance: {
    dbName: 'screens',
  },
});

const URI = mongod.getUri();
let shouldFailConnection = false;

export const getDbConnection = async (_: string) => {
  if (shouldFailConnection) {
    throw new AppError(
      'Database unavailable. Please try again in a moment.',
      503,
      'DB_UNAVAILABLE',
    );
  }

  return actualGetDbConnection(URI);
};

export const stopDb = async () => {
  await mongod.stop();
};

export const setDbConnectionFailure = (shouldFail: boolean) => {
  shouldFailConnection = shouldFail;
};
