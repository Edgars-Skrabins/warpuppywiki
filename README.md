# warpuppywiki

An unofficial set of browser tools for the game Wardogs: a loadout builder, a time-to-kill calculator, an interactive map, a patch diff tracker and smaller reference and planning tools. It runs entirely in the browser on static game data, with no backend.

warpuppywiki is a fan project. It is not affiliated with or endorsed by Bulkhead or Team17. Wardogs, its names and its imagery belong to them. The game data comes from the [warpuppies/wardogs-data](https://github.com/warpuppies/wardogs-data) project.

## Tech stack

- **Frontend:** React with TypeScript, built with Vite. React Router with a hash router, so the static build works on any host.
- **Data:** static JSON game data loaded with TanStack Query and validated with zod. No backend.
- **Map and charts:** Leaflet (through react-leaflet) and Recharts.
- **Styling:** CSS Modules with design tokens. No CSS framework.
- **Tests:** Vitest with Testing Library and jsdom.
- **Linting and formatting:** ESLint and Prettier.

## Project structure

- `src/app/`: the shell: routing, layout and the tool registry.
- `src/core/`: shared domain code used by more than one tool:
  - `data/`: loading and validating the game data files.
  - `catalog/`: items, display names, tags, prices and unlocks.
  - `modifiers/`: applying attribute modifiers.
  - `weapons/`: attachment and ammo compatibility, damage falloff and effective weapon stats.
  - `damage/`: the damage model: damage per hit, shots to kill and time to kill.
  - `maps/`: map coordinates, heightmaps and line of sight.
  - `state/`: URL and local storage state.
  - `tool/`: the `ToolDefinition` type every tool exports.
- `src/ui/`: the UI kit: design tokens, theme and reusable components.
- `src/tools/`: one folder per tool. Tools import from `src/core` and `src/ui` only, never from each other; lint enforces this.
- `scripts/`: Node scripts that download and prepare game data and assets.
- `public/data/` and `public/assets/`: synced game data and assets (not committed).
- `src/test/fixtures/`: trimmed real game data used by the tests.

## Adding a tool

Create a folder `src/tools/<id>/`, where `<id>` is lowercase and hyphenated, with two files:

- `index.ts` exports `tool`, a `ToolDefinition` from `@/core/tool`: id (the folder name), name, one-line summary, category, icon name, optional `status: "beta"`, and `component: lazy(() => import("./Tool"))`.
- `Tool.tsx` default-exports the tool's page.

The shell finds the folder on its own: the tool gets a card on the home page, an entry in the Tools menu and the route `#/<id>`. No shared file changes. The registry test checks the id, category and icon.

## Prerequisites

- Node 22 or newer (pinned in `.nvmrc`).
- pnpm, at the version pinned in the `packageManager` field of `package.json`.

## Setup

In the repository root:

```bash
pnpm install
```

Download the game data for every published build into `public/data/` (about 8 MB per build):

```bash
pnpm data:sync
```

Optionally, download the map tiles, map overviews, item icons and heightmaps of the latest build into `public/assets/` (about 345 MB). The app works without them and shows placeholders instead:

```bash
pnpm assets:sync
```

It downloads the build's full zip (about 700 MB) once into a shared cache. Options: `--max-zoom <0-6>` extracts fewer tile levels (default 6), `--worlds kavkazi,europe` limits the worlds (default all) and `--build <id>` picks a build other than the latest.

Both commands verify every download's SHA-256 and can be re-run safely; a second run only fetches what changed.

- The download cache is `~/.cache/warpuppywiki/`, shared by every checkout. Set `WARPUPPY_CACHE_DIR` to use another folder.
- Set `GITHUB_TOKEN` to send a token with GitHub API requests, which raises the rate limit (useful in CI).

## Running the app

In the repository root:

```bash
pnpm dev
```

Then open http://localhost:5173.

## Running tests

In the repository root:

```bash
pnpm test
```

Tests run on trimmed fixtures in `src/test/fixtures/`, so they don't need synced data. The `realData.test.ts` files also check the code against the full game data, and run only after `pnpm data:sync`.

## Commands

- `pnpm test:watch`: run the tests in watch mode.
- `pnpm lint`: run ESLint.
- `pnpm typecheck`: type-check the app, the configs and the scripts.
- `pnpm format`: format all files with Prettier (`pnpm format:check` only checks).
- `pnpm check`: type-check, lint, check formatting and run the tests.
- `pnpm build`: production build into `dist/`.
- `pnpm preview`: serve the production build locally.

## Deployment

The workflow `.github/workflows/deploy.yml` publishes the app to GitHub Pages at `https://<owner>.github.io/warpuppywiki/`. It runs on every push to the `deployment` branch and by hand ("Run workflow" in the Actions tab). Work is merged into `main`; a release is made by merging `main` into `deployment` and pushing it.

Each run installs the dependencies, syncs the game data and all map tile levels, builds the app and writes `dist/deploy.json` with the commit, the synced builds and a fingerprint of both. The extracted `public/assets/` folder is cached between runs per game build and version of the asset scripts, so a run with a cache hit skips the full-zip download and extraction; a new build or a change to the asset scripts downloads and extracts the zip once. It runs no tests; tests run locally only, so run `pnpm check` before merging into `deployment`. A failed sync or build stops the run before anything is deployed, so the live site stays as it was.

To turn on deployment:

1. In the repository settings, open **Pages** and set **Source** to **GitHub Actions**. Pages from a private repository needs a paid GitHub plan.
2. Under **Secrets and variables → Actions → Variables**, add the repository variable `PAGES_ENABLED` with the value `true`.

While `PAGES_ENABLED` is unset, the build still runs on every trigger and the deploy job is skipped.
