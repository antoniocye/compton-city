"use client";

import {
  ARTIFACT_TYPE_META,
  ARTIFACT_TYPES,
  ArtifactType,
  HeatmapSettings,
  Theme,
} from "@/lib/types";

interface SidebarProps {
  settings: HeatmapSettings;
  activeTypes: ArtifactType[];
  isOpen: boolean;
  theme: Theme;
  onToggleType: (type: ArtifactType) => void;
  onUpdateSettings: (s: HeatmapSettings) => void;
}

const SCHEMES: Record<HeatmapSettings["colorScheme"], { label: string; gradient: string }> = {
  fire:    { label: "Fire",    gradient: "linear-gradient(to right, #640c00, #c82000, #e85000, #f0b000, #fff5a0)" },
  ocean:   { label: "Ocean",   gradient: "linear-gradient(to right, #001640, #0048b0, #009fcc, #00d8b0, #c0fff0)" },
  plasma:  { label: "Plasma",  gradient: "linear-gradient(to right, #6e0a0a, #c00040, #e82070, #f07020, #ffe030)" },
  viridis: { label: "Viridis", gradient: "linear-gradient(to right, #0a3820, #146450, #1ea078, #60c830, #fde725)" },
};

function Slider({ label, value, min, max, step, display, isDark, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  display?: string; isDark: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
          {display ?? value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full" />
    </div>
  );
}

export default function Sidebar({
  settings, activeTypes, isOpen, theme, onToggleType, onUpdateSettings,
}: SidebarProps) {
  const isDark = theme === "dark";

  return (
    <aside className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="h-full w-64 pt-[68px] pb-4 pl-3">
        <div className={`h-full w-64 flex flex-col border rounded-xl overflow-hidden shadow-2xl ${
          isDark
            ? "bg-zinc-900 border-zinc-700"
            : "bg-white border-zinc-200"
        }`}>

          {/* Header */}
          <div className={`px-4 py-3 border-b ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
            <p className={`text-[11px] uppercase tracking-[0.18em] font-bold ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
              Settings
            </p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">

            {/* Artifact types */}
            <div className="space-y-2">
              <p className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Artifact Types
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {ARTIFACT_TYPES.map((type) => {
                  const meta   = ARTIFACT_TYPE_META[type];
                  const active = activeTypes.includes(type);
                  return (
                    <button key={type} onClick={() => onToggleType(type)}
                      className={`rounded-lg border px-3 py-2 text-left transition-all ${
                        active
                          ? isDark
                            ? "bg-zinc-800 border-zinc-600"
                            : "bg-zinc-50 border-zinc-300"
                          : isDark
                            ? "bg-zinc-900 border-zinc-800 opacity-40"
                            : "bg-white border-zinc-100 opacity-40"
                      }`}>
                      <span className="block text-[10px] uppercase tracking-[0.15em] font-bold"
                        style={{ color: meta.accent }}>{meta.shortLabel}</span>
                      <span className={`block text-xs mt-0.5 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color scheme */}
            <div className="space-y-2">
              <p className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                Color Scheme
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(SCHEMES) as HeatmapSettings["colorScheme"][]).map((scheme) => {
                  const { label, gradient } = SCHEMES[scheme];
                  const active = settings.colorScheme === scheme;
                  return (
                    <button key={scheme} onClick={() => onUpdateSettings({ ...settings, colorScheme: scheme })}
                      className={`relative overflow-hidden rounded-lg h-10 transition-all border-2 ${
                        active
                          ? isDark ? "border-zinc-300 scale-[1.03]" : "border-zinc-600 scale-[1.03]"
                          : "border-transparent opacity-75 hover:opacity-100"
                      }`}>
                      <div className="absolute inset-0" style={{ background: gradient }} />
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <Slider label="Radius" value={settings.radius} min={10} max={80} step={1}
                display={`${settings.radius}px`} isDark={isDark}
                onChange={(v) => onUpdateSettings({ ...settings, radius: v })} />
              <Slider label="Intensity" value={settings.intensity} min={0.5} max={5} step={0.1}
                display={settings.intensity.toFixed(1)} isDark={isDark}
                onChange={(v) => onUpdateSettings({ ...settings, intensity: v })} />
              <Slider label="Opacity" value={settings.opacity} min={0.1} max={1} step={0.05}
                display={`${Math.round(settings.opacity * 100)}%`} isDark={isDark}
                onChange={(v) => onUpdateSettings({ ...settings, opacity: v })} />
            </div>

            {/* Reset */}
            <button
              onClick={() => onUpdateSettings({ radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire" })}
              className={`w-full py-2 rounded-lg text-xs border transition-all ${
                isDark
                  ? "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                  : "border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600"
              }`}>
              Reset defaults
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
