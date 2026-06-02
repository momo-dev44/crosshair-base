import type { MetadataRoute } from "next";
import { crosshairs } from "@/lib/data";

const BASE = "https://crosshairbase.gg";

export default function sitemap(): MetadataRoute.Sitemap {
  const crosshairPages: MetadataRoute.Sitemap = crosshairs.map((c) => ({
    url: `${BASE}/crosshair/${c.id}`,
    lastModified: new Date("2026-06-01"),
    changeFrequency: "monthly",
    priority: c.category === "Pro" ? 0.9 : 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/best-valorant-crosshairs`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/privacy-policy`,
      lastModified: new Date("2026-06-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...crosshairPages,
  ];
}
