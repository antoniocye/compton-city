"use client";

import { useState, useEffect } from "react";
import { Location, HeatmapSettings } from "@/lib/types";

interface SidebarProps {
  locations: Location[];
  settings: HeatmapSettings;
  isOpen: boolean;
  pendingCoords: { lat: number; lng: number } | null;
  onAddLocation: (location: Omit<Location, "id">) => void;
  onRemoveLocation: (id: string) => void;
  onUpdateSettings: (settings: HeatmapSettings) => void;
  onClearPending: () => void;
}

type Tab = "add" | "list" | "settings";

const COLOR_SCHEME_LABELS: Record<HeatmapSettings["colorScheme"], { label: string; gradient: string }> = {
  fire: { label: "Fire", gradient: "from-purple-900 via-red-600 via-orange-500 to-yellow-200" },
  ocean: { label: "Ocean", gradient: "from-blue-900 via-blue-500 via-cyan-400 to-teal-200" },
  plasma: { label: "Plasma", gradient: "from-indigo-900 via-purple-600 via-pink-500 to-orange-300" },
  viridis: { label: "Viridis", gradient: "from-purple-900 via-blue-600 via-teal-500 to-yellow-300" },
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-cyan-400 font-mono font-semibold">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider w-full"
      />
    </div>
  );
}

