import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { currentCommit, deployFingerprint } from "./lib/deploy";
import type { BuildsIndex } from "./lib/releases";

const buildsPath = resolve(import.meta.dirname, "..", "public", "data", "builds.json");

async function main(): Promise<void> {
  const index = JSON.parse(await readFile(buildsPath, "utf8")) as BuildsIndex;
  console.log(deployFingerprint(currentCommit(), index));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
