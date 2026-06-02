import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CrosshairBase",
  description: "CrosshairBase privacy policy — how we handle data, cookies, and advertising.",
};

export default function PrivacyPolicy() {
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

        <h1 className="text-2xl font-black tracking-tight text-white mb-2">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-[13px] leading-relaxed text-slate-400">

          <section>
            <h2 className="text-sm font-bold text-white mb-2">1. Overview</h2>
            <p>
              CrosshairBase (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the website
              crosshairbase.gg (the &ldquo;Service&rdquo;). This page informs you of our policies regarding the
              collection, use, and disclosure of information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">2. Information We Collect</h2>
            <p className="mb-3">
              We do not require account registration. We do not collect your name, email address,
              or any personally identifying information unless you contact us directly.
            </p>
            <p>
              We may automatically collect non-personal usage data through third-party tools, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-500">
              <li>Pages visited and time spent on the site</li>
              <li>Browser type and operating system</li>
              <li>Referring URL and approximate geographic region</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">3. Cookies and Local Storage</h2>
            <p className="mb-3">
              We use browser <strong className="text-slate-300">localStorage</strong> to save your favourite
              crosshairs locally on your device. This data never leaves your browser and is not sent to our servers.
            </p>
            <p>
              URL search parameters are used to share crosshair editor settings. These are stored in the URL
              only and are not collected by us.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">4. Advertising — Google AdSense</h2>
            <p className="mb-3">
              We use <strong className="text-slate-300">Google AdSense</strong> to display advertisements.
              Google AdSense uses cookies to serve ads based on your prior visits to this website and other
              sites on the internet.
            </p>
            <p className="mb-3">
              Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based
              on your visit to our sites and/or other sites on the internet.
            </p>
            <p>
              You may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Google Ads Settings
              </a>
              {" "}or{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                aboutads.info
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">5. Third-Party Services</h2>
            <p>
              Our Service may contain links to third-party websites. We have no control over and assume no
              responsibility for the content, privacy policies, or practices of any third-party sites.
              We encourage you to review the privacy policy of every site you visit.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">6. Children&apos;s Privacy</h2>
            <p>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally
              identifiable information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with
              an updated &ldquo;Last updated&rdquo; date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold text-white mb-2">8. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a
                href="mailto:contact@crosshairbase.gg"
                className="text-cyan-400 hover:underline"
              >
                contact@crosshairbase.gg
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
