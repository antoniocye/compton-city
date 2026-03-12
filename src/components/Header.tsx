"use client";

import { Artifact, Theme } from "@/lib/types";

interface HeaderProps {
  artifacts: Artifact[];
  theme: Theme;
  onToggleTheme: () => void;
  onClearAll: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  artifacts,
  theme,
  onToggleTheme,
  onClearAll,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const totalWeight = artifacts.reduce((acc, artifact) => acc + artifact.weight, 0);
  const isDark = theme === "dark";

  /* ── Shared variants ───────────────────────────────────────────────── */
  const chip = isDark
    ? "bg-[#0c1225]/80 border-white/[0.07] text-slate-200 shadow-lg shadow-black/40"
    : "bg-white/95 border-black/[0.07] text-slate-800 shadow-lg shadow-black/10";

  const iconBtn = isDark
    ? "bg-[#0c1225]/80 border-white/[0.07] text-slate-400 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-500/10 shadow-lg shadow-black/40"
    : "bg-white/95 border-black/[0.07] text-slate-500 hover:text-slate-800 hover:border-sky-400/50 hover:bg-sky-50/80 shadow-lg shadow-black/10";

  const muted = isDark ? "text-slate-500" : "text-slate-400";

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">

      {/* ── Left: hamburger + brand ── */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <button
          onClick={onToggleSidebar}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-xl transition-all duration-200 ${iconBtn}`}
          title={sidebarOpen ? "Close panel" : "Open panel"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`border backdrop-blur-xl rounded-2xl px-4 py-2 transition-all duration-300 ${chip}`}>
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-40 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-cyan-400" />
            </div>
            <span className="font-bold tracking-tight text-[15px]">Compton</span>
            <span className={`font-bold tracking-tight text-[15px] ${isDark ? "text-cyan-400" : "text-sky-600"}`}>
              Artifacts
            </span>
          </div>
          <p className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 ${muted}`}>
            Cultural reference heatmap
          </p>
        </div>
      </div>

      {/* ── Right: stats + controls ── */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Points */}
        <div className={`flex items-center gap-2 border backdrop-blur-xl rounded-xl px-3 py-2 transition-all duration-300 ${chip}`}>
          <svg className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-cyan-400" : "text-sky-500"}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{artifacts.length}</span>
          <span className={`text-xs ${muted}`}>artifacts</span>
        </div>

        {/* Weight */}
        <div className={`flex items-center gap-2 border backdrop-blur-xl rounded-xl px-3 py-2 transition-all duration-300 ${chip}`}>
          <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
          <span className="text-sm font-bold tabular-nums">{totalWeight.toFixed(1)}</span>
          <span className={`text-xs ${muted}`}>wt</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-xl transition-all duration-200 ${iconBtn}`}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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

        {/* Clear all */}
        {artifacts.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/25 backdrop-blur-xl rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200 text-xs font-semibold shadow-lg shadow-black/30"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </header>
  );
}
