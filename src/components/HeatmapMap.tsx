"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Location, HeatmapSettings, COLOR_SCHEMES, Theme } from "@/lib/types";
import {
  COMPTON_MASK_GEOJSON,
  COMPTON_BORDER_GEOJSON,
  COMPTON_BOUNDS,
} from "@/lib/comptonBoundary";

interface HeatmapMapProps {
  locations: Location[];
  settings: HeatmapSettings;
  theme: Theme;
  onMapClick?: (lat: number, lng: number) => void;
}

function buildHeatmapColorExpr(
  scheme: HeatmapSettings["colorScheme"]
): maplibregl.ExpressionSpecification {
  const stops = COLOR_SCHEMES[scheme];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["heatmap-density"]];
  for (const [stop, color] of stops) {
    expr.push(stop, color);
  }
  return expr as maplibregl.ExpressionSpecification;
}

function locationsToGeoJSON(
  locations: Location[]
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: locations.map((loc) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
      properties: { weight: loc.weight, label: loc.label },
    })),
  };
}

const MASK_COLORS: Record<Theme, string> = {
  dark: "rgba(4, 4, 14, 1)",
  light: "rgba(210, 218, 228, 1)",
};
const MASK_OPACITY: Record<Theme, number> = {
  dark: 0.62,
  light: 0.6,
};
const BORDER_COLORS: Record<Theme, { glow: string; line: string }> = {
  dark: { glow: "rgba(6, 182, 212, 0.35)", line: "rgba(6, 182, 212, 0.9)" },
  light: { glow: "rgba(2, 132, 199, 0.25)", line: "rgba(2, 100, 180, 0.85)" },
};

