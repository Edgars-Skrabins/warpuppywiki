# CLAUDE.md

## What this is

warpuppywiki is an unofficial web app of tools for the game Wardogs: a loadout builder, a time-to-kill calculator, an interactive map, a patch diff tracker, and smaller reference and planning tools. It runs entirely in the browser on the static game data published by the `warpuppies/wardogs-data` project (JSON for each game build, plus map tiles and icons in its release zips). There is no backend.

The app is a set of independent tools. Each tool lives in its own folder, and no tool imports from another. Tools share only the core libraries and the UI kit.

## Stack

- TypeScript (strict), React, Vite, pnpm, Node 22 or newer.
- React Router with a hash router, so the static build works on any host.
- TanStack Query for loading and caching data files, zod for validating them.
- CSS Modules with design tokens as CSS custom properties. No CSS framework.
- Leaflet through react-leaflet for the map, Recharts for charts.
- Vitest with Testing Library and jsdom for tests, ESLint and Prettier for linting and formatting.

## Layout

```
scripts/            Node scripts that download and prepare game data and assets
public/data/        synced game data, one folder per game build (gitignored)
public/assets/      synced map tiles, icons and heightmaps (gitignored)
src/app/            the shell: routing, layout, tool registry, home page
src/core/           shared, framework-light domain code used by more than one tool
  data/             zod schemas, loaders, query hooks, build list
  catalog/          item index, display names, tag text, prices, unlocks, exclusions
  modifiers/        applying attribute modifiers (multiplyCompound, multiply, add, override)
  weapons/          slot compatibility, attachment and ammo options, effective weapon stats
  damage/           per-hit damage model, shots to kill, time to kill
  maps/             world and pixel coordinates, heightmap sampling, line of sight
  state/            URL state codecs and local storage helpers
  tool/             the ToolDefinition type and tool categories
src/ui/             the UI kit: tokens, theme and reusable components
src/sw/             the service worker (built as dist/sw.js) and its pure routing and cache trim logic
src/tools/<tool>/   one folder per tool, with an index.ts that exports its ToolDefinition
specs/              specs (see below)
```

## How it fits together

- `scripts/sync-data.ts` downloads every published build's small data zip into `public/data/<build>/` and writes `public/data/builds.json`. `scripts/sync-assets.ts` downloads the latest full zip once into a shared cache outside the repo and extracts tiles, icons and a converted heightmap into `public/assets/`.
- `src/core/data` loads files from `public/data/<build>/`, validates them with zod and exposes typed hooks. Tools always read game data through it, never with their own `fetch`.
- Each tool's `src/tools/<id>/index.ts` exports `tool`, its `ToolDefinition` from `@/core/tool` (id equal to the folder name, name, summary, category, an icon name from the UI kit's `Icon`, optional `status: "beta"`, and `component: lazy(() => import("./Tool"))`). `src/app/toolRegistry.ts` discovers them with `import.meta.glob`, and the router, the Tools menu and the home page are built from that list. Routes are `#/<id>`; the shell renders the tool's heading, summary and error boundary. Adding or removing a tool means adding or removing its folder; no shared file changes.
- In production `src/main.tsx` registers a hand-written service worker (`src/sw/sw.ts`, built as `dist/sw.js` at the site root) to get around GitHub Pages' fixed 10-minute cache lifetime. It serves hashed build files, game data, icons, heightmaps and viewed map tiles (capped) cache first, and `index.html`, `data/builds.json` and `assets/manifest.json` network first. Bump `CACHE_VERSION` in `src/sw/strategy.ts` to drop old caches.
- Import boundaries, enforced by ESLint: `src/tools/X` may import from `src/core` and `src/ui` only; `src/core` may not import from `src/ui`, `src/app` or `src/tools`; `src/ui` may not import from `src/app` or `src/tools`; `src/sw` may import only from `src/sw`.
- Game ids and tags are compared case-insensitively through the helpers in `src/core/catalog`, never with `===` on raw strings.
- The game data is extracted from game files and can be incomplete or contradictory. Code reading it is defensive: optional fields may be absent or `null`, lookups that can miss return `null` or an empty list instead of throwing, contradictory rules fall back to the most permissive reasonable reading, and the UI shows "—" or a short note instead of breaking. Real-data tests report anomalies rather than assume perfect data.
- Never fill gaps in the game data with guessed or invented values. If the data has no number for something, show "—" or "Not in game data" instead of a made-up default. Values a user types in themselves are allowed, but they must be clearly labelled as the user's input.

## Conventions

- No comments in code.
- Files: React components in PascalCase (`WeaponPicker.tsx`) with a sibling `WeaponPicker.module.css`; other modules in camelCase (`damageModel.ts`). Tests sit next to the code as `*.test.ts(x)`.
- Named exports only, except the lazy tool page, which is the default export of `src/tools/<tool>/Tool.tsx`.
- Domain logic is pure functions in `src/core` or in a tool's `logic/` folder, tested without React. Components stay thin.
- Tests use trimmed real game data. Shared fixtures in `src/test/fixtures/data/` belong to the core; a tool keeps any extra records in `src/tools/<tool>/fixtures/` and passes them to `renderWithData` (with `fixtureWith`), so tools never edit shared fixtures.
- Tests rely on the global timeouts, 30 s per test in `vite.config.ts` and 10 s for `findBy*` and `waitFor` in `src/test/setup.ts`, so test files carry no timeout values of their own except for deliberate time-based waits. Vitest's file-system module cache is off, so `import.meta.glob` always sees the current files.
- A tool that links into another tool builds the URL itself and pins the format with a contract test (see the TTK link contract), since it may not import the other tool.
- Use the `@/` path alias for `src/`.
- Numbers shown to users go through the formatters in `src/ui/format.ts`.

## Commands

```
pnpm install
pnpm data:sync        download game data for every published build
pnpm assets:sync      download map tiles, icons and heightmaps (large, cached)
pnpm dev              run the app
pnpm test             run the tests once
pnpm lint             ESLint
pnpm typecheck        tsc on the app (tsconfig.json), configs and scripts (tsconfig.node.json) and the service worker (src/sw/tsconfig.json)
pnpm format           Prettier
pnpm check            typecheck, lint, format check and tests
pnpm build            production build into dist/
```

## Specs

- For this project the specs live in `specs/personal/` (gitignored), by the owner's choice. `specs/shared/` is unused for now.
- Worktrees do not contain gitignored files. A session working in a worktree reads and ticks its spec in the main checkout: `/Users/edgarsskrabins/SoftwareDevelopment/warpuppywiki/specs/personal/`.
- `specs/personal/00-index.md` lists every spec, the order they build on each other and which can run in parallel.
- Read a spec fully before implementing its feature.
