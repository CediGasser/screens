import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { setTestDbUri } from '../config/db';
import apiRouter from '../index';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'screens',
    },
  });
  setTestDbUri(mongod.getUri());
});

const MOCK_DEVICES = [
  {
    id: 'device-001',
    manufacturer: 'Apple',
    name: 'iPhone 14 Pro',
    type: 'smartphone',
    releaseDate: '2022-09-16',
    screenSize: 147,
    screenPixelHeight: 2556,
    screenPixelWidth: 1179,
    screenCornerRadius: 20,
    isDraft: false,
  },
  {
    id: 'device-002',
    manufacturer: 'Samsung',
    name: 'Galaxy S22 Ultra',
    type: 'smartphone',
    releaseDate: '2022-02-25',
    screenSize: 163,
    screenPixelHeight: 3088,
    screenPixelWidth: 1440,
    screenCornerRadius: 15,
    isDraft: false,
  },
  {
    id: 'device-003',
    manufacturer: 'Google',
    name: 'Pixel 6',
    type: 'smartphone',
    releaseDate: '2021-10-28',
    screenSize: 158,
    screenPixelHeight: 2400,
    screenPixelWidth: 1080,
    screenCornerRadius: 16,
    isDraft: true,
  },
  {
    id: 'device-004',
    manufacturer: 'Microsoft',
    name: 'Surface Pro 8',
    type: 'tablet',
    releaseDate: '2021-10-05',
    screenSize: 287,
    screenPixelHeight: 2880,
    screenPixelWidth: 1920,
    screenCornerRadius: 12,
    isDraft: false,
  },
  {
    id: 'device-005',
    manufacturer: 'Apple',
    name: 'MacBook Air M2',
    type: 'laptop',
    releaseDate: '2022-07-15',
    screenSize: 356,
    screenPixelHeight: 2560,
    screenPixelWidth: 1664,
    screenCornerRadius: 8,
    isDraft: true,
  },
  {
    id: 'device-006',
    manufacturer: 'Fitbit',
    name: 'Versa 3',
    type: 'wearable',
    releaseDate: '2020-09-25',
    screenSize: 40,
    screenPixelHeight: 336,
    screenPixelWidth: 336,
    screenCornerRadius: 0,
    isDraft: false,
  },
  {
    id: 'device-007',
    manufacturer: 'Dell',
    name: 'XPS 13',
    type: 'laptop',
    releaseDate: '2021-09-30',
    screenSize: 331,
    screenPixelHeight: 1920,
    screenPixelWidth: 1200,
    screenCornerRadius: 10,
    isDraft: true,
  },
];

describe('Devices API routes', () => {
  const app = express();
  app.use('/api', apiRouter);

  describe('Happy path tests', () => {
    it('should initially return an empty array', async () => {
      const response = await request(app).get('/api/devices');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should create a new device and return it with a generated id', async () => {
      const { id, ...exampleDevice } = MOCK_DEVICES[0];
      const response = await request(app).post('/api/devices').send(exampleDevice);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(exampleDevice);
      expect(response.body.id).toBeDefined();
    });

    it('should return the created device when fetching all devices', async () => {
      const response = await request(app).get('/api/devices');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      const { id, ...expectedDevice } = MOCK_DEVICES[0];
      expect(response.body[0]).toMatchObject(expectedDevice);
    });

    it('should return the created device when fetching by id', async () => {
      const allDevicesResponse = await request(app).get('/api/devices');
      const createdDeviceId = allDevicesResponse.body[0].id;

      const response = await request(app).get(`/api/devices/${createdDeviceId}`);
      expect(response.status).toBe(200);
      const { id, ...expectedDevice } = MOCK_DEVICES[0];
      expect(response.body).toMatchObject(expectedDevice);
    });

    it('should return 404 for non-existing device id', async () => {
      const response = await request(app).get('/api/devices/non-existing-id');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });

    it('should update an existing device', async () => {
      const allDevicesResponse = await request(app).get('/api/devices');
      const createdDeviceId = allDevicesResponse.body[0].id;

      const updatedData = { name: 'Updated Device Name' };
      const response = await request(app).put(`/api/devices/${createdDeviceId}`).send(updatedData);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedData.name);
    });

    it('should delete an existing device', async () => {
      const allDevicesResponse = await request(app).get('/api/devices');
      const createdDeviceId = allDevicesResponse.body[0].id;

      const deleteResponse = await request(app).delete(`/api/devices/${createdDeviceId}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app).get(`/api/devices/${createdDeviceId}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('Error path tests', () => {
    it('should return 404 when getting a device with invalid ObjectId format', async () => {
      const response = await request(app).get('/api/devices/invalid-id');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });

    it('should return 404 when getting a device with valid but non-existing ObjectId', async () => {
      const response = await request(app).get('/api/devices/507f1f77bcf86cd799439011');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });

    it('should return 404 when updating a device with invalid ObjectId format', async () => {
      const response = await request(app).put('/api/devices/invalid-id').send({ name: 'Test' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });

    it('should return 404 when updating a device with valid but non-existing ObjectId', async () => {
      const response = await request(app)
        .put('/api/devices/507f1f77bcf86cd799439011')
        .send({ name: 'Test' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });

    it('should return 204 when deleting a device with invalid ObjectId format', async () => {
      const response = await request(app).delete('/api/devices/invalid-id');
      expect(response.status).toBe(204);
    });

    it('should return 404 when deleting a device with valid but non-existing ObjectId', async () => {
      const response = await request(app).delete('/api/devices/507f1f77bcf86cd799439011');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Device not found' });
    });
  });
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});
