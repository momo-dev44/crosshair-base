import Link from "next/link";
import { crosshairs } from "@/lib/data";

// ── Crosshair icon ─────────────────────────────────────────────────────────────

function CrosshairIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.2" fill="#22d3ee" />
      <line x1="10" y1="1"  x2="10" y2="6.2"  stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="13.8" x2="10" y2="19" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="1"  y1="10" x2="6.2"  y2="10" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13.8" y1="10" x2="19" y2="10" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// ── Game tab definitions ───────────────────────────────────────────────────────

const GAMES = [
  {
    id:      "valorant",
    label:   "VALORANT",
    dot:     "#22d3ee",
    active:  true,
    tooltip: null,
  },
  {
    id:      "cs2",
    label:   "CS2",
    dot:     "#475569",
    active:  false,
    tooltip: "CS2 support coming soon",
  },
  {
    id:      "apex",
    label:   "APEX",
    dot:     "#475569",
    active:  false,
    tooltip: "Apex Legends support coming soon",
  },
] as const;

// ── Navbar ─────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const count = crosshairs.length;

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-14 border-b border-[#1c2f3d] bg-[#0f172a]">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="CrosshairBase home"
        >
          <CrosshairIcon />
          <span className="text-sm font-black tracking-tight text-white">
            Crosshair<span className="text-cyan-400">Base</span>
          </span>
        </Link>

        {/* Vertical divider */}
        <div className="hidden h-5 w-px shrink-0 bg-[#1c2f3d] sm:block" />

        {/* ── Game tabs ── */}
        <nav
          aria-label="Game switcher"
          className="flex flex-1 items-center gap-0.5 overflow-x-auto scrollbar-hide"
        >
          {GAMES.map((game) =>
            game.active ? (
              /* Active game — clickable */
              <Link
                key={game.id}
                href="/"
                className="relative flex shrink-0 items-center gap-1.5 rounded-md border border-cyan-400/25 bg-cyan-400/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: game.dot }}
                />
                {game.label}
              </Link>
            ) : (
              /* Coming-soon game — hidden on mobile, non-interactive on desktop */
              <div
                key={game.id}
                role="button"
                aria-disabled="true"
                title={game.tooltip ?? undefined}
                className="hidden sm:flex group relative shrink-0 cursor-not-allowed select-none items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-600"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: game.dot }}
                />
                {game.label}
                <span className="ml-0.5 rounded border border-slate-700/60 px-1 py-px text-[8px] font-bold uppercase leading-none tracking-widest text-slate-700">
                  SOON
                </span>

                {/* Hover tooltip */}
                <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#1c2f3d] bg-[#0d1a26] px-3 py-1.5 text-[10px] text-slate-400 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                  {game.tooltip}
                </div>
              </div>
            )
          )}
        </nav>

        {/* ── Right-side links ── */}
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/about"
            className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors"
          >
            How to Import
          </Link>
          <span className="hidden sm:block h-3 w-px bg-[#1c2f3d]" />
          <span className="hidden sm:block rounded border border-[#1c2f3d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {count} crosshairs
          </span>
        </div>

      </div>
    </header>
  );
}
