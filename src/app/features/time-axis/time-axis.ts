import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Device, DEVICE_TYPE_OPTIONS, DeviceType } from '../../services/devices-api';

// ─── Layout constants ────────────────────────────────────────────────────────

const ROW_HEIGHT = 28;
const SCALE_HEIGHT = 30;
const TRACK_TOP_PADDING = 16;
const TRACK_PADDING_LEFT = 84;
const TRACK_PADDING_RIGHT = 20;
const HANDLE_THUMB_RADIUS = 7;
const MOBILE_BREAKPOINT = 768;
const MIN_PX_PER_YEAR_MOBILE = 50;

const CATEGORY_ORDER: DeviceType[] = [
  'smartphone',
  'tablet',
  'laptop',
  'desktop',
  'wearable',
  'other',
];

// ─── Internal types ──────────────────────────────────────────────────────────

interface DeviceDot {
  id: string;
  x: number;
  y: number;
  highlighted: boolean;
}

interface YearTick {
  year: number;
  x: number;
  showLabel: boolean;
}

interface CategoryRow {
  type: DeviceType;
  label: string;
  y: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-time-axis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ngSkipHydration: 'true',
  },
  template: `
    <div class="date-label">{{ formattedDate() }}</div>

    <div class="track-wrapper">
      <div
        class="track-viewport"
        #trackContainer
        [class.scrollable]="isMobile()"
        (scroll)="onTrackScroll()"
      >
        <svg
          #svgEl
          [attr.width]="trackWidth()"
          [attr.height]="svgHeight()"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
        >
          <!-- Category row backgrounds -->
          @for (row of categoryRows(); track row.type; let i = $index) {
            <rect
              [attr.x]="0"
              [attr.y]="row.y"
              [attr.width]="trackWidth()"
              [attr.height]="ROW_HEIGHT"
              class="row-bg"
              [class.row-bg-alt]="i % 2 !== 0"
            />
            <text
              [attr.x]="10"
              [attr.y]="row.y + ROW_HEIGHT / 2"
              dominant-baseline="central"
              class="category-label"
            >
              {{ row.label }}
            </text>
          }

          <!-- Year scale baseline -->
          <line
            [attr.x1]="TRACK_PADDING_LEFT"
            [attr.y1]="scaleY()"
            [attr.x2]="trackWidth() - TRACK_PADDING_RIGHT"
            [attr.y2]="scaleY()"
            class="scale-baseline"
          />

          <!-- Year ticks and labels -->
          @for (tick of yearTicks(); track tick.year) {
            <line
              [attr.x1]="tick.x"
              [attr.y1]="scaleY()"
              [attr.x2]="tick.x"
              [attr.y2]="scaleY() + (tick.showLabel ? 10 : 5)"
              class="tick-line"
            />
            @if (tick.showLabel) {
              <text
                [attr.x]="tick.x"
                [attr.y]="scaleY() + 24"
                text-anchor="middle"
                class="year-label"
              >
                {{ tick.year }}
              </text>
            }
          }

          <!-- Device dots -->
          @for (dot of deviceDots(); track dot.id) {
            <circle
              [attr.cx]="dot.x"
              [attr.cy]="dot.y"
              [attr.r]="dot.highlighted ? 5 : 3"
              class="device-dot"
              [class.highlighted]="dot.highlighted"
            />
          }

          <!-- Desktop: position line + handle thumb -->
          @if (!isMobile()) {
            <line
              [attr.x1]="handleX()"
              [attr.y1]="0"
              [attr.x2]="handleX()"
              [attr.y2]="scaleY()"
              class="position-line"
            />
            <circle
              [attr.cx]="handleX()"
              [attr.cy]="TRACK_TOP_PADDING / 2"
              [attr.r]="HANDLE_THUMB_RADIUS"
              class="handle-thumb"
            />
          }
        </svg>
      </div>

      <!-- Mobile: fixed center indicator (does not scroll) -->
      @if (isMobile()) {
        <div class="mobile-indicator"></div>
      }
    </div>
  `,
  styleUrl: './time-axis.css',
})
export class TimeAxis implements OnDestroy {
  // ─── Public API ──────────────────────────────────────────────────────

  /** All devices to plot on the timeline. */
  devices = input.required<Device[]>();

  /** IDs of devices whose dots should be visually highlighted. */
  highlightedDeviceIds = input<string[]>([]);

  /** Emits the selected release date (ISO string) whenever the position changes. */
  selectedDate = output<string>();

  // ─── Internal state ──────────────────────────────────────────────────

