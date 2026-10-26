import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assetEntryTarget, dataEntryTarget, safeJoin, stripTopFolder } from "./zip";

const top = "wardogs-data-25937608/";

describe("stripTopFolder", () => {
  it("strips the archive's top folder", () => {
    expect(stripTopFolder(`${top}data/items.json`)).toBe("data/items.json");
  });

  it("leaves paths without a top folder alone", () => {
    expect(stripTopFolder("data/items.json")).toBe("data/items.json");
    expect(stripTopFolder("assets/icons/a.png")).toBe("assets/icons/a.png");
  });

  it("strips only one folder", () => {
    expect(stripTopFolder(`${top}${top}data/x.json`)).toBe(`${top}data/x.json`);
  });
});

describe("safeJoin", () => {
  const root = resolve("/tmp/out");

  it("joins a relative path inside the root", () => {
    expect(safeJoin(root, "maps/europe/map.json")).toBe(join(root, "maps", "europe", "map.json"));
  });

  it("throws for escapes and absolute paths", () => {
    expect(() => safeJoin(root, "../evil.json")).toThrow();
    expect(() => safeJoin(root, "maps/../../evil.json")).toThrow();
    expect(() => safeJoin(root, "/etc/passwd")).toThrow();
    expect(() => safeJoin(root, "")).toThrow();
  });
});

describe("dataEntryTarget", () => {
  const cases: [string, string | null][] = [
    ["data/weapons.json", "weapons.json"],
    ["data/csv/x.csv", null],
    ["data/schema/x.json", null],
    ["data/MANIFEST.json", null],
    ["data/README.md", null],
    ["data/maps/europe/map.json", "maps/europe/map.json"],
    ["data/maps/europe/buildings.geojson", null],
    ["data/maps/europe/", null],
    ["README.md", null],
    ["LICENSE", null],
  ];

  it.each(cases)("maps %s without a top folder", (path, expected) => {
    expect(dataEntryTarget(path)).toBe(expected);
  });

  it.each(cases)("maps %s with a top folder", (path, expected) => {
    expect(dataEntryTarget(`${top}${path}`)).toBe(expected);
  });
});

describe("assetEntryTarget", () => {
  const all = { maxZoom: 6, worlds: null };

  it("keeps tiles up to the max zoom", () => {
    expect(assetEntryTarget(`${top}assets/maps/europe/tiles/4/3/2.webp`, { maxZoom: 4, worlds: null })).toEqual({
      kind: "copy",
      path: "maps/europe/tiles/4/3/2.webp",
    });
    expect(assetEntryTarget(`${top}assets/maps/europe/tiles/5/3/2.webp`, { maxZoom: 4, worlds: null })).toBeNull();
  });

  it("skips worlds that were not asked for", () => {
    const filter = { maxZoom: 6, worlds: ["kavkazi"] };
    expect(assetEntryTarget("assets/maps/europe/tiles/0/0/0.webp", filter)).toBeNull();
    expect(assetEntryTarget("assets/maps/europe/overview.webp", filter)).toBeNull();
    expect(assetEntryTarget("assets/maps/kavkazi/overview.webp", filter)).toEqual({
      kind: "copy",
      path: "maps/kavkazi/overview.webp",
    });
  });

  it("keeps icons with their path", () => {
    expect(assetEntryTarget(`${top}assets/icons/UI/Shared/Icons/Utility/3D/T_UI_Ammo_120mm.png`, all)).toEqual({
      kind: "copy",
      path: "icons/UI/Shared/Icons/Utility/3D/T_UI_Ammo_120mm.png",
    });
  });

  it("routes the heightmap to conversion", () => {
    expect(assetEntryTarget(`${top}assets/maps/north-america/heightmap.png`, all)).toEqual({
      kind: "heightmap",
      world: "north-america",
    });
  });

  it("skips other files", () => {
    expect(assetEntryTarget(`${top}assets/maps.manifest.json`, all)).toBeNull();
    expect(assetEntryTarget(`${top}assets/icons.manifest.json`, all)).toBeNull();
    expect(assetEntryTarget(`${top}data/items.json`, all)).toBeNull();
    expect(assetEntryTarget(`${top}assets/maps/europe/tiles/readme.txt`, all)).toBeNull();
    expect(assetEntryTarget(`${top}assets/icons/`, all)).toBeNull();
  });
});
