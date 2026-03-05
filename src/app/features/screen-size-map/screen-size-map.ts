import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Device } from '../../services/devices-api';

// ─── Layout constants ────────────────────────────────────────────────────────

const PADDING = 32;
const VIEWBOX_WIDTH = 800;
const LABEL_AREA_HEIGHT = 50;
const MIN_VIEWBOX_HEIGHT = 200;
const LABEL_OFFSET_Y = 14;
const LABEL_LINE_HEIGHT = 14;

// ─── Internal types & helpers ─────────────────────────────────────────────────

/** Physical bounds (in inches) that the SVG must accommodate. */
interface ScreenSizeBounds {
  /** Largest physical width across all devices (inches). */
  maxWidth: number;
  /** Largest physical height across all devices (inches). */
  maxHeight: number;
}

/** Compute physical width/height from a device's diagonal and pixel aspect ratio. */
function devicePhysicalSize(d: Device): { width: number; height: number } {
  const aspect = d.screenPixelWidth / d.screenPixelHeight;
  const height = d.screenSize / Math.sqrt(aspect * aspect + 1);
  const width = aspect * height;
  return { width, height };
}

/**
 * Calculate the smallest bounding box (in inches) that fits every device.
 */
function computeScreenSizeBounds(devices: Device[]): ScreenSizeBounds {
  let maxWidth = 0;
  let maxHeight = 0;
  for (const d of devices) {
    const { width, height } = devicePhysicalSize(d);
    if (width > maxWidth) maxWidth = width;
    if (height > maxHeight) maxHeight = height;
  }
  return { maxWidth, maxHeight };
}

// ─── Color palette for device outlines ───────────────────────────────────────

const DEVICE_COLORS = [
  'hsl(0, 70%, 55%)', // red (accent)
  'hsl(210, 70%, 55%)', // blue
  'hsl(140, 55%, 45%)', // green
  'hsl(35, 85%, 55%)', // orange
  'hsl(270, 60%, 55%)', // purple
  'hsl(180, 55%, 45%)', // teal
  'hsl(330, 65%, 55%)', // pink
  'hsl(60, 65%, 45%)', // olive
  'hsl(195, 70%, 50%)', // sky
  'hsl(15, 75%, 50%)', // burnt orange
];

// ─── Internal types ──────────────────────────────────────────────────────────

interface DeviceRect {
  id: string;
  label: string;
  diagonalLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  ry: number;
  stroke: string;
  fill: string;
  /** Physical area for z-order sorting (largest behind) */
  area: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-screen-size-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    ngSkipHydration: 'true',
  },
  template: `
    @if (deviceRects().length === 0) {
      <div class="empty-state">
        <span>Slide the timeline to see devices</span>
      </div>
    } @else {
      <div class="map-container">
        <svg [attr.viewBox]="viewBox()" preserveAspectRatio="xMidYMin meet">
          <!-- Render rectangles largest-first so smaller ones are on top -->
          @for (rect of deviceRects(); track rect.id) {
            <rect
              [attr.x]="rect.x"
              [attr.y]="rect.y"
              [attr.width]="rect.width"
              [attr.height]="rect.height"
              [attr.rx]="rect.rx"
              [attr.ry]="rect.ry"
              [attr.stroke]="rect.stroke"
              [attr.fill]="rect.fill"
              class="device-rect"
            />
          }

          <!-- Labels positioned at bottom-right of each rect -->
          @for (rect of deviceRects(); track rect.id) {
            <text
              [attr.x]="rect.x + rect.width - 6"
              [attr.y]="rect.y + rect.height - LABEL_OFFSET_Y - LABEL_LINE_HEIGHT"
              text-anchor="end"
              class="device-label device-label-name"
              [attr.fill]="rect.stroke"
            >
              {{ rect.label }}
            </text>
            <text
              [attr.x]="rect.x + rect.width - 6"
              [attr.y]="rect.y + rect.height - LABEL_OFFSET_Y"
              text-anchor="end"
              class="device-label device-label-size"
            >
              {{ rect.diagonalLabel }}
            </text>
          }
        </svg>
      </div>
    }
  `,
  styleUrl: './screen-size-map.css',
})
export class ScreenSizeMap {
  /** Complete list of devices (used for stable bounds and color assignment). */
  devices = input.required<Device[]>();

