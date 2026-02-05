import { Component, Signal, signal } from '@angular/core';
import { DevicesTable } from "../../features/devices-table/devices-table";
import { Device, DevicesApi } from '../../services/devices-api';
import { toSignal } from '@angular/core/rxjs-interop';

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
  protected devices: Signal<Device[]>;

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getDevices(), { initialValue: [] });
  }
}
