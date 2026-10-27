import { describe, expect, it } from "vitest";
import oldWeapons from "@/test/fixtures/data/25677108/weapons.json";
import newItems from "@/test/fixtures/data/25937608/items.json";
import newWeapons from "@/test/fixtures/data/25937608/weapons.json";
import addedWeapon from "../fixtures/addedWeapon.json";
import removedWeapon from "../fixtures/removedWeapon.json";
import { categoryById, type CategoryDefinition } from "./categories";
import { diffCategory } from "./diffCategory";

const weapons = categoryById("weapons") as CategoryDefinition;

const from = { weapons: { ...oldWeapons, weapons: [...oldWeapons.weapons, removedWeapon] } };
const to = { weapons: { ...newWeapons, weapons: [...newWeapons.weapons, addedWeapon] }, items: newItems };

describe("diffCategory", () => {
  const diff = diffCategory(weapons, from, to, { showAssets: false });

  it("reports the AK74's suppression multiplier change", () => {
    const ak = diff.entities.find((entity) => entity.key === "weapon:id.item.ak74m");
    expect(ak?.status).toBe("changed");
    expect(ak?.name).toBe("AK74");
    expect(ak?.changes).toContainEqual({ path: "suppressionMultiplier", kind: "added", after: 1.05 });
  });

  it("detects an added and a removed weapon", () => {
    expect(diff.entities.find((entity) => entity.name === "PP-19 Bizon")?.status).toBe("added");
    expect(diff.entities.find((entity) => entity.key === "weapon:id.item.judge")?.status).toBe("removed");
    expect(diff.counts.added).toBe(1);
    expect(diff.counts.removed).toBe(1);
  });

  it("lists entities sorted by name with no changes for added and removed ones", () => {
    const names = diff.entities.map((entity) => entity.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(diff.entities.filter((entity) => entity.status !== "changed").every((e) => e.changes.length === 0)).toBe(
      true,
    );
  });

  it("hides asset path changes unless asked", () => {
    const moved = { weapons: from.weapons.weapons.map((weapon) => ({ ...weapon, asset: `${weapon.asset}/moved` })) };
    const same = { weapons: { ...oldWeapons, weapons: from.weapons.weapons } };
    const withMoved = { weapons: { ...oldWeapons, ...moved } };
    expect(diffCategory(weapons, same, withMoved, { showAssets: false }).entities).toEqual([]);
    const shown = diffCategory(weapons, same, withMoved, { showAssets: true });
    expect(shown.counts.changed).toBe(from.weapons.weapons.length);
    expect(shown.entities[0]?.changes.map((change) => change.path)).toEqual(["asset"]);
  });
});
