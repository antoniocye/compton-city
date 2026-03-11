"use client";

import { HeatmapSettings, Theme } from "@/lib/types";

const GRADIENT_STYLES: Record<HeatmapSettings["colorScheme"], string> = {
  fire: "linear-gradient(to right, #1e0550, #8b0000, #ff6400, #ffd700, #fffde0)",
  ocean: "linear-gradient(to right, #001450, #0050c8, #00b4dc, #00f0c8, #cfffee)",
  plasma: "linear-gradient(to right, #140064, #7800c8, #dc00b4, #ff5050, #ffb432)",
  viridis: "linear-gradient(to right, #3c0a5a, #285aa0, #1ea078, #50c83c, #c8e61e)",
};

interface LegendProps {
  colorScheme: HeatmapSettings["colorScheme"];
  theme: Theme;
}

export default function Legend({ colorScheme, theme }: LegendProps) {
  const isDark = theme === "dark";
  const panelCls = isDark
    ? "bg-black/65 border-white/10"
    : "bg-white/85 border-black/8 shadow-md";
  const labelCls = isDark ? "text-white/40" : "text-gray-400";

  return (
    <div
      className={`absolute bottom-8 right-4 z-10 border backdrop-blur-xl rounded-2xl px-4 py-3 ${panelCls}`}
    >
      <p className={`text-[10px] uppercase tracking-widest mb-2 ${labelCls}`}>
        Density
      </p>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] ${labelCls}`}>Low</span>
        <div
          className="w-28 h-2.5 rounded-full"
          style={{ background: GRADIENT_STYLES[colorScheme] }}
        />
        <span className={`text-[10px] ${labelCls}`}>High</span>
      </div>
    </div>
  );
}
