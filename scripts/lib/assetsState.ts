export interface AssetRequest {
  build: string;
  maxZoom: number;
  worlds: string[] | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameWorlds(recorded: unknown, requested: string[] | null): boolean {
  if (requested === null) return recorded === null;
  if (!Array.isArray(recorded) || !recorded.every((world) => typeof world === "string")) return false;
  const a = [...recorded].sort();
  const b = [...requested].sort();
  return a.length === b.length && a.every((world, index) => world === b[index]);
}

export function assetsUpToDate(
  manifest: unknown,
  request: AssetRequest,
  hasHeightmap: (world: string) => boolean,
): boolean {
  if (!isRecord(manifest) || !isRecord(manifest.sync) || !isRecord(manifest.worlds)) return false;
  if (manifest.build !== request.build || manifest.icons !== true) return false;
  if (manifest.sync.maxZoom !== request.maxZoom || !sameWorlds(manifest.sync.worlds, request.worlds)) return false;
  return Object.keys(manifest.worlds).every((world) => hasHeightmap(world));
}
