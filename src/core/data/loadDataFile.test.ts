import { afterEach, describe, expect, it, vi } from "vitest";
import { buildFileUrl } from "./builds";
import { DataValidationError } from "./fetchJson";
import { loadDataFile, loadRaw, loadWorldFile } from "./loadDataFile";
import { fixtureWith, stubDataFetch } from "./testing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadDataFile", () => {
  it("returns validated data for a build file", async () => {
    stubDataFetch();
    const weapons = await loadDataFile("weapons", "25937608");
    expect(weapons.gameBuild).toBe("25937608");
    expect(weapons.weapons.map((weapon) => weapon.id)).toContain("Id.Item.AK74M");
  });

  it("keeps unknown fields", async () => {
    stubDataFetch({
      fixtures: { "25937608/tags.json": { ...fixtureWith("25937608/tags.json", "tags", []), futureField: 1 } },
    });
    const tags = await loadDataFile("tags", "25937608");
    expect(tags).toMatchObject({ futureField: 1 });
  });

  it("accepts null for optional fields", async () => {
    const file = fixtureWith("25937608/weapons.json", "weapons", []);
    const [first] = file.weapons as Record<string, unknown>[];
    stubDataFetch({ fixtures: { "25937608/weapons.json": { ...file, weapons: [{ ...first, rpm: null }] } } });
    const weapons = await loadDataFile("weapons", "25937608");
    expect(weapons.weapons[0]?.rpm).toBeNull();
  });

  it("throws DataValidationError with formatted issues when the schema does not match", async () => {
    const items = fixtureWith("25937608/items.json", "items", [{ id: 42 }]);
    stubDataFetch({ fixtures: { "25937608/items.json": items } });
    const error = await loadDataFile("items", "25937608").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataValidationError);
    const { url, issues } = error as DataValidationError;
    expect(url).toBe(buildFileUrl("25937608", "items.json"));
    expect(issues[0]).toMatch(/^items\.\d+\.id: /);
    expect(issues.length).toBeLessThanOrEqual(10);
  });

  it("loads a world file", async () => {
    stubDataFetch();
    const objects = await loadWorldFile("kavkazi", "objects", "25937608");
    expect(objects.world).toBe("Kavkazi");
    expect(objects.objects).toHaveLength(5);
  });

  it("loads a raw file without validation", async () => {
    stubDataFetch({ fixtures: { "25937608/weapons.json": { anything: true } } });
    await expect(loadRaw("weapons", "25937608")).resolves.toEqual({ anything: true });
  });
});
