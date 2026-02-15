export interface Device {
  id: string;
  manufacturer: string;
  name: string;
  type: 'smartphone' | 'tablet' | 'laptop' | 'desktop' | 'wearable' | 'other';
  releaseDate: string;
  /** Screen diagonal in inches */
  screenSize: number;
  screenPixelHeight: number;
  screenPixelWidth: number;
  screenCornerRadius: number;
  isDraft: boolean;
}

/** Shape stored in MongoDB (without id, since Mongo uses _id) */
export type DeviceDocument = Omit<Device, 'id'>;

export interface DeviceQueryFilters {
  isDraft?: boolean;
  manufacturer?: string;
  name?: string;
  type?: Device['type'];
  releaseDateFrom?: string;
  releaseDateTo?: string;
  screenSizeMin?: number;
  screenSizeMax?: number;
  screenPixelWidthMin?: number;
  screenPixelWidthMax?: number;
  screenPixelHeightMin?: number;
  screenPixelHeightMax?: number;
  pixelDensityMin?: number;
  pixelDensityMax?: number;
  screenCornerRadiusMin?: number;
  screenCornerRadiusMax?: number;
}

export interface DeviceMetadata {
  boundaries: {
    minReleaseDate: string | null;
    maxReleaseDate: string | null;
    minScreenSize: number | null;
    maxScreenSize: number | null;
    minScreenPixelWidth: number | null;
    maxScreenPixelWidth: number | null;
    minScreenPixelHeight: number | null;
    maxScreenPixelHeight: number | null;
    minPixelDensity: number | null;
    maxPixelDensity: number | null;
    minScreenCornerRadius: number | null;
    maxScreenCornerRadius: number | null;
  };
  manufacturers: string[];
  counts: {
    totalDevices: number;
    draftDevices: number;
    publishedDevices: number;
  };
}
