import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { pipeline } from "node:stream/promises";

export interface DownloadOptions {
  onProgress?: (received: number, total: number | null) => void;
}

export interface DownloadResult {
  sha256: string;
  downloaded: boolean;
}

export class ChecksumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChecksumError";
  }
}

export function parseSha256File(text: string): string {
  const token = text.trim().split(/\s+/)[0] ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(token)) {
    throw new Error(`Malformed SHA-256 file: ${JSON.stringify(text.slice(0, 100))}`);
  }
  return token.toLowerCase();
}

export async function sha256File(path: string): Promise<string> {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download of ${url} failed: ${response.status} ${response.statusText}`);
  return response.text();
}

export async function downloadVerified(
  url: string,
  shaUrl: string,
  dest: string,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const expected = parseSha256File(await fetchText(shaUrl));
  if (existsSync(dest)) {
    const actual = await sha256File(dest);
    if (actual === expected) return { sha256: expected, downloaded: false };
    console.warn(`Checksum error in cached ${basename(dest)}: expected ${expected}, got ${actual}. Downloading again.`);
    await rm(dest, { force: true });
  }

  await mkdir(dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download of ${url} failed: ${response.status} ${response.statusText}`);
  }
  const length = Number(response.headers.get("content-length"));
  const total = Number.isFinite(length) && length > 0 ? length : null;
  const reader: ReadableStreamDefaultReader<Uint8Array> = response.body.getReader();
  const hash = createHash("sha256");
  let received = 0;

  async function* chunks(): AsyncGenerator<Uint8Array> {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      hash.update(value);
      received += value.length;
      options.onProgress?.(received, total);
      yield value;
    }
  }

  try {
    await pipeline(chunks, createWriteStream(part));
  } catch (error) {
    await rm(part, { force: true });
    throw error;
  }

  const actual = hash.digest("hex");
  if (actual !== expected) {
    await rm(part, { force: true });
    throw new ChecksumError(
      `Checksum error in ${basename(dest)}: expected ${expected}, got ${actual}. The download was deleted.`,
    );
  }
  await rename(part, dest);
  return { sha256: expected, downloaded: true };
}
