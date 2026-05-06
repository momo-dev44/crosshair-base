# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: Next.js Version

This project runs **Next.js 16.2.3** with **React 19.2.4** and **Tailwind CSS v4**. These are breaking versions — APIs, conventions, and config may differ significantly from training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

### Data layer (`lib/data.ts`)

Single source of truth — a static TypeScript array of `Crosshair` objects. No database, no API. All data is bundled at build time. To add crosshairs, append entries to the array. Categories are a union type: `"Pro" | "Fun" | "Meme" | "Circular"`. The `proSettings` field is optional and only present on Pro crosshairs.

### Crosshair code format

Valorant uses a semicolon-delimited string like `0;P;c;5;h;0;0l;3;0o;2;...`. `CrosshairRenderer.tsx` contains the authoritative parser (`parseCrosshair`). The parser is **section-aware** — it reads only the `P` (primary) section to avoid the scope section `S;c;0` overwriting the primary color. Key params: `c` = color index, `h`/`d` = center dot, `0l`/`0o`/`0t`/`0a` = inner lines (length/offset/thickness/alpha), `1l`/`1o`/`1t`/`1a` = outer lines, `0f` = firing error.

### Rendering (`CrosshairRenderer.tsx`)

Pure SVG on a 200×200 viewBox. Two-pass rendering: black outline strokes first, colored strokes on top. Accepts `cfgOverride: Partial<ParsedCrosshair>` to apply live editor changes without re-parsing the original code. Accepts `colorOverride` (hex string) separate from the parsed color so the editor's color picker can override without rebuilding the code string.

**Color index mapping** — `CrosshairRenderer` uses a `PRESET` map (indices 0–8 → hex). `DetailClient` uses its own `VALORANT_COLORS` array with slightly different hex values for the color picker UI. The two are intentionally separate: the renderer uses game-accurate colors, the picker uses display-friendly ones.

### Pages and routing

- `/` — server component; passes all crosshairs + `cat` URL param to `SearchableGrid`
- `/crosshair/[id]` — statically generated for all IDs via `generateStaticParams`; renders `DetailClient`

### Client state patterns

**Homepage** (`SearchableGrid`): category, page number, and search query all live in URL search params (`?category=Pro&page=2`). `page=1` is never written to the URL (stripped on every push). Category change always resets to page 1.

**Detail page** (`DetailClient`): the live editor state (all slider/toggle values + color) is serialized to URL params via a 400 ms debounced `router.replace`. This makes edited crosshairs shareable by link. Params use short keys: `c`, `il`, `io`, `it`, `ia`, `ol`, `oo`, `ot`, `oa`, `d`, `so`, `fe`. State resets to original when "Reset" is clicked or if no params are present in the URL.

### Favorites

`useFavorites` hook (`app/components/useFavorites.ts`) stores an array of crosshair IDs in `localStorage` under key `cx_favorites_v1`. Hydration happens in a `useEffect` to avoid SSR mismatch — the favorites list is always empty on first render.

### Layout

`Navbar` is a server component (reads `crosshairs.length` at build time). `ToastProvider` wraps all pages. Body has `overflow-x-hidden` to prevent horizontal scroll on mobile.

### Styling

Tailwind CSS v4 — no `tailwind.config.*` file; configuration is in `globals.css` via `@import "tailwindcss"`. Design tokens use inline hex values rather than Tailwind theme variables. The color palette is dark navy (`#0a1018`, `#0f172a`, `#111e2a`) with cyan (`#22d3ee`) as the primary accent.
