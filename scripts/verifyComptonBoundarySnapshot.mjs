import fs from "node:fs/promises";
import path from "node:path";
import {
  collectRings,
  computeBoundsFromRings,
  isRingCcw,
  isRingCw,
  normalizeFeature,
  validateClosedRing,
} from "./comptonBoundaryUtils.mjs";

const SNAPSHOT_PATH = path.resolve("src/data/comptonBoundary.snapshot.json");
const MIN_OUTER_VERTEX_COUNT = 500;
const EPSILON = 1e-9;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function countVertices(rings) {
  return rings.reduce((sum, ring) => sum + ring.length, 0);
}

function assertBoundsContain(bounds, rings) {
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      assert(lng >= minLng - EPSILON, `Bounds minLng ${minLng} does not enclose point lng=${lng}`);
      assert(lng <= maxLng + EPSILON, `Bounds maxLng ${maxLng} does not enclose point lng=${lng}`);
      assert(lat >= minLat - EPSILON, `Bounds minLat ${minLat} does not enclose point lat=${lat}`);
      assert(lat <= maxLat + EPSILON, `Bounds maxLat ${maxLat} does not enclose point lat=${lat}`);
    }
  }
}

async function main() {
  const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
  const snapshot = JSON.parse(raw);

  assert(snapshot && typeof snapshot === "object", "Snapshot must be a JSON object");
  assert(snapshot.meta && typeof snapshot.meta === "object", "Snapshot missing meta");
  assert(snapshot.feature && typeof snapshot.feature === "object", "Snapshot missing feature");

  const normalizedFeature = normalizeFeature(snapshot.feature);
  const { polygons, outerRings, innerRings, allRings } = collectRings(normalizedFeature.geometry);

  assert(polygons.length > 0, "Expected at least one polygon");

  for (let p = 0; p < polygons.length; p += 1) {
    const rings = polygons[p];
    assert(rings.length > 0, `Polygon ${p} has no rings`);

    for (let r = 0; r < rings.length; r += 1) {
      const ring = rings[r];
      validateClosedRing(ring, `feature.geometry.polygons[${p}][${r}]`);
      if (r === 0) {
        assert(isRingCcw(ring), `Polygon ${p} outer ring must be CCW`);
      } else {
        assert(isRingCw(ring), `Polygon ${p} inner ring ${r} must be CW`);
      }
    }
  }

  const outerVertexCount = countVertices(outerRings);
  assert(
    outerVertexCount >= MIN_OUTER_VERTEX_COUNT,
    `Outer-ring vertex count ${outerVertexCount} is below minimum ${MIN_OUTER_VERTEX_COUNT}`
  );

  const computedBounds = computeBoundsFromRings(outerRings);
  assertBoundsContain(computedBounds, allRings);

  const storedBounds = snapshot?.meta?.bounds;
  if (Array.isArray(storedBounds) && storedBounds.length === 2) {
    const compare = JSON.stringify(storedBounds);
    const expected = JSON.stringify(computedBounds);
    assert(compare === expected, `meta.bounds mismatch. expected ${expected}, got ${compare}`);
  }

  process.stdout.write(
    [
      `Boundary snapshot verified: ${path.relative(process.cwd(), SNAPSHOT_PATH)}`,
      `- geometry: ${normalizedFeature.geometry.type}`,
      `- polygons: ${polygons.length}`,
      `- outer rings: ${outerRings.length}`,
      `- inner rings: ${innerRings.length}`,
      `- outer vertices: ${outerVertexCount}`,
      `- computed bounds: ${JSON.stringify(computedBounds)}`,
    ].join("\n") + "\n"
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
