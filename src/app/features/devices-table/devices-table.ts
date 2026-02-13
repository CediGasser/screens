import { Component, computed, contentChild, input, signal, TemplateRef } from '@angular/core';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Device } from '../../services/devices-api';
import { SortEvent } from 'primeng/api';

@Component({
  selector: 'app-devices-table',
  imports: [TableModule, DatePipe, DecimalPipe, NgTemplateOutlet],
  template: `
    <p-table
      [value]="devices()"
      [loading]="loading()"
      [scrollable]="true"
      [tableStyle]="{ 'min-width': '60rem' }"
      dataKey="id"
      sortField="releaseDate"
      [sortOrder]="-1"
      [customSort]="true"
      (sortFunction)="customSort($event)"
      [(selection)]="internalSelection"
      stripedRows="true"
    >
      <ng-template #header>
        <tr>
          @if (enableSelection()) {
            <th style="width: 4rem">
              <p-tableHeaderCheckbox />
            </th>
          }
          <th>Manufacturer</th>
          <th>Device Name</th>
          <th>Type</th>
          <th pSortableColumn="releaseDate">
            Release Date
            <p-sortIcon field="releaseDate" />
          </th>
          <th pSortableColumn="screenSize">
            Screen Size
            <p-sortIcon field="screenSize" />
          </th>
          <th pSortableColumn="resolution">
            Resolution
            <p-sortIcon field="resolution" />
          </th>
          <th pSortableColumn="pixelDensity">
            Pixel Density
            <p-sortIcon field="pixelDensity" />
          </th>
          <th pSortableColumn="screenCornerRadius">
            Corner Radius
            <p-sortIcon field="screenCornerRadius" />
          </th>
          @if (actionsTemplate()) {
            <th>Actions</th>
          }
        </tr>
      </ng-template>
      <ng-template #body let-device>
        <tr>
          @if (enableSelection()) {
            <td>
              <p-tableCheckbox [value]="device" />
            </td>
          }
          <td>{{ device.manufacturer }}</td>
          <td>{{ device.name }}</td>
          <td>{{ device.type }}</td>
          <td>{{ device.releaseDate | date: 'longDate' }}</td>
          <td>{{ device.screenSize }}</td>
          <td>{{ device.screenPixelWidth }}x{{ device.screenPixelHeight }}</td>
          <td>{{ getPixelDensity(device) | number: '1.1-2' }}</td>
          <td>{{ device.screenCornerRadius }}</td>
          @if (actionsTemplate(); as template) {
            <td>
              <div class="actions">
                <ng-container *ngTemplateOutlet="template; context: { $implicit: device }" />
              </div>
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
  styleUrl: './devices-table.css',
})
export class DevicesTable {
  devices = input.required<Device[]>();

  loading = input<boolean>(false);
  enableSelection = input<boolean>(false);
  actionsTemplate = contentChild<TemplateRef<{ $implicit: Device }>>('actions');

  selection = computed(() => this.internalSelection());

  protected internalSelection = signal<Device[]>([]);

  protected getPixelDensity(device: Device): number {
    return device.screenPixelWidth / device.screenSize;
  }

  protected getTotalPixels(device: Device): number {
    return device.screenPixelWidth * device.screenPixelHeight;
  }

  /** Custom sort function to handle computed columns */
  customSort(event: SortEvent) {
    event.data?.sort((a: Device, b: Device) => {
      let value1: number | string;
      let value2: number | string;

      switch (event.field) {
        case 'pixelDensity':
          value1 = this.getPixelDensity(a);
          value2 = this.getPixelDensity(b);
          break;
        case 'resolution':
          value1 = this.getTotalPixels(a);
          value2 = this.getTotalPixels(b);
          break;
        case 'releaseDate':
          value1 = new Date(a.releaseDate).getTime();
          value2 = new Date(b.releaseDate).getTime();
          break;
        default:
          value1 = (a as unknown as Record<string, number | string>)[event.field!];
          value2 = (b as unknown as Record<string, number | string>)[event.field!];
      }

      let result = 0;
      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string')
        result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;

      return (event.order ?? 1) * result;
    });
  }
}
