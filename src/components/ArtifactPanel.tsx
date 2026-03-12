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
  autoplay?: boolean;
  className?: string;
  onSelectArtifact: (id: string) => void;
  onClose?: () => void;
}

const D = {
  panel:    "bg-zinc-900 border-zinc-700",
  divider:  "border-zinc-800",
  text:     "text-zinc-100",
  sub:      "text-zinc-400",
  muted:    "text-zinc-500",
  surface:  "bg-zinc-800 border-zinc-700",
  idle:     "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100",
  selected: "bg-amber-500/15 border-amber-500/40 text-amber-200",
  link:     "text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-400/60",
  close:    "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700",
};

const L = {
  panel:    "bg-white border-zinc-200",
  divider:  "border-zinc-100",
  text:     "text-zinc-900",
  sub:      "text-zinc-500",
  muted:    "text-zinc-400",
  surface:  "bg-zinc-50 border-zinc-200",
  idle:     "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
  selected: "bg-amber-50 border-amber-300 text-amber-800",
  link:     "text-amber-700 border-amber-300 hover:bg-amber-50 hover:border-amber-400",
  close:    "bg-zinc-50 border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100",
};

export default function ArtifactPanel({
  summary, selectedArtifactId, theme, autoplay = false,
  className = "", onSelectArtifact, onClose,
}: ArtifactPanelProps) {
  if (!summary) return null;

  const T = theme === "dark" ? D : L;
  const artifact =
    summary.artifacts.find((a) => a.id === selectedArtifactId) ??
    getPrimaryArtifact(summary);

  if (!artifact) return null;

  return (
    <div className={`border rounded-2xl overflow-hidden max-h-full flex flex-col shadow-2xl ${T.panel} ${className}`}>

      {/* Header */}
      <div className={`px-4 py-3 border-b ${T.divider} shrink-0`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${T.text}`}>{summary.location.name}</p>
            <p className={`text-[11px] mt-0.5 ${T.muted}`}>
              {summary.artifactCount} artifact{summary.artifactCount !== 1 ? "s" : ""}
              {summary.location.neighborhood ? ` · ${summary.location.neighborhood}` : ""}
            </p>
          </div>
          {onClose && (
            <button onClick={onClose}
              className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${T.close}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Artifact chips — horizontally scrollable, no prev/next buttons */}
      {summary.artifacts.length > 1 && (
        <div className={`border-b ${T.divider} shrink-0`}>
          {/* Scroll container with fade hint on the right */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-thin px-3 py-2 flex gap-1.5">
              {summary.artifacts.map((a) => (
                <button key={a.id} onClick={() => onSelectArtifact(a.id)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-left transition-all whitespace-nowrap ${
                    a.id === artifact.id ? T.selected : T.idle
                  }`}>
                  <span className="text-[10px] uppercase tracking-wider font-bold block"
                    style={{ color: ARTIFACT_TYPE_META[a.type].accent }}>
                    {ARTIFACT_TYPE_META[a.type].shortLabel}
                  </span>
                  <span className={`text-[10px] font-medium truncate block max-w-[100px] ${T.sub}`}>{a.title}</span>
                </button>
              ))}
            </div>
            {/* Right fade hint */}
            <div className={`absolute right-0 top-0 bottom-0 w-6 pointer-events-none ${
              theme === "dark"
                ? "bg-gradient-to-l from-zinc-900 to-transparent"
                : "bg-gradient-to-l from-white to-transparent"
            }`} />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-4 overflow-y-auto flex-1 min-h-0 scrollbar-thin">
        <ArtifactBody artifact={artifact} T={T} autoplay={autoplay} />
      </div>
    </div>
  );
}

function ArtifactBody({
  artifact, T, autoplay,
}: {
  artifact: CulturalArtifact;
  T: typeof D;
  autoplay: boolean;
}) {
  const resourceLink = getArtifactLink(artifact.resource);
  // key forces iframe remount (and thus autoplay) whenever artifact changes
  const embedKey     = `${artifact.id}-${autoplay}`;
  const youtubeEmbed = getYouTubeEmbedUrl(artifact.resource, autoplay);
  const spotifyEmbed = getSpotifyEmbedUrl(artifact.resource, autoplay);
  const meta         = ARTIFACT_TYPE_META[artifact.type];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: meta.accent, background: `${meta.accent}18`, border: `1px solid ${meta.accent}40` }}>
            {meta.label}
          </span>
          {artifact.year && (
            <span className={`ml-2 text-[10px] uppercase tracking-widest ${T.muted}`}>{artifact.year}</span>
          )}
          <p className={`text-base font-semibold leading-tight mt-2 ${T.text}`}>{artifact.title}</p>
          <p className={`text-xs mt-1 ${T.sub}`}>
            {artifact.creator}{artifact.sourceTitle ? ` · ${artifact.sourceTitle}` : ""}
          </p>
        </div>
        <span className={`shrink-0 text-[11px] font-mono px-2 py-1 rounded-lg border ${T.surface} ${T.muted}`}>
          {artifact.heatWeight.toFixed(2)}
        </span>
      </div>

      {artifact.caption && (
        <blockquote className={`rounded-xl border p-3 text-sm leading-relaxed italic ${T.surface} ${T.sub}`}>
          {artifact.caption}
        </blockquote>
      )}

      <div className={`rounded-xl border overflow-hidden ${T.surface}`}>
        {youtubeEmbed ? (
          <iframe key={embedKey} className="w-full aspect-video" src={youtubeEmbed} title={artifact.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        ) : spotifyEmbed ? (
          <iframe key={embedKey} className="w-full" src={spotifyEmbed} title={artifact.title} height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        ) : artifact.resource.kind === "image" && artifact.resource.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artifact.resource.imageUrl} alt={artifact.title} className="w-full aspect-video object-cover" />
        ) : (
          <div className="aspect-video flex items-center justify-center px-6 text-center">
            <div>
              <p className={`text-sm font-semibold ${T.sub}`}>{meta.label}</p>
              <p className={`text-xs mt-1.5 ${T.muted}`}>
                {artifact.resource.kind === "image"
                  ? (artifact.resource.credit ?? "No image preview")
                  : "Open source link below"}
              </p>
            </div>
          </div>
        )}
      </div>

      {resourceLink && (
        <a href={resourceLink} target="_blank" rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold border transition-colors ${T.link}`}>
          Open source
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      )}
    </div>
  );
}
