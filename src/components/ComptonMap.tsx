import { useEffect, useMemo, useRef } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import type { Hotspot, ViewMode } from '../lib/coordinates';
import { COMPTON_CENTER } from '../lib/coordinates';

type HotspotFeatureProperties = {
  id: string;
  weight: number;
  entries: number;
  share: number;
  rank: number;
  isTop: boolean;
};

type Props = {
  hotspots: Hotspot[];
  radius: number;
  viewMode: ViewMode;
};

const SOURCE_ID = 'compton-hotspots';
const HEAT_LAYER_ID = 'compton-heat';
const CIRCLE_LAYER_ID = 'compton-circles';
const GLOW_LAYER_ID = 'compton-glow';
const TOP_LAYER_ID = 'compton-top';

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; OpenStreetMap contributors &copy; CARTO',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
    },
  ],
};

function buildFeatureCollection(
  hotspots: Hotspot[],
): FeatureCollection<Point, HotspotFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: hotspots.map((hotspot, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hotspot.lng, hotspot.lat],
      },
      properties: {
        id: hotspot.id,
        weight: hotspot.weight,
        entries: hotspot.entries,
        share: hotspot.share,
        rank: index + 1,
        isTop: index === 0,
      },
    })),
  };
}

function setLayerVisibility(map: maplibregl.Map, viewMode: ViewMode) {
  const heatVisibility = viewMode === 'circles' ? 'none' : 'visible';
  const circleVisibility = viewMode === 'heat' ? 'none' : 'visible';

  for (const layerId of [HEAT_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', heatVisibility);
    }
  }

  for (const layerId of [GLOW_LAYER_ID, CIRCLE_LAYER_ID, TOP_LAYER_ID]) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', circleVisibility);
    }
  }
}

function updateLayerStyles(map: maplibregl.Map, radius: number) {
  if (map.getLayer(HEAT_LAYER_ID)) {
    map.setPaintProperty(HEAT_LAYER_ID, 'heatmap-radius', [
      'interpolate',
      ['linear'],
      ['zoom'],
      8,
      radius * 0.65,
      12,
      radius,
      15,
      radius * 1.45,
    ]);
  }

  if (map.getLayer(CIRCLE_LAYER_ID)) {
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'weight'],
      1,
      6,
      3,
      11,
      6,
      15,
      10,
      20,
      16,
    ]);
  }

  if (map.getLayer(GLOW_LAYER_ID)) {
    map.setPaintProperty(GLOW_LAYER_ID, 'circle-radius', [
      'interpolate',
      ['linear'],
      ['get', 'weight'],
      1,
      radius * 0.85,
      10,
      radius * 1.8,
    ]);
  }

  if (map.getLayer(TOP_LAYER_ID)) {
    map.setPaintProperty(TOP_LAYER_ID, 'circle-radius', radius * 0.55);
  }
}

export function ComptonMap({ hotspots, radius, viewMode }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const data = useMemo(() => buildFeatureCollection(hotspots), [hotspots]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [COMPTON_CENTER.lng, COMPTON_CENTER.lat],
      zoom: 12.7,
      pitch: 32,
      bearing: -16,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: buildFeatureCollection([]),
      });

      map.addLayer({
        id: HEAT_LAYER_ID,
        type: 'heatmap',
        source: SOURCE_ID,
        maxzoom: 16,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            1,
            0.3,
            4,
            0.65,
            10,
            1,
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            9,
            0.7,
            14,
            1.5,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(14, 165, 233, 0)',
            0.2,
            'rgba(56, 189, 248, 0.45)',
            0.45,
            'rgba(45, 212, 191, 0.65)',
            0.7,
            'rgba(250, 204, 21, 0.8)',
            1,
            'rgba(248, 113, 113, 0.95)',
          ],
          'heatmap-opacity': 0.85,
          'heatmap-radius': radius,
        },
      });

      map.addLayer({
        id: GLOW_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': 'rgba(250, 204, 21, 0.22)',
          'circle-blur': 1,
          'circle-radius': radius * 1.1,
        },
      });

      map.addLayer({
        id: CIRCLE_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            1,
            '#38bdf8',
            3,
            '#2dd4bf',
            6,
            '#facc15',
            10,
            '#fb7185',
          ],
          'circle-radius': 12,
          'circle-opacity': 0.92,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.75)',
        },
      });

      map.addLayer({
        id: TOP_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'isTop'], true],
        paint: {
          'circle-color': 'rgba(255, 255, 255, 0)',
          'circle-stroke-color': '#fde68a',
          'circle-stroke-width': 2,
          'circle-radius': radius * 0.55,
        },
      });

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 18,
      });

      map.on('mouseenter', CIRCLE_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', CIRCLE_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
      });

      map.on('mousemove', CIRCLE_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        const coordinates = (feature?.geometry as Point | undefined)?.coordinates;
        const weight = feature?.properties?.weight;
        const share = feature?.properties?.share;

        if (!coordinates || typeof weight !== 'number' || typeof share !== 'number') {
          return;
        }

        popupRef.current
          ?.setLngLat([coordinates[0], coordinates[1]])
          .setHTML(
            `<div class="pulse-popup">
              <strong>Hotspot intensity ${weight}</strong>
              <span>${(share * 100).toFixed(1)}% of all points</span>
            </div>`,
          )
          .addTo(map);
      });

      setLayerVisibility(map, viewMode);
      updateLayerStyles(map, radius);

      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      source?.setData(data);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [data, radius, viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(SOURCE_ID)) {
      return;
    }

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource;
    source.setData(data);
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!map.isStyleLoaded()) {
      map.once('idle', () => setLayerVisibility(map, viewMode));
      return;
    }

    setLayerVisibility(map, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (!map.isStyleLoaded()) {
      map.once('idle', () => updateLayerStyles(map, radius));
      return;
    }

    updateLayerStyles(map, radius);
  }, [radius]);

  return <div ref={mapContainerRef} className="map-canvas" />;
}
