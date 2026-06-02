import { Suspense } from "react";
import { notFound } from "next/navigation";
import { crosshairs, type Crosshair } from "@/lib/data";
import DetailClient from "./DetailClient";

const BASE = "https://www.crosshairbase.com";

export function generateStaticParams() {
  return crosshairs.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const crosshair = crosshairs.find((c) => c.id === id);
  if (!crosshair) return {};

  const teamSuffix  = crosshair.team ? ` (${crosshair.team})` : "";
  const title       = `${crosshair.name}${teamSuffix} Valorant Crosshair Code 2026 | CrosshairBase`;
  const description = crosshair.team
    ? `Copy ${crosshair.name}'s Valorant crosshair code — ${crosshair.role ?? "pro player"} for ${crosshair.team}. One-click copy, live editor, and instant import guide. Updated 2026.`
    : `Copy ${crosshair.name}'s Valorant crosshair code. Paste directly into Valorant settings or customise it live with CrosshairBase's free editor. Updated 2026.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE}/crosshair/${id}`,
      type: "website",
    },
    alternates: {
      canonical: `${BASE}/crosshair/${id}`,
    },
  };
}

// ── Crosshair code parser (lightweight — for static description only) ─────────
function describeCrosshair(crosshair: Crosshair): string {
  const code  = crosshair.code;
  const parts = code.split(";");
  const get   = (key: string): string | undefined => {
    const i = parts.indexOf(key);
    return i !== -1 ? parts[i + 1] : undefined;
  };

  const hasDot     = get("h") === "1";
  const innerLen   = parseInt(get("0l") ?? "0", 10);
  const innerOff   = parseInt(get("0o") ?? "0", 10);
  const innerThick = parseInt(get("0t") ?? "2", 10);
  const outerLen   = parseInt(get("1l") ?? "0", 10);
  const firingErr  = get("0f") === "1";

  const parts2: string[] = [];

  if (hasDot && innerLen === 0 && outerLen === 0) {
    parts2.push("dot-only crosshair (no lines)");
  } else if (hasDot && innerLen > 0) {
    parts2.push(`center dot with ${innerLen}-length inner lines`);
  } else if (innerLen > 0) {
    parts2.push(`inner line length ${innerLen}, gap ${innerOff}`);
    if (innerThick > 3) parts2.push("thick lines");
  }

  if (outerLen > 0) {
    parts2.push(`outer lines length ${outerLen}`);
  } else {
    parts2.push("no outer lines");
  }

  if (firingErr) parts2.push("dynamic firing error enabled");
  else parts2.push("static (no firing error)");

  return parts2.join(", ");
}

// ── Static SEO text for Pro pages ─────────────────────────────────────────────
function ProSeoSection({ crosshair }: { crosshair: Crosshair }) {
  if (crosshair.category !== "Pro") return null;

  const desc       = describeCrosshair(crosshair);
  const teamLine   = crosshair.team ? `${crosshair.team}` : "the professional Valorant circuit";
  const roleLine   = crosshair.role ? ` as a ${crosshair.role}` : "";
  const hasSettings = !!crosshair.proSettings;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
      <div className="rounded-xl border border-[#1c2f3d] bg-[#0c1520] p-6">
        <h2 className="text-sm font-bold text-white mb-3">
          About {crosshair.name}&apos;s Valorant Crosshair
        </h2>
        <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
          <p>
            <strong className="text-slate-300">{crosshair.name}</strong> competes{roleLine} for{" "}
            <strong className="text-slate-300">{teamLine}</strong>.
            {" "}Like most professional players, {crosshair.name} uses a precise, minimal crosshair
            optimised for competitive play: {desc}.
          </p>
          <p>
            To use {crosshair.name}&apos;s crosshair in your own game, click{" "}
            <strong className="text-slate-300">Copy Crosshair Code</strong> above, then open
            Valorant → Settings → Crosshair → Import Profile Code and paste the code.
            The crosshair will update instantly.
          </p>
          {hasSettings && (
            <p>
              {crosshair.name} plays on a{" "}
              <strong className="text-slate-300">{crosshair.proSettings!.mouse}</strong> at{" "}
              <strong className="text-slate-300">{crosshair.proSettings!.dpi} DPI</strong> with{" "}
              <strong className="text-slate-300">{crosshair.proSettings!.sensitivity} in-game sensitivity</strong>
              {" "}({(crosshair.proSettings!.dpi * crosshair.proSettings!.sensitivity * 0.022).toFixed(0)} eDPI),
              on a <strong className="text-slate-300">{crosshair.proSettings!.resolution}</strong> resolution.
            </p>
          )}
          <p>
            Use the live editor above to customise {crosshair.name}&apos;s crosshair —
            change the color, adjust line length or gap, and share your modified version
            with a single link.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function CrosshairPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const crosshair = crosshairs.find((c) => c.id === id);

  if (!crosshair) notFound();

  // Related crosshairs: same category, excluding current, up to 6
  const related = crosshairs
    .filter((c) => c.category === crosshair.category && c.id !== crosshair.id)
    .slice(0, 6);

  // JSON-LD structured data — SoftwareApplication-style item
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: `${crosshair.name} Crosshair Code`,
    description: crosshair.team
      ? `${crosshair.name}'s Valorant crosshair code — ${crosshair.role ?? "pro player"} for ${crosshair.team}. Copy it instantly or customise it live.`
      : `${crosshair.name}'s Valorant crosshair code for 2026. Copy it instantly or customise it live.`,
    url: `${BASE}/crosshair/${id}`,
    isPartOf: {
      "@type": "WebSite",
      name: "CrosshairBase",
      url: BASE,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Valorant Crosshairs", item: BASE },
        { "@type": "ListItem", position: 2, name: crosshair.name, item: `${BASE}/crosshair/${id}` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <DetailClient crosshair={crosshair} related={related} />
      </Suspense>
      <ProSeoSection crosshair={crosshair} />
    </>
  );
}
