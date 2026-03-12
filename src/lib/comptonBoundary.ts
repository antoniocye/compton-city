/**
 * Compton, CA — OSM relation 112057 simplified with Ramer-Douglas-Peucker
 * at epsilon 0.004 deg (~440 m).  Keeps only the 34 vertices that
 * define major shape features; sub-440 m concavities (OSM tracing noise
 * along streets/lots) are elided so the border line never zigzags through
 * the city interior.
 *
 * Extent: N 33.92320  S 33.86305
 *         E -118.18006  W -118.26263
 *
 * Winds CLOCKWISE (GeoJSON polygon hole convention).
 */
export const COMPTON_BOUNDARY_CW: [number, number][] = [
  [-118.2626310, 33.9055490],
  [-118.2544813, 33.9172774],
  [-118.2389952, 33.9178407],
  [-118.2360675, 33.9059879],
  [-118.2224357, 33.9088172],
  [-118.2288158, 33.9227060],
  [-118.2243848, 33.9231979],
  [-118.2168897, 33.9123200],
  [-118.1868721, 33.9070787],
  [-118.1894321, 33.8947182],
  [-118.1800561, 33.8927249],
  [-118.1869962, 33.8925619],
  [-118.1878860, 33.8814515],
  [-118.2088920, 33.8813096],
  [-118.2055203, 33.8704770],
  [-118.1981752, 33.8882582],
  [-118.2061180, 33.8880830],
  [-118.2043278, 33.8816133],
  [-118.1967631, 33.8816636],
  [-118.2544200, 33.9062230],
  [-118.1944904, 33.9056584],
  [-118.2004320, 33.9061120],
  [-118.1972480, 33.8887460],
  [-118.1892960, 33.8901070],
  [-118.1907440, 33.9053160],
  [-118.2061878, 33.8704520],
  [-118.2161253, 33.8736875],
  [-118.2305426, 33.8630465],
  [-118.2486761, 33.8695005],
  [-118.2487728, 33.8820086],
  [-118.2612691, 33.8800395],
  [-118.2569511, 33.8840023],
  [-118.2601209, 33.8954506],
  [-118.2524524, 33.8977117],
  [-118.2626310, 33.9055490],
];

const WORLD_EXTERIOR_CCW: [number, number][] = [
  [-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90],
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

export const COMPTON_BOUNDS: [[number, number], [number, number]] = [
  [-118.272631, 33.853047],
  [-118.170056, 33.933198],
];
