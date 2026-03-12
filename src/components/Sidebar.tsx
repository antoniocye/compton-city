"use client";

import { useState, useEffect } from "react";
import {
  Artifact,
  ArtifactProvider,
  ArtifactType,
  ARTIFACT_TYPE_LABEL,
  HeatmapSettings,
  NewArtifact,
  Theme,
} from "@/lib/types";

interface SidebarProps {
  artifacts: Artifact[];
  settings: HeatmapSettings;
  isOpen: boolean;
  theme: Theme;
  pendingCoords: { lat: number; lng: number } | null;
  onAddArtifact: (artifact: NewArtifact) => void;
  onRemoveArtifact: (id: string) => void;
  onUpdateSettings: (settings: HeatmapSettings) => void;
  onClearPending: () => void;
}

type Tab = "add" | "list" | "settings";

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
  artifacts, settings, isOpen, theme, pendingCoords,
  onAddArtifact, onRemoveArtifact, onUpdateSettings, onClearPending,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>("add");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    type: "song_snippet" as ArtifactType,
    title: "",
    creator: "",
    year: "",
    lat: "",
    lng: "",
    locationName: "",
    provider: "youtube" as ArtifactProvider,
    url: "",
    startSec: "",
    endSec: "",
    overlayText: "",
    tags: "",
    weight: "1",
  });
  const isDark = theme === "dark";

  useEffect(() => {
    if (!pendingCoords) return;
    setTab("add");
    setForm(f => ({ ...f, lat: String(pendingCoords.lat), lng: String(pendingCoords.lng) }));
    onClearPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoords]);

  const handleAddArtifact = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setFormError("Latitude and longitude are required.");
      return;
    }
    if (!form.url.trim()) {
      setFormError("A media/resource URL is required.");
      return;
    }
    const yearNum = parseInt(form.year, 10);
    const weight = parseFloat(form.weight);
    const startSec = parseInt(form.startSec, 10);
    const endSec = parseInt(form.endSec, 10);

    onAddArtifact({
      type: form.type,
      title: form.title.trim() || `Artifact ${artifacts.length + 1}`,
      creator: form.creator.trim() || undefined,
      year: Number.isNaN(yearNum) ? undefined : yearNum,
      location: {
        name: form.locationName.trim() || "Compton",
        lat,
        lng,
      },
      resource: {
        provider: form.provider,
        url: form.url.trim(),
        startSec: Number.isNaN(startSec) ? undefined : startSec,
        endSec: Number.isNaN(endSec) ? undefined : endSec,
      },
      overlayText: form.overlayText.trim() || undefined,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      weight: Number.isNaN(weight) ? 1 : weight,
    });

    setForm({
      type: "song_snippet",
      title: "",
      creator: "",
      year: "",
      lat: "",
      lng: "",
      locationName: "",
      provider: "youtube",
      url: "",
      startSec: "",
      endSec: "",
      overlayText: "",
      tags: "",
      weight: "1",
    });
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

  const selectCls = `${inp} input-base`;
  const artifactTypes = Object.keys(ARTIFACT_TYPE_LABEL) as ArtifactType[];

  return (
    <aside className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-full w-80 pt-[60px] pb-4 pl-3">
        <div className={`h-full flex flex-col border backdrop-blur-2xl rounded-2xl overflow-hidden ${panel}`}>

          {/* Tabs */}
          <div className={`flex border-b ${divider}`}>
            {(["add", "list", "settings"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-[11px] font-semibold uppercase tracking-widest transition-all duration-150 ${tab === t ? tabActive : tabIdle}`}>
                {t === "add" ? "Add" : t === "list" ? `Artifacts (${artifacts.length})` : "Style"}
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
                  <span className="text-xs leading-relaxed">Click the map to pre-fill artifact coordinates.</span>
                </div>

                <form onSubmit={handleAddArtifact} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Artifact type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as ArtifactType })}
                        className={selectCls}
                      >
                        {artifactTypes.map((type) => (
                          <option key={type} value={type}>
                            {ARTIFACT_TYPE_LABEL[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Title</label>
                      <input
                        type="text"
                        placeholder="Straight Outta Compton"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Creator</label>
                      <input
                        type="text"
                        placeholder="N.W.A"
                        value={form.creator}
                        onChange={(e) => setForm({ ...form, creator: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Year</label>
                      <input
                        type="number"
                        placeholder="1988"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Lat</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="33.8958"
                        value={form.lat}
                        onChange={(e) => setForm({ ...form, lat: e.target.value })}
                        className={`input-base w-full ${inp}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Lng</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-118.2201"
                        value={form.lng}
                        onChange={(e) => setForm({ ...form, lng: e.target.value })}
                        className={`input-base w-full ${inp}`}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Location name</label>
                      <input
                        type="text"
                        placeholder="Compton Civic Center"
                        value={form.locationName}
                        onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Provider</label>
                      <select
                        value={form.provider}
                        onChange={(e) => setForm({ ...form, provider: e.target.value as ArtifactProvider })}
                        className={selectCls}
                      >
                        <option value="youtube">YouTube</option>
                        <option value="spotify">Spotify</option>
                        <option value="image_url">Image URL</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>
                        Weight <span className="normal-case opacity-50">(0-1)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Resource URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        className={`input-base w-full ${inp}`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Start sec</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="42"
                        value={form.startSec}
                        onChange={(e) => setForm({ ...form, startSec: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>End sec</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="60"
                        value={form.endSec}
                        onChange={(e) => setForm({ ...form, endSec: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Lyric / caption text</label>
                      <textarea
                        rows={2}
                        value={form.overlayText}
                        onChange={(e) => setForm({ ...form, overlayText: e.target.value })}
                        placeholder="Optional line to show with this artifact"
                        className={`input-base w-full resize-none ${inp}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={`text-[10px] uppercase tracking-wider mb-1 block ${lbl}`}>Tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="N.W.A, West Coast, Compton"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        className={`input-base w-full ${inp}`}
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                      {formError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className={`flex items-center justify-center gap-2 border font-semibold rounded-xl px-4 py-2.5 text-sm w-full active:scale-[0.98] transition-all duration-150 ${addBtn}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Artifact
                  </button>
                </form>
              </div>
            )}

            {/* ─── LIST ─── */}
            {tab === "list" && (
              <div className="p-3 space-y-1.5">
                {artifacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/4" : "bg-slate-100"}`}>
                      <svg className={`w-5 h-5 ${isDark ? "text-white/15" : "text-slate-300"}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                    </div>
                    <p className={`text-sm ${isDark ? "text-slate-600" : "text-slate-400"}`}>No artifacts yet</p>
                    <p className={`text-xs ${isDark ? "text-slate-700" : "text-slate-300"}`}>Add one or click the map</p>
                  </div>
                ) : artifacts.map((artifact, idx) => (
                  <div key={artifact.id}
                    className={`group flex items-start gap-2.5 rounded-xl border p-3 transition-all duration-150 ${listRow}`}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5"
                      style={{ background: `hsl(${(idx * 47) % 360},65%,45%)` }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${listLabel}`}>{artifact.title}</p>
                      <p className={`text-[10px] mt-0.5 ${listSub}`}>
                        {ARTIFACT_TYPE_LABEL[artifact.type]} - {artifact.resource.provider}
                      </p>
                      <p className={`text-[10px] font-mono mt-0.5 ${listSub}`}>
                        {artifact.location.lat.toFixed(4)}, {artifact.location.lng.toFixed(4)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className={`flex-1 h-0.5 rounded-full overflow-hidden ${wbar}`}>
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${artifact.weight * 100}%` }} />
                        </div>
                        <span className={`text-[9px] font-mono ${listSub}`}>{artifact.weight.toFixed(1)}</span>
                      </div>
                    </div>
                    <button onClick={() => onRemoveArtifact(artifact.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-all shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && (
              <div className="p-4 space-y-6">
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
