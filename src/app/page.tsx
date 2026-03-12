"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ARTIFACT_TYPES,
  ArtifactType,
  CulturalArtifact,
  HeatmapSettings,
  LocationNode,
  LocationSummary,
  NewArtifactInput,
  Theme,
  StreetViewLocation,
} from "@/lib/types";
import { buildLocationSummaries, filterArtifactsByTypes } from "@/lib/artifacts";
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
    <div className="w-full h-full flex items-center justify-center bg-[#06091a]">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/15" />
        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
      </div>
    </div>
  ),
});

const StreetViewScene = dynamic(() => import("@/components/StreetViewScene"), { ssr: false });

let nextLocationId = SAMPLE_LOCATIONS.length + 1;
let nextArtifactId = SAMPLE_ARTIFACTS.length + 1;

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

/** Returns the closest mapped location summary to (lat, lng) */
function findNearestSummary(
  lat: number,
  lng: number,
  summaries: LocationSummary[]
): LocationSummary | null {
  if (!summaries.length) return null;
  let best = summaries[0];
  let bestD = distanceM(lat, lng, best.location.lat, best.location.lng);
  for (let i = 1; i < summaries.length; i++) {
    const d = distanceM(
      lat,
      lng,
      summaries[i].location.lat,
      summaries[i].location.lng
    );
    if (d < bestD) {
      bestD = d;
      best = summaries[i];
    }
  }
  return best;
}

function resolveStreetView(summary: LocationSummary, heading?: number): StreetViewLocation {
  return {
    locationId: summary.location.id,
    lat: summary.location.lat,
    lng: summary.location.lng,
    label: summary.location.name,
    artifactCount: summary.artifactCount,
    heading,
  };
}

