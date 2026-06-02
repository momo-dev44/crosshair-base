// ── Types ─────────────────────────────────────────────────────────────────────

export interface LineSettings {
  show: boolean;
  opacity: number;
  length: number;
  length2?: number;
  thickness: number;
  offset: number;
  movementError: boolean;
  movementErrorMultiplier: number;
  firingError: boolean;
  firingErrorMultiplier: number;
}

export interface CrosshairSettings {
  general: {
    color: number;
    customColor?: string;
    outlines: boolean;
    outlineOpacity: number;
    outlineThickness: number;
    centerDot: boolean;
    centerDotOpacity: number;
    centerDotThickness: number;
    overrideFiringErrorOffset: boolean;
    overrideAllPrimaryWithPrimary: boolean;
  };
  primary: {
    innerLines: LineSettings;
    outerLines: LineSettings;
  };
  ads: {
    copyPrimary: boolean;
    innerLines: LineSettings;
    outerLines: LineSettings;
  };
  sniper: {
    centerDot: boolean;
    centerDotColor: number;
    centerDotOpacity: number;
    /** S;s param — scope ring scale (0 = hidden, ~0.6–0.8 = circular crosshair) */
    scopeScale: number;
  };
}

// ── Valorant colors ───────────────────────────────────────────────────────────

export const VALORANT_COLORS: { idx: number; hex: string; label: string }[] = [
  { idx: 0, hex: "#ffffff", label: "White" },
  { idx: 1, hex: "#00ff44", label: "Green" },
  { idx: 2, hex: "#c8ff00", label: "Yellow-Green" },
  { idx: 3, hex: "#aeff3a", label: "Green-Yellow" },
  { idx: 4, hex: "#ffd700", label: "Yellow" },
  { idx: 5, hex: "#00e5ff", label: "Cyan" },
  { idx: 6, hex: "#ff77dd", label: "Pink" },
  { idx: 7, hex: "#ff4040", label: "Red" },
];

export function colorHex(settings: CrosshairSettings): string {
  const { color, customColor } = settings.general;
  if ((color === 7 || color === 8) && customColor) return customColor.slice(0, 7);
  return VALORANT_COLORS.find((c) => c.idx === color)?.hex ?? "#ffffff";
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_INNER: LineSettings = {
  show: true,
  opacity: 1,
  length: 4,
  thickness: 2,
  offset: 2,
  movementError: false,
  movementErrorMultiplier: 1,
  firingError: false,
  firingErrorMultiplier: 1,
};

const DEFAULT_OUTER: LineSettings = {
  show: false,
  opacity: 1,
  length: 0,
  thickness: 2,
  offset: 0,
  movementError: false,
  movementErrorMultiplier: 1,
  firingError: false,
  firingErrorMultiplier: 1,
};

export const DEFAULT_CROSSHAIR: CrosshairSettings = {
  general: {
    color: 5,
    outlines: false,
    outlineOpacity: 1,
    outlineThickness: 1,
    centerDot: false,
    centerDotOpacity: 1,
    centerDotThickness: 2,
    overrideFiringErrorOffset: false,
    overrideAllPrimaryWithPrimary: false,
  },
  primary: {
    innerLines: { ...DEFAULT_INNER },
    outerLines: { ...DEFAULT_OUTER },
  },
  ads: {
    copyPrimary: true,
    innerLines: { ...DEFAULT_INNER },
    outerLines: { ...DEFAULT_OUTER },
  },
  sniper: {
    centerDot: false,
    centerDotColor: 0,
    centerDotOpacity: 0.75,
    scopeScale: 0,
  },
};

// ── Low-level helpers ─────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function b(v: string | undefined, def: boolean): boolean {
  return v !== undefined ? v !== "0" : def;
}

function n(v: string | undefined, def: number): number {
  if (v === undefined) return def;
  const x = parseFloat(v);
  return isNaN(x) ? def : x;
}

function fmt(v: number): string {
  return v.toFixed(2).replace(/\.?0+$/, "") || "0";
}

// ── Section extractor ─────────────────────────────────────────────────────────

function extractSection(code: string, section: string): Record<string, string> {
  const parts = code.split(";");
  const result: Record<string, string> = {};
  let cur = "";

  for (let i = 0; i < parts.length; i++) {
    const tok = parts[i];
    if (i === 0) continue; // version number
    if (tok === "P" || tok === "A" || tok === "S" || tok === "G" || tok === "X") {
      cur = tok;
      continue;
    }
    if (cur !== section) continue;

    const next = parts[i + 1];
    if (next !== undefined && (/^-?[\d.]+$/.test(next) || next.startsWith("#"))) {
      result[tok] = next;
      i++;
    }
  }
  return result;
}

// ── Line helpers ──────────────────────────────────────────────────────────────

