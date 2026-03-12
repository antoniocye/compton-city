/**
 * Convex hull of Compton, CA — derived from OSM administrative boundary
 * (relation 112057) then convex-hull'd so no interior area is accidentally
 * masked out by concavities in the real city boundary.
 *
 * Actual extent:  N 33.93120  S 33.85505
 *                 E -118.17206  W -118.27104
 *
 * Coordinates wind CLOCKWISE (GeoJSON polygon hole convention) so when
 * paired with a world-covering CCW exterior ring the fill layer only covers
 * the area *outside* Compton.
 */
export const COMPTON_BOUNDARY_CW: [number, number][] = [
  [-118.2626310, 33.9055490],
  [-118.2605425, 33.9128012],
  [-118.2454247, 33.9173034],
  [-118.2243848, 33.9231979],
  [-118.1720560, 33.9311980],
  [-118.1800561, 33.8927249],
  [-118.1825307, 33.8892441],
  [-118.1876508, 33.8824822],
  [-118.2055203, 33.8704770],
  [-118.2305426, 33.8630465],
  [-118.2710440, 33.8550470],
  [-118.2626310, 33.9055490],
];

const WORLD_EXTERIOR_CCW: [number, number][] = [
  [-180, -90],
  [-180,  90],
  [ 180,  90],
  [ 180, -90],
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
  [-118.281044, 33.845047], // SW
  [-118.162056, 33.941198], // NE
];
