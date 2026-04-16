"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CrosshairCard from "./CrosshairCard";
import CategoryFilter from "./CategoryFilter";
import { useFavorites } from "./useFavorites";
import type { Crosshair } from "@/lib/data";

const PER_PAGE = 24;

// ── Pagination component ───────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= 1) return null;

  // Build the page-number window: always show first, last, current ±1, with ellipsis
  const pages: (number | "…")[] = [];
  const add = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  add(1);
  if (page > 3) pages.push("…");
  for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) add(i);
  if (page < total - 2) pages.push("…");
  add(total);

  const NAV =
    "flex h-9 items-center px-3 rounded-lg border text-xs font-bold tracking-wide transition-all duration-150 select-none";
  const ACTIVE_NAV =
    "border-cyan-400/40 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/15";
  const INACTIVE_NAV =
    "border-[#1c2f3d] text-slate-500 hover:text-white hover:border-[#2a4a60]";
  const DISABLED_NAV =
    "border-[#111] text-slate-700 cursor-default pointer-events-none";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={`${NAV} gap-1 ${page === 1 ? DISABLED_NAV : INACTIVE_NAV}`}
        aria-label="Previous page"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Prev
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="flex h-9 w-8 items-center justify-center text-slate-600 text-xs select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${NAV} min-w-[36px] justify-center ${
              p === page
                ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.12)]"
                : INACTIVE_NAV
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === total}
        className={`${NAV} gap-1 ${page === total ? DISABLED_NAV : INACTIVE_NAV}`}
        aria-label="Next page"
      >
        Next
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  crosshairs: Crosshair[];
  cat: string;
}

export default function SearchableGrid({ crosshairs, cat }: Props) {
  const [query, setQuery]       = useState("");
  const [page, setPage]         = useState(1);
  const [activeCat, setActiveCat] = useState(cat);

  const router = useRouter();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const handleSurpriseMe = useCallback(() => {
    const memes = crosshairs.filter((c) => c.category === "Meme");
    if (memes.length === 0) return;
    const pick = memes[Math.floor(Math.random() * memes.length)];
    router.push(`/crosshair/${pick.id}`);
  }, [crosshairs, router]);

  // Ref to the top of the grid section — used for scroll-to-top on page change
  const gridTopRef = useRef<HTMLDivElement>(null);

  const goToPage = useCallback((p: number) => {
    setPage(p);
    // Smooth-scroll to just below the sticky toolbar
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function handleCatSelect(val: string) {
    setActiveCat(val);
    setPage(1);
    setQuery("");
  }

  function handleQuery(val: string) {
    setQuery(val);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list: Crosshair[];

    if (activeCat === "favorites") {
      list = crosshairs.filter((c) => isFavorite(c.id));
    } else if (activeCat === "all") {
      list = crosshairs;
    } else {
      list = crosshairs.filter((c) => c.category === activeCat);
    }

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    return list;
  }, [crosshairs, activeCat, query, isFavorite]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const showPagination = !(activeCat === "favorites" && favorites.length === 0);

  return (
    <>
      {/* ── Sticky toolbar ── */}
      <div className="sticky top-[45px] z-10 border-b border-[#1c2f3d] bg-[#0a1018]">
        <div className="px-4 pt-2 pb-0 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              width="13" height="13" viewBox="0 0 16 16" fill="none"
              aria-hidden="true"
            >
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQuery(e.target.value)}
              placeholder="Search player..."
              className="w-full rounded-md border border-[#1c2f3d] bg-[#07101a] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-colors duration-150 focus:border-cyan-400/50 focus:bg-[#071420]"
            />
          </div>
          <button
            onClick={handleSurpriseMe}
            title="Random meme crosshair"
            className="shrink-0 flex items-center gap-1.5 rounded-md border border-[#1c2f3d] bg-[#07101a] px-2.5 py-1.5 text-[11px] font-bold text-slate-400 transition-all duration-150 hover:border-pink-500/40 hover:bg-pink-500/10 hover:text-pink-400 active:scale-95"
          >
            <span aria-hidden="true">&#127922;</span>
            <span className="hidden sm:inline">Surprise Me!</span>
          </button>
        </div>
        <div className="px-4 py-2">
          <CategoryFilter
            current={activeCat}
            onSelect={handleCatSelect}
            favCount={favorites.length}
          />
        </div>
      </div>

      {/* ── Grid top anchor (scroll target) ── */}
      <div ref={gridTopRef} className="scroll-mt-[90px]" />

      {/* ── Grid ── */}
      <main className="px-3 py-4">
        {activeCat === "favorites" && favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg
              width="44" height="44" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-slate-700"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">No favorites yet.</p>
              <p className="text-xs text-slate-700 mt-1">Go grab some crosshairs!</p>
            </div>
            <button
              onClick={() => handleCatSelect("all")}
              className="mt-1 rounded-md border border-[#1c2f3d] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-white hover:border-[#2a4a60] transition-colors duration-150"
            >
              Browse All
            </button>
          </div>
        ) : slice.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-600">
            {query.trim()
              ? `No crosshairs found for "${query.trim()}".`
              : "No crosshairs found."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-4 xl:grid-cols-6">
            {slice.map((c) => (
              <CrosshairCard
                key={c.id}
                crosshair={c}
                isFavorite={isFavorite(c.id)}
                onToggleFavorite={() => toggleFavorite(c.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {showPagination && (
          <div className="mt-10 flex flex-col items-center gap-4 pb-12">
            <p className="text-[11px] text-slate-600">
              Showing{" "}
              <span className="text-slate-400 font-semibold">
                {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="text-slate-400 font-semibold">{filtered.length}</span>{" "}
              crosshairs
            </p>
            <Pagination page={safePage} total={totalPages} onPage={goToPage} />
          </div>
        )}
      </main>
    </>
  );
}
