import { Component, computed, input, output } from '@angular/core';
import { Device } from '../../../services/devices-api';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'tr[app-devices-table-row]',
  imports: [DatePipe, DecimalPipe],
  template: `
    <td>{{ device().manufacturer }}</td>
    <td>{{ device().name }}</td>
    <td>{{ device().type }}</td>
    <td>{{ device().releaseDate | date: 'longDate' }}</td>
    <td>{{ device().screenSize }}</td>
    <td>{{ device().screenPixelWidth }}x{{ device().screenPixelHeight }}</td>
    <td>{{ pixelDensity() | number: '1.1-2' }}</td>
    <td>{{ device().screenCornerRadius }}</td>
    @if (enableOptions()) {
      <td>
        <button (click)="onEditClick()">Edit</button>
        <button (click)="onDeleteClick()">Delete</button>
      </td>
    }
  `,
  styleUrl: './devices-table-row.css',
})
export class DevicesTableRow {
  device = input.required<Device>();
  enableOptions = input<boolean>(false);

  editDevice = output<Device>();
  deleteDevice = output<Device>();

  pixelDensity = computed(() => this.device().screenPixelWidth / this.device().screenSize);

  onEditClick() {
    this.editDevice.emit(this.device());
  }

  onDeleteClick() {
    this.deleteDevice.emit(this.device());
  }
}
