/**
 * Roadmap item 7 — Test parseCrosshairCode / generateCrosshairCode
 * against real Valorant crosshair codes.
 *
 * Run: npx tsx scripts/test-crosshair.ts
 */

import { parseCrosshairCode, generateCrosshairCode } from "../lib/crosshair";
import type { CrosshairSettings } from "../lib/crosshair";

// ── Mini assertion helpers ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok =
    typeof actual === "number" && typeof expected === "number"
      ? Math.abs(actual - expected) < 0.0001
      : actual === expected;
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}  got: ${JSON.stringify(actual)}  want: ${JSON.stringify(expected)}`);
    failed++;
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──────────────────────────────────────────────────────`);
}

function roundTrip(label: string, code: string) {
  const s1 = parseCrosshairCode(code);
  const gen = generateCrosshairCode(s1);
  const s2 = parseCrosshairCode(gen);

  // Deep compare the two parsed settings objects
  const same = JSON.stringify(s1) === JSON.stringify(s2);
  if (same) {
    console.log(`  ✓ round-trip: ${label}`);
    passed++;
  } else {
    console.error(`  ✗ round-trip: ${label}`);
    console.error(`    original code: ${code}`);
    console.error(`    generated:     ${gen}`);
    console.error(`    diff s1→s2: ${diffSummary(s1, s2)}`);
    failed++;
  }
}

function diffSummary(a: CrosshairSettings, b: CrosshairSettings): string {
  const diffs: string[] = [];
  const flat = (o: object, prefix = ""): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "object" && v !== null && !Array.isArray(v))
        Object.assign(out, flat(v as object, prefix ? `${prefix}.${k}` : k));
      else
        out[prefix ? `${prefix}.${k}` : k] = v;
    }
    return out;
  };
  const fa = flat(a), fb = flat(b);
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) {
    if (fa[k] !== fb[k]) diffs.push(`${k}: ${fa[k]} → ${fb[k]}`);
  }
  return diffs.join(", ") || "(none)";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

section("1. Standard default crosshair")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("color = 5 (cyan)", s.general.color, 5);
  eq("no center dot", s.general.centerDot, false);
  eq("no outlines", s.general.outlines, false);
  eq("inner show = true", s.primary.innerLines.show, true);
  eq("inner length = 4", s.primary.innerLines.length, 4);
  eq("inner offset = 2", s.primary.innerLines.offset, 2);
  eq("inner opacity = 1", s.primary.innerLines.opacity, 1);
  eq("inner firing error = false", s.primary.innerLines.firingError, false);
  eq("outer show = false", s.primary.outerLines.show, false);
  eq("ads copy primary = true", s.ads.copyPrimary, true);
}

section("2. Dot-only crosshair")
{
  const s = parseCrosshairCode("0;P;c;1;h;1;b;1;z;2;0b;0;1b;0");
  eq("color = 1 (green)", s.general.color, 1);
  eq("center dot = true", s.general.centerDot, true);
  eq("dot opacity = 1", s.general.centerDotOpacity, 1);
  eq("dot thickness = 2", s.general.centerDotThickness, 2);
  eq("inner show = false", s.primary.innerLines.show, false);
  eq("outer show = false", s.primary.outerLines.show, false);
}

section("3. Glasses (short lines + high offset)")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;1;0o;18;0t;2;0a;1;0f;0;1b;0");
  eq("inner length = 1", s.primary.innerLines.length, 1);
  eq("inner offset = 18", s.primary.innerLines.offset, 18);
  eq("inner thickness = 2", s.primary.innerLines.thickness, 2);
}

section("4. Windmill / Movement Error")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;4;0o;2;0a;1;0m;1;0e;2;0f;0;1b;0");
  eq("inner movement error = true", s.primary.innerLines.movementError, true);
  eq("movement multiplier = 2", s.primary.innerLines.movementErrorMultiplier, 2);
  eq("firing error = false", s.primary.innerLines.firingError, false);
}

