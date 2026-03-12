"use client";

import { HeatmapSettings, Theme } from "@/lib/types";

const GRADIENTS: Record<HeatmapSettings["colorScheme"], string> = {
  fire:    "linear-gradient(to right, #2e0060, #9b0000, #ff6000, #ffd000, #fff8c0)",
  ocean:   "linear-gradient(to right, #001060, #0060d0, #00b8e0, #00f0b8, #c0fff0)",
  plasma:  "linear-gradient(to right, #120060, #8000d0, #e000b0, #ff4040, #ffc040)",
  viridis: "linear-gradient(to right, #3a0860, #285090, #18a068, #48c030, #d0e010)",
};

export default function Legend({
  colorScheme,
  theme,
}: {
  colorScheme: HeatmapSettings["colorScheme"];
  theme: Theme;
}) {
  const isDark = theme === "dark";
  return (
    <div className={`absolute bottom-8 right-4 z-10 rounded-2xl px-4 py-3 backdrop-blur-2xl border transition-all duration-300 ${
      isDark
        ? "bg-[#070c1a]/80 border-white/[0.06] shadow-xl shadow-black/50"
        : "bg-white/95 border-slate-200/60 shadow-lg shadow-black/10"
    }`}>
      <p className={`text-[9px] uppercase tracking-[0.16em] font-semibold mb-2 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
        Density
      </p>
      <div className="flex items-center gap-2.5">
        <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>Low</span>
        <div className="w-28 h-2 rounded-full" style={{ background: GRADIENTS[colorScheme] }} />
        <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>High</span>
      </div>
    </div>
  );
}
