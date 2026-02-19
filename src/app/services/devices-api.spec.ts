import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Device, DevicesApi } from './devices-api';

describe('DevicesApi', () => {
  let service: DevicesApi;
  let httpMock: HttpTestingController;

  const makeDevice = (id: string): Device => ({
    id,
    manufacturer: 'Acme',
    name: `Device ${id}`,
    type: 'smartphone',
    releaseDate: '2025-01-01',
    screenSize: 6.1,
    screenPixelHeight: 2400,
    screenPixelWidth: 1080,
    screenCornerRadius: 12,
    isDraft: false,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DevicesApi, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DevicesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
  });

  it('returns an empty array when no updates are provided', () => {
    let result: Device[] | undefined;

    service.bulkUpdateDevices([]).subscribe((devices) => {
      result = devices;
    });

    expect(result).toEqual([]);
    httpMock.expectNone((req) => req.url.startsWith('/api/devices/'));
  });

  it('updates all devices in parallel and emits results in input order', () => {
    const updates = [
      { id: '1', data: { name: 'Updated One' } },
      { id: '2', data: { manufacturer: 'Updated Two' } },
    ];

    let result: Device[] | undefined;

    service.bulkUpdateDevices(updates).subscribe((devices) => {
      result = devices;
    });

    const req1 = httpMock.expectOne('/api/devices/1');
    const req2 = httpMock.expectOne('/api/devices/2');

    expect(req1.request.method).toBe('PUT');
    expect(req1.request.body).toEqual({ name: 'Updated One' });
    expect(req2.request.method).toBe('PUT');
    expect(req2.request.body).toEqual({ manufacturer: 'Updated Two' });

    const updated1 = { ...makeDevice('1'), name: 'Updated One' };
    const updated2 = { ...makeDevice('2'), manufacturer: 'Updated Two' };

    req2.flush(updated2);
    req1.flush(updated1);

    expect(result).toEqual([updated1, updated2]);
  });

  it('errors when any update request fails', () => {
    const updates = [
      { id: '1', data: { name: 'Updated One' } },
      { id: '2', data: { name: 'Updated Two' } },
    ];

    let receivedError: unknown;
    let nextCalled = false;

    service.bulkUpdateDevices(updates).subscribe({
      next: () => {
        nextCalled = true;
      },
      error: (error) => {
        receivedError = error;
      },
    });

    const req1 = httpMock.expectOne('/api/devices/1');
    httpMock.expectOne('/api/devices/2');

    req1.flush({ message: 'failed' }, { status: 500, statusText: 'Server Error' });

    expect(nextCalled).toBe(false);
    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
  });

  it('returns an empty array when no delete ids are provided', () => {
    let result: void[] | undefined;

    service.bulkDeleteDevices([]).subscribe((responses) => {
      result = responses;
    });

    expect(result).toEqual([]);
    httpMock.expectNone((req) => req.url.startsWith('/api/devices/'));
  });

  it('deletes all devices in parallel and emits one result per id in input order', () => {
    const ids = ['1', '2'];

    let result: void[] | undefined;

    service.bulkDeleteDevices(ids).subscribe((responses) => {
      result = responses;
    });

    const req1 = httpMock.expectOne('/api/devices/1');
    const req2 = httpMock.expectOne('/api/devices/2');

    expect(req1.request.method).toBe('DELETE');
    expect(req2.request.method).toBe('DELETE');

    req2.flush(null);
    req1.flush(null);

    expect(result).toEqual([null, null]);
  });

  it('errors when any delete request fails', () => {
    const ids = ['1', '2'];

    let receivedError: unknown;
    let nextCalled = false;

    service.bulkDeleteDevices(ids).subscribe({
      next: () => {
        nextCalled = true;
      },
      error: (error) => {
        receivedError = error;
      },
    });

    const req1 = httpMock.expectOne('/api/devices/1');
    httpMock.expectOne('/api/devices/2');

    req1.flush({ message: 'failed' }, { status: 500, statusText: 'Server Error' });

    expect(nextCalled).toBe(false);
    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
  });
});
