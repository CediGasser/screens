import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { SliderModule } from 'primeng/slider';
import { DeviceFilters, normalizeDeviceFilters } from '../../services/device-filters';
import { DeviceMetadata, DevicesApi, DEVICE_TYPE_OPTIONS } from '../../services/devices-api';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

const EMPTY_METADATA: DeviceMetadata = {
  boundaries: {
    minReleaseDate: null,
    maxReleaseDate: null,
    minScreenSize: null,
    maxScreenSize: null,
    minScreenPixelWidth: null,
    maxScreenPixelWidth: null,
    minScreenPixelHeight: null,
    maxScreenPixelHeight: null,
    minPixelDensity: null,
    maxPixelDensity: null,
    minScreenCornerRadius: null,
    maxScreenCornerRadius: null,
  },
  manufacturers: [],
  counts: {
    totalDevices: 0,
    draftDevices: 0,
    publishedDevices: 0,
  },
};

@Component({
  selector: 'app-devices-filter',
  imports: [FormsModule, SliderModule, LucideAngularModule],
  host: {
    ngSkipHydration: 'true',
  },
  template: `
    <section class="filters">
      <button
        class="toggle"
        type="button"
        (click)="toggleCollapsed()"
        [attr.aria-expanded]="!collapsed()"
      >
        Filters
        <lucide-icon [img]="ChevronDownIcon" size="16" [class.rotated]="!collapsed()" />
      </button>

      @if (!collapsed()) {
        <div class="filter-grid">
          <label>
            Manufacturer
            <select
              [ngModel]="draftFilters().manufacturer ?? ''"
              (ngModelChange)="updateManufacturerFilter($event)"
            >
              <option value="">Any</option>
              @for (manufacturer of metadata().manufacturers; track manufacturer) {
                <option [value]="manufacturer">{{ manufacturer }}</option>
              }
            </select>
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
            <select
              [ngModel]="draftFilters().type ?? ''"
              (ngModelChange)="updateTypeFilter($event)"
            >
              <option value="">Any</option>
              @for (device of deviceTypes; track device[0]) {
                <option [value]="device[0]">{{ device[1] }}</option>
              }
            </select>
          </label>

          <label>
            From
            <input
              type="date"
              [ngModel]="draftFilters().releaseDateFrom ?? ''"
              [min]="metadata().boundaries.minReleaseDate ?? ''"
              [max]="metadata().boundaries.maxReleaseDate ?? ''"
              (ngModelChange)="updateFromDateFilter($event)"
            />
          </label>
          <label>
            To
            <input
              type="date"
              [ngModel]="draftFilters().releaseDateTo ?? ''"
              [min]="metadata().boundaries.minReleaseDate ?? ''"
              [max]="metadata().boundaries.maxReleaseDate ?? ''"
              (ngModelChange)="updateToDateFilter($event)"
            />
          </label>

          <label>
            Width Range
            <p-slider
              [ngModel]="screenWidthRange()"
              (ngModelChange)="
                updateNumberRange('screenPixelWidthMin', 'screenPixelWidthMax', $event)
              "
              [range]="true"
              [step]="1"
              [min]="getBoundaryNumber('minScreenPixelWidth') ?? 0"
              [max]="getBoundaryNumber('maxScreenPixelWidth') ?? 0"
              [disabled]="getBoundaryNumber('minScreenPixelWidth') == null"
            />
            <small>{{ displayRange(screenWidthRange()) }}</small>
          </label>

          <label>
            Height Range
            <p-slider
              [ngModel]="screenHeightRange()"
              (ngModelChange)="
                updateNumberRange('screenPixelHeightMin', 'screenPixelHeightMax', $event)
              "
              [range]="true"
              [step]="1"
              [min]="getBoundaryNumber('minScreenPixelHeight') ?? 0"
              [max]="getBoundaryNumber('maxScreenPixelHeight') ?? 0"
              [disabled]="getBoundaryNumber('minScreenPixelHeight') == null"
            />
            <small>{{ displayRange(screenHeightRange()) }}</small>
          </label>

          <label>
            Pixel Density Range
            <p-slider
              [ngModel]="pixelDensityRange()"
              (ngModelChange)="updateNumberRange('pixelDensityMin', 'pixelDensityMax', $event)"
              [range]="true"
              [step]="0.01"
              [min]="getBoundaryNumber('minPixelDensity') ?? 0"
              [max]="getBoundaryNumber('maxPixelDensity') ?? 0"
              [disabled]="getBoundaryNumber('minPixelDensity') == null"
            />
            <small>{{ displayRange(pixelDensityRange(), 2) }}</small>
          </label>
        </div>

        <div class="actions">
          <button type="button" (click)="clearFilters()">Clear Filters</button>
        </div>
      }
    </section>
  `,
  styleUrl: './devices-filter.css',
})
export class DevicesFilter {
  filters = input<DeviceFilters>({});
  filtersChange = output<DeviceFilters>();

