"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Location, HeatmapSettings, COLOR_SCHEMES } from "@/lib/types";

interface HeatmapMapProps {
  locations: Location[];
  settings: HeatmapSettings;
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
): maplibregl.GeoJSONSourceSpecification["data"] {
  return {
    type: "FeatureCollection",
    features: locations.map((loc) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
      properties: { weight: loc.weight, label: loc.label },
    })),
  };
}

export default function HeatmapMap({
  locations,
  settings,
  onMapClick,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const isLoadedRef = useRef(false);
  const locationsRef = useRef(locations);
  const settingsRef = useRef(settings);

  locationsRef.current = locations;
  settingsRef.current = settings;

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
        "interpolate",
        ["linear"],
        ["zoom"],
        0, 2,
        13, s.radius * 0.6,
        16, s.radius * 1.4,
      ]);
      map.setPaintProperty("heatmap-layer", "heatmap-intensity", [
        "interpolate",
        ["linear"],
        ["zoom"],
        0, 0.5,
        13, s.intensity,
        16, s.intensity * 1.5,
      ]);
    },
    []
  );

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            ],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [-118.2201, 33.8958],
      zoom: 12.5,
      minZoom: 10,
      maxZoom: 18,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right"
    );

    map.on("load", () => {
      isLoadedRef.current = true;

      map.addSource("locations-source", {
        type: "geojson",
        data: locationsToGeoJSON(locationsRef.current),
      });

      const s = settingsRef.current;

      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "locations-source",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0, 0,
            1, 1,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 0.5,
            13, s.intensity,
            16, s.intensity * 1.5,
          ],
          "heatmap-color": buildHeatmapColorExpr(s.colorScheme),
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 2,
            13, s.radius * 0.6,
            16, s.radius * 1.4,
          ],
          "heatmap-opacity": s.opacity,
        },
      });

      // Individual dot layer at high zoom
      map.addLayer({
        id: "dot-layer",
        type: "circle",
        source: "locations-source",
        minzoom: 14,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 3,
            18, 12,
          ],
          "circle-color": "#fff",
          "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 0,
            15.5, 0.85,
          ],
          "circle-stroke-color": "#06b6d4",
          "circle-stroke-width": 1.5,
        },
      });

      // Tooltip on hover
      const tooltip = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "heatmap-tooltip",
      });

      map.on("mouseenter", "dot-layer", (e) => {
        map.getCanvas().style.cursor = "pointer";
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          const coords = (
            e.features[0].geometry as GeoJSON.Point
          ).coordinates;
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
    });

    // Click handler
    map.on("click", (e) => {
      if (onMapClick) {
        onMapClick(
          parseFloat(e.lngLat.lat.toFixed(6)),
          parseFloat(e.lngLat.lng.toFixed(6))
        );
      }
    });

    mapRef.current = map;

    return () => {
      isLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync locations
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    const source = map.getSource(
      "locations-source"
    ) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(locationsToGeoJSON(locations) as GeoJSON.FeatureCollection);
    }
  }, [locations]);

  // Sync settings
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoadedRef.current) return;
    applyHeatmapPaint(map, settings);
  }, [settings, applyHeatmapPaint]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