export default function HeatmapMap({
  locations,
  settings,
  theme,
  onMapClick,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef(false);

  // Always-fresh refs for closure safety
  const locationsRef = useRef(locations);
  const settingsRef = useRef(settings);
  const themeRef = useRef(theme);
  locationsRef.current = locations;
  settingsRef.current = settings;
  themeRef.current = theme;

  const applyHeatmapPaint = useCallback(
    (map: maplibregl.Map, s: HeatmapSettings) => {
      if (!map.getLayer("heatmap-layer")) return;
      map.setPaintProperty(
        "heatmap-layer",
        "heatmap-color",
        buildHeatmapColorExpr(s.colorScheme)
      );
      map.setPaintProperty("heatmap-layer", "heatmap-opacity", s.opacity);
      map.setPaintProperty("heatmap-layer", "heatmap-radius", [
        "interpolate", ["linear"], ["zoom"],
        0, 2, 13, s.radius * 0.6, 16, s.radius * 1.4,
      ]);
      map.setPaintProperty("heatmap-layer", "heatmap-intensity", [
        "interpolate", ["linear"], ["zoom"],
        0, 0.5, 13, s.intensity, 16, s.intensity * 1.5,
      ]);
    },
    []
  );

  // Initialise map once
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
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
          "tiles-light": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: "layer-tiles-dark",
            type: "raster",
            source: "tiles-dark",
            layout: { visibility: t === "dark" ? "visible" : "none" },
          },
          {
            id: "layer-tiles-light",
            type: "raster",
            source: "tiles-light",
            layout: { visibility: t === "light" ? "visible" : "none" },
          },
        ],
      },
      center: [-118.2201, 33.8958],
      zoom: 13,
      minZoom: 9,
      maxZoom: 18,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right"
    );

    map.on("load", () => {
      isLoadedRef.current = true;
      const currentTheme = themeRef.current;
      const s = settingsRef.current;

      // ── Compton mask (world minus Compton) ──────────────────────────────
      map.addSource("compton-mask-source", {
        type: "geojson",
        data: COMPTON_MASK_GEOJSON,
      });
      map.addLayer({
        id: "compton-mask",
        type: "fill",
        source: "compton-mask-source",
        paint: {
          "fill-color": MASK_COLORS[currentTheme],
          "fill-opacity": MASK_OPACITY[currentTheme],
        },
      });

      // ── Compton border glow ────────────────────────────────────────────
      map.addSource("compton-border-source", {
        type: "geojson",
        data: COMPTON_BORDER_GEOJSON,
      });
      map.addLayer({
        id: "compton-border-glow",
        type: "line",
        source: "compton-border-source",
        paint: {
          "line-color": BORDER_COLORS[currentTheme].glow,
          "line-width": 8,
          "line-blur": 6,
        },
      });
      map.addLayer({
        id: "compton-border-line",
        type: "line",
        source: "compton-border-source",
        paint: {
          "line-color": BORDER_COLORS[currentTheme].line,
          "line-width": 1.5,
          "line-dasharray": [5, 3],
        },
      });

      // ── Heatmap source ─────────────────────────────────────────────────
      map.addSource("locations-source", {
        type: "geojson",
        data: locationsToGeoJSON(locationsRef.current),
      });

      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "locations-source",
        paint: {
          "heatmap-weight": [
            "interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1,
          ],
          "heatmap-intensity": [
            "interpolate", ["linear"], ["zoom"],
            0, 0.5, 13, s.intensity, 16, s.intensity * 1.5,
          ],
          "heatmap-color": buildHeatmapColorExpr(s.colorScheme),
          "heatmap-radius": [
            "interpolate", ["linear"], ["zoom"],
            0, 2, 13, s.radius * 0.6, 16, s.radius * 1.4,
          ],
          "heatmap-opacity": s.opacity,
        },
      });

      // ── Dot layer at high zoom ─────────────────────────────────────────
      map.addLayer({
        id: "dot-layer",
        type: "circle",
        source: "locations-source",
        minzoom: 14,
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"], 14, 3, 18, 12,
          ],
          "circle-color": "#ffffff",
          "circle-opacity": [
            "interpolate", ["linear"], ["zoom"], 14, 0, 15.5, 0.85,
          ],
          "circle-stroke-color": "#06b6d4",
          "circle-stroke-width": 1.5,
        },
      });

      // ── Tooltip ────────────────────────────────────────────────────────
      const tooltip = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "heatmap-tooltip",
      });

      map.on("mouseenter", "dot-layer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features?.[0]) {
          const props = e.features[0].properties;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
          tooltip
            .setLngLat([coords[0], coords[1]])
            .setHTML(
              `<div class="tooltip-content"><strong>${props.label || "Location"}</strong><span>${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}</span></div>`
            )
            .addTo(map);
        }
      });
      map.on("mouseleave", "dot-layer", () => {
        map.getCanvas().style.cursor = "";
        tooltip.remove();
      });

      // ── Fit to Compton on first load ───────────────────────────────────
      map.fitBounds(COMPTON_BOUNDS, { padding: 10, duration: 900 });
    });

    // Click to add location
    map.on("click", (e) => {
      onMapClick?.(
        parseFloat(e.lngLat.lat.toFixed(6)),
        parseFloat(e.lngLat.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    return () => {
      isLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync locations ──────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    (map.getSource("locations-source") as maplibregl.GeoJSONSource)?.setData(
      locationsToGeoJSON(locations)
    );
  }, [locations]);

  // ── Sync heatmap settings ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    applyHeatmapPaint(map, settings);
  }, [settings, applyHeatmapPaint]);

  // ── Sync theme ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;

    // Toggle tile layers
    map.setLayoutProperty(
      "layer-tiles-dark",
      "visibility",
      theme === "dark" ? "visible" : "none"
    );
    map.setLayoutProperty(
      "layer-tiles-light",
      "visibility",
      theme === "light" ? "visible" : "none"
    );

    // Update mask
    map.setPaintProperty("compton-mask", "fill-color", MASK_COLORS[theme]);
    map.setPaintProperty("compton-mask", "fill-opacity", MASK_OPACITY[theme]);

    // Update border
    map.setPaintProperty(
      "compton-border-glow",
      "line-color",
      BORDER_COLORS[theme].glow
    );
    map.setPaintProperty(
      "compton-border-line",
      "line-color",
      BORDER_COLORS[theme].line
    );
  }, [theme]);

  return <div ref={containerRef} className="w-full h-full" />;
}
