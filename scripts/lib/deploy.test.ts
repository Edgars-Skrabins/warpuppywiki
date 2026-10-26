import { describe, expect, it } from "vitest";
import { deployFingerprint, deployInfo } from "./deploy";
import type { BuildsIndex } from "./releases";

const commit = "b92e1a0c5f3e4d2a1b0c9d8e7f6a5b4c3d2e1f0a";

const index: BuildsIndex = {
  schemaVersion: 1,
  latest: "25937608",
  builds: [
    { build: "25937608", publishedAt: "2026-10-20T12:00:00Z", name: "Build 25937608" },
    { build: "25677108", publishedAt: "2026-09-14T12:00:00Z", name: "Build 25677108" },
  ],
};

const withNewBuild: BuildsIndex = {
  schemaVersion: 1,
  latest: "26011234",
  builds: [{ build: "26011234", publishedAt: "2026-10-27T06:00:00Z", name: "Build 26011234" }, ...index.builds],
};

describe("deployFingerprint", () => {
  it("is stable for the same commit and builds", () => {
    expect(deployFingerprint(commit, index)).toBe(deployFingerprint(commit, structuredClone(index)));
  });

  it("changes when a new build is published", () => {
    expect(deployFingerprint(commit, withNewBuild)).not.toBe(deployFingerprint(commit, index));
  });

  it("changes when the commit changes", () => {
    expect(deployFingerprint("0".repeat(40), index)).not.toBe(deployFingerprint(commit, index));
  });
});

describe("deployInfo", () => {
  it("records the commit, the builds, the build time and the fingerprint", () => {
    expect(deployInfo(commit, index, new Date("2026-10-27T06:05:00Z"))).toEqual({
      commit,
      builds: { latest: "25937608", list: index.builds },
      builtAt: "2026-10-27T06:05:00.000Z",
      fingerprint: deployFingerprint(commit, index),
    });
  });
});
