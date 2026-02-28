import { Device, DeviceDocument, DeviceQueryFilters } from '../types';
import { ValidationError } from '../errors';

const DEVICE_TYPES: Device['type'][] = [
  'smartphone',
  'tablet',
  'laptop',
  'desktop',
  'wearable',
  'other',
];

type DeviceField = keyof DeviceDocument;

const DEVICE_FIELDS: DeviceField[] = [
  'manufacturer',
  'name',
  'type',
  'releaseDate',
  'screenSize',
  'screenPixelHeight',
  'screenPixelWidth',
  'screenCornerRadius',
  'isDraft',
];

export interface DeviceBulkUpdatePayload {
  id: string;
  data: Partial<DeviceDocument>;
}

export function validateCreateDevicePayload(payload: unknown): DeviceDocument {
  return validateDeviceDocument(payload, 'Request body');
}

export function validateUpdateDevicePayload(payload: unknown): Partial<DeviceDocument> {
  return validatePartialDeviceDocument(payload, 'Request body');
}

export function validateBulkCreateDevicesPayload(payload: unknown): DeviceDocument[] {
  if (!Array.isArray(payload)) {
    throw new ValidationError('Request body must be an array of devices');
  }

  return payload.map((device, index) =>
    validateDeviceDocument(device, `Request body item at index ${index}`),
  );
}

export function validateBulkUpdateDevicesPayload(payload: unknown): DeviceBulkUpdatePayload[] {
  if (!Array.isArray(payload)) {
    throw new ValidationError('Request body must be an array of device updates');
  }

  const updates = payload as any[];

  return updates.map((update, index) => {
    if (!isPlainObject(update)) {
      throw new ValidationError(`Update at index ${index} must be an object`);
    }

    const id = readRequiredString(update['id'], `Update at index ${index} id`);
    const data = validatePartialDeviceDocument(update['data'], `Update at index ${index} data`);

    return { id, data };
  });
}

export function validateBulkDeleteDevicesPayload(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    throw new ValidationError('Request body must be an array of device IDs to delete');
  }

  const ids = payload as any[];

  return ids.map((id, index) => readRequiredString(id, `Id at index ${index}`));
}

export function parseDeviceQueryFilters(query: Record<string, unknown>): DeviceQueryFilters {
  const type = readStringQuery(query['type']);
  if (type != null && !isDeviceType(type)) {
    throw new ValidationError(
      `Invalid type filter: ${type}. Allowed values are ${DEVICE_TYPES.join(', ')}`,
    );
  }

  const filters: DeviceQueryFilters = {
    isDraft: parseBooleanQuery(query['isDraft'], 'isDraft'),
    manufacturer: readStringQuery(query['manufacturer']),
    name: readStringQuery(query['name']),
    type,
    releaseDateFrom: parseDateQuery(query['releaseDateFrom'], 'releaseDateFrom'),
    releaseDateTo: parseDateQuery(query['releaseDateTo'], 'releaseDateTo'),
    screenSizeMin: parseNumberQuery(query['screenSizeMin'], 'screenSizeMin'),
    screenSizeMax: parseNumberQuery(query['screenSizeMax'], 'screenSizeMax'),
    screenPixelWidthMin: parseNumberQuery(query['screenPixelWidthMin'], 'screenPixelWidthMin'),
    screenPixelWidthMax: parseNumberQuery(query['screenPixelWidthMax'], 'screenPixelWidthMax'),
    screenPixelHeightMin: parseNumberQuery(query['screenPixelHeightMin'], 'screenPixelHeightMin'),
    screenPixelHeightMax: parseNumberQuery(query['screenPixelHeightMax'], 'screenPixelHeightMax'),
    pixelDensityMin: parseNumberQuery(query['pixelDensityMin'], 'pixelDensityMin'),
    pixelDensityMax: parseNumberQuery(query['pixelDensityMax'], 'pixelDensityMax'),
    screenCornerRadiusMin: parseNumberQuery(
      query['screenCornerRadiusMin'],
      'screenCornerRadiusMin',
    ),
    screenCornerRadiusMax: parseNumberQuery(
      query['screenCornerRadiusMax'],
      'screenCornerRadiusMax',
    ),
  };

  validateRangeOrder(filters.screenSizeMin, filters.screenSizeMax, 'screenSize');
  validateRangeOrder(filters.screenPixelWidthMin, filters.screenPixelWidthMax, 'screenPixelWidth');
  validateRangeOrder(
    filters.screenPixelHeightMin,
    filters.screenPixelHeightMax,
    'screenPixelHeight',
  );
  validateRangeOrder(filters.pixelDensityMin, filters.pixelDensityMax, 'pixelDensity');
  validateRangeOrder(
    filters.screenCornerRadiusMin,
    filters.screenCornerRadiusMax,
    'screenCornerRadius',
  );

  if (
    filters.releaseDateFrom != null &&
    filters.releaseDateTo != null &&
    filters.releaseDateFrom > filters.releaseDateTo
  ) {
    throw new ValidationError('releaseDateFrom cannot be greater than releaseDateTo');
  }

  return filters;
}

