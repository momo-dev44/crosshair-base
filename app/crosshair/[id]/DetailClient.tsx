"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type Crosshair, type ProSettings } from "@/lib/data";
import CrosshairRenderer from "@/app/components/CrosshairRenderer";
import { useFavorites } from "@/app/components/useFavorites";
import {
  type CrosshairSettings,
  type LineSettings,
  parseCrosshairCode,
  generateCrosshairCode,
  isValidCrosshairCode,
  randomCrosshair,
  VALORANT_COLORS,
} from "@/lib/crosshair";

// ── 9 Visibility surfaces ─────────────────────────────────────────────────────

type Surface = { label: string; bg: string };

const SURFACES: Surface[] = [
  { label: "Bright Wall",   bg: "#e5e7eb" },
  { label: "Dark Corner",   bg: "#1a1a1a" },
  { label: "Brick / Busy",  bg: "repeating-conic-gradient(#7f1d1d 0% 25%, #991b1b 0% 50%) 50% / 20px 20px" },
  { label: "Metal / Steel", bg: "linear-gradient(145deg, #4b5563, #1f2937)" },
  { label: "Foliage",       bg: "linear-gradient(to bottom, #166534, #14532d)" },
  { label: "Blue Sky",      bg: "linear-gradient(to top, #38bdf8, #0ea5e9)" },
  { label: "Wooden",        bg: "#78350f" },
  { label: "Sand / Tan",    bg: "#d6d3d1" },
  { label: "Neon / Glow",   bg: "radial-gradient(circle, #4c1d95, #1e1b4b)" },
];

const CATEGORY_COLOR: Record<string, string> = {
  Pro:      "#22d3ee",
  Fun:      "#4ade80",
  Meme:     "#f87171",
  Circular: "#a78bfa",
};

// ── Big copy button ───────────────────────────────────────────────────────────

function BigCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className={[
        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all duration-200",
        copied
          ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
          : "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]",
      ].join(" ")}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied to clipboard!
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 11H3a1.5 1.5 0 01-1.5-1.5V3A1.5 1.5 0 013 1.5h6.5A1.5 1.5 0 0111 3v1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Copy Crosshair Code
        </>
      )}
    </button>
  );
}

// ── Share button ─────────────────────────────────────────────────────────────

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [url]);

  return (
    <button
      onClick={handleShare}
      className={[
        "flex flex-1 items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 border",
        copied
          ? "bg-cyan-400/20 text-cyan-300 border-cyan-400/50"
          : "bg-[#0d1a24] text-slate-500 border-[#1c2f3d] hover:bg-cyan-400/10 hover:text-cyan-300 hover:border-cyan-400/30",
      ].join(" ")}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 8a4 4 0 0 1 4-4h1M12 8a4 4 0 0 1-4 4H7M9 6l3-3 3 3M7 10l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}

// ── Favorites button ──────────────────────────────────────────────────────────

