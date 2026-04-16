"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type Crosshair, type ProSettings } from "@/lib/data";
import CrosshairRenderer, { parseCrosshair, type ParsedCrosshair } from "@/app/components/CrosshairRenderer";
import { useFavorites } from "@/app/components/useFavorites";

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

// ── Valorant color palette ────────────────────────────────────────────────────

const VALORANT_COLORS = [
  { idx: "0", hex: "#ffffff", label: "White" },
  { idx: "1", hex: "#00ff44", label: "Green" },
  { idx: "2", hex: "#c8ff00", label: "Yellow-Green" },
  { idx: "3", hex: "#aeff3a", label: "Green-Yellow" },
  { idx: "4", hex: "#ffd700", label: "Yellow" },
  { idx: "5", hex: "#00e5ff", label: "Cyan" },
  { idx: "6", hex: "#ff77dd", label: "Pink" },
  { idx: "7", hex: "#ff4040", label: "Red" },
] as const;

// ── Editor state ──────────────────────────────────────────────────────────────

interface EditorState {
  innerLength:    number;
  innerOffset:    number;
  innerThickness: number;
  innerAlpha:     number;
  outerLength:    number;
  outerOffset:    number;
  outerThickness: number;
  outerAlpha:     number;
  hasDot:         boolean;
  showOuter:      boolean;
  firingError:    boolean;
}

function parseToEditorState(code: string): EditorState {
  const cfg = parseCrosshair(code);
  const parts = code.split(";");
  let inP = false;
  let firingError = false;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "P") { inP = true; continue; }
    if (parts[i] === "A" || parts[i] === "S" || parts[i] === "G") { inP = false; continue; }
    if (inP && parts[i] === "0f" && i + 1 < parts.length) { firingError = parts[i + 1] === "1"; break; }
  }
  return {
    innerLength:    cfg.innerLength,
    innerOffset:    cfg.innerOffset,
    innerThickness: cfg.innerThickness,
    innerAlpha:     cfg.innerAlpha,
    outerLength:    cfg.outerLength > 0 ? cfg.outerLength : 4,
    outerOffset:    cfg.outerOffset,
    outerThickness: cfg.outerThickness,
    outerAlpha:     cfg.outerAlpha,
    hasDot:         cfg.hasDot,
    showOuter:      cfg.showOuter,
    firingError,
  };
}

function buildCode(colorIdx: string, s: EditorState): string {
  const dot = s.hasDot ? 1 : 0;
  const fe  = s.firingError ? 1 : 0;
  const ol  = s.showOuter ? s.outerLength : 0;
  const ia  = +s.innerAlpha.toFixed(2);
  const oa  = +s.outerAlpha.toFixed(2);
  return `0;P;c;${colorIdx};h;${dot};0l;${s.innerLength};0o;${s.innerOffset};0t;${s.innerThickness};0a;${ia};0f;${fe};1t;${s.outerThickness};1l;${ol};1o;${s.outerOffset};1a;${oa};S;c;0;s;1;o;1`;
}

// ── URL ↔ state serialization ─────────────────────────────────────────────────
// Keys: c=color, il/io/it/ia=inner, ol/oo/ot/oa=outer, d=dot, so=showOuter, fe=firingError

function stateToParams(colorIdx: string, s: EditorState): string {
  const sp = new URLSearchParams();
  sp.set("c",  colorIdx);
  sp.set("il", String(s.innerLength));
  sp.set("io", String(s.innerOffset));
  sp.set("it", String(s.innerThickness));
  sp.set("ia", s.innerAlpha.toFixed(2));
  sp.set("ol", String(s.outerLength));
  sp.set("oo", String(s.outerOffset));
  sp.set("ot", String(s.outerThickness));
  sp.set("oa", s.outerAlpha.toFixed(2));
  sp.set("d",  s.hasDot ? "1" : "0");
  sp.set("so", s.showOuter ? "1" : "0");
  sp.set("fe", s.firingError ? "1" : "0");
  return sp.toString();
}