  protected ChevronDownIcon = ChevronDown;

  protected readonly deviceTypes = Object.entries(DEVICE_TYPE_OPTIONS);
  private readonly devicesApi = inject(DevicesApi);
  protected metadata = toSignal(this.devicesApi.getDevicesMetadata(), {
    initialValue: EMPTY_METADATA,
  });
  protected draftFilters = signal<DeviceFilters>({});
  protected collapsed = signal(true);
  protected screenWidthRange = signal<number[]>([]);
  protected screenHeightRange = signal<number[]>([]);
  protected pixelDensityRange = signal<number[]>([]);

  constructor() {
    effect(() => {
      const normalizedFilters = normalizeDeviceFilters(this.filters());
      this.draftFilters.set(normalizedFilters);
      this.screenWidthRange.set(
        toNumberRange(
          normalizedFilters.screenPixelWidthMin,
          normalizedFilters.screenPixelWidthMax,
          this.metadata().boundaries.minScreenPixelWidth,
          this.metadata().boundaries.maxScreenPixelWidth,
        ),
      );
      this.screenHeightRange.set(
        toNumberRange(
          normalizedFilters.screenPixelHeightMin,
          normalizedFilters.screenPixelHeightMax,
          this.metadata().boundaries.minScreenPixelHeight,
          this.metadata().boundaries.maxScreenPixelHeight,
        ),
      );
      this.pixelDensityRange.set(
        toNumberRange(
          normalizedFilters.pixelDensityMin,
          normalizedFilters.pixelDensityMax,
          this.metadata().boundaries.minPixelDensity,
          this.metadata().boundaries.maxPixelDensity,
        ),
      );
    });
  }

  protected clearFilters() {
    this.applyFilters({});
  }

  protected toggleCollapsed() {
    this.collapsed.update((value) => !value);
  }

  protected updateTextFilter(field: keyof DeviceFilters, value: string) {
    this.applyFilters({ ...this.draftFilters(), [field]: value });
  }

  protected updateManufacturerFilter(value: string) {
    this.applyFilters({
      ...this.draftFilters(),
      manufacturer: value === '' ? undefined : value,
    });
  }

  protected updateTypeFilter(value: string) {
    this.applyFilters({
      ...this.draftFilters(),
      type: value === '' ? undefined : (value as DeviceFilters['type']),
    });
  }

  protected updateFromDateFilter(value: string) {
    const nextFrom = value === '' ? undefined : value;
    this.applyFilters({
      ...this.draftFilters(),
      releaseDateFrom: nextFrom,
    });
  }

  protected updateToDateFilter(value: string) {
    const nextTo = value === '' ? undefined : value;
    this.applyFilters({
      ...this.draftFilters(),
      releaseDateTo: nextTo,
    });
  }

  protected updateNumberRange(
    minField: keyof DeviceFilters,
    maxField: keyof DeviceFilters,
    value: number | number[] | null,
  ) {
    const range = Array.isArray(value) ? value : [];
    this.applyFilters({
      ...this.draftFilters(),
      [minField]: range.length === 2 ? range[0] : undefined,
      [maxField]: range.length === 2 ? range[1] : undefined,
    });
  }

  protected getBoundaryNumber(
    key:
      | 'minScreenPixelWidth'
      | 'maxScreenPixelWidth'
      | 'minScreenPixelHeight'
      | 'maxScreenPixelHeight'
      | 'minPixelDensity'
      | 'maxPixelDensity'
      | 'minScreenCornerRadius'
      | 'maxScreenCornerRadius',
  ) {
    return this.metadata().boundaries[key];
  }

  protected displayRange(range: number[], decimals = 0) {
    if (range.length !== 2) return '-';
    return `${range[0].toFixed(decimals)} - ${range[1].toFixed(decimals)}`;
  }

  private applyFilters(nextFilters: DeviceFilters) {
    const normalized = normalizeDeviceFilters(nextFilters);
    this.draftFilters.set(normalized);
    this.filtersChange.emit(normalized);
  }
}

function toNumberRange(
  selectedMin: number | undefined,
  selectedMax: number | undefined,
  boundaryMin: number | null,
  boundaryMax: number | null,
): number[] {
  if (boundaryMin == null || boundaryMax == null) return [];
  return [selectedMin ?? boundaryMin, selectedMax ?? boundaryMax];
}