function validateDeviceDocument(payload: unknown, label: string): DeviceDocument {
  if (!isPlainObject(payload)) {
    throw new ValidationError(`${label} must be an object`);
  }

  rejectUnknownDeviceFields(payload, label);

  return {
    manufacturer: readRequiredString(payload['manufacturer'], `${label} manufacturer`),
    name: readRequiredString(payload['name'], `${label} name`),
    type: readDeviceType(payload['type'], `${label} type`),
    releaseDate: readDateString(payload['releaseDate'], `${label} releaseDate`),
    screenSize: readNumber(payload['screenSize'], `${label} screenSize`, { minExclusive: 0 }),
    screenPixelHeight: readNumber(payload['screenPixelHeight'], `${label} screenPixelHeight`, {
      minExclusive: 0,
    }),
    screenPixelWidth: readNumber(payload['screenPixelWidth'], `${label} screenPixelWidth`, {
      minExclusive: 0,
    }),
    screenCornerRadius: readNumber(payload['screenCornerRadius'], `${label} screenCornerRadius`, {
      minInclusive: 0,
    }),
    isDraft: readBoolean(payload['isDraft'], `${label} isDraft`),
  };
}

function validatePartialDeviceDocument(payload: unknown, label: string): Partial<DeviceDocument> {
  if (!isPlainObject(payload)) {
    throw new ValidationError(`${label} must be an object`);
  }

  rejectUnknownDeviceFields(payload, label);

  const updates: Partial<DeviceDocument> = {};

  if ('manufacturer' in payload) {
    updates.manufacturer = readRequiredString(payload['manufacturer'], `${label} manufacturer`);
  }
  if ('name' in payload) {
    updates.name = readRequiredString(payload['name'], `${label} name`);
  }
  if ('type' in payload) {
    updates.type = readDeviceType(payload['type'], `${label} type`);
  }
  if ('releaseDate' in payload) {
    updates.releaseDate = readDateString(payload['releaseDate'], `${label} releaseDate`);
  }
  if ('screenSize' in payload) {
    updates.screenSize = readNumber(payload['screenSize'], `${label} screenSize`, {
      minExclusive: 0,
    });
  }
  if ('screenPixelHeight' in payload) {
    updates.screenPixelHeight = readNumber(
      payload['screenPixelHeight'],
      `${label} screenPixelHeight`,
      {
        minExclusive: 0,
      },
    );
  }
  if ('screenPixelWidth' in payload) {
    updates.screenPixelWidth = readNumber(
      payload['screenPixelWidth'],
      `${label} screenPixelWidth`,
      {
        minExclusive: 0,
      },
    );
  }
  if ('screenCornerRadius' in payload) {
    updates.screenCornerRadius = readNumber(
      payload['screenCornerRadius'],
      `${label} screenCornerRadius`,
      {
        minInclusive: 0,
      },
    );
  }
  if ('isDraft' in payload) {
    updates.isDraft = readBoolean(payload['isDraft'], `${label} isDraft`);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError(`${label} must include at least one updatable field`);
  }

  return updates;
}

function rejectUnknownDeviceFields(payload: Record<string, unknown>, label: string) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !DEVICE_FIELDS.includes(field as DeviceField),
  );

  if (unknownFields.length > 0) {
    throw new ValidationError(`${label} includes unknown field(s): ${unknownFields.join(', ')}`);
  }
}

function readStringQuery(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim() !== '') {
    return value[0].trim();
  }
  return undefined;
}

function parseBooleanQuery(value: unknown, fieldName: string): boolean | undefined {
  const text = readStringQuery(value);
  if (text == null) return undefined;
  if (text === 'true') return true;
  if (text === 'false') return false;
  throw new ValidationError(`${fieldName} must be either "true" or "false"`);
}

function parseNumberQuery(value: unknown, fieldName: string): number | undefined {
  const text = readStringQuery(value);
  if (text == null) return undefined;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  return parsed;
}

function parseDateQuery(value: unknown, fieldName: string): string | undefined {
  const text = readStringQuery(value);
  if (text == null) return undefined;
  return readDateString(text, fieldName);
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required and must be a non-empty string`);
  }
  return value.trim();
}

function readBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}

function readNumber(
  value: unknown,
  fieldName: string,
  options: { minInclusive?: number; minExclusive?: number } = {},
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  if (options.minInclusive != null && value < options.minInclusive) {
    throw new ValidationError(
      `${fieldName} must be greater than or equal to ${options.minInclusive}`,
    );
  }

  if (options.minExclusive != null && value <= options.minExclusive) {
    throw new ValidationError(`${fieldName} must be greater than ${options.minExclusive}`);
  }

  return value;
}

function readDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required and must be a date in YYYY-MM-DD format`);
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new ValidationError(`${fieldName} must use YYYY-MM-DD format`);
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid calendar date`);
  }

  return trimmed;
}

function readDeviceType(value: unknown, fieldName: string): Device['type'] {
  if (!isDeviceType(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${DEVICE_TYPES.join(', ')}`);
  }
  return value;
}

function isDeviceType(value: unknown): value is Device['type'] {
  return DEVICE_TYPES.includes(value as Device['type']);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function validateRangeOrder(min: number | undefined, max: number | undefined, fieldName: string) {
  if (min != null && max != null && min > max) {
    throw new ValidationError(`${fieldName}Min cannot be greater than ${fieldName}Max`);
  }
}