function paramsToState(
  sp: { has(k: string): boolean; get(k: string): string | null },
  base: EditorState,
  baseColor: string,
): { colorIdx: string; editorState: EditorState } | null {
  if (!sp.has("il") && !sp.has("c")) return null;
  return {
    colorIdx: sp.get("c") ?? baseColor,
    editorState: {
      innerLength:    sp.has("il") ? Number(sp.get("il"))          : base.innerLength,
      innerOffset:    sp.has("io") ? Number(sp.get("io"))          : base.innerOffset,
      innerThickness: sp.has("it") ? Number(sp.get("it"))          : base.innerThickness,
      innerAlpha:     sp.has("ia") ? parseFloat(sp.get("ia")!)     : base.innerAlpha,
      outerLength:    sp.has("ol") ? Number(sp.get("ol"))          : base.outerLength,
      outerOffset:    sp.has("oo") ? Number(sp.get("oo"))          : base.outerOffset,
      outerThickness: sp.has("ot") ? Number(sp.get("ot"))          : base.outerThickness,
      outerAlpha:     sp.has("oa") ? parseFloat(sp.get("oa")!)     : base.outerAlpha,
      hasDot:         sp.has("d")  ? sp.get("d") === "1"           : base.hasDot,
      showOuter:      sp.has("so") ? sp.get("so") === "1"          : base.showOuter,
      firingError:    sp.has("fe") ? sp.get("fe") === "1"          : base.firingError,
    },
  };
}

// ── Misc helpers ──────────────────────────────────────────────────────────────

function getColorIdxFromCode(code: string): string {
  const parts = code.split(";");
  let inP = false;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "P") { inP = true; continue; }
    if (parts[i] === "A" || parts[i] === "S" || parts[i] === "G") { inP = false; continue; }
    if (inP && parts[i] === "c" && i + 1 < parts.length) return parts[i + 1];
  }
  return "0";
}

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

