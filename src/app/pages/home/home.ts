import { Component, signal, Signal, viewChild } from '@angular/core';
import { DevicesTable } from '../../features/devices-table/devices-table';
import { Device, DevicesApi } from '../../services/devices-api';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DeviceFormDialog } from '../../features/device-form-dialog/device-form-dialog';
import { DevicesFilter } from '../../features/devices-filter/devices-filter';
import {
  DeviceFilters,
  deviceFiltersFromParamMap,
  deviceFiltersToQueryParams,
} from '../../services/device-filters';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [DevicesFilter, DevicesTable, DeviceFormDialog],
  template: `
    <main class="letter-box">
      <header>
        <h1>Devices</h1>
        <button class="primary" (click)="openSuggestDialog()">Suggest a Device</button>
      </header>
      <section>
        <app-devices-filter [filters]="filters()" (filtersChange)="onFiltersChange($event)" />
        <app-devices-table [devices]="devices()"></app-devices-table>
      </section>

      <app-device-form-dialog #deviceFormDialog (deviceCreated)="onDeviceCreated($event)" />
    </main>
  `,
  styleUrl: './home.css',
})
export class Home {
  protected title = signal('Device Catalog');
  protected devices: Signal<Device[]>;
  protected filters: Signal<DeviceFilters>;
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');

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
      toObservable(this.filters).pipe(
        debounceTime(250),
        switchMap((filters) => this.devicesApi.getPublishedDevices(filters)),
      ),
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

  openSuggestDialog() {
    this.deviceFormDialog().openForCreate(true);
  }

  onDeviceCreated(device: Device) {
    // Device was submitted as a suggestion (draft)
    console.log('Device suggestion submitted:', device);
  }
}
