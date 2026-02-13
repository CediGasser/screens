import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEVICE_TYPE_OPTIONS,
  DeviceFilters,
  normalizeDeviceFilters,
} from '../../services/device-filters';

@Component({
  selector: 'app-devices-filter',
  imports: [FormsModule],
  template: `
    <section class="filters">
      <div class="filter-grid">
        <label>
          Manufacturer
          <input
            [ngModel]="draftFilters().manufacturer ?? ''"
            (ngModelChange)="updateTextFilter('manufacturer', $event)"
            placeholder="e.g. Apple"
          />
        </label>

        <label>
          Device Name
          <input
            [ngModel]="draftFilters().name ?? ''"
            (ngModelChange)="updateTextFilter('name', $event)"
            placeholder="e.g. iPhone"
          />
        </label>

        <label>
          Type
          <select [ngModel]="draftFilters().type ?? ''" (ngModelChange)="updateTypeFilter($event)">
            <option value="">Any</option>
            @for (type of deviceTypes; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
        </label>

        <label>
          Release Date From
          <input
            type="date"
            [ngModel]="draftFilters().releaseDateFrom ?? ''"
            (ngModelChange)="updateTextFilter('releaseDateFrom', $event)"
          />
        </label>

        <label>
          Release Date To
          <input
            type="date"
            [ngModel]="draftFilters().releaseDateTo ?? ''"
            (ngModelChange)="updateTextFilter('releaseDateTo', $event)"
          />
        </label>

        <label>
          Width Min
          <input
            type="number"
            [ngModel]="draftFilters().screenPixelWidthMin ?? ''"
            (ngModelChange)="updateNumberFilter('screenPixelWidthMin', $event)"
          />
        </label>

        <label>
          Width Max
          <input
            type="number"
            [ngModel]="draftFilters().screenPixelWidthMax ?? ''"
            (ngModelChange)="updateNumberFilter('screenPixelWidthMax', $event)"
          />
        </label>

        <label>
          Height Min
          <input
            type="number"
            [ngModel]="draftFilters().screenPixelHeightMin ?? ''"
            (ngModelChange)="updateNumberFilter('screenPixelHeightMin', $event)"
          />
        </label>

        <label>
          Height Max
          <input
            type="number"
            [ngModel]="draftFilters().screenPixelHeightMax ?? ''"
            (ngModelChange)="updateNumberFilter('screenPixelHeightMax', $event)"
          />
        </label>

        <label>
          Pixel Density Min
          <input
            type="number"
            step="0.01"
            [ngModel]="draftFilters().pixelDensityMin ?? ''"
            (ngModelChange)="updateNumberFilter('pixelDensityMin', $event)"
          />
        </label>

        <label>
          Pixel Density Max
          <input
            type="number"
            step="0.01"
            [ngModel]="draftFilters().pixelDensityMax ?? ''"
            (ngModelChange)="updateNumberFilter('pixelDensityMax', $event)"
          />
        </label>

        <label>
          Corner Radius Min
          <input
            type="number"
            [ngModel]="draftFilters().screenCornerRadiusMin ?? ''"
            (ngModelChange)="updateNumberFilter('screenCornerRadiusMin', $event)"
          />
        </label>

        <label>
          Corner Radius Max
          <input
            type="number"
            [ngModel]="draftFilters().screenCornerRadiusMax ?? ''"
            (ngModelChange)="updateNumberFilter('screenCornerRadiusMax', $event)"
          />
        </label>
      </div>

      <div class="actions">
        <button type="button" (click)="clearFilters()">Clear Filters</button>
      </div>
    </section>
  `,
  styleUrl: './devices-filter.css',
})
export class DevicesFilter {
  filters = input<DeviceFilters>({});
  filtersChange = output<DeviceFilters>();

  protected readonly deviceTypes = DEVICE_TYPE_OPTIONS;
  protected draftFilters = signal<DeviceFilters>({});

  constructor() {
    effect(() => {
      this.draftFilters.set(this.filters());
    });
  }

  protected clearFilters() {
    this.applyFilters({});
  }

  protected updateTextFilter(field: keyof DeviceFilters, value: string) {
    this.applyFilters({ ...this.draftFilters(), [field]: value });
  }

  protected updateTypeFilter(value: string) {
    this.applyFilters({
      ...this.draftFilters(),
      type: value === '' ? undefined : (value as DeviceFilters['type']),
    });
  }

  protected updateNumberFilter(field: keyof DeviceFilters, value: string | number) {
    const parsed = typeof value === 'number' ? value : Number(value);
    this.applyFilters({
      ...this.draftFilters(),
      [field]: Number.isFinite(parsed) ? parsed : undefined,
    });
  }

  private applyFilters(nextFilters: DeviceFilters) {
    const normalized = normalizeDeviceFilters(nextFilters);
    this.draftFilters.set(normalized);
    this.filtersChange.emit(normalized);
  }
}
