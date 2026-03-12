"use client";

import { useState } from "react";
import { Theme } from "@/lib/types";

// "Compton" — Kendrick Lamar & Dr. Dre (from Dr. Dre's Compton, 2015)
const TRACK_ID = "1wf4LnpdAhLaoI2WwYDKAE";
const EMBED_SRC = `https://open.spotify.com/embed/track/${TRACK_ID}?utm_source=generator`;

interface AmbientPlayerProps {
  theme: Theme;
  onClose: () => void;
}

export default function AmbientPlayer({ theme, onClose }: AmbientPlayerProps) {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === "dark";

  return (
    <div className={`absolute bottom-5 left-5 z-20 rounded-xl border shadow-xl overflow-hidden transition-all duration-300 ${
      isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
    }`} style={{ width: expanded ? 320 : 240 }}>

      {/* Top bar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b ${
        isDark ? "border-zinc-800" : "border-zinc-100"
      }`}>
        {/* Animated music note */}
        <svg className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
        </svg>
        <span className={`text-[11px] font-semibold flex-1 truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
          Compton — Dr. Dre &amp; Kendrick
        </span>
        <button
          onClick={() => setExpanded(v => !v)}
          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-colors ${
            isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
          }`}
          title={expanded ? "Collapse" : "Expand player"}
        >
          {expanded ? "↙" : "↗"}
        </button>
        <button
          onClick={onClose}
          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
            isDark ? "text-zinc-600 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
          }`}
          title="Hide player"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Spotify embed */}
      <iframe
        src={EMBED_SRC}
        width="100%"
        height={expanded ? 152 : 80}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ border: 0, display: "block" }}
      />
    </div>
  );
}
