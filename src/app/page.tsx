"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ARTIFACT_TYPES,
  ArtifactType,
  HeatmapSettings,
  LocationSummary,
  Theme,
  StreetViewLocation,
} from "@/lib/types";
import { buildLocationSummaries, filterArtifactsByTypes, getLocationCenter } from "@/lib/artifacts";
import { SAMPLE_ARTIFACTS, SAMPLE_LOCATIONS } from "@/lib/sampleData";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Legend from "@/components/Legend";
import StreetViewHeader from "@/components/StreetViewHeader";
import MiniMap from "@/components/MiniMap";
import ArtifactPanel from "@/components/ArtifactPanel";

const HeatmapMap = dynamic(() => import("@/components/HeatmapMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
        <div className="absolute inset-0 rounded-full border-2 border-t-amber-400 animate-spin" />
      </div>
    </div>
  ),
});

const StreetViewScene = dynamic(() => import("@/components/StreetViewScene"), { ssr: false });

/* ── localStorage helpers ─────────────────────────────────────────── */
function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}
function lsSet<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

const DEFAULT_SETTINGS: HeatmapSettings = {
  radius: 30, intensity: 1.5, opacity: 0.85, colorScheme: "fire",
};

/* ── Geometry helpers ─────────────────────────────────────────────── */
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeHeading(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const φ1 = (fromLat * Math.PI) / 180, φ2 = (toLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function findNearestSummary(lat: number, lng: number, summaries: LocationSummary[]) {
  if (!summaries.length) return null;
  let best = summaries[0];
  let bestD = distanceM(lat, lng, ...Object.values(getLocationCenter(best.location)) as [number, number]);
  for (let i = 1; i < summaries.length; i++) {
    const c = getLocationCenter(summaries[i].location);
    const d = distanceM(lat, lng, c.lat, c.lng);
    if (d < bestD) { bestD = d; best = summaries[i]; }
  }
  return best;
}

function resolveStreetView(summary: LocationSummary, heading?: number): StreetViewLocation {
  const { lat, lng } = getLocationCenter(summary.location);
  return { locationId: summary.location.id, lat, lng, label: summary.location.name, artifactCount: summary.artifactCount, heading };
}

/* ── Component ────────────────────────────────────────────────────── */
export default function Home() {
  // ── Persisted state ──────────────────────────────────────────────
  // Always initialise with defaults so server and client render identical HTML
  // (avoids hydration mismatch). We load localStorage values in a single
  // useEffect after mount, guarded by persistReady so defaults never
  // overwrite already-stored values.
  const [settings, setSettings] = useState<HeatmapSettings>(DEFAULT_SETTINGS);
  const [theme,    setTheme]    = useState<Theme>("dark");
  const [autoplay, setAutoplay] = useState(true);
  const persistReady = useRef(false);

  // Load from localStorage once after hydration
  useEffect(() => {
    setSettings(lsGet("compton-settings", DEFAULT_SETTINGS));
    setTheme(lsGet<Theme>("compton-theme", "dark"));
    setAutoplay(lsGet("compton-autoplay", true));
    persistReady.current = true;
  }, []);

  // Persist changes — skip until after load so defaults never clobber stored values
  useEffect(() => { if (persistReady.current) lsSet("compton-settings", settings); }, [settings]);
  useEffect(() => { if (persistReady.current) lsSet("compton-theme",    theme);    }, [theme]);
  useEffect(() => { if (persistReady.current) lsSet("compton-autoplay", autoplay); }, [autoplay]);

  // ── Ephemeral state ───────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [streetView, setStreetView]         = useState<StreetViewLocation | null>(null);
  const [activeTypes, setActiveTypes]       = useState<ArtifactType[]>(ARTIFACT_TYPES);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    SAMPLE_LOCATIONS[0]?.id ?? null
  );
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    SAMPLE_ARTIFACTS[0]?.id ?? null
  );
  const streetViewRef = useRef<StreetViewLocation | null>(null);

  // ── Derived data ──────────────────────────────────────────────────
  const filteredArtifacts = useMemo(
    () => filterArtifactsByTypes(SAMPLE_ARTIFACTS, activeTypes),
    [activeTypes]
  );
  const summaries = useMemo(
    () => buildLocationSummaries(SAMPLE_LOCATIONS, filteredArtifacts),
    [filteredArtifacts]
  );
  const currentSummary = useMemo(
    () => selectedLocationId
      ? summaries.find((s) => s.location.id === selectedLocationId) ?? null
      : null,
    [summaries, selectedLocationId]
  );

  // ── Side effects ──────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark",  theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => { streetViewRef.current = streetView; }, [streetView]);

  useEffect(() => {
    if (!summaries.length) {
      setSelectedLocationId(null); setSelectedArtifactId(null); return;
    }
    if (!selectedLocationId) { setSelectedArtifactId(null); return; }
    const s = summaries.find((e) => e.location.id === selectedLocationId);
    if (!s) {
      setSelectedLocationId(summaries[0].location.id);
      setSelectedArtifactId(summaries[0].artifacts[0]?.id ?? null);
      return;
    }
    if (!selectedArtifactId || !s.artifacts.some((a) => a.id === selectedArtifactId)) {
      setSelectedArtifactId(s.artifacts[0]?.id ?? null);
    }
  }, [summaries, selectedLocationId, selectedArtifactId]);

  // ── Callbacks ─────────────────────────────────────────────────────
  const toggleTheme    = useCallback(() => setTheme((t) => t === "dark" ? "light" : "dark"), []);
  const closeStreetView = useCallback(() => setStreetView(null), []);

  const selectSummary = useCallback((s: LocationSummary | null) => {
    setSelectedLocationId(s?.location.id ?? null);
    setSelectedArtifactId(s?.artifacts[0]?.id ?? null);
  }, []);

  const handleToggleType = useCallback((type: ArtifactType) => {
    setActiveTypes((cur) => {
      if (cur.includes(type)) return cur.length === 1 ? cur : cur.filter((t) => t !== type);
      return [...cur, type];
    });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    const nearest = findNearestSummary(lat, lng, summaries);
    if (nearest) { selectSummary(nearest); setStreetView(resolveStreetView(nearest)); }
    else { setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }); }
  }, [selectSummary, summaries]);

  const handleLocationClick = useCallback((locationId: string) => {
    const s = summaries.find((e) => e.location.id === locationId);
    if (!s) return;
    selectSummary(s);
    setStreetView(resolveStreetView(s));
  }, [selectSummary, summaries]);

  const handleTeleport = useCallback((lat: number, lng: number) => {
    const nearest = findNearestSummary(lat, lng, summaries);
    if (nearest) { selectSummary(nearest); setStreetView(resolveStreetView(nearest)); }
    else { setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }); }
  }, [selectSummary, summaries]);

  const handlePinClick = useCallback((locationId: string, lat: number, lng: number, label: string) => {
    const s = summaries.find((e) => e.location.id === locationId) ?? null;
    if (s) selectSummary(s);
    const cur = streetViewRef.current;
    const heading = cur ? computeHeading(cur.lat, cur.lng, lat, lng) : 0;
    setStreetView({ locationId, lat, lng, label, heading, artifactCount: s?.artifactCount });
  }, [selectSummary, summaries]);

  const inStreetView = streetView !== null;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"}`}>

      {/* Heatmap */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${theme === "light" ? "light" : ""} ${
        inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}>
        <HeatmapMap
          summaries={summaries} settings={settings} theme={theme}
          onMapClick={handleMapClick} onLocationClick={handleLocationClick}
        />
      </div>

      {/* Regular UI */}
      <div className={`transition-opacity duration-300 ${inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Header
          locationCount={summaries.length}
          artifactCount={filteredArtifacts.length}
          theme={theme}
          onToggleTheme={toggleTheme}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <Sidebar
          settings={settings} activeTypes={activeTypes} isOpen={sidebarOpen}
          theme={theme} autoplay={autoplay}
          onToggleType={handleToggleType} onUpdateSettings={setSettings}
          onToggleAutoplay={() => setAutoplay((v) => !v)}
        />
        <Legend colorScheme={settings.colorScheme} theme={theme} activeTypes={activeTypes} />

      </div>

      {/* Street View */}
      {inStreetView && streetView && (
        <div className="absolute inset-0 z-10">
          <StreetViewScene
            lat={streetView.lat} lng={streetView.lng}
            theme={theme} summaries={summaries} onPinClick={handlePinClick}
          />
          <StreetViewHeader theme={theme} onClose={closeStreetView} />
          <ArtifactPanel
            summary={currentSummary}
            selectedArtifactId={selectedArtifactId}
            theme={theme}
            autoplay={autoplay}
            className="absolute bottom-5 left-5 z-20 w-[min(360px,calc(100vw-18rem))] max-h-[min(56vh,520px)]"
            onSelectArtifact={(id) => setSelectedArtifactId(id)}
          />
          <MiniMap
            summaries={summaries} settings={settings} theme={theme}
            focusLat={streetView.lat} focusLng={streetView.lng}
            onTeleport={handleTeleport} onExpand={closeStreetView}
          />
        </div>
      )}
    </div>
  );
}
