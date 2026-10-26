import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cacheDir } from "./lib/cache";
import { downloadVerified, fetchText, parseSha256File } from "./lib/download";
import { type BuildEntry, type BuildRelease, buildsIndex, listReleases, selectBuilds } from "./lib/releases";
import { dataEntryTarget, extractEntry, forEachEntry, safeJoin } from "./lib/zip";

const dataRoot = resolve(import.meta.dirname, "..", "public", "data");

async function syncedChecksum(buildDir: string): Promise<string | null> {
  const marker = join(buildDir, ".synced");
  return existsSync(marker) ? (await readFile(marker, "utf8")).trim() : null;
}

async function syncBuild(release: BuildRelease): Promise<void> {
  const buildDir = join(dataRoot, release.build);
  const expected = parseSha256File(await fetchText(release.assets.sha.browser_download_url));
  if ((await syncedChecksum(buildDir)) === expected) {
    console.log(`${release.build} up to date`);
    return;
  }

  const zipPath = join(cacheDir(), release.assets.zip.name);
  const { sha256 } = await downloadVerified(
    release.assets.zip.browser_download_url,
    release.assets.sha.browser_download_url,
    zipPath,
  );

  const tmpDir = join(dataRoot, `.${release.build}.tmp`);
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  await forEachEntry(zipPath, async (entry, zip) => {
    const target = dataEntryTarget(entry.fileName);
    if (target !== null) await extractEntry(zip, entry, safeJoin(tmpDir, target));
  });
  await rm(buildDir, { recursive: true, force: true });
  await rename(tmpDir, buildDir);
  await writeFile(join(buildDir, ".synced"), `${sha256}\n`);
  console.log(`${release.build} synced`);
}

async function main(): Promise<void> {
  await mkdir(dataRoot, { recursive: true });
  const { builds, skipped } = selectBuilds(await listReleases(), "data");
  for (const tag of skipped) console.warn(`${tag} skipped: the release has no data zip or checksum`);

  const synced: BuildEntry[] = [];
  for (const release of builds) {
    try {
      await syncBuild(release);
    } catch (error) {
      process.exitCode = 1;
      console.error(`${release.build} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if ((await syncedChecksum(join(dataRoot, release.build))) !== null) {
      synced.push({ build: release.build, publishedAt: release.publishedAt, name: release.name });
    }
  }

  const index = buildsIndex(synced);
  await writeFile(join(dataRoot, "builds.json"), `${JSON.stringify(index, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
