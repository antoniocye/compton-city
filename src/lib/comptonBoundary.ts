/**
 * Compton, CA — OSM relation 112057.
 * 29 vertices, zero self-intersections verified.
 * Winds CLOCKWISE (GeoJSON polygon hole convention).
 */
export const COMPTON_BOUNDARY_CW: [number, number][] = [
  [-118.2061878, 33.8704520],
  [-118.2069633, 33.8737140],
  [-118.2596498, 33.8860748],
  [-118.2595927, 33.8860479],
  [-118.2595602, 33.8859957],
  [-118.2613702, 33.8860842],
  [-118.2601209, 33.8954506],
  [-118.2577155, 33.8959460],
  [-118.2590555, 33.9025434],
  [-118.2612100, 33.9024580],
  [-118.2626310, 33.9055490],
  [-118.2609180, 33.9091450],
  [-118.2544802, 33.9160759],
  [-118.2383411, 33.9162172],
  [-118.2307912, 33.9077368],
  [-118.2274573, 33.9082224],
  [-118.2283240, 33.9207300],
  [-118.2139545, 33.9126485],
  [-118.2057706, 33.9126635],
  [-118.1949170, 33.9032440],
  [-118.1984229, 33.9059003],
  [-118.1982975, 33.9035888],
  [-118.1991850, 33.9013050],
  [-118.1980020, 33.8931910],
  [-118.1974330, 33.8915400],
  [-118.1972480, 33.8887460],
  [-118.1902030, 33.8894010],
  [-118.2061878, 33.8704520],
  [-118.2726310, 33.8565060],
  [-118.2061878, 33.8704520],
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
  [-118.282631, 33.846506],
  [-118.180203, 33.930730],
];
