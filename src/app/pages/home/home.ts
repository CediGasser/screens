import { Component, computed, signal, Signal, viewChild } from '@angular/core';
import { Device, DevicesApi } from '../../services/devices-api';
import { toSignal } from '@angular/core/rxjs-interop';
import { DeviceFormDialog } from '../../features/device-form-dialog/device-form-dialog';
import { TimeAxis } from '../../features/time-axis/time-axis';

import { ScreenSizeMap } from '../../features/screen-size-map/screen-size-map';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [DeviceFormDialog, TimeAxis, ScreenSizeMap, RouterLink],
  template: `
    <main class="letter-box">
      <header>
        <h1>Screens</h1>
      </header>
      <section class="intro">
        <p>
          Explore the evolution of screen sizes over time! Slide the timeline to see how devices
          have changed.
        </p>
      </section>
      <section>
        <app-screen-size-map [devices]="devices()" [selectedDevices]="highlightedDeviceIds()" />

        <app-time-axis
          [devices]="devices()"
          [highlightedDeviceIds]="highlightedDeviceIds()"
          (selectedDate)="onSelectedDateChange($event)"
        />
        <div class="header-actions">
          <a routerLink="/data" class="nav-link">Data Table &rarr;</a>
        </div>
      </section>

      <app-device-form-dialog #deviceFormDialog (deviceCreated)="onDeviceCreated($event)" />
    </main>
  `,
  styleUrl: './home.css',
})
export class Home {
  protected devices: Signal<Device[]>;
  protected selectedDate = signal('');
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');

  /** Number of most-recent devices to display in the visual map. */
  private readonly DISPLAY_COUNT = 5;

  /** The N most recently released devices up to the selected date. */
  protected displayedDevices = computed(() => {
    const date = this.selectedDate();
    if (!date) return [];
    return [...this.devices()]
      .filter((d) => d.releaseDate <= date)
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
      .slice(0, this.DISPLAY_COUNT);
  });

  /** IDs of displayed devices — used for highlighting dots on the time axis. */
  protected highlightedDeviceIds = computed(() => {
    return this.displayedDevices().map((d) => d.id);
  });

  constructor(private devicesApi: DevicesApi) {
    this.devices = toSignal(this.devicesApi.getPublishedDevices(), { initialValue: [] });
  }

  openSuggestDialog() {
    this.deviceFormDialog().openForCreate(true);
  }

  onSelectedDateChange(date: string) {
    this.selectedDate.set(date);
  }

  onDeviceCreated(device: Device) {
    console.log('Device suggestion submitted:', device);
  }
}
