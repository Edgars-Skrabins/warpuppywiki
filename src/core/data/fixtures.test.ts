import { describe, expect, it } from "vitest";
import { schemaForPath } from "./files";
import { formatIssues } from "./loadDataFile";

const PREFIX = "/src/test/fixtures/data/";

const fixtures = Object.entries(
  import.meta.glob("/src/test/fixtures/data/**/*.json", { eager: true, import: "default" }),
).map(([file, value]) => [file.slice(PREFIX.length), value] as const);

describe("shared data fixtures", () => {
  it("include the files later specs rely on", () => {
    expect(fixtures.map(([path]) => path).sort()).toEqual([
      "25677108/weapons.json",
      "25937608/ammo.json",
      "25937608/attachments.json",
      "25937608/damage.json",
      "25937608/equipment.json",
      "25937608/items.json",
      "25937608/maps/kavkazi/buildings.json",
      "25937608/maps/kavkazi/map.json",
      "25937608/maps/kavkazi/objectives.json",
      "25937608/maps/kavkazi/objects.json",
      "25937608/maps/kavkazi/terrain.json",
      "25937608/roles.json",
      "25937608/tags.json",
      "25937608/weapons.json",
      "builds.json",
    ]);
  });

  it.each(fixtures)("%s matches its schema", (path, value) => {
    const schema = schemaForPath(path);
    expect(schema).toBeDefined();
    const result = schema?.safeParse(value);
    expect(result?.success ? [] : result && formatIssues(result.error)).toEqual([]);
  });
});
