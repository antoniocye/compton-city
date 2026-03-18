const WORLD_BOUNDS = {
  minLng: -180,
  maxLng: 180,
  minLat: -90,
  maxLat: 90,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function clonePoint(point) {
  return [point[0], point[1]];
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function samePoint(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

export function closeRing(ring) {
  const cloned = ring.map(clonePoint);
  if (!cloned.length) return cloned;
  if (!samePoint(cloned[0], cloned[cloned.length - 1])) cloned.push(clonePoint(cloned[0]));
  return cloned;
}

export function signedArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function orientRing(ring, direction) {
  const area = signedArea(ring);
  const shouldBeCcw = direction === "CCW";
  const isCcw = area > 0;
  if ((shouldBeCcw && isCcw) || (!shouldBeCcw && !isCcw)) return ring;
  return [...ring].reverse();
}

function validatePoint(point, context) {
  assert(Array.isArray(point) && point.length >= 2, `${context}: each point must be [lng, lat]`);
  const [lng, lat] = point;
  assert(isFiniteNumber(lng) && isFiniteNumber(lat), `${context}: point coordinates must be finite numbers`);
  assert(
    lng >= WORLD_BOUNDS.minLng && lng <= WORLD_BOUNDS.maxLng &&
      lat >= WORLD_BOUNDS.minLat && lat <= WORLD_BOUNDS.maxLat,
    `${context}: point ${JSON.stringify(point)} is outside valid lon/lat range`
  );
}

export function validateClosedRing(ring, context) {
  assert(Array.isArray(ring), `${context}: ring must be an array`);
  assert(ring.length >= 4, `${context}: ring must have at least 4 points`);
  ring.forEach((pt, idx) => validatePoint(pt, `${context}[${idx}]`));
  assert(samePoint(ring[0], ring[ring.length - 1]), `${context}: ring must be closed`);
}

function normalizeRing(ring, context) {
  assert(Array.isArray(ring) && ring.length >= 3, `${context}: ring must have at least 3 points before closure`);
  const closed = closeRing(ring);
  validateClosedRing(closed, context);
  return closed;
}

function normalizePolygonRings(rings, context) {
  assert(Array.isArray(rings) && rings.length > 0, `${context}: polygon must have at least one ring`);
  const normalized = rings.map((ring, i) => normalizeRing(ring, `${context}.rings[${i}]`));

  const oriented = normalized.map((ring, i) => orientRing(ring, i === 0 ? "CCW" : "CW"));
  oriented.forEach((ring, i) => validateClosedRing(ring, `${context}.oriented[${i}]`));

  return oriented;
}

export function normalizeGeometry(geometry, context = "geometry") {
  assert(geometry && typeof geometry === "object", `${context}: geometry missing`);
  const { type, coordinates } = geometry;
  assert(type === "Polygon" || type === "MultiPolygon", `${context}: expected Polygon or MultiPolygon`);

  if (type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: normalizePolygonRings(coordinates, context),
    };
  }

  assert(Array.isArray(coordinates) && coordinates.length > 0, `${context}: multipolygon must contain polygons`);
  return {
    type: "MultiPolygon",
    coordinates: coordinates.map((polygon, i) => normalizePolygonRings(polygon, `${context}.polygons[${i}]`)),
  };
}

export function polygonsFromGeometry(geometry) {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

export function collectRings(geometry) {
  const polygons = polygonsFromGeometry(geometry);
  const outerRings = polygons.map((polygon, i) => {
    if (!polygon.length) throw new Error(`Polygon ${i} has no rings`);
    return polygon[0];
  });
  const innerRings = polygons.flatMap((polygon) => polygon.slice(1));
  const allRings = [...outerRings, ...innerRings];
  return { polygons, outerRings, innerRings, allRings };
}

export function computeBoundsFromRings(rings) {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  assert(Number.isFinite(minLng) && Number.isFinite(minLat), "Unable to compute bounds from empty rings");

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function countVertices(rings) {
  return rings.reduce((sum, ring) => sum + ring.length, 0);
}

export function isRingCcw(ring) {
  return signedArea(ring) > 0;
}

export function isRingCw(ring) {
  return signedArea(ring) < 0;
}

export function normalizeFeature(feature) {
  assert(feature && feature.type === "Feature", "Expected GeoJSON Feature");
  const normalizedGeometry = normalizeGeometry(feature.geometry, "feature.geometry");
  return {
    type: "Feature",
    properties: deepClone(feature.properties ?? {}),
    geometry: normalizedGeometry,
  };
}
