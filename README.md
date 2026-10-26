# warpuppywiki

An unofficial set of browser tools for the game Wardogs: a loadout builder, a time-to-kill calculator, an interactive map, a patch diff tracker and smaller reference and planning tools. It runs entirely in the browser on static game data, with no backend.

warpuppywiki is a fan project. It is not affiliated with or endorsed by Bulkhead or Team17. Wardogs, its names and its imagery belong to them. The game data comes from the [warpuppies/wardogs-data](https://github.com/warpuppies/wardogs-data) project.

## Tech stack

- **Frontend:** React with TypeScript, built with Vite.
- **Styling:** CSS Modules.
- **Tests:** Vitest with Testing Library and jsdom.
- **Linting and formatting:** ESLint and Prettier.
- **CI:** GitHub Actions runs the checks and the build on every push and pull request.

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
- `pnpm check`: type-check, lint, check formatting and run the tests, as CI does.
- `pnpm build`: production build into `dist/`.
- `pnpm preview`: serve the production build locally.
