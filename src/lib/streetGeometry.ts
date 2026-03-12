/**
 * Decodes a Google Maps encoded polyline string into [lng, lat] coordinate pairs.
 * Uses the standard polyline encoding algorithm (precision 5).
 */
export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}

/**
 * Fetches actual road geometry between two points using the Google Maps
 * Directions API REST endpoint. Returns decoded [lng, lat] pairs that
 * follow the actual road path.
 *
 * Falls back to returning null if the API key is unavailable or the
 * request fails — callers should fall back to the straight-line geometry.
 */
export async function fetchStreetPolyline(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  apiKey: string
): Promise<[number, number][] | null> {
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({
      origin:      `${startLat},${startLng}`,
      destination: `${endLat},${endLng}`,
      mode:        "driving",
      key:         apiKey,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.routes?.[0]) return null;
    const polyline = data.routes[0].overview_polyline?.points;
    if (!polyline) return null;
    return decodePolyline(polyline);
  } catch {
    return null;
  }
}

/**
 * Enriches street location coordinate pairs with actual road geometry
 * from the Google Maps Directions API. Processes all streets concurrently.
 *
 * @param streets  Array of { id, coordinates } for street locations
 * @param apiKey   Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 * @returns Map from locationId → enriched [lng,lat][] coordinates
 */
export async function enrichStreetsWithRoadGeometry(
  streets: { id: string; coordinates: [number, number][] }[],
  apiKey: string
): Promise<Map<string, [number, number][]>> {
  const results = new Map<string, [number, number][]>();
  if (!apiKey) return results;

  await Promise.all(
    streets.map(async ({ id, coordinates }) => {
      if (coordinates.length < 2) return;
      const [startLng, startLat] = coordinates[0];
      const [endLng, endLat]     = coordinates[coordinates.length - 1];
      const enriched = await fetchStreetPolyline(startLat, startLng, endLat, endLng, apiKey);
      if (enriched && enriched.length > 2) {
        results.set(id, enriched);
      }
    })
  );

  return results;
}