section("5. Shuriken-like (outer lines + firing error)")
{
  // 1b;1 explicitly enables outer lines (default is off)
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;2;0o;3;0t;2;0a;1;0f;1;0s;1.5;1b;1;1l;4;1o;8;1t;2;1a;0.8");
  eq("inner length = 2", s.primary.innerLines.length, 2);
  eq("inner firing error = true", s.primary.innerLines.firingError, true);
  eq("inner fire multiplier = 1.5", s.primary.innerLines.firingErrorMultiplier, 1.5);
  eq("outer show = true", s.primary.outerLines.show, true);
  eq("outer length = 4", s.primary.outerLines.length, 4);
  eq("outer offset = 8", s.primary.outerLines.offset, 8);
  eq("outer opacity = 0.8", s.primary.outerLines.opacity, 0.8);
}

section("6. Custom color (hex)")
{
  const s = parseCrosshairCode("0;P;c;8;u;#FF00FF;h;0;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("color index = 8", s.general.color, 8);
  eq("customColor = #FF00FF", s.general.customColor, "#FF00FF");
}

section("7. Outlines")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;o;0.8;t;2;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("outlines = true", s.general.outlines, true);
  eq("outline opacity = 0.8", s.general.outlineOpacity, 0.8);
  eq("outline thickness = 2", s.general.outlineThickness, 2);
}

section("8. Center dot + inner + outer + outlines (full featured)")
{
  // 1b;1 explicitly enables outer lines
  const code = "0;P;c;5;h;1;b;0.8;z;3;o;0.5;t;1;0l;4;0o;2;0t;2;0a;1;0f;0;1b;1;1l;3;1o;5;1t;2;1a;0.7";
  const s = parseCrosshairCode(code);
  eq("center dot = true", s.general.centerDot, true);
  eq("dot opacity = 0.8", s.general.centerDotOpacity, 0.8);
  eq("dot thickness = 3", s.general.centerDotThickness, 3);
  eq("outline opacity = 0.5", s.general.outlineOpacity, 0.5);
  eq("outline thickness = 1", s.general.outlineThickness, 1);
  eq("inner length = 4", s.primary.innerLines.length, 4);
  eq("outer show = true", s.primary.outerLines.show, true);
  eq("outer length = 3", s.primary.outerLines.length, 3);
  eq("outer offset = 5", s.primary.outerLines.offset, 5);
  eq("outer opacity = 0.7", s.primary.outerLines.opacity, 0.7);
}

section("9. ADS section override")
{
  const code = "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0;A;0l;2;0o;1;0t;1;0a;1;0f;0;1b;0";
  const s = parseCrosshairCode(code);
  eq("ads copy primary = false", s.ads.copyPrimary, false);
  eq("ads inner length = 2", s.ads.innerLines.length, 2);
  eq("ads inner offset = 1", s.ads.innerLines.offset, 1);
  eq("ads inner thickness = 1", s.ads.innerLines.thickness, 1);
  // primary unchanged
  eq("primary inner length = 4", s.primary.innerLines.length, 4);
}

section("10. Sniper section")
{
  const code = "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0;S;d;1;c;2;s;3;o;0.6";
  const s = parseCrosshairCode(code);
  eq("sniper center dot = true", s.sniper.centerDot, true);
  eq("sniper dot color = 2", s.sniper.centerDotColor, 2);
  eq("sniper scope scale = 3", s.sniper.scopeScale, 3);
  eq("sniper dot opacity = 0.6", s.sniper.centerDotOpacity, 0.6);
}

