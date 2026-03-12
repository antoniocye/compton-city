"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Theme, Location } from "@/lib/types";

declare global {
  interface Window { gm_authFailure?: () => void }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loaderInstance: Loader | null = null;
function getLoader() {
  if (!loaderInstance) loaderInstance = new Loader({ apiKey: API_KEY, version: "weekly" });
  return loaderInstance;
}

type SceneState = "loading" | "ready" | "no-coverage" | "no-key" | "auth-error" | "error";

interface Props {
  lat: number;
  lng: number;
  /** Initial camera heading (degrees). Passed when teleporting to a pin so the
   *  panorama opens facing back toward the previous location. */
  heading?: number;
  theme: Theme;
  locations: Location[];
  showPins: boolean;
  onPinClick?: (lat: number, lng: number, label: string) => void;
}

/* ── Distance → scale ─────────────────────────────────────────────── */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Smooth inverse-proportion scale:
 *   < 20 m  → 1.0  (full size)
 *   ~200 m  → 0.47
 *   ~800 m  → 0.18 (minimum threshold)
 *   > ~850m → hidden (returns 0)
 */
function distanceToScale(metres: number): number {
  const s = 1 / (1 + metres / 180);
  return s < 0.18 ? 0 : s;
}

/* ── Inject keyframe animation once ───────────────────────────────── */
let animInjected = false;
function ensureAnimation() {
  if (animInjected || typeof document === "undefined") return;
  animInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes svFloat {
      0%,100% { transform: translate(-50%,-100%) translateY(0px); }
      50%      { transform: translate(-50%,-100%) translateY(-7px); }
    }
    @keyframes svPulse {
      0%,100% { box-shadow: 0 0 0 3px var(--pin-ring), 0 4px 16px rgba(0,0,0,.5); }
      50%      { box-shadow: 0 0 0 7px var(--pin-ring), 0 4px 20px rgba(0,0,0,.6); }
    }
  `;
  document.head.appendChild(s);
}

/* ── Build the pin DOM element ─────────────────────────────────────── */
function makePinEl(label: string, isDark: boolean): HTMLDivElement {
  ensureAnimation();
  const ring  = isDark ? "rgba(34,211,238,0.35)"  : "rgba(2,132,199,0.3)";
  const dot   = isDark ? "#22d3ee"                 : "#0284c7";
  const chipBg= isDark ? "rgba(7,12,26,0.93)"      : "rgba(255,255,255,0.96)";
  const chipTx= isDark ? "#f1f5f9"                 : "#0f172a";
  const chipBr= isDark ? "rgba(34,211,238,0.35)"   : "rgba(2,132,199,0.3)";

  const el = document.createElement("div");
  el.style.cssText = `
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
    z-index: 100;
    transform-origin: bottom center;
    transition: transform 0.2s ease, opacity 0.2s ease;
  `;
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        background:${chipBg};color:${chipTx};
        border:1px solid ${chipBr};
        border-radius:10px;padding:5px 11px;
        font-size:12px;font-weight:700;
        font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
        white-space:nowrap;letter-spacing:-.01em;
        backdrop-filter:blur(14px);
        box-shadow:0 6px 28px rgba(0,0,0,.55);
        user-select:none;-webkit-user-select:none;
      ">${label}</div>
      <div style="
        width:1.5px;height:22px;
        background:linear-gradient(to bottom,${dot},transparent);
      "></div>
      <div style="
        width:13px;height:13px;border-radius:50%;
        background:${dot};border:2.5px solid #fff;
        --pin-ring:${ring};
        animation:svPulse 2.8s ease-in-out infinite;
      "></div>
    </div>`;
  return el;
}

/* ── OverlayView subclass ──────────────────────────────────────────── */
class StreetViewPin {
  private overlay: google.maps.OverlayView;
  readonly el: HTMLDivElement;

  constructor(
    pos: google.maps.LatLng,
    label: string,
    isDark: boolean,
    panorama: google.maps.StreetViewPanorama,
    container: HTMLDivElement,
    onPinClick?: (lat: number, lng: number, label: string) => void
  ) {
    this.el = makePinEl(label, isDark);
    const el = this.el;

    if (onPinClick) {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onPinClick(pos.lat(), pos.lng(), label);
      });
    }

    const OV = (window as unknown as { google: typeof google }).google.maps.OverlayView;

    class PinOverlay extends OV {
      onAdd() {
        this.getPanes()!.overlayMouseTarget.appendChild(el);
      }
      draw() {
        const proj = this.getProjection();
        if (!proj) return;
        const px = proj.fromLatLngToContainerPixel(pos);
        if (!px) { el.style.visibility = "hidden"; return; }

        const w = container.offsetWidth;
        const h = container.offsetHeight;

        // ── Distance-based scale ───────────────────────────────────
        const panoPos = (this.getMap() as google.maps.StreetViewPanorama)?.getPosition();
        let scale = 1;
        let dist  = 0;
        if (panoPos) {
          dist  = haversineM(panoPos.lat(), panoPos.lng(), pos.lat(), pos.lng());
          scale = distanceToScale(dist);
          if (scale === 0) { el.style.visibility = "hidden"; return; }
        }

        // ── Viewport culling (behind camera / way off-screen) ────
        if (px.x < -300 || px.x > w + 300 || px.y < -300 || px.y > h + 300) {
          el.style.visibility = "hidden";
          return;
        }

        // ── Ground-level hide (no dynamic pitch math → no wobble) ──
        // fromLatLngToContainerPixel gives the physically correct 3D position.
        // We simply hide distant pins that project into the lower ~32% of the
        // frame (road surface when looking level). The raw projected Y is used
        // as-is — no clamping, no horizon tracking — so pins don't move as
        // the user tilts the camera up/down beyond what 3D projection dictates.
        if (dist > 20 && px.y > h * 0.68) {
          el.style.visibility = "hidden";
          return;
        }
        const anchorY = px.y;

        // ── Position + scale + opacity ────────────────────────────
        el.style.visibility = "visible";
        el.style.left      = `${px.x}px`;
        el.style.top       = `${anchorY}px`;
        el.style.transform = `scale(${scale})`;
        el.style.opacity   = String(Math.min(1, scale * 1.4));
      }
      onRemove() { el.remove(); }
    }

    this.overlay = new PinOverlay();
    this.overlay.setMap(panorama);
  }

  setVisible(v: boolean) {
    this.el.style.display = v ? "" : "none";
  }

  remove() {
    this.overlay.setMap(null);
  }
}

