"use client";

import { Location, Theme } from "@/lib/types";

interface HeaderProps {
  locations: Location[];
  theme: Theme;
  onToggleTheme: () => void;
  onClearAll: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  locations,
  theme,
  onToggleTheme,
  onClearAll,
  sidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const totalWeight = locations.reduce((acc, l) => acc + l.weight, 0);
  const isDark = theme === "dark";

  const panelCls = isDark
    ? "bg-black/60 border-white/10 text-white"
    : "bg-white/80 border-black/8 text-gray-900 shadow-sm";

  const mutedCls = isDark ? "text-white/40" : "text-gray-400";
  const iconBtnCls = isDark
    ? "bg-black/60 border-white/10 text-white/70 hover:text-white hover:border-cyan-500/50"
    : "bg-white/80 border-black/8 text-gray-500 hover:text-gray-800 hover:border-sky-400/60 shadow-sm";

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 pointer-events-none">
      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onToggleSidebar}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-md transition-all duration-200 ${iconBtnCls}`}
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

        <div className={`border backdrop-blur-md rounded-xl px-4 py-2 transition-all duration-300 ${panelCls}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <span className="font-bold tracking-tight text-base">Compton</span>
            <span className="font-bold tracking-tight text-base text-cyan-500 dark:text-cyan-400">Heat</span>
          </div>
          <p className={`text-[10px] tracking-widest uppercase ${mutedCls}`}>
            Location Heatmap
          </p>
        </div>
      </div>

      {/* Right: stats + theme toggle */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Point count */}
        <div className={`flex items-center gap-2 border backdrop-blur-md rounded-xl px-3 py-2 transition-all duration-300 ${panelCls}`}>
          <svg className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span className="text-sm font-semibold">{locations.length}</span>
          <span className={`text-xs ${mutedCls}`}>points</span>
        </div>

        {/* Weight */}
        <div className={`flex items-center gap-2 border backdrop-blur-md rounded-xl px-3 py-2 transition-all duration-300 ${panelCls}`}>
          <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
          </svg>
          <span className="text-sm font-semibold">{totalWeight.toFixed(1)}</span>
          <span className={`text-xs ${mutedCls}`}>weight</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-xl border backdrop-blur-md transition-all duration-200 ${iconBtnCls}`}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            /* Sun icon */
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            /* Moon icon */
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        {/* Clear all */}
        {locations.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all duration-200 text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear all
          </button>
        )}
      </div>
    </header>
  );
}
