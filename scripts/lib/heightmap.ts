import { writeFile } from "node:fs/promises";
import { decode } from "fast-png";

export interface Heightmap {
  width: number;
  height: number;
  data: Uint16Array;
}

export interface Terrain {
  bounds: { min: [number, number]; max: [number, number] };
  zRange: { min: number; max: number };
}

export interface HeightmapMeta extends Terrain {
  width: number;
  height: number;
  metersPerPixel: number;
}

export function decodeHeightmapPng(buffer: Uint8Array): Heightmap {
  const png = decode(buffer);
  if (png.depth !== 16 || png.channels !== 1 || !(png.data instanceof Uint16Array)) {
    throw new Error(`Expected a 16-bit grayscale heightmap, got ${png.depth}-bit with ${png.channels} channels.`);
  }
  return { width: png.width, height: png.height, data: png.data };
}

export function downsampleU16(data: Uint16Array, width: number, height: number, factor: number): Heightmap {
  if (width % factor !== 0 || height % factor !== 0) {
    throw new Error(`Heightmap size ${width} x ${height} is not divisible by ${factor}.`);
  }
  const outWidth = width / factor;
  const outHeight = height / factor;
  const out = new Uint16Array(outWidth * outHeight);
  const area = factor * factor;
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      let sum = 0;
      for (let dy = 0; dy < factor; dy++) {
        const row = (y * factor + dy) * width + x * factor;
        for (let dx = 0; dx < factor; dx++) sum += data[row + dx] ?? 0;
      }
      out[y * outWidth + x] = Math.round(sum / area);
    }
  }
  return { width: outWidth, height: outHeight, data: out };
}

export function heightmapMeta(terrain: Terrain, width: number, height: number): HeightmapMeta {
  return {
    width,
    height,
    bounds: terrain.bounds,
    zRange: terrain.zRange,
    metersPerPixel: (terrain.bounds.max[0] - terrain.bounds.min[0]) / width,
  };
}

export function parseTerrain(text: string): Terrain {
  const value = JSON.parse(text) as Partial<Terrain>;
  const { bounds, zRange } = value;
  const isPair = (pair: unknown): pair is [number, number] =>
    Array.isArray(pair) && pair.length >= 2 && typeof pair[0] === "number" && typeof pair[1] === "number";
  if (
    !bounds ||
    !isPair(bounds.min) ||
    !isPair(bounds.max) ||
    typeof zRange?.min !== "number" ||
    typeof zRange.max !== "number"
  ) {
    throw new Error("terrain.json is missing bounds or zRange.");
  }
  return { bounds: { min: bounds.min, max: bounds.max }, zRange: { min: zRange.min, max: zRange.max } };
}

export async function writeU16LE(path: string, data: Uint16Array): Promise<void> {
  const buffer = Buffer.alloc(data.length * 2);
  for (let i = 0; i < data.length; i++) buffer.writeUInt16LE(data[i] ?? 0, i * 2);
  await writeFile(path, buffer);
}
