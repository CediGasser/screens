import { Component, computed, input } from '@angular/core';
import { Device } from '../../../services/devices-api';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-devices-table-row',
  imports: [DatePipe, DecimalPipe],
  template: `
    <tr>
      <td>{{ device().manufacturer }}</td>
      <td>{{ device().name }}</td>
      <td>{{ device().type }}</td>
      <td>{{ device().releaseDate | date:'longDate' }}</td>
      <td>{{ device().screenSize }}</td>
      <td>{{ device().screenPixelWidth }}x{{ device().screenPixelHeight }}</td>
      <td>{{ pixelDensity() | number:'1.1-2' }}</td>
      <td>{{ device().screenCornerRadius }}</td>
    </tr>
  `,
  styleUrl: './devices-table-row.css',
})
export class DevicesTableRow {
  device = input.required<Device>();

  pixelDensity = computed(() => this.device().screenPixelWidth / this.device().screenSize);
}
