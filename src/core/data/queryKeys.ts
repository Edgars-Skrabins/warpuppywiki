import type { BuildFileKey, World, WorldFileKey } from "./files";

export const queryKeys = {
  builds: () => ["builds"] as const,
  data: (build: string, key: BuildFileKey) => ["data", build, key] as const,
  world: (build: string, world: World, key: WorldFileKey) => ["world", build, world, key] as const,
  raw: (build: string, key: BuildFileKey) => ["raw", build, key] as const,
  rawWorld: (build: string, world: World, key: WorldFileKey) => ["raw-world", build, world, key] as const,
  assetsManifest: () => ["assets-manifest"] as const,
};
