import type { ExpressionSpecification } from "maplibre-gl";
import { HeatmapSettings } from "@/lib/types";

export const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  radius: 24,
  intensity: 1.2,
  opacity: 0.72,
  colorScheme: "fire",
};

type ZoomMultiplierStop = readonly [zoom: number, multiplier: number];
type ZoomValueStop = readonly [zoom: number, value: number];

const HEAT_RADIUS_ZOOM_MULTIPLIERS: readonly ZoomMultiplierStop[] = [
  [9, 1.15],
  [13, 0.95],
  [17, 0.9],
];
const HEAT_INTENSITY_ZOOM_MULTIPLIERS: readonly ZoomMultiplierStop[] = [
  [9, 0.95],
  [13, 1.15],
  [17, 1.0],
];
const HEAT_OPACITY_ZOOM_MULTIPLIERS: readonly ZoomMultiplierStop[] = [
  [9, 0.4],
  [12, 0.48],
  [14, 0.45],
  [17, 0.32],
];

const STREET_GLOW_WIDTHS: readonly ZoomValueStop[] = [
  [10, 6],
  [13, 11],
  [16, 16],
];
const STREET_BODY_WIDTHS: readonly ZoomValueStop[] = [
  [10, 3.5],
  [13, 6],
  [16, 9],
];
const STREET_CORE_WIDTHS: readonly ZoomValueStop[] = [
  [10, 1.6],
  [13, 2.6],
  [16, 4],
];

interface SurfaceScale {
  radius: number;
  intensity: number;
  opacity: number;
}

const MAIN_SCALE: SurfaceScale = {
  radius: 1,
  intensity: 1,
  opacity: 1,
};

const MINI_SCALE: SurfaceScale = {
  radius: 0.95,
  intensity: 1.1,
  opacity: 0.55,
};

function buildZoomScaledExpr(
  base: number,
  stops: readonly ZoomMultiplierStop[]
): ExpressionSpecification {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["zoom"]];
  for (const [zoom, multiplier] of stops) expr.push(zoom, base * multiplier);
  return expr as ExpressionSpecification;
}

function buildZoomValueExpr(
  stops: readonly ZoomValueStop[]
): ExpressionSpecification {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expr: any[] = ["interpolate", ["linear"], ["zoom"]];
  for (const [zoom, value] of stops) expr.push(zoom, value);
  return expr as ExpressionSpecification;
}

function buildWeightOpacityExpr(
  baseOpacity: number,
  minMultiplier: number,
  maxMultiplier: number
): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["get", "weight"],
    0,
    baseOpacity * minMultiplier,
    1,
    baseOpacity * maxMultiplier,
  ] as ExpressionSpecification;
}

export interface HeatPaintExpressions {
  radius: ExpressionSpecification;
  intensity: ExpressionSpecification;
  opacity: ExpressionSpecification;
}

export interface StreetLayerStyle {
  glow: {
    width: ExpressionSpecification;
    blur: number;
    opacity: ExpressionSpecification;
  };
  body: {
    width: ExpressionSpecification;
    blur: number;
    opacity: ExpressionSpecification;
  };
  core: {
    width: ExpressionSpecification;
    opacity: ExpressionSpecification;
  };
}

function buildHeatPaintExpressions(
  settings: HeatmapSettings,
  scale: SurfaceScale
): HeatPaintExpressions {
  return {
    radius: buildZoomScaledExpr(settings.radius * scale.radius, HEAT_RADIUS_ZOOM_MULTIPLIERS),
    intensity: buildZoomScaledExpr(settings.intensity * scale.intensity, HEAT_INTENSITY_ZOOM_MULTIPLIERS),
    opacity: buildZoomScaledExpr(settings.opacity * scale.opacity, HEAT_OPACITY_ZOOM_MULTIPLIERS),
  };
}

export function buildMainHeatPaintExpressions(settings: HeatmapSettings): HeatPaintExpressions {
  return buildHeatPaintExpressions(settings, MAIN_SCALE);
}

export function buildMiniHeatPaintExpressions(settings: HeatmapSettings): HeatPaintExpressions {
  return buildHeatPaintExpressions(settings, MINI_SCALE);
}

export function buildStreetLayerStyle(settings: HeatmapSettings): StreetLayerStyle {
  return {
    glow: {
      width: buildZoomValueExpr(STREET_GLOW_WIDTHS),
      blur: 5,
      opacity: buildWeightOpacityExpr(settings.opacity, 0.12, 0.3),
    },
    body: {
      width: buildZoomValueExpr(STREET_BODY_WIDTHS),
      blur: 1.3,
      opacity: buildWeightOpacityExpr(settings.opacity, 0.28, 0.58),
    },
    core: {
      width: buildZoomValueExpr(STREET_CORE_WIDTHS),
      opacity: buildWeightOpacityExpr(settings.opacity, 0.65, 0.95),
    },
  };
}
