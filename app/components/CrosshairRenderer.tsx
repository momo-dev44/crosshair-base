import { useMemo, type CSSProperties } from "react";

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
// Valorant crosshair codes: 0;P;<primary params>;A;<ads params>;S;<scope params>
// The "S;c;0" scope color must NOT overwrite the "P;c;5" primary color.
// We only read keys that appear inside the "P" (primary) section.

export function parseCrosshair(code: string): ParsedCrosshair {
  const parts = code.split(";");
  const p: Record<string, string> = {};
  let section = "pre"; // pre | P | A | S | G
  let i = 0;

  while (i < parts.length) {
    const k = parts[i];

    // Version token at position 0
    if (i === 0) { i++; continue; }

    // Section markers
    if (k === "P") { section = "P"; i++; continue; }
    if (k === "A" || k === "S" || k === "G") { section = k; i++; continue; }

    // Only collect keys from the primary "P" section
    if (section !== "P") { i++; continue; }

    const next = parts[i + 1];
    if (next !== undefined && (/^-?[\d.]+$/.test(next) || next.startsWith("#"))) {
      p[k] = next;
      i += 2;
    } else {
      i++;
    }
  }

  // Resolve color
  const colorId = p["c"] ?? "0";
  let color: string;
  if ((colorId === "7" || colorId === "8") && p["u"]) {
    color = p["u"].slice(0, 7);
  } else {
    color = PRESET[colorId] ?? "#ffffff";
  }

  const innerLength    = clamp(parseFloat(p["0l"] ?? "6"),   0, 25);
  const innerOffset    = clamp(parseFloat(p["0o"] ?? "3"),   0, 20);
  const innerThickness = clamp(parseFloat(p["0t"] ?? p["t"] ?? "2"), 1, 10);
  const innerAlpha     = clamp(parseFloat(p["0a"] ?? "1"),   0, 1);
  const showInner      = p["0s"] !== "0";
  const outerLength    = clamp(parseFloat(p["1l"] ?? "0"),   0, 25);
  const outerOffset    = clamp(parseFloat(p["1o"] ?? "0"),   0, 20);
  const outerThickness = clamp(parseFloat(p["1t"] ?? "2"),   1, 10);
  const outerAlpha     = clamp(parseFloat(p["1a"] ?? "0.35"), 0, 1);
  const showOuter      = p["1s"] !== "0" && outerLength > 0;
  const hasDot         = p["h"] === "1";

  return {
    color, hasDot, dotThickness: innerThickness,
    innerLength, innerOffset, innerThickness, innerAlpha, showInner,
    outerLength, outerOffset, outerThickness, outerAlpha, showOuter,
  };
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

// Map image backgrounds use a semi-dark overlay so the crosshair stays visible.
const overlay = "rgba(6,14,22,0.55)";

export const BG_CSS: Record<BgMode, CSSProperties> = {
  default: { background: "radial-gradient(circle at 50% 45%, #1e2d3d 0%, #101c28 50%, #080f18 100%)" },
  Icebox: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/icebox-snow/800/800)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  Breeze: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/breeze-ocean/800/800)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
  Bind: {
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url(https://picsum.photos/seed/bind-desert/800/800)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },
};

// ── SVG geometry ──────────────────────────────────────────────────────────────

const CANVAS = 200;
const CENTER = CANVAS / 2;

function buildLines(cfg: ParsedCrosshair, colorOverride?: string): React.ReactNode[] {
  const els: React.ReactNode[] = [];
  const col = colorOverride ?? cfg.color;

  if (cfg.showInner && cfg.innerLength > 0) {
    const maxExtent = cfg.innerOffset + cfg.innerLength;
    const scale = maxExtent > 0 ? Math.min(6, (CENTER * 0.78) / maxExtent) : 4;
    const gap = cfg.innerOffset  * scale;
    const len = cfg.innerLength  * scale;
    const t   = cfg.innerThickness;
    const a   = cfg.innerAlpha;
    els.push(
      <line key="r" x1={CENTER+gap}     y1={CENTER}       x2={CENTER+gap+len} y2={CENTER}         stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="l" x1={CENTER-gap}     y1={CENTER}       x2={CENTER-gap-len} y2={CENTER}         stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="d" x1={CENTER}         y1={CENTER+gap}   x2={CENTER}         y2={CENTER+gap+len} stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="u" x1={CENTER}         y1={CENTER-gap}   x2={CENTER}         y2={CENTER-gap-len} stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
    );
  }

  if (cfg.showOuter && cfg.outerLength > 0) {
    const om  = cfg.outerOffset + cfg.outerLength;
    const os  = om > 0 ? Math.min(6, (CENTER * 0.95) / om) : 4;
    const gap = cfg.outerOffset * os;
    const len = cfg.outerLength * os;
    const t   = cfg.outerThickness;
    const a   = cfg.outerAlpha;
    els.push(
      <line key="or" x1={CENTER+gap} y1={CENTER}     x2={CENTER+gap+len} y2={CENTER}         stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="ol" x1={CENTER-gap} y1={CENTER}     x2={CENTER-gap-len} y2={CENTER}         stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="od" x1={CENTER}     y1={CENTER+gap} x2={CENTER}         y2={CENTER+gap+len} stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
      <line key="ou" x1={CENTER}     y1={CENTER-gap} x2={CENTER}         y2={CENTER-gap-len} stroke={col} strokeWidth={t} strokeLinecap="square" opacity={a} />,
    );
  }

  if (cfg.hasDot) {
    const isDotOnly = !cfg.showInner || cfg.innerLength === 0;
    const r = isDotOnly
      ? Math.max(3.5, cfg.dotThickness * 1.5)
      : Math.max(1.5, cfg.dotThickness * 0.55);
    els.push(<circle key="dot" cx={CENTER} cy={CENTER} r={r} fill={col} opacity={cfg.innerAlpha} />);
  }

  return els;
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

export default function CrosshairRenderer({ code, bg = "default", bgStyle, size = 80, fill = false, colorOverride, cfgOverride }: Props) {
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
    <div className="flex items-center justify-center rounded-sm" style={{ ...(bgStyle ?? BG_CSS[bg]), width: size, height: size }}>
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
