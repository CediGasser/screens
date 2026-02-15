import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express, { RequestHandler } from 'express';
import request from 'supertest';
import apiRouter from '../index';
import type { User } from '../middlewares/auth';
import { stopDb } from '../config/__mocks__/db';

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

  describe('Happy path tests (authenticated)', () => {
    beforeEach(() => {
      setAuthenticated();
    });

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

  describe('Error path tests (authenticated)', () => {
    beforeEach(() => {
      setAuthenticated();
    });

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

  describe('Filter tests', () => {
    it('should return only draft devices when filter isDraft=true', async () => {
      setAuthenticated();
      // Create a draft device
      const { id, ...draftDevice } = MOCK_DEVICES[2]; // isDraft: true
      await request(app).post('/api/devices').send(draftDevice);

      const response = await request(app).get('/api/devices?isDraft=true');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((d: { isDraft: boolean }) => d.isDraft === true)).toBe(true);
    });

    it('should return only published devices when filter isDraft=false', async () => {
      setAuthenticated();
      // Create a published device
      const { id, ...publishedDevice } = MOCK_DEVICES[1]; // isDraft: false
      await request(app).post('/api/devices').send(publishedDevice);

      const response = await request(app).get('/api/devices?isDraft=false');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((d: { isDraft: boolean }) => d.isDraft === false)).toBe(true);
    });

    it('should return an empty array when listing all with filter isDraft=true and user is not authenticated', async () => {
      setUnauthenticated();
      const response = await request(app).get('/api/devices?isDraft=true');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    it('should filter by manufacturer (exact, case-insensitive) and name (substring)', async () => {
      setAuthenticated();
      const { id: _id1, ...device1 } = MOCK_DEVICES[0];
      const { id: _id2, ...device2 } = MOCK_DEVICES[1];

      await request(app).post('/api/devices').send(device1);
      await request(app).post('/api/devices').send(device2);

      const response = await request(app).get('/api/devices?manufacturer=apple&name=phone');
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.every(
          (d: { manufacturer: string; name: string }) =>
            d.manufacturer.toLowerCase() === 'apple' && d.name.toLowerCase().includes('phone'),
        ),
      ).toBe(true);
    });

    it('should filter by width, height and corner radius ranges', async () => {
      setAuthenticated();
      const { id: _id1, ...device1 } = MOCK_DEVICES[1];
      const { id: _id2, ...device2 } = MOCK_DEVICES[3];

      await request(app).post('/api/devices').send(device1);
      await request(app).post('/api/devices').send(device2);

      const response = await request(app).get(
        '/api/devices?screenPixelWidthMin=1400&screenPixelWidthMax=2000&screenPixelHeightMin=2800&screenCornerRadiusMax=15',
      );
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.every(
          (d: {
            screenPixelWidth: number;
            screenPixelHeight: number;
            screenCornerRadius: number;
          }) =>
            d.screenPixelWidth >= 1400 &&
            d.screenPixelWidth <= 2000 &&
            d.screenPixelHeight >= 2800 &&
            d.screenCornerRadius <= 15,
        ),
      ).toBe(true);
    });
  });

  describe('Metadata tests', () => {
    it('should return counts, boundaries and manufacturer list for authenticated users', async () => {
      setAuthenticated();

      const beforeResponse = await request(app).get('/api/devices/meta');
      expect(beforeResponse.status).toBe(200);

      const publishedMetaDevice = {
        manufacturer: 'Meta-Published-Co',
        name: 'Meta Published Device',
        type: 'desktop' as const,
        releaseDate: '2030-01-01',
        screenSize: 100,
        screenPixelHeight: 5000,
        screenPixelWidth: 3000,
        screenCornerRadius: 2,
        isDraft: false,
      };

      const draftMetaDevice = {
        manufacturer: 'Meta-Draft-Co',
        name: 'Meta Draft Device',
        type: 'tablet' as const,
        releaseDate: '2010-01-01',
        screenSize: 200,
        screenPixelHeight: 1000,
        screenPixelWidth: 600,
        screenCornerRadius: 40,
        isDraft: true,
      };

      await request(app).post('/api/devices').send(publishedMetaDevice);
      await request(app).post('/api/devices').send(draftMetaDevice);

      const afterResponse = await request(app).get('/api/devices/meta');
      expect(afterResponse.status).toBe(200);

      const beforeCounts = beforeResponse.body.counts as {
        totalDevices: number;
        draftDevices: number;
        publishedDevices: number;
      };
      const afterCounts = afterResponse.body.counts as {
        totalDevices: number;
        draftDevices: number;
        publishedDevices: number;
      };

      expect(afterCounts.totalDevices).toBe(beforeCounts.totalDevices + 2);
      expect(afterCounts.draftDevices).toBe(beforeCounts.draftDevices + 1);
      expect(afterCounts.publishedDevices).toBe(beforeCounts.publishedDevices + 1);

      const manufacturers = afterResponse.body.manufacturers as string[];
      expect(manufacturers).toContain('Meta-Published-Co');
      expect(manufacturers).toContain('Meta-Draft-Co');

      const boundaries = afterResponse.body.boundaries as {
        minReleaseDate: string | null;
        maxReleaseDate: string | null;
        minScreenPixelWidth: number | null;
        maxScreenPixelWidth: number | null;
        minScreenPixelHeight: number | null;
        maxScreenPixelHeight: number | null;
        minPixelDensity: number | null;
        maxPixelDensity: number | null;
        minScreenCornerRadius: number | null;
        maxScreenCornerRadius: number | null;
      };

      expect(boundaries.minReleaseDate).not.toBeNull();
      expect(boundaries.maxReleaseDate).not.toBeNull();
      expect(boundaries.minScreenPixelWidth).not.toBeNull();
      expect(boundaries.maxScreenPixelWidth).not.toBeNull();
      expect(boundaries.minScreenPixelHeight).not.toBeNull();
      expect(boundaries.maxScreenPixelHeight).not.toBeNull();
      expect(boundaries.minPixelDensity).not.toBeNull();
      expect(boundaries.maxPixelDensity).not.toBeNull();
      expect(boundaries.minScreenCornerRadius).not.toBeNull();
      expect(boundaries.maxScreenCornerRadius).not.toBeNull();
    });

    it('should exclude draft-only metadata for unauthenticated users', async () => {
      setAuthenticated();

      const publishedOnlyMetaDevice = {
        manufacturer: 'Meta-Visible-Co',
        name: 'Visible Meta Device',
        type: 'smartphone' as const,
        releaseDate: '2025-05-05',
        screenSize: 150,
        screenPixelHeight: 2400,
        screenPixelWidth: 1080,
        screenCornerRadius: 12,
        isDraft: false,
      };

      const draftOnlyMetaDevice = {
        manufacturer: 'Meta-Hidden-Draft-Co',
        name: 'Hidden Draft Meta Device',
        type: 'laptop' as const,
        releaseDate: '2024-04-04',
        screenSize: 320,
        screenPixelHeight: 1920,
        screenPixelWidth: 1200,
        screenCornerRadius: 8,
        isDraft: true,
      };

      await request(app).post('/api/devices').send(publishedOnlyMetaDevice);
      await request(app).post('/api/devices').send(draftOnlyMetaDevice);

      setUnauthenticated();
      const response = await request(app).get('/api/devices/meta');

      expect(response.status).toBe(200);

      const counts = response.body.counts as {
        totalDevices: number;
        draftDevices: number;
        publishedDevices: number;
      };
      expect(counts.draftDevices).toBe(0);
      expect(counts.totalDevices).toBe(counts.publishedDevices);

      const manufacturers = response.body.manufacturers as string[];
      expect(manufacturers).toContain('Meta-Visible-Co');
      expect(manufacturers).not.toContain('Meta-Hidden-Draft-Co');
    });
  });

  describe('Authorization tests', () => {
    let publishedDeviceId: string;
    let draftDeviceId: string;

    beforeAll(async () => {
      // Create test devices as authenticated user
      setAuthenticated();

      const { id: _id1, ...publishedDevice } = MOCK_DEVICES[1]; // isDraft: false
      const publishedRes = await request(app).post('/api/devices').send(publishedDevice);
      publishedDeviceId = publishedRes.body.id;

      const { id: _id2, ...draftDevice } = MOCK_DEVICES[2]; // isDraft: true
      const draftRes = await request(app).post('/api/devices').send(draftDevice);
      draftDeviceId = draftRes.body.id;
    });

    describe('Unauthenticated users', () => {
      beforeEach(() => {
        setUnauthenticated();
      });

      it('should only return published devices when listing all', async () => {
        const response = await request(app).get('/api/devices');
        expect(response.status).toBe(200);
        expect(response.body.every((d: { isDraft: boolean }) => d.isDraft === false)).toBe(true);
      });

      it('should return a published device by id', async () => {
        const response = await request(app).get(`/api/devices/${publishedDeviceId}`);
        expect(response.status).toBe(200);
        expect(response.body.isDraft).toBe(false);
      });

      it('should return 404 for a draft device by id', async () => {
        const response = await request(app).get(`/api/devices/${draftDeviceId}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Device not found' });
      });

      it('should allow creating a draft device', async () => {
        const { id, ...draftDevice } = MOCK_DEVICES[4]; // isDraft: true
        const response = await request(app).post('/api/devices').send(draftDevice);
        expect(response.status).toBe(201);
        expect(response.body.isDraft).toBe(true);
      });

      it('should reject creating a published device', async () => {
        const { id, ...publishedDevice } = MOCK_DEVICES[3]; // isDraft: false
        const response = await request(app).post('/api/devices').send(publishedDevice);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Cannot create published device');
      });

      it('should reject updating a device', async () => {
        const response = await request(app)
          .put(`/api/devices/${publishedDeviceId}`)
          .send({ name: 'Hacked Name' });
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
      });

      it('should reject deleting a device', async () => {
        const response = await request(app).delete(`/api/devices/${publishedDeviceId}`);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Unauthorized');
      });
    });

    describe('Authenticated users', () => {
      beforeEach(() => {
        setAuthenticated();
      });

      it('should return all devices including drafts when listing', async () => {
        const response = await request(app).get('/api/devices');
        expect(response.status).toBe(200);
        const hasDrafts = response.body.some((d: { isDraft: boolean }) => d.isDraft === true);
        expect(hasDrafts).toBe(true);
      });

      it('should return a draft device by id', async () => {
        const response = await request(app).get(`/api/devices/${draftDeviceId}`);
        expect(response.status).toBe(200);
        expect(response.body.isDraft).toBe(true);
      });

      it('should allow creating a published device', async () => {
        const { id, ...publishedDevice } = MOCK_DEVICES[5]; // isDraft: false
        const response = await request(app).post('/api/devices').send(publishedDevice);
        expect(response.status).toBe(201);
        expect(response.body.isDraft).toBe(false);
      });

      it('should allow updating a device', async () => {
        const response = await request(app)
          .put(`/api/devices/${publishedDeviceId}`)
          .send({ name: 'Authorized Update' });
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Authorized Update');
      });

      it('should allow deleting a device', async () => {
        // Create a device to delete
        const { id, ...device } = MOCK_DEVICES[6];
        const createRes = await request(app).post('/api/devices').send(device);
        const deviceId = createRes.body.id;

        const response = await request(app).delete(`/api/devices/${deviceId}`);
        expect(response.status).toBe(204);
      });
    });
  });
});

let mockUser: User = { authenticated: false };

vi.mock('../middlewares/auth', () => ({
  initializeAuth: vi.fn().mockResolvedValue(undefined),
  authMiddleware: ((req, _res, next) => {
    req.user = mockUser;
    next();
  }) as RequestHandler,
}));

// Mock with provided __mocks__ implementation
vi.mock('../config/db');

function setMockUser(user: User) {
  mockUser = user;
}

function setAuthenticated() {
  setMockUser({
    authenticated: true,
    sub: 'test-user-id',
    email: 'test@example.com',
    roles: [],
    claims: { sub: 'test-user-id' },
  });
}

function setUnauthenticated() {
  setMockUser({ authenticated: false });
}

afterAll(async () => {
  await stopDb();
});
