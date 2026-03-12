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

/**
 * Bearing (0–360°) from point A to point B.
 * Use to face the panorama back toward the previous location after teleport.
 */
function computeHeading(
  fromLat: number, fromLng: number,
  toLat: number,  toLng: number
): number {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const φ1   = (fromLat * Math.PI) / 180;
  const φ2   = (toLat   * Math.PI) / 180;
  const y    = Math.sin(dLng) * Math.cos(φ2);
  const x    = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Returns the closest Location in the list to (lat, lng) */
function findNearest(lat: number, lng: number, locs: Location[]): Location | null {
  if (!locs.length) return null;
  let best = locs[0];
  let bestD = distanceM(lat, lng, best.lat, best.lng);
  for (let i = 1; i < locs.length; i++) {
    const d = distanceM(lat, lng, locs[i].lat, locs[i].lng);
    if (d < bestD) { bestD = d; best = locs[i]; }
  }
  return best;
}

export default function Home() {
  const [locations,    setLocations]    = useState<Location[]>(SAMPLE_LOCATIONS);
  const [settings,     setSettings]     = useState<HeatmapSettings>({ radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire" });
  const [theme,        setTheme]        = useState<Theme>("dark");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [pending,      setPending]      = useState<{ lat: number; lng: number } | null>(null);
  const [streetView,   setStreetView]   = useState<StreetViewLocation | null>(null);
  const [showPins,     setShowPins]     = useState(true);

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

  // General map click → fill form + snap street view to nearest location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPending({ lat, lng });
    setSidebarOpen(true);
    const nearest = findNearest(lat, lng, locations);
    if (nearest) {
      setStreetView({ lat: nearest.lat, lng: nearest.lng, label: nearest.label });
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [locations]);

  // Dot click → open street view with known label (exact position)
  const handleLocationClick = useCallback((lat: number, lng: number, label: string) => {
    setStreetView({ lat, lng, label });
  }, []);

  // Mini-map click → snap to nearest location
  const handleTeleport = useCallback((lat: number, lng: number) => {
    const nearest = findNearest(lat, lng, locations);
    if (nearest) {
      setStreetView({ lat: nearest.lat, lng: nearest.lng, label: nearest.label });
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [locations]);

  // Pin click → jump to pin's location, face back toward where we just were
  const handlePinClick = useCallback((lat: number, lng: number, label: string) => {
    const heading = streetView
      ? computeHeading(lat, lng, streetView.lat, streetView.lng)
      : 0;
    setStreetView({ lat, lng, label, heading });
  }, [streetView]);

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
          <StreetViewScene
            lat={streetView.lat}
            lng={streetView.lng}
            heading={streetView.heading}
            theme={theme}
            locations={locations}
            showPins={showPins}
            onPinClick={handlePinClick}
          />

          {/* Top header overlay */}
          <StreetViewHeader
            location={streetView}
            theme={theme}
            showPins={showPins}
            onClose={closeStreetView}
            onToggleTheme={toggleTheme}
            onTogglePins={() => setShowPins(v => !v)}
          />

          {/* Mini heatmap in bottom-right corner */}
          <MiniMap
            locations={locations}
            settings={settings}
            theme={theme}
            focusLat={streetView.lat}
            focusLng={streetView.lng}
            onTeleport={handleTeleport}
            onExpand={closeStreetView}
          />
        </div>
      )}
    </div>
  );
}
