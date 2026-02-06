import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

/**
 * Service for interacting with the devices API.
 */
@Injectable({
  providedIn: 'root',
})
export class DevicesApi {
  constructor(private http: HttpClient) {}
  private devices: Device[] = [
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

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices');
  }
}
