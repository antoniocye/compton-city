"use client";

import { Theme, StreetViewLocation } from "@/lib/types";

interface Props {
  location: StreetViewLocation;
  theme: Theme;
  onClose: () => void;
  onToggleTheme: () => void;
}

export default function StreetViewHeader({ location, theme, onClose, onToggleTheme }: Props) {
  const isDark = theme === "dark";

  const externalUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}&layer=c&cbll=${location.lat},${location.lng}`;

  const chipCls = isDark
    ? "bg-[#070c1a]/80 border-white/[0.07] text-slate-200 shadow-lg shadow-black/50"
    : "bg-white/90 border-black/[0.07] text-slate-800 shadow-lg shadow-black/15";

  const iconBtnCls = isDark
    ? "bg-[#070c1a]/80 border-white/[0.07] text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10"
    : "bg-white/90 border-black/[0.07] text-slate-500 hover:text-slate-800 hover:border-sky-400/50 hover:bg-sky-50";

  const extBtnCls = isDark
    ? "text-cyan-400 border-cyan-500/25 hover:bg-cyan-500/10 hover:border-cyan-500/45"
    : "text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300";

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Left: back button + location */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Back */}
        <button
          onClick={onClose}
          className={`flex items-center gap-2 h-9 px-3 rounded-xl border backdrop-blur-xl transition-all duration-200 text-xs font-semibold ${iconBtnCls}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Map
        </button>

        {/* Location chip */}
        <div className={`flex items-center gap-2.5 border backdrop-blur-xl rounded-2xl px-3.5 py-2 transition-all duration-300 ${chipCls}`}>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-400/12 text-cyan-400" : "bg-sky-100 text-sky-500"}`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight">{location.label}</p>
            <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Open in Google Maps */}
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border backdrop-blur-xl text-xs font-medium transition-all duration-150 ${extBtnCls}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Google Maps
        </a>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-xl transition-all duration-200 ${iconBtnCls}`}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="4" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
