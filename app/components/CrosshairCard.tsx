"use client";

import { memo, useState, useCallback } from "react";
import Link from "next/link";
import { type Crosshair, type Category } from "@/lib/data";
import CrosshairRenderer from "./CrosshairRenderer";
import { useToast } from "./ToastProvider";

const BADGE_COLOR: Record<Category, string> = {
  Pro:      "#22d3ee",
  Fun:      "#4ade80",
  Meme:     "#f472b6",
  Circular: "#a78bfa",
};

const BADGE_LABEL: Partial<Record<Category, string>> = {
  Pro:  "PRO",
  Meme: "MEME",
};

interface Props {
  crosshair: Crosshair;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function CrosshairCard({ crosshair, isFavorite, onToggleFavorite }: Props) {
  const [copied, setCopied]     = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const { showToast }           = useToast();

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(crosshair.code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = crosshair.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    showToast("Crosshair Code Copied!");
    setTimeout(() => setCopied(false), 1800);
  }, [crosshair.code, showToast]);

  const handleFav = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite();
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 300);
  }, [onToggleFavorite]);

  const badgeLabel = BADGE_LABEL[crosshair.category];
  const badgeColor = BADGE_COLOR[crosshair.category];

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg border border-white/[0.05] transition-all duration-200 hover:border-cyan-400/25 hover:shadow-[0_0_22px_rgba(34,211,238,0.10),inset_0_0_28px_rgba(34,211,238,0.03)]"
      style={{ background: "radial-gradient(circle at 50% 45%, #2a3a4a 0%, #0f172a 100%)" }}
    >
      {/* ── Clickable crosshair area ── */}
      <Link
        href={`/crosshair/${crosshair.id}`}
        className="absolute inset-0 flex items-center justify-center"
        tabIndex={0}
      >
        {/* Constrained inner frame — crosshair occupies the center half */}
        <div className="relative flex aspect-square w-1/2 items-center justify-center">
          <CrosshairRenderer
            code={crosshair.code}
            fill
            bgStyle={{ background: "transparent" }}
          />
        </div>
      </Link>

      {/* ── Category badge — top-right ── */}
      {badgeLabel ? (
        <span
          className="pointer-events-none absolute top-1.5 right-1.5 rounded-sm border px-1 py-0.5 text-[7px] font-bold uppercase leading-none tracking-wider"
          style={{ color: badgeColor, borderColor: badgeColor + "50", background: badgeColor + "12" }}
        >
          {badgeLabel}
        </span>
      ) : (
        <span
          className="pointer-events-none absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ring-1 ring-black/30"
          style={{ background: badgeColor }}
        />
      )}

      {/* ── Heart button — top-left ── */}
      <button
        onClick={handleFav}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        className={[
          "absolute top-1.5 left-1.5 flex items-center justify-center rounded-full transition-all duration-150",
          heartPop ? "scale-125" : "scale-100",
          isFavorite
            ? "text-pink-500 opacity-100"
            : "opacity-0 text-white/30 group-hover:opacity-100 hover:!text-pink-400",
        ].join(" ")}
      >
        <svg
          width="11" height="11"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* ── Name + copy — bottom overlay ── */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-1 px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(to top, rgba(6,10,18,0.90) 0%, transparent 100%)" }}
      >
        <Link
          href={`/crosshair/${crosshair.id}`}
          className="min-w-0 flex-1 truncate text-[9px] font-semibold text-white/70 hover:text-white transition-colors leading-none"
          tabIndex={-1}
        >
          {crosshair.name}
        </Link>
        <button
          onClick={handleCopy}
          title="Copy code"
          className={`shrink-0 transition-colors duration-150 ${
            copied ? "text-cyan-400" : "text-white/40 hover:text-cyan-400"
          }`}
        >
          {copied ? (
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 11H3a1.5 1.5 0 01-1.5-1.5V3A1.5 1.5 0 013 1.5h6.5A1.5 1.5 0 0111 3v1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(CrosshairCard);
