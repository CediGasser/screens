import { Component, input } from '@angular/core';
import { Device } from '../../services/devices-api';
import { DevicesTableRow } from './devices-table-row/devices-table-row';

@Component({
  selector: 'app-devices-table',
  imports: [DevicesTableRow],
  template: `
    <table>
      <thead>
        <tr>
          <th>Manufacturer</th>
          <th>Device Name</th>
          <th>Type</th>
          <th>Release Date</th>
          <th>Screen Size</th>
          <th>Resolution</th>
          <th>Pixel Density</th>
          <th>Corner Radius</th>
          @if (enableOptions()) {
            <th>Options</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (device of devices(); track device.id) {
          <app-devices-table-row [device]="device" [enableOptions]="enableOptions()"></app-devices-table-row>
        }
      </tbody>
    </table>
  `,
  styleUrl: './devices-table.css',
})
export class DevicesTable {
  devices = input.required<Device[]>();
  enableOptions = input<boolean>(false);
}
