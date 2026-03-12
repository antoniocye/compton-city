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
import { enrichStreetsWithRoadGeometry } from "@/lib/streetGeometry";

interface HeatmapMapProps {
  summaries: LocationSummary[];
  settings: HeatmapSettings;
  theme: Theme;
  onMapClick?: (lat: number, lng: number) => void;
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

function toHeatmapGeoJSON(summaries: LocationSummary[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const summary of summaries) {
    if (isStreetLocation(summary.location)) continue;
    const { lat, lng } = getLocationCenter(summary.location);
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        locationId:    summary.location.id,
        label:         summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight:   summary.totalWeight,
        weight:        summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function toDotsGeoJSON(summaries: LocationSummary[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const summary of summaries) {
    const { lat, lng } = getLocationCenter(summary.location);
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        locationId:    summary.location.id,
        label:         summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight:   summary.totalWeight,
        weight:        summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

function toStreetsGeoJSON(
  summaries: LocationSummary[],
  enriched?: Map<string, [number, number][]>
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const summary of summaries) {
    if (!isStreetLocation(summary.location)) continue;
    const rawCoords = summary.location.coordinates;
    if (rawCoords.length < 2) continue;
    const coords = enriched?.get(summary.location.id) ?? rawCoords;
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: coords },
      properties: {
        locationId:    summary.location.id,
        label:         summary.location.name,
        artifactCount: summary.artifactCount,
        totalWeight:   summary.totalWeight,
        weight:        summary.normalizedWeight,
        dominantColor: ARTIFACT_TYPE_META[summary.dominantTypes[0]].accent,
        dominantTypes: summary.dominantTypes
          .map((t) => ARTIFACT_TYPE_META[t].label)
          .join(" · "),
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/**
 * Street color expression — warm amber/gold shifted by weight.
 * Color always stays in the warm spectrum so streets look like glowing
 * road highlights regardless of the active heatmap color scheme.
 */
function buildStreetCoreColorExpr(): maplibregl.ExpressionSpecification {
  return [
    "interpolate", ["linear"], ["get", "weight"],
    0,   "rgba(200,130,20,0.9)",
    0.4, "rgba(240,170,20,1)",
    0.7, "rgba(255,200,40,1)",
    1,   "rgba(255,230,80,1)",
  ] as maplibregl.ExpressionSpecification;
}

function buildStreetGlowColorExpr(): maplibregl.ExpressionSpecification {
  return [
    "interpolate", ["linear"], ["get", "weight"],
    0,   "rgba(200,100,0,0.6)",
    0.5, "rgba(240,160,10,0.7)",
    1,   "rgba(255,200,30,0.8)",
  ] as maplibregl.ExpressionSpecification;
}

function buildTooltipHtml(props: maplibregl.MapGeoJSONFeature["properties"]) {
  const label         = props?.label ?? "Location";
  const artifactCount = props?.artifactCount ?? 0;
  const dominantTypes = String(props?.dominantTypes ?? "");
  const totalWeight   = Number(props?.totalWeight ?? 0);

  return `
    <div class="tooltip-content" style="min-width:180px">
      <strong style="display:block">${label}</strong>
      <span style="display:block;margin-top:4px">${artifactCount} artifact${artifactCount === 1 ? "" : "s"} · heat ${totalWeight.toFixed(2)}</span>
      <span style="display:block;margin-top:6px;opacity:.85">${dominantTypes}</span>
    </div>
  `;
}

const MASK_COLOR: Record<Theme, string> = {
  dark:  "rgba(14, 11, 9, 1)",
  light: "rgba(228, 216, 195, 1)",
};
const MASK_OPACITY: Record<Theme, number> = { dark: 0.68, light: 0.60 };
const BORDER: Record<Theme, { glow: string; line: string }> = {
  dark:  { glow: "rgba(34,211,238,0.25)",  line: "rgba(34,211,238,0.80)" },
  light: { glow: "rgba(180,120,20,0.22)",  line: "rgba(160,100,10,0.70)" },
};

export default function HeatmapMap({
  summaries,
  settings,
  theme,
  onMapClick,
  onLocationClick,
}: HeatmapMapProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<maplibregl.Map | null>(null);
  const loadedRef      = useRef(false);
  const enrichedRef    = useRef<Map<string, [number, number][]>>(new Map());

  const summariesRef = useRef(summaries);
  const settingsRef  = useRef(settings);
  const themeRef     = useRef(theme);
  summariesRef.current = summaries;
  settingsRef.current  = settings;
  themeRef.current     = theme;

  const applyHeatmapPaint = useCallback((map: maplibregl.Map, s: HeatmapSettings) => {
    try {
      if (map.getLayer("heatmap-layer")) {
        map.setPaintProperty("heatmap-layer", "heatmap-color",
          buildHeatmapColorExpr(s.colorScheme));
        map.setPaintProperty("heatmap-layer", "heatmap-opacity",   s.opacity);
        map.setPaintProperty("heatmap-layer", "heatmap-radius",
          ["interpolate", ["linear"], ["zoom"], 0, 2, 13, s.radius * 0.6, 16, s.radius * 1.4]);
        map.setPaintProperty("heatmap-layer", "heatmap-intensity",
          ["interpolate", ["linear"], ["zoom"], 0, 0.5, 13, s.intensity, 16, s.intensity * 1.5]);
      }
      // Street layers use fixed warm color — only opacity changes
      for (const layerId of ["streets-glow", "streets-body", "streets-core"]) {
        if (map.getLayer(layerId)) {
          const factor = layerId === "streets-glow" ? 0.35
                       : layerId === "streets-body" ? 0.60
                       : 0.90;
          map.setPaintProperty(layerId, "line-opacity",
            ["interpolate", ["linear"], ["get", "weight"],
             0, factor * s.opacity * 0.4,
             1, factor * s.opacity]);
        }
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
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
          "tiles-light": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          { id: "layer-dark",  type: "raster", source: "tiles-dark",
            layout: { visibility: t === "dark"  ? "visible" : "none" } },
          { id: "layer-light", type: "raster", source: "tiles-light",
            layout: { visibility: t === "light" ? "visible" : "none" } },
        ],
      },
      center: [-118.2350, 33.8990],
      zoom: 13,
      minZoom: 9,
      maxZoom: 18,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right"
    );

    map.on("load", () => {
      loadedRef.current = true;
      const s            = settingsRef.current;
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
        "line-width": 10, "line-blur": 8,
      }});
      map.addLayer({ id: "compton-border-line", type: "line", source: "compton-border-src", paint: {
        "line-color": BORDER[currentTheme].line,
        "line-width": 1.5, "line-dasharray": [6, 4],
      }});

      /* Heatmap — point locations only */
      map.addSource("heatmap-src", {
        type: "geojson",
        data: toHeatmapGeoJSON(summariesRef.current),
      });
      map.addLayer({
        id: "heatmap-layer", type: "heatmap", source: "heatmap-src",
        paint: {
          "heatmap-weight":    ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"],
            0, 0.5, 13, s.intensity, 16, s.intensity * 1.5],
          "heatmap-color":     buildHeatmapColorExpr(s.colorScheme),
          "heatmap-radius":    ["interpolate", ["linear"], ["zoom"],
            0, 2, 13, s.radius * 0.6, 16, s.radius * 1.4],
          "heatmap-opacity":   s.opacity,
        },
      });

      /* Streets — 3-layer glow stack */
      const streetsGeoJSON = toStreetsGeoJSON(summariesRef.current, enrichedRef.current);
      map.addSource("streets-src", { type: "geojson", data: streetsGeoJSON });

      // Layer 1: outer ambient glow
      map.addLayer({
        id: "streets-glow", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetGlowColorExpr(),
          "line-width":   ["interpolate", ["linear"], ["zoom"],
            10, 10, 13, 18, 16, 26],
          "line-blur":    10,
          "line-opacity": ["interpolate", ["linear"], ["get", "weight"],
            0, s.opacity * 0.10,
            1, s.opacity * 0.28],
        },
      });

      // Layer 2: softer body
      map.addLayer({
        id: "streets-body", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetGlowColorExpr(),
          "line-width":   ["interpolate", ["linear"], ["zoom"],
            10, 5, 13, 9, 16, 14],
          "line-blur":    2.5,
          "line-opacity": ["interpolate", ["linear"], ["get", "weight"],
            0, s.opacity * 0.25,
            1, s.opacity * 0.55],
        },
      });

      // Layer 3: sharp luminous core
      map.addLayer({
        id: "streets-core", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetCoreColorExpr(),
          "line-width":   ["interpolate", ["linear"], ["zoom"],
            10, 2, 13, 3.5, 16, 5.5],
          "line-opacity": ["interpolate", ["linear"], ["get", "weight"],
            0, s.opacity * 0.65,
            1, s.opacity * 0.95],
        },
      });

      /* Dots — small circles at each location (high zoom) */
      map.addSource("dots-src", {
        type: "geojson",
        data: toDotsGeoJSON(summariesRef.current),
      });
      map.addLayer({
        id: "dot-layer", type: "circle", source: "dots-src", minzoom: 14,
        paint: {
          "circle-radius":       ["interpolate", ["linear"], ["zoom"], 14, 3, 18, 8],
          "circle-color":        "#ffffff",
          "circle-opacity":      ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 0.90],
          "circle-stroke-color": ["coalesce", ["get", "dominantColor"], "#f59e0b"],
          "circle-stroke-width": 1.5,
        },
      });

      /* Tooltip */
      const tooltip = new maplibregl.Popup({
        closeButton: false, closeOnClick: false, className: "heatmap-tooltip",
      });
      const showTooltip = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.[0]) {
          const p    = e.features[0].properties;
          const geom = e.features[0].geometry;
          const c    = geom.type === "Point"
            ? (geom as GeoJSON.Point).coordinates
            : (geom as GeoJSON.LineString).coordinates[
                Math.floor((geom as GeoJSON.LineString).coordinates.length / 2)
              ];
          tooltip.setLngLat([c[0], c[1]])
            .setHTML(buildTooltipHtml(p))
            .addTo(map);
        }
      };
      for (const layer of ["dot-layer", "streets-core", "streets-body"]) {
        map.on("mouseenter", layer, showTooltip);
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
          tooltip.remove();
        });
      }

      /* Fit on load */
      map.fitBounds(COMPTON_BOUNDS, { padding: 20, duration: 900 });

      /* Enrich streets with Directions API road geometry */
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
      const streetLocs = summariesRef.current
        .filter((s) => isStreetLocation(s.location))
        .map((s) => ({
          id:          s.location.id,
          coordinates: (s.location as { coordinates: [number, number][] }).coordinates,
        }));

      if (apiKey && streetLocs.length > 0) {
        enrichStreetsWithRoadGeometry(streetLocs, apiKey).then((enriched) => {
          if (!mapRef.current || !loadedRef.current) return;
          if (enriched.size === 0) return;
          enrichedRef.current = enriched;
          try {
            (map.getSource("streets-src") as maplibregl.GeoJSONSource)?.setData(
              toStreetsGeoJSON(summariesRef.current, enriched)
            );
          } catch { /* map may have been removed */ }
        });
      }
    });

    /* ── Click handlers ──────────────────────────────────────────────── */
    const handleLocationClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features?.[0]) return;
      const p = e.features[0].properties;
      if (p?.locationId) onLocationClick?.(String(p.locationId));
      e.originalEvent.stopPropagation();
    };
    map.on("click", "dot-layer",     handleLocationClick);
    map.on("click", "streets-core",  handleLocationClick);
    map.on("click", "streets-body",  handleLocationClick);

    map.on("click", (e) => {
      const hit = map.queryRenderedFeatures(e.point, {
        layers: ["dot-layer", "streets-core", "streets-body"],
      });
      if (hit.length > 0) return;
      onMapClick?.(
        parseFloat(e.lngLat.lat.toFixed(6)),
        parseFloat(e.lngLat.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    return () => {
      loadedRef.current = false;
      mapRef.current    = null;
      try { map.stop();   } catch { /* ignore */ }
      try { map.remove(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Sync summaries ──────────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      (map.getSource("heatmap-src") as maplibregl.GeoJSONSource)
        ?.setData(toHeatmapGeoJSON(summaries));
      (map.getSource("dots-src") as maplibregl.GeoJSONSource)
        ?.setData(toDotsGeoJSON(summaries));
      (map.getSource("streets-src") as maplibregl.GeoJSONSource)
        ?.setData(toStreetsGeoJSON(summaries, enrichedRef.current));
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
      map.setLayoutProperty("layer-dark",  "visibility",
        theme === "dark"  ? "visible" : "none");
      map.setLayoutProperty("layer-light", "visibility",
        theme === "light" ? "visible" : "none");
      map.setPaintProperty("compton-mask",        "fill-color",   MASK_COLOR[theme]);
      map.setPaintProperty("compton-mask",        "fill-opacity", MASK_OPACITY[theme]);
      map.setPaintProperty("compton-border-glow", "line-color",   BORDER[theme].glow);
      map.setPaintProperty("compton-border-line", "line-color",   BORDER[theme].line);
    } catch { /* map may have been removed */ }
  }, [theme]);

  return <div ref={containerRef} className="w-full h-full" />;
}
