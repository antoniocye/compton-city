"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import {
  Artifact,
  HeatmapSettings,
  NewArtifact,
  Theme,
  StreetViewLocation,
} from "@/lib/types";
import { SAMPLE_ARTIFACTS } from "@/lib/sampleData";
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

let nextId = SAMPLE_ARTIFACTS.length + 1;

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

/** Returns the closest artifact in the list to (lat, lng) */
function findNearest(lat: number, lng: number, points: Artifact[]): Artifact | null {
  if (!points.length) return null;
  let best = points[0];
  let bestD = distanceM(lat, lng, best.location.lat, best.location.lng);
  for (let i = 1; i < points.length; i++) {
    const d = distanceM(lat, lng, points[i].location.lat, points[i].location.lng);
    if (d < bestD) { bestD = d; best = points[i]; }
  }
  return best;
}

function toStreetViewLocation(artifact: Artifact): StreetViewLocation {
  return {
    lat: artifact.location.lat,
    lng: artifact.location.lng,
    label: artifact.location.name,
    artifactId: artifact.id,
  };
}

export default function Home() {
  const [artifacts,    setArtifacts]    = useState<Artifact[]>(SAMPLE_ARTIFACTS);
  const [settings,     setSettings]     = useState<HeatmapSettings>({ radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire" });
  const [theme,        setTheme]        = useState<Theme>("dark");
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [pending,      setPending]      = useState<{ lat: number; lng: number } | null>(null);
  const [streetView,   setStreetView]   = useState<StreetViewLocation | null>(null);
  const [showArtifacts, setShowArtifacts] = useState(true);

  // Sync dark/light class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark",  theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggleTheme      = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  const closeStreetView  = useCallback(() => setStreetView(null), []);

  const handleAddArtifact = useCallback((artifact: NewArtifact) => {
    setArtifacts((current) => [...current, { ...artifact, id: `u${nextId++}` }]);
  }, []);
  const handleRemoveArtifact = useCallback((id: string) => {
    setArtifacts((current) => current.filter((artifact) => artifact.id !== id));
    setStreetView((current) => {
      if (!current || current.artifactId !== id) return current;
      return null;
    });
  }, []);

  // General map click → fill form + snap street view to nearest location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPending({ lat, lng });
    setSidebarOpen(true);
    const nearest = findNearest(lat, lng, artifacts);
    if (nearest) {
      setStreetView(toStreetViewLocation(nearest));
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [artifacts]);

  // Dot click → open street view with the selected artifact
  const handleArtifactClick = useCallback((artifactId: string) => {
    const artifact = artifacts.find((item) => item.id === artifactId);
    if (!artifact) return;
    setStreetView(toStreetViewLocation(artifact));
  }, [artifacts]);

  // Mini-map click → snap to nearest location
  const handleTeleport = useCallback((lat: number, lng: number) => {
    const nearest = findNearest(lat, lng, artifacts);
    if (nearest) {
      setStreetView(toStreetViewLocation(nearest));
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [artifacts]);

  // Marker click → jump to artifact location while preserving view continuity.
  const handleStreetViewArtifactClick = useCallback((artifactId: string) => {
    const artifact = artifacts.find((item) => item.id === artifactId);
    if (!artifact) return;
    const lat = artifact.location.lat;
    const lng = artifact.location.lng;
    const heading = streetView
      ? computeHeading(streetView.lat, streetView.lng, lat, lng)
      : 0;
    setStreetView({
      lat,
      lng,
      label: artifact.location.name,
      artifactId: artifact.id,
      heading,
    });
  }, [artifacts, streetView]);

  const inStreetView = streetView !== null;
  const activeArtifact = streetView?.artifactId
    ? artifacts.find((artifact) => artifact.id === streetView.artifactId) ?? null
    : null;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === "dark" ? "bg-[#06091a]" : "bg-slate-200"}`}>

      {/* ── Heatmap (always mounted, fades when street view is active) ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${theme === "light" ? "light" : ""} ${
          inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <HeatmapMap
          artifacts={artifacts}
          settings={settings}
          theme={theme}
          onMapClick={handleMapClick}
          onArtifactClick={handleArtifactClick}
        />
      </div>

      {/* ── Regular UI (header / sidebar / legend) ── */}
      <div className={`transition-opacity duration-300 ${inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Header
          artifacts={artifacts}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClearAll={() => setArtifacts([])}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
        <Sidebar
          artifacts={artifacts}
          settings={settings}
          isOpen={sidebarOpen}
          theme={theme}
          pendingCoords={pending}
          onAddArtifact={handleAddArtifact}
          onRemoveArtifact={handleRemoveArtifact}
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
            artifacts={artifacts}
            showArtifacts={showArtifacts}
            onArtifactClick={handleStreetViewArtifactClick}
          />

          {/* Top header overlay */}
          <StreetViewHeader
            location={streetView}
            artifact={activeArtifact}
            theme={theme}
            showArtifacts={showArtifacts}
            onClose={closeStreetView}
            onToggleTheme={toggleTheme}
            onToggleArtifacts={() => setShowArtifacts(v => !v)}
          />

          {/* Mini heatmap in bottom-right corner */}
          <MiniMap
            artifacts={artifacts}
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
