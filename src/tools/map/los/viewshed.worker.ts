import { z } from "zod";
import { parseHeightmap, type Heightmap } from "@/core/maps/heightmap";
import { computeViewshed, type Viewshed, type ViewshedInput } from "./viewshed";

export interface ViewshedRequest {
  id: number;
  metaUrl: string;
  dataUrl: string;
  input: ViewshedInput;
}

export type ViewshedResponse =
  | { type: "progress"; id: number; value: number }
  | { type: "done"; id: number; result: Viewshed | null }
  | { type: "error"; id: number; message: string };

interface WorkerScope {
  addEventListener(type: "message", listener: (event: MessageEvent<ViewshedRequest>) => void): void;
  postMessage(message: ViewshedResponse, transfer?: Transferable[]): void;
}

const Vec2 = z.tuple([z.number(), z.number()]);

const HeightmapMeta = z.looseObject({
  width: z.number(),
  height: z.number(),
  metersPerPixel: z.number(),
  bounds: z.looseObject({ min: Vec2, max: Vec2 }),
  zRange: z.looseObject({ min: z.number(), max: z.number() }),
});

const scope = self as unknown as WorkerScope;
let cached: { dataUrl: string; heightmap: Heightmap } | null = null;

async function loadHeightmap(metaUrl: string, dataUrl: string): Promise<Heightmap> {
  if (cached?.dataUrl === dataUrl) {
    return cached.heightmap;
  }
  const [metaResponse, dataResponse] = await Promise.all([fetch(metaUrl), fetch(dataUrl)]);
  if (!metaResponse.ok || !dataResponse.ok) {
    throw new Error("Terrain data isn't installed");
  }
  const meta = HeightmapMeta.parse(await metaResponse.json());
  const heightmap = parseHeightmap(meta, await dataResponse.arrayBuffer());
  cached = { dataUrl, heightmap };
  return heightmap;
}

scope.addEventListener("message", (event) => {
  const { id, metaUrl, dataUrl, input } = event.data;
  loadHeightmap(metaUrl, dataUrl)
    .then((heightmap) => {
      const result = computeViewshed(
        input,
        (x, y) => heightmap.heightAt(x, y),
        (value) => scope.postMessage({ type: "progress", id, value }),
      );
      scope.postMessage({ type: "done", id, result }, result === null ? [] : [result.cells.buffer]);
    })
    .catch((error: unknown) => {
      scope.postMessage({ type: "error", id, message: error instanceof Error ? error.message : String(error) });
    });
});
