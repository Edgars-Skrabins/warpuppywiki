import { describe, expect, it } from "vitest";
import { fixtureCatalog, fixtureEquipment } from "../fixtures/testData";
import { armorRows } from "./armorRows";

const body = armorRows(fixtureEquipment.armor, fixtureCatalog, "body");
const helmets = armorRows(fixtureEquipment.armor, fixtureCatalog, "helmet");

function row(rows: typeof body, name: string) {
  const found = rows.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No row ${name}`);
  return found;
}

describe("armorRows", () => {
  it("describes Level 3 armor", () => {
    const level3 = row(body, "Level 3 Armor");
    expect(level3.zones).toHaveLength(3);
    expect(level3.zones).toEqual(expect.arrayContaining(["Torso.Upper", "Torso.Middle", "Torso.Lower"]));
    expect(level3.durability).toBe(250);
    expect(level3.reduction).toBe(0.5);
    expect(level3.level).toBe("Heavy");
    expect(level3.weight).toBe(10.5);
    expect(level3.price?.price).toBe(2500);
    expect(level3.unlock?.level).toBe(70);
    expect(level3.sideEffects).toEqual([]);
  });

  it("labels multi-word levels", () => {
    expect(row(body, "Level 4 Armor").level).toBe("Super heavy");
  });

  it("lists the Ghillie suit's side effects and no protection", () => {
    const ghillie = row(body, "Ghillie Suit");
    expect(ghillie.sideEffects).toEqual([
      "ADS time ×0.8",
      "Aim sway ×1.15",
      "Lean time ×1.15",
      "Unlean time ×1.15",
      "Top speed ×0.95",
      "Jump ×0.95",
    ]);
    expect(ghillie.zones).toEqual([]);
    expect(ghillie.durability).toBeNull();
    expect(ghillie.reduction).toBeNull();
  });

  it("keeps body armor and helmets on separate tabs", () => {
    expect(body.map((entry) => entry.name)).toEqual([
      "Ghillie Suit",
      "Level 1 Armor",
      "Level 2 Armor",
      "Level 3 Armor",
      "Level 4 Armor",
    ]);
    expect(helmets.map((entry) => entry.name)).toEqual([
      "Level 1 Helmet",
      "Level 2 Helmet",
      "Level 3 Helmet",
      "Level 4 Helmet",
      "Pilot Helmet",
      "Tank Helmet",
    ]);
    expect(helmets.every((entry) => entry.kind === "helmet")).toBe(true);
  });

  it("describes helmet coverage and side effects", () => {
    expect(row(helmets, "Level 3 Helmet").zones).toEqual(["Head", "Neck"]);
    expect(row(helmets, "Level 3 Helmet").sideEffects).toEqual(["Suppression taken ×0.32"]);
    expect(row(helmets, "Tank Helmet").sideEffects).toEqual(["Suppression taken set to 0"]);
    expect(row(helmets, "Level 1 Helmet").weight).toBeNull();
  });

  it("lists only player items", () => {
    const notSold = { ...fixtureEquipment.armor[0]!, id: "Id.Item.NoSuchArmor" };
    expect(armorRows([notSold], fixtureCatalog, "body")).toEqual([]);
  });
});
