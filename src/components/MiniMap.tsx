"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  COLOR_SCHEMES,
  HeatmapSettings,
  Theme,
  LocationSummary,
} from "@/lib/types";
import { COMPTON_BORDER_GEOJSON } from "@/lib/comptonBoundary";
import { getLocationCenter, isStreetLocation } from "@/lib/artifacts";
import {
  buildMiniHeatPaintExpressions,
  buildStreetLayerStyle,
} from "@/lib/heatmapStyle";

interface MiniMapProps {
  summaries: LocationSummary[];
  settings: HeatmapSettings;
  theme: Theme;
  focusLat: number;
  focusLng: number;
  onTeleport: (lat: number, lng: number) => void;
  onExpand: () => void;
}

function buildColorExpr(scheme: HeatmapSettings["colorScheme"]) {
  const stops = COLOR_SCHEMES[scheme];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
  for (const [s, c] of stops) expr.push(s, c);
  return expr as maplibregl.ExpressionSpecification;
}

function buildStreetCoreColor(scheme: HeatmapSettings["colorScheme"]): maplibregl.ExpressionSpecification {
  const all = COLOR_SCHEMES[scheme];
  const stops = all.filter(([s]) => s >= 0.25 && s <= 1.0);
  const lo = stops[0][0], hi = stops[stops.length - 1][0], span = hi - lo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["get", "weight"]];
  stops.forEach(([s, color]) => expr.push((s - lo) / span, color));
  return expr as maplibregl.ExpressionSpecification;
}

function buildStreetGlowColor(scheme: HeatmapSettings["colorScheme"]): maplibregl.ExpressionSpecification {
  const all = COLOR_SCHEMES[scheme];
  const stops = all.filter(([s]) => s >= 0.1 && s <= 0.7);
  const lo = stops[0][0], hi = stops[stops.length - 1][0], span = hi - lo;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["get", "weight"]];
  stops.forEach(([s, color]) => expr.push((s - lo) / span, color));
  return expr as maplibregl.ExpressionSpecification;
}

