import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import yauzl, { type Entry, type ZipFile } from "yauzl";

export type AssetTarget = { kind: "copy"; path: string } | { kind: "heightmap"; world: string };

export interface AssetFilter {
  maxZoom: number;
  worlds: string[] | null;
}

export function stripTopFolder(entryPath: string): string {
  return entryPath.replace(/^wardogs-data-[^/]+\//, "");
}

export function safeJoin(root: string, relativePath: string): string {
  if (isAbsolute(relativePath)) throw new Error(`Refusing absolute zip entry path: ${relativePath}`);
  const base = resolve(root);
  const target = resolve(base, relativePath);
  const rel = relative(base, target);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Refusing zip entry path outside the target folder: ${relativePath}`);
  }
  return target;
}

export function dataEntryTarget(entryPath: string): string | null {
  const path = stripTopFolder(entryPath);
  if (!path.startsWith("data/") || path.endsWith("/")) return null;
  const rest = path.slice("data/".length);
  if (!rest.includes("/")) return rest.endsWith(".json") && rest !== "MANIFEST.json" ? rest : null;
  if (/^maps\/[^/]+\/.+/.test(rest) && !rest.endsWith(".geojson")) return rest;
  return null;
}

export function assetEntryTarget(entryPath: string, filter: AssetFilter): AssetTarget | null {
  const path = stripTopFolder(entryPath);
  if (path.endsWith("/")) return null;
  if (path.startsWith("assets/icons/")) return { kind: "copy", path: path.slice("assets/".length) };

  const map = /^assets\/maps\/([^/]+)\/(.+)$/.exec(path);
  if (!map) return null;
  const [, world = "", rest = ""] = map;
  if (filter.worlds !== null && !filter.worlds.includes(world)) return null;
  if (rest === "heightmap.png") return { kind: "heightmap", world };
  if (rest === "overview.webp") return { kind: "copy", path: `maps/${world}/overview.webp` };

  const tile = /^tiles\/(\d+)\/\d+\/\d+\.webp$/.exec(rest);
  if (tile && Number(tile[1]) <= filter.maxZoom) return { kind: "copy", path: `maps/${world}/${rest}` };
  return null;
}

export function forEachEntry(zipPath: string, fn: (entry: Entry, zip: ZipFile) => Promise<void>): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (openError, zip) => {
      if (openError) {
        reject(openError);
        return;
      }
      const fail = (error: unknown): void => {
        zip.close();
        reject(error instanceof Error ? error : new Error(String(error)));
      };
      zip.on("error", fail);
      zip.on("end", () => resolvePromise());
      zip.on("entry", (entry: Entry) => {
        fn(entry, zip).then(() => zip.readEntry(), fail);
      });
      zip.readEntry();
    });
  });
}

export function openEntryStream(zip: ZipFile, entry: Entry): Promise<Readable> {
  return new Promise((resolvePromise, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error) reject(error);
      else resolvePromise(stream);
    });
  });
}

export async function readEntry(zip: ZipFile, entry: Entry): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of await openEntryStream(zip, entry)) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

export async function extractEntry(zip: ZipFile, entry: Entry, targetPath: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });
  await pipeline(await openEntryStream(zip, entry), createWriteStream(targetPath));
}
