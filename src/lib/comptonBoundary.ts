/**
 * Approximate boundary of Compton, CA traced along main bounding roads:
 *   North  → Rosecrans Ave
 *   East   → Alameda St / Eastern Ave
 *   South  → Alondra Blvd
 *   West   → Bullis Rd / Central Ave
 *
 * Coordinates wind CLOCKWISE so this ring acts as a GeoJSON polygon hole
 * when paired with a world-covering exterior ring (CCW).
 */
export const COMPTON_BOUNDARY_CW: [number, number][] = [
  [-118.2652, 33.9124], // NW  – Bullis Rd & Rosecrans Ave
  [-118.2420, 33.9137], // N   – Rosecrans Ave (west section)
  [-118.2180, 33.9148], // N   – Rosecrans Ave (mid)
  [-118.1970, 33.9144], // N   – Rosecrans Ave (east section)
  [-118.1780, 33.9130], // NE  – Rosecrans Ave & Wilmington Ave
  [-118.1758, 33.9020], // E   – Alameda St (upper)
  [-118.1752, 33.8900], // E   – Alameda St (mid)
  [-118.1752, 33.8760], // E   – Alameda St (lower)
  [-118.1762, 33.8625], // SE  – Alondra Blvd & Alameda St
  [-118.2010, 33.8608], // S   – Alondra Blvd (east section)
  [-118.2210, 33.8600], // S   – Alondra Blvd (mid)
  [-118.2430, 33.8607], // SW  – Alondra Blvd & Central Ave
  [-118.2580, 33.8648], // W   – Bullis Rd / Central Ave (lower)
  [-118.2640, 33.8755], // W   – Bullis Rd (mid)
  [-118.2652, 33.8910], // W   – Bullis Rd (upper)
  [-118.2652, 33.9124], // close
];

/**
 * World-covering rectangle wound CCW (GeoJSON exterior ring convention).
 * Paired with COMPTON_BOUNDARY_CW as a hole this creates a polygon that
 * covers everywhere *except* Compton — used for the grey-out mask layer.
 */
const WORLD_EXTERIOR_CCW: [number, number][] = [
  [-180, -90],
  [-180, 90],
  [180, 90],
  [180, -90],
  [-180, -90],
];

export const COMPTON_MASK_GEOJSON: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [WORLD_EXTERIOR_CCW, COMPTON_BOUNDARY_CW],
  },
};

export const COMPTON_BORDER_GEOJSON: GeoJSON.Feature<GeoJSON.LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: COMPTON_BOUNDARY_CW,
  },
};

/** Bounding box used for fitBounds on first load */
export const COMPTON_BOUNDS: [[number, number], [number, number]] = [
  [-118.275, 33.852], // SW (with padding)
  [-118.165, 33.922], // NE (with padding)
];
