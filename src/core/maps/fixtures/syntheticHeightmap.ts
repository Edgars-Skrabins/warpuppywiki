import { parseHeightmap, type HeightmapMeta } from "../heightmap";

export const syntheticMeta: HeightmapMeta = {
  width: 3,
  height: 3,
  metersPerPixel: 10,
  bounds: { min: [100, 200], max: [130, 230] },
  zRange: { min: -100, max: 555.35 },
};

export const syntheticValues = [0, 100, 200, 300, 400, 500, 600, 700, 800];

export function u16Buffer(values: readonly number[]): ArrayBuffer {
  const buffer = new ArrayBuffer(values.length * 2);
  const view = new DataView(buffer);
  values.forEach((v, i) => view.setUint16(i * 2, v, true));
  return buffer;
}

export function syntheticHeightmap() {
  return parseHeightmap(syntheticMeta, u16Buffer(syntheticValues));
}
