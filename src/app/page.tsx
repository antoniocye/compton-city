"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { Location, HeatmapSettings, Theme } from "@/lib/types";
import { SAMPLE_LOCATIONS } from "@/lib/sampleData";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";
import StreetViewPanel, { StreetViewLocation } from "@/components/StreetViewPanel";

const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#06091a]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/15" />
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
        </div>
        <p className="text-slate-600 text-xs tracking-[0.2em] uppercase">Loading map…</p>
      </div>
    </div>
  ),
});

let nextId = SAMPLE_LOCATIONS.length + 1;

/** Haversine distance in metres */
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestLabel(lat: number, lng: number, locations: Location[]): string {
  let best: Location | null = null;
  let bestDist = Infinity;
  for (const loc of locations) {
    const d = distanceM(lat, lng, loc.lat, loc.lng);
    if (d < bestDist) { bestDist = d; best = loc; }
  }
  // Within 300m → use that label; otherwise show coordinates
  if (best && bestDist < 300) return best.label;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
  const [settings, setSettings] = useState<HeatmapSettings>({
    radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire",
  });
  const [theme, setTheme] = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [streetView, setStreetView] = useState<StreetViewLocation | null>(null);

  /* Apply dark/light class to <html> for Tailwind dark: variants */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  const handleToggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);

  const handleAddLocation = useCallback((loc: Omit<Location, "id">) => {
    setLocations(prev => [...prev, { ...loc, id: `u${nextId++}` }]);
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  }, []);

  /* General map click: fill add-form + open street view */
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setSidebarOpen(true);
    setStreetView({
      lat, lng,
      label: nearestLabel(lat, lng, locations),
    });
  }, [locations]);

  /* Dot click: open street view with known label (no form fill) */
  const handleLocationClick = useCallback((lat: number, lng: number, label: string) => {
    setStreetView({ lat, lng, label });
  }, []);

  const mapContainerCls = theme === "light" ? "light" : "";

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === "dark" ? "bg-[#06091a]" : "bg-slate-200"}`}>

      {/* Map */}
      <div className={`absolute inset-0 ${mapContainerCls}`}>
        <HeatmapMap
          locations={locations}
          settings={settings}
          theme={theme}
          onMapClick={handleMapClick}
          onLocationClick={handleLocationClick}
        />
      </div>

      {/* Header */}
      <Header
        locations={locations}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onClearAll={() => setLocations([])}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
      />

      {/* Sidebar */}
      <Sidebar
        locations={locations}
        settings={settings}
        isOpen={sidebarOpen}
        theme={theme}
        pendingCoords={pendingCoords}
        onAddLocation={handleAddLocation}
        onRemoveLocation={handleRemoveLocation}
        onUpdateSettings={setSettings}
        onClearPending={() => setPendingCoords(null)}
      />

      {/* Legend */}
      <Legend colorScheme={settings.colorScheme} theme={theme} />

      {/* Street View panel */}
      <StreetViewPanel
        location={streetView}
        theme={theme}
        onClose={() => setStreetView(null)}
      />
    </div>
  );
}
