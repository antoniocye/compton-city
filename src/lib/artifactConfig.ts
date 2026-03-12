import { ArtifactType } from "./types";

export interface ArtifactTypeConfig {
  label: string;
  hexColor: string;
  ringColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  /** Single glyph used in Street View pins and map tooltips */
  icon: string;
}

export const ARTIFACT_CONFIG: Record<ArtifactType, ArtifactTypeConfig> = {
  song: {
    label: "Song",
    hexColor: "#F59E0B",
    ringColor: "rgba(245,158,11,0.45)",
    bgClass: "bg-amber-500/20",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/40",
    icon: "♪",
  },
  image: {
    label: "Photo",
    hexColor: "#3B82F6",
    ringColor: "rgba(59,130,246,0.45)",
    bgClass: "bg-blue-500/20",
    textClass: "text-blue-400",
    borderClass: "border-blue-500/40",
    icon: "◉",
  },
  music_video: {
    label: "Music Video",
    hexColor: "#EF4444",
    ringColor: "rgba(239,68,68,0.45)",
    bgClass: "bg-red-500/20",
    textClass: "text-red-400",
    borderClass: "border-red-500/40",
    icon: "▶",
  },
  movie_snippet: {
    label: "Film",
    hexColor: "#A855F7",
    ringColor: "rgba(168,85,247,0.45)",
    bgClass: "bg-purple-500/20",
    textClass: "text-purple-400",
    borderClass: "border-purple-500/40",
    icon: "◈",
  },
  documentary: {
    label: "Documentary",
    hexColor: "#10B981",
    ringColor: "rgba(16,185,129,0.45)",
    bgClass: "bg-emerald-500/20",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/40",
    icon: "◎",
  },
};
