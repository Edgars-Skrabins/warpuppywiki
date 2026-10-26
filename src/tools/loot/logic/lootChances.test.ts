import { describe, expect, it } from "vitest";
import { entryChances, extraText, formatChance } from "./lootChances";
import { fixtureTable } from "./testTables";

describe("entryChances", () => {
  it("gives equal weights equal entry chances", () => {
    expect(entryChances(fixtureTable("AbandonedTower")).map((entry) => entry.entryChance)).toEqual([
      0.25, 0.25, 0.25, 0.25,
    ]);
  });

  it("divides each weight by the sum of weights", () => {
    const table = fixtureTable("AbandonedTower");
    const weighted = {
      ...table,
      items: table.items.map((entry, index) => ({ ...entry, weight: index === 0 ? 3 : 1 })),
    };
    expect(entryChances(weighted).map((entry) => entry.entryChance)).toEqual([0.5, 1 / 6, 1 / 6, 1 / 6]);
  });

  it("treats negative or invalid weights as zero and clamps chances", () => {
    const table = fixtureTable("Bow");
    const odd = {
      ...table,
      spawnChance: 150,
      items: [
        { ...table.items[0]!, weight: -1, subItems: [{ item: "Id.Item.Arrow", amount: 1, chance: 250 }] },
        { ...table.items[0]!, weight: Number.NaN },
      ],
    };
    expect(entryChances(odd).map((entry) => [entry.entryChance, entry.overallChance, entry.extras[0]?.chance])).toEqual(
      [
        [0, 0, 1],
        [0, 0, 1],
      ],
    );
  });

  it("includes the table's spawn chance in the overall chance", () => {
    expect(entryChances(fixtureTable("AbandonedTower")).map((entry) => entry.overallChance)).toEqual([
      0.125, 0.125, 0.125, 0.125,
    ]);
    expect(entryChances(fixtureTable("Bow"))[0]?.overallChance).toBe(1);
  });

  it("turns extra chances into fractions", () => {
    expect(entryChances(fixtureTable("Bow"))[0]?.extras).toEqual([{ item: "Id.Item.Arrow", amount: 10, chance: 1 }]);
  });
});

describe("extraText", () => {
  it("reads always for extras at 100%", () => {
    expect(extraText({ item: "Id.Item.M67Grenade", amount: 2, chance: 1 }, "M67 Frag Grenade")).toBe(
      "2 × M67 Frag Grenade, always",
    );
  });

  it("shows the chance for extras below 100%", () => {
    expect(extraText({ item: "Id.Item.StimPen", amount: 1, chance: 0.25 }, "Stim Pen")).toBe("1 × Stim Pen, 25%");
  });
});

describe("formatChance", () => {
  it("shows one decimal under 10% and none above", () => {
    expect(formatChance(0.0125)).toBe("1.3%");
    expect(formatChance(0.125)).toBe("13%");
    expect(formatChance(0.5)).toBe("50%");
    expect(formatChance(0.05)).toBe("5%");
  });
});
