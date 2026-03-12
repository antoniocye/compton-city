"use client";

import { Theme } from "@/lib/types";

// "Compton" — Kendrick Lamar & Dr. Dre (from Dr. Dre's Compton, 2015)
const TRACK_ID  = "1wf4LnpdAhLaoI2WwYDKAE";
const EMBED_SRC = `https://open.spotify.com/embed/track/${TRACK_ID}?utm_source=generator`;

interface AmbientPlayerProps {
  theme: Theme;
  onClose: () => void;
}

export default function AmbientPlayer({ theme, onClose }: AmbientPlayerProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={`absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-xl border shadow-xl overflow-hidden ${
        isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
      }`}
      style={{ width: 340 }}
    >
      {/* Label bar */}
      <div className={`flex items-center gap-2 px-3 py-1.5 border-b ${
        isDark ? "border-zinc-800" : "border-zinc-100"
      }`}>
        <svg className="w-3 h-3 shrink-0 text-amber-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z"/>
        </svg>
        <span className={`text-[11px] font-semibold flex-1 truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
          Compton — Dr. Dre &amp; Kendrick
        </span>
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

      {/* Spotify embed — 152 px is the minimum that shows the play button */}
      <iframe
        src={EMBED_SRC}
        width="100%"
        height={152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ border: 0, display: "block" }}
      />
    </div>
  );
}