function findMatchingLocation(
  locations: LocationNode[],
  input: NewArtifactInput
): LocationNode | null {
  const normalized = input.locationName.trim().toLowerCase();
  let nearest: LocationNode | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    const sameName = location.name.trim().toLowerCase() === normalized;
    const distance = distanceM(input.lat, input.lng, location.lat, location.lng);
    if (sameName && distance < 100) return location;
    if (distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= 35 ? nearest : null;
}

export default function Home() {
  const [locations, setLocations] = useState<LocationNode[]>(SAMPLE_LOCATIONS);
  const [artifacts, setArtifacts] = useState<CulturalArtifact[]>(SAMPLE_ARTIFACTS);
  const [settings, setSettings] = useState<HeatmapSettings>({
    radius: 30,
    intensity: 1.5,
    opacity: 0.85,
    colorScheme: "fire",
  });
  const [theme, setTheme] = useState<Theme>("dark");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [streetView, setStreetView] = useState<StreetViewLocation | null>(null);
  const [showPins, setShowPins] = useState(true);
  const [activeTypes, setActiveTypes] = useState<ArtifactType[]>(ARTIFACT_TYPES);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    SAMPLE_LOCATIONS[0]?.id ?? null
  );
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    SAMPLE_ARTIFACTS[0]?.id ?? null
  );

  const filteredArtifacts = useMemo(
    () => filterArtifactsByTypes(artifacts, activeTypes),
    [artifacts, activeTypes]
  );
  const summaries = useMemo(
    () => buildLocationSummaries(locations, filteredArtifacts),
    [locations, filteredArtifacts]
  );
  const currentSummary = useMemo(
    () =>
      selectedLocationId
        ? summaries.find((summary) => summary.location.id === selectedLocationId) ?? null
        : null,
    [summaries, selectedLocationId]
  );
  const totalWeight = useMemo(
    () => filteredArtifacts.reduce((sum, artifact) => sum + artifact.heatWeight, 0),
    [filteredArtifacts]
  );

  // Sync dark/light class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark",  theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    if (!summaries.length) {
      setSelectedLocationId(null);
      setSelectedArtifactId(null);
      return;
    }
    if (!selectedLocationId) {
      if (selectedArtifactId) setSelectedArtifactId(null);
      return;
    }
    const summary = summaries.find((entry) => entry.location.id === selectedLocationId);
    if (!summary) {
      setSelectedLocationId(summaries[0].location.id);
      setSelectedArtifactId(summaries[0].artifacts[0]?.id ?? null);
      return;
    }
    if (!selectedArtifactId || !summary.artifacts.some((artifact) => artifact.id === selectedArtifactId)) {
      setSelectedArtifactId(summary.artifacts[0]?.id ?? null);
    }
  }, [summaries, selectedLocationId, selectedArtifactId]);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    []
  );
  const closeStreetView = useCallback(() => setStreetView(null), []);

  const selectSummary = useCallback((summary: LocationSummary | null) => {
    setSelectedLocationId(summary?.location.id ?? null);
    setSelectedArtifactId(summary?.artifacts[0]?.id ?? null);
  }, []);

  const handleAddArtifact = useCallback((input: NewArtifactInput) => {
    const existing = findMatchingLocation(locations, input);
    const location = existing ?? {
      id: `loc-u${nextLocationId++}`,
      lat: input.lat,
      lng: input.lng,
      name: input.locationName,
    };
    const artifact: CulturalArtifact = {
      id: `art-u${nextArtifactId++}`,
      locationId: location.id,
      type: input.type,
      title: input.title,
      creator: input.creator,
      sourceTitle: input.sourceTitle,
      year: input.year,
      caption: input.caption,
      description: input.description,
      heatWeight: input.heatWeight,
      resource: input.resource,
    };

    if (!existing) {
      setLocations((current) => [...current, location]);
    }
    setArtifacts((current) => [...current, artifact]);
    setSidebarOpen(true);
    setSelectedLocationId(location.id);
    setSelectedArtifactId(artifact.id);
  }, [locations]);

  const handleRemoveArtifact = useCallback((id: string) => {
    setArtifacts((currentArtifacts) => {
      const removedArtifact = currentArtifacts.find((artifact) => artifact.id === id);
      const remainingArtifacts = currentArtifacts.filter((artifact) => artifact.id !== id);

      if (removedArtifact) {
        const remainingLocationIds = new Set(
          remainingArtifacts.map((artifact) => artifact.locationId)
        );
        setLocations((currentLocations) =>
          currentLocations.filter((location) => remainingLocationIds.has(location.id))
        );
      }

      return remainingArtifacts;
    });
  }, []);

  const handleToggleType = useCallback((type: ArtifactType) => {
    setActiveTypes((current) => {
      if (current.includes(type)) {
        return current.length === 1 ? current : current.filter((entry) => entry !== type);
      }
      return [...current, type];
    });
  }, []);

  // General map click → fill form + snap street view to nearest location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPending({ lat, lng });
    setSidebarOpen(true);
    const nearest = findNearestSummary(lat, lng, summaries);
    if (nearest) {
      selectSummary(nearest);
      setStreetView(resolveStreetView(nearest));
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [selectSummary, summaries]);

  // Dot click → open street view with known label (exact position)
  const handleLocationClick = useCallback((locationId: string) => {
    const summary = summaries.find((entry) => entry.location.id === locationId);
    if (!summary) return;
    setSidebarOpen(true);
    selectSummary(summary);
    setStreetView(resolveStreetView(summary));
  }, [selectSummary, summaries]);

  // Mini-map click → snap to nearest location
  const handleTeleport = useCallback((lat: number, lng: number) => {
    const nearest = findNearestSummary(lat, lng, summaries);
    if (nearest) {
      selectSummary(nearest);
      setStreetView(resolveStreetView(nearest));
    } else {
      setStreetView({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  }, [selectSummary, summaries]);

  // Artifact marker click → jump to that location while keeping visual direction consistent
  const handlePinClick = useCallback((
    locationId: string,
    lat: number,
    lng: number,
    label: string
  ) => {
    const summary = summaries.find((entry) => entry.location.id === locationId) ?? null;
    if (summary) selectSummary(summary);
    const heading = streetView
      ? computeHeading(streetView.lat, streetView.lng, lat, lng)
      : 0;
    setStreetView({
      locationId,
      lat,
      lng,
      label,
      heading,
      artifactCount: summary?.artifactCount,
    });
  }, [selectSummary, streetView, summaries]);

  const handleSelectArtifact = useCallback((locationId: string, artifactId: string) => {
    setSelectedLocationId(locationId);
    setSelectedArtifactId(artifactId);
  }, []);

  const handleClearAll = useCallback(() => {
    setLocations([]);
    setArtifacts([]);
    setSelectedLocationId(null);
    setSelectedArtifactId(null);
    setStreetView(null);
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
          summaries={summaries}
          settings={settings}
          theme={theme}
          onMapClick={handleMapClick}
          onLocationClick={handleLocationClick}
        />
      </div>

      {/* ── Regular UI (header / sidebar / legend) ── */}
      <div className={`transition-opacity duration-300 ${inStreetView ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Header
          locationCount={summaries.length}
          artifactCount={filteredArtifacts.length}
          totalWeight={totalWeight}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClearAll={handleClearAll}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />
        <Sidebar
          summaries={summaries}
          artifacts={filteredArtifacts}
          selectedLocationId={selectedLocationId}
          selectedArtifactId={selectedArtifactId}
          settings={settings}
          activeTypes={activeTypes}
          isOpen={sidebarOpen}
          theme={theme}
          pendingCoords={pending}
          onAddArtifact={handleAddArtifact}
          onRemoveArtifact={handleRemoveArtifact}
          onSelectLocation={(locationId) => {
            const summary = summaries.find((entry) => entry.location.id === locationId) ?? null;
            selectSummary(summary);
          }}
          onSelectArtifact={handleSelectArtifact}
          onToggleType={handleToggleType}
          onUpdateSettings={setSettings}
          onClearPending={() => setPending(null)}
        />
        <Legend colorScheme={settings.colorScheme} theme={theme} activeTypes={activeTypes} />
        <ArtifactPanel
          summary={currentSummary}
          selectedArtifactId={selectedArtifactId}
          theme={theme}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[min(520px,calc(100vw-3rem))]"
          onSelectArtifact={(artifactId) => setSelectedArtifactId(artifactId)}
          onClose={() => {
            setSelectedLocationId(null);
            setSelectedArtifactId(null);
          }}
        />
      </div>

      {/* ── Street View mode ── */}
      {inStreetView && streetView && (
        <div className="absolute inset-0 z-10">
          {/* Full-screen panorama */}
          <StreetViewScene
            lat={streetView.lat}
            lng={streetView.lng}
            theme={theme}
            summaries={summaries}
            showPins={showPins}
            selectedLocationId={selectedLocationId}
            onPinClick={handlePinClick}
          />

          {/* Top header overlay */}
          <StreetViewHeader
            location={streetView}
            theme={theme}
            showPins={showPins}
            artifactCount={currentSummary?.artifactCount ?? streetView.artifactCount ?? 0}
            activeTypes={activeTypes}
            onClose={closeStreetView}
            onToggleTheme={toggleTheme}
            onTogglePins={() => setShowPins(v => !v)}
          />

          <ArtifactPanel
            summary={currentSummary}
            selectedArtifactId={selectedArtifactId}
            theme={theme}
            className="absolute bottom-6 left-6 z-20 w-[min(460px,calc(100vw-18rem))]"
            onSelectArtifact={(artifactId) => setSelectedArtifactId(artifactId)}
          />

          {/* Mini heatmap in bottom-right corner */}
          <MiniMap
            summaries={summaries}
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
