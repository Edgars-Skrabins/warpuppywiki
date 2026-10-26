const RELEASES_URL = "https://api.github.com/repos/warpuppies/wardogs-data/releases?per_page=100";

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface Release {
  tag_name: string;
  name: string | null;
  published_at: string;
  assets: ReleaseAsset[];
}

export type AssetKind = "data" | "full";

export interface PickedAssets {
  zip: ReleaseAsset;
  sha: ReleaseAsset;
}

export interface BuildRelease {
  build: string;
  name: string;
  publishedAt: string;
  assets: PickedAssets;
}

export interface BuildSelection {
  builds: BuildRelease[];
  skipped: string[];
}

export interface BuildEntry {
  build: string;
  publishedAt: string;
  name: string;
}

export interface BuildsIndex {
  schemaVersion: 1;
  latest: string;
  builds: BuildEntry[];
}

export function parseBuildTag(tag: string): string | null {
  return /^build-(\d+)$/.exec(tag)?.[1] ?? null;
}

export function zipAssetName(build: string, kind: AssetKind): string {
  return kind === "full" ? `wardogs-data-${build}-full.zip` : `wardogs-data-${build}.zip`;
}

export function pickAssets(release: Release, kind: AssetKind): PickedAssets | null {
  const build = parseBuildTag(release.tag_name);
  if (build === null) return null;
  const zipName = zipAssetName(build, kind);
  const zip = release.assets.find((asset) => asset.name === zipName);
  const sha = release.assets.find((asset) => asset.name === `${zipName}.sha256`);
  return zip && sha ? { zip, sha } : null;
}

export function selectBuilds(releases: Release[], kind: AssetKind): BuildSelection {
  const builds: BuildRelease[] = [];
  const skipped: string[] = [];
  for (const release of releases) {
    const build = parseBuildTag(release.tag_name);
    if (build === null) continue;
    const assets = pickAssets(release, kind);
    if (assets === null) {
      skipped.push(release.tag_name);
      continue;
    }
    builds.push({ build, name: release.name ?? `Game build ${build}`, publishedAt: release.published_at, assets });
  }
  builds.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { builds, skipped };
}

export function buildsIndex(entries: BuildEntry[]): BuildsIndex {
  const builds = [...entries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const latest = builds[0];
  if (!latest) throw new Error("No synced builds to list in builds.json.");
  return { schemaVersion: 1, latest: latest.build, builds };
}

export function githubHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "warpuppywiki-sync",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function listReleases(): Promise<Release[]> {
  const response = await fetch(RELEASES_URL, { headers: githubHeaders(process.env.GITHUB_TOKEN) });
  if ((response.status === 403 || response.status === 429) && response.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    const resetText = Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : "an unknown time";
    throw new Error(
      `GitHub API rate limit reached. It resets at ${resetText}. Set GITHUB_TOKEN to get a higher limit.`,
    );
  }
  if (!response.ok) {
    throw new Error(`Listing releases failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Release[];
}