// ── Favorites button ─────────────────────────────────────────────────────────

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

  // Next.js hooks for URL persistence
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  // Immutable originals — used for reset and modified-detection
  const originalColorIdx = useMemo(() => getColorIdxFromCode(crosshair.code), [crosshair.code]);
  const originalState    = useMemo(() => parseToEditorState(crosshair.code),  [crosshair.code]);

  // State — initialized from URL params so shared links load the right config
  const [activeColorIdx, setActiveColorIdx] = useState<string>(() => {
    const parsed = paramsToState(searchParams, originalState, originalColorIdx);
    return parsed?.colorIdx ?? originalColorIdx;
  });
  const [editorState, setEditorState] = useState<EditorState>(() => {
    const parsed = paramsToState(searchParams, originalState, originalColorIdx);
    return parsed?.editorState ?? originalState;
  });

  // ── Sync state → URL via router.replace (debounced 400 ms) ────────────────
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const nextUrl = isModified
        ? `${pathname}?${stateToParams(activeColorIdx, editorState)}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 400);
    return () => { if (urlTimer.current) clearTimeout(urlTimer.current); };
  // isModified is derived from activeColorIdx / editorState — covered by deps below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeColorIdx, editorState]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeHex = useMemo(
    () => VALORANT_COLORS.find((c) => c.idx === activeColorIdx)?.hex ?? "#ffffff",
    [activeColorIdx],
  );

  const cfgOverride = useMemo<Partial<ParsedCrosshair>>(() => ({
    innerLength:    editorState.innerLength,
    innerOffset:    editorState.innerOffset,
    innerThickness: editorState.innerThickness,
    innerAlpha:     editorState.innerAlpha,
    outerLength:    editorState.showOuter ? editorState.outerLength : 0,
    outerOffset:    editorState.outerOffset,
    outerThickness: editorState.outerThickness,
    outerAlpha:     editorState.outerAlpha,
    hasDot:         editorState.hasDot,
    showInner:      editorState.innerLength > 0,
    showOuter:      editorState.showOuter && editorState.outerLength > 0,
    dotThickness:   editorState.innerThickness,
  }), [editorState]);

  const activeCode = useMemo(
    () => buildCode(activeColorIdx, editorState),
    [activeColorIdx, editorState],
  );

  const isModified = useMemo(() => {
    if (activeColorIdx !== originalColorIdx) return true;
    const e = editorState, o = originalState;
    return (
      e.innerLength    !== o.innerLength    ||
      e.innerOffset    !== o.innerOffset    ||
      e.innerThickness !== o.innerThickness ||
      e.innerAlpha.toFixed(2) !== o.innerAlpha.toFixed(2) ||
      e.outerLength    !== o.outerLength    ||
      e.outerOffset    !== o.outerOffset    ||
      e.outerThickness !== o.outerThickness ||
      e.outerAlpha.toFixed(2) !== o.outerAlpha.toFixed(2) ||
      e.hasDot      !== o.hasDot      ||
      e.showOuter   !== o.showOuter   ||
      e.firingError !== o.firingError
    );
  }, [activeColorIdx, originalColorIdx, editorState, originalState]);

  const handleReset = useCallback(() => {
    setActiveColorIdx(originalColorIdx);
    setEditorState(originalState);
  }, [originalColorIdx, originalState]);

  // Editor props — shared between desktop sidebar and mobile drawer
  const editorProps: EditorProps = {
    accentColor:    catColor,
    activeColorIdx,
    onColorChange:  setActiveColorIdx,
    state:          editorState,
    onStateChange:  setEditorState,
    isModified,
    onReset:        handleReset,
  };

  return (
    <div className="min-h-screen bg-[#0f1923] text-white overflow-x-hidden">

      {/* ── Main ── */}
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

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* Left: visibility grid — pushed below sidebar on mobile */}
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
                      code={crosshair.code}
                      bgStyle={{ background: "transparent" }}
                      colorOverride={activeHex}
                      cfgOverride={cfgOverride}
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

          {/* Right: sidebar — rises to top on mobile, sticky on desktop */}
          <div className="order-first lg:order-last flex flex-col gap-4 lg:sticky lg:top-[56px] lg:self-start">

            {/* ── Mobile-only: large live preview ── */}
            <div className="lg:hidden rounded-xl overflow-hidden border border-[#1c2f3d] aspect-square w-full max-w-[320px] mx-auto">
              <CrosshairRenderer
                code={crosshair.code}
                colorOverride={activeHex}
                cfgOverride={cfgOverride}
                fill
              />
            </div>
            {/* Editor — immediately after preview so sliders are visible while watching changes */}
            <CrosshairEditor {...editorProps} />

            {/* Import code */}
            <div className="rounded-xl border border-[#1c2f3d] bg-[#111e2a] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c2f3d]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Import Code</p>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="rounded-lg bg-[#070f18] border border-[#1c2f3d] px-3 py-3">
                  <code className="block font-mono text-xs text-slate-300 break-all leading-relaxed">{activeCode}</code>
                </div>
                <BigCopyButton code={activeCode} />
                <FavButton id={crosshair.id} />
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

// ── Crosshair editor ──────────────────────────────────────────────────────────

interface EditorProps {
  accentColor:    string;
  activeColorIdx: string;
  onColorChange:  (idx: string) => void;
  state:          EditorState;
  onStateChange:  (s: EditorState) => void;
  isModified:     boolean;
  onReset:        () => void;
}

function SliderRow({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  const pct     = ((value - min) / (max - min)) * 100;
  const display = step < 1 ? value.toFixed(2) : String(value);
  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="w-9 text-right font-mono text-xs font-bold text-cyan-400 tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 cursor-pointer appearance-none rounded-full
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#111e2a,0_0_8px_rgba(34,211,238,0.5)]
          [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400
          [&::-moz-range-thumb]:cursor-pointer"
        style={{ background: `linear-gradient(to right, #22d3ee ${pct}%, #1c2f3d ${pct}%)` }}
      />
    </div>
  );
}

function ToggleRow({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-slate-500">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={[
          "relative flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none",
          value
            ? "border border-cyan-400/50 bg-cyan-400/20"
            : "border border-[#2a3f52] bg-[#0d1a24]",
        ].join(" ")}
        aria-pressed={value} role="switch"
      >
        <span
          className={[
            "absolute h-3.5 w-3.5 rounded-full shadow transition-all duration-200",
            value
              ? "left-[18px] bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]"
              : "left-[3px] bg-slate-600",
          ].join(" ")}
        />
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

