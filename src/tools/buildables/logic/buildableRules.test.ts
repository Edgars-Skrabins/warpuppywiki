import { describe, expect, it } from "vitest";
import { fixtureRules } from "../fixtures/testData";
import { buildableRules, entityLabel, sourceLabel } from "./buildableRules";

describe("sourceLabel", () => {
  it("reads single and combined source tags", () => {
    expect(sourceLabel(["Bullet"])).toBe("Bullets");
    expect(sourceLabel(["AmmoModifier.ArmorPiercing", "Bullet"])).toBe("Armor-piercing bullets");
    expect(sourceLabel(["Bullet", "AmmoModifier.HollowPoint"])).toBe("Hollow-point bullets");
    expect(sourceLabel(["Explosive.Rocket.120mm"])).toBe("120 mm rockets");
    expect(sourceLabel(["Cannon.35x228mm"])).toBe("35x228 mm cannon");
    expect(sourceLabel(["Explosive.Rocket", "Explosive.Radius.Inner"])).toBe("Rockets (direct hit)");
    expect(sourceLabel(["Vehicle.Land.Tracked"])).toBe("Tracked vehicles");
  });

  it("splits unknown tags into words", () => {
    expect(sourceLabel(["Kinetic.Impact.Ricochet"])).toBe("Kinetic impact ricochet");
  });
});

describe("entityLabel", () => {
  it("drops the Buildable prefix", () => {
    expect(entityLabel("Buildable.AirRaidShelter")).toBe("Air raid shelter");
    expect(entityLabel("Vehicle.Stationary.Mortar")).toBe("Vehicle stationary mortar");
  });
});

describe("buildableRules", () => {
  it("lists only the entity's rules, percentages by effect and flat rules last", () => {
    const rows = buildableRules(fixtureRules, "buildable.sandbagwall");

    expect(rows).toHaveLength(18);
    expect(rows[0]).toMatchObject({ source: "Rockets", amount: 650, kind: "percent" });
    expect(rows[1]).toMatchObject({ source: "IEDs", amount: 500 });
    expect(rows.at(-2)).toMatchObject({ source: "Thrown objects", amount: -100 });
    expect(rows.at(-1)).toMatchObject({ source: "Tracked vehicles", amount: 1000, kind: "flat" });
  });

  it("has no rules without a damage entity", () => {
    expect(buildableRules(fixtureRules, null)).toEqual([]);
  });
});
