"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ARTIFACT_TYPE_META,
  HeatmapSettings,
  COLOR_SCHEMES,
  Theme,
  LocationSummary,
} from "@/lib/types";
import { getLocationCenter, isStreetLocation } from "@/lib/artifacts";
import {
  COMPTON_MASK_GEOJSON,
  COMPTON_BORDER_GEOJSON,
  COMPTON_BOUNDS,
} from "@/lib/comptonBoundary";

interface HeatmapMapProps {
  summaries: LocationSummary[];
  settings: HeatmapSettings;
  theme: Theme;
  /** Fired on general map clicks (fill add-form) */
  onMapClick?: (lat: number, lng: number) => void;
  /** Fired when a known location dot is clicked */
  onLocationClick?: (locationId: string) => void;
}

function buildHeatmapColorExpr(
  scheme: HeatmapSettings["colorScheme"]
): maplibregl.ExpressionSpecification {
  const stops = COLOR_SCHEMES[scheme];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
  for (const [stop, color] of stops) expr.push(stop, color);
  return expr as maplibregl.ExpressionSpecification;
}

/** Point locations only — for heatmap dots (points dominate, streets don't) */
function toHeatmapGeoJSON(summaries: LocationSummary[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const summary of summaries) {
    if (isStreetLocation(summary.location)) continue;
    const { lat, lng } = getLocationCenter(summary.location);
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        locationId: summary.location.id,
        label: summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight: summary.totalWeight,
        weight: summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/** One point per location (center for streets) — for dots, tooltip, click */
function toDotsGeoJSON(summaries: LocationSummary[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const summary of summaries) {
    const { lat, lng } = getLocationCenter(summary.location);
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        locationId: summary.location.id,
        label: summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight: summary.totalWeight,
        weight: summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Street lines — thin continuous line, heat-colored */
function toStreetsGeoJSON(summaries: LocationSummary[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const summary of summaries) {
    if (!isStreetLocation(summary.location)) continue;
    const coords = summary.location.coordinates;
    if (coords.length < 2) continue;
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
      properties: {
        locationId: summary.location.id,
        label: summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight: summary.totalWeight,
        weight: summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function buildStreetLineColorExpr(
  scheme: HeatmapSettings["colorScheme"]
): maplibregl.ExpressionSpecification {
  const stops = COLOR_SCHEMES[scheme];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["get", "weight"]];
  for (const [stop, color] of stops) expr.push(stop, color);
  return expr as maplibregl.ExpressionSpecification;
}

function buildTooltipHtml(props: maplibregl.MapGeoJSONFeature["properties"]) {
  const label = props?.label ?? "Location";
  const artifactCount = props?.artifactCount ?? 0;
  const dominantTypes = String(props?.dominantTypes ?? "");
  const totalWeight = Number(props?.totalWeight ?? 0);

  return `
    <div class="tooltip-content" style="min-width: 180px">
      <strong style="display:block">${label}</strong>
      <span style="display:block;margin-top:4px">${artifactCount} artifact${artifactCount === 1 ? "" : "s"} · heat ${totalWeight.toFixed(2)}</span>
      <span style="display:block;margin-top:6px;opacity:.85">${dominantTypes}</span>
    </div>
  `;
}

const MASK_COLOR: Record<Theme, string> = {
  dark:  "rgba(4, 6, 18, 1)",
  light: "rgba(205, 215, 228, 1)",
};
const MASK_OPACITY: Record<Theme, number> = { dark: 0.65, light: 0.62 };
const BORDER: Record<Theme, { glow: string; line: string }> = {
  dark:  { glow: "rgba(34, 211, 238, 0.3)",  line: "rgba(34, 211, 238, 0.85)" },
  light: { glow: "rgba(2, 132, 199, 0.2)",   line: "rgba(2, 100, 180, 0.8)" },
};

export default function HeatmapMap({
  summaries,
  settings,
  theme,
  onMapClick,
  onLocationClick,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const loadedRef    = useRef(false);

  const summariesRef = useRef(summaries);
  const settingsRef  = useRef(settings);
  const themeRef     = useRef(theme);
  summariesRef.current = summaries;
  settingsRef.current  = settings;
  themeRef.current     = theme;

  const applyHeatmapPaint = useCallback((map: maplibregl.Map, s: HeatmapSettings) => {
    try {
      if (map.getLayer("heatmap-layer")) {
        map.setPaintProperty("heatmap-layer", "heatmap-color",     buildHeatmapColorExpr(s.colorScheme));
        map.setPaintProperty("heatmap-layer", "heatmap-opacity",   s.opacity);
        map.setPaintProperty("heatmap-layer", "heatmap-radius",    ["interpolate", ["linear"], ["zoom"], 0, 2, 13, s.radius * 0.6,  16, s.radius * 1.4]);
        map.setPaintProperty("heatmap-layer", "heatmap-intensity", ["interpolate", ["linear"], ["zoom"], 0, 0.5, 13, s.intensity, 16, s.intensity * 1.5]);
      }
      if (map.getLayer("streets-layer")) {
        map.setPaintProperty("streets-layer", "line-color",   buildStreetLineColorExpr(s.colorScheme));
        map.setPaintProperty("streets-layer", "line-opacity", s.opacity * 0.85);
      }
    } catch { /* map may have been removed */ }
  }, []);

  /* ── Init ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const t = themeRef.current;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          "tiles-dark": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
          "tiles-light": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          { id: "layer-dark",  type: "raster", source: "tiles-dark",  layout: { visibility: t === "dark"  ? "visible" : "none" } },
          { id: "layer-light", type: "raster", source: "tiles-light", layout: { visibility: t === "light" ? "visible" : "none" } },
        ],
      },
      center: [-118.2201, 33.8958],
      zoom: 13,
      minZoom: 9,
      maxZoom: 18,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "bottom-right");

    map.on("load", () => {
      loadedRef.current = true;
      const s = settingsRef.current;
      const currentTheme = themeRef.current;

      /* Compton mask */
      map.addSource("compton-mask-src",   { type: "geojson", data: COMPTON_MASK_GEOJSON });
      map.addSource("compton-border-src", { type: "geojson", data: COMPTON_BORDER_GEOJSON });

      map.addLayer({ id: "compton-mask", type: "fill", source: "compton-mask-src", paint: {
        "fill-color":   MASK_COLOR[currentTheme],
        "fill-opacity": MASK_OPACITY[currentTheme],
      }});
      map.addLayer({ id: "compton-border-glow", type: "line", source: "compton-border-src", paint: {
        "line-color": BORDER[currentTheme].glow,
        "line-width": 9, "line-blur": 7,
      }});
      map.addLayer({ id: "compton-border-line", type: "line", source: "compton-border-src", paint: {
        "line-color": BORDER[currentTheme].line,
        "line-width": 1.5, "line-dasharray": [5, 3],
      }});

      /* Heatmap — point locations only (streets use line layer) */
      map.addSource("heatmap-src", { type: "geojson", data: toHeatmapGeoJSON(summariesRef.current) });
      map.addLayer({
        id: "heatmap-layer", type: "heatmap", source: "heatmap-src",
        paint: {
          "heatmap-weight":     ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity":  ["interpolate", ["linear"], ["zoom"], 0, 0.5, 13, s.intensity, 16, s.intensity * 1.5],
          "heatmap-color":      buildHeatmapColorExpr(s.colorScheme),
          "heatmap-radius":     ["interpolate", ["linear"], ["zoom"], 0, 2, 13, s.radius * 0.6, 16, s.radius * 1.4],
          "heatmap-opacity":    s.opacity,
        },
      });

      /* Street lines — thin, heat-colored, below points visually */
      map.addSource("streets-src", { type: "geojson", data: toStreetsGeoJSON(summariesRef.current) });
      map.addLayer({
        id: "streets-layer", type: "line", source: "streets-src",
        paint: {
          "line-color":   buildStreetLineColorExpr(s.colorScheme),
          "line-width":   ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 2.5, 18, 3.5],
          "line-opacity": s.opacity * 0.75,
        },
      });

      /* One dot per location (high zoom) — subtle, no numbers */
      map.addSource("dots-src", { type: "geojson", data: toDotsGeoJSON(summariesRef.current) });
      map.addLayer({
        id: "dot-layer", type: "circle", source: "dots-src", minzoom: 15,
        paint: {
          "circle-radius":     ["interpolate", ["linear"], ["zoom"], 15, 4, 18, 8],
          "circle-color":     theme === "dark" ? "#f8fafc" : "#ffffff",
          "circle-opacity":   ["interpolate", ["linear"], ["zoom"], 15, 0, 16, 0.85],
          "circle-stroke-color":  ["coalesce", ["get", "dominantColor"], "#22d3ee"],
          "circle-stroke-width":  1.5,
        },
      });

      /* Tooltip */
      const tooltip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "heatmap-tooltip" });
      const showTooltip = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.[0]) {
          const p = e.features[0].properties;
          const geom = e.features[0].geometry;
          const c = geom.type === "Point" ? (geom as GeoJSON.Point).coordinates
            : (geom as GeoJSON.LineString).coordinates[0];
          tooltip.setLngLat([c[0], c[1]])
            .setHTML(buildTooltipHtml(p))
            .addTo(map);
        }
      };
      map.on("mouseenter", "dot-layer", showTooltip);
      map.on("mouseenter", "streets-layer", showTooltip);
      map.on("mouseleave", "dot-layer", () => { map.getCanvas().style.cursor = ""; tooltip.remove(); });
      map.on("mouseleave", "streets-layer", () => { map.getCanvas().style.cursor = ""; tooltip.remove(); });

      /* Fit Compton on first load */
      map.fitBounds(COMPTON_BOUNDS, { padding: 10, duration: 900 });
    });

    /* ── Click handlers ───────────────────────────────────────────────── */

    // Click on dot or street → fire onLocationClick
    const handleLocationClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.[0]) return;
      const p = e.features[0].properties;
      if (p?.locationId) onLocationClick?.(String(p.locationId));
      e.originalEvent.stopPropagation();
    };
    map.on("click", "dot-layer", handleLocationClick);
    map.on("click", "streets-layer", handleLocationClick);

    // General map click → fire onMapClick (fills add form + opens SV at that spot)
    map.on("click", (e) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: ["dot-layer", "streets-layer"] });
      if (hit.length > 0) return;
      onMapClick?.(parseFloat(e.lngLat.lat.toFixed(6)), parseFloat(e.lngLat.lng.toFixed(6)));
    });

    mapRef.current = map;
    return () => {
      loadedRef.current = false;
      mapRef.current = null;        // null the ref first so all effects bail immediately
      try { map.stop(); } catch { /* ignore if already destroyed */ }
      try { map.remove(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sync summaries ──────────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      (map.getSource("heatmap-src") as maplibregl.GeoJSONSource)?.setData(toHeatmapGeoJSON(summaries));
      (map.getSource("dots-src") as maplibregl.GeoJSONSource)?.setData(toDotsGeoJSON(summaries));
      (map.getSource("streets-src") as maplibregl.GeoJSONSource)?.setData(toStreetsGeoJSON(summaries));
    } catch { /* map may have been removed */ }
  }, [summaries]);

  /* ── Sync settings ───────────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    applyHeatmapPaint(map, settings);
  }, [settings, applyHeatmapPaint]);

  /* ── Sync theme ──────────────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      map.setLayoutProperty("layer-dark",  "visibility", theme === "dark"  ? "visible" : "none");
      map.setLayoutProperty("layer-light", "visibility", theme === "light" ? "visible" : "none");
      map.setPaintProperty("compton-mask",        "fill-color",   MASK_COLOR[theme]);
      map.setPaintProperty("compton-mask",        "fill-opacity", MASK_OPACITY[theme]);
      map.setPaintProperty("compton-border-glow", "line-color",   BORDER[theme].glow);
      map.setPaintProperty("compton-border-line", "line-color",   BORDER[theme].line);
      map.setPaintProperty("dot-layer", "circle-color", theme === "dark" ? "#f8fafc" : "#ffffff");
    } catch { /* map may have been removed */ }
  }, [theme]);

  return <div ref={containerRef} className="w-full h-full" />;
}
