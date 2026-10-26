import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export function cacheDir(): string {
  const dir = process.env.WARPUPPY_CACHE_DIR || join(homedir(), ".cache", "warpuppywiki");
  mkdirSync(dir, { recursive: true });
  return dir;
}
