"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import {
  HeatmapSettings,
  Theme,
  COLOR_SCHEMES,
  LocationSummary,
} from "@/lib/types";
import { COMPTON_BORDER_GEOJSON } from "@/lib/comptonBoundary";

interface MiniMapProps {
  summaries: LocationSummary[];
  settings: HeatmapSettings;
  theme: Theme;
  focusLat: number;
  focusLng: number;
  /** Click on the map → jump street view to that spot */
  onTeleport: (lat: number, lng: number) => void;
  /** Expand icon → exit street view, go back to full map */
  onExpand: () => void;
}

function buildColorExpr(scheme: HeatmapSettings["colorScheme"]) {
  const stops = COLOR_SCHEMES[scheme];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
  for (const [s, c] of stops) expr.push(s, c);
  return expr as maplibregl.ExpressionSpecification;
}

export default function MiniMap({
  summaries, settings, theme,
  focusLat, focusLng,
  onTeleport, onExpand,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markerRef    = useRef<maplibregl.Marker | null>(null);
  const markerElRef  = useRef<HTMLDivElement | null>(null);
  const isDark = theme === "dark";

  const heatData = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: summaries.map((summary) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [summary.location.lng, summary.location.lat] as [number, number],
      },
      properties: { weight: summary.normalizedWeight },
    })),
  }), [summaries]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "tiles-dark":  { type: "raster", tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],  tileSize: 256 },
          "tiles-light": { type: "raster", tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"], tileSize: 256 },
        },
        layers: [
          { id: "layer-dark",  type: "raster", source: "tiles-dark",  layout: { visibility: theme === "dark"  ? "visible" : "none" } },
          { id: "layer-light", type: "raster", source: "tiles-light", layout: { visibility: theme === "light" ? "visible" : "none" } },
        ],
      },
      center: [focusLng, focusLat],
      zoom: 14,
      // Allow click + drag, but no scroll-zoom (too jarring in a tiny box)
      scrollZoom:    false,
      doubleClickZoom: false,
      attributionControl: false,
    });
    map.dragRotate.disable();
    map.keyboard.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      // Compton border
      map.addSource("border-src", { type: "geojson", data: COMPTON_BORDER_GEOJSON });
      map.addLayer({ id: "border-glow", type: "line", source: "border-src", paint: {
        "line-color": theme === "dark" ? "rgba(34,211,238,0.3)" : "rgba(2,132,199,0.2)",
        "line-width": 6, "line-blur": 5,
      }});
      map.addLayer({ id: "border-line", type: "line", source: "border-src", paint: {
        "line-color": theme === "dark" ? "rgba(34,211,238,0.8)" : "rgba(2,100,180,0.75)",
        "line-width": 1.2, "line-dasharray": [4, 3],
      }});

      // Heatmap
      map.addSource("heat-src", {
        type: "geojson",
        data: heatData,
      });
      map.addLayer({ id: "heat-layer", type: "heatmap", source: "heat-src", paint: {
        "heatmap-weight":    ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
        "heatmap-intensity": settings.intensity * 0.8,
        "heatmap-color":     buildColorExpr(settings.colorScheme),
        "heatmap-radius":    settings.radius * 0.5,
        "heatmap-opacity":   settings.opacity * 0.9,
      }});

      // Focus marker
      const markerEl = document.createElement("div");
      markerElRef.current = markerEl;
      markerEl.style.cssText = `
        width:14px;height:14px;border-radius:50%;
        background:${theme === "dark" ? "#22d3ee" : "#0284c7"};
        border:2.5px solid white;
        box-shadow:0 0 0 4px ${theme === "dark" ? "rgba(34,211,238,0.35)" : "rgba(2,132,199,0.28)"};
        pointer-events:none;
      `;
      markerRef.current = new maplibregl.Marker({ element: markerEl })
        .setLngLat([focusLng, focusLat])
        .addTo(map);
    });

    // ── Click-to-teleport ──────────────────────────────────────────
    map.on("click", (e) => {
      onTeleport(
        parseFloat(e.lngLat.lat.toFixed(6)),
        parseFloat(e.lngLat.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    return () => {
      mapRef.current = null;                       // null first so sync effect bails
      try { map.stop(); } catch { /* ignore */ }   // cancel any in-flight easeTo
      try { map.remove(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Keep marker + centre in sync with focus location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.easeTo({ center: [focusLng, focusLat], duration: 300 });
      markerRef.current?.setLngLat([focusLng, focusLat]);
    } catch { /* map may have been removed */ }
  }, [focusLat, focusLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setLayoutProperty("layer-dark", "visibility", theme === "dark" ? "visible" : "none");
      map.setLayoutProperty("layer-light", "visibility", theme === "light" ? "visible" : "none");
      map.setPaintProperty(
        "border-glow",
        "line-color",
        theme === "dark" ? "rgba(34,211,238,0.3)" : "rgba(2,132,199,0.2)"
      );
      map.setPaintProperty(
        "border-line",
        "line-color",
        theme === "dark" ? "rgba(34,211,238,0.8)" : "rgba(2,100,180,0.75)"
      );
      markerElRef.current?.style.setProperty(
        "background",
        theme === "dark" ? "#22d3ee" : "#0284c7"
      );
      markerElRef.current?.style.setProperty(
        "box-shadow",
        `0 0 0 4px ${
          theme === "dark" ? "rgba(34,211,238,0.35)" : "rgba(2,132,199,0.28)"
        }`
      );
    } catch { /* map may have been removed */ }
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      (map.getSource("heat-src") as maplibregl.GeoJSONSource | undefined)?.setData(heatData);
    } catch { /* map may have been removed */ }
  }, [heatData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setPaintProperty("heat-layer", "heatmap-intensity", settings.intensity * 0.8);
      map.setPaintProperty("heat-layer", "heatmap-color", buildColorExpr(settings.colorScheme));
      map.setPaintProperty("heat-layer", "heatmap-radius", settings.radius * 0.5);
      map.setPaintProperty("heat-layer", "heatmap-opacity", settings.opacity * 0.9);
    } catch { /* map may have been removed */ }
  }, [settings]);

  const borderCls = isDark ? "border-white/15 shadow-black/60" : "border-slate-300/60 shadow-black/20";

  return (
    <div
      className="absolute bottom-6 right-6 z-20"
      style={{ width: 236, height: 158 }}
    >
      {/* Map canvas — cursor crosshair signals "click to teleport" */}
      <div
        ref={containerRef}
        className={`w-full h-full rounded-2xl overflow-hidden border shadow-2xl cursor-crosshair ${borderCls}`}
      />

      {/* Expand / fullscreen button — top-right */}
      <button
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 ${
          isDark
            ? "bg-black/55 border border-white/10 text-white/60 hover:text-white hover:bg-black/75"
            : "bg-white/80 border border-black/8 text-slate-500 hover:text-slate-800 hover:bg-white"
        }`}
        title="Back to full map"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2" />
        </svg>
      </button>

      {/* Teleport hint — bottom, always visible */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
        <span className={`text-[9px] px-2 py-0.5 rounded-md ${
          isDark ? "bg-black/50 text-white/35" : "bg-white/70 text-slate-400"
        }`}>
          Click to teleport
        </span>
      </div>
    </div>
  );
}
