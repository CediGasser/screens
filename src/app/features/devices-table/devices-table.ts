import { Component, input } from '@angular/core';
import { Device } from '../../services/devices-api';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-devices-table',
  imports: [DatePipe],
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
          <th>Corner Radius</th>
        </tr>
      </thead>
      <tbody>
        @for (device of devices(); track device.id) {
          <tr>
            <td>{{ device.manufacturer }}</td>
            <td>{{ device.name }}</td>
            <td>{{ device.type }}</td>
            <td>{{ device.releaseDate | date:'longDate' }}</td>
            <td>{{ device.screenSize }}</td>
            <td>{{ device.screenPixelWidth }}x{{ device.screenPixelHeight }}</td>
            <td>{{ device.screenCornerRadius }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styleUrl: './devices-table.css',
})
export class DevicesTable {
  devices = input.required<Device[]>();
}
