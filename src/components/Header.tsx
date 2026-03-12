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
  locationCount,
  artifactCount,
  totalWeight,
  theme,
  onToggleTheme,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const isDark = theme === "dark";

  const chip = isDark
    ? "bg-[#1a1613]/88 border-white/[0.07] text-stone-200 shadow-lg shadow-black/50"
    : "bg-[#fdfaf3]/94 border-stone-300/40 text-stone-800 shadow-md shadow-black/10";

  const iconBtn = isDark
    ? "bg-[#1a1613]/88 border-white/[0.07] text-stone-400 hover:text-stone-100 hover:border-amber-500/40 hover:bg-amber-500/10 shadow-lg shadow-black/50"
    : "bg-[#fdfaf3]/94 border-stone-300/40 text-stone-500 hover:text-stone-800 hover:border-amber-600/50 hover:bg-amber-50/80 shadow-md shadow-black/10";

  const muted = isDark ? "text-stone-600" : "text-stone-400";
  const accent = isDark ? "text-amber-400" : "text-amber-700";

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">

      {/* ── Brand ── */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <div className={`border backdrop-blur-xl rounded-2xl px-4 py-2 transition-all duration-300 ${chip}`}>
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2">
              <div className={`absolute inset-0 rounded-full opacity-35 animate-ping ${isDark ? "bg-amber-400" : "bg-amber-600"}`} />
              <div className={`absolute inset-0 rounded-full ${isDark ? "bg-amber-400" : "bg-amber-600"}`} />
            </div>
            <span className="font-bold tracking-tight text-[15px]">Compton</span>
            <span className={`font-bold tracking-tight text-[15px] ${accent}`}>Heat</span>
          </div>
          <p className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 ${muted}`}>
            Cultural Artifact Map
          </p>
        </div>
      </div>

      {/* ── Stats + controls ── */}
      <div className="flex items-center gap-2 pointer-events-auto">

        <div className={`flex items-center gap-2 border backdrop-blur-xl rounded-xl px-3 py-2 transition-all duration-300 ${chip}`}>
          <svg className={`w-3.5 h-3.5 shrink-0 ${accent}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{locationCount}</span>
          <span className={`text-xs ${muted}`}>locs</span>
        </div>

        <div className={`flex items-center gap-2 border backdrop-blur-xl rounded-xl px-3 py-2 transition-all duration-300 ${chip}`}>
          <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19V6l12-2v13M9 19a2 2 0 11-4 0 2 2 0 014 0zm12-2a2 2 0 11-4 0 2 2 0 014 0zM9 10l12-2" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{artifactCount}</span>
          <span className={`text-xs ${muted}`}>artifacts</span>
        </div>

        <div className={`flex items-center gap-2 border backdrop-blur-xl rounded-xl px-3 py-2 transition-all duration-300 ${chip}`}>
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{totalWeight.toFixed(1)}</span>
          <span className={`text-xs ${muted}`}>heat</span>
        </div>

        {/* Settings toggle */}
        <button
          onClick={onToggleSidebar}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-xl transition-all duration-200 ${
            sidebarOpen
              ? isDark
                ? "bg-amber-500/12 border-amber-500/38 text-amber-300 shadow-lg shadow-black/50"
                : "bg-amber-50 border-amber-400/50 text-amber-700 shadow-md shadow-black/10"
              : iconBtn
          }`}
          title={sidebarOpen ? "Close settings" : "Open settings"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11.983 5.5a1.5 1.5 0 013.034 0l.173 1.21a1.5 1.5 0 001.133 1.24l1.182.295a1.5 1.5 0 01.72 2.495l-.83.896a1.5 1.5 0 000 2.043l.83.896a1.5 1.5 0 01-.72 2.495l-1.182.295a1.5 1.5 0 00-1.133 1.24l-.173 1.21a1.5 1.5 0 01-3.034 0l-.173-1.21a1.5 1.5 0 00-1.133-1.24l-1.182-.295a1.5 1.5 0 01-.72-2.495l.83-.896a1.5 1.5 0 000-2.043l-.83-.896a1.5 1.5 0 01.72-2.495l1.182-.295a1.5 1.5 0 001.133-1.24l.173-1.21z" />
            <circle cx="13.5" cy="12" r="2.25" strokeWidth={2} />
          </svg>
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-xl transition-all duration-200 ${iconBtn}`}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
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
