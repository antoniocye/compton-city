export type Theme = "dark" | "light";

export interface Location {
  id: string;
  lat: number;
  lng: number;
  label: string;
  weight: number;
}

export interface HeatmapSettings {
  radius: number;
  intensity: number;
  opacity: number;
  colorScheme: "fire" | "ocean" | "plasma" | "viridis";
}

export const COLOR_SCHEMES: Record<
  HeatmapSettings["colorScheme"],
  [number, string][]
> = {
  fire: [
    [0, "rgba(0,0,0,0)"],
    [0.1, "rgba(60,10,120,0.7)"],
    [0.3, "rgba(200,30,30,0.85)"],
    [0.5, "rgba(255,100,0,0.95)"],
    [0.7, "rgba(255,200,0,1)"],
    [0.9, "rgba(255,240,100,1)"],
    [1, "rgba(255,255,255,1)"],
  ],
  ocean: [
    [0, "rgba(0,0,0,0)"],
    [0.1, "rgba(0,20,80,0.7)"],
    [0.3, "rgba(0,80,200,0.85)"],
    [0.5, "rgba(0,180,220,0.95)"],
    [0.7, "rgba(0,240,200,1)"],
    [0.9, "rgba(100,255,220,1)"],
    [1, "rgba(200,255,255,1)"],
  ],
  plasma: [
    [0, "rgba(0,0,0,0)"],
    [0.1, "rgba(20,0,100,0.7)"],
    [0.3, "rgba(120,0,200,0.85)"],
    [0.5, "rgba(220,0,180,0.95)"],
    [0.7, "rgba(255,80,80,1)"],
    [0.9, "rgba(255,180,50,1)"],
    [1, "rgba(255,240,0,1)"],
  ],
  viridis: [
    [0, "rgba(0,0,0,0)"],
    [0.1, "rgba(60,10,90,0.7)"],
    [0.3, "rgba(40,90,160,0.85)"],
    [0.5, "rgba(30,160,120,0.95)"],
    [0.7, "rgba(80,200,60,1)"],
    [0.9, "rgba(200,230,30,1)"],
    [1, "rgba(253,231,37,1)"],
  ],
};
