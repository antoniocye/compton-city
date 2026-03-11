"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Location, HeatmapSettings, Theme, COLOR_SCHEMES } from "@/lib/types";
import { COMPTON_BORDER_GEOJSON } from "@/lib/comptonBoundary";

interface MiniMapProps {
  locations: Location[];
  settings: HeatmapSettings;
  theme: Theme;
  focusLat: number;
  focusLng: number;
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
  locations, settings, theme, focusLat, focusLng, onExpand,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markerRef    = useRef<maplibregl.Marker | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "tiles-dark": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
          },
          "tiles-light": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
          },
        },
        layers: [
          { id: "layer-dark",  type: "raster", source: "tiles-dark",  layout: { visibility: theme === "dark"  ? "visible" : "none" } },
          { id: "layer-light", type: "raster", source: "tiles-light", layout: { visibility: theme === "light" ? "visible" : "none" } },
        ],
      },
      center:      [focusLng, focusLat],
      zoom:        14,
      interactive: false,
      attributionControl: false,
    });

    map.on("load", () => {
      // Compton border
      map.addSource("border-src", { type: "geojson", data: COMPTON_BORDER_GEOJSON });
      map.addLayer({
        id: "border-glow", type: "line", source: "border-src",
        paint: { "line-color": isDark ? "rgba(34,211,238,0.3)" : "rgba(2,132,199,0.2)", "line-width": 6, "line-blur": 5 },
      });
      map.addLayer({
        id: "border-line", type: "line", source: "border-src",
        paint: { "line-color": isDark ? "rgba(34,211,238,0.8)" : "rgba(2,100,180,0.75)", "line-width": 1.2, "line-dasharray": [4, 3] },
      });

      // Heatmap
      map.addSource("heat-src", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: locations.map(l => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [l.lng, l.lat] },
            properties: { weight: l.weight },
          })),
        },
      });
      map.addLayer({
        id: "heat-layer", type: "heatmap", source: "heat-src",
        paint: {
          "heatmap-weight":     ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
          "heatmap-intensity":  settings.intensity * 0.8,
          "heatmap-color":      buildColorExpr(settings.colorScheme),
          "heatmap-radius":     settings.radius * 0.5,
          "heatmap-opacity":    settings.opacity * 0.9,
        },
      });

      // Focus marker (pulsing dot)
      const el = document.createElement("div");
      el.className = "mini-map-marker";
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${isDark ? "#22d3ee" : "#0284c7"};
        border: 2.5px solid white;
        box-shadow: 0 0 0 4px ${isDark ? "rgba(34,211,238,0.3)" : "rgba(2,132,199,0.25)"};
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([focusLng, focusLat])
        .addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker + center in sync
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([focusLng, focusLat]);
    markerRef.current?.setLngLat([focusLng, focusLat]);
  }, [focusLat, focusLng]);

  return (
    <div
      className="absolute bottom-6 right-6 z-20 group cursor-pointer"
      style={{ width: 230, height: 155 }}
      onClick={onExpand}
    >
      {/* Map canvas */}
      <div
        ref={containerRef}
        className={`w-full h-full rounded-2xl overflow-hidden border shadow-2xl transition-transform duration-200 group-hover:scale-[1.03] ${
          isDark
            ? "border-white/15 shadow-black/60"
            : "border-slate-300/60 shadow-black/20"
        }`}
      />

      {/* Hover overlay: back-to-map label */}
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 group-hover:bg-black/35 transition-all duration-200 pointer-events-none">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-white text-xs font-semibold bg-black/55 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to map
        </span>
      </div>

      {/* Corner label */}
      <div className="absolute top-2 left-2 pointer-events-none">
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
          isDark ? "bg-black/55 text-cyan-400/80" : "bg-white/70 text-sky-600/80"
        }`}>
          Heatmap
        </span>
      </div>
    </div>
  );
}
