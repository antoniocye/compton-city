"use client";

import { useState, useEffect } from "react";
import { Theme } from "@/lib/types";

export interface StreetViewLocation {
  lat: number;
  lng: number;
  label: string;
}

interface StreetViewPanelProps {
  location: StreetViewLocation | null;
  theme: Theme;
  onClose: () => void;
}

export default function StreetViewPanel({ location, theme, onClose }: StreetViewPanelProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const isOpen = location !== null;
  const isDark = theme === "dark";

  // Reset loading spinner whenever the location changes
  useEffect(() => {
    if (location) setIframeLoading(true);
  }, [location]);

  // Build the Google Maps embed URL targeting Street View
  const iframeSrc = location
    ? `https://maps.google.com/maps?q=${location.lat},${location.lng}&layer=c&cbll=${location.lat},${location.lng}&cbp=12,0,0,0,0&hl=en&output=embed`
    : "";

  const externalUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}&layer=c&cbll=${location.lat},${location.lng}`
    : "#";

  /* ── theme tokens ────────────────────────────────────────────────────── */
  const panelBg = isDark ? "bg-[#060a18]" : "bg-white";
  const borderT  = isDark ? "border-t border-cyan-500/15" : "border-t border-slate-200";
  const handle   = isDark ? "bg-white/10" : "bg-slate-300";
  const headBorder = isDark ? "border-b border-white/[0.05]" : "border-b border-slate-100";
  const iconWrap = isDark ? "bg-cyan-400/10 text-cyan-400" : "bg-sky-100 text-sky-500";
  const titleCls = isDark ? "text-slate-200" : "text-slate-800";
  const coordCls = isDark ? "text-slate-600" : "text-slate-400";
  const closeCls = isDark
    ? "text-slate-600 hover:text-slate-300 hover:bg-white/[0.06]"
    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100";
  const extBtn = isDark
    ? "text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/10 hover:border-cyan-500/45"
    : "text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300";
  const footerBg = isDark ? "bg-[#040812] border-t border-white/[0.04]" : "bg-slate-50 border-t border-slate-100";
  const footerText = isDark ? "text-slate-700" : "text-slate-400";
  const loadingBg = isDark ? "bg-[#060a18]" : "bg-slate-50";
  const spinBorder = isDark ? "border-cyan-400" : "border-sky-500";
  const spinTrack  = isDark ? "border-white/10" : "border-sky-200";
  const loadingText = isDark ? "text-slate-600" : "text-slate-400";

  return (
    <>
      {/* Backdrop dimmer — only shown when open */}
      {isOpen && (
        <div
          className="absolute inset-0 z-[25] pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(to top, rgba(4,8,20,0.35) 0%, transparent 45%)"
              : "linear-gradient(to top, rgba(0,0,0,0.12) 0%, transparent 45%)",
          }}
        />
      )}

      {/* Panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 flex flex-col transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${panelBg} ${borderT} ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "44vh", minHeight: "280px", maxHeight: "540px" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className={`w-9 h-[3px] rounded-full ${handle}`} />
        </div>

        {/* Header */}
        <div className={`flex items-center gap-3 px-4 py-2.5 shrink-0 ${headBorder}`}>
          {/* Location icon + info */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconWrap}`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate leading-tight ${titleCls}`}>
              {location?.label ?? "—"}
            </p>
            <p className={`text-[10px] font-mono mt-0.5 ${coordCls}`}>
              {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : ""}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${extBtn}`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Google Maps
            </a>

            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${closeCls}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Iframe area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Loading spinner */}
          {iframeLoading && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 ${loadingBg}`}>
              <div className="relative w-8 h-8">
                <div className={`absolute inset-0 rounded-full border-2 ${spinTrack}`} />
                <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${spinBorder}`} />
              </div>
              <p className={`text-xs ${loadingText}`}>Loading Street View…</p>
            </div>
          )}

          {location && (
            <iframe
              key={`${location.lat.toFixed(5)}-${location.lng.toFixed(5)}`}
              src={iframeSrc}
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Street View"
            />
          )}
        </div>

        {/* Footer — reserved for future annotation items */}
        <div className={`flex items-center gap-3 px-4 py-2.5 shrink-0 ${footerBg}`}>
          <div className={`flex items-center gap-1.5 ${footerText}`}>
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] tracking-wide">Street View — click anywhere on the map to explore</span>
          </div>
        </div>
      </div>
    </>
  );
}
