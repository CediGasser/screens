import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceFilters, deviceFiltersToQueryParams } from './device-filters';

export const DEVICE_TYPE_OPTIONS = {
  smartphone: 'Smartphone',
  tablet: 'Tablet',
  laptop: 'Laptop',
  desktop: 'Desktop',
  wearable: 'Wearable',
  other: 'Other',
} as const;

export type DeviceType = keyof typeof DEVICE_TYPE_OPTIONS;

export interface Device {
  id: string;
  manufacturer: string;
  name: string;
  type: DeviceType;
  releaseDate: string;
  /** Screen diagonal in inches */
  screenSize: number;
  screenPixelHeight: number;
  screenPixelWidth: number;
  screenCornerRadius: number;
  isDraft: boolean;
}

export interface DeviceMetadata {
  boundaries: {
    minReleaseDate: string | null;
    maxReleaseDate: string | null;
    minScreenSize: number | null;
    maxScreenSize: number | null;
    minScreenPixelWidth: number | null;
    maxScreenPixelWidth: number | null;
    minScreenPixelHeight: number | null;
    maxScreenPixelHeight: number | null;
    minPixelDensity: number | null;
    maxPixelDensity: number | null;
    minScreenCornerRadius: number | null;
    maxScreenCornerRadius: number | null;
  };
  manufacturers: string[];
  counts: {
    totalDevices: number;
    draftDevices: number;
    publishedDevices: number;
  };
}

export type DeviceFormData = Omit<Device, 'id'>;

/**
 * Service for interacting with the devices API.
 */
@Injectable({
  providedIn: 'root',
})
export class DevicesApi {
  constructor(private http: HttpClient) {}

  getDevicesMetadata(): Observable<DeviceMetadata> {
    return this.http.get<DeviceMetadata>('/api/devices/meta');
  }

  getPublishedDevices(filters: DeviceFilters = {}): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices', {
      params: {
        ...deviceFiltersToQueryParams(filters),
        isDraft: 'false',
      },
    });
  }

  getSuggestions(filters: DeviceFilters = {}): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices', {
      params: {
        ...deviceFiltersToQueryParams(filters),
        isDraft: 'true',
      },
    });
  }

  createDevice(device: DeviceFormData): Observable<Device> {
    return this.http.post<Device>('/api/devices', device);
  }

  updateDevice(id: string, device: Partial<DeviceFormData>): Observable<Device> {
    return this.http.put<Device>(`/api/devices/${id}`, device);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`/api/devices/${id}`);
  }
}
