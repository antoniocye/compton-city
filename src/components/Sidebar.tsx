"use client";

import { useState, useEffect } from "react";
import {
  ARTIFACT_TYPE_META,
  ARTIFACT_TYPES,
  ArtifactType,
  CulturalArtifact,
  HeatmapSettings,
  LocationSummary,
  NewArtifactInput,
  Theme,
} from "@/lib/types";

interface SidebarProps {
  summaries: LocationSummary[];
  artifacts: CulturalArtifact[];
  selectedLocationId: string | null;
  selectedArtifactId: string | null;
  settings: HeatmapSettings;
  activeTypes: ArtifactType[];
  isOpen: boolean;
  theme: Theme;
  pendingCoords: { lat: number; lng: number } | null;
  onAddArtifact: (artifact: NewArtifactInput) => void;
  onRemoveArtifact: (id: string) => void;
  onSelectLocation: (locationId: string) => void;
  onSelectArtifact: (locationId: string, artifactId: string) => void;
  onToggleType: (type: ArtifactType) => void;
  onUpdateSettings: (settings: HeatmapSettings) => void;
  onClearPending: () => void;
}

type Tab = "add" | "library" | "settings";

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

function looksLikeImageUrl(value: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(value);
}

export default function Sidebar({
  summaries,
  artifacts,
  selectedLocationId,
  selectedArtifactId,
  settings,
  activeTypes,
  isOpen,
  theme,
  pendingCoords,
  onAddArtifact,
  onRemoveArtifact,
  onSelectLocation,
  onSelectArtifact,
  onToggleType,
  onUpdateSettings,
  onClearPending,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>("library");
  const [form, setForm] = useState({
    lat: "",
    lng: "",
    locationName: "",
    type: "lyric-snippet" as ArtifactType,
    title: "",
    creator: "",
    sourceTitle: "",
    year: "",
    caption: "",
    description: "",
    resourceKind: "youtube" as "youtube" | "spotify" | "image" | "external",
    resourceUrl: "",
    startSeconds: "",
    heatWeight: "0.85",
  });
  const [formError, setFormError] = useState("");
  const isDark = theme === "dark";

  useEffect(() => {
    if (!pendingCoords) return;
    setTab("add");
    setForm((current) => ({
      ...current,
      lat: String(pendingCoords.lat),
      lng: String(pendingCoords.lng),
    }));
    onClearPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoords]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setFormError("Latitude and longitude are required.");
      return;
    }
    if (!form.locationName.trim() || !form.title.trim() || !form.creator.trim()) {
      setFormError("Location, title, and creator are required.");
      return;
    }
    if (!form.resourceUrl.trim()) {
      setFormError("A resource URL is required.");
      return;
    }

    const resource =
      form.resourceKind === "youtube"
        ? {
            kind: "youtube" as const,
            url: form.resourceUrl.trim(),
            startSeconds: form.startSeconds
              ? parseInt(form.startSeconds, 10)
              : undefined,
          }
        : form.resourceKind === "spotify"
          ? {
              kind: "spotify" as const,
              url: form.resourceUrl.trim(),
            }
          : form.resourceKind === "image"
            ? {
                kind: "image" as const,
                imageUrl: looksLikeImageUrl(form.resourceUrl.trim())
                  ? form.resourceUrl.trim()
                  : undefined,
                sourceUrl: form.resourceUrl.trim(),
              }
            : {
                kind: "external" as const,
                url: form.resourceUrl.trim(),
                label: "Open source",
              };

    onAddArtifact({
      lat,
      lng,
      locationName: form.locationName.trim(),
      type: form.type,
      title: form.title.trim(),
      creator: form.creator.trim(),
      sourceTitle: form.sourceTitle.trim() || undefined,
      year: form.year ? parseInt(form.year, 10) : undefined,
      caption: form.caption.trim() || undefined,
      description: form.description.trim() || undefined,
      heatWeight: parseFloat(form.heatWeight) || 0.85,
      resource,
    });

    setForm({
      lat: "",
      lng: "",
      locationName: "",
      type: "lyric-snippet",
      title: "",
      creator: "",
      sourceTitle: "",
      year: "",
      caption: "",
      description: "",
      resourceKind: "youtube",
      resourceUrl: "",
      startSeconds: "",
      heatWeight: "0.85",
    });
    setTab("library");
  };

  /* ── Theme tokens ───────────────────────────────────────────────────── */
  const panel = isDark
    ? "bg-[#070c1a]/90 border-white/[0.06]"
    : "bg-white/96 border-slate-200/70 shadow-2xl shadow-black/10";

  const divider = isDark ? "border-white/[0.05]" : "border-slate-100";

  const tabActive = isDark
    ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/[0.04]"
    : "text-sky-600 border-b-2 border-sky-500 bg-sky-50";

  const tabIdle = isDark
    ? "text-slate-600 hover:text-slate-300"
    : "text-slate-400 hover:text-slate-600";

  const inp = isDark
    ? "bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder-slate-700 focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-cyan-500/15"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:bg-white focus:ring-1 focus:ring-sky-300/40";

  const lbl = isDark ? "text-slate-500" : "text-slate-400";

  const hint = isDark
    ? "bg-cyan-400/[0.06] border-cyan-500/20 text-cyan-300/75"
    : "bg-sky-50 border-sky-200/80 text-sky-700";

  const addBtn = isDark
    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/55"
    : "bg-sky-500/8 border-sky-400/40 text-sky-700 hover:bg-sky-100 hover:border-sky-400/70";

  const listRow = isDark
    ? "bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.05]"
    : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-100";

  const listLabel = isDark ? "text-slate-300" : "text-slate-800";
  const listSub = isDark ? "text-slate-600" : "text-slate-400";
  const wbar = isDark ? "bg-white/[0.06]" : "bg-slate-200";

  const resetBtn = isDark
    ? "text-slate-600 border-white/[0.07] hover:text-slate-400 hover:border-white/[0.13]"
    : "text-slate-400 border-slate-200 hover:text-slate-600 hover:border-slate-300";

  return (
    <aside className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-full w-72 pt-[60px] pb-4 pl-3">
        <div className={`h-full flex flex-col border backdrop-blur-2xl rounded-2xl overflow-hidden ${panel}`}>

          {/* Tabs */}
          <div className={`flex border-b ${divider}`}>
            {(["add", "library", "settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest transition-all duration-150 ${tab === t ? tabActive : tabIdle}`}>
                {t === "add" ? "Add" : t === "library" ? `Library (${artifacts.length})` : "Style"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">

            {/* ─── ADD ─── */}
            {tab === "add" && (
              <div className="p-4 space-y-4">
                {/* Map click hint */}
                <div className={`flex items-start gap-2 rounded-xl border p-3 ${hint}`}>
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                  </svg>
                  <span className="text-xs leading-relaxed">Click the map to fill coordinates, then describe the cultural artifact tied to that place.</span>
                </div>

                <form onSubmit={handleAdd} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Lat</label>
                      <input type="number" step="any" placeholder="33.8958" value={form.lat}
                        onChange={e => setForm({ ...form, lat: e.target.value })}
                        className={`input-base w-full ${inp}`} required />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Lng</label>
                      <input type="number" step="any" placeholder="-118.2201" value={form.lng}
                        onChange={e => setForm({ ...form, lng: e.target.value })}
                        className={`input-base w-full ${inp}`} required />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Location</label>
                    <input type="text" placeholder="Compton City Hall" value={form.locationName}
                      onChange={e => setForm({ ...form, locationName: e.target.value })}
                      className={`input-base w-full ${inp}`} required />
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Artifact type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ARTIFACT_TYPES.map((type) => {
                        const active = form.type === type;
                        const meta = ARTIFACT_TYPE_META[type];
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm({ ...form, type })}
                            className={`rounded-xl border px-3 py-2 text-left transition-all ${
                              active ? addBtn : listRow
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

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Title</label>
                    <input type="text" placeholder="Not Like Us crowd sequence" value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className={`input-base w-full ${inp}`} required />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Creator</label>
                      <input type="text" placeholder="Kendrick Lamar" value={form.creator}
                        onChange={e => setForm({ ...form, creator: e.target.value })}
                        className={`input-base w-full ${inp}`} required />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Source title</label>
                      <input type="text" placeholder="Not Like Us" value={form.sourceTitle}
                        onChange={e => setForm({ ...form, sourceTitle: e.target.value })}
                        className={`input-base w-full ${inp}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Year</label>
                      <input type="number" placeholder="2024" value={form.year}
                        onChange={e => setForm({ ...form, year: e.target.value })}
                        className={`input-base w-full ${inp}`} />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>
                        Heat weight
                      </label>
                      <input type="number" step="0.05" min="0.1" max="2" value={form.heatWeight}
                        onChange={e => setForm({ ...form, heatWeight: e.target.value })}
                        className={`input-base w-full ${inp}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Quote / lyric / pull quote</label>
                    <textarea rows={3} placeholder="Won't you spend a weekend on Rosecrans..." value={form.caption}
                      onChange={e => setForm({ ...form, caption: e.target.value })}
                      className={`input-base w-full resize-none ${inp}`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Resource type</label>
                      <select
                        value={form.resourceKind}
                        onChange={e => setForm({
                          ...form,
                          resourceKind: e.target.value as "youtube" | "spotify" | "image" | "external",
                        })}
                        className={`input-base w-full ${inp}`}
                      >
                        <option value="youtube">YouTube</option>
                        <option value="spotify">Spotify</option>
                        <option value="image">Image</option>
                        <option value="external">External link</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Start sec</label>
                      <input type="number" placeholder="115" value={form.startSeconds}
                        onChange={e => setForm({ ...form, startSeconds: e.target.value })}
                        className={`input-base w-full ${inp}`}
                        disabled={form.resourceKind !== "youtube"} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Resource URL</label>
                    <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.resourceUrl}
                      onChange={e => setForm({ ...form, resourceUrl: e.target.value })}
                      className={`input-base w-full ${inp}`} required />
                  </div>

                  <p className={`text-[10px] leading-relaxed ${lbl}`}>
                    Use Spotify for songs when possible. For lyric-centric artifacts, pair the media with a direct quote above.
                  </p>

                  {formError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <button type="submit"
                    className={`flex items-center justify-center gap-2 border font-semibold rounded-xl px-4 py-2.5 text-sm w-full active:scale-[0.98] transition-all duration-150 ${addBtn}`}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Artifact
                  </button>
                </form>
              </div>
            )}

            {/* ─── LIBRARY ─── */}
            {tab === "library" && (
              <div className="p-3 space-y-1.5">
                {summaries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/4" : "bg-slate-100"}`}>
                      <svg className={`w-5 h-5 ${isDark ? "text-white/15" : "text-slate-300"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                    </div>
                    <p className={`text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>No artifacts yet</p>
                    <p className={`text-xs ${isDark ? "text-slate-700" : "text-slate-300"}`}>Add one or click the map</p>
                  </div>
                ) : summaries.map((summary, idx) => (
                  <div
                    key={summary.id}
                    className={`rounded-2xl border p-3 transition-all duration-150 ${
                      selectedLocationId === summary.location.id ? addBtn : listRow
                    }`}
                  >
                    <button
                      onClick={() => onSelectLocation(summary.location.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5"
                          style={{ background: `hsl(${(idx * 47) % 360},65%,45%)` }}>
                          {summary.artifactCount}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${listLabel}`}>{summary.location.name}</p>
                          <p className={`text-[10px] font-mono mt-0.5 ${listSub}`}>
                            {summary.location.lat.toFixed(4)}, {summary.location.lng.toFixed(4)}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${wbar}`}>
                              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-400" style={{ width: `${summary.normalizedWeight * 100}%` }} />
                            </div>
                            <span className={`text-[9px] font-mono ${listSub}`}>{summary.totalWeight.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="mt-3 space-y-2">
                      {summary.artifacts.map((artifact) => (
                        <div
                          key={artifact.id}
                          className={`group flex items-start gap-2 rounded-xl border p-2.5 ${
                            selectedArtifactId === artifact.id
                              ? isDark
                                ? "bg-white/[0.04] border-white/[0.08]"
                                : "bg-white border-slate-200"
                              : isDark
                                ? "bg-black/10 border-white/[0.04]"
                                : "bg-slate-50 border-slate-200/80"
                          }`}
                        >
                          <button
                            onClick={() => onSelectArtifact(summary.location.id, artifact.id)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[10px] uppercase tracking-[0.16em] font-semibold"
                                style={{ color: ARTIFACT_TYPE_META[artifact.type].accent }}
                              >
                                {ARTIFACT_TYPE_META[artifact.type].shortLabel}
                              </span>
                              <span className={`text-[10px] ${listSub}`}>
                                {artifact.creator}
                              </span>
                            </div>
                            <p className={`text-xs font-medium mt-1 ${listLabel}`}>
                              {artifact.title}
                            </p>
                          </button>
                          <button
                            onClick={() => onRemoveArtifact(artifact.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all shrink-0"
                            title="Remove artifact"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && (
              <div className="p-4 space-y-6">
                <div className="space-y-2.5">
                  <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Active Artifact Types
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {ARTIFACT_TYPES.map((type) => {
                      const meta = ARTIFACT_TYPE_META[type];
                      const active = activeTypes.includes(type);
                      return (
                        <button
                          key={type}
                          onClick={() => onToggleType(type)}
                          className={`rounded-xl border px-3 py-2 text-left transition-all ${
                            active ? addBtn : listRow
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

                {/* Color schemes */}
                <div className="space-y-2.5">
                  <span className={`text-[11px] uppercase tracking-widest font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Color Scheme
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SCHEMES) as HeatmapSettings["colorScheme"][]).map(s => {
                      const { label, cls } = SCHEMES[s];
                      const active = settings.colorScheme === s;
                      return (
                        <button key={s} onClick={() => onUpdateSettings({ ...settings, colorScheme: s })}
                          className={`relative overflow-hidden rounded-xl h-11 transition-all duration-200 border-2 ${
                            active ? "border-white/75 scale-[1.03] shadow-lg" : "border-transparent hover:border-white/20"
                          }`}>
                          <div className={`absolute inset-0 bg-gradient-to-r ${cls}`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[11px] font-bold text-white drop-shadow">{label}</span>
                          </div>
                          {active && (
                            <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white/90 flex items-center justify-center">
                              <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  <Slider label="Radius" value={settings.radius} min={10} max={80} step={1} isDark={isDark}
                    display={`${settings.radius}px`} onChange={v => onUpdateSettings({ ...settings, radius: v })} />
                  <Slider label="Intensity" value={settings.intensity} min={0.5} max={5} step={0.1} isDark={isDark}
                    display={settings.intensity.toFixed(1)} onChange={v => onUpdateSettings({ ...settings, intensity: v })} />
                  <Slider label="Opacity" value={settings.opacity} min={0.1} max={1} step={0.05} isDark={isDark}
                    display={`${Math.round(settings.opacity * 100)}%`} onChange={v => onUpdateSettings({ ...settings, opacity: v })} />
                </div>

                <button onClick={() => onUpdateSettings({ radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire" })}
                  className={`w-full py-2 rounded-xl text-xs border transition-all duration-200 ${resetBtn}`}>
                  Reset to defaults
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