function CrosshairEditor({
  accentColor, activeColorIdx, onColorChange, state, onStateChange,
  isModified, onReset,
}: EditorProps) {
  const set = useCallback(
    (patch: Partial<EditorState>) => onStateChange({ ...state, ...patch }),
    [state, onStateChange],
  );
  const activeColor = VALORANT_COLORS.find((c) => c.idx === activeColorIdx) ?? VALORANT_COLORS[0];

  return (
    <div className="rounded-xl border border-[#1c2f3d] bg-[#111e2a] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2f3d]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Editor</p>
        <div className="flex items-center gap-2">
          {/* Reset button — only shown when state differs from original */}
          {isModified && (
            <button
              onClick={onReset}
              title="Reset to original crosshair"
              className="flex items-center gap-1 rounded border border-[#2a3f52] bg-[#0d1a24] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 transition-all duration-150 hover:border-orange-400/40 hover:bg-orange-400/10 hover:text-orange-400"
            >
              {/* Undo/reset icon */}
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 8a6 6 0 1 0 1.5-4M2 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Reset
            </button>
          )}
          <span
            className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border leading-none"
            style={{ color: accentColor, background: accentColor + "18", borderColor: accentColor + "40" }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Color row */}
      <div className="px-4 py-3 border-b border-[#1c2f3d]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs text-slate-500">Color</span>
          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm border border-white/10 inline-block shrink-0"
              style={{ background: activeColor.hex }}
            />
            {activeColor.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {VALORANT_COLORS.map(({ idx, hex, label }) => {
            const isActive = idx === activeColorIdx;
            return (
              <button
                key={idx}
                title={label}
                onClick={() => onColorChange(idx)}
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
                    <path
                      d="M1.5 5l2.5 2.5 4.5-4.5"
                      stroke={hex === "#ffffff" || hex === "#ffd700" || hex === "#c8ff00" || hex === "#aeff3a" ? "#000" : "#fff"}
                      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="divide-y divide-[#1c2f3d] border-b border-[#1c2f3d]">
        <ToggleRow label="Center Dot"   value={state.hasDot}      onChange={(v) => set({ hasDot: v })} />
        <ToggleRow label="Firing Error" value={state.firingError} onChange={(v) => set({ firingError: v })} />
      </div>

      {/* Inner lines */}
      <SectionLabel>Inner Lines</SectionLabel>
      <div className="divide-y divide-[#1c2f3d]">
        <SliderRow label="Thickness" value={state.innerThickness} min={1} max={10} step={1}    onChange={(v) => set({ innerThickness: v })} />
        <SliderRow label="Length"    value={state.innerLength}    min={0} max={20} step={1}    onChange={(v) => set({ innerLength: v })} />
        <SliderRow label="Gap"       value={state.innerOffset}    min={0} max={20} step={1}    onChange={(v) => set({ innerOffset: v })} />
        <SliderRow label="Opacity"   value={state.innerAlpha}     min={0} max={1}  step={0.05} onChange={(v) => set({ innerAlpha: v })} />
      </div>

      {/* Outer lines */}
      <SectionLabel>Outer Lines</SectionLabel>
      <ToggleRow label="Enable Outer Lines" value={state.showOuter} onChange={(v) => set({ showOuter: v })} />
      {state.showOuter && (
        <div className="divide-y divide-[#1c2f3d]">
          <SliderRow label="Thickness" value={state.outerThickness} min={1} max={10} step={1}    onChange={(v) => set({ outerThickness: v })} />
          <SliderRow label="Length"    value={state.outerLength}    min={1} max={20} step={1}    onChange={(v) => set({ outerLength: v })} />
          <SliderRow label="Gap"       value={state.outerOffset}    min={0} max={20} step={1}    onChange={(v) => set({ outerOffset: v })} />
          <SliderRow label="Opacity"   value={state.outerAlpha}     min={0} max={1}  step={0.05} onChange={(v) => set({ outerAlpha: v })} />
        </div>
      )}

      <div className="h-0.5 mt-1" style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
    </div>
  );
}
