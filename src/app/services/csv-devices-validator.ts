import { Injectable } from '@angular/core';
import { DeviceFormData, DeviceType } from './devices-api';

const REQUIRED_HEADERS: (keyof Omit<DeviceFormData, 'isDraft'>)[] = [
  'manufacturer',
  'name',
  'type',
  'releaseDate',
  'screenSize',
  'screenPixelHeight',
  'screenPixelWidth',
  'screenCornerRadius',
];

const ALLOWED_DEVICE_TYPES: DeviceType[] = [
  'smartphone',
  'tablet',
  'laptop',
  'desktop',
  'wearable',
  'other',
];

interface ParsedCsvRow {
  [key: string]: unknown;
}

export interface DeviceCsvValidationResult {
  devices: DeviceFormData[];
  errors: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CsvDevicesValidator {
  validate(rows: ParsedCsvRow[]): DeviceCsvValidationResult {
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        devices: [],
        errors: ['The CSV file does not contain any device rows to import.'],
      };
    }

    const headers = Object.keys(rows[0] ?? {});
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return {
        devices: [],
        errors: [
          `Missing required CSV headers: ${missingHeaders.join(', ')}. Please use the provided template format.`,
        ],
      };
    }

    const devices: DeviceFormData[] = [];
    const errors: string[] = [];

    rows.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2;
      const manufacturer = this.readText(row, 'manufacturer');
      const name = this.readText(row, 'name');
      const typeValue = this.readText(row, 'type').toLowerCase();
      const releaseDate = this.readText(row, 'releaseDate');
      const screenSize = this.readNumber(row, 'screenSize');
      const screenPixelHeight = this.readNumber(row, 'screenPixelHeight');
      const screenPixelWidth = this.readNumber(row, 'screenPixelWidth');
      const screenCornerRadius = this.readNumber(row, 'screenCornerRadius');

      if (!manufacturer) {
        errors.push(`Row ${rowNumber}: manufacturer is required.`);
      }
      if (!name) {
        errors.push(`Row ${rowNumber}: name is required.`);
      }
      if (!typeValue) {
        errors.push(`Row ${rowNumber}: type is required.`);
      } else if (!ALLOWED_DEVICE_TYPES.includes(typeValue as DeviceType)) {
        errors.push(
          `Row ${rowNumber}: type must be one of ${ALLOWED_DEVICE_TYPES.join(', ')}. Received "${typeValue}".`,
        );
      }

      if (!releaseDate) {
        errors.push(`Row ${rowNumber}: releaseDate is required.`);
      } else if (!this.isIsoDate(releaseDate)) {
        errors.push(`Row ${rowNumber}: releaseDate must be in YYYY-MM-DD format.`);
      }

      if (screenSize == null) {
        errors.push(`Row ${rowNumber}: screenSize must be a number.`);
      }
      if (screenPixelHeight == null) {
        errors.push(`Row ${rowNumber}: screenPixelHeight must be a number.`);
      }
      if (screenPixelWidth == null) {
        errors.push(`Row ${rowNumber}: screenPixelWidth must be a number.`);
      }
      if (screenCornerRadius == null) {
        errors.push(`Row ${rowNumber}: screenCornerRadius must be a number.`);
      }

      if (
        manufacturer &&
        name &&
        this.isDeviceType(typeValue) &&
        this.isIsoDate(releaseDate) &&
        screenSize != null &&
        screenPixelHeight != null &&
        screenPixelWidth != null &&
        screenCornerRadius != null
      ) {
        devices.push({
          manufacturer,
          name,
          type: typeValue,
          releaseDate,
          screenSize,
          screenPixelHeight,
          screenPixelWidth,
          screenCornerRadius,
          isDraft: true,
        });
      }
    });

    return {
      devices,
      errors,
    };
  }

  private readText(row: ParsedCsvRow, key: string): string {
    const value = row[key];
    if (value == null) {
      return '';
    }
    return String(value).trim();
  }

  private readNumber(row: ParsedCsvRow, key: string): number | null {
    const rawValue = this.readText(row, key);
    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private isDeviceType(value: string): value is DeviceType {
    return ALLOWED_DEVICE_TYPES.includes(value as DeviceType);
  }
}
