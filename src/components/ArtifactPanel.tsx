"use client";

import {
  getArtifactLink,
  getPrimaryArtifact,
  getSpotifyEmbedUrl,
  getYouTubeEmbedUrl,
} from "@/lib/artifacts";
import {
  ARTIFACT_TYPE_META,
  CulturalArtifact,
  LocationSummary,
  Theme,
} from "@/lib/types";

interface ArtifactPanelProps {
  summary: LocationSummary | null;
  selectedArtifactId: string | null;
  theme: Theme;
  className?: string;
  onSelectArtifact: (artifactId: string) => void;
  onClose?: () => void;
}

export default function ArtifactPanel({
  summary,
  selectedArtifactId,
  theme,
  className = "",
  onSelectArtifact,
  onClose,
}: ArtifactPanelProps) {
  if (!summary) return null;

  const isDark = theme === "dark";
  const artifact =
    summary.artifacts.find((entry) => entry.id === selectedArtifactId) ??
    getPrimaryArtifact(summary);

  if (!artifact) return null;

  const panelCls = isDark
    ? "bg-[#070c1a]/90 border-white/[0.08] shadow-2xl shadow-black/50"
    : "bg-white/95 border-slate-200/80 shadow-2xl shadow-black/15";
  const muted = isDark ? "text-slate-500" : "text-slate-400";
  const listIdle = isDark
    ? "bg-white/[0.03] border-white/[0.05] text-slate-400 hover:text-white hover:border-white/[0.12]"
    : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300";
  const selectedCls = isDark
    ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-200"
    : "bg-sky-50 border-sky-300 text-sky-700";
  const surface = isDark
    ? "bg-white/[0.03] border-white/[0.06]"
    : "bg-slate-50/90 border-slate-200";

  return (
    <div
      className={`border backdrop-blur-2xl rounded-3xl overflow-hidden max-h-full ${panelCls} ${className}`}
    >
      <div className="p-4 pb-3 border-b border-inherit">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">
              {summary.location.name}
            </p>
            <p className={`text-[11px] mt-1 ${muted}`}>
              {summary.artifactCount} artifact
              {summary.artifactCount !== 1 ? "s" : ""} tied to this location
              {summary.location.neighborhood
                ? ` · ${summary.location.neighborhood}`
                : ""}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-xl border transition-colors ${
                isDark
                  ? "border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.14]"
                  : "border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300"
              }`}
              title="Close artifact panel"
            >
              <svg
                className="w-4 h-4 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {summary.artifacts.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onSelectArtifact(entry.id)}
              className={`min-w-0 rounded-2xl border px-3 py-2 text-left transition-all ${
                entry.id === artifact.id ? selectedCls : listIdle
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold">
                {ARTIFACT_TYPE_META[entry.type].label}
              </p>
              <p className="text-xs font-semibold truncate max-w-44 mt-1">
                {entry.title}
              </p>
            </button>
          ))}
        </div>

        <ArtifactBody artifact={artifact} theme={theme} surface={surface} muted={muted} />
      </div>
    </div>
  );
}

function ArtifactBody({
  artifact,
  theme,
  surface,
  muted,
}: {
  artifact: CulturalArtifact;
  theme: Theme;
  surface: string;
  muted: string;
}) {
  const isDark = theme === "dark";
  const resourceLink = getArtifactLink(artifact.resource);
  const youtubeEmbed = getYouTubeEmbedUrl(artifact.resource);
  const spotifyEmbed = getSpotifyEmbedUrl(artifact.resource);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <TypeChip type={artifact.type} />
            {artifact.year && (
              <span className={`text-[10px] uppercase tracking-widest ${muted}`}>
                {artifact.year}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold tracking-tight mt-2">{artifact.title}</p>
          <p className={`text-sm mt-1 ${muted}`}>
            {artifact.creator}
            {artifact.sourceTitle ? ` · ${artifact.sourceTitle}` : ""}
          </p>
        </div>
        <span
          className={`text-[11px] font-mono px-2.5 py-1 rounded-xl border ${surface}`}
        >
          heat {artifact.heatWeight.toFixed(2)}
        </span>
      </div>

      {artifact.caption && (
        <blockquote className={`rounded-2xl border p-3 text-sm leading-relaxed ${surface}`}>
          {artifact.caption}
        </blockquote>
      )}

      <div className={`rounded-2xl border overflow-hidden ${surface}`}>
        {youtubeEmbed ? (
          <iframe
            className="w-full aspect-video"
            src={youtubeEmbed}
            title={artifact.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : spotifyEmbed ? (
          <iframe
            className="w-full"
            src={spotifyEmbed}
            title={artifact.title}
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : artifact.resource.kind === "image" && artifact.resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artifact.resource.imageUrl}
            alt={artifact.title}
            className="w-full aspect-video object-cover"
          />
        ) : (
          <div className="aspect-video flex items-center justify-center px-6 text-center">
            <div>
              <p className="text-sm font-semibold">{ARTIFACT_TYPE_META[artifact.type].label}</p>
              <p className={`text-xs mt-2 ${muted}`}>
                {artifact.resource.kind === "image"
                  ? artifact.resource.credit || "Open external image source"
                  : "Open the source link to explore the full artifact."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {resourceLink && (
          <a
            href={resourceLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
              isDark
                ? "text-cyan-300 border-cyan-500/25 hover:border-cyan-400/50 hover:bg-cyan-500/10"
                : "text-sky-700 border-sky-300 hover:border-sky-400 hover:bg-sky-50"
            }`}
          >
            Open resource
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}

        {artifact.tags?.map((tag) => (
          <span
            key={tag}
            className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${surface}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypeChip({ type }: { type: CulturalArtifact["type"] }) {
  const meta = ARTIFACT_TYPE_META[type];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{
        color: meta.accent,
        backgroundColor: `${meta.accent}20`,
        border: `1px solid ${meta.accent}55`,
      }}
    >
      {meta.label}
    </span>
  );
}
