import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { type AssetRequest, assetsUpToDate } from "./lib/assetsState";
import { cacheDir } from "./lib/cache";
import { downloadVerified } from "./lib/download";
import {
  decodeHeightmapPng,
  downsampleU16,
  type Heightmap,
  heightmapMeta,
  parseTerrain,
  type Terrain,
  writeU16LE,
} from "./lib/heightmap";
import { listReleases, selectBuilds } from "./lib/releases";
import { assetEntryTarget, extractEntry, forEachEntry, readEntry, safeJoin, stripTopFolder } from "./lib/zip";

const assetsRoot = resolve(import.meta.dirname, "..", "public", "assets");
const HEIGHTMAP_FACTOR = 4;

interface AssetArgs {
  maxZoom: number;
  worlds: string[] | null;
  build: string | null;
}

function readArgs(): AssetArgs {
  const { values } = parseArgs({
    options: {
      "max-zoom": { type: "string" },
      worlds: { type: "string" },
      build: { type: "string" },
    },
  });
  const maxZoom = values["max-zoom"] === undefined ? 6 : Number(values["max-zoom"]);
  if (!Number.isInteger(maxZoom) || maxZoom < 0 || maxZoom > 6) {
    throw new Error(`--max-zoom must be a whole number from 0 to 6, got ${values["max-zoom"]}`);
  }
  const worlds = values.worlds
    ? values.worlds
        .split(",")
        .map((world) => world.trim())
        .filter((world) => world !== "")
    : null;
  return { maxZoom, worlds, build: values.build ?? null };
}

function progressPrinter(name: string): (received: number, total: number | null) => void {
  let last = "";
  return (received, total) => {
    const mb = (bytes: number): string => (bytes / 1024 / 1024).toFixed(1);
    const line =
      total === null
        ? `Downloading ${name}: ${mb(received)} MB`
        : `Downloading ${name}: ${Math.floor((received / total) * 100)}% (${mb(received)} / ${mb(total)} MB)`;
    if (line === last) return;
    last = line;
    process.stdout.write(`\r${line}`);
  };
}

async function sameSize(path: string, size: number): Promise<boolean> {
  return existsSync(path) && (await stat(path)).size === size;
}

async function presentMaxZoom(world: string): Promise<number | null> {
  const tilesDir = join(assetsRoot, "maps", world, "tiles");
  if (!existsSync(tilesDir)) return null;
  const levels = (await readdir(tilesDir)).filter((name) => /^\d+$/.test(name)).map(Number);
  return levels.length > 0 ? Math.max(...levels) : null;
}

async function writeManifest(request: AssetRequest): Promise<void> {
  const mapsDir = join(assetsRoot, "maps");
  const worlds: Record<string, { maxZoom: number }> = {};
  if (existsSync(mapsDir)) {
    for (const world of (await readdir(mapsDir)).sort()) {
      const maxZoom = await presentMaxZoom(world);
      if (maxZoom !== null) worlds[world] = { maxZoom };
    }
  }
  const manifest = {
    schemaVersion: 1,
    build: request.build,
    worlds,
    icons: existsSync(join(assetsRoot, "icons")),
    sync: { maxZoom: request.maxZoom, worlds: request.worlds },
  };
  await writeFile(join(assetsRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function readManifest(): Promise<unknown> {
  const path = join(assetsRoot, "manifest.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function hasHeightmap(world: string): boolean {
  const worldDir = join(assetsRoot, "maps", world);
  return existsSync(join(worldDir, "heightmap.u16")) && existsSync(join(worldDir, "heightmap.json"));
}

async function previousBuild(): Promise<string | null> {
  const path = join(assetsRoot, "manifest.json");
  if (!existsSync(path)) return null;
  const manifest = JSON.parse(await readFile(path, "utf8")) as { build?: unknown };
  return typeof manifest.build === "string" ? manifest.build : null;
}

async function main(): Promise<void> {
  const args = readArgs();
  const { builds } = selectBuilds(await listReleases(), "full");
  const release = args.build === null ? builds[0] : builds.find((candidate) => candidate.build === args.build);
  if (!release) {
    throw new Error(args.build === null ? "No release has a full zip." : `Build ${args.build} has no full zip.`);
  }

  const request: AssetRequest = {
    build: release.build,
    maxZoom: args.maxZoom,
    worlds: args.worlds === null ? null : [...args.worlds].sort(),
  };
  if (assetsUpToDate(await readManifest(), request, hasHeightmap)) {
    console.log(`${release.build} assets up to date`);
    return;
  }

  const zipPath = join(cacheDir(), release.assets.zip.name);
  const { downloaded } = await downloadVerified(
    release.assets.zip.browser_download_url,
    release.assets.sha.browser_download_url,
    zipPath,
    { onProgress: progressPrinter(release.assets.zip.name) },
  );
  if (downloaded) process.stdout.write("\n");

  const previous = await previousBuild();
  if (previous !== null && previous !== release.build) await rm(assetsRoot, { recursive: true, force: true });
  await mkdir(assetsRoot, { recursive: true });

  const terrains = new Map<string, Terrain>();
  const heightmaps = new Map<string, Heightmap>();
  let copied = 0;
  await forEachEntry(zipPath, async (entry, zip) => {
    const terrainMatch = /^data\/maps\/([^/]+)\/terrain\.json$/.exec(stripTopFolder(entry.fileName));
    if (terrainMatch?.[1]) {
      terrains.set(terrainMatch[1], parseTerrain((await readEntry(zip, entry)).toString("utf8")));
      return;
    }
    const target = assetEntryTarget(entry.fileName, { maxZoom: args.maxZoom, worlds: args.worlds });
    if (target === null) return;
    if (target.kind === "copy") {
      const path = safeJoin(assetsRoot, target.path);
      if (await sameSize(path, entry.uncompressedSize)) return;
      await extractEntry(zip, entry, path);
      copied++;
      return;
    }
    const worldDir = safeJoin(assetsRoot, join("maps", target.world));
    if (existsSync(join(worldDir, "heightmap.u16")) && existsSync(join(worldDir, "heightmap.json"))) return;
    console.log(`Converting ${target.world} heightmap`);
    const source = decodeHeightmapPng(await readEntry(zip, entry));
    const heightmap = downsampleU16(source.data, source.width, source.height, HEIGHTMAP_FACTOR);
    await mkdir(worldDir, { recursive: true });
    await writeU16LE(join(worldDir, "heightmap.u16"), heightmap.data);
    heightmaps.set(target.world, heightmap);
  });

  for (const [world, heightmap] of heightmaps) {
    const terrain = terrains.get(world);
    if (!terrain) throw new Error(`The full zip has no terrain.json for ${world}.`);
    const meta = heightmapMeta(terrain, heightmap.width, heightmap.height);
    await writeFile(join(assetsRoot, "maps", world, "heightmap.json"), `${JSON.stringify(meta, null, 2)}\n`);
  }

  await writeManifest(request);
  console.log(`${release.build} assets synced: ${copied} files extracted, ${heightmaps.size} heightmaps converted`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