section("11. `d` key as center dot (new Valorant format alias)")
{
  const s = parseCrosshairCode("0;P;c;5;d;1;b;0.9;z;2;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("center dot via `d` = true", s.general.centerDot, true);
  eq("dot opacity = 0.9", s.general.centerDotOpacity, 0.9);
}

section("12. Missing optional fields → defaults")
{
  // Minimal code — only version and Primary section marker
  const s = parseCrosshairCode("0;P;c;5");
  eq("color = 5", s.general.color, 5);
  eq("no dot (default)", s.general.centerDot, false);
  eq("inner show default = true", s.primary.innerLines.show, true);
  eq("inner length default = 4", s.primary.innerLines.length, 4);
  eq("inner offset default = 2", s.primary.innerLines.offset, 2);
  eq("outer show default = false", s.primary.outerLines.show, false);
}

section("13. Section pollution guard (S section should not overwrite P)")
{
  // c;0 in S section is sniper color, not primary color
  const code = "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0;S;c;0;s;1;o;1";
  const s = parseCrosshairCode(code);
  eq("primary color stays 5 (not 0)", s.general.color, 5);
  eq("sniper color = 0", s.sniper.centerDotColor, 0);
}

section("14. Outer line off via `1b;0`")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("outer lines hidden by 1b;0", s.primary.outerLines.show, false);
}

section("15. Inner line off via `0b;0`")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0b;0;0l;4;0o;2;0a;1;0f;0;1b;0");
  eq("inner lines hidden by 0b;0", s.primary.innerLines.show, false);
}

section("16. H≠V length (0v key)")
{
  const s = parseCrosshairCode("0;P;c;5;h;0;0l;6;0v;3;0o;2;0a;1;0f;0;1b;0");
  eq("inner length (H) = 6", s.primary.innerLines.length, 6);
  eq("inner length2 (V) = 3", s.primary.innerLines.length2, 3);
}

// ── Round-trip tests ──────────────────────────────────────────────────────────

section("Round-trip: parse → generate → parse")

roundTrip("standard default",   "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0");
roundTrip("dot only",           "0;P;c;1;h;1;b;1;z;2;0b;0;1b;0");
roundTrip("glasses",            "0;P;c;5;h;0;0l;1;0o;18;0t;2;0a;1;0f;0;1b;0");
roundTrip("windmill",           "0;P;c;5;h;0;0l;4;0o;2;0a;1;0m;1;0e;2;0f;0;1b;0");
roundTrip("with outer lines",   "0;P;c;5;h;0;0l;2;0o;3;0t;2;0a;1;0f;1;0s;1.5;1b;1;1l;4;1o;8;1t;2;1a;0.8");
roundTrip("custom color",       "0;P;c;8;u;#FF00FF;h;0;0l;4;0o;2;0a;1;0f;0;1b;0");
roundTrip("outlines",           "0;P;c;5;h;0;o;0.8;t;2;0l;4;0o;2;0a;1;0f;0;1b;0");
roundTrip("full featured",      "0;P;c;5;h;1;b;0.8;z;3;o;0.5;t;1;0l;4;0o;2;0t;2;0a;1;0f;0;1b;1;1l;3;1o;5;1t;2;1a;0.7");
roundTrip("ads override",       "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0;A;0l;2;0o;1;0t;1;0a;1;0f;0;1b;0");
roundTrip("sniper section",     "0;P;c;5;h;0;0l;4;0o;2;0a;1;0f;0;1b;0;S;d;1;c;2;s;3;o;0.6");
roundTrip("H≠V length",         "0;P;c;5;h;0;0l;6;0v;3;0o;2;0a;1;0f;0;1b;0");

// ── Known real-world Pro player codes ─────────────────────────────────────────

section("Pro player codes (real Valorant export strings)")

