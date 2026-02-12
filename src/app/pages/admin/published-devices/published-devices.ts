import { Component, Signal } from '@angular/core';
import { Device, DevicesApi } from '../../../services/devices-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { DevicesTable } from '../../../features/devices-table/devices-table';

@Component({
  selector: 'app-published-devices',
  imports: [DevicesTable],
  template: `
    <h2>Published Devices</h2>
    <app-devices-table [devices]="devices()" [enableOptions]="true"></app-devices-table>
  `,
  styleUrl: './published-devices.css',
})
export class PublishedDevices {
  protected devices: Signal<Device[]>;

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getPublishedDevices(), { initialValue: [] });
  }
}