  protected currentDateIndex = signal(-1);
  protected isDragging = signal(false);
  protected containerWidth = signal(600);
  protected isMobile = signal(false);

  // Template-exposed constants
  protected readonly ROW_HEIGHT = ROW_HEIGHT;
  protected readonly TRACK_TOP_PADDING = TRACK_TOP_PADDING;
  protected readonly TRACK_PADDING_LEFT = TRACK_PADDING_LEFT;
  protected readonly TRACK_PADDING_RIGHT = TRACK_PADDING_RIGHT;
  protected readonly HANDLE_THUMB_RADIUS = HANDLE_THUMB_RADIUS;

  // Element refs
  protected trackContainer = viewChild.required<ElementRef<HTMLDivElement>>('trackContainer');
  protected svgEl = viewChild.required<ElementRef<SVGSVGElement>>('svgEl');

  // Cleanup handles
  private resizeObserver: ResizeObserver | null = null;
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  // ─── Computed signals ────────────────────────────────────────────────

  /** Sorted, deduplicated release dates — these are the snap points. */
  protected uniqueDates = computed(() => {
    const dates = [...new Set(this.devices().map((d) => d.releaseDate))];
    return dates.sort();
  });

  /** Device-type categories present in the current data set, in display order. */
  protected categories = computed(() => {
    const types = new Set(this.devices().map((d) => d.type));
    return CATEGORY_ORDER.filter((t) => types.has(t));
  });

  /** Min/max date boundaries. */
  protected dateRange = computed(() => {
    const dates = this.uniqueDates();
    if (dates.length === 0) return { min: new Date(), max: new Date() };
    return {
      min: new Date(dates[0]),
      max: new Date(dates[dates.length - 1]),
    };
  });

  /** Total SVG width. Desktop = container; mobile = wider for scrolling. */
  protected trackWidth = computed(() => {
    const containerW = this.containerWidth();
    if (!this.isMobile()) return containerW;

    const range = this.dateRange();
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const years = Math.max(1, (range.max.getTime() - range.min.getTime()) / msPerYear);
    const minWidth = years * MIN_PX_PER_YEAR_MOBILE + TRACK_PADDING_LEFT + TRACK_PADDING_RIGHT;
    return Math.max(minWidth, containerW * 2.5);
  });

  /** Total SVG height. */
  protected svgHeight = computed(() => {
    return TRACK_TOP_PADDING + this.categories().length * ROW_HEIGHT + SCALE_HEIGHT;
  });

  /** Usable content width (where dates map to). */
  private contentWidth = computed(() => {
    return this.trackWidth() - TRACK_PADDING_LEFT - TRACK_PADDING_RIGHT;
  });

  /** Currently-selected date string. */
  protected currentDate = computed(() => {
    const dates = this.uniqueDates();
    const idx = this.currentDateIndex();
    if (dates.length === 0 || idx < 0 || idx >= dates.length) return '';
    return dates[idx];
  });

