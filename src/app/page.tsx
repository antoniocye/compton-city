"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { Location, HeatmapSettings, Theme, StreetViewLocation } from "@/lib/types";
import { SAMPLE_LOCATIONS } from "@/lib/sampleData";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";
import StreetViewHeader from "@/components/StreetViewHeader";
import MiniMap from "@/components/MiniMap";

const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#06091a]">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/15" />
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
      </div>
    </div>
  ),
});

const StreetViewScene = dynamic(() => import("@/components/StreetViewScene"), { ssr: false });

let nextId = SAMPLE_LOCATIONS.length + 1;

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

function nearestLabel(lat: number, lng: number, locs: Location[]): string {
  let best: Location | null = null;
  let bestD = Infinity;
  for (const l of locs) {
    const d = distanceM(lat, lng, l.lat, l.lng);
    if (d < bestD) { bestD = d; best = l; }
  }
  return best && bestD < 300 ? best.label : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export default function Home() {
  const [locations,    setLocations]    = useState<Location[]>(SAMPLE_LOCATIONS);
  const [settings,     setSettings]     = useState<HeatmapSettings>({ radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire" });
  const [theme,        setTheme]        = useState<Theme>("dark");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [pending,      setPending]      = useState<{ lat: number; lng: number } | null>(null);
  const [streetView,   setStreetView]   = useState<StreetViewLocation | null>(null);

  // Sync dark/light class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark",  theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme      = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  const closeStreetView  = useCallback(() => setStreetView(null), []);

  const handleAddLocation    = useCallback((loc: Omit<Location, "id">) => {
    setLocations(p => [...p, { ...loc, id: `u${nextId++}` }]);
  }, []);
  const handleRemoveLocation = useCallback((id: string) => {
    setLocations(p => p.filter(l => l.id !== id));
  }, []);

  // General map click → fill form + open street view
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPending({ lat, lng });
    setSidebarOpen(true);
    setStreetView({ lat, lng, label: nearestLabel(lat, lng, locations) });
  }, [locations]);

  // Dot click → open street view with known label
  const handleLocationClick = useCallback((lat: number, lng: number, label: string) => {
    setStreetView({ lat, lng, label });
  }, []);

  const inStreetView = streetView !== null;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === "dark" ? "bg-[#06091a]" : "bg-slate-200"}`}>

      {/* ── Heatmap (always mounted, fades when street view is active) ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${theme === "light" ? "light" : ""} ${
          inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <HeatmapMap
          locations={locations}
          settings={settings}
          theme={theme}
          onMapClick={handleMapClick}
          onLocationClick={handleLocationClick}
        />
      </div>

      {/* ── Regular UI (header / sidebar / legend) ── */}
      <div className={`transition-opacity duration-300 ${inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Header
          locations={locations}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClearAll={() => setLocations([])}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
        <Sidebar
          locations={locations}
          settings={settings}
          isOpen={sidebarOpen}
          theme={theme}
          pendingCoords={pending}
          onAddLocation={handleAddLocation}
          onRemoveLocation={handleRemoveLocation}
          onUpdateSettings={setSettings}
          onClearPending={() => setPending(null)}
        />
        <Legend colorScheme={settings.colorScheme} theme={theme} />
      </div>

      {/* ── Street View mode ── */}
      {inStreetView && streetView && (
        <div className="absolute inset-0 z-10">
          {/* Full-screen panorama */}
          <StreetViewScene lat={streetView.lat} lng={streetView.lng} theme={theme} />

          {/* Top header overlay */}
          <StreetViewHeader
            location={streetView}
            theme={theme}
            onClose={closeStreetView}
            onToggleTheme={toggleTheme}
          />

          {/* Mini heatmap in bottom-right corner */}
          <MiniMap
            locations={locations}
            settings={settings}
            theme={theme}
            focusLat={streetView.lat}
            focusLng={streetView.lng}
            onExpand={closeStreetView}
          />
        </div>
      )}
    </div>
  );
}
