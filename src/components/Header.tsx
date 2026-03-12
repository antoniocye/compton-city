"use client";

import { Theme } from "@/lib/types";

interface HeaderProps {
  locationCount: number;
  artifactCount: number;
  totalWeight: number;
  theme: Theme;
  onToggleTheme: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  locationCount, artifactCount, totalWeight,
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

        <div className={`flex items-center gap-2 border backdrop-blur-sm rounded-xl px-3 py-2 transition-all ${chip}`}>
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{totalWeight.toFixed(1)}</span>
          <span className={`text-xs ${muted}`}>heat</span>
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11.983 5.5a1.5 1.5 0 013.034 0l.173 1.21a1.5 1.5 0 001.133 1.24l1.182.295a1.5 1.5 0 01.72 2.495l-.83.896a1.5 1.5 0 000 2.043l.83.896a1.5 1.5 0 01-.72 2.495l-1.182.295a1.5 1.5 0 00-1.133 1.24l-.173 1.21a1.5 1.5 0 01-3.034 0l-.173-1.21a1.5 1.5 0 00-1.133-1.24l-1.182-.295a1.5 1.5 0 01-.72-2.495l.83-.896a1.5 1.5 0 000-2.043l-.83-.896a1.5 1.5 0 01.72-2.495l1.182-.295a1.5 1.5 0 001.133-1.24l.173-1.21z" />
            <circle cx="13.5" cy="12" r="2.25" strokeWidth={2} />
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
