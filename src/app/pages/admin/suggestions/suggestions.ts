import { Component, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Device, DevicesApi } from '../../../services/devices-api';
import { DevicesTable } from '../../../features/devices-table/devices-table';

@Component({
  selector: 'app-suggestions',
  imports: [DevicesTable],
  template: `
    <h2>Suggested Devices</h2>
    <app-devices-table [devices]="devices()" [enableOptions]="true"></app-devices-table>
  `,
  styleUrl: './suggestions.css',
})
export class Suggestions {
  protected devices: Signal<Device[]>;

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getSuggestions(), { initialValue: [] });
  }
}
