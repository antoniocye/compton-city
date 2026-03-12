"use client";

import { Theme } from "@/lib/types";

interface Props {
  theme: Theme;
  onClose: () => void;
}

export default function StreetViewHeader({
  theme,
  onClose,
}: Props) {
  const iconBtnCls = theme === "dark"
    ? "bg-zinc-900/95 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 backdrop-blur-sm"
    : "bg-white/97 border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400 backdrop-blur-sm";

  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-4 py-3 pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={onClose}
          className={`flex items-center gap-2 h-9 px-3 rounded-xl border backdrop-blur-xl transition-all duration-200 text-xs font-semibold ${iconBtnCls}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Map
        </button>
      </div>
    </div>
  );
}
