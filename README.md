# upnalab.com

Website of **UPNALAB**, the interactive-devices research group of the Universidad Pública de Navarra. Static site built with [Astro](https://astro.build) 5 and Tailwind CSS 4, published on GitHub Pages at <https://upnalab.com>.

All content (projects, people, sponsors, DIY resources) lives in JSON files under `src/data/`. **To add or edit content you do not need to touch any template: read [`tutorial.md`](./tutorial.md).**

## Commands

| Command | What it does |
| --- | --- |
| `npm ci` | Install dependencies (Node 22) |
| `npm run dev` | Local server at <http://localhost:4321> with live reload |
| `npm run check` | Type-check the Astro templates |
| `npm run build` | Generate the static site into `dist/` (also validates all JSON data) |
| `npm test` | Sanity checks on `dist/` (run after `npm run build`) |
| `npm run preview` | Serve `dist/` locally |
| `npm run og` | Regenerate `public/og-default.png` (only when the logo changes) |

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: check → build → test → publish to GitHub Pages. Pull requests run the same pipeline without publishing. The custom domain is configured in `public/CNAME`.

## Project layout

```
src/data/           projects.json · people.json · site-data.json  (the content)
src/assets/images/  images referenced from the JSON (optimized at build time)
public/assets/      videos and icons served as-is
src/content.config.ts  schema that validates the JSON on every build
src/pages/          one file per route (+ project/[slug].astro for project pages)
src/components/     UI pieces; src/layouts/BaseLayout.astro holds all SEO/meta
scripts/            verify-build.js (tests) · make-og-image.mjs
```

See [`CLAUDE.md`](./CLAUDE.md) for a deeper description of the architecture.

## Privacy

The site sets no cookies and loads no third-party scripts by default. YouTube players are only loaded after the visitor presses play. Cookie-less analytics can be enabled by filling `analytics.goatcounter` in `src/data/site-data.json`.
