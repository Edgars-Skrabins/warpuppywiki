import { describe, expect, it } from "vitest";
import { APP_CACHE, CACHE_PREFIX, TILE_CACHE, classify } from "./strategy";

const base = "https://example.github.io/warpuppywiki/";
const at = (path: string) => `${base}${path}`;

describe("classify", () => {
  it("fetches the page and the base path network first", () => {
    expect(classify(base, base)).toBe("network-first");
    expect(classify(at("index.html"), base)).toBe("network-first");
  });

  it("fetches the build list and the assets manifest network first", () => {
    expect(classify(at("data/builds.json"), base)).toBe("network-first");
    expect(classify(at("assets/manifest.json"), base)).toBe("network-first");
  });

  it("serves hashed build files cache first", () => {
    expect(classify(at("assets/index-B4xQ_9zA.js"), base)).toBe("cache-first");
    expect(classify(at("assets/Tool-a1-b2C3d.css"), base)).toBe("cache-first");
    expect(classify(at("assets/barlow-latin-400-normal-Dk3j2Lm9.woff2"), base)).toBe("cache-first");
  });

  it("leaves files in assets that are not hashed build files to the network", () => {
    expect(classify(at("assets/index.js"), base)).toBe("passthrough");
    expect(classify(at("assets/notes.txt"), base)).toBe("passthrough");
    expect(classify(at("assets/sub/index-B4xQ_9zA.js"), base)).toBe("passthrough");
  });

  it("serves game data of a build cache first", () => {
    expect(classify(at("data/2026.10.1/items.json"), base)).toBe("cache-first");
    expect(classify(at("data/2026.10.1/maps/forest/markers.json"), base)).toBe("cache-first");
  });

  it("serves icons cache first", () => {
    expect(classify(at("assets/icons/weapons/rifle.webp"), base)).toBe("cache-first");
  });

  it("puts map tiles and overviews in the tile cache", () => {
    expect(classify(at("assets/maps/forest/tiles/3/4/5.webp"), base)).toBe("tiles");
    expect(classify(at("assets/maps/forest/overview.webp"), base)).toBe("tiles");
  });

  it("serves heightmaps cache first", () => {
    expect(classify(at("assets/maps/forest/heightmap.u16"), base)).toBe("cache-first");
    expect(classify(at("assets/maps/forest/heightmap.json"), base)).toBe("cache-first");
  });

  it("ignores the query string", () => {
    expect(classify(at("index.html?v=2"), base)).toBe("network-first");
    expect(classify(at("data/builds.json?t=1"), base)).toBe("network-first");
    expect(classify(at("assets/icons/a.webp?x=1"), base)).toBe("cache-first");
  });

  it("leaves other origins and paths outside the base to the network", () => {
    expect(classify("https://cdn.example.com/warpuppywiki/assets/icons/a.webp", base)).toBe("passthrough");
    expect(classify("https://example.github.io/other/data/builds.json", base)).toBe("passthrough");
  });

  it("leaves anything else to the network", () => {
    expect(classify(at("sw.js"), base)).toBe("passthrough");
    expect(classify(at("favicon.svg"), base)).toBe("passthrough");
    expect(classify(at("data/notes.json"), base)).toBe("passthrough");
  });

  it("works with the site at the origin root", () => {
    expect(classify("https://example.com/", "https://example.com/")).toBe("network-first");
    expect(classify("https://example.com/assets/maps/w/tiles/0/0/0.webp", "https://example.com/")).toBe("tiles");
  });
});

describe("cache names", () => {
  it("prefixes both caches with the current version", () => {
    expect(APP_CACHE.startsWith(CACHE_PREFIX)).toBe(true);
    expect(TILE_CACHE.startsWith(CACHE_PREFIX)).toBe(true);
    expect(APP_CACHE).not.toBe(TILE_CACHE);
  });
});
