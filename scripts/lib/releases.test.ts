import { describe, expect, it } from "vitest";
import { buildsIndex, githubHeaders, parseBuildTag, pickAssets, type Release, selectBuilds } from "./releases";

function asset(name: string): { name: string; browser_download_url: string } {
  return { name, browser_download_url: `https://example.test/${name}` };
}

const releases: Release[] = [
  {
    tag_name: "build-25677108",
    name: "Game build 25677108",
    published_at: "2026-10-10T14:09:49Z",
    assets: [
      asset("wardogs-data-25677108-full.zip"),
      asset("wardogs-data-25677108-full.zip.sha256"),
      asset("wardogs-data-25677108.zip"),
      asset("wardogs-data-25677108.zip.sha256"),
    ],
  },
  {
    tag_name: "tools-v1",
    name: "Tools",
    published_at: "2026-10-20T00:00:00Z",
    assets: [asset("tools.zip")],
  },
  {
    tag_name: "build-25937608",
    name: "Game build 25937608",
    published_at: "2026-10-15T19:57:06Z",
    assets: [
      asset("wardogs-data-25937608-full.zip"),
      asset("wardogs-data-25937608-full.zip.sha256"),
      asset("wardogs-data-25937608.zip"),
      asset("wardogs-data-25937608.zip.sha256"),
    ],
  },
  {
    tag_name: "build-25500000",
    name: null,
    published_at: "2026-10-01T00:00:00Z",
    assets: [asset("wardogs-data-25500000-full.zip"), asset("wardogs-data-25500000-full.zip.sha256")],
  },
];

describe("parseBuildTag", () => {
  it("returns the build id of a build tag", () => {
    expect(parseBuildTag("build-25937608")).toBe("25937608");
  });

  it("returns null for other tags", () => {
    expect(parseBuildTag("tools-v1")).toBeNull();
    expect(parseBuildTag("build-")).toBeNull();
    expect(parseBuildTag("build-123abc")).toBeNull();
    expect(parseBuildTag("prefix-build-123")).toBeNull();
  });
});

describe("pickAssets", () => {
  it("picks the small zip and its checksum", () => {
    const picked = pickAssets(releases[2]!, "data");
    expect(picked?.zip.name).toBe("wardogs-data-25937608.zip");
    expect(picked?.sha.name).toBe("wardogs-data-25937608.zip.sha256");
  });

  it("picks the full zip and its checksum", () => {
    const picked = pickAssets(releases[2]!, "full");
    expect(picked?.zip.name).toBe("wardogs-data-25937608-full.zip");
    expect(picked?.sha.browser_download_url).toBe("https://example.test/wardogs-data-25937608-full.zip.sha256");
  });

  it("returns null when the release lacks the asset or is not a build", () => {
    expect(pickAssets(releases[3]!, "data")).toBeNull();
    expect(pickAssets(releases[1]!, "data")).toBeNull();
  });
});

describe("selectBuilds", () => {
  it("lists build releases newest first and reports those missing the zip", () => {
    const { builds, skipped } = selectBuilds(releases, "data");
    expect(builds.map((build) => build.build)).toEqual(["25937608", "25677108"]);
    expect(builds[0]?.name).toBe("Game build 25937608");
    expect(skipped).toEqual(["build-25500000"]);
  });

  it("falls back to a generated name", () => {
    const { builds } = selectBuilds(releases, "full");
    expect(builds.map((build) => build.build)).toEqual(["25937608", "25677108", "25500000"]);
    expect(builds[2]?.name).toBe("Game build 25500000");
  });
});

describe("buildsIndex", () => {
  it("sorts builds newest first and names the latest", () => {
    const index = buildsIndex([
      { build: "25677108", publishedAt: "2026-10-10T14:09:49Z", name: "Game build 25677108" },
      { build: "25937608", publishedAt: "2026-10-15T19:57:06Z", name: "Game build 25937608" },
    ]);
    expect(index).toEqual({
      schemaVersion: 1,
      latest: "25937608",
      builds: [
        { build: "25937608", publishedAt: "2026-10-15T19:57:06Z", name: "Game build 25937608" },
        { build: "25677108", publishedAt: "2026-10-10T14:09:49Z", name: "Game build 25677108" },
      ],
    });
  });

  it("throws when nothing was synced", () => {
    expect(() => buildsIndex([])).toThrow();
  });
});

describe("githubHeaders", () => {
  it("sends the token only when one is set", () => {
    expect(githubHeaders(undefined).Authorization).toBeUndefined();
    expect(githubHeaders("abc").Authorization).toBe("Bearer abc");
  });
});
