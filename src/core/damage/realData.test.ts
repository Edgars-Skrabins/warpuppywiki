import { describe, expect, it } from "vitest";
import { buildCatalog, tagMatches } from "@/core/catalog";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { DamageFile } from "@/core/data/schemas/damage";
import { EquipmentFile } from "@/core/data/schemas/equipment";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildWeaponIndex } from "@/core/weapons";
import { simulateKill } from "./simulate";
import type { Target } from "./types";

const files: Record<string, unknown> = import.meta.glob(
  [
    "/public/data/builds.json",
    "/public/data/*/items.json",
    "/public/data/*/tags.json",
    "/public/data/*/roles.json",
    "/public/data/*/weapons.json",
    "/public/data/*/ammo.json",
    "/public/data/*/attachments.json",
    "/public/data/*/damage.json",
    "/public/data/*/equipment.json",
  ],
  { eager: true, import: "default" },
);

const builds = files["/public/data/builds.json"] as { latest: string } | undefined;

function dataFile(file: string): unknown {
  return files[`/public/data/${builds?.latest ?? ""}/${file}`];
}

describe.skipIf(!builds)("damage model against real data", () => {
  it("kills with 1 to 30 upper chest shots at 50 m for every player bullet weapon with FMJ", () => {
    const index = buildWeaponIndex({
      weapons: WeaponsFile.parse(dataFile("weapons.json")),
      ammo: AmmoFile.parse(dataFile("ammo.json")),
      attachments: AttachmentsFile.parse(dataFile("attachments.json")),
      catalog: buildCatalog({
        items: ItemsFile.parse(dataFile("items.json")),
        tags: TagsFile.parse(dataFile("tags.json")),
        roles: RolesFile.parse(dataFile("roles.json")),
      }),
    });
    const damage = DamageFile.parse(dataFile("damage.json"));
    const equipment = EquipmentFile.parse(dataFile("equipment.json"));
    const heavyArmor = equipment.armor.find((armor) => armor.id === "Id.Item.HeavyArmor");
    expect(heavyArmor).toBeDefined();
    const targets: Record<string, Target> = {
      "no armor": { health: 100, body: null, helmet: null, extras: [] },
      "Level 3": {
        health: 100,
        body: heavyArmor ? { armor: heavyArmor, durability: heavyArmor.durability ?? 0 } : null,
        helmet: null,
        extras: [],
      },
    };
    const lines: string[] = [];
    const withoutFmj: string[] = [];
    for (const weapon of index.playerWeapons) {
      const options = index.ammoOptions(weapon);
      const bullets = options.filter(
        (option) =>
          option.projectile?.damageType &&
          tagMatches(option.projectile.damageType, "Meta.Damage.Bullet") &&
          !option.projectile.explosive,
      );
      if (bullets.length === 0) {
        continue;
      }
      const fmj = bullets.find((option) => option.ammoType === "FMJ");
      if (!fmj) {
        withoutFmj.push(`${weapon.name} (${bullets.map((option) => option.ammoType).join(", ")})`);
        continue;
      }
      const stks = Object.entries(targets).map(([label, target]) => {
        const result = simulateKill({ damage, weapon, ammo: fmj, distance: 50, pattern: ["Torso.Upper"], target });
        expect(result.supported, `${weapon.name} vs ${label}`).toBe(true);
        const stk = result.supported ? result.stk : null;
        expect(stk, `${weapon.name} vs ${label}`).not.toBeNull();
        expect(stk ?? 0, `${weapon.name} vs ${label}`).toBeGreaterThanOrEqual(1);
        expect(stk ?? 99, `${weapon.name} vs ${label}`).toBeLessThanOrEqual(30);
        return `${label} ${String(stk)}`;
      });
      lines.push(`${weapon.name}: ${stks.join(", ")}`);
    }
    console.info(`STK at 50 m, upper chest, FMJ:\n${lines.join("\n")}`);
    if (withoutFmj.length > 0) {
      console.info(`Bullet weapons without FMJ ammo (not checked):\n${withoutFmj.join("\n")}`);
    }
    expect(lines.length).toBeGreaterThan(0);
  });
});
