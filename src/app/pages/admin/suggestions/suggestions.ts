import { Component, Signal, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Device, DevicesApi } from '../../../services/devices-api';
import { DevicesTable } from '../../../features/devices-table/devices-table';
import { DeviceFormDialog } from '../../../features/device-form-dialog/device-form-dialog';

@Component({
  selector: 'app-suggestions',
  imports: [DevicesTable, DeviceFormDialog],
  template: `
    <h2>Suggested Devices</h2>
    <app-devices-table
      [devices]="devices()"
      [enableOptions]="true"
      (editDevice)="onEditDevice($event)"
      (deleteDevice)="onDeleteDevice($event)"
    ></app-devices-table>

    <app-device-form-dialog #deviceFormDialog (deviceUpdated)="onDeviceUpdated($event)" />
  `,
  styleUrl: './suggestions.css',
})
export class Suggestions {
  protected devices = signal<Device[]>([]);
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');

  constructor(private devicesApi: DevicesApi) {
    this.loadDevices();
  }

  private loadDevices() {
    this.devicesApi.getSuggestions().subscribe((devices) => {
      this.devices.set(devices);
    });
  }

  onEditDevice(device: Device) {
    this.deviceFormDialog().openForEdit(device);
  }

  onDeleteDevice(device: Device) {
    if (confirm(`Are you sure you want to delete "${device.manufacturer} ${device.name}"?`)) {
      this.devicesApi.deleteDevice(device.id).subscribe({
        next: () => this.loadDevices(),
        error: (err) => console.error('Failed to delete device:', err),
      });
    }
  }

  onDeviceUpdated(device: Device) {
    this.loadDevices();
  }
}
