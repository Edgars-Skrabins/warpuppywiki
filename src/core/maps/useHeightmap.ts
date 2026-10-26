import { skipToken, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  DataMissingError,
  DataNetworkError,
  DataValidationError,
  useAssetsManifest,
  type DataError,
  type DataState,
  type World,
} from "@/core/data";
import { parseHeightmap, type Heightmap } from "./heightmap";

const Vec2 = z.tuple([z.number(), z.number()]);

const HeightmapMetaFile = z.looseObject({
  width: z.number(),
  height: z.number(),
  metersPerPixel: z.number(),
  bounds: z.looseObject({ min: Vec2, max: Vec2 }),
  zRange: z.looseObject({ min: z.number(), max: z.number() }),
});

export function heightmapUrl(world: World, extension: "json" | "u16"): string {
  return `${import.meta.env.BASE_URL}assets/maps/${world}/heightmap.${extension}`;
}

async function fetchAsset(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new DataNetworkError(url);
  }
  if (response.status === 404 || response.headers.get("Content-Type")?.startsWith("text/html")) {
    throw new DataMissingError(url);
  }
  if (!response.ok) {
    throw new DataNetworkError(url, response.status);
  }
  return response;
}

async function loadHeightmap(world: World): Promise<Heightmap> {
  const metaUrl = heightmapUrl(world, "json");
  const dataUrl = heightmapUrl(world, "u16");
  const [metaResponse, dataResponse] = await Promise.all([fetchAsset(metaUrl), fetchAsset(dataUrl)]);
  const meta = HeightmapMetaFile.safeParse(await metaResponse.json().catch(() => undefined));
  if (!meta.success) {
    throw new DataValidationError(
      metaUrl,
      meta.error.issues.slice(0, 10).map((issue) => issue.message),
    );
  }
  try {
    return parseHeightmap(meta.data, await dataResponse.arrayBuffer());
  } catch (error) {
    throw new DataValidationError(dataUrl, [error instanceof Error ? error.message : String(error)]);
  }
}

export function useHeightmap(world: World): DataState<Heightmap | null> {
  const manifest = useAssetsManifest();
  const synced = manifest.status === "success" && manifest.data !== null && Object.hasOwn(manifest.data.worlds, world);
  const query = useQuery({
    queryKey: ["heightmap", world],
    queryFn: synced ? () => loadHeightmap(world) : skipToken,
    staleTime: Infinity,
  });
  if (manifest.status !== "success") {
    return manifest;
  }
  if (!synced) {
    return { status: "success", data: null };
  }
  if (query.status === "success") {
    return { status: "success", data: query.data };
  }
  if (query.status === "error") {
    return { status: "error", error: query.error as DataError };
  }
  return { status: "loading" };
}
