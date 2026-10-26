# warpuppywiki

An unofficial set of browser tools for the game Wardogs: a loadout builder, a time-to-kill calculator, an interactive map, a patch diff tracker and smaller reference and planning tools. It runs entirely in the browser on static game data, with no backend.

warpuppywiki is a fan project. It is not affiliated with or endorsed by Bulkhead or Team17. Wardogs, its names and its imagery belong to them. The game data comes from the [warpuppies/wardogs-data](https://github.com/warpuppies/wardogs-data) project.

## Tech stack

- **Frontend:** React with TypeScript, built with Vite.
- **Styling:** CSS Modules.
- **Tests:** Vitest with Testing Library and jsdom.
- **Linting and formatting:** ESLint and Prettier.

## Project structure

- `src/app/`: the shell: routing, layout and the tool registry.
- `src/core/`: shared domain code used by more than one tool.
- `src/ui/`: the UI kit: design tokens, theme and reusable components.
- `src/tools/`: one folder per tool. Tools import from `src/core` and `src/ui` only, never from each other; lint enforces this.
- `scripts/`: Node scripts that download and prepare game data and assets.
- `public/data/` and `public/assets/`: synced game data and assets (not committed).

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

Optionally, download the map tiles, map overviews, item icons and heightmaps of the latest build into `public/assets/` (about 375 MB). The app works without them and shows placeholders instead:

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

## Commands

- `pnpm test:watch`: run the tests in watch mode.
- `pnpm lint`: run ESLint.
- `pnpm typecheck`: type-check the app, the configs and the scripts.
- `pnpm format`: format all files with Prettier (`pnpm format:check` only checks).
- `pnpm check`: type-check, lint, check formatting and run the tests.
- `pnpm build`: production build into `dist/`.
- `pnpm preview`: serve the production build locally.
