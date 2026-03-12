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
  onUpdateSettings: (settings: HeatmapSettings) => void;
}

const SCHEMES: Record<HeatmapSettings["colorScheme"], { label: string; gradient: string }> = {
  fire:    { label: "Fire",    gradient: "linear-gradient(to right, #640c00, #c82000, #e85000, #f0b000, #fff5a0)" },
  ocean:   { label: "Ocean",   gradient: "linear-gradient(to right, #001640, #0048b0, #009fcc, #00d8b0, #c0fff0)" },
  plasma:  { label: "Plasma",  gradient: "linear-gradient(to right, #6e0a0a, #c00040, #e82070, #f07020, #ffe030)" },
  viridis: { label: "Viridis", gradient: "linear-gradient(to right, #0a3820, #146450, #1ea078, #60c830, #fde725)" },
};

interface SliderProps {
  label: string; value: number; min: number; max: number; step: number;
  display?: string; isDark: boolean;
  onChange: (v: number) => void;
}
function Slider({ label, value, min, max, step, display, isDark, onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-stone-500" : "text-stone-400"}`}>
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
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
  settings,
  activeTypes,
  isOpen,
  theme,
  onToggleType,
  onUpdateSettings,
}: SidebarProps) {
  const isDark = theme === "dark";

  /* ── Theme tokens ───────────────────────────────────────────────────── */
  const panel = isDark
    ? "bg-[#181411]/92 border-white/[0.06]"
    : "bg-[#fdfaf3]/96 border-stone-300/40 shadow-2xl shadow-black/10";

  const divider = isDark ? "border-white/[0.05]" : "border-stone-200/60";

  const listRow = isDark
    ? "bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.05]"
    : "bg-stone-50/80 hover:bg-stone-100/80 border-stone-200/60";

  const listLabel = isDark ? "text-stone-300" : "text-stone-800";
  const listSub = isDark ? "text-stone-600" : "text-stone-400";

  const resetBtn = isDark
    ? "text-stone-600 border-white/[0.07] hover:text-stone-400 hover:border-white/[0.13]"
    : "text-stone-400 border-stone-200 hover:text-stone-600 hover:border-stone-300";

  return (
    <aside className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-full w-64 pt-[72px] pb-4 pl-3">
        <div className={`h-full w-64 flex flex-col border backdrop-blur-2xl rounded-2xl overflow-hidden ${panel}`}>
          <div className={`px-4 py-3 border-b ${divider}`}>
            <p className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${isDark ? "text-stone-500" : "text-stone-400"}`}>
              Settings
            </p>
            <p className={`text-xs mt-1 ${listSub}`}>
              Filter and style the cultural artifact heatmap.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            <div className="space-y-2.5">
              <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-stone-500" : "text-stone-400"}`}>
                Active Artifact Types
              </span>
              <div className="grid grid-cols-1 gap-2">
                {ARTIFACT_TYPES.map((type) => {
                  const meta = ARTIFACT_TYPE_META[type];
                  const active = activeTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => onToggleType(type)}
                      className={`rounded-xl border px-3 py-2 text-left transition-all ${
                        active
                          ? isDark
                            ? "bg-amber-500/10 border-amber-500/28"
                            : "bg-amber-50/70 border-amber-400/50"
                          : listRow
                      }`}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: meta.accent }}>
                        {meta.shortLabel}
                      </span>
                      <span className={`block text-xs mt-0.5 ${listLabel}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-stone-500" : "text-stone-400"}`}>
                Color Scheme
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SCHEMES) as HeatmapSettings["colorScheme"][]).map((scheme) => {
                  const { label, gradient } = SCHEMES[scheme];
                  const active = settings.colorScheme === scheme;
                  return (
                    <button
                      key={scheme}
                      onClick={() => onUpdateSettings({ ...settings, colorScheme: scheme })}
                      className={`relative overflow-hidden rounded-xl h-11 transition-all duration-200 border-2 ${
                        active
                          ? "border-white/70 scale-[1.03] shadow-lg"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <div className="absolute inset-0" style={{ background: gradient }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white drop-shadow-md">{label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5">
              <Slider
                label="Radius"
                value={settings.radius}
                min={10}
                max={80}
                step={1}
                isDark={isDark}
                display={`${settings.radius}px`}
                onChange={(value) => onUpdateSettings({ ...settings, radius: value })}
              />
              <Slider
                label="Intensity"
                value={settings.intensity}
                min={0.5}
                max={5}
                step={0.1}
                isDark={isDark}
                display={settings.intensity.toFixed(1)}
                onChange={(value) => onUpdateSettings({ ...settings, intensity: value })}
              />
              <Slider
                label="Opacity"
                value={settings.opacity}
                min={0.1}
                max={1}
                step={0.05}
                isDark={isDark}
                display={`${Math.round(settings.opacity * 100)}%`}
                onChange={(value) => onUpdateSettings({ ...settings, opacity: value })}
              />
            </div>

            <button
              onClick={() =>
                onUpdateSettings({
                  radius: 30,
                  intensity: 1.5,
                  opacity: 0.85,
                  colorScheme: "fire",
                })
              }
              className={`w-full py-2 rounded-xl text-xs border transition-all duration-200 ${resetBtn}`}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
