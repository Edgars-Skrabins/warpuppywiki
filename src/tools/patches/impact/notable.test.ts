import { describe, expect, it } from "vitest";
import type { CategoryDiff, EntityDiff } from "../diff/types";
import { notableChanges } from "./notable";

function category(id: string, label: string, entities: EntityDiff[]): CategoryDiff {
  return { id, label, entities, counts: { added: 0, removed: 0, changed: 0 }, notes: [] };
}

const weapons = category("weapons", "Weapons", [
  { key: "weapon:id.item.wepn_034", name: "M14", status: "added", changes: [] },
  { key: "weapon:id.item.wepn_031", name: "PP-19 Bizon", status: "added", changes: [] },
  {
    key: "weapon:id.item.m4",
    name: "M4",
    status: "changed",
    changes: [
      { path: "rpm", kind: "changed", before: 800, after: 850 },
      { path: "fireModes[]", kind: "added", after: "Burst" },
      { path: "vendor[Id.Item.M4].price", kind: "changed", before: 3000, after: 2500 },
    ],
  },
]);

const ammo = category("ammo", "Ammunition", [
  {
    key: "projectile:item.caliber.556",
    name: "5.56mm",
    status: "changed",
    changes: [{ path: "damage", kind: "changed", before: 40, after: 36 }],
  },
]);

const damage = category("damage", "Damage rules", [
  {
    key: "rule:infantry|bone",
    name: "Infantry · Bone",
    status: "changed",
    changes: [{ path: "amount", kind: "changed", before: -75, after: -50 }],
  },
]);

describe("notableChanges", () => {
  it("orders lines by category with prices and unlocks last", () => {
    expect(notableChanges([damage, ammo, weapons]).map((line) => line.text)).toEqual([
      "2 new weapons: M14, PP-19 Bizon",
      "M4: RPM 800 → 850 (Buff)",
      "5.56mm: Damage 40 → 36 (Nerf)",
      "M4: Price $3,000 → $2,500 (Buff)",
    ]);
  });

  it("links lines to their detail view or filtered category", () => {
    const [added, rpm] = notableChanges([weapons]);
    expect(added).toMatchObject({ categoryId: "weapons", entityKey: null, filter: "added" });
    expect(rpm).toMatchObject({ categoryId: "weapons", entityKey: "weapon:id.item.m4", filter: null });
  });

  it("caps the list at 12 lines", () => {
    const many = category(
      "weapons",
      "Weapons",
      Array.from({ length: 20 }, (_, index) => ({
        key: `weapon:${index}`,
        name: `Gun ${index}`,
        status: "changed" as const,
        changes: [{ path: "rpm", kind: "changed" as const, before: 600, after: 700 }],
      })),
    );
    const lines = notableChanges([many]);
    expect(lines).toHaveLength(12);
    expect(lines[11]!.text).toBe("Gun 11: RPM 600 → 700 (Buff)");
  });
});
