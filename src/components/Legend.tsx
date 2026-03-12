"use client";

import {
  ARTIFACT_TYPE_META,
  ARTIFACT_TYPES,
  ArtifactType,
  HeatmapSettings,
  Theme,
} from "@/lib/types";

const GRADIENTS: Record<HeatmapSettings["colorScheme"], string> = {
  fire:    "linear-gradient(to right, #640c00, #c82000, #e85000, #f0b000, #fff5a0)",
  ocean:   "linear-gradient(to right, #001640, #0048b0, #009fcc, #00d8b0, #c0fff0)",
  plasma:  "linear-gradient(to right, #6e0a0a, #c00040, #e82070, #f07020, #ffe030)",
  viridis: "linear-gradient(to right, #0a3820, #146450, #1ea078, #60c830, #fde725)",
};

export default function Legend({
  colorScheme,
  theme,
  activeTypes,
}: {
  colorScheme: HeatmapSettings["colorScheme"];
  theme: Theme;
  activeTypes: ArtifactType[];
}) {
  const isDark = theme === "dark";
  return (
    <div className={`absolute bottom-24 right-4 z-10 rounded-2xl px-4 py-3 backdrop-blur-2xl border transition-all duration-300 ${
      isDark
        ? "bg-[#181411]/82 border-white/[0.06] shadow-xl shadow-black/50"
        : "bg-[#fdfaf3]/95 border-stone-300/40 shadow-lg shadow-black/10"
    }`}>
      <p className={`text-[9px] uppercase tracking-[0.16em] font-semibold mb-2 ${isDark ? "text-stone-600" : "text-stone-400"}`}>
        Density
      </p>
      <div className="flex items-center gap-2.5">
        <span className={`text-[10px] ${isDark ? "text-stone-600" : "text-stone-400"}`}>Low</span>
        <div className="w-28 h-2 rounded-full" style={{ background: GRADIENTS[colorScheme] }} />
        <span className={`text-[10px] ${isDark ? "text-stone-600" : "text-stone-400"}`}>High</span>
      </div>

      <div className={`mt-3 pt-3 border-t space-y-2 ${isDark ? "border-white/[0.05]" : "border-stone-200/50"}`}>
        <p className={`text-[9px] uppercase tracking-[0.16em] font-semibold ${isDark ? "text-stone-600" : "text-stone-400"}`}>
          Artifact Types
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ARTIFACT_TYPES.map((type) => {
            const meta   = ARTIFACT_TYPE_META[type];
            const active = activeTypes.includes(type);
            return (
              <div
                key={type}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 border transition-opacity ${
                  active
                    ? isDark
                      ? "bg-white/[0.03] border-white/[0.07]"
                      : "bg-stone-50 border-stone-200/60"
                    : isDark
                      ? "opacity-35 border-white/[0.04]"
                      : "opacity-40 border-stone-200/50"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta.accent }}
                />
                <span className={`text-[10px] font-medium ${isDark ? "text-stone-300" : "text-stone-700"}`}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