  /** IDs of devices to render as overlapping rectangles. */
  selectedDevices = input<string[]>([]);

  protected readonly LABEL_OFFSET_Y = LABEL_OFFSET_Y;
  protected readonly LABEL_LINE_HEIGHT = LABEL_LINE_HEIGHT;

  /** Fixed physical bounds derived from all devices so the scale never shifts. */
  private bounds = computed(() => computeScreenSizeBounds(this.devices()));

  /** Map from device ID → index in the full devices array (for stable colors). */
  private deviceIndexMap = computed(() => {
    const map = new Map<string, number>();
    this.devices().forEach((d, i) => map.set(d.id, i));
    return map;
  });

  /** The selected devices resolved from the full list, preserving selectedDevices order. */
  private selectedDevicesList = computed(() => {
    const ids = new Set(this.selectedDevices());
    const all = this.devices();
    const byId = new Map(all.map((d) => [d.id, d]));
    return this.selectedDevices()
      .map((id) => byId.get(id))
      .filter((d): d is Device => d !== undefined);
  });

  /** The y-coordinate of the shared bottom edge for all rects. */
  private contentBottom = computed(() => {
    const scale = this.scale();
    const bounds = this.bounds();
    if (bounds.maxHeight > 0) {
      return PADDING + bounds.maxHeight * scale;
    }
    return PADDING;
  });

  /** Scale factor derived from the bounds of all devices. */
  private scale = computed(() => {
    const drawWidth = VIEWBOX_WIDTH - PADDING * 2;
    const bounds = this.bounds();
    if (bounds.maxWidth > 0) {
      return drawWidth / bounds.maxWidth;
    }
    return 1;
  });

  /** Compute physical dimensions, scale, and position all rectangles. */
  protected deviceRects = computed<DeviceRect[]>(() => {
    const devices = this.selectedDevicesList();
    if (devices.length === 0) return [];

    const scale = this.scale();
    const indexMap = this.deviceIndexMap();

    // 1. Compute physical dimensions for each device
    const physicals = devices.map((d) => {
      const { width, height } = devicePhysicalSize(d);
      return { device: d, physicalWidth: width, physicalHeight: height };
    });

    // 2. Build rects, sorted by area descending (largest behind)
    const rects: DeviceRect[] = physicals
      .map((p) => {
        const w = p.physicalWidth * scale;
        const h = p.physicalHeight * scale;
        const area = w * h;

        // Bottom-center alignment: all rects share the same bottom edge, centered horizontally
        const centerX = VIEWBOX_WIDTH / 2;
        const x = centerX - w / 2;
        const bottomY = this.contentBottom();
        const y = bottomY - h;

        // Corner radius: map from pixel-space to physical-space, then to SVG-space
        const pxToPhysical = p.physicalWidth / p.device.screenPixelWidth;
        const rx = p.device.screenCornerRadius * pxToPhysical * scale;
        const ry = rx;

        // Color derived from device's index in the full list — stable across selections
        const colorIndex = (indexMap.get(p.device.id) ?? 0) % DEVICE_COLORS.length;
        const stroke = DEVICE_COLORS[colorIndex];
        const fill = stroke.replace(')', ', 0.06)').replace('hsl(', 'hsla(');

        return {
          id: p.device.id,
          label: `${p.device.manufacturer} ${p.device.name}`,
          diagonalLabel: `${p.device.screenSize}″`,
          x,
          y,
          width: w,
          height: h,
          rx,
          ry,
          stroke,
          fill,
          area,
        };
      })
      .sort((a, b) => b.area - a.area); // largest first → painted behind

    return rects;
  });

  /** ViewBox sized to the bounds (stable) or to actual content (fallback). */
  protected viewBox = computed(() => {
    const bottom = this.contentBottom();
    const totalHeight = bottom + PADDING + LABEL_AREA_HEIGHT;
    return `0 0 ${VIEWBOX_WIDTH} ${Math.max(totalHeight, MIN_VIEWBOX_HEIGHT)}`;
  });
}