  /** Formatted date for the floating label. */
  protected formattedDate = computed(() => {
    const d = this.currentDate();
    if (!d) return '\u2014'; // em dash
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  /** X coordinate of the current-position indicator. */
  protected handleX = computed(() => {
    const d = this.currentDate();
    if (!d) return TRACK_PADDING_LEFT;
    return this.dateToX(new Date(d));
  });

  /** Category rows for the template. */
  protected categoryRows = computed<CategoryRow[]>(() => {
    return this.categories().map((type, index) => ({
      type,
      label: DEVICE_TYPE_OPTIONS[type],
      y: TRACK_TOP_PADDING + index * ROW_HEIGHT,
    }));
  });

  /** Y position where the year scale begins. */
  protected scaleY = computed(() => {
    return TRACK_TOP_PADDING + this.categories().length * ROW_HEIGHT;
  });

  /** Dot positions for every device. */
  protected deviceDots = computed<DeviceDot[]>(() => {
    const categories = this.categories();
    const highlighted = new Set(this.highlightedDeviceIds());

    return this.devices().map((device) => {
      const rowIndex = categories.indexOf(device.type);
      const y = TRACK_TOP_PADDING + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
      const x = this.dateToX(new Date(device.releaseDate));

      return {
        id: device.id,
        x,
        y,
        highlighted: highlighted.has(device.id),
      };
    });
  });

  /** Year tick-marks for the scale. */
  protected yearTicks = computed<YearTick[]>(() => {
    const range = this.dateRange();
    const minYear = range.min.getFullYear();
    const maxYear = range.max.getFullYear();
    const totalYears = maxYear - minYear;

    let labelInterval: number;
    if (totalYears > 30) labelInterval = 10;
    else if (totalYears > 15) labelInterval = 5;
    else if (totalYears > 8) labelInterval = 2;
    else labelInterval = 1;

    const ticks: YearTick[] = [];
    for (let year = minYear; year <= maxYear; year++) {
      const x = this.dateToX(new Date(year, 0, 1));
      if (x < TRACK_PADDING_LEFT || x > this.trackWidth() - TRACK_PADDING_RIGHT) {
        continue;
      }
      ticks.push({
        year,
        x,
        showLabel: year % labelInterval === 0 || year === minYear || year === maxYear,
      });
    }
    return ticks;
  });

  // ─── Constructor ─────────────────────────────────────────────────────

  constructor() {
    // Set currentDateIndex to the first date when devices arrive.
    effect(() => {
      const dates = this.uniqueDates();
      if (dates.length === 0) return;
      const idx = untracked(this.currentDateIndex);
      if (idx < 0 || idx >= dates.length) {
        this.currentDateIndex.set(0);
      }
    });

    // Emit the selected date whenever it changes.
    effect(() => {
      const date = this.currentDate();
      if (date) {
        this.selectedDate.emit(date);
      }
    });

    // Browser-only: measure container, listen to viewport changes.
    afterNextRender(() => {
      this.setupResizeObserver();
      this.setupMediaQuery();
    });
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
    }
  }

  // ─── Coordinate helpers ──────────────────────────────────────────────

  /** Map a Date to an SVG x coordinate. */
  private dateToX(date: Date): number {
    const range = this.dateRange();
    const span = range.max.getTime() - range.min.getTime();
    if (span === 0) return TRACK_PADDING_LEFT + this.contentWidth() / 2;
    const ratio = (date.getTime() - range.min.getTime()) / span;
    return TRACK_PADDING_LEFT + ratio * this.contentWidth();
  }

  /** Map an SVG x coordinate to the nearest unique-date index. */
  private xToDateIndex(x: number): number {
    const dates = this.uniqueDates();
    if (dates.length <= 1) return 0;

    const range = this.dateRange();
    const span = range.max.getTime() - range.min.getTime();
    const cw = this.contentWidth();
    const clampedX = Math.max(TRACK_PADDING_LEFT, Math.min(x, TRACK_PADDING_LEFT + cw));
    const targetTime =
      span === 0
        ? range.min.getTime()
        : range.min.getTime() + ((clampedX - TRACK_PADDING_LEFT) / cw) * span;

    let nearest = 0;
    let minDiff = Infinity;
    for (let i = 0; i < dates.length; i++) {
      const diff = Math.abs(new Date(dates[i]).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = i;
      }
    }
    return nearest;
  }

  // ─── Desktop pointer interaction ─────────────────────────────────────

  protected onPointerDown(event: PointerEvent) {
    if (this.isMobile()) return;
    const svg = this.svgEl().nativeElement;
    svg.setPointerCapture(event.pointerId);
    this.isDragging.set(true);
    this.updateFromPointer(event);
  }

  protected onPointerMove(event: PointerEvent) {
    if (!this.isDragging()) return;
    event.preventDefault();
    this.updateFromPointer(event);
  }

  protected onPointerUp(event: PointerEvent) {
    if (!this.isDragging()) return;
    const svg = this.svgEl().nativeElement;
    svg.releasePointerCapture(event.pointerId);
    this.isDragging.set(false);
  }

  private updateFromPointer(event: PointerEvent) {
    const svg = this.svgEl().nativeElement;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    this.currentDateIndex.set(this.xToDateIndex(x));
  }

  // ─── Mobile scroll interaction ───────────────────────────────────────

  protected onTrackScroll() {
    if (!this.isMobile()) return;
    const container = this.trackContainer().nativeElement;
    const centerX = container.scrollLeft + container.clientWidth / 2;
    this.currentDateIndex.set(this.xToDateIndex(centerX));
  }

  // ─── Setup helpers ───────────────────────────────────────────────────

  private setupResizeObserver() {
    const el = this.trackContainer().nativeElement;
    this.containerWidth.set(el.clientWidth);

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.containerWidth.set(entry.contentRect.width);
      }
    });
    this.resizeObserver.observe(el);
  }

  private setupMediaQuery() {
    this.mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    this.isMobile.set(this.mediaQuery.matches);
    this.mediaQueryHandler = (e: MediaQueryListEvent) => this.isMobile.set(e.matches);
    this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
  }
}
