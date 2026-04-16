import { crosshairs } from "@/lib/data";
import SearchableGrid from "@/app/components/SearchableGrid";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "all" } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0a1018] text-white overflow-x-hidden">

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
