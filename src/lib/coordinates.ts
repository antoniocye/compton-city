export type RawPoint = {
  lat: number;
  lng: number;
  weight: number;
};

export type Hotspot = {
  id: string;
  lat: number;
  lng: number;
  weight: number;
  entries: number;
  share: number;
};

export type ParseResult = {
  points: RawPoint[];
  invalidLines: Array<{
    lineNumber: number;
    content: string;
  }>;
};

export type ViewMode = 'hybrid' | 'heat' | 'circles';

export const COMPTON_CENTER = {
  lat: 33.8958,
  lng: -118.2201,
};

export const sampleCoordinateText = `# lat,lng
33.8958,-118.2201
33.8958,-118.2201
33.8958,-118.2201
33.8986,-118.2247
33.8986,-118.2247
33.8894,-118.2151
33.8894,-118.2151
33.8894,-118.2151
33.8894,-118.2151
33.9011,-118.2305
33.9011,-118.2305
33.8875,-118.2269
33.8875,-118.2269
33.9052,-118.2168
33.8922,-118.2097
33.8922,-118.2097
33.9003,-118.2142
33.9003,-118.2142
33.9003,-118.2142
33.8837,-118.2196
33.8979,-118.2341
33.8979,-118.2341`;

export function parseCoordinateText(input: string): ParseResult {
  const points: RawPoint[] = [];
  const invalidLines: ParseResult['invalidLines'] = [];

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      return;
    }

    const normalized = line.replace(/[;\t ]+/g, ',');
    const parts = normalized
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2 || parts.length > 3) {
      invalidLines.push({ lineNumber: index + 1, content: rawLine });
      return;
    }

    const lat = Number(parts[0]);
    const lng = Number(parts[1]);
    const weight = parts[2] ? Number(parts[2]) : 1;

    const isValid =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Number.isFinite(weight) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      weight > 0;

    if (!isValid) {
      invalidLines.push({ lineNumber: index + 1, content: rawLine });
      return;
    }

    points.push({
      lat,
      lng,
      weight,
    });
  });

  return { points, invalidLines };
}

export function aggregateHotspots(points: RawPoint[]): Hotspot[] {
  if (!points.length) {
    return [];
  }

  const hotspotMap = new Map<
    string,
    {
      lat: number;
      lng: number;
      weight: number;
      entries: number;
    }
  >();

  let totalWeight = 0;

  for (const point of points) {
    const key = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
    const current = hotspotMap.get(key);

    if (current) {
      current.weight += point.weight;
      current.entries += 1;
    } else {
      hotspotMap.set(key, {
        lat: point.lat,
        lng: point.lng,
        weight: point.weight,
        entries: 1,
      });
    }

    totalWeight += point.weight;
  }

  return Array.from(hotspotMap.entries())
    .map(([id, value]) => ({
      id,
      lat: value.lat,
      lng: value.lng,
      weight: value.weight,
      entries: value.entries,
      share: totalWeight ? value.weight / totalWeight : 0,
    }))
    .sort((left, right) => right.weight - left.weight);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCoordinate(value: number): string {
  return value.toFixed(4);
}
