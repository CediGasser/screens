import { TestBed } from '@angular/core/testing';

import { CsvParser } from './csv-parser';

describe('CsvParser', () => {
  let service: CsvParser;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParser);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse a CSV file into JSON rows', async () => {
    const file = new File(['manufacturer,name\nApple,iPhone 16\nGoogle,Pixel 9'], 'devices.csv', {
      type: 'text/csv',
    });

    const parsed = await service.parseFileToJson(file);

    expect(parsed).toEqual([
      { manufacturer: 'Apple', name: 'iPhone 16' },
      { manufacturer: 'Google', name: 'Pixel 9' },
    ]);
  });

  it('should reject when papaparse reports parsing errors', async () => {
    const file = new File(['manufacturer,name\nApple'], 'devices.csv', { type: 'text/csv' });

    await expect(service.parseFileToJson(file)).rejects.toThrowError(
      'CSV parsing failed: row 1: Too few fields: expected 2 fields but parsed 1',
    );
  });

  it('should remove completely empty parsed rows', async () => {
    const file = new File(
      ['manufacturer,name\nApple,iPhone 16\n\n  ,   \nGoogle,Pixel 9'],
      'devices.csv',
      {
        type: 'text/csv',
      },
    );

    const parsed = await service.parseFileToJson(file);

    expect(parsed).toEqual([
      { manufacturer: 'Apple', name: 'iPhone 16' },
      { manufacturer: 'Google', name: 'Pixel 9' },
    ]);
  });

  it('should reject when input is not a file', async () => {
    await expect(service.parseFileToJson(null as unknown as File)).rejects.toThrowError(
      'A valid CSV file must be provided',
    );
  });
});
