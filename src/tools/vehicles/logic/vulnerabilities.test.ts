import { describe, expect, it } from "vitest";
import type { DamageRule } from "@/core/data";
import { fixtureDamage, fixtureVehicle } from "../fixtures/testData";
import { partLabel, sourceLabel, SPECIAL_RULE, vulnerabilities, WHOLE_VEHICLE } from "./vulnerabilities";

const humvee = fixtureVehicle("Humvee");

function rowText(row: { source: string; part: string; amount: number }): string {
  return `${row.source} · ${row.part} · ${row.amount}`;
}

describe("sourceLabel", () => {
  it("labels single tags, calibers and joined tags", () => {
    expect(sourceLabel(["Bullet"])).toBe("Bullets");
    expect(sourceLabel(["Explosive.Rocket.84mm"])).toBe("84 mm rockets");
    expect(sourceLabel(["Cannon.30mm"])).toBe("30 mm cannon");
    expect(sourceLabel(["Explosive.Grenade.40mm"])).toBe("40 mm grenades");
    expect(sourceLabel(["Bullet", "AmmoModifier.ArmorPiercing"])).toBe("Armor-piercing bullets");
    expect(sourceLabel(["Explosive.Rocket", "Explosive.Radius.Inner"])).toBe("Rockets (direct hit)");
    expect(sourceLabel(["explosive.utility.atmine"])).toBe("AT mines");
    expect(sourceLabel(["Explosive.Grenade.40mm", "Explosive.Rocket"])).toBe("40 mm grenades and rockets");
  });

  it("falls back to the tag with dots replaced by spaces", () => {
    expect(sourceLabel(["DamageType.Melee"])).toBe("DamageType Melee");
  });
});

describe("partLabel", () => {
  it("labels parts and groups wheels on both sides", () => {
    expect(partLabel([])).toBe(WHOLE_VEHICLE);
    expect(partLabel(["Vehicle.FuelTank"])).toBe("Fuel tank");
    expect(partLabel(["Vehicle.Wheel.Left.Front", "Vehicle.Wheel.Right.Front"])).toBe("Front wheels");
    expect(
      partLabel([
        "Vehicle.Wheel.Left.Front",
        "Vehicle.Wheel.Left.Rear",
        "Vehicle.Wheel.Right.Front",
        "Vehicle.Wheel.Right.Rear",
      ]),
    ).toBe("Front wheels, Rear wheels");
    expect(partLabel(["Vehicle.Wheel.Left.Rear"])).toBe("Left rear wheel");
    expect(partLabel(["Vehicle.Tracks.Left", "Vehicle.Tracks.Right"])).toBe("Tracks");
    expect(partLabel(["Vehicle.MainRotor", "Vehicle.TailRotor"])).toBe("Main rotor, Tail rotor");
  });
});

describe("vulnerabilities", () => {
  const rows = vulnerabilities(fixtureDamage.rules, humvee.damageEntity);
  const texts = rows.map(rowText);

  it("lists the Humvee's rules and the generic vehicle rules as readable rows", () => {
    expect(texts).toContain("Bullets · Whole vehicle · -95");
    expect(texts).toContain("Bullets · Fuel tank · 400");
    expect(texts).toContain("Rockets (direct hit) · Whole vehicle · 200");
    expect(texts).toContain("Hollow-point · Whole vehicle · -40");
    expect(rows.every((row) => row.kind === "percent")).toBe(true);
  });

  it("only includes rules of the vehicle's entity and the generic entity", () => {
    const entities = fixtureDamage.rules.filter((rule) => rule.entity.startsWith("Vehicle")).length;
    expect(rows).toHaveLength(entities);
    expect(fixtureDamage.rules.length).toBeGreaterThan(entities);
  });

  it("sorts by effect, highest first", () => {
    const amounts = rows.map((row) => row.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    expect(rows[0]?.amount).toBe(500);
  });

  it("marks custom rules as special and lists them last", () => {
    const custom: DamageRule = {
      entity: "Vehicle",
      source: ["Bullet"],
      target: [],
      instigator: [],
      hitLocations: [],
      category: "Bone",
      operation: "Percentage_Ongoing",
      amount: 900,
      custom: "B_BoneDamageModifiers_C",
    };
    const withCustom = vulnerabilities([...fixtureDamage.rules, custom], humvee.damageEntity);
    expect(withCustom.at(-1)).toMatchObject({ special: true, amount: 900 });
    expect(withCustom.filter((row) => row.special)).toHaveLength(1);
    expect(SPECIAL_RULE).toBe("Special rule (not shown as a number)");
  });
});
