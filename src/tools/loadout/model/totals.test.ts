import { describe, expect, it } from "vitest";
import { catalog, equipmentFile } from "../fixtures/testData";
import { emptyLoadout, setGearQuantity, setSlotItem, type Loadout } from "./loadout";
import { armorEffects, costSummary, unlockSummary, weightClassFor, weightSummary } from "./totals";

function build(budget: number, slots: Partial<Record<keyof Loadout["slots"], string>>, gear: [string, number][] = []) {
  let loadout = emptyLoadout(budget);
  for (const [slot, itemId] of Object.entries(slots)) {
    loadout = setSlotItem(loadout, slot as keyof Loadout["slots"], itemId);
  }
  for (const [itemId, quantity] of gear) {
    loadout = setGearQuantity(loadout, itemId, quantity);
  }
  return loadout;
}

describe("costSummary", () => {
  it("adds slot prices and gear quantities", () => {
    const loadout = build(10_000, { primary: "Id.Item.M4", armor: "Id.Item.HeavyArmor" }, [["Id.Item.Bandage", 2]]);
    const summary = costSummary(loadout, catalog);
    expect(summary.total).toBe(2800 + 2500 + 400);
    expect(summary.remaining).toBe(10_000 - 5700);
    expect(summary.overBudgetBy).toBe(0);
    expect(summary.sections).toEqual([
      { id: "weapons", label: "Weapons", total: 2800 },
      { id: "armor", label: "Armor", total: 2500 },
      { id: "gear", label: "Gear", total: 400 },
    ]);
    expect(summary.lines.find((line) => line.key === "gear:Id.Item.Bandage")).toMatchObject({
      unitPrice: 200,
      quantity: 2,
      total: 400,
    });
  });

  it("counts an item that is not sold as $0 and flags it", () => {
    const summary = costSummary(build(1000, { primary: "Id.Item.AK74M" }), catalog);
    expect(summary.total).toBe(0);
    expect(summary.notSold.map((line) => line.item.name)).toEqual(["AK74"]);
  });

  it("counts the same weapon twice in primary and secondary", () => {
    const summary = costSummary(build(1000, { primary: "Id.Item.M4", secondary: "Id.Item.M4" }), catalog);
    expect(summary.total).toBe(5600);
    expect(summary.overBudgetBy).toBe(4600);
    expect(summary.remaining).toBe(-4600);
  });
});

describe("weightClassFor", () => {
  it("picks the highest class whose minimum is reached", () => {
    expect(weightClassFor(17, equipmentFile.weightClasses)?.name).toBe("Medium");
    expect(weightClassFor(16.99, equipmentFile.weightClasses)?.name).toBe("Light");
    expect(weightClassFor(0, equipmentFile.weightClasses)?.name).toBe("Lightest");
    expect(weightClassFor(55, equipmentFile.weightClasses)?.name).toBe("SuperHeavy");
  });
});

describe("weightSummary", () => {
  it("sums weights, finds the class and the distance to the next one", () => {
    const loadout = build(0, { primary: "Id.Item.M4", armor: "Id.Item.HeavyArmor" }, [["Id.Item.Bandage", 2]]);
    const summary = weightSummary(loadout, catalog, equipmentFile);
    expect(summary.totalKg).toBe(2.92 + 10.5 + 0.16);
    expect(summary.weightClass?.name).toBe("Light");
    expect(summary.nextClass?.name).toBe("Medium");
    expect(summary.kgToNext).toBeCloseTo(17 - 13.58, 6);
    const topSpeed = summary.effects.find((effect) => effect.info.label === "Top speed");
    expect(topSpeed?.result.value).toBe(0.95);
    expect(summary.effects.find((effect) => effect.info.label === "Weight penalty")?.result.value).toBe(1);
  });

  it("has no next class at the heaviest class", () => {
    const loadout = build(0, {
      primary: "Id.Item.SV98",
      secondary: "Id.Item.SV98",
      armor: "Id.Item.SuperHeavyArmor",
      helmet: "Id.Item.SuperHeavyHelmet",
      specialist: "ID.Item.BuildTool.Hammer.Large",
    });
    const summary = weightSummary(loadout, catalog, equipmentFile);
    expect(summary.weightClass?.name).toBe("Heavy");
    const heavier = weightSummary(
      setGearQuantity(setSlotItem(loadout, "vest", "Id.Item.MediumTacVest"), "Id.Item.Bandage", 20),
      catalog,
      equipmentFile,
    );
    expect(heavier.weightClass?.name).toBe("SuperHeavy");
    expect(heavier.nextClass).toBeNull();
    expect(heavier.kgToNext).toBeNull();
  });

  it("lists items with unknown weight and counts them as 0", () => {
    const loadout = build(0, { helmet: "Id.Item.LightHelmet", armor: "Id.Item.LightArmor" });
    const summary = weightSummary(loadout, catalog, equipmentFile);
    expect(summary.totalKg).toBe(3);
    expect(summary.unknownWeight.map((item) => item.name)).toEqual(["Level 1 Helmet"]);
  });
});

describe("armorEffects", () => {
  it("lists the helmet's modifiers and skips armor without any", () => {
    const loadout = build(0, { armor: "Id.Item.HeavyArmor", helmet: "Id.Item.HeavyHelmet" });
    const effects = armorEffects(loadout, catalog, equipmentFile);
    expect(effects).toHaveLength(1);
    expect(effects[0]?.source).toBe("Level 3 Helmet");
    expect(effects[0]?.effects[0]?.info.label).toBe("Suppression taken");
    expect(effects[0]?.effects[0]?.result.value).toBeCloseTo(0.32, 9);
  });
});

describe("unlockSummary", () => {
  it("groups gated items by role with the highest level per role", () => {
    const loadout = build(
      0,
      {
        primary: "Id.Item.M4",
        secondary: "Id.Item.M4",
        armor: "Id.Item.HeavyArmor",
        helmet: "Id.Item.LightHelmet",
        backpack: "Id.Item.SmallBackpack",
        sidearm: "Id.Item.AK74M",
      },
      [["Id.Item.StimPen", 1]],
    );
    const summary = unlockSummary(loadout, catalog);
    expect(summary.rows.map((row) => row.item.name)).toEqual(["M4", "Level 3 Armor", "Level 1 Helmet", "Stim Pen"]);
    expect(summary.totalCost).toBe(150_000 + 100_000 + 7_500 + 25_000);
    expect(
      summary.roles.map((group) => [group.roleLabel, group.highestLevel, group.rows.map((row) => row.item.name)]),
    ).toEqual([
      ["Assault", 28, ["M4"]],
      ["Medic", 16, ["Stim Pen"]],
      ["Wardog", 70, ["Level 3 Armor", "Level 1 Helmet"]],
    ]);
    expect(summary.roles[0]?.xpRequired).toEqual(expect.any(Number));
    expect(summary.roles[2]?.xpRequired).toBeNull();
  });
});
