import type { Vec2 } from "./types";

export interface HeightmapMeta {
  width: number;
  height: number;
  metersPerPixel: number;
  bounds: { min: Vec2; max: Vec2 };
  zRange: { min: number; max: number };
}

export interface Heightmap extends HeightmapMeta {
  heightAt(x: number, y: number): number | null;
}

export function parseHeightmap(meta: HeightmapMeta, buffer: ArrayBuffer): Heightmap {
  const { width, height, metersPerPixel, bounds, zRange } = meta;
  const count = width * height;
  if (buffer.byteLength !== count * 2) {
    throw new Error(`Heightmap has ${buffer.byteLength / 2} values, expected ${width} × ${height} = ${count}`);
  }
  const view = new DataView(buffer);
  const values = new Uint16Array(count);
  for (let i = 0; i < count; i++) values[i] = view.getUint16(i * 2, true);

  const scale = (zRange.max - zRange.min) / 65535;
  const value = (column: number, row: number): number => values[row * width + column]!;

  const heightAt = (x: number, y: number): number | null => {
    if (!(x >= bounds.min[0] && x <= bounds.max[0] && y >= bounds.min[1] && y <= bounds.max[1])) return null;
    const fx = Math.min(Math.max((x - bounds.min[0]) / metersPerPixel - 0.5, 0), width - 1);
    const fy = Math.min(Math.max((y - bounds.min[1]) / metersPerPixel - 0.5, 0), height - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const top = value(x0, y0) * (1 - tx) + value(x1, y0) * tx;
    const bottom = value(x0, y1) * (1 - tx) + value(x1, y1) * tx;
    return zRange.min + (top * (1 - ty) + bottom * ty) * scale;
  };

  return { width, height, metersPerPixel, bounds, zRange, heightAt };
}
