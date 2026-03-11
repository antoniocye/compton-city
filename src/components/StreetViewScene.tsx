"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Theme } from "@/lib/types";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loaderInstance: Loader | null = null;
function getLoader() {
  if (!loaderInstance) loaderInstance = new Loader({ apiKey: API_KEY, version: "weekly" });
  return loaderInstance;
}

type SceneState = "loading" | "ready" | "no-coverage" | "no-key" | "auth-error" | "error";

interface Props { lat: number; lng: number; theme: Theme }

export default function StreetViewScene({ lat, lng, theme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SceneState>("loading");
  const isDark = theme === "dark";

  useEffect(() => {
    if (!API_KEY) { setState("no-key"); return; }
    if (!containerRef.current) return;
    setState("loading");

    // Google Maps calls this global when the key is invalid / APIs not enabled
    window.gm_authFailure = () => setState("auth-error");

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
            if (fallback) { tryRadius(fallback); return; }
            setState("no-coverage");
            return;
          }
          new StreetViewPanorama(containerRef.current!, {
            position:              data!.location!.latLng!,
            pov:                   { heading: 0, pitch: 0 },
            zoom:                  0,
            addressControl:        false,
            fullscreenControl:     false,
            motionTracking:        false,
            motionTrackingControl: false,
            enableCloseButton:     false,
            showRoadLabels:        true,
            linksControl:          true,
            panControl:            true,
            zoomControl:           false,
          });
          setState("ready");
        });
      };
      tryRadius(80, 500);
    }).catch(() => setState("error"));
  }, [lat, lng]);

  /* ── Shared style tokens ─────────────────────────────────────────── */
  const bg   = isDark ? "bg-[#060a18]" : "bg-slate-100";
  const txt  = isDark ? "text-slate-200" : "text-slate-700";
  const sub  = isDark ? "text-slate-500" : "text-slate-400";
  const code = isDark ? "bg-white/[0.06] text-cyan-300" : "bg-slate-200 text-sky-700";
  const link = "text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors";

  /* ── Utility: step row ───────────────────────────────────────────── */
  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 text-left">
      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
        isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-sky-100 text-sky-600"
      }`}>{n}</span>
      <span className={`text-sm leading-relaxed ${sub}`}>{children}</span>
    </div>
  );

  /* ── no-key ─────────────────────────────────────────────────────── */
  if (state === "no-key") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="max-w-sm w-full text-center space-y-5 px-6">
        <KeyIcon color="amber" />
        <p className={`text-base font-semibold ${txt}`}>API key not set</p>
        <p className={`text-sm ${sub}`}>
          Add your key to <code className={`text-xs px-1.5 py-0.5 rounded ${code}`}>.env.local</code> and restart the dev server:
        </p>
        <pre className={`text-xs font-mono text-left rounded-xl px-4 py-3 leading-loose ${code}`}>
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
        </pre>
        <a href="https://console.cloud.google.com/google/maps-apis/credentials"
          target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${link}`}>
          Get a free key →
        </a>
      </div>
    </div>
  );

  /* ── auth-error (InvalidKeyMapError) ────────────────────────────── */
  if (state === "auth-error") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="max-w-md w-full space-y-5 px-6">
        <div className="text-center">
          <KeyIcon color="red" />
          <p className={`text-base font-semibold mt-4 ${txt}`}>InvalidKeyMapError</p>
          <p className={`text-sm mt-1 ${sub}`}>
            Your key is set but Google rejected it. Fix the key in Google Cloud Console:
          </p>
        </div>

        <div className="space-y-3">
          <Step n={1}>
            Open{" "}
            <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
              target="_blank" rel="noopener noreferrer" className={link}>
              Maps JavaScript API
            </a>{" "}
            and click <strong className={txt}>Enable</strong>.
          </Step>
          <Step n={2}>
            Open{" "}
            <a href="https://console.cloud.google.com/billing"
              target="_blank" rel="noopener noreferrer" className={link}>
              Billing
            </a>{" "}
            and make sure a billing account is linked to the project.{" "}
            <span className={sub}>(Google gives a $200/month free credit — no charge for normal use.)</span>
          </Step>
          <Step n={3}>
            Open{" "}
            <a href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank" rel="noopener noreferrer" className={link}>
              Credentials
            </a>
            , click your key → under <strong className={txt}>API restrictions</strong> select{" "}
            <strong className={txt}>Don&apos;t restrict key</strong> (or add Maps JavaScript API).
          </Step>
          <Step n={4}>
            Under <strong className={txt}>Application restrictions</strong>, make sure{" "}
            <code className={`text-xs px-1 py-0.5 rounded ${code}`}>localhost</code> is allowed (or set to None for dev).
          </Step>
        </div>

        <p className={`text-xs text-center ${sub}`}>
          After saving, hard-refresh the app (<kbd className={`px-1 py-0.5 rounded text-[10px] ${code}`}>Ctrl+Shift+R</kbd>).
        </p>
      </div>
    </div>
  );

  /* ── no-coverage ─────────────────────────────────────────────────── */
  if (state === "no-coverage") {
    const ext = `https://www.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}`;
    return (
      <div className={`w-full h-full flex items-center justify-center ${bg}`}>
        <div className="max-w-xs text-center space-y-4 px-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${isDark ? "bg-slate-700/30 border border-slate-600/30" : "bg-slate-200 border border-slate-300"}`}>
            <svg className={`w-7 h-7 ${isDark ? "text-slate-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-base font-semibold ${txt}`}>No Street View here</p>
          <p className={`text-sm ${sub}`}>No imagery available within 500m of this spot.</p>
          <a href={ext} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${link}`}>
            Open in Google Maps →
          </a>
        </div>
      </div>
    );
  }

  /* ── generic error ───────────────────────────────────────────────── */
  if (state === "error") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="text-center space-y-2 px-6">
        <p className={`text-sm font-semibold ${txt}`}>Failed to load Street View</p>
        <p className={`text-xs ${sub}`}>Check the browser console for details, then hard-refresh.</p>
      </div>
    </div>
  );

  /* ── panorama + loading overlay ─────────────────────────────────── */
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

function KeyIcon({ color }: { color: "amber" | "red" }) {
  const ring = color === "amber"
    ? "bg-amber-400/10 border-amber-400/25"
    : "bg-red-500/10 border-red-500/25";
  const icon = color === "amber" ? "text-amber-400" : "text-red-400";
  return (
    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${ring}`}>
      <svg className={`w-7 h-7 ${icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    </div>
  );
}
