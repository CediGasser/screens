import { DEVICE_TYPE_OPTIONS, DeviceType } from './devices-api';

export interface DeviceFilters {
  manufacturer?: string;
  name?: string;
  type?: DeviceType;
  releaseDateFrom?: string;
  releaseDateTo?: string;
  screenPixelWidthMin?: number;
  screenPixelWidthMax?: number;
  screenPixelHeightMin?: number;
  screenPixelHeightMax?: number;
  pixelDensityMin?: number;
  pixelDensityMax?: number;
  screenCornerRadiusMin?: number;
  screenCornerRadiusMax?: number;
}

export function normalizeDeviceFilters(filters: DeviceFilters): DeviceFilters {
  const normalized: DeviceFilters = {
    manufacturer: normalizeText(filters.manufacturer),
    name: normalizeText(filters.name),
    type: filters.type,
    releaseDateFrom: normalizeText(filters.releaseDateFrom),
    releaseDateTo: normalizeText(filters.releaseDateTo),
    screenPixelWidthMin: normalizeNumber(filters.screenPixelWidthMin),
    screenPixelWidthMax: normalizeNumber(filters.screenPixelWidthMax),
    screenPixelHeightMin: normalizeNumber(filters.screenPixelHeightMin),
    screenPixelHeightMax: normalizeNumber(filters.screenPixelHeightMax),
    pixelDensityMin: normalizeNumber(filters.pixelDensityMin),
    pixelDensityMax: normalizeNumber(filters.pixelDensityMax),
  };

  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined && value !== ''),
  ) as DeviceFilters;
}

export function deviceFiltersToQueryParams(filters: DeviceFilters): Record<string, string> {
  const normalized = normalizeDeviceFilters(filters);
  return Object.fromEntries(Object.entries(normalized).map(([key, value]) => [key, String(value)]));
}

export function deviceFiltersFromQueryParams(query: Record<string, string | null | undefined>) {
  return normalizeDeviceFilters({
    manufacturer: query['manufacturer'] ?? undefined,
    name: query['name'] ?? undefined,
    type: parseType(query['type']),
    releaseDateFrom: query['releaseDateFrom'] ?? undefined,
    releaseDateTo: query['releaseDateTo'] ?? undefined,
    screenPixelWidthMin: parseNumber(query['screenPixelWidthMin']),
    screenPixelWidthMax: parseNumber(query['screenPixelWidthMax']),
    screenPixelHeightMin: parseNumber(query['screenPixelHeightMin']),
    screenPixelHeightMax: parseNumber(query['screenPixelHeightMax']),
    pixelDensityMin: parseNumber(query['pixelDensityMin']),
    pixelDensityMax: parseNumber(query['pixelDensityMax']),
    screenCornerRadiusMin: parseNumber(query['screenCornerRadiusMin']),
    screenCornerRadiusMax: parseNumber(query['screenCornerRadiusMax']),
  });
}

export function deviceFiltersFromParamMap(paramMap: {
  keys: string[];
  get(name: string): string | null;
}) {
  const query: Record<string, string | null> = {};
  for (const key of paramMap.keys) {
    query[key] = paramMap.get(key);
  }
  return deviceFiltersFromQueryParams(query);
}

function parseNumber(value: string | null | undefined): number | undefined {
  if (value == null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseType(value: string | null | undefined): DeviceFilters['type'] | undefined {
  if (!value) return undefined;
  return DEVICE_TYPE_OPTIONS[value as NonNullable<DeviceFilters['type']>]
    ? (value as DeviceFilters['type'])
    : undefined;
}

function normalizeNumber(value: number | undefined): number | undefined {
  return value == null || !Number.isFinite(value) ? undefined : value;
}

function normalizeText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
