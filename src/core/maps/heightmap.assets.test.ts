import { describe, expect, it } from "vitest";
import buildingsJson from "./fixtures/kavkazi/buildings.json";
import { parseHeightmap, type HeightmapMeta } from "./heightmap";

interface NodeFs {
  existsSync(path: string): boolean;
  readFileSync(path: string): Uint8Array;
  readFileSync(path: string, encoding: "utf8"): string;
}

const fsModule = "node:fs";
const fs = (await import(fsModule)) as NodeFs;
const folder = "public/assets/maps/kavkazi";
const metaPath = `${folder}/heightmap.json`;
const dataPath = `${folder}/heightmap.u16`;
const synced = fs.existsSync(metaPath) && fs.existsSync(dataPath);

describe.skipIf(!synced)("synced Kavkazi heightmap", () => {
  it("puts the ground near the base of real buildings", () => {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as HeightmapMeta;
    const heightmap = parseHeightmap(meta, fs.readFileSync(dataPath).slice().buffer);
    expect(buildingsJson.buildings).toHaveLength(5);
    for (const building of buildingsJson.buildings) {
      const x = (building.min[0]! + building.max[0]!) / 2;
      const y = (building.min[1]! + building.max[1]!) / 2;
      const ground = heightmap.heightAt(x, y);
      expect(ground).not.toBeNull();
      expect(Math.abs(ground! - building.min[2]!)).toBeLessThan(5);
    }
  });
});
