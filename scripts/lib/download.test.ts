import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChecksumError, downloadVerified, parseSha256File } from "./download";

const digest = "3b7c3c3649bb920b0947c6000092bd0225c6b6886e1e2123872144a122603294";

describe("parseSha256File", () => {
  it("reads the first token of a sha256sum line", () => {
    expect(parseSha256File(`${digest}  wardogs-data-25937608.zip\n`)).toBe(digest);
  });

  it("accepts a bare digest and lower-cases it", () => {
    expect(parseSha256File(`  ${digest.toUpperCase()}\n`)).toBe(digest);
  });

  it("rejects malformed input", () => {
    expect(() => parseSha256File("")).toThrow(/Malformed/);
    expect(() => parseSha256File("not-a-digest file.zip")).toThrow(/Malformed/);
    expect(() => parseSha256File(`${digest.slice(1)}  file.zip`)).toThrow(/Malformed/);
    expect(() => parseSha256File(`${digest}0  file.zip`)).toThrow(/Malformed/);
  });
});

describe("downloadVerified", () => {
  const content = "zip bytes";
  const contentUrl = `data:,${encodeURIComponent(content)}`;
  const shaUrl = (hex: string): string => `data:,${hex}%20%20file.zip`;
  const goodSha = createHash("sha256").update(content).digest("hex");
  let dir = "";

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "warpuppywiki-download-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("downloads, verifies and renames the file", async () => {
    const dest = join(dir, "file.zip");
    const result = await downloadVerified(contentUrl, shaUrl(goodSha), dest);
    expect(result).toEqual({ sha256: goodSha, downloaded: true });
    expect(await readFile(dest, "utf8")).toBe(content);
    expect(existsSync(`${dest}.part`)).toBe(false);
  });

  it("skips the download when the cached file matches", async () => {
    const dest = join(dir, "file.zip");
    await writeFile(dest, content);
    expect(await downloadVerified("data:,other", shaUrl(goodSha), dest)).toEqual({
      sha256: goodSha,
      downloaded: false,
    });
  });

  it("deletes the download and throws on a checksum mismatch", async () => {
    const dest = join(dir, "file.zip");
    await expect(downloadVerified(contentUrl, shaUrl("0".repeat(64)), dest)).rejects.toThrow(ChecksumError);
    expect(existsSync(dest)).toBe(false);
    expect(existsSync(`${dest}.part`)).toBe(false);
  });
});
