import { describe, expect, it } from "vitest";
import { BUILD_FILE_KEYS, WORLD_FILE_KEYS, WORLDS, buildFilePath, schemaForPath, worldFilePath } from "../files";
import { formatIssues } from "../loadDataFile";

const PREFIX = "/public/data/";

const syncedFiles = Object.entries(import.meta.glob<unknown>("/public/data/**/*.json", { import: "default" })).map(
  ([file, load]) => [file.slice(PREFIX.length), load] as const,
);

const hasData = syncedFiles.some(([path]) => path === "builds.json");

function expectedPaths(build: string): string[] {
  return [
    ...BUILD_FILE_KEYS.map((key) => `${build}/${buildFilePath(key)}`),
    ...WORLDS.flatMap((world) => WORLD_FILE_KEYS.map((key) => `${build}/${worldFilePath(world, key)}`)),
  ];
}

describe("real game data", () => {
  it.skipIf(!hasData)("every synced file matches its schema", async () => {
    const failures: string[] = [];
    for (const [path, load] of syncedFiles) {
      const schema = schemaForPath(path);
      if (schema === undefined) {
        failures.push(`${path}: no schema registered`);
        continue;
      }
      const result = schema.safeParse(await load());
      if (!result.success) {
        failures.push(...formatIssues(result.error).map((issue) => `${path} ${issue}`));
      }
    }
    expect(failures).toEqual([]);
  });

  it.skipIf(!hasData)("every synced build has every registered file", async () => {
    const builds = (await syncedFiles.find(([path]) => path === "builds.json")?.[1]()) as {
      builds: { build: string }[];
    };
    const paths = new Set(syncedFiles.map(([path]) => path));
    const missing = builds.builds.flatMap(({ build }) => expectedPaths(build).filter((path) => !paths.has(path)));
    expect(missing).toEqual([]);
  });
});
