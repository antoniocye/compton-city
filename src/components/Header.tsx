"use client";

import { Theme } from "@/lib/types";

interface HeaderProps {
  locationCount: number;
  artifactCount: number;
  theme: Theme;
  onToggleTheme: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  locationCount, artifactCount,
  theme, onToggleTheme, sidebarOpen, onToggleSidebar,
}: HeaderProps) {
  const isDark = theme === "dark";

  // Chips float over the map — keep a touch of blur so the map bleeds through subtly,
  // but backgrounds are near-opaque so text is always readable
  const chip = isDark
    ? "bg-zinc-900/95 border-zinc-700 text-zinc-100 shadow-lg shadow-black/40"
    : "bg-white/97 border-zinc-200 text-zinc-900 shadow-md shadow-black/10";

  const btn = isDark
    ? "bg-zinc-900/95 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 shadow-lg shadow-black/40"
    : "bg-white/97 border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 shadow-md shadow-black/10";

  const muted = isDark ? "text-zinc-500" : "text-zinc-400";
  const amber = isDark ? "text-amber-400" : "text-amber-600";

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">

      {/* Brand */}
      <div className="pointer-events-auto">
        <div className={`border backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all ${chip}`}>
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2 shrink-0">
              <div className={`absolute inset-0 rounded-full opacity-40 animate-ping ${isDark ? "bg-amber-400" : "bg-amber-500"}`} />
              <div className={`absolute inset-0 rounded-full ${isDark ? "bg-amber-400" : "bg-amber-500"}`} />
            </div>
            <span className="font-bold text-sm">Compton</span>
            <span className={`font-bold text-sm ${amber}`}>Heat</span>
          </div>
          <p className={`text-[9px] tracking-[0.2em] uppercase mt-0.5 ${muted}`}>Cultural Artifact Map</p>
        </div>
      </div>

      {/* Stats + controls */}
      <div className="flex items-center gap-2 pointer-events-auto">

        <div className={`flex items-center gap-2 border backdrop-blur-sm rounded-xl px-3 py-2 transition-all ${chip}`}>
          <svg className={`w-3.5 h-3.5 shrink-0 ${amber}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{locationCount}</span>
          <span className={`text-xs ${muted}`}>locs</span>
        </div>

        <div className={`flex items-center gap-2 border backdrop-blur-sm rounded-xl px-3 py-2 transition-all ${chip}`}>
          <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19V6l12-2v13M9 19a2 2 0 11-4 0 2 2 0 014 0zm12-2a2 2 0 11-4 0 2 2 0 014 0zM9 10l12-2" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{artifactCount}</span>
          <span className={`text-xs ${muted}`}>artifacts</span>
        </div>

        {/* Settings */}
        <button onClick={onToggleSidebar}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-sm transition-all ${
            sidebarOpen
              ? isDark
                ? "bg-zinc-700 border-zinc-500 text-zinc-100"
                : "bg-zinc-100 border-zinc-400 text-zinc-800"
              : btn
          }`}
          title={sidebarOpen ? "Close settings" : "Settings"}>
          {/* Sliders / adjustments icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="4"  y1="6"  x2="20" y2="6"  />
            <line x1="4"  y1="12" x2="20" y2="12" />
            <line x1="4"  y1="18" x2="20" y2="18" />
            <circle cx="8"  cy="6"  r="2" fill="currentColor" stroke="none" />
            <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        </button>

        {/* Theme toggle */}
        <button onClick={onToggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-sm transition-all ${btn}`}
          title={isDark ? "Light mode" : "Dark mode"}>
          {isDark ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="4" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
