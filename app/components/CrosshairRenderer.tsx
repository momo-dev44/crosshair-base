import { useMemo, type CSSProperties, type ReactNode } from "react";

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
  /** `o` param — opacity of the black border drawn around every line/dot (0 = none, 1 = full) */
  outlineOpacity: number;
}

const PRESET: Record<string, string> = {
  "0": "#ffffff",
  "1": "#00ff44",
  "2": "#ffd700",
  "3": "#4499ff",
  "4": "#ff4040",
  "5": "#00e5ff",
  "6": "#ff77dd",
  "7": "#ff8800",
  "8": "#ff8800",
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// ── Section-aware parser ───────────────────────────────────────────────────────
// Reads only the "P" (primary) section to avoid the scope "S;c;0" clobbering the
// primary colour.  Also supports newer code params:
//   d  → center dot  (alias for h)
//   o  → outline opacity  (black border around every line)
//   t  → global thickness fallback for 0t / 1t

export function parseCrosshair(code: string): ParsedCrosshair {
  const parts = code.split(";");
  const p: Record<string, string> = {};
  let section = "pre";
  let i = 0;

  while (i < parts.length) {
    const k = parts[i];
    if (i === 0)                                       { i++; continue; }
    if (k === "P")                                     { section = "P"; i++; continue; }
    if (k === "A" || k === "S" || k === "G" || k === "X") { section = k; i++; continue; }
    if (section !== "P")                               { i++; continue; }

    const next = parts[i + 1];
    if (next !== undefined && (/^-?[\d.]+$/.test(next) || next.startsWith("#"))) {
      p[k] = next;
      i += 2;
    } else {
      i++;
    }
  }

  // Color
  const colorId = p["c"] ?? "0";
  let color: string;
  if ((colorId === "7" || colorId === "8") && p["u"]) {
    color = p["u"].slice(0, 7);
  } else {
    color = PRESET[colorId] ?? "#ffffff";
  }

  const innerLength    = clamp(parseFloat(p["0l"] ?? p["l"] ?? "6"),      0, 25);
  const innerOffset    = clamp(parseFloat(p["0o"] ?? "3"),                0, 50);
  const innerThickness = clamp(parseFloat(p["0t"] ?? p["t"] ?? "2"),      1, 10);
  const innerAlpha     = clamp(parseFloat(p["0a"] ?? "1"),                0,  1);
  const showInner      = p["0s"] !== "0";
  const outerLength    = clamp(parseFloat(p["1l"] ?? "0"),                0, 25);
  const outerOffset    = clamp(parseFloat(p["1o"] ?? "0"),                0, 50);
  const outerThickness = clamp(parseFloat(p["1t"] ?? p["t"] ?? "2"),      1, 10);
  const outerAlpha     = clamp(parseFloat(p["1a"] ?? "0.35"),             0,  1);
  const showOuter      = p["1s"] !== "0" && outerLength > 0;
  const hasDot         = p["h"] === "1" || p["d"] === "1";
  const outlineOpacity = clamp(parseFloat(p["o"]  ?? "0"),                0,  1);

  return {
    color, hasDot, dotThickness: innerThickness,
    innerLength, innerOffset, innerThickness, innerAlpha, showInner,
    outerLength, outerOffset, outerThickness, outerAlpha, showOuter,
    outlineOpacity,
  };
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

const overlay = "rgba(6,14,22,0.55)";

export const BG_CSS: Record<BgMode, CSSProperties> = {
  default: { background: "radial-gradient(circle at 50% 45%, #1e2d3d 0%, #101c28 50%, #080f18 100%)" },
  Icebox: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/icebox-snow/800/800)`,
    backgroundSize: "cover", backgroundPosition: "center",
  },
  Breeze: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/breeze-ocean/800/800)`,
    backgroundSize: "cover", backgroundPosition: "center",
  },
  Bind: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/bind-desert/800/800)`,
    backgroundSize: "cover", backgroundPosition: "center",
  },
};

// ── SVG geometry ──────────────────────────────────────────────────────────────

const CANVAS = 200;
const CENTER = CANVAS / 2;

// Width (in SVG units, per side) of the black border when outline is on.
// 2 units ≈ 1 screen pixel at typical card size — keeps it crisp without
// being so thick it overwhelms the crosshair shape.
const OUTLINE_HALF = 2;

function buildLines(cfg: ParsedCrosshair, colorOverride?: string) {
  // Two-pass rendering: outlines (black, wider) drawn first so colored lines sit on top.
  const bg: ReactNode[] = [];
  const fg: ReactNode[] = [];
  const col = colorOverride ?? cfg.color;
  const oOp = cfg.outlineOpacity;

  /** Push outline then colored line.  Outline is always at full `oOp` opacity so it
   *  remains visible even when the line itself is transparent (alpha=0). */
  function addLine(
    key: string,
    x1: number, y1: number,
    x2: number, y2: number,
    t: number, a: number,
  ) {
    if (oOp > 0) {
      bg.push(
        <line
          key={`${key}_out`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#000000"
          strokeWidth={t + OUTLINE_HALF * 2}
          strokeLinecap="square"
          opacity={oOp}
        />,
      );
    }
    fg.push(
      <line
        key={key}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={col}
        strokeWidth={t}
        strokeLinecap="square"
        opacity={a}
      />,
    );
  }

  // ── Inner lines ─────────────────────────────────────────────────────────────
  if (cfg.showInner && cfg.innerLength > 0) {
    const maxExtent = cfg.innerOffset + cfg.innerLength;
    const scale = maxExtent > 0 ? Math.min(6, (CENTER * 0.78) / maxExtent) : 4;
    const gap = cfg.innerOffset * scale;
    const len = cfg.innerLength * scale;
    const t   = cfg.innerThickness;
    const a   = cfg.innerAlpha;

    addLine("r",  CENTER + gap, CENTER,       CENTER + gap + len, CENTER,             t, a);
    addLine("l",  CENTER - gap, CENTER,       CENTER - gap - len, CENTER,             t, a);
    addLine("dn", CENTER,       CENTER + gap, CENTER,             CENTER + gap + len, t, a);
    addLine("u",  CENTER,       CENTER - gap, CENTER,             CENTER - gap - len, t, a);
  }

  // ── Outer lines ─────────────────────────────────────────────────────────────
  if (cfg.showOuter && cfg.outerLength > 0) {
    const om  = cfg.outerOffset + cfg.outerLength;
    const os  = om > 0 ? Math.min(6, (CENTER * 0.95) / om) : 4;
    const gap = cfg.outerOffset * os;
    const len = cfg.outerLength * os;
    const t   = cfg.outerThickness;
    const a   = cfg.outerAlpha;

    addLine("or", CENTER + gap, CENTER,       CENTER + gap + len, CENTER,             t, a);
    addLine("ol", CENTER - gap, CENTER,       CENTER - gap - len, CENTER,             t, a);
    addLine("od", CENTER,       CENTER + gap, CENTER,             CENTER + gap + len, t, a);
    addLine("ou", CENTER,       CENTER - gap, CENTER,             CENTER - gap - len, t, a);
  }

  // ── Center dot ──────────────────────────────────────────────────────────────
  if (cfg.hasDot) {
    const isDotOnly = !cfg.showInner || cfg.innerLength === 0;
    const r = isDotOnly
      ? Math.max(3.5, cfg.dotThickness * 1.5)
      : Math.max(1.5, cfg.dotThickness * 0.55);
    // When lines are transparent (alpha=0) the dot should still be fully visible
    const dotAlpha = cfg.innerAlpha > 0 ? cfg.innerAlpha : 1;

    if (oOp > 0) {
      bg.push(
        <circle key="dot_out" cx={CENTER} cy={CENTER} r={r + OUTLINE_HALF} fill="#000000" opacity={oOp} />,
      );
    }
    fg.push(
      <circle key="dot" cx={CENTER} cy={CENTER} r={r} fill={col} opacity={dotAlpha} />,
    );
  }

  return [...bg, ...fg];
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  code: string;
  bg?: BgMode;
  bgStyle?: CSSProperties;
  size?: number;
  fill?: boolean;
  colorOverride?: string;
  cfgOverride?: Partial<ParsedCrosshair>;
}

export default function CrosshairRenderer({
  code, bg = "default", bgStyle, size = 80, fill = false, colorOverride, cfgOverride,
}: Props) {
  const parsed = useMemo(() => parseCrosshair(code), [code]);
  const cfg    = useMemo(
    () => cfgOverride ? { ...parsed, ...cfgOverride } : parsed,
    [parsed, cfgOverride],
  );
  const lines  = useMemo(() => buildLines(cfg, colorOverride), [cfg, colorOverride]);

  if (fill) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={bgStyle ?? BG_CSS[bg]}>
        <svg
          width="100%"
          height="100%"
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
      style={{ ...(bgStyle ?? BG_CSS[bg]), width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
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