export default function MiniMap({
  summaries, settings, theme,
  focusLat, focusLng,
  onTeleport, onExpand,
}: MiniMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<maplibregl.Map | null>(null);
  const loadedRef     = useRef(false);   // true only after map "load" event fires
  const markerRef     = useRef<maplibregl.Marker | null>(null);
  const markerElRef   = useRef<HTMLDivElement | null>(null);
  const isDark = theme === "dark";

  const heatData = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    for (const summary of summaries) {
      if (isStreetLocation(summary.location)) continue;
      const { lat, lng } = getLocationCenter(summary.location);
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { weight: summary.normalizedWeight },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [summaries]);

  const streetsData = useMemo(() => {
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    for (const summary of summaries) {
      if (!isStreetLocation(summary.location)) continue;
      const coords = summary.location.coordinates;
      if (coords.length < 2) continue;
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: { weight: summary.normalizedWeight },
      });
    }
    return { type: "FeatureCollection" as const, features };
  }, [summaries]);

  /* ── Map init — recreates when theme changes ──────────────────── */
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;   // guards async load callback after cleanup

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "tiles-dark":  { type: "raster", tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],  tileSize: 256 },
          "tiles-light": { type: "raster", tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"], tileSize: 256 },
        },
        layers: [
          { id: "layer-dark",  type: "raster", source: "tiles-dark",
            layout: { visibility: theme === "dark"  ? "visible" : "none" } },
          { id: "layer-light", type: "raster", source: "tiles-light",
            layout: { visibility: theme === "light" ? "visible" : "none" } },
        ],
      },
      center: [focusLng, focusLat],
      zoom: 14,
      scrollZoom: false, doubleClickZoom: false, attributionControl: false,
    });
    map.dragRotate.disable();
    map.keyboard.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      if (destroyed) return;   // component unmounted before tiles loaded
      loadedRef.current = true;
      const heatPaint = buildMiniHeatPaintExpressions(settings);
      const streetStyle = buildStreetLayerStyle(settings);

      // Border
      map.addSource("border-src", { type: "geojson", data: COMPTON_BORDER_GEOJSON });
      map.addLayer({ id: "border-glow", type: "line", source: "border-src", paint: {
        "line-color": theme === "dark" ? "rgba(34,211,238,0.25)" : "rgba(100,100,100,0.18)",
        "line-width": 6, "line-blur": 5,
      }});
      map.addLayer({ id: "border-line", type: "line", source: "border-src", paint: {
        "line-color": theme === "dark" ? "rgba(34,211,238,0.75)" : "rgba(80,80,80,0.55)",
        "line-width": 1.2, "line-dasharray": [4, 3],
      }});

      // Heatmap
      map.addSource("heat-src", { type: "geojson", data: heatData });
      map.addLayer({ id: "heat-layer", type: "heatmap", source: "heat-src", paint: {
        "heatmap-weight":    ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
        "heatmap-intensity": heatPaint.intensity,
        "heatmap-color":     buildColorExpr(settings.colorScheme),
        "heatmap-radius":    heatPaint.radius,
        "heatmap-opacity":   heatPaint.opacity,
      }});

      // Streets — shared crisp stack
      map.addSource("streets-src", { type: "geojson", data: streetsData });
      map.addLayer({ id: "streets-glow", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetGlowColor(settings.colorScheme),
          "line-width":   streetStyle.glow.width,
          "line-blur":    streetStyle.glow.blur,
          "line-opacity": streetStyle.glow.opacity,
        },
      });
      map.addLayer({ id: "streets-body", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetGlowColor(settings.colorScheme),
          "line-width":   streetStyle.body.width,
          "line-blur":    streetStyle.body.blur,
          "line-opacity": streetStyle.body.opacity,
        },
      });
      map.addLayer({ id: "streets-core", type: "line", source: "streets-src",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color":   buildStreetCoreColor(settings.colorScheme),
          "line-width":   streetStyle.core.width,
          "line-opacity": streetStyle.core.opacity,
        },
      });

      // Focus marker
      const el = document.createElement("div");
      markerElRef.current = el;
      el.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:${theme === "dark" ? "#f59e0b" : "#d97706"};
        border:2.5px solid white;
        box-shadow:0 0 0 4px ${theme === "dark" ? "rgba(245,158,11,0.35)" : "rgba(217,119,6,0.28)"};
        pointer-events:none;
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([focusLng, focusLat])
        .addTo(map);
    });

    map.on("click", (e) => {
      onTeleport(parseFloat(e.lngLat.lat.toFixed(6)), parseFloat(e.lngLat.lng.toFixed(6)));
    });

    mapRef.current = map;
    return () => {
      destroyed = true;
      loadedRef.current = false;
      mapRef.current = null;
      try { map.stop();   } catch { /* ignore */ }
      try { map.remove(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  /* ── Sync marker position ─────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      map.easeTo({ center: [focusLng, focusLat], duration: 300 });
      markerRef.current?.setLngLat([focusLng, focusLat]);
    } catch { /* map may be transitioning */ }
  }, [focusLat, focusLng]);

  /* ── Sync theme paint properties ─────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      map.setLayoutProperty("layer-dark",  "visibility", theme === "dark"  ? "visible" : "none");
      map.setLayoutProperty("layer-light", "visibility", theme === "light" ? "visible" : "none");
      map.setPaintProperty("border-glow", "line-color",
        theme === "dark" ? "rgba(34,211,238,0.25)" : "rgba(100,100,100,0.18)");
      map.setPaintProperty("border-line", "line-color",
        theme === "dark" ? "rgba(34,211,238,0.75)" : "rgba(80,80,80,0.55)");
      if (markerElRef.current) {
        markerElRef.current.style.background  = theme === "dark" ? "#f59e0b" : "#d97706";
        markerElRef.current.style.boxShadow   =
          `0 0 0 4px ${theme === "dark" ? "rgba(245,158,11,0.35)" : "rgba(217,119,6,0.28)"}`;
      }
    } catch { /* ignore */ }
  }, [theme]);

  /* ── Sync data sources ────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    try {
      (map.getSource("heat-src")    as maplibregl.GeoJSONSource | undefined)?.setData(heatData);
      (map.getSource("streets-src") as maplibregl.GeoJSONSource | undefined)?.setData(streetsData);
    } catch { /* ignore */ }
  }, [heatData, streetsData]);

  /* ── Sync settings ────────────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const heatPaint = buildMiniHeatPaintExpressions(settings);
    const streetStyle = buildStreetLayerStyle(settings);
    try {
      map.setPaintProperty("heat-layer", "heatmap-intensity", heatPaint.intensity);
      map.setPaintProperty("heat-layer", "heatmap-color",     buildColorExpr(settings.colorScheme));
      map.setPaintProperty("heat-layer", "heatmap-radius",    heatPaint.radius);
      map.setPaintProperty("heat-layer", "heatmap-opacity",   heatPaint.opacity);
      map.setPaintProperty("streets-glow", "line-color",      buildStreetGlowColor(settings.colorScheme));
      map.setPaintProperty("streets-glow", "line-width",      streetStyle.glow.width);
      map.setPaintProperty("streets-glow", "line-blur",       streetStyle.glow.blur);
      map.setPaintProperty("streets-glow", "line-opacity",    streetStyle.glow.opacity);
      map.setPaintProperty("streets-body", "line-color",      buildStreetGlowColor(settings.colorScheme));
      map.setPaintProperty("streets-body", "line-width",      streetStyle.body.width);
      map.setPaintProperty("streets-body", "line-blur",       streetStyle.body.blur);
      map.setPaintProperty("streets-body", "line-opacity",    streetStyle.body.opacity);
      map.setPaintProperty("streets-core", "line-color",      buildStreetCoreColor(settings.colorScheme));
      map.setPaintProperty("streets-core", "line-width",      streetStyle.core.width);
      map.setPaintProperty("streets-core", "line-opacity",    streetStyle.core.opacity);
    } catch { /* ignore */ }
  }, [settings]);

  const borderCls = isDark ? "border-zinc-700 shadow-black/50" : "border-zinc-300 shadow-black/15";
  const btnCls = isDark
    ? "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
    : "bg-white border border-zinc-300 text-zinc-500 hover:text-zinc-700";

  return (
    <div className="absolute bottom-24 right-6 z-20" style={{ width: 236, height: 158 }}>
      <div
        ref={containerRef}
        className={`w-full h-full rounded-2xl overflow-hidden border shadow-2xl cursor-crosshair ${borderCls}`}
      />

      {/* Zoom buttons — left side */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        <button onClick={(e) => { e.stopPropagation(); mapRef.current?.zoomIn(); }}
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${btnCls}`}
          title="Zoom in">+</button>
        <button onClick={(e) => { e.stopPropagation(); mapRef.current?.zoomOut(); }}
          className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${btnCls}`}
          title="Zoom out">−</button>
      </div>

      {/* Expand button — top-right */}
      <button onClick={(e) => { e.stopPropagation(); onExpand(); }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${btnCls}`}
        title="Back to full map">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
        </svg>
      </button>

      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center pointer-events-none">
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
          isDark ? "bg-zinc-900 text-zinc-600" : "bg-white/90 text-zinc-400"
        }`}>tap to teleport</span>
      </div>
    </div>
  );
}
