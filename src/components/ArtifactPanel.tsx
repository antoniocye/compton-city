"use client";

import { useEffect, useRef } from "react";
import { Location, Theme } from "@/lib/types";
import { ARTIFACT_CONFIG } from "@/lib/artifactConfig";

interface ArtifactPanelProps {
  artifact: Location | null;
  theme: Theme;
  onClose: () => void;
  onEnterStreetView: (lat: number, lng: number, label: string) => void;
}

export default function ArtifactPanel({
  artifact,
  theme,
  onClose,
  onEnterStreetView,
}: ArtifactPanelProps) {
  const isDark = theme === "dark";
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const cfg = artifact?.artifactType ? ARTIFACT_CONFIG[artifact.artifactType] : null;

  /* ── Theme tokens ─────────────────────────────────────────────────── */
  const panel   = isDark
    ? "bg-[#070c1a]/95 border-white/[0.07]"
    : "bg-white/97 border-slate-200/80 shadow-2xl shadow-black/15";
  const ttl     = isDark ? "text-slate-100"  : "text-slate-900";
  const sub     = isDark ? "text-slate-400"  : "text-slate-500";
  const muted   = isDark ? "text-slate-600"  : "text-slate-400";
  const divider = isDark ? "border-white/[0.06]" : "border-slate-100";
  const closeBtn = isDark
    ? "hover:bg-white/[0.07] text-slate-500 hover:text-slate-300"
    : "hover:bg-slate-100 text-slate-400 hover:text-slate-600";
  const svBtn = isDark
    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50"
    : "bg-sky-50 border-sky-300/60 text-sky-700 hover:bg-sky-100 hover:border-sky-400/70";

  return (
    <div
      className={`fixed right-0 top-0 h-full z-20 transition-transform duration-300 ease-in-out pointer-events-none ${
        artifact ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div
        ref={panelRef}
        className={`pointer-events-auto h-full w-[420px] max-w-[100vw] flex flex-col border-l backdrop-blur-2xl overflow-hidden ${panel}`}
      >
        {artifact && (
          <>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className={`flex items-start gap-3 px-5 pt-5 pb-4 border-b ${divider}`}>
              {cfg && (
                <div
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base ${cfg.bgClass} ${cfg.borderClass} border`}
                  style={{ color: cfg.hexColor }}
                >
                  {cfg.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {cfg && (
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${cfg.textClass}`}>
                    {cfg.label}
                    {artifact.year ? <span className={`ml-2 font-normal normal-case tracking-normal ${muted}`}>· {artifact.year}</span> : null}
                  </p>
                )}
                <h2 className={`text-sm font-bold leading-tight truncate ${ttl}`}>
                  {artifact.label}
                </h2>
                {artifact.artist && (
                  <p className={`text-xs mt-0.5 truncate ${sub}`}>{artifact.artist}</p>
                )}
                {artifact.album && (
                  <p className={`text-[11px] italic mt-0 ${muted}`}>{artifact.album}</p>
                )}
                {artifact.mediaTitle && !artifact.label.includes(artifact.mediaTitle) && (
                  <p className={`text-xs mt-0.5 italic truncate ${sub}`}>{artifact.mediaTitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${closeBtn}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Scrollable body ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">

              {/* Location info */}
              {artifact.neighborhood && (
                <div className={`px-5 pt-3 pb-0 flex items-center gap-1.5 ${muted}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[11px]">{artifact.neighborhood}</span>
                </div>
              )}

              {/* ── SONG: lyric + video ─────────────────────────────── */}
              {artifact.artifactType === "song" && artifact.lyric && (
                <div className="px-5 pt-4">
                  <blockquote
                    className={`relative pl-4 py-1 text-sm leading-relaxed italic font-medium border-l-2 ${
                      cfg ? `border-[${cfg.hexColor}]` : "border-amber-500"
                    }`}
                    style={{ borderColor: cfg?.hexColor }}
                  >
                    <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                      &ldquo;{artifact.lyric}&rdquo;
                    </span>
                  </blockquote>
                </div>
              )}

              {/* Description */}
              {artifact.description && (
                <div className="px-5 pt-4">
                  <p className={`text-[13px] leading-relaxed ${sub}`}>{artifact.description}</p>
                </div>
              )}

              {/* ── IMAGE ───────────────────────────────────────────── */}
              {artifact.artifactType === "image" && artifact.imageUrl && (
                <div className="px-5 pt-4">
                  <div className="rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artifact.imageUrl}
                      alt={artifact.imageCaption ?? artifact.label}
                      className="w-full object-cover max-h-64"
                    />
                  </div>
                  {artifact.imageCaption && (
                    <p className={`text-xs mt-2 leading-relaxed ${sub}`}>{artifact.imageCaption}</p>
                  )}
                  {artifact.imageCredit && (
                    <p className={`text-[10px] mt-1 ${muted}`}>📷 {artifact.imageCredit}</p>
                  )}
                </div>
              )}

              {/* ── YOUTUBE EMBED (song / music_video / movie_snippet / documentary) ── */}
              {artifact.youtubeVideoId && artifact.artifactType !== "image" && (
                <div className="px-5 pt-4">
                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${artifact.youtubeVideoId}${
                        artifact.youtubeTimestamp ? `?start=${artifact.youtubeTimestamp}` : ""
                      }&rel=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      title={artifact.label}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {artifact.tags && artifact.tags.length > 0 && (
                <div className="px-5 pt-4 flex flex-wrap gap-1.5">
                  {artifact.tags.map(tag => (
                    <span
                      key={tag}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isDark
                          ? "bg-white/[0.05] text-slate-500"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Coordinates */}
              <div className={`px-5 pt-3 pb-1`}>
                <p className={`text-[10px] font-mono ${muted}`}>
                  {artifact.lat.toFixed(5)}, {artifact.lng.toFixed(5)}
                </p>
              </div>

              {/* ── Street View CTA ─────────────────────────────────── */}
              <div className="px-5 pt-4 pb-6">
                <button
                  onClick={() => onEnterStreetView(artifact.lat, artifact.lng, artifact.label)}
                  className={`w-full flex items-center justify-center gap-2.5 border rounded-xl py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${svBtn}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Step Inside This Location
                </button>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
