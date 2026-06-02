import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Import a Valorant Crosshair Code | CrosshairBase",
  description:
    "Step-by-step guide to importing Valorant crosshair codes. Copy any crosshair code and paste it into Valorant settings in under 30 seconds.",
};

export default function About() {
  return (
    <div className="min-h-screen bg-[#0a1018] text-white pt-20 pb-16 px-4">
      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to CrosshairBase
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-white mb-1">
          How to Import a Valorant Crosshair Code
        </h1>
        <p className="text-xs text-slate-500 mb-10">
          Works in every version of VALORANT · takes under 30 seconds
        </p>

        {/* Step-by-step guide */}
        <ol className="space-y-8">

          <li className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-black">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Copy the crosshair code</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                On CrosshairBase, click the <span className="text-slate-300 font-medium">Copy</span> button on
                any crosshair card. The code (e.g. <code className="bg-[#111e2a] px-1.5 py-0.5 rounded text-cyan-400 text-[11px]">0;P;c;5;h;0;0l;4;0o;2;0a;1</code>)
                will be copied to your clipboard.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-black">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Open VALORANT Settings</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Launch VALORANT and click the <span className="text-slate-300 font-medium">gear icon</span> in
                the top-right corner of the main menu to open Settings.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-black">
              3
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Go to the Crosshair tab</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                In Settings, click the <span className="text-slate-300 font-medium">Crosshair</span> tab
                at the top of the screen.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-black">
              4
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Import the code</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                Click the <span className="text-slate-300 font-medium">Import</span> button (or the profile
                dropdown → <span className="text-slate-300 font-medium">Import Profile Code</span>). A text box
                will appear — paste the code with{" "}
                <kbd className="bg-[#111e2a] border border-[#1c2f3d] px-1.5 py-0.5 rounded text-[11px] text-slate-300">Ctrl + V</kbd>{" "}
                and press{" "}
                <kbd className="bg-[#111e2a] border border-[#1c2f3d] px-1.5 py-0.5 rounded text-[11px] text-slate-300">Enter</kbd>.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-sm font-black">
              5
            </div>
            <div>
              <h2 className="text-sm font-bold text-white mb-1">Done — your crosshair is updated!</h2>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                The crosshair preview will update immediately. No need to restart the game.
                Head into a practice range to test it out.
              </p>
            </div>
          </li>

        </ol>

        {/* Divider */}
        <div className="border-t border-[#1c2f3d] my-10" />

        {/* FAQ */}
        <h2 className="text-lg font-black tracking-tight text-white mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6 text-[13px] leading-relaxed text-slate-400">

          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              What is a Valorant crosshair code?
            </h3>
            <p>
              A crosshair code is a short string that encodes all your crosshair settings — color, size,
              thickness, gap, dot, and more. Riot added the import/export feature so players can share
              exact crosshair configs instantly without adjusting dozens of sliders.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Do pro players actually use these crosshairs?
            </h3>
            <p>
              Yes. Every crosshair in the <span className="text-cyan-400">Pro</span> category is sourced
              from publicly available pro player configs — tournament broadcasts, official team pages, and
              pro player streams. Crosshairs may change between tournaments; we update them regularly.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Can I customise a crosshair after importing?
            </h3>
            <p>
              Absolutely. Use the live editor on each crosshair&apos;s detail page to tweak color, size,
              and other settings. The URL updates as you adjust sliders — you can bookmark or share your
              custom version directly.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Is CrosshairBase affiliated with Riot Games?
            </h3>
            <p>
              No. CrosshairBase is an independent fan resource. We are not affiliated with, endorsed by,
              or sponsored by Riot Games or VALORANT.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              What crosshair do most pros use?
            </h3>
            <p>
              Most pro players use a small, static crosshair with no firing error (dynamic expansion
              disabled). Common setups are a thin dot-only crosshair or a small cross with 1–4px inner
              lines and no outer lines. Browse the{" "}
              <Link href="/?cat=Pro" className="text-cyan-400 hover:underline">
                Pro category
              </Link>{" "}
              to see exact settings.
            </p>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-[#1c2f3d] my-10" />

        {/* About section */}
        <h2 className="text-lg font-black tracking-tight text-white mb-3">About CrosshairBase</h2>
        <div className="space-y-3 text-[13px] leading-relaxed text-slate-400">
          <p>
            CrosshairBase is the largest free database of Valorant crosshair codes. We index crosshairs
            from professional players, content creators, and the community — with a live preview and
            one-click copy for every entry.
          </p>
          <p>
            Every crosshair renders in real-time in your browser so you can see exactly what it looks like
            before importing. Use the built-in editor to personalise any crosshair to your preference.
          </p>
          <p>
            Have a crosshair you&apos;d like to add, or spotted an outdated pro config?{" "}
            <a href="mailto:contact@crosshairbase.gg" className="text-cyan-400 hover:underline">
              Contact us
            </a>{" "}
            and we&apos;ll review it.
          </p>
        </div>

      </div>
    </div>
  );
}
