import { Component, Signal, signal, viewChild } from '@angular/core';
import { Device, DevicesApi } from '../../../services/devices-api';
import { DevicesTable } from '../../../features/devices-table/devices-table';
import { DeviceFormDialog } from '../../../features/device-form-dialog/device-form-dialog';
import { DevicesFilter } from '../../../features/devices-filter/devices-filter';
import {
  DeviceFilters,
  deviceFiltersFromParamMap,
  deviceFiltersToQueryParams,
} from '../../../services/device-filters';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-published-devices',
  imports: [DevicesFilter, DevicesTable, DeviceFormDialog],
  template: `
    <h2>Published Devices</h2>
    <app-devices-filter [filters]="filters()" (filtersChange)="onFiltersChange($event)" />
    <app-devices-table [devices]="devices()">
      <ng-template #actions let-device>
        <button (click)="onEditDevice(device)">Edit</button>
        <button (click)="onDeleteDevice(device)">Delete</button>
      </ng-template>
    </app-devices-table>

    <app-device-form-dialog #deviceFormDialog (deviceUpdated)="onDeviceUpdated($event)" />
  `,
  styleUrl: './published-devices.css',
})
export class PublishedDevices {
  protected devices: Signal<Device[]>;
  protected filters: Signal<DeviceFilters>;
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');
  private refreshTick = signal(0);

  constructor(
    private devicesApi: DevicesApi,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.filters = toSignal(
      this.route.queryParamMap.pipe(map((paramMap) => deviceFiltersFromParamMap(paramMap))),
      { initialValue: deviceFiltersFromParamMap(this.route.snapshot.queryParamMap) },
    );

    this.devices = toSignal(
      combineLatest([
        toObservable(this.filters).pipe(debounceTime(250)),
        toObservable(this.refreshTick),
      ]).pipe(switchMap(([filters]) => this.devicesApi.getPublishedDevices(filters))),
      { initialValue: [] },
    );
  }

  onFiltersChange(filters: DeviceFilters) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: deviceFiltersToQueryParams(filters),
      replaceUrl: true,
    });
  }

  onEditDevice(device: Device) {
    this.deviceFormDialog().openForEdit(device);
  }

  onDeleteDevice(device: Device) {
    if (confirm(`Are you sure you want to delete "${device.manufacturer} ${device.name}"?`)) {
      this.devicesApi.deleteDevice(device.id).subscribe({
        next: () => this.refreshTick.update((value) => value + 1),
        error: (err) => console.error('Failed to delete device:', err),
      });
    }
  }

  onDeviceUpdated(_device: Device) {
    this.refreshTick.update((value) => value + 1);
  }
}