/* ── Main component ────────────────────────────────────────────────── */
export default function StreetViewScene({ lat, lng, heading, theme, locations, showPins, onPinClick }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const panoramaRef   = useRef<google.maps.StreetViewPanorama | null>(null);
  const pinsRef       = useRef<StreetViewPin[]>([]);
  const [state, setState] = useState<SceneState>("loading");
  const isDark = theme === "dark";

  /* ── Mount panorama ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!API_KEY) { setState("no-key"); return; }
    if (!containerRef.current) return;
    setState("loading");

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
            setState("no-coverage"); return;
          }
          const pano =           new StreetViewPanorama(containerRef.current!, {
            position:              data!.location!.latLng!,
            pov:                   { heading: heading ?? 0, pitch: 0 },
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
          panoramaRef.current = pano;

          pano.addListener("status_changed", () => {
            buildPins(pano, locations, isDark, showPins, onPinClick);
          });
          setState("ready");
        });
      };
      tryRadius(80, 500);
    }).catch(() => setState("error"));

    return () => {
      pinsRef.current.forEach(p => p.remove());
      pinsRef.current = [];
      panoramaRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  /* ── Sync pin visibility ─────────────────────────────────────────── */
  useEffect(() => {
    pinsRef.current.forEach(p => p.setVisible(showPins));
  }, [showPins]);

  /* ── Build / rebuild pins ────────────────────────────────────────── */
  function buildPins(
    pano: google.maps.StreetViewPanorama,
    locs: Location[],
    dark: boolean,
    visible: boolean,
    clickCb?: (lat: number, lng: number, label: string) => void
  ) {
    pinsRef.current.forEach(p => p.remove());
    pinsRef.current = [];
    if (!containerRef.current) return;
    const cont = containerRef.current;
    const gmLatLng = (window as unknown as { google: typeof google }).google.maps.LatLng;
    locs.forEach(loc => {
      const posObj = new gmLatLng(loc.lat, loc.lng);
      const pin = new StreetViewPin(posObj, loc.label, dark, pano, cont, clickCb);
      if (!visible) pin.setVisible(false);
      pinsRef.current.push(pin);
    });
  }

  /* ── Shared tokens ───────────────────────────────────────────────── */
  const bg   = isDark ? "bg-[#060a18]" : "bg-slate-100";
  const txt  = isDark ? "text-slate-200" : "text-slate-700";
  const sub  = isDark ? "text-slate-500" : "text-slate-400";
  const code = isDark ? "bg-white/[0.06] text-cyan-300" : "bg-slate-200 text-sky-700";
  const link = "text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors";

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div className="flex items-start gap-3 text-left">
      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
        isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-sky-100 text-sky-600"}`}>{n}</span>
      <span className={`text-sm leading-relaxed ${sub}`}>{children}</span>
    </div>
  );

  if (state === "no-key") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="max-w-sm w-full text-center space-y-5 px-6">
        <KeyIcon color="amber" />
        <p className={`text-base font-semibold ${txt}`}>API key not set</p>
        <p className={`text-sm ${sub}`}>
          Add your key to <code className={`text-xs px-1.5 py-0.5 rounded ${code}`}>.env.local</code> and restart:
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

  if (state === "auth-error") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="max-w-md w-full space-y-5 px-6">
        <div className="text-center"><KeyIcon color="red" />
          <p className={`text-base font-semibold mt-4 ${txt}`}>InvalidKeyMapError</p>
          <p className={`text-sm mt-1 ${sub}`}>Your key was rejected. Work through these steps:</p>
        </div>
        <div className="space-y-3">
          <Step n={1}><a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className={link}>Maps JavaScript API</a> → click <strong className={txt}>Enable</strong>.</Step>
          <Step n={2}><a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className={link}>Billing</a> → link a billing account. <span className="opacity-70">(Free $200/month credit — you won&apos;t be charged for normal use.)</span></Step>
          <Step n={3}><a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer" className={link}>Credentials</a> → your key → <strong className={txt}>API restrictions</strong>: select &ldquo;Don&apos;t restrict&rdquo; or add Maps JavaScript API.</Step>
          <Step n={4}><strong className={txt}>Application restrictions</strong>: allow <code className={`text-xs px-1 py-0.5 rounded ${code}`}>localhost</code> or set to None for dev.</Step>
        </div>
        <p className={`text-xs text-center ${sub}`}>After saving, hard-refresh (<kbd className={`px-1 py-0.5 rounded text-[10px] ${code}`}>Ctrl+Shift+R</kbd>).</p>
      </div>
    </div>
  );

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
          <p className={`text-sm ${sub}`}>No imagery available within 500m.</p>
          <a href={ext} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm ${link}`}>Open in Google Maps →</a>
        </div>
      </div>
    );
  }

  if (state === "error") return (
    <div className={`w-full h-full flex items-center justify-center ${bg}`}>
      <div className="text-center space-y-2 px-6">
        <p className={`text-sm font-semibold ${txt}`}>Failed to load Street View</p>
        <p className={`text-xs ${sub}`}>Check the browser console for details, then hard-refresh.</p>
      </div>
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

function KeyIcon({ color }: { color: "amber" | "red" }) {
  const ring = color === "amber" ? "bg-amber-400/10 border-amber-400/25" : "bg-red-500/10 border-red-500/25";
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
