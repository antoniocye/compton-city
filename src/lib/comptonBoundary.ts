import boundarySnapshot from "@/data/comptonBoundary.snapshot.json";

type Ring = [number, number][];
type PolygonRings = Ring[];
type MultiPolygonRings = PolygonRings[];

interface BoundarySnapshot {
  meta: {
    sourceUrl: string;
    sourceLayer: string;
    cityName: string;
    featureType: string;
    fetchedAt: string;
    lastEditedDateMs: number | null;
    lastEditedDateIso: string | null;
    ringStats: {
      outerRingCount: number;
      innerRingCount: number;
      verticesOuter: number;
      verticesInner: number;
      verticesTotal: number;
    };
    bounds: [[number, number], [number, number]];
  };
  feature: {
    type: "Feature";
    properties: {
      CITY_NAME: string;
      FEAT_TYPE: string;
      last_edited_date: number | null;
    };
    geometry:
      | {
          type: "Polygon";
          coordinates: PolygonRings;
        }
      | {
          type: "MultiPolygon";
          coordinates: MultiPolygonRings;
        };
  };
}

const SNAPSHOT = boundarySnapshot as BoundarySnapshot;

function polygonsFromGeometry(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): PolygonRings[] {
  if (geometry.type === "Polygon") return [geometry.coordinates as PolygonRings];
  return geometry.coordinates as MultiPolygonRings;
}

function reverseRing(ring: Ring): Ring {
  return [...ring].reverse() as Ring;
}

function computeBoundsFromOuterRings(
  outerRings: Ring[]
): [[number, number], [number, number]] {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const ring of outerRings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export const COMPTON_BOUNDARY_META = SNAPSHOT.meta;

export const COMPTON_CITY_GEOJSON = SNAPSHOT.feature as unknown as GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon
>;

const polygons = polygonsFromGeometry(COMPTON_CITY_GEOJSON.geometry);
const outerRings = polygons.map((polygon) => polygon[0]);
const innerRings = polygons.flatMap((polygon) => polygon.slice(1));

export const COMPTON_BORDER_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
  type: "FeatureCollection",
  features: polygons.flatMap((polygon, polygonIndex) =>
    polygon.map((ring, ringIndex) => ({
      type: "Feature" as const,
      properties: {
        polygonIndex,
        ringIndex,
        ringType: ringIndex === 0 ? "outer" : "hole",
      },
      geometry: {
        type: "LineString",
        coordinates: ring,
      },
    }))
  ),
};

const WORLD_EXTERIOR_CCW: Ring = [
  [-180, -90],
  [-180, 90],
  [180, 90],
  [180, -90],
  [-180, -90],
];

export const COMPTON_MASK_GEOJSON: GeoJSON.Feature<GeoJSON.MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "MultiPolygon",
    coordinates: [
      // Polygon 1: world shell with Compton outer rings as holes.
      [WORLD_EXTERIOR_CCW, ...outerRings.map((ring) => reverseRing(ring))],
      // Polygon 2..N: each enclave becomes its own filled polygon.
      ...innerRings.map((ring) => [reverseRing(ring)]),
    ],
  },
};

export const COMPTON_BOUNDS = computeBoundsFromOuterRings(outerRings);