{
  // These are well-known community codes — verifying they parse without errors
  const codes: [string, string][] = [
    ["TenZ style",          "0;P;c;5;h;0;f;0;0l;4;0o;2;0a;1;0f;0;1b;0"],
    ["Aspas dot-only",      "0;P;c;5;h;1;b;1;z;4;0b;0;1b;0"],
    ["NRG FNS thick",       "0;P;c;1;h;0;0l;5;0o;3;0t;3;0a;1;0f;0;1b;0"],
    ["Yay classic",         "0;P;c;5;h;0;0l;4;0o;2;0t;2;0a;1;0f;0;1b;0"],
    ["s0m flower",          "0;P;c;5;h;1;b;0.8;z;2;0l;3;0o;5;0t;1;0a;0.8;0f;0;1b;0"],
    ["ScreaM style",        "0;P;c;7;u;#FF4C00;h;0;0l;4;0o;2;0t;2;0a;1;0f;0;1b;0"],
  ];

  for (const [name, code] of codes) {
    try {
      const s = parseCrosshairCode(code);
      const gen = generateCrosshairCode(s);
      const s2 = parseCrosshairCode(gen);
      const ok = JSON.stringify(s) === JSON.stringify(s2);
      if (ok) {
        console.log(`  ✓ ${name} — color:${s.general.color} dot:${s.general.centerDot} innerLen:${s.primary.innerLines.length}`);
        passed++;
      } else {
        console.error(`  ✗ ${name} round-trip failed`);
        failed++;
      }
    } catch (e) {
      console.error(`  ✗ ${name} threw: ${e}`);
      failed++;
    }
  }
}

// ── Exotic crosshair shape verification ──────────────────────────────────────

section("Exotic crosshair shapes (Roadmap §6)")

{
  const shapes: Array<{ name: string; code: string; check: (s: CrosshairSettings) => boolean; desc: string }> = [
    {
      name: "Glasses",
      code: "0;P;c;5;h;0;0l;2;0o;15;0t;2;0a;1;0f;0;1b;0",
      check: s => s.primary.innerLines.offset >= 15 && s.primary.innerLines.length <= 2,
      desc: "offset≥15, length≤2",
    },
    {
      name: "Dot only (Smiley)",
      code: "0;P;c;5;h;1;b;1;z;4;0b;0;1b;0",
      check: s => s.general.centerDot && !s.primary.innerLines.show && !s.primary.outerLines.show,
      desc: "dot=true, inner=false, outer=false",
    },
    {
      name: "Windmill",
      code: "0;P;c;5;h;0;0l;5;0o;2;0a;1;0m;1;0e;2.5;0f;0;1b;0",
      check: s => s.primary.innerLines.movementError && s.primary.innerLines.movementErrorMultiplier >= 2,
      desc: "movErr=true, multiplier≥2",
    },
    {
      name: "Shuriken",
      code: "0;P;c;5;h;0;0l;3;0o;2;0a;1;0f;1;0s;2;1b;1;1l;3;1o;10;1t;2;1a;0.9",
      check: s => s.primary.innerLines.firingError && s.primary.outerLines.offset >= 10,
      desc: "firingErr=true, outerOffset≥10",
    },
    {
      name: "Flappy Bird",
      code: "0;P;c;5;h;0;0b;0;1l;4;1o;2;1t;4;1a;1;1b;1",
      check: s => !s.primary.innerLines.show && s.primary.outerLines.show && s.primary.outerLines.thickness >= 4,
      desc: "inner=false, outer=true, outerThick≥4",
    },
    {
      name: "Star",
      code: "0;P;c;5;h;0;0l;1;0o;0;0t;1;0a;1;0f;0;1b;0",
      check: s => s.primary.innerLines.length <= 1 && s.primary.innerLines.offset === 0,
      desc: "innerLen≤1, offset=0",
    },
  ];

  for (const { name, code, check, desc } of shapes) {
    const s = parseCrosshairCode(code);
    const ok = check(s);
    if (ok) {
      console.log(`  ✓ ${name} — ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ ${name} — ${desc} — got inner={len:${s.primary.innerLines.length},off:${s.primary.innerLines.offset}} outer={show:${s.primary.outerLines.show},len:${s.primary.outerLines.length},off:${s.primary.outerLines.offset}}`);
      failed++;
    }
  }
}

// ── Final summary ──────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
