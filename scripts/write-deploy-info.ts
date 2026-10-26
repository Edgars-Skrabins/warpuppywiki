import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { currentCommit, deployInfo } from "./lib/deploy";
import type { BuildsIndex } from "./lib/releases";

const root = resolve(import.meta.dirname, "..");

async function main(): Promise<void> {
  const index = JSON.parse(await readFile(join(root, "public", "data", "builds.json"), "utf8")) as BuildsIndex;
  const info = deployInfo(currentCommit(), index, new Date());
  await writeFile(join(root, "dist", "deploy.json"), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`dist/deploy.json written for ${info.commit}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
