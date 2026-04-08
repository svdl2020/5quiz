# 5quiz

5quiz is a data-agnostic image-name matching quiz app designed for static deployment on GitHub Pages.

## Implemented now

- React + TypeScript + Vite frontend.
- **Quiz datasets** (emoji picker top-left): **Flags** (REST Countries), **Pokemon** (PokeAPI). European club football is **not** included yet (no keyless, CORS-friendly source for current-season squads with logos; see [`src/data/datasets/registry.ts`](src/data/datasets/registry.ts) note).
- Mode selector in settings: **Continuous**, **1+4**, **Learn** (autocomplete; details after a correct guess or via Show).
- **Settings filters depend on dataset**: continents + independent (flags); generations Gen I–IX (Pokemon).
- Score in the header (Continuous and 1+4): `x y z` — correct (green), incorrect (red), total items in the filtered dataset (neutral).
- Generic quiz domain types (`picture`, `name`, `combination`, `attributes`).
- Generic filtering engine for dataset attributes.
- `localStorage` cache keys: `5quiz.flags.v1`, `5quiz.pokemon.v1` (Pokemon list is built once, then read from cache).
- Unit tests for score logic, matching logic, filters, and continuous-mode engine behavior.

## Local development

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

## GitHub Pages deployment

The repository includes a GitHub Actions workflow that deploys `dist` to GitHub Pages.

### Required repository settings

1. In GitHub, enable Pages and select **GitHub Actions** as the source.
2. Push to `main`; workflow publishes automatically.

### Why this is Pages-compatible

- Static bundle output only (`vite build`).
- No mandatory backend runtime.
- Vite `base` is set to `/5quiz/` for project pages.
- A `404.html` fallback is included for refresh/deep-link safety.

## Data and caching strategy

- Runtime fetch from public APIs (fast iteration).
- Dataset normalization into generic `QuizItem`.
- Per-dataset cache keys (`5quiz.flags.v1`, `5quiz.pokemon.v1`).

## Trigger conditions for fallback hosting path

Keep GitHub Pages if all data providers:

- support browser CORS,
- require no secrets,
- and stay reliable enough for direct client fetch.

Move a provider to **CI snapshot JSON** (still Pages) when:

- rate limits are unstable,
- response shapes change often,
- or occasional outages affect playability.

Move to **Cloudflare Pages/Netlify + serverless functions** when:

- secret API keys are required,
- strict CORS blocks client-side fetch,
- centralized normalization/proxying is needed for reliability.

This keeps the current static frontend while adding a small backend edge layer only when necessary.
