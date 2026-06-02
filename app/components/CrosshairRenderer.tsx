"use client";

import { useEffect, useRef, type CSSProperties } from "react";
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
  /** vertical inner length when 0v param differs from 0l (undefined = same as innerLength) */
  innerLengthV?: number;
  innerOffset: number;
  innerThickness: number;
  innerAlpha: number;
  showInner: boolean;
  outerLength: number;
  /** vertical outer length when 1v param differs from 1l (undefined = same as outerLength) */
  outerLengthV?: number;
  outerOffset: number;
  outerThickness: number;
  outerAlpha: number;
  showOuter: boolean;
  outlineOpacity: number;
  innerErrorOffset: number;
  outerErrorOffset: number;
}

const PRESET: Record<string, string> = {
  "0": "#ffffff", "1": "#00ff44", "2": "#ffd700", "3": "#4499ff",
  "4": "#ff4040", "5": "#00e5ff", "6": "#ff77dd", "7": "#ff8800",
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

const BASE_FIRING_ERR   = 3;
const BASE_MOVEMENT_ERR = 5;

// Section-aware parser for legacy code string → ParsedCrosshair
export function parseCrosshair(code: string): ParsedCrosshair {
  const parts = code.split(";");
  const p: Record<string, string> = {};
  let section = "pre";
  let i = 0;

  while (i < parts.length) {
    const k = parts[i];
    if (i === 0)                                          { i++; continue; }
    if (k === "P")                                        { section = "P"; i++; continue; }
    if (k === "A" || k === "S" || k === "G" || k === "X") { section = k;   i++; continue; }
    if (section !== "P")                                  { i++; continue; }

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

  const innMovErr   = p["0m"] !== undefined ? p["0m"] !== "0" : false;
  const innMovMult  = clamp(parseFloat(p["0e"] ?? "1"), 0, 3);
  const innFireErr  = p["0f"] !== undefined ? p["0f"] !== "0" : false;
  const innFireMult = clamp(parseFloat(p["0s"] ?? "1"), 0, 3);
  const outMovErr   = p["1m"] !== undefined ? p["1m"] !== "0" : false;
  const outMovMult  = clamp(parseFloat(p["1e"] ?? "1"), 0, 3);
  const outFireErr  = p["1f"] !== undefined ? p["1f"] !== "0" : false;
  const outFireMult = clamp(parseFloat(p["1s"] ?? "1"), 0, 3);

  return {
    color,
    hasDot:           p["h"] === "1" || p["d"] === "1",
    dotThickness:     clamp(parseFloat(p["z"] ?? "2"), 1, 6),
    innerLength:      clamp(parseFloat(p["0l"] ?? p["l"] ?? "6"),  0, 25),
    innerLengthV:     (() => { const v = p["0v"]; if (v === undefined) return undefined; const n = parseFloat(v); return isNaN(n) ? undefined : clamp(n, 0, 25); })(),
    innerOffset:      clamp(parseFloat(p["0o"] ?? "3"),             0, 50),
    innerThickness:   clamp(parseFloat(p["0t"] ?? p["t"] ?? "2"),  1, 10),
    innerAlpha:       (() => { const v = parseFloat(p["0a"] ?? p["a"] ?? "0"); return v > 0 ? clamp(v, 0, 1) : 1; })(),
    showInner:        p["0b"] !== "0",
    outerLength:      clamp(parseFloat(p["1l"] ?? "0"),            0, 25),
    outerLengthV:     (() => { const v = p["1v"]; if (v === undefined) return undefined; const n = parseFloat(v); return isNaN(n) ? undefined : clamp(n, 0, 25); })(),
    outerOffset:      clamp(parseFloat(p["1o"] ?? "0"),            0, 50),
    outerThickness:   clamp(parseFloat(p["1t"] ?? p["t"] ?? "2"), 1, 10),
    outerAlpha:       (() => { const v = parseFloat(p["1a"] ?? "0"); return v > 0 ? clamp(v, 0, 1) : 1; })(),
    showOuter:        p["1b"] !== "0",
    outlineOpacity:   clamp(parseFloat(p["o"] ?? "0"),             0,  1),
    innerErrorOffset: (innMovErr  ? BASE_MOVEMENT_ERR * innMovMult  : 0) +
                      (innFireErr ? BASE_FIRING_ERR   * innFireMult : 0),
    outerErrorOffset: (outMovErr  ? BASE_MOVEMENT_ERR * outMovMult  : 0) +
                      (outFireErr ? BASE_FIRING_ERR   * outFireMult : 0),
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

// ── Canvas constants ──────────────────────────────────────────────────────────

const CANVAS       = 128;
const CENTER       = CANVAS / 2;  // 64
const OUTLINE_HALF = 2;           // outline extends this many pixels beyond each line edge

// ── Canvas primitives ─────────────────────────────────────────────────────────

function canvasLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  thickness: number, color: string, opacity: number,
) {
  if (opacity <= 0) return;
  ctx.globalAlpha = opacity;
  ctx.fillStyle   = color;
  if (y1 === y2) {
    // horizontal
    const lx = Math.round(Math.min(x1, x2));
    const rx = Math.round(Math.max(x1, x2));
    const ty = Math.round(y1) - Math.floor(thickness / 2);
    if (rx > lx) ctx.fillRect(lx, ty, rx - lx, thickness);
  } else {
    // vertical
    const ty = Math.round(Math.min(y1, y2));
    const by = Math.round(Math.max(y1, y2));
    const lx = Math.round(x1) - Math.floor(thickness / 2);
    if (by > ty) ctx.fillRect(lx, ty, thickness, by - ty);
  }
  ctx.globalAlpha = 1;
}

function canvasCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  color: string, opacity: number,
) {
  if (opacity <= 0 || r <= 0) return;
  ctx.globalAlpha = opacity;
  ctx.fillStyle   = color;
  ctx.beginPath();
  ctx.arc(Math.round(cx), Math.round(cy), r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ── Legacy renderer (CrosshairCard — uses ParsedCrosshair) ────────────────────

function drawLegacy(
  ctx: CanvasRenderingContext2D,
  cfg: ParsedCrosshair,
  colorOverride?: string,
) {
  const col = colorOverride ?? cfg.color;
  const oOp = cfg.outlineOpacity;

  type Cmd = { x1: number; y1: number; x2: number; y2: number; t: number; a: number };
  const outlines: Cmd[] = [];
  const fgLines:  Cmd[] = [];

  function addLine(x1: number, y1: number, x2: number, y2: number, t: number, a: number) {
    if (a <= 0) return;
    if (oOp > 0) outlines.push({ x1, y1, x2, y2, t: t + OUTLINE_HALF * 2, a: oOp });
    fgLines.push({ x1, y1, x2, y2, t, a });
  }

  // Unified scale from visible lines — account for both extent and thickness
  const innerActive = cfg.showInner && cfg.innerLength > 0 && cfg.innerAlpha > 0;
  const outerActive = cfg.showOuter && cfg.outerLength > 0 && cfg.outerAlpha > 0;
  const scale = (() => {
    let maxExt = 0, maxT = 0;
    if (innerActive) {
      const vLen = cfg.innerLengthV ?? cfg.innerLength;
      maxExt = Math.max(maxExt, cfg.innerOffset + cfg.innerErrorOffset + Math.max(cfg.innerLength, vLen));
      maxT   = Math.max(maxT, cfg.innerThickness);
    }
    if (outerActive) {
      const vLen = cfg.outerLengthV ?? cfg.outerLength;
      maxExt = Math.max(maxExt, cfg.outerOffset + cfg.outerErrorOffset + Math.max(cfg.outerLength, vLen));
      maxT   = Math.max(maxT, cfg.outerThickness);
    }
    const byExt   = maxExt > 0 ? (CENTER * 0.80) / maxExt : 5;
    // Thick lines (block-style crosshairs): prevent half-thickness from overflowing
    const byThick = maxT   > 3  ? (CENTER * 0.55) / maxT   : 8;
    return Math.min(6, byExt, byThick);
  })();

  // Scale thickness: thin lines (≤2) stay pixel-accurate; thick lines scale proportionally
  function sT(t: number) { return t <= 2 ? t : Math.round(t * scale); }

  if (cfg.showInner && cfg.innerLength > 0) {
    const gap  = (cfg.innerOffset + cfg.innerErrorOffset) * scale;
    const hLen = cfg.innerLength * scale;
    const vLen = (cfg.innerLengthV ?? cfg.innerLength) * scale;
    const t = sT(cfg.innerThickness), a = cfg.innerAlpha;
    if (hLen > 0) {
      addLine(CENTER + gap, CENTER, CENTER + gap + hLen, CENTER, t, a);
      addLine(CENTER - gap, CENTER, CENTER - gap - hLen, CENTER, t, a);
    }
    if (vLen > 0) {
      addLine(CENTER, CENTER + gap, CENTER, CENTER + gap + vLen, t, a);
      addLine(CENTER, CENTER - gap, CENTER, CENTER - gap - vLen, t, a);
    }
  }

  if (cfg.showOuter && cfg.outerLength > 0) {
    const gap  = (cfg.outerOffset + cfg.outerErrorOffset) * scale;
    const hLen = cfg.outerLength * scale;
    const vLen = (cfg.outerLengthV ?? cfg.outerLength) * scale;
    const t = sT(cfg.outerThickness), a = cfg.outerAlpha;
    if (hLen > 0) {
      addLine(CENTER + gap, CENTER, CENTER + gap + hLen, CENTER, t, a);
      addLine(CENTER - gap, CENTER, CENTER - gap - hLen, CENTER, t, a);
    }
    if (vLen > 0) {
      addLine(CENTER, CENTER + gap, CENTER, CENTER + gap + vLen, t, a);
      addLine(CENTER, CENTER - gap, CENTER, CENTER - gap - vLen, t, a);
    }
  }

  // Draw outlines first, colored lines on top
  for (const o of outlines) canvasLine(ctx, o.x1, o.y1, o.x2, o.y2, o.t, "#000000", o.a);
  for (const l of fgLines)  canvasLine(ctx, l.x1, l.y1, l.x2, l.y2, l.t, col, l.a);

  if (cfg.hasDot) {
    const isDotOnly = !cfg.showInner || cfg.innerLength === 0 || cfg.innerAlpha === 0;
    const r = isDotOnly
      ? Math.max(2.25, cfg.dotThickness * 0.96)
      : Math.max(1,    cfg.dotThickness * 0.48);
    const dotAlpha = cfg.innerAlpha > 0 ? cfg.innerAlpha : 1;
    if (oOp > 0) canvasCircle(ctx, CENTER, CENTER, r + OUTLINE_HALF, "#000000", oOp);
    canvasCircle(ctx, CENTER, CENTER, r, col, dotAlpha);
  }

}

// ── Settings-based renderer (DetailClient — full feature support) ─────────────

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
  let maxExt = 0, maxT = 0;

  if (inn.show && inn.length > 0 && inn.opacity > 0) {
    const ext = inn.offset + errorOffset(inn) + Math.max(inn.length, inn.length2 ?? 0);
    maxExt = Math.max(maxExt, ext);
    maxT   = Math.max(maxT, inn.thickness);
  }
  if (out.show && out.length > 0 && out.opacity > 0) {
    const ext = out.offset + errorOffset(out) + Math.max(out.length, out.length2 ?? 0);
    maxExt = Math.max(maxExt, ext);
    maxT   = Math.max(maxT, out.thickness);
  }
  if (g.centerDot) {
    maxExt = Math.max(maxExt, g.centerDotThickness * 2);
  }
  const byExt   = maxExt > 0 ? (CENTER * 0.85) / maxExt : 6;
  const byThick = maxT   > 3  ? (CENTER * 0.55) / maxT   : 10;
  return Math.min(8, Math.max(2, Math.min(byExt, byThick)));
}

function drawFromSettings(ctx: CanvasRenderingContext2D, settings: CrosshairSettings) {
  const g   = settings.general;
  const inn = settings.primary.innerLines;
  const out = settings.primary.outerLines;

  const outEnabled = g.outlines && g.outlineOpacity > 0;
  const oHalf      = g.outlineThickness;
  const scale      = globalScale(settings);
  const col        = colorHex(settings);

  type Cmd = { x1: number; y1: number; x2: number; y2: number; t: number; a: number };
  const outlines: Cmd[] = [];
  const fgLines:  Cmd[] = [];

  function addLine(x1: number, y1: number, x2: number, y2: number, t: number, a: number) {
    if (a <= 0) return;
    if (outEnabled) outlines.push({ x1, y1, x2, y2, t: t + oHalf * 2, a: g.outlineOpacity });
    fgLines.push({ x1, y1, x2, y2, t, a });
  }

  function sT(t: number) { return t <= 2 ? t : Math.round(t * scale); }

  // Inner lines
  if (inn.show && inn.length > 0) {
    const errOff = errorOffset(inn) * scale;
    const gap    = inn.offset * scale + errOff;
    const hLen   = inn.length              * scale;
    const vLen   = (inn.length2 ?? inn.length) * scale;
    const t = sT(inn.thickness), a = inn.opacity;
    if (hLen > 0) {
      addLine(CENTER + gap, CENTER,       CENTER + gap + hLen, CENTER,             t, a);
      addLine(CENTER - gap, CENTER,       CENTER - gap - hLen, CENTER,             t, a);
    }
    if (vLen > 0) {
      addLine(CENTER, CENTER + gap,       CENTER,             CENTER + gap + vLen, t, a);
      addLine(CENTER, CENTER - gap,       CENTER,             CENTER - gap - vLen, t, a);
    }
  }

  // Outer lines
  if (out.show && out.length > 0) {
    const errOff = errorOffset(out) * scale;
    const gap    = out.offset * scale + errOff;
    const hLen   = out.length              * scale;
    const vLen   = (out.length2 ?? out.length) * scale;
    const t = sT(out.thickness), a = out.opacity;
    if (hLen > 0) {
      addLine(CENTER + gap, CENTER,       CENTER + gap + hLen, CENTER,             t, a);
      addLine(CENTER - gap, CENTER,       CENTER - gap - hLen, CENTER,             t, a);
    }
    if (vLen > 0) {
      addLine(CENTER, CENTER + gap,       CENTER,             CENTER + gap + vLen, t, a);
      addLine(CENTER, CENTER - gap,       CENTER,             CENTER - gap - vLen, t, a);
    }
  }

  // Draw outlines first, colored lines on top
  for (const o of outlines) canvasLine(ctx, o.x1, o.y1, o.x2, o.y2, o.t, "#000000", o.a);
  for (const l of fgLines)  canvasLine(ctx, l.x1, l.y1, l.x2, l.y2, l.t, col, l.a);

  // Center dot
  if (g.centerDot) {
    const isDotOnly = !inn.show || inn.length === 0 || inn.opacity === 0;
    const r = isDotOnly
      ? Math.max(2, g.centerDotThickness * scale * 0.5)
      : Math.max(1, g.centerDotThickness * scale * 0.5);
    const dotAlpha = inn.opacity > 0 ? inn.opacity : g.centerDotOpacity;
    if (outEnabled) canvasCircle(ctx, CENTER, CENTER, r + oHalf, "#000000", g.outlineOpacity);
    canvasCircle(ctx, CENTER, CENTER, r, col, dotAlpha);
  }

}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  settings?: CrosshairSettings;
  code?: string;
  bg?: BgMode;
  bgStyle?: CSSProperties;
  size?: number;
  fill?: boolean;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS, CANVAS);

    if (settings) {
      drawFromSettings(ctx, settings);
    } else {
      const parsed = parseCrosshair(code ?? "0;P;c;5;0l;4;0o;2;0a;1");
      const cfg    = cfgOverride ? { ...parsed, ...cfgOverride } : parsed;
      drawLegacy(ctx, cfg, colorOverride);
    }
  }, [settings, code, cfgOverride, colorOverride]);

  const containerStyle = bgStyle ?? BG_CSS[bg];
  const canvasStyle: CSSProperties = {
    display:        "block",
    imageRendering: "pixelated",
  };

  if (fill) {
    return (
      <div className="flex items-center justify-center w-full h-full" style={containerStyle}>
        <canvas
          ref={canvasRef}
          width={CANVAS}
          height={CANVAS}
          style={{ ...canvasStyle, width: "100%", height: "100%" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-sm"
      style={{ ...containerStyle, width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS}
        height={CANVAS}
        style={{ ...canvasStyle, width: size, height: size }}
        aria-hidden="true"
      />
    </div>
  );
}
