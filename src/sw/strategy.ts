export type Strategy = "network-first" | "cache-first" | "tiles" | "passthrough";

export const CACHE_VERSION = "v1";
export const CACHE_PREFIX = `wpw-${CACHE_VERSION}-`;
export const APP_CACHE = `${CACHE_PREFIX}app`;
export const TILE_CACHE = `${CACHE_PREFIX}tiles`;
export const TILE_CACHE_CAP = 2000;

const NETWORK_FIRST = new Set(["", "index.html", "data/builds.json", "assets/manifest.json"]);
const HASHED_BUILD_FILE = /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css|woff2)$/;
const GAME_DATA = /^data\/[^/]+\/.+/;
const ICON = /^assets\/icons\/.+/;
const TILE = /^assets\/maps\/[^/]+\/(tiles\/.+|overview\.webp)$/;
const HEIGHTMAP = /^assets\/maps\/[^/]+\/heightmap\.[^/]+$/;

export function relativePath(url: string | URL, base: string | URL): string | null {
  const target = new URL(url);
  const root = new URL(base);
  if (target.origin !== root.origin) return null;
  if (!target.pathname.startsWith(root.pathname)) return null;
  return target.pathname.slice(root.pathname.length);
}

export function classify(url: string | URL, base: string | URL): Strategy {
  const path = relativePath(url, base);
  if (path === null) return "passthrough";
  if (NETWORK_FIRST.has(path)) return "network-first";
  if (TILE.test(path)) return "tiles";
  if (HASHED_BUILD_FILE.test(path) || GAME_DATA.test(path) || ICON.test(path) || HEIGHTMAP.test(path)) {
    return "cache-first";
  }
  return "passthrough";
}
