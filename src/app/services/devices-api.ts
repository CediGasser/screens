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

  getPublishedDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices', { params: { isDraft: 'false' } });
  }

  getSuggestions(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/devices', { params: { isDraft: 'true' } });
  }
}
