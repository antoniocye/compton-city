export type Theme = "dark" | "light";

export type ArtifactType =
  | "lyric-snippet"
  | "image"
  | "music-video"
  | "film-snippet";

export const ARTIFACT_TYPES: ArtifactType[] = [
  "lyric-snippet",
  "image",
  "music-video",
  "film-snippet",
];

export const ARTIFACT_TYPE_META: Record<
  ArtifactType,
  { label: string; shortLabel: string; accent: string }
> = {
  "lyric-snippet": {
    label: "Lyric Snippet",
    shortLabel: "LYR",
    accent: "#22d3ee",
  },
  image: {
    label: "Image",
    shortLabel: "IMG",
    accent: "#f59e0b",
  },
  "music-video": {
    label: "Music Video",
    shortLabel: "VID",
    accent: "#f87171",
  },
  "film-snippet": {
    label: "Film / Doc",
    shortLabel: "FILM",
    accent: "#fb7185",
  },
};

export interface StreetViewLocation {
  locationId?: string;
  lat: number;
  lng: number;
  label: string;
  artifactCount?: number;
  /** Initial camera heading (degrees, 0 = north). Set when teleporting so the
   *  panorama opens facing back toward the location you came from. */
  heading?: number;
}

/** Point location: a single lat/lng (default) */
export interface PointLocation {
  type?: "point";
  id: string;
  lat: number;
  lng: number;
  name: string;
  neighborhood?: string;
  aliases?: string[];
}

/** Street location: a line string; the whole street is heat mapped */
export interface StreetLocation {
  type: "street";
  id: string;
  /** GeoJSON order: [lng, lat] per vertex */
  coordinates: [number, number][];
  name: string;
  neighborhood?: string;
  aliases?: string[];
}

export type LocationNode = PointLocation | StreetLocation;

export type ArtifactResource =
  | {
      kind: "spotify";
      url: string;
      startMs?: number;
    }
  | {
      kind: "youtube";
      url: string;
      startSeconds?: number;
      endSeconds?: number;
    }
  | {
      kind: "image";
      imageUrl?: string;
      sourceUrl?: string;
      credit?: string;
    }
  | {
      kind: "external";
      url: string;
      label: string;
    }
  | {
      kind: "web";
      url: string;
      label?: string;
    };

export interface CulturalArtifact {
  id: string;
  type: ArtifactType;
  locationId: string;
  title: string;
  creator: string;
  sourceTitle?: string;
  year?: number;
  caption?: string;
  description?: string;
  tags?: string[];
  heatWeight: number;
  thumbnailUrl?: string;
  resource: ArtifactResource;
}

export interface LocationSummary {
  id: string;
  location: LocationNode;
  artifacts: CulturalArtifact[];
  artifactCount: number;
  totalWeight: number;
  normalizedWeight: number;
  dominantTypes: ArtifactType[];
}

export interface NewArtifactInput {
  lat: number;
  lng: number;
  locationName: string;
  type: ArtifactType;
  title: string;
  creator: string;
  sourceTitle?: string;
  year?: number;
  caption?: string;
  description?: string;
  heatWeight: number;
  resource: ArtifactResource;
}

export interface HeatmapSettings {
  radius: number;
  intensity: number;
  opacity: number;
  colorScheme: "fire" | "ocean" | "plasma" | "viridis" | "ember" | "arctic" | "crimson" | "infrared";
}

export const COLOR_SCHEMES: Record<
  HeatmapSettings["colorScheme"],
  [number, string][]
> = {
  fire: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(100,25,0,0.7)"],
    [0.3, "rgba(210,50,0,0.85)"],
    [0.5, "rgba(255,110,0,0.95)"],
    [0.7, "rgba(255,200,0,1)"],
    [0.9, "rgba(255,245,110,1)"],
    [1,   "rgba(255,255,255,1)"],
  ],
  ocean: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(0,25,70,0.7)"],
    [0.3, "rgba(0,80,190,0.85)"],
    [0.5, "rgba(0,165,215,0.95)"],
    [0.7, "rgba(0,230,190,1)"],
    [0.9, "rgba(100,255,220,1)"],
    [1,   "rgba(210,255,255,1)"],
  ],
  plasma: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(110,10,10,0.7)"],
    [0.3, "rgba(210,20,60,0.85)"],
    [0.5, "rgba(255,50,130,0.95)"],
    [0.7, "rgba(255,130,40,1)"],
    [0.9, "rgba(255,220,40,1)"],
    [1,   "rgba(255,255,200,1)"],
  ],
  viridis: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(10,55,35,0.7)"],
    [0.3, "rgba(20,100,80,0.85)"],
    [0.5, "rgba(30,160,120,0.95)"],
    [0.7, "rgba(100,205,55,1)"],
    [0.9, "rgba(200,230,30,1)"],
    [1,   "rgba(253,231,37,1)"],
  ],
  ember: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(60,10,0,0.7)"],
    [0.3, "rgba(140,40,0,0.85)"],
    [0.5, "rgba(210,90,0,0.95)"],
    [0.7, "rgba(255,160,20,1)"],
    [0.9, "rgba(255,215,80,1)"],
    [1,   "rgba(255,245,180,1)"],
  ],
  arctic: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(0,20,50,0.7)"],
    [0.3, "rgba(0,70,160,0.85)"],
    [0.5, "rgba(0,140,230,0.95)"],
    [0.7, "rgba(40,200,255,1)"],
    [0.9, "rgba(150,235,255,1)"],
    [1,   "rgba(220,248,255,1)"],
  ],
  crimson: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(50,0,0,0.7)"],
    [0.3, "rgba(140,0,0,0.85)"],
    [0.5, "rgba(210,0,20,0.95)"],
    [0.7, "rgba(255,60,60,1)"],
    [0.9, "rgba(255,160,120,1)"],
    [1,   "rgba(255,230,220,1)"],
  ],
  infrared: [
    [0,   "rgba(0,0,0,0)"],
    [0.1, "rgba(0,40,0,0.7)"],
    [0.3, "rgba(0,120,40,0.85)"],
    [0.5, "rgba(80,200,0,0.95)"],
    [0.7, "rgba(200,240,0,1)"],
    [0.9, "rgba(255,200,0,1)"],
    [1,   "rgba(255,255,180,1)"],
  ],
};

/** Street glow/core colors per scheme — used for the glowing road overlay */
export const STREET_COLORS: Record<
  HeatmapSettings["colorScheme"],
  { glow: string; core: string }
> = {
  fire:     { glow: "rgba(220,100,0,",   core: "rgba(255,200,40,"  },
  ocean:    { glow: "rgba(0,150,200,",   core: "rgba(60,230,210,"  },
  plasma:   { glow: "rgba(220,30,70,",   core: "rgba(255,120,80,"  },
  viridis:  { glow: "rgba(40,170,60,",   core: "rgba(190,235,30,"  },
  ember:    { glow: "rgba(190,80,0,",    core: "rgba(255,185,30,"  },
  arctic:   { glow: "rgba(0,120,220,",   core: "rgba(80,210,255,"  },
  crimson:  { glow: "rgba(190,0,10,",    core: "rgba(255,70,70,"   },
  infrared: { glow: "rgba(50,180,20,",   core: "rgba(210,245,0,"   },
};
