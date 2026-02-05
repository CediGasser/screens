import { Component, Signal } from '@angular/core';
import { DevicesTable } from '../../features/devices-table/devices-table';
import { Device, DevicesApi } from '../../services/devices-api';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin',
  imports: [DevicesTable],
  template: `
    <section>
      <h1>Admin Dashboard</h1>
      <app-devices-table [devices]="devices()" [enableOptions]="true"></app-devices-table>
    </section>
  `,
  styleUrl: './admin.css',
})
export class Admin {
  protected devices: Signal<Device[]>;

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getDevices(), { initialValue: [] });
  }
}
