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

const SCHEMES: Record<HeatmapSettings["colorScheme"], { label: string; cls: string }> = {
  fire:    { label: "Fire",    cls: "from-violet-950 via-red-700 to-yellow-300" },
  ocean:   { label: "Ocean",   cls: "from-blue-950 via-cyan-500 to-teal-200" },
  plasma:  { label: "Plasma",  cls: "from-indigo-950 via-fuchsia-600 to-orange-300" },
  viridis: { label: "Viridis", cls: "from-violet-950 via-teal-500 to-yellow-300" },
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
        <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          {label}
        </span>
        <span className={`text-xs font-mono font-bold ${isDark ? "text-cyan-400" : "text-sky-600"}`}>
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
    ? "bg-[#070c1a]/90 border-white/[0.06]"
    : "bg-white/96 border-slate-200/70 shadow-2xl shadow-black/10";

  const divider = isDark ? "border-white/[0.05]" : "border-slate-100";

  const listRow = isDark
    ? "bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.05]"
    : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-100";

  const listLabel = isDark ? "text-slate-300" : "text-slate-800";
  const listSub = isDark ? "text-slate-600" : "text-slate-400";

  const resetBtn = isDark
    ? "text-slate-600 border-white/[0.07] hover:text-slate-400 hover:border-white/[0.13]"
    : "text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300";

  return (
    <aside className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-full w-64 pt-[72px] pb-4 pl-3">
        <div className={`h-full flex flex-col border backdrop-blur-2xl rounded-2xl overflow-hidden ${panel}`}>
          <div className={`px-4 py-3 border-b ${divider}`}>
            <p className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Settings
            </p>
            <p className={`text-xs mt-1 ${listSub}`}>
              Filters and heat styling for the JSON-loaded artifact dataset.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
            <div className="space-y-2.5">
              <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
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
                            ? "bg-cyan-500/10 border-cyan-500/30"
                            : "bg-sky-50 border-sky-300/70"
                          : listRow
                      }`}
                    >
                      <span className="block text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: meta.accent }}>
                        {meta.shortLabel}
                      </span>
                      <span className={`block text-xs mt-1 ${listLabel}`}>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                Color Scheme
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(SCHEMES) as HeatmapSettings["colorScheme"][]).map((scheme) => {
                  const { label, cls } = SCHEMES[scheme];
                  const active = settings.colorScheme === scheme;
                  return (
                    <button
                      key={scheme}
                      onClick={() => onUpdateSettings({ ...settings, colorScheme: scheme })}
                      className={`relative overflow-hidden rounded-xl h-11 transition-all duration-200 border-2 ${
                        active ? "border-white/75 scale-[1.03] shadow-lg" : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${cls}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white drop-shadow">{label}</span>
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
