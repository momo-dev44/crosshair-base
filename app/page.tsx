import Link from "next/link";
import { crosshairs } from "@/lib/data";
import SearchableGrid from "@/app/components/SearchableGrid";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "all" } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0a1018] text-white">

      {/* NAV */}
      <header className="sticky top-0 z-20 border-b border-[#1c2f3d] bg-[#0a1018]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-black tracking-tight">
            Crosshair<span className="text-cyan-400">Base</span>
          </Link>
          <span className="rounded border border-[#1c2f3d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {crosshairs.length} crosshairs
          </span>
        </div>
      </header>

      {/* SEARCH + CATEGORY FILTER + GRID — all client-side */}
      <SearchableGrid crosshairs={crosshairs} cat={cat} />

      <footer className="border-t border-[#1c2f3d] py-4">
        <p className="text-center text-[10px] text-slate-700">
          CrosshairBase — Fan resource. Not affiliated with Riot Games.
        </p>
      </footer>

    </div>
  );
}
