import fs from "node:fs/promises";
import path from "node:path";
import {
  collectRings,
  computeBoundsFromRings,
  countVertices,
  normalizeFeature,
} from "./comptonBoundaryUtils.mjs";

const SOURCE_URL =
  "https://dpw.gis.lacounty.gov/dpw/rest/services/CityBoundaries/MapServer/1/query" +
  "?where=CITY_NAME%3D%27Compton%27%20AND%20FEAT_TYPE%3D%27Land%27" +
  "&outFields=CITY_NAME,FEAT_TYPE,last_edited_date" +
  "&returnGeometry=true&f=geojson";

const OUTPUT_PATH = path.resolve("src/data/comptonBoundary.snapshot.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function toIsoFromMs(ms) {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function sanitizeProperties(properties) {
  return {
    CITY_NAME: String(properties?.CITY_NAME ?? "Compton"),
    FEAT_TYPE: String(properties?.FEAT_TYPE ?? "Land"),
    last_edited_date:
      typeof properties?.last_edited_date === "number" && Number.isFinite(properties.last_edited_date)
        ? properties.last_edited_date
        : null,
  };
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { Accept: "application/geo+json, application/json" },
  });

  assert(response.ok, `Boundary fetch failed: HTTP ${response.status}`);

  const payload = await response.json();
  assert(payload?.type === "FeatureCollection", "Expected GeoJSON FeatureCollection payload");
  assert(Array.isArray(payload.features), "Expected features array in payload");
  assert(payload.features.length === 1, `Expected exactly 1 feature, received ${payload.features.length}`);

  const normalizedFeature = normalizeFeature(payload.features[0]);
  normalizedFeature.properties = sanitizeProperties(normalizedFeature.properties);

  const { outerRings, innerRings } = collectRings(normalizedFeature.geometry);
  const bounds = computeBoundsFromRings(outerRings);

  const verticesOuter = countVertices(outerRings);
  const verticesInner = countVertices(innerRings);
  const lastEditedDateMs = normalizedFeature.properties.last_edited_date;

  const snapshot = {
    meta: {
      sourceUrl: SOURCE_URL,
      sourceLayer: "LA County DPW CityBoundaries MapServer/1",
      cityName: "Compton",
      featureType: "Land",
      fetchedAt: new Date().toISOString(),
      lastEditedDateMs,
      lastEditedDateIso: toIsoFromMs(lastEditedDateMs),
      ringStats: {
        outerRingCount: outerRings.length,
        innerRingCount: innerRings.length,
        verticesOuter,
        verticesInner,
        verticesTotal: verticesOuter + verticesInner,
      },
      bounds,
    },
    feature: normalizedFeature,
  };

  await fs.writeFile(`${OUTPUT_PATH}`, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  process.stdout.write(
    [
      `Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`,
      `- outer rings: ${outerRings.length}`,
      `- inner rings: ${innerRings.length}`,
      `- vertices: ${verticesOuter + verticesInner}`,
      `- bounds: ${JSON.stringify(bounds)}`,
      `- source last edited: ${snapshot.meta.lastEditedDateIso ?? "unknown"}`,
    ].join("\n") + "\n"
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
