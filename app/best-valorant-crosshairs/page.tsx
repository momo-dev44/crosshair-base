import type { Metadata } from "next";
import Link from "next/link";
import { crosshairs } from "@/lib/data";
import CrosshairRenderer from "@/app/components/CrosshairRenderer";
import { parseCrosshairCode } from "@/lib/crosshair";

export const metadata: Metadata = {
  title: "Best Valorant Crosshairs 2026 — Pro Settings & Codes | CrosshairBase",
  description:
    "The best Valorant crosshairs used by pro players in 2026. Copy crosshair codes from TenZ, aspas, s0m, Derke and more — one click to import.",
  alternates: {
    canonical: "https://crosshairbase.com/best-valorant-crosshairs",
  },
  openGraph: {
    title: "Best Valorant Crosshairs 2026 — Pro Settings & Codes",
    description:
      "Copy the exact crosshair codes used by top Valorant pros in 2026. One-click import.",
    url: "https://crosshairbase.com/best-valorant-crosshairs",
  },
};

// ── Top picks — manually curated for this page ───────────────────────────────
const TOP_PRO_IDS = [
  "tenz", "aspas", "s0m", "derke", "nats", "cned",
  "jinggg", "forsaken", "zekken", "yay",
];

const TOP_CATEGORIES = [
  {
    heading: "Most Popular Pro Crosshairs",
    subheading: "Used by the top-ranked players in VCT 2026",
    ids: TOP_PRO_IDS,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Best Valorant Crosshairs 2026",
  description:
    "A curated collection of the best Valorant crosshair codes used by professional players in 2026.",
  url: "https://crosshairbase.com/best-valorant-crosshairs",
  isPartOf: { "@type": "WebSite", name: "CrosshairBase", url: "https://crosshairbase.com" },
};

export default function BestCrosshairs() {
  return (
    <div className="min-h-screen bg-[#0a1018] text-white pt-20 pb-16 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Crosshairs
        </Link>

        {/* Hero */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-2">
          Best Valorant Crosshairs 2026
        </h1>
        <p className="text-[13px] text-slate-400 mb-10 leading-relaxed max-w-2xl">
          The crosshairs used by the best Valorant players in the world, updated for 2026.
          Every code is verified, one-click to copy, and works with the latest version of VALORANT.
        </p>

        {/* Why crosshair matters */}
        <section className="rounded-xl border border-[#1c2f3d] bg-[#0c1520] p-6 mb-10">
          <h2 className="text-sm font-bold text-white mb-3">
            What makes a good Valorant crosshair?
          </h2>
          <div className="space-y-2 text-[13px] text-slate-400 leading-relaxed">
            <p>
              The best crosshairs in Valorant share a few traits: they are <strong className="text-slate-300">small and static</strong>
              {" "}(no movement or firing error expansion), use a{" "}
              <strong className="text-slate-300">high-contrast color</strong> like white or cyan against
              most backgrounds, and have <strong className="text-slate-300">no outer lines</strong> that
              clutter your vision.
            </p>
            <p>
              Most top VCT pros use a crosshair with inner line length 2–5 and gap 1–3, no outer
              lines, and firing error disabled. Some prefer a pure dot (no lines at all) for maximum
              precision. The goal is a crosshair that sits exactly where your bullets land, without
              any visual noise.
            </p>
          </div>
        </section>

        {/* Crosshair sections */}
        {TOP_CATEGORIES.map(({ heading, subheading, ids }) => {
          const items = ids
            .map((id) => crosshairs.find((c) => c.id === id))
            .filter((c): c is NonNullable<typeof c> => !!c);

          return (
            <section key={heading} className="mb-12">
              <h2 className="text-base font-black text-white mb-1">{heading}</h2>
              <p className="text-[11px] text-slate-500 mb-5">{subheading}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((c, i) => {
                  const settings = parseCrosshairCode(c.code);
                  return (
                    <Link
                      key={c.id}
                      href={`/crosshair/${c.id}`}
                      className="group flex items-center gap-4 rounded-xl border border-[#1c2f3d] bg-[#0c1520] p-4 hover:border-cyan-400/30 hover:bg-[#111e2a] transition-all"
                    >
                      {/* Rank */}
                      <span className="text-[11px] font-black text-slate-700 w-5 text-center shrink-0">
                        {i + 1}
                      </span>

                      {/* Preview */}
                      <div className="shrink-0 rounded-lg overflow-hidden border border-[#1c2f3d]">
                        <CrosshairRenderer
                          settings={settings}
                          bgStyle={{ background: "#111e2a" }}
                          size={56}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                          {c.name}
                        </p>
                        {(c.team || c.role) && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {[c.role, c.team].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {c.proSettings && (
                          <p className="text-[10px] text-slate-600 mt-1">
                            {c.proSettings.dpi} DPI · {c.proSettings.sensitivity} sens
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg
                        className="shrink-0 text-slate-700 group-hover:text-cyan-400 transition-colors"
                        width="14" height="14" viewBox="0 0 16 16" fill="none"
                      >
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* How to choose */}
        <section className="rounded-xl border border-[#1c2f3d] bg-[#0c1520] p-6 mb-10">
          <h2 className="text-sm font-bold text-white mb-3">
            How to choose the right crosshair for you
          </h2>
          <div className="space-y-2 text-[13px] text-slate-400 leading-relaxed">
            <p>
              <strong className="text-slate-300">For new players:</strong> Start with a medium-sized
              white crosshair with inner lines length 4–6 and gap 2. This gives you a reference
              point while you develop your aim. TenZ or Derke&apos;s crosshair is a good starting point.
            </p>
            <p>
              <strong className="text-slate-300">For experienced players:</strong> A smaller crosshair
              (inner lines 2–3, gap 1) or a pure dot like s0m&apos;s helps develop precise aim
              by forcing you to rely on muscle memory rather than the crosshair itself.
            </p>
            <p>
              <strong className="text-slate-300">For Operator / Sheriff players:</strong> A thinner,
              smaller crosshair reduces visual obstruction and helps with precise flick shots.
              Try aspas&apos;s green crosshair — a very thin inner line with minimal gap.
            </p>
          </div>
        </section>

        {/* How to import */}
        <section className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-5 mb-10">
          <h2 className="text-sm font-bold text-white mb-2">How to import a crosshair code</h2>
          <ol className="space-y-1.5 text-[13px] text-slate-400 leading-relaxed list-none">
            <li><span className="text-cyan-400 font-bold mr-2">1.</span>Click any crosshair above to open its detail page</li>
            <li><span className="text-cyan-400 font-bold mr-2">2.</span>Click <strong className="text-slate-300">Copy Crosshair Code</strong></li>
            <li><span className="text-cyan-400 font-bold mr-2">3.</span>Open Valorant → Settings → Crosshair tab</li>
            <li><span className="text-cyan-400 font-bold mr-2">4.</span>Click <strong className="text-slate-300">Import Profile Code</strong> and paste</li>
          </ol>
          <Link
            href="/about"
            className="inline-flex items-center gap-1 mt-4 text-[11px] text-cyan-400 hover:underline"
          >
            Full step-by-step guide →
          </Link>
        </section>

        {/* Browse all */}
        <div className="text-center">
          <Link
            href="/?cat=Pro"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold text-cyan-300 hover:bg-cyan-400/20 transition-colors"
          >
            Browse all {crosshairs.filter((c) => c.category === "Pro").length} Pro crosshairs →
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#1c2f3d] mt-16 pt-6">
        <div className="mx-auto max-w-4xl flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-[10px] text-slate-600 flex-wrap justify-center">
            <Link href="/" className="hover:text-slate-400 transition-colors">All Crosshairs</Link>
            <span className="text-slate-800">·</span>
            <Link href="/about" className="hover:text-slate-400 transition-colors">How to Import</Link>
            <span className="text-slate-800">·</span>
            <Link href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-center text-[10px] text-slate-700">
            CrosshairBase — Fan resource. Not affiliated with Riot Games or VALORANT.
          </p>
        </div>
      </footer>
    </div>
  );
}
