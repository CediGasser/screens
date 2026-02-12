import { Component, Signal, viewChild } from '@angular/core';
import { DevicesTable } from '../../features/devices-table/devices-table';
import { Device, DevicesApi } from '../../services/devices-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceFormDialog } from '../../features/device-form-dialog/device-form-dialog';

@Component({
  selector: 'app-home',
  imports: [DevicesTable, DeviceFormDialog],
  template: `
    <section>
      <header class="page-header">
        <h1>Devices</h1>
        <button class="suggest-btn" (click)="openSuggestDialog()">Suggest a Device</button>
      </header>
      <app-devices-table [devices]="devices()"></app-devices-table>
    </section>

    <app-device-form-dialog #deviceFormDialog (deviceCreated)="onDeviceCreated($event)" />
  `,
  styleUrl: './home.css',
})
export class Home {
  protected devices: Signal<Device[]>;
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getPublishedDevices(), { initialValue: [] });
  }

  openSuggestDialog() {
    this.deviceFormDialog().openForCreate(true);
  }

  onDeviceCreated(device: Device) {
    // Device was submitted as a suggestion (draft)
    console.log('Device suggestion submitted:', device);
  }
}