function parseLines(
  prefix: "0" | "1",
  p: Record<string, string>,
  def: LineSettings,
): LineSettings {
  const rawOpacity = n(p[`${prefix}a`], def.opacity);
  // Both 0a=0 and 1a=0 mean "use default opacity" in Valorant format, not transparent
  const opacity = rawOpacity === 0 ? def.opacity : clamp(rawOpacity, 0, 1);

  const rawV = p[`${prefix}v`];
  // v absent → symmetric (same as horizontal); v present (including 0) → explicit vertical length
  const length2 = rawV !== undefined
    ? clamp(n(rawV, def.length), 0, 20)
    : undefined;

  return {
    show:                    b(p[`${prefix}b`], def.show),
    opacity,
    length:                  clamp(n(p[`${prefix}l`], def.length),  0, 20),
    length2,
    thickness:               clamp(n(p[`${prefix}t`], def.thickness), 0, 10),
    offset:                  clamp(n(p[`${prefix}o`], def.offset),    0, 40),
    movementError:           b(p[`${prefix}m`], def.movementError),
    movementErrorMultiplier: clamp(n(p[`${prefix}e`], def.movementErrorMultiplier), 0, 3),
    firingError:             b(p[`${prefix}f`], def.firingError),
    firingErrorMultiplier:   clamp(n(p[`${prefix}s`], def.firingErrorMultiplier), 0, 3),
  };
}

function appendLines(prefix: "0" | "1", lines: LineSettings, parts: string[]): void {
  parts.push(`${prefix}b`, lines.show ? "1" : "0");
  parts.push(`${prefix}t`, String(lines.thickness));
  parts.push(`${prefix}l`, String(lines.length));
  if (lines.length2 !== undefined) parts.push(`${prefix}v`, String(lines.length2));
  parts.push(`${prefix}o`, String(lines.offset));
  parts.push(`${prefix}a`, fmt(lines.opacity));
  if (lines.movementError) {
    parts.push(`${prefix}m`, "1");
    if (lines.movementErrorMultiplier !== 1)
      parts.push(`${prefix}e`, fmt(lines.movementErrorMultiplier));
  }
  if (lines.firingError) {
    parts.push(`${prefix}f`, "1");
    if (lines.firingErrorMultiplier !== 1)
      parts.push(`${prefix}s`, fmt(lines.firingErrorMultiplier));
  } else {
    parts.push(`${prefix}f`, "0");
  }
}

