import { Component, signal } from '@angular/core';
import { DevicesTable } from "../../features/devices-table/devices-table";
import { Device, DevicesApi } from '../../services/devices-api';

@Component({
  selector: 'app-home',
  imports: [DevicesTable],
  template: `
    <section>
      <h1>Devices</h1>
      <app-devices-table [devices]="devices()"></app-devices-table>
    </section>
  `,
  styleUrl: './home.css',
})

export class Home {
  protected devices = signal<Device[]>([]);

  constructor(private devicesApi: DevicesApi) {
    this.devices.set(this.devicesApi.getAllDevices());
  }
}
