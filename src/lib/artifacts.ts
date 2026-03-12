import {
  ARTIFACT_TYPE_META,
  ArtifactResource,
  ArtifactType,
  CulturalArtifact,
  LocationNode,
  LocationSummary,
  StreetLocation,
} from "./types";

/** Returns true if location is a street (line geometry) */
export function isStreetLocation(loc: LocationNode): loc is StreetLocation {
  return loc.type === "street";
}

/** Returns the center point { lat, lng } for any location (for Street View, etc.) */
export function getLocationCenter(loc: LocationNode): { lat: number; lng: number } {
  if (isStreetLocation(loc)) {
    const coords = loc.coordinates;
    if (!coords.length) throw new Error(`Street location ${loc.id} has no coordinates`);
    const mid = Math.floor(coords.length / 2);
    const [lng, lat] = coords[mid];
    return { lat, lng };
  }
  return { lat: loc.lat, lng: loc.lng };
}

/** Samples points along a street for heatmap rendering. Returns [lng, lat] pairs. */
export function samplePointsAlongStreet(
  loc: StreetLocation,
  count: number = 24
): [number, number][] {
  const coords = loc.coordinates;
  if (coords.length < 2) return coords.length ? [coords[0]] : [];
  const result: [number, number][] = [];
  const step = (coords.length - 1) / Math.max(1, count - 1);
  for (let i = 0; i < count; i++) {
    const idx = Math.min(i * step, coords.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, coords.length - 1);
    const t = idx - lo;
    const lng = coords[lo][0] + t * (coords[hi][0] - coords[lo][0]);
    const lat = coords[lo][1] + t * (coords[hi][1] - coords[lo][1]);
    result.push([lng, lat]);
  }
  return result;
}

export function buildLocationSummaries(
  locations: LocationNode[],
  artifacts: CulturalArtifact[]
): LocationSummary[] {
  const grouped = new Map<string, CulturalArtifact[]>();
  for (const artifact of artifacts) {
    const current = grouped.get(artifact.locationId) ?? [];
    current.push(artifact);
    grouped.set(artifact.locationId, current);
  }

  const summaries = locations
    .map((location) => {
      const locationArtifacts = (grouped.get(location.id) ?? [])
        .slice()
        .sort((a, b) => b.heatWeight - a.heatWeight || a.title.localeCompare(b.title));
      if (!locationArtifacts.length) return null;

      const totalWeight = locationArtifacts.reduce(
        (sum, artifact) => sum + artifact.heatWeight,
        0
      );
      const typeWeight = new Map<ArtifactType, number>();
      for (const artifact of locationArtifacts) {
        typeWeight.set(
          artifact.type,
          (typeWeight.get(artifact.type) ?? 0) + artifact.heatWeight
        );
      }
      const dominantTypes = [...typeWeight.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([type]) => type);

      return {
        id: location.id,
        location,
        artifacts: locationArtifacts,
        artifactCount: locationArtifacts.length,
        totalWeight,
        normalizedWeight: totalWeight,
        dominantTypes,
      } satisfies LocationSummary;
    })
    .filter((summary): summary is LocationSummary => summary !== null);

  const maxWeight = Math.max(...summaries.map((summary) => summary.totalWeight), 1);

  return summaries
    .map((summary) => ({
      ...summary,
      normalizedWeight: summary.totalWeight / maxWeight,
    }))
    .sort(
      (a, b) =>
        b.totalWeight - a.totalWeight ||
        b.artifactCount - a.artifactCount ||
        a.location.name.localeCompare(b.location.name)
    );
}

export function filterArtifactsByTypes(
  artifacts: CulturalArtifact[],
  activeTypes: ArtifactType[]
) {
  const enabled = new Set(activeTypes);
  return artifacts.filter((artifact) => enabled.has(artifact.type));
}

export function getPrimaryArtifact(summary: LocationSummary | null) {
  return summary?.artifacts[0] ?? null;
}

export function getTypeLabels(types: ArtifactType[]) {
  return types.map((type) => ARTIFACT_TYPE_META[type].label);
}

export function formatArtifactType(type: ArtifactType) {
  return ARTIFACT_TYPE_META[type].label;
}

export function getArtifactLink(resource: ArtifactResource): string | null {
  switch (resource.kind) {
    case "spotify":
      return resource.url;
    case "youtube":
      return resource.url;
    case "image":
      return resource.sourceUrl ?? resource.imageUrl ?? null;
    case "external":
      return resource.url;
    default:
      return null;
  }
}

export function getYouTubeEmbedUrl(resource: ArtifactResource) {
  if (resource.kind !== "youtube") return null;
  const match = resource.url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/
  );
  if (!match) return null;

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });
  if (resource.startSeconds) params.set("start", String(resource.startSeconds));
  if (resource.endSeconds) params.set("end", String(resource.endSeconds));
  return `https://www.youtube.com/embed/${match[1]}?${params.toString()}`;
}

export function getSpotifyEmbedUrl(resource: ArtifactResource) {
  if (resource.kind !== "spotify") return null;
  try {
    const url = new URL(resource.url);
    const [, kind, id] = url.pathname.split("/");
    if (!kind || !id) return null;
    return `https://open.spotify.com/embed/${kind}/${id}`;
  } catch {
    return null;
  }
}
