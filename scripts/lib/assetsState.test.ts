import { describe, expect, it } from "vitest";
import { type AssetRequest, assetsUpToDate } from "./assetsState";

const request: AssetRequest = { build: "25937608", maxZoom: 6, worlds: null };

const manifest = {
  schemaVersion: 1,
  build: "25937608",
  worlds: { europe: { maxZoom: 6 }, kavkazi: { maxZoom: 5 } },
  icons: true,
  iconFormat: "webp",
  sync: { maxZoom: 6, worlds: null },
};

const allHeightmaps = (): boolean => true;

describe("assetsUpToDate", () => {
  it("is up to date for a manifest that matches the request", () => {
    expect(assetsUpToDate(manifest, request, allHeightmaps)).toBe(true);
  });

  it("is not up to date without a manifest", () => {
    expect(assetsUpToDate(null, request, allHeightmaps)).toBe(false);
    expect(assetsUpToDate(undefined, request, allHeightmaps)).toBe(false);
  });

  it("is not up to date for a malformed manifest", () => {
    expect(assetsUpToDate("manifest", request, allHeightmaps)).toBe(false);
    expect(assetsUpToDate([manifest], request, allHeightmaps)).toBe(false);
    expect(assetsUpToDate({ ...manifest, worlds: null }, request, allHeightmaps)).toBe(false);
    expect(
      assetsUpToDate({ ...manifest, sync: { maxZoom: 6, worlds: [1] } }, { ...request, worlds: ["1"] }, allHeightmaps),
    ).toBe(false);
  });

  it("is not up to date for another build", () => {
    expect(assetsUpToDate(manifest, { ...request, build: "25677108" }, allHeightmaps)).toBe(false);
  });

  it("is not up to date for another max zoom", () => {
    expect(assetsUpToDate(manifest, { ...request, maxZoom: 3 }, allHeightmaps)).toBe(false);
  });

  it("compares the requested worlds regardless of order", () => {
    const limited = { ...manifest, sync: { maxZoom: 6, worlds: ["europe", "kavkazi"] } };
    expect(assetsUpToDate(limited, { ...request, worlds: ["kavkazi", "europe"] }, allHeightmaps)).toBe(true);
    expect(assetsUpToDate(limited, { ...request, worlds: ["kavkazi"] }, allHeightmaps)).toBe(false);
    expect(assetsUpToDate(limited, request, allHeightmaps)).toBe(false);
    expect(assetsUpToDate(manifest, { ...request, worlds: ["europe", "kavkazi"] }, allHeightmaps)).toBe(false);
  });

  it("is not up to date for a manifest written without the sync request", () => {
    const older = { schemaVersion: 1, build: manifest.build, worlds: manifest.worlds, icons: true };
    expect(assetsUpToDate(older, request, allHeightmaps)).toBe(false);
  });

  it("is not up to date without icons", () => {
    expect(assetsUpToDate({ ...manifest, icons: false }, request, allHeightmaps)).toBe(false);
  });

  it("is not up to date when the icons are not WebP", () => {
    const older = {
      schemaVersion: 1,
      build: manifest.build,
      worlds: manifest.worlds,
      icons: true,
      sync: manifest.sync,
    };
    expect(assetsUpToDate(older, request, allHeightmaps)).toBe(false);
    expect(assetsUpToDate({ ...manifest, iconFormat: "png" }, request, allHeightmaps)).toBe(false);
  });

  it("is not up to date when a world's heightmap is missing", () => {
    expect(assetsUpToDate(manifest, request, (world) => world !== "kavkazi")).toBe(false);
  });
});