function FavButton({ id }: { id: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pop, setPop] = useState(false);
  const faved = isFavorite(id);

  const handleClick = useCallback(() => {
    toggleFavorite(id);
    setPop(true);
    setTimeout(() => setPop(false), 300);
  }, [id, toggleFavorite]);

  return (
    <button
      onClick={handleClick}
      className={[
        "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all duration-200",
        pop ? "scale-105" : "scale-100",
        faved
          ? "bg-pink-500/20 text-pink-400 border border-pink-500/50 shadow-[0_0_16px_rgba(236,72,153,0.15)]"
          : "bg-pink-500/5 text-slate-500 border border-[#1c2f3d] hover:bg-pink-500/10 hover:text-pink-400 hover:border-pink-500/30",
      ].join(" ")}
      aria-pressed={faved}
    >
      <svg
        width="15" height="15" viewBox="0 0 24 24"
        fill={faved ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {faved ? "Saved to Favorites" : "Add to Favorites"}
    </button>
  );
}

// ── Detail page ───────────────────────────────────────────────────────────────

interface Props {
  crosshair: Crosshair;
}

export default function DetailClient({ crosshair }: Props) {
  const catColor = CATEGORY_COLOR[crosshair.category] ?? "#94a3b8";

  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const originalSettings = useMemo(
    () => parseCrosshairCode(crosshair.code),
    [crosshair.code],
  );

  const [settings, setSettings] = useState<CrosshairSettings>(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      try { return parseCrosshairCode(decodeURIComponent(codeParam)); } catch { /* fall through */ }
    }
    return parseCrosshairCode(crosshair.code);
  });

  // Sync state → URL (debounced 400 ms)
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const code    = generateCrosshairCode(settings);
      const origCode = generateCrosshairCode(originalSettings);
      const nextUrl = code !== origCode
        ? `${pathname}?${new URLSearchParams({ code }).toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 400);
    return () => { if (urlTimer.current) clearTimeout(urlTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const activeCode = useMemo(() => generateCrosshairCode(settings), [settings]);

  const isModified = useMemo(
    () => generateCrosshairCode(settings) !== generateCrosshairCode(originalSettings),
    [settings, originalSettings],
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/crosshair/${crosshair.id}`;
    return isModified
      ? `${base}?${new URLSearchParams({ code: activeCode }).toString()}`
      : base;
  }, [activeCode, isModified, crosshair.id]);

  const handleReset = useCallback(
    () => setSettings(originalSettings),
    [originalSettings],
  );

  return (
    <div className="min-h-screen bg-[#0f1923] text-white overflow-x-hidden">
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-10 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-7 text-xs">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors font-medium"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            VALORANT
          </Link>
          <span className="text-[#1c2f3d]">/</span>
          <span className="text-slate-400 font-semibold">{crosshair.name}</span>
        </div>

        {/* Player header */}
        <div className="flex items-start gap-3 mb-8">
          <div className="mt-1 h-3 w-1 rounded-full shrink-0" style={{ background: catColor }} />
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight">{crosshair.name}</h1>
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border leading-none"
              style={{ color: catColor, background: catColor + "18", borderColor: catColor + "40" }}
            >
              {crosshair.category}
            </span>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* Left: visibility grid */}
          <div className="order-last lg:order-first">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-3">
              Visibility Testing Suite
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SURFACES.map(({ label, bg }) => (
                <div
                  key={label}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-[#1c2f3d] hover:border-[#2a3f52] transition-colors"
                >
                  <div className="flex aspect-square w-full items-center justify-center" style={{ background: bg }}>
                    <CrosshairRenderer
                      settings={settings}
                      bgStyle={{ background: "transparent" }}
                      size={72}
                    />
                  </div>
                  <div className="bg-[#0c1520] px-2 py-1 border-t border-[#1c2f3d]">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 text-center">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="order-first lg:order-last flex flex-col gap-4 lg:sticky lg:top-[56px] lg:self-start">

            {/* Mobile-only: large live preview */}
            <div className="lg:hidden rounded-xl overflow-hidden border border-[#1c2f3d] aspect-square w-full max-w-[320px] mx-auto">
              <CrosshairRenderer settings={settings} fill />
            </div>

            <CrosshairEditor
              accentColor={catColor}
              settings={settings}
              onChange={setSettings}
              isModified={isModified}
              onReset={handleReset}
            />

            {/* Import code */}
            <div className="rounded-xl border border-[#1c2f3d] bg-[#111e2a] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c2f3d]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Import Code</p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {/* Code display */}
                <div className="rounded-lg bg-[#070f18] border border-[#1c2f3d] px-3 py-3">
                  <code className="block font-mono text-xs text-slate-300 break-all leading-relaxed">{activeCode}</code>
                </div>

                {/* Copy + Favorite */}
                <BigCopyButton code={activeCode} />
                <FavButton id={crosshair.id} />

                {/* Share + Randomize */}
                <div className="flex gap-2">
                  <ShareButton url={shareUrl} />
                  <button
                    onClick={() => setSettings(randomCrosshair())}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-widest border border-[#1c2f3d] bg-[#0d1a24] text-slate-500 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-all duration-200"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2 2h4l4 4-4 4H2V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      <path d="M10 6h2a2 2 0 0 1 2 2v.5M14 12h-2a2 2 0 0 1-2-2V9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M12 10l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Random
                  </button>
                </div>

                <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                  Settings → Crosshair → Import Profile Code
                </p>
              </div>
            </div>

            {/* Pro settings */}
            {(crosshair.proSettings || crosshair.category === "Pro") && (
              <ProfessionalSettingsCard settings={crosshair.proSettings} accentColor={catColor} />
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1c2f3d] py-5 mt-10">
        <p className="text-center text-[11px] text-slate-700">
          CrosshairBase — Fan resource. Not affiliated with Riot Games.
        </p>
      </footer>
    </div>
  );
}

// ── Professional settings card ────────────────────────────────────────────────

function ProfessionalSettingsCard({
  settings,
  accentColor,
}: {
  settings: ProSettings | undefined;
  accentColor: string;
}) {
  const rows = settings
    ? [
        { label: "DPI",         value: settings.dpi.toLocaleString() },
        { label: "Sensitivity", value: String(settings.sensitivity) },
        { label: "Mouse",       value: settings.mouse },
        { label: "Resolution",  value: settings.resolution },
      ]
    : [];

  return (
    <div className="rounded-xl border border-[#1c2f3d] bg-[#111e2a] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1c2f3d] flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Professional Settings</p>
        <span
          className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border leading-none"
          style={{ color: accentColor, background: accentColor + "18", borderColor: accentColor + "40" }}
        >
          Pro
        </span>
      </div>
      {settings ? (
        <div className="divide-y divide-[#1c2f3d]">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-medium text-slate-300 text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5 flex flex-col items-center gap-1.5">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-slate-600">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[11px] text-slate-600 text-center leading-relaxed">
            Settings data not yet available for this player.
          </p>
        </div>
      )}
      <div className="h-0.5" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
    </div>
  );
}

// ── Editor primitives ─────────────────────────────────────────────────────────

interface EditorProps {
  accentColor: string;
  settings: CrosshairSettings;
  onChange: (s: CrosshairSettings) => void;
  isModified: boolean;
  onReset: () => void;
}

const SLIDER_CLS =
  "w-full h-1.5 cursor-pointer appearance-none rounded-full " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#111e2a,0_0_8px_rgba(34,211,238,0.5)] " +
  "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:h-3.5 " +
  "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:cursor-pointer";

function sliderBg(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, #22d3ee ${pct}%, #1c2f3d ${pct}%)`;
}

function SliderRow({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  const display = step < 1 ? value.toFixed(2) : String(value);
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="w-9 text-right font-mono text-xs font-bold text-cyan-400 tabular-nums">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={SLIDER_CLS}
        style={{ background: sliderBg(value, min, max) }}
      />
    </div>
  );
}

function ToggleRow({
  label, value, onChange, dim,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; dim?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className={["text-xs", dim ? "text-slate-600" : "text-slate-500"].join(" ")}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={[
          "relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none",
          value ? "border border-cyan-400/50 bg-cyan-400/20" : "border border-[#2a3f52] bg-[#0d1a24]",
        ].join(" ")}
        aria-pressed={value} role="switch"
      >
        <span className={[
          "absolute h-3.5 w-3.5 rounded-full shadow transition-all duration-200",
          value ? "left-[18px] bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" : "left-[3px] bg-slate-600",
        ].join(" ")} />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">{children}</span>
      <div className="flex-1 h-px bg-[#1c2f3d]" />
    </div>
  );
}

// Hex color input with local draft state so typing isn't interrupted
function HexInput({ hex, onChange }: { hex: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(hex);
  useEffect(() => { setDraft(hex); }, [hex]);

  return (
    <div className="flex items-center gap-2 px-4 pt-0.5 pb-3">
      <span className="h-5 w-5 shrink-0 rounded border border-white/10" style={{ background: hex }} />
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          const v = e.target.value.toUpperCase();
          setDraft(v);
          if (/^#[0-9A-F]{6}$/.test(v)) onChange(v);
        }}
        maxLength={7}
        spellCheck={false}
        placeholder="#00FF00"
        className="flex-1 min-w-0 rounded border border-[#1c2f3d] bg-[#070f18] px-2 py-1 font-mono text-[11px] text-slate-300 outline-none focus:border-cyan-400/50"
      />
    </div>
  );
}

// ── LinesEditor — reusable for primary + ADS inner/outer ─────────────────────

function LinesEditor({
  lines,
  onChange,
  isOuter = false,
}: {
  lines: LineSettings;
  onChange: (patch: Partial<LineSettings>) => void;
  isOuter?: boolean;
}) {
  const maxGap    = isOuter ? 40 : 20;
  const isLinked  = lines.length2 === undefined;

  return (
    <div className="divide-y divide-[#1c2f3d]">
      <SliderRow label="Thickness" value={lines.thickness} min={1} max={10} step={1}
        onChange={(v) => onChange({ thickness: v })} />

      {/* Length with H=V link toggle */}
      {isLinked ? (
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">Length</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onChange({ length2: lines.length })}
                title="Unlink horizontal / vertical lengths"
                className="rounded border border-[#1c2f3d] bg-[#0d1a24] px-1.5 py-0.5 text-[9px] font-bold text-slate-600 hover:border-cyan-400/30 hover:text-cyan-400 transition-colors"
              >H=V</button>
              <span className="w-7 text-right font-mono text-xs font-bold text-cyan-400 tabular-nums">{lines.length}</span>
            </div>
          </div>
          <input type="range" min={0} max={20} step={1} value={lines.length}
            onChange={(e) => onChange({ length: Number(e.target.value) })}
            className={SLIDER_CLS} style={{ background: sliderBg(lines.length, 0, 20) }} />
        </div>
      ) : (
        <div className="px-4 py-2.5 flex flex-col gap-2.5">
          {/* H length */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">H Length</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onChange({ length2: undefined })}
                  title="Link horizontal / vertical lengths"
                  className="rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400"
                >H≠V</button>
                <span className="w-7 text-right font-mono text-xs font-bold text-cyan-400 tabular-nums">{lines.length}</span>
              </div>
            </div>
            <input type="range" min={0} max={20} step={1} value={lines.length}
              onChange={(e) => onChange({ length: Number(e.target.value) })}
              className={SLIDER_CLS} style={{ background: sliderBg(lines.length, 0, 20) }} />
          </div>
          {/* V length */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">V Length</span>
              <span className="w-7 text-right font-mono text-xs font-bold text-cyan-400 tabular-nums">{lines.length2 ?? lines.length}</span>
            </div>
            <input type="range" min={0} max={20} step={1} value={lines.length2 ?? lines.length}
              onChange={(e) => onChange({ length2: Number(e.target.value) })}
              className={SLIDER_CLS} style={{ background: sliderBg(lines.length2 ?? lines.length, 0, 20) }} />
          </div>
        </div>
      )}

      <SliderRow label="Gap"     value={lines.offset}  min={0} max={maxGap} step={1}    onChange={(v) => onChange({ offset: v })} />
      <SliderRow label="Opacity" value={lines.opacity}  min={0} max={1}      step={0.05} onChange={(v) => onChange({ opacity: v })} />

      <ToggleRow label="Movement Error" value={lines.movementError}
        onChange={(v) => onChange({ movementError: v })} />
      {lines.movementError && (
        <SliderRow label="Move. Multiplier" value={lines.movementErrorMultiplier} min={0} max={3} step={0.1}
          onChange={(v) => onChange({ movementErrorMultiplier: v })} />
      )}

      <ToggleRow label="Firing Error" value={lines.firingError}
        onChange={(v) => onChange({ firingError: v })} />
      {lines.firingError && (
        <SliderRow label="Fire Multiplier" value={lines.firingErrorMultiplier} min={0} max={3} step={0.1}
          onChange={(v) => onChange({ firingErrorMultiplier: v })} />
      )}
    </div>
  );
}

// ── CrosshairEditor ───────────────────────────────────────────────────────────

type TabId = "general" | "primary" | "ads" | "sniper";

const EDITOR_TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "primary", label: "Primary" },
  { id: "ads",     label: "ADS"     },
  { id: "sniper",  label: "Sniper"  },
];

function CrosshairEditor({ accentColor, settings, onChange, isModified, onReset }: EditorProps) {
  const [tab, setTab]           = useState<TabId>("general");
  const [pasteVal, setPasteVal] = useState("");
  const [pasteStatus, setPasteStatus] = useState<"idle" | "ok" | "err">("idle");

  const applyPaste = useCallback((raw: string) => {
    const code = raw.trim();
    if (!code) return;
    if (!isValidCrosshairCode(code)) {
      setPasteStatus("err");
      setTimeout(() => setPasteStatus("idle"), 2000);
      return;
    }
    onChange(parseCrosshairCode(code));
    setPasteVal("");
    setPasteStatus("ok");
    setTimeout(() => setPasteStatus("idle"), 2000);
  }, [onChange]);

  const g   = settings.general;
  const inn = settings.primary.innerLines;
  const out = settings.primary.outerLines;
  const ads = settings.ads;
  const sn  = settings.sniper;

  const setGeneral = useCallback(
    (patch: Partial<CrosshairSettings["general"]>) =>
      onChange({ ...settings, general: { ...g, ...patch } }),
    [settings, g, onChange],
  );
  const setInner = useCallback(
    (patch: Partial<LineSettings>) =>
      onChange({ ...settings, primary: { ...settings.primary, innerLines: { ...inn, ...patch } } }),
    [settings, inn, onChange],
  );
  const setOuter = useCallback(
    (patch: Partial<LineSettings>) =>
      onChange({ ...settings, primary: { ...settings.primary, outerLines: { ...out, ...patch } } }),
    [settings, out, onChange],
  );
  const setAdsInner = useCallback(
    (patch: Partial<LineSettings>) =>
      onChange({ ...settings, ads: { ...ads, innerLines: { ...ads.innerLines, ...patch } } }),
    [settings, ads, onChange],
  );
  const setAdsOuter = useCallback(
    (patch: Partial<LineSettings>) =>
      onChange({ ...settings, ads: { ...ads, outerLines: { ...ads.outerLines, ...patch } } }),
    [settings, ads, onChange],
  );
  const setSniper = useCallback(
    (patch: Partial<CrosshairSettings["sniper"]>) =>
      onChange({ ...settings, sniper: { ...sn, ...patch } }),
    [settings, sn, onChange],
  );

  const currentHex    = g.customColor ?? VALORANT_COLORS.find((c) => c.idx === g.color)?.hex ?? "#ffffff";
  const isCustomColor = !!g.customColor;

  // Dot indicators for tabs that have active (non-default) settings
  const tabDots: Partial<Record<TabId, boolean>> = {
    general: g.outlines || g.centerDot || isCustomColor,
    primary: inn.movementError || inn.firingError || out.show || inn.length2 !== undefined,
    ads:     !ads.copyPrimary,
    sniper:  sn.centerDot,
  };

  return (
    <div className="rounded-xl border border-[#1c2f3d] bg-[#111e2a] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1c2f3d]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Editor</p>
        <div className="flex items-center gap-2">
          {isModified && (
            <button onClick={onReset} title="Reset to original"
              className="flex items-center gap-1 rounded border border-[#2a3f52] bg-[#0d1a24] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 transition-all hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-400"
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 8a6 6 0 1 0 1.5-4M2 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reset
            </button>
          )}
          <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border leading-none"
            style={{ color: accentColor, background: accentColor + "18", borderColor: accentColor + "40" }}>
            Live
          </span>
        </div>
      </div>

      {/* ── Paste import ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1c2f3d] bg-[#0c1520]">
        <input
          type="text"
          value={pasteVal}
          onChange={(e) => setPasteVal(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            e.preventDefault();
            setPasteVal(pasted);
            applyPaste(pasted);
          }}
          onKeyDown={(e) => { if (e.key === "Enter") applyPaste(pasteVal); }}
          placeholder="Paste Valorant code to import…"
          spellCheck={false}
          className="flex-1 min-w-0 rounded border border-[#1c2f3d] bg-[#070f18] px-2.5 py-1.5 font-mono text-[10px] text-slate-400 placeholder-slate-700 outline-none focus:border-cyan-400/40 focus:text-slate-200"
        />
        <button
          onClick={() => applyPaste(pasteVal)}
          className={[
            "shrink-0 rounded border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-150",
            pasteStatus === "ok"
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : pasteStatus === "err"
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-[#1c2f3d] bg-[#0d1a24] text-slate-500 hover:border-cyan-400/30 hover:text-cyan-400",
          ].join(" ")}
        >
          {pasteStatus === "ok" ? "✓" : pasteStatus === "err" ? "✗" : "Load"}
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex border-b border-[#1c2f3d]" role="tablist">
        {EDITOR_TABS.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={[
                "relative flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 focus:outline-none",
                active
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-400",
              ].join(" ")}
            >
              {label}
              {/* Active underline */}
              {active && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-cyan-400" />
              )}
              {/* Non-default dot indicator */}
              {tabDots[id] && !active && (
                <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: General ── */}
      {tab === "general" && (
        <div>
          {/* Color */}
          <div className="px-4 pt-3 pb-0 border-b border-[#1c2f3d]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs text-slate-500">Color</span>
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-white/10 inline-block shrink-0"
                  style={{ background: currentHex }} />
                {isCustomColor ? "Custom" : (VALORANT_COLORS.find(c => c.idx === g.color)?.label ?? "Custom")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
              {VALORANT_COLORS.map(({ idx, hex, label }) => {
                const isActive = idx === g.color && !isCustomColor;
                return (
                  <button key={idx} title={label}
                    onClick={() => setGeneral({ color: idx, customColor: undefined })}
                    className="relative flex items-center justify-center rounded-full transition-transform duration-100 active:scale-90 focus:outline-none"
                    style={{
                      width: 22, height: 22, background: hex,
                      boxShadow: isActive
                        ? `0 0 0 2px #111e2a, 0 0 0 3.5px ${hex}`
                        : "0 0 0 1.5px rgba(255,255,255,0.12)",
                    }}
                    aria-pressed={isActive} aria-label={label}
                  >
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5"
                          stroke={["#ffffff","#ffd700","#c8ff00","#aeff3a"].includes(hex) ? "#000" : "#fff"}
                          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <HexInput
              key={isCustomColor ? "custom" : `preset-${g.color}`}
              hex={currentHex}
              onChange={(hex) => setGeneral({ color: 7, customColor: hex })}
            />
          </div>

          {/* Outlines + Center Dot + Overrides */}
          <div className="divide-y divide-[#1c2f3d]">
            <ToggleRow label="Outlines" value={g.outlines}
              onChange={(v) => setGeneral({ outlines: v, outlineOpacity: v ? (g.outlineOpacity || 1) : g.outlineOpacity })} />
            {g.outlines && (
              <>
                <SliderRow label="Outline Opacity"   value={g.outlineOpacity}   min={0} max={1} step={0.1} onChange={(v) => setGeneral({ outlineOpacity: v })} />
                <SliderRow label="Outline Thickness" value={g.outlineThickness} min={1} max={6} step={1}   onChange={(v) => setGeneral({ outlineThickness: v })} />
              </>
            )}
            <ToggleRow label="Center Dot" value={g.centerDot}
              onChange={(v) => setGeneral({ centerDot: v })} />
            {g.centerDot && (
              <>
                <SliderRow label="Dot Opacity"   value={g.centerDotOpacity}   min={0} max={1} step={0.05} onChange={(v) => setGeneral({ centerDotOpacity: v })} />
                <SliderRow label="Dot Thickness" value={g.centerDotThickness} min={1} max={6} step={1}    onChange={(v) => setGeneral({ centerDotThickness: v })} />
              </>
            )}
            <ToggleRow label="Override Firing Error Offset" value={g.overrideFiringErrorOffset}
              dim onChange={(v) => setGeneral({ overrideFiringErrorOffset: v })} />
            <ToggleRow label="Override All With Primary" value={g.overrideAllPrimaryWithPrimary}
              dim onChange={(v) => setGeneral({ overrideAllPrimaryWithPrimary: v })} />
          </div>
        </div>
      )}

      {/* ── Tab: Primary ── */}
      {tab === "primary" && (
        <div>
          <SectionLabel>Inner Lines</SectionLabel>
          <div className="divide-y divide-[#1c2f3d] border-b border-[#1c2f3d]">
            <ToggleRow label="Show Inner Lines" value={inn.show} onChange={(v) => setInner({ show: v })} />
            {inn.show && <LinesEditor lines={inn} onChange={setInner} isOuter={false} />}
          </div>
          <SectionLabel>Outer Lines</SectionLabel>
          <div className="divide-y divide-[#1c2f3d]">
            <ToggleRow label="Show Outer Lines" value={out.show} onChange={(v) => setOuter({ show: v })} />
            {out.show && <LinesEditor lines={out} onChange={setOuter} isOuter={true} />}
          </div>
        </div>
      )}

      {/* ── Tab: ADS ── */}
      {tab === "ads" && (
        <div>
          <div className="divide-y divide-[#1c2f3d]">
            <ToggleRow label="Copy Primary Crosshair" value={ads.copyPrimary}
              onChange={(v) => onChange({ ...settings, ads: { ...ads, copyPrimary: v } })} />
          </div>
          {!ads.copyPrimary && (
            <>
              <SectionLabel>Inner Lines</SectionLabel>
              <div className="divide-y divide-[#1c2f3d] border-b border-[#1c2f3d]">
                <ToggleRow label="Show Inner Lines" value={ads.innerLines.show}
                  onChange={(v) => setAdsInner({ show: v })} />
                {ads.innerLines.show && <LinesEditor lines={ads.innerLines} onChange={setAdsInner} isOuter={false} />}
              </div>
              <SectionLabel>Outer Lines</SectionLabel>
              <div className="divide-y divide-[#1c2f3d]">
                <ToggleRow label="Show Outer Lines" value={ads.outerLines.show}
                  onChange={(v) => setAdsOuter({ show: v })} />
                {ads.outerLines.show && <LinesEditor lines={ads.outerLines} onChange={setAdsOuter} isOuter={true} />}
              </div>
            </>
          )}
          {ads.copyPrimary && (
            <p className="px-4 py-6 text-center text-[11px] text-slate-600">
              Using primary crosshair for ADS.
            </p>
          )}
        </div>
      )}

      {/* ── Tab: Sniper ── */}
      {tab === "sniper" && (
        <div className="divide-y divide-[#1c2f3d]">
          <ToggleRow label="Center Dot" value={sn.centerDot}
            onChange={(v) => setSniper({ centerDot: v })} />
          {sn.centerDot ? (
            <>
              <div className="px-4 py-2.5">
                <span className="text-xs text-slate-500 block mb-2">Dot Color</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {VALORANT_COLORS.slice(0, 6).map(({ idx, hex, label }) => (
                    <button key={idx} title={label}
                      onClick={() => setSniper({ centerDotColor: idx })}
                      className="rounded-full transition-transform duration-100 active:scale-90 focus:outline-none"
                      style={{
                        width: 20, height: 20, background: hex,
                        boxShadow: sn.centerDotColor === idx
                          ? `0 0 0 2px #111e2a, 0 0 0 3px ${hex}`
                          : "0 0 0 1.5px rgba(255,255,255,0.12)",
                      }}
                      aria-pressed={sn.centerDotColor === idx} aria-label={label}
                    />
                  ))}
                </div>
              </div>
              <SliderRow label="Dot Opacity"   value={sn.centerDotOpacity}   min={0} max={1} step={0.05} onChange={(v) => setSniper({ centerDotOpacity: v })} />
              <SliderRow label="Dot Thickness" value={sn.centerDotThickness} min={1} max={6} step={1}    onChange={(v) => setSniper({ centerDotThickness: v })} />
            </>
          ) : (
            <p className="px-4 py-6 text-center text-[11px] text-slate-600">
              Sniper center dot is off.
            </p>
          )}
        </div>
      )}

      <div className="h-0.5 mt-1" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
    </div>
  );
}
