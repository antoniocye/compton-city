"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Theme } from "@/lib/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Singleton so the script is only ever injected once
let loaderInstance: Loader | null = null;
function getLoader() {
  if (!loaderInstance) loaderInstance = new Loader({ apiKey: API_KEY, version: "weekly" });
  return loaderInstance;
}

type SceneState = "loading" | "ready" | "no-coverage" | "no-key" | "error";

interface Props { lat: number; lng: number; theme: Theme }

export default function StreetViewScene({ lat, lng, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SceneState>("loading");
  const isDark = theme === "dark";

  useEffect(() => {
    if (!API_KEY) { setState("no-key"); return; }
    if (!containerRef.current) return;
    setState("loading");

    // v2 API uses importLibrary
    Promise.all([
      getLoader().importLibrary("maps"),
      getLoader().importLibrary("streetView"),
    ]).then(([, svLib]) => {
      const { StreetViewService, StreetViewStatus, StreetViewPanorama } =
        svLib as typeof google.maps;

      const svc = new StreetViewService();
      const tryRadius = (radius: number, fallback?: number) => {
        svc.getPanorama({ location: { lat, lng }, radius }, (data, status) => {
          if (status !== StreetViewStatus.OK || !containerRef.current) {
            if (fallback) {
              tryRadius(fallback);
            } else {
              setState("no-coverage");
            }
            return;
          }
          const pos = data!.location!.latLng!;
          new StreetViewPanorama(containerRef.current!, {
            position:               pos,
            pov:                    { heading: 0, pitch: 0 },
            zoom:                   0,
            addressControl:         false,
            fullscreenControl:      false,
            motionTracking:         false,
            motionTrackingControl:  false,
            enableCloseButton:      false,
            showRoadLabels:         true,
            linksControl:           true,
            panControl:             true,
            zoomControl:            false,
          });
          setState("ready");
        });
      };

      tryRadius(80, 500);
    }).catch(() => setState("error"));
  }, [lat, lng]);

  /* ── Non-panorama states ────────────────────────────────────────────── */
  const bg  = isDark ? "bg-[#060a18]" : "bg-slate-100";
  const txt = isDark ? "text-slate-300" : "text-slate-600";
  const sub = isDark ? "text-slate-600" : "text-slate-400";

  if (state === "no-key") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="max-w-sm text-center space-y-4 px-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <p className={`text-base font-semibold ${txt}`}>Google Maps API key needed</p>
        <p className={`text-sm leading-relaxed ${sub}`}>
          Street View requires a free Google Maps API key. Add it to{" "}
          <code className="text-cyan-400 text-xs bg-white/5 px-1.5 py-0.5 rounded">.env.local</code>:
        </p>
        <code className={`block text-xs font-mono text-left rounded-xl px-4 py-3 leading-loose ${isDark ? "bg-white/5 text-cyan-300" : "bg-slate-200 text-sky-700"}`}>
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
        </code>
        <a href="https://console.cloud.google.com/google/maps-apis/credentials"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
          Get a free key →
        </a>
      </div>
    </div>
  );

  if (state === "no-coverage") {
    const ext = `https://www.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}`;
    return (
      <div className={`w-full h-full flex items-center justify-center ${bg}`}>
        <div className="max-w-xs text-center space-y-4 px-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-400/10 border border-slate-500/20 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-base font-semibold ${txt}`}>No Street View here</p>
          <p className={`text-sm ${sub}`}>No imagery available within 500m of this location.</p>
          <a href={ext} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
            View in Google Maps →
          </a>
        </div>
      </div>
    );
  }

  if (state === "error") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <p className={`text-sm ${sub}`}>Failed to load Street View. Check your API key.</p>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {state === "loading" && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 ${bg}`}>
          <div className="relative w-10 h-10">
            <div className={`absolute inset-0 rounded-full border-2 ${isDark ? "border-white/10" : "border-sky-200"}`} />
            <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${isDark ? "border-cyan-400" : "border-sky-500"}`} />
          </div>
          <p className={`text-sm ${sub}`}>Stepping into the street…</p>
        </div>
      )}
    </div>
  );
}
