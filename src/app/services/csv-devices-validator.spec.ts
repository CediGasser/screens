import { TestBed } from '@angular/core/testing';

import { CsvDevicesValidator } from './csv-devices-validator';

describe('CsvDevicesValidator', () => {
  let service: CsvDevicesValidator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvDevicesValidator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should convert valid rows into device payloads', () => {
    const result = service.validate([
      {
        manufacturer: '  Apple  ',
        name: ' iPhone 16 ',
        type: 'SMARTPHONE',
        releaseDate: '2026-01-10',
        screenSize: '6.1',
        screenPixelHeight: '2556',
        screenPixelWidth: '1179',
        screenCornerRadius: '5',
      },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.devices).toEqual([
      {
        manufacturer: 'Apple',
        name: 'iPhone 16',
        type: 'smartphone',
        releaseDate: '2026-01-10',
        screenSize: 6.1,
        screenPixelHeight: 2556,
        screenPixelWidth: 1179,
        screenCornerRadius: 5,
        isDraft: true,
      },
    ]);
  });

  it('should report missing required headers', () => {
    const result = service.validate([
      {
        manufacturer: 'Apple',
        name: 'iPhone 16',
        type: 'smartphone',
      },
    ]);

    expect(result.devices).toEqual([]);
    expect(result.errors).toEqual([
      'Missing required CSV headers: releaseDate, screenSize, screenPixelHeight, screenPixelWidth, screenCornerRadius. Please use the provided template format.',
    ]);
  });

  it('should report row-level field issues with row numbers', () => {
    const result = service.validate([
      {
        manufacturer: 'Apple',
        name: '',
        type: 'phone',
        releaseDate: '01/10/2026',
        screenSize: 'not-a-number',
        screenPixelHeight: '2556',
        screenPixelWidth: '',
        screenCornerRadius: '- ',
      },
    ]);

    expect(result.devices).toEqual([]);
    expect(result.errors).toEqual([
      'Row 2: name is required.',
      'Row 2: type must be one of smartphone, tablet, laptop, desktop, wearable, other. Received "phone".',
      'Row 2: releaseDate must be in YYYY-MM-DD format.',
      'Row 2: screenSize must be a number.',
      'Row 2: screenPixelWidth must be a number.',
      'Row 2: screenCornerRadius must be a number.',
    ]);
  });

  it('should report when CSV has no data rows', () => {
    const result = service.validate([]);

    expect(result.devices).toEqual([]);
    expect(result.errors).toEqual(['The CSV file does not contain any device rows to import.']);
  });
});
