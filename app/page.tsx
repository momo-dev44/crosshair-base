import Link from "next/link";
import { crosshairs } from "@/lib/data";
import SearchableGrid from "@/app/components/SearchableGrid";

const proCount  = crosshairs.filter((c) => c.category === "Pro").length;
const funCount  = crosshairs.filter((c) => c.category === "Fun").length;
const memeCount = crosshairs.filter((c) => c.category === "Meme").length;

// Structured data for Google rich results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CrosshairBase",
  url: "https://crosshairbase.com",
  description:
    "The largest Valorant crosshair database. Browse, copy, and customise crosshair codes from pro players.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://crosshairbase.com/?search={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat = "all" } = await searchParams;

  return (
    <div className="min-h-screen bg-[#0a1018] text-white overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="pt-20 pb-6 px-4 text-center border-b border-[#1c2f3d]">
        <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          Valorant Crosshair Codes{" "}
          <span className="text-cyan-400">2026</span>
        </h1>
        <p className="mt-1.5 text-[11px] text-slate-500 max-w-lg mx-auto leading-relaxed">
          Browse {crosshairs.length}+ crosshair codes from pro players and creative builders.
          One-click copy &amp; live editor — paste straight into Valorant.
        </p>
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
          {[
            { label: `${proCount} Pro`,  color: "#22d3ee" },
            { label: `${funCount} Fun`,  color: "#4ade80" },
            { label: `${memeCount} Meme`, color: "#f472b6" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color, borderColor: color + "40", background: color + "12" }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* SEARCH + CATEGORY FILTER + GRID — all client-side */}
      <SearchableGrid crosshairs={crosshairs} cat={cat} />

      {/* ── Footer ── */}
      <footer className="border-t border-[#1c2f3d] py-6 px-4">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-[10px] text-slate-600 flex-wrap justify-center">
            <Link href="/about" className="hover:text-slate-400 transition-colors">
              About &amp; How to Import
            </Link>
            <span className="text-slate-800">·</span>
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-slate-800">·</span>
            <a
              href="mailto:contact@crosshairbase.gg"
              className="hover:text-slate-400 transition-colors"
            >
              Contact
            </a>
          </div>
          <p className="text-center text-[10px] text-slate-700">
            CrosshairBase — Fan resource. Not affiliated with Riot Games or VALORANT.
          </p>
        </div>
      </footer>
    </div>
  );
}
