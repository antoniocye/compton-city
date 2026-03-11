"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { Location, HeatmapSettings, Theme } from "@/lib/types";
import { SAMPLE_LOCATIONS } from "@/lib/sampleData";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";

const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
        </div>
        <p className="text-white/40 text-sm tracking-widest uppercase">Loading map…</p>
      </div>
    </div>
  ),
});

let nextId = SAMPLE_LOCATIONS.length + 1;

export default function Home() {
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
  const [settings, setSettings] = useState<HeatmapSettings>({
    radius: 30,
    intensity: 1.5,
    opacity: 0.85,
    colorScheme: "fire",
  });
  const [theme, setTheme] = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Sync theme class on <html> for Tailwind dark: variants
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const handleAddLocation = useCallback((loc: Omit<Location, "id">) => {
    setLocations((prev) => [...prev, { ...loc, id: `u${nextId++}` }]);
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setLocations([]);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setSidebarOpen(true);
  }, []);

  const bgCls = theme === "dark" ? "bg-[#0a0a0f]" : "bg-gray-100";

  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-colors duration-300 ${bgCls}`}>
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <HeatmapMap
          locations={locations}
          settings={settings}
          theme={theme}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Header */}
      <Header
        locations={locations}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onClearAll={handleClearAll}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
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
    </div>
  );
}