export default function Sidebar({
  locations,
  settings,
  isOpen,
  pendingCoords,
  onAddLocation,
  onRemoveLocation,
  onUpdateSettings,
  onClearPending,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>("add");
  const [form, setForm] = useState({
    lat: "",
    lng: "",
    label: "",
    weight: "1",
  });
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [inputMode, setInputMode] = useState<"single" | "bulk">("single");

  // When map click provides coordinates, populate the form
  useEffect(() => {
    if (!pendingCoords) return;
    setTab("add");
    setInputMode("single");
    setForm((f) => ({
      ...f,
      lat: String(pendingCoords.lat),
      lng: String(pendingCoords.lng),
    }));
    onClearPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoords]);

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) return;
    onAddLocation({
      lat,
      lng,
      label: form.label || `Location ${locations.length + 1}`,
      weight: parseFloat(form.weight) || 1,
    });
    setForm({ lat: "", lng: "", label: "", weight: "1" });
  };

  const handleBulkSubmit = () => {
    setBulkError("");
    const lines = bulkText.trim().split("\n").filter((l) => l.trim());
    const parsed: Omit<Location, "id">[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/[,\t ]+/);
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) {
        setBulkError(`Line ${i + 1}: invalid coordinates "${line}"`);
        return;
      }
      const weight = parts[2] ? parseFloat(parts[2]) : 1;
      const label = parts.slice(3).join(" ") || `Point ${i + 1}`;
      parsed.push({ lat, lng, weight: isNaN(weight) ? 1 : weight, label });
    }

    parsed.forEach((p) => onAddLocation(p));
    setBulkText("");
  };

  return (
    <aside
      className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative h-full w-80 pt-[60px] pb-4 pl-3">
        <div className="h-full flex flex-col bg-black/75 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Tabs */}
          <div className="flex border-b border-white/8">
            {(["add", "list", "settings"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                  tab === t
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {t === "add" ? "Add" : t === "list" ? `Points (${locations.length})` : "Style"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* ─── ADD TAB ─── */}
            {tab === "add" && (
              <div className="p-4 space-y-4">
                {/* Mode toggle */}
                <div className="flex bg-white/5 rounded-xl p-1">
                  {(["single", "bulk"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setInputMode(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        inputMode === m
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {m === "single" ? "Single" : "Bulk"}
                    </button>
                  ))}
                </div>

                {/* Map click hint */}
                <div className="flex items-start gap-2 rounded-xl bg-cyan-500/8 border border-cyan-500/20 p-3">
                  <svg className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span className="text-xs text-cyan-300/80 leading-relaxed">
                    Click anywhere on the map to auto-fill coordinates
                  </span>
                </div>

                {inputMode === "single" ? (
                  <form onSubmit={handleSingleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="33.8958"
                          value={form.lat}
                          onChange={(e) => setForm({ ...form, lat: e.target.value })}
                          className="input-field w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="-118.2201"
                          value={form.lng}
                          onChange={(e) => setForm({ ...form, lng: e.target.value })}
                          className="input-field w-full"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Label</label>
                      <input
                        type="text"
                        placeholder="Location name"
                        value={form.label}
                        onChange={(e) => setForm({ ...form, label: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">
                        Weight <span className="normal-case text-white/30">(0 – 1)</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={form.weight}
                        onChange={(e) => setForm({ ...form, weight: e.target.value })}
                        className="input-field w-full"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Point
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      One location per line. Format:<br />
                      <code className="text-cyan-400/70">lat, lng[, weight[, label]]</code>
                    </p>
                    <textarea
                      rows={8}
                      placeholder={"33.8958, -118.2201, 0.9, City Hall\n33.9040, -118.2290, 0.7\n33.8897, -118.2358"}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="input-field w-full resize-none font-mono text-xs"
                    />
                    {bulkError && (
                      <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {bulkError}
                      </p>
                    )}
                    <button
                      onClick={handleBulkSubmit}
                      disabled={!bulkText.trim()}
                      className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import {bulkText.trim().split("\n").filter((l) => l.trim()).length} Points
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── LIST TAB ─── */}
            {tab === "list" && (
              <div className="p-3 space-y-2">
                {locations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                    </div>
                    <p className="text-white/30 text-sm">No locations yet.</p>
                    <p className="text-white/20 text-xs">Switch to Add tab or click the map.</p>
                  </div>
                ) : (
                  locations.map((loc, idx) => (
                    <div
                      key={loc.id}
                      className="group flex items-start gap-2 rounded-xl bg-white/4 hover:bg-white/7 border border-white/6 hover:border-white/12 p-3 transition-all duration-150"
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-black"
                        style={{
                          background: `hsl(${(idx * 47) % 360}, 80%, 55%)`,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs font-medium truncate">{loc.label}</p>
                        <p className="text-white/30 text-[10px] font-mono mt-0.5">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{ width: `${loc.weight * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-white/30 font-mono">{loc.weight.toFixed(1)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveLocation(loc.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all duration-150 shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {tab === "settings" && (
              <div className="p-4 space-y-6">
                {/* Color scheme */}
                <div className="space-y-2">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Color Scheme</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(COLOR_SCHEME_LABELS) as HeatmapSettings["colorScheme"][]).map(
                      (scheme) => {
                        const { label, gradient } = COLOR_SCHEME_LABELS[scheme];
                        return (
                          <button
                            key={scheme}
                            onClick={() =>
                              onUpdateSettings({ ...settings, colorScheme: scheme })
                            }
                            className={`relative overflow-hidden rounded-xl h-12 transition-all duration-200 border-2 ${
                              settings.colorScheme === scheme
                                ? "border-white/60 scale-[1.02]"
                                : "border-transparent hover:border-white/20"
                            }`}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-r ${gradient}`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white drop-shadow-lg">
                                {label}
                              </span>
                            </div>
                            {settings.colorScheme === scheme && (
                              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white flex items-center justify-center">
                                <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <SliderRow
                    label="Radius"
                    value={settings.radius}
                    min={10}
                    max={80}
                    step={1}
                    onChange={(v) => onUpdateSettings({ ...settings, radius: v })}
                    displayValue={`${settings.radius}px`}
                  />
                  <SliderRow
                    label="Intensity"
                    value={settings.intensity}
                    min={0.5}
                    max={5}
                    step={0.1}
                    onChange={(v) => onUpdateSettings({ ...settings, intensity: v })}
                    displayValue={settings.intensity.toFixed(1)}
                  />
                  <SliderRow
                    label="Opacity"
                    value={settings.opacity}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={(v) => onUpdateSettings({ ...settings, opacity: v })}
                    displayValue={`${Math.round(settings.opacity * 100)}%`}
                  />
                </div>

                {/* Reset defaults */}
                <button
                  onClick={() =>
                    onUpdateSettings({
                      radius: 30,
                      intensity: 1.5,
                      opacity: 0.85,
                      colorScheme: "fire",
                    })
                  }
                  className="w-full py-2 rounded-xl text-xs text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 transition-all duration-200"
                >
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
