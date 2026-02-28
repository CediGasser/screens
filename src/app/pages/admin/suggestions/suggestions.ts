import { Component, computed, Signal, signal, viewChild } from '@angular/core';
import { Device, DevicesApi } from '../../../services/devices-api';
import { DevicesTable } from '../../../features/devices-table/devices-table';
import { DeviceFormDialog } from '../../../features/device-form-dialog/device-form-dialog';
import { CsvImportDialog } from '../../../features/csv-import-dialog/csv-import-dialog';
import { DevicesFilter } from '../../../features/devices-filter/devices-filter';
import {
  DeviceFilters,
  deviceFiltersFromParamMap,
  deviceFiltersToQueryParams,
} from '../../../services/device-filters';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, map, switchMap } from 'rxjs';
import { LucideAngularModule, Check, Pencil, Trash } from 'lucide-angular';

@Component({
  selector: 'app-suggestions',
  imports: [DevicesFilter, DevicesTable, DeviceFormDialog, CsvImportDialog, LucideAngularModule],
  template: `
    <h2>Suggested Devices</h2>
    <div class="top-actions">
      <button type="button" class="secondary" (click)="openCsvImportDialog()">Import CSV</button>
    </div>
    <app-devices-filter [filters]="filters()" (filtersChange)="onFiltersChange($event)" />
    <app-devices-table #devicesTable [devices]="devices()" [enableSelection]="true">
      <ng-template #actions let-device>
        <button class="icon-only" (click)="onApproveDevice(device)" title="Approve">
          <lucide-icon [img]="CheckIcon" size="16" />
        </button>
        <button class="icon-only" (click)="onEditDevice(device)" title="Edit">
          <lucide-icon [img]="PencilIcon" size="16" />
        </button>
        <button class="icon-only" (click)="onDeleteDevice(device)" title="Delete">
          <lucide-icon [img]="TrashIcon" size="16" />
        </button>
      </ng-template>
    </app-devices-table>

    @if (selectedDevicesCount() > 0) {
      <div class="bulk-actions">
        <button (click)="onApproveSelectedDevices()">
          Approve {{ selectedDevicesCount() }} suggestions
        </button>
        <button class="secondary" (click)="onDeleteSelectedDevices()">
          Delete {{ selectedDevicesCount() }} suggestions
        </button>
      </div>
    }

    <app-device-form-dialog #deviceFormDialog (deviceUpdated)="onDeviceUpdated($event)" />

    <app-csv-import-dialog #csvImportDialog (importSuccess)="onCsvImportSuccess($event)" />
  `,
  styleUrl: './suggestions.css',
})
export class Suggestions {
  protected CheckIcon = Check;
  protected TrashIcon = Trash;
  protected PencilIcon = Pencil;

  protected devices: Signal<Device[]>;
  protected filters: Signal<DeviceFilters>;
  protected deviceFormDialog = viewChild.required<DeviceFormDialog>('deviceFormDialog');
  protected csvImportDialog = viewChild.required<CsvImportDialog>('csvImportDialog');
  private devicesTable = viewChild<DevicesTable>('devicesTable');
  protected selectedDevices = computed(() => this.devicesTable()?.selection() ?? []);
  protected selectedDevicesCount = computed(() => this.selectedDevices().length);
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
      ]).pipe(switchMap(([filters]) => this.devicesApi.getSuggestions(filters))),
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

  onApproveDevice(device: Device) {
    this.devicesApi.updateDevice(device.id, { isDraft: false }).subscribe({
      next: () => this.refreshTick.update((value) => value + 1),
      error: (err) => console.error('Failed to approve device:', err),
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

  onApproveSelectedDevices() {
    const selectedIds = this.selectedDevices().map((device) => device.id);
    if (selectedIds.length === 0) {
      return;
    }

    this.devicesApi
      .bulkUpdateDevices(selectedIds.map((id) => ({ id, data: { isDraft: false } })))
      .subscribe({
        next: () => this.refreshTick.update((value) => value + 1),
        error: (err) => console.error('Failed to approve selected devices:', err),
      });
  }

  onDeleteSelectedDevices() {
    const selectedDevices = this.selectedDevices();
    if (selectedDevices.length === 0) {
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedDevices.length} suggestions?`)) {
      this.devicesApi.bulkDeleteDevices(selectedDevices.map((device) => device.id)).subscribe({
        next: () => this.refreshTick.update((value) => value + 1),
        error: (err) => console.error('Failed to delete selected devices:', err),
      });
    }
  }

  openCsvImportDialog() {
    this.csvImportDialog().open();
  }

  onCsvImportSuccess(_createdCount: number) {
    this.refreshTick.update((value) => value + 1);
  }

  onDeviceUpdated(_device: Device) {
    this.refreshTick.update((value) => value + 1);
  }
}
