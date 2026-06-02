import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CrosshairBase — Pro Valorant Crosshairs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a1018",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Crosshair icon */}
        <svg width="72" height="72" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="2.2" fill="#22d3ee" />
          <line x1="10" y1="1"    x2="10" y2="6.2"  stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10" y1="13.8" x2="10" y2="19"   stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="1"  y1="10"   x2="6.2"  y2="10" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="13.8" y1="10" x2="19"   y2="10" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" />
        </svg>

        {/* Title */}
        <div
          style={{
            marginTop: 28,
            fontSize: 64,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-2px",
            display: "flex",
          }}
        >
          Crosshair
          <span style={{ color: "#22d3ee" }}>Base</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: 16,
            fontSize: 26,
            color: "#64748b",
            fontWeight: 500,
            letterSpacing: "-0.5px",
          }}
        >
          Pro Valorant Crosshair Codes — Copy &amp; Import
        </div>

        {/* Badges */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 16,
          }}
        >
          {[
            { label: "Pro Players", color: "#22d3ee" },
            { label: "Live Editor", color: "#4ade80" },
            { label: "One-click Copy", color: "#f472b6" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                border: `1px solid ${color}40`,
                background: `${color}12`,
                color,
                padding: "8px 18px",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 18,
            color: "#334155",
            fontWeight: 600,
          }}
        >
          crosshairbase.gg
        </div>
      </div>
    ),
    { ...size },
  );
}
