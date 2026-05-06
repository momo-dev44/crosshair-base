import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  type CrosshairSettings,
  type LineSettings,
  colorHex,
} from "@/lib/crosshair";

// ── Legacy types (kept for CrosshairCard backwards compat) ────────────────────

export type BgMode = "default" | "Icebox" | "Breeze" | "Bind";

export interface ParsedCrosshair {
  color: string;
  hasDot: boolean;
  dotThickness: number;
  innerLength: number;
  innerOffset: number;
  innerThickness: number;
  innerAlpha: number;
  showInner: boolean;
  outerLength: number;
  outerOffset: number;
  outerThickness: number;
  outerAlpha: number;
  showOuter: boolean;
  outlineOpacity: number;
}

const PRESET: Record<string, string> = {
  "0": "#ffffff", "1": "#00ff44", "2": "#ffd700", "3": "#4499ff",
  "4": "#ff4040", "5": "#00e5ff", "6": "#ff77dd", "7": "#ff8800",
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// Section-aware parser for legacy code string → ParsedCrosshair
export function parseCrosshair(code: string): ParsedCrosshair {
  const parts = code.split(";");
  const p: Record<string, string> = {};
  let section = "pre";
  let i = 0;

  while (i < parts.length) {
    const k = parts[i];
    if (i === 0)                                         { i++; continue; }
    if (k === "P")                                       { section = "P"; i++; continue; }
    if (k === "A" || k === "S" || k === "G" || k === "X") { section = k; i++; continue; }
    if (section !== "P")                                 { i++; continue; }

    const next = parts[i + 1];
    if (next !== undefined && (/^-?[\d.]+$/.test(next) || next.startsWith("#"))) {
      p[k] = next; i += 2;
    } else { i++; }
  }

  const colorId = p["c"] ?? "0";
  let color: string;
  if ((colorId === "7" || colorId === "8") && p["u"]) {
    color = p["u"].slice(0, 7);
  } else {
    color = PRESET[colorId] ?? "#ffffff";
  }

  return {
    color,
    hasDot:         p["h"] === "1" || p["d"] === "1",
    dotThickness:   clamp(parseFloat(p["0t"] ?? p["t"] ?? "2"), 1, 10),
    innerLength:    clamp(parseFloat(p["0l"] ?? p["l"] ?? "6"),  0, 25),
    innerOffset:    clamp(parseFloat(p["0o"] ?? "3"),             0, 50),
    innerThickness: clamp(parseFloat(p["0t"] ?? p["t"] ?? "2"),  1, 10),
    innerAlpha:     clamp(parseFloat(p["0a"] ?? p["a"] ?? "1"),  0,  1),
    showInner:      p["0s"] !== "0" && p["0b"] !== "0",
    outerLength:    clamp(parseFloat(p["1l"] ?? "0"),            0, 25),
    outerOffset:    clamp(parseFloat(p["1o"] ?? "0"),            0, 50),
    outerThickness: clamp(parseFloat(p["1t"] ?? p["t"] ?? "2"), 1, 10),
    outerAlpha:     clamp(parseFloat(p["1a"] ?? "0.35"),         0,  1),
    showOuter:      p["1s"] !== "0" && p["1b"] !== "0",
    outlineOpacity: clamp(parseFloat(p["o"] ?? "0"),             0,  1),
  };
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

const overlay = "rgba(6,14,22,0.55)";

export const BG_CSS: Record<BgMode, CSSProperties> = {
  default: { background: "radial-gradient(circle at 50% 45%, #1e2d3d 0%, #101c28 50%, #080f18 100%)" },
  Icebox:  { backgroundImage: `linear-gradient(${overlay},${overlay}), url(https://picsum.photos/seed/icebox-snow/800/800)`, backgroundSize: "cover", backgroundPosition: "center" },
  Breeze:  { backgroundImage: `linear-gradient(${overlay},${overlay}), url(https://picsum.photos/seed/breeze-ocean/800/800)`, backgroundSize: "cover", backgroundPosition: "center" },
  Bind:    { backgroundImage: `linear-gradient(${overlay},${overlay}), url(https://picsum.photos/seed/bind-desert/800/800)`, backgroundSize: "cover", backgroundPosition: "center" },
};

// ── SVG constants ─────────────────────────────────────────────────────────────

const CANVAS = 200;
const CENTER = CANVAS / 2;  // 100

// ── Legacy renderer (used by CrosshairCard via code prop) ─────────────────────

const LEGACY_OUTLINE_HALF = 2;

function buildLinesLegacy(cfg: ParsedCrosshair, colorOverride?: string): ReactNode[] {
  const bg: ReactNode[] = [];
  const fg: ReactNode[] = [];
  const col  = colorOverride ?? cfg.color;
  const oOp  = cfg.outlineOpacity;

  function addLine(
    key: string, x1: number, y1: number, x2: number, y2: number,
    t: number, a: number,
  ) {
    if (oOp > 0) {
      bg.push(<line key={`${key}_out`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#000000" strokeWidth={t + LEGACY_OUTLINE_HALF * 2}
        strokeLinecap="square" opacity={oOp} />);
    }
    fg.push(<line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />);
  }

  if (cfg.showInner && cfg.innerLength > 0) {
    const maxExtent = cfg.innerOffset + cfg.innerLength;
    const scale = maxExtent > 0 ? Math.min(6, (CENTER * 0.78) / maxExtent) : 4;
    const gap = cfg.innerOffset * scale;
    const len = cfg.innerLength * scale;
    const t = cfg.innerThickness, a = cfg.innerAlpha;
    addLine("r",  CENTER + gap, CENTER,       CENTER + gap + len, CENTER,             t, a);
    addLine("l",  CENTER - gap, CENTER,       CENTER - gap - len, CENTER,             t, a);
    addLine("dn", CENTER,       CENTER + gap, CENTER,             CENTER + gap + len, t, a);
    addLine("u",  CENTER,       CENTER - gap, CENTER,             CENTER - gap - len, t, a);
  }

  if (cfg.showOuter && cfg.outerLength > 0) {
    const om    = cfg.outerOffset + cfg.outerLength;
    const os    = om > 0 ? Math.min(6, (CENTER * 0.95) / om) : 4;
    const gap   = cfg.outerOffset * os;
    const len   = cfg.outerLength * os;
    const t = cfg.outerThickness, a = cfg.outerAlpha;
    addLine("or", CENTER + gap, CENTER,       CENTER + gap + len, CENTER,             t, a);
    addLine("ol", CENTER - gap, CENTER,       CENTER - gap - len, CENTER,             t, a);
    addLine("od", CENTER,       CENTER + gap, CENTER,             CENTER + gap + len, t, a);
    addLine("ou", CENTER,       CENTER - gap, CENTER,             CENTER - gap - len, t, a);
  }

  if (cfg.hasDot) {
    const isDotOnly = !cfg.showInner || cfg.innerLength === 0;
    const r = isDotOnly
      ? Math.max(3.5, cfg.dotThickness * 1.5)
      : Math.max(1.5, cfg.dotThickness * 0.55);
    const dotAlpha = cfg.innerAlpha > 0 ? cfg.innerAlpha : 1;

    if (oOp > 0) {
      bg.push(<circle key="dot_out" cx={CENTER} cy={CENTER}
        r={r + LEGACY_OUTLINE_HALF} fill="#000000" opacity={oOp} />);
    }
    fg.push(<circle key="dot" cx={CENTER} cy={CENTER} r={r} fill={col} opacity={dotAlpha} />);
  }

  return [...bg, ...fg];
}

// ── Settings-based renderer (full feature support) ────────────────────────────

// How far lines spread per unit of error multiplier (SVG canvas units)
const BASE_FIRING_ERR   = 3;
const BASE_MOVEMENT_ERR = 5;

function errorOffset(lines: LineSettings): number {
  let extra = 0;
  if (lines.firingError)   extra += BASE_FIRING_ERR   * lines.firingErrorMultiplier;
  if (lines.movementError) extra += BASE_MOVEMENT_ERR * lines.movementErrorMultiplier;
  return extra;
}

function globalScale(settings: CrosshairSettings): number {
  const inn = settings.primary.innerLines;
  const out = settings.primary.outerLines;
  const g   = settings.general;
  let max   = 0;

  if (inn.show && inn.length > 0) {
    const ext = inn.offset + errorOffset(inn) + Math.max(inn.length, inn.length2 ?? 0);
    max = Math.max(max, ext);
  }
  if (out.show && out.length > 0) {
    const ext = out.offset + errorOffset(out) + Math.max(out.length, out.length2 ?? 0);
    max = Math.max(max, ext);
  }
  if (g.centerDot) {
    max = Math.max(max, g.centerDotThickness * 2);
  }
  if (max <= 0) return 6;
  return Math.min(8, Math.max(2, (CENTER * 0.85) / max));
}

function buildLinesFromSettings(settings: CrosshairSettings): ReactNode[] {
  const g   = settings.general;
  const inn = settings.primary.innerLines;
  const out = settings.primary.outerLines;

  const outEnabled = g.outlines && g.outlineOpacity > 0;
  const oHalf      = g.outlineThickness;
  const scale      = globalScale(settings);
  const col        = colorHex(settings);

  const bg: ReactNode[] = [];
  const fg: ReactNode[] = [];

  function addLine(
    key: string, x1: number, y1: number, x2: number, y2: number,
    t: number, a: number,
  ) {
    if (outEnabled) {
      bg.push(<line key={`${key}_o`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#000000" strokeWidth={t + oHalf * 2}
        strokeLinecap="square" opacity={g.outlineOpacity} />);
    }
    fg.push(<line key={key} x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />);
  }

  // Inner lines
  if (inn.show && inn.length > 0) {
    const errOff = errorOffset(inn) * scale;
    const gap    = inn.offset * scale + errOff;
    const hLen   = inn.length              * scale;
    const vLen   = (inn.length2 ?? inn.length) * scale;
    const t = inn.thickness, a = inn.opacity;
    addLine("il_r",  CENTER + gap,       CENTER,             CENTER + gap + hLen, CENTER,             t, a);
    addLine("il_l",  CENTER - gap,       CENTER,             CENTER - gap - hLen, CENTER,             t, a);
    addLine("il_dn", CENTER,             CENTER + gap,       CENTER,             CENTER + gap + vLen, t, a);
    addLine("il_u",  CENTER,             CENTER - gap,       CENTER,             CENTER - gap - vLen, t, a);
  }

  // Outer lines
  if (out.show && out.length > 0) {
    const errOff = errorOffset(out) * scale;
    const gap    = out.offset * scale + errOff;
    const hLen   = out.length              * scale;
    const vLen   = (out.length2 ?? out.length) * scale;
    const t = out.thickness, a = out.opacity;
    addLine("ol_r",  CENTER + gap,       CENTER,             CENTER + gap + hLen, CENTER,             t, a);
    addLine("ol_l",  CENTER - gap,       CENTER,             CENTER - gap - hLen, CENTER,             t, a);
    addLine("ol_dn", CENTER,             CENTER + gap,       CENTER,             CENTER + gap + vLen, t, a);
    addLine("ol_u",  CENTER,             CENTER - gap,       CENTER,             CENTER - gap - vLen, t, a);
  }

  // Center dot
  if (g.centerDot) {
    const isDotOnly = !inn.show || inn.length === 0;
    const r = isDotOnly
      ? Math.max(3, g.centerDotThickness * scale * 0.5)
      : Math.max(1.5, g.centerDotThickness * 0.5);
    const dotAlpha = inn.opacity > 0 ? inn.opacity : g.centerDotOpacity;

    if (outEnabled) {
      bg.push(<circle key="dot_o" cx={CENTER} cy={CENTER}
        r={r + oHalf} fill="#000000" opacity={g.outlineOpacity} />);
    }
    fg.push(<circle key="dot" cx={CENTER} cy={CENTER} r={r} fill={col} opacity={dotAlpha} />);
  }

  return [...bg, ...fg];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  // New: pass CrosshairSettings directly (live editor — uses full feature set)
  settings?: CrosshairSettings;
  // Legacy: pass code string (CrosshairCard — uses legacy parser)
  code?: string;
  // Display
  bg?: BgMode;
  bgStyle?: CSSProperties;
  size?: number;
  fill?: boolean;
  // Legacy overrides (used when only `code` is provided)
  colorOverride?: string;
  cfgOverride?: Partial<ParsedCrosshair>;
}

export default function CrosshairRenderer({
  settings,
  code,
  bg = "default",
  bgStyle,
  size = 80,
  fill = false,
  colorOverride,
  cfgOverride,
}: Props) {
  const lines = useMemo(() => {
    if (settings) {
      // New path: full feature rendering from CrosshairSettings
      return buildLinesFromSettings(settings);
    }
    // Legacy path: parse code string, apply optional cfgOverride
    const parsed  = parseCrosshair(code ?? "0;P;c;5;0l;4;0o;2;0a;1");
    const cfg     = cfgOverride ? { ...parsed, ...cfgOverride } : parsed;
    return buildLinesLegacy(cfg, colorOverride);
  }, [settings, code, cfgOverride, colorOverride]);

  const containerStyle = bgStyle ?? BG_CSS[bg];

  if (fill) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={containerStyle}>
        <svg
          width="100%" height="100%"
          viewBox={`0 0 ${CANVAS} ${CANVAS}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
          aria-hidden="true"
        >
          {lines}
        </svg>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-sm"
      style={{ ...containerStyle, width: size, height: size }}
    >
      <svg
        width={size} height={size}
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        {lines}
      </svg>
    </div>
  );
}
