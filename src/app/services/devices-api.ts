import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceFilters, deviceFiltersToQueryParams } from './device-filters';

export interface Device {
  id: string;
  manufacturer: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'laptop' | 'desktop' | 'wearable' | 'other';
  releaseDate: string;
  /** Screen diagonal in mm */
  screenSize: number;
  screenPixelHeight: number;
  screenPixelWidth: number;
  screenCornerRadius: number;
  isDraft: boolean;
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