function fixOuterShow(lines: LineSettings, raw1b: string | undefined): LineSettings {
  if (raw1b !== undefined) return lines;
  const impliedShow = lines.length > 0 || (lines.length2 ?? 0) > 0;
  return impliedShow ? { ...lines, show: true } : lines;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseCrosshairCode(code: string): CrosshairSettings {
  const p = extractSection(code, "P");
  const a = extractSection(code, "A");
  const s = extractSection(code, "S");
  const hasAds = Object.keys(a).length > 0;
  const colorRaw = parseInt(p["c"] ?? "5", 10);
  const color = isNaN(colorRaw) ? 5 : clamp(colorRaw, 0, 8);

  // h = center dot (old format, used by most existing codes)
  // d = center dot (new format alias)
  // o in P section = outline opacity (0 = no outline)
  const outlineOpacity = clamp(n(p["o"], 0), 0, 1);

  return {
    general: {
      color,
      customColor:                   p["u"],
      outlines:                      outlineOpacity > 0,
      outlineOpacity,
      outlineThickness:              clamp(n(p["t"], 1), 1, 6),
      centerDot:                     b(p["h"], false) || b(p["d"], false),
      centerDotOpacity:              clamp(n(p["b"], 1), 0, 1),
      centerDotThickness:            clamp(n(p["z"], 2), 1, 6),
      overrideFiringErrorOffset:     false,
      overrideAllPrimaryWithPrimary: false,
    },
    primary: {
      innerLines: parseLines("0", p, DEFAULT_CROSSHAIR.primary.innerLines),
      outerLines: fixOuterShow(parseLines("1", p, DEFAULT_CROSSHAIR.primary.outerLines), p["1b"]),
    },
    ads: {
      copyPrimary: !hasAds,
      innerLines: hasAds
        ? parseLines("0", a, DEFAULT_CROSSHAIR.ads.innerLines)
        : { ...DEFAULT_CROSSHAIR.ads.innerLines },
      outerLines: hasAds
        ? fixOuterShow(parseLines("1", a, DEFAULT_CROSSHAIR.ads.outerLines), a["1b"])
        : { ...DEFAULT_CROSSHAIR.ads.outerLines },
    },
    sniper: {
      centerDot:          b(s["d"], false),
      centerDotColor:     clamp(parseInt(s["c"] ?? "0", 10) || 0, 0, 8),
      centerDotOpacity:   clamp(n(s["o"], 0.75), 0, 1),
      scopeScale: clamp(n(s["s"], 0), 0, 2),
    },
  };
}

export function generateCrosshairCode(settings: CrosshairSettings): string {
  const { general: g, primary: pr, ads, sniper: sn } = settings;
  const parts: string[] = ["0", "P"];

  parts.push("c", String(g.color));
  if ((g.color === 7 || g.color === 8) && g.customColor) parts.push("u", g.customColor);

  // Outlines: stored as `o` opacity in P section (o=0 means off)
  if (g.outlines && g.outlineOpacity > 0) {
    parts.push("o", fmt(g.outlineOpacity));
    parts.push("t", String(g.outlineThickness));
  }

  // Center dot: use `h` for Valorant import compatibility
  parts.push("h", g.centerDot ? "1" : "0");
  if (g.centerDot) {
    parts.push("b", fmt(g.centerDotOpacity));
    parts.push("z", String(g.centerDotThickness));
  }

  appendLines("0", pr.innerLines, parts);
  appendLines("1", pr.outerLines, parts);

  if (!ads.copyPrimary) {
    parts.push("A");
    appendLines("0", ads.innerLines, parts);
    appendLines("1", ads.outerLines, parts);
  }

  parts.push("S");
  if (sn.centerDot) parts.push("d", "1");
  parts.push("c", String(sn.centerDotColor));
  parts.push("s", fmt(sn.scopeScale));
  parts.push("o", fmt(sn.centerDotOpacity));

  return parts.join(";");
}

// Returns true when the string looks like a Valorant crosshair import code.
// Accepts loose format: version optional, just needs a P section.
export function isValidCrosshairCode(code: string): boolean {
  const t = code.trim();
  return /^0;P;/i.test(t) || /;P;/.test(t);
}

// ── Randomizer ────────────────────────────────────────────────────────────────

function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function rf(min: number, max: number, step: number): number {
  const steps = Math.round((max - min) / step);
  return Math.round((min + ri(0, steps) * step) * 100) / 100;
}

function randomLines(isOuter = false): LineSettings {
  const maxGap = isOuter ? 30 : 15;
  const hasErr = Math.random() > 0.65;
  return {
    show:                    true,
    opacity:                 rf(0.6, 1, 0.05),
    length:                  ri(1, isOuter ? 10 : 12),
    thickness:               ri(1, isOuter ? 6 : 8),
    offset:                  ri(0, maxGap),
    movementError:           hasErr && Math.random() > 0.5,
    movementErrorMultiplier: rf(0.5, 2.5, 0.1),
    firingError:             hasErr && Math.random() > 0.4,
    firingErrorMultiplier:   rf(0.5, 2.5, 0.1),
  };
}

export function randomCrosshair(): CrosshairSettings {
  const hasDot      = Math.random() > 0.65;
  const hasOutlines = Math.random() > 0.75;
  const hasOuter    = Math.random() > 0.55;

  return {
    general: {
      color:                         ri(0, 7),
      outlines:                      hasOutlines,
      outlineOpacity:                hasOutlines ? rf(0.5, 1, 0.1) : 1,
      outlineThickness:              ri(1, 3),
      centerDot:                     hasDot,
      centerDotOpacity:              1,
      centerDotThickness:            ri(1, 4),
      overrideFiringErrorOffset:     false,
      overrideAllPrimaryWithPrimary: false,
    },
    primary: {
      innerLines: { ...randomLines(false), show: Math.random() > 0.15 },
      outerLines: { ...randomLines(true),  show: hasOuter },
    },
    ads: {
      copyPrimary: true,
      innerLines:  { ...DEFAULT_CROSSHAIR.ads.innerLines },
      outerLines:  { ...DEFAULT_CROSSHAIR.ads.outerLines },
    },
    sniper: { centerDot: false, centerDotColor: 0, centerDotOpacity: 0.75, scopeScale: 0 },
  };
}

// Bridge: CrosshairSettings → shape compatible with ParsedCrosshair
// Used by DetailClient to feed the existing renderer until Roadmap step 2.
export function settingsToRendererCfg(settings: CrosshairSettings): {
  color: string;
  hasDot: boolean;
  dotThickness: number;
  showInner: boolean;
  innerLength: number;
  innerOffset: number;
  innerThickness: number;
  innerAlpha: number;
  showOuter: boolean;
  outerLength: number;
  outerOffset: number;
  outerThickness: number;
  outerAlpha: number;
  outlineOpacity: number;
  innerErrorOffset: number;
  outerErrorOffset: number;
} {
  const { general: g, primary: pr } = settings;
  const inn = pr.innerLines;
  const out = pr.outerLines;

  function errOff(lines: LineSettings): number {
    return (lines.movementError ? 5 * lines.movementErrorMultiplier : 0) +
           (lines.firingError   ? 3 * lines.firingErrorMultiplier   : 0);
  }

  return {
    color:            colorHex(settings),
    hasDot:           g.centerDot,
    dotThickness:     g.centerDotThickness,
    showInner:        inn.show && inn.length > 0,
    innerLength:      inn.length,
    innerOffset:      inn.offset,
    innerThickness:   inn.thickness,
    innerAlpha:       inn.opacity,
    showOuter:        out.show && out.length > 0,
    outerLength:      out.length,
    outerOffset:      out.offset,
    outerThickness:   out.thickness,
    outerAlpha:       out.opacity,
    outlineOpacity:   g.outlines ? g.outlineOpacity : 0,
    innerErrorOffset: errOff(inn),
    outerErrorOffset: errOff(out),
  };
}
