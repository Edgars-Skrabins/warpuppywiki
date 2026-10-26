import { describe, expect, it } from "vitest";
import type { SkillsFile } from "@/core/data";
import fixture from "../fixtures/skills.json";
import { skillEffects } from "./skillEffects";
import { triggerLabel } from "./triggerLabels";

const file = fixture as SkillsFile;
const skill = (id: string) => file.skills.find((entry) => entry.id === id)!;

describe("skillEffects", () => {
  it("labels the mounted gun ADS effect and gives the change from level 0", () => {
    const [row] = skillEffects(skill("Driver.AimDownSightSpeed.MountedGun"));
    expect(row?.label).toBe("ADS time");
    expect(row?.trigger).toBe("On your items");
    expect(row?.betterWhen).toBe("lower");
    const level4 = row?.levels.find((entry) => entry.level === 4);
    expect(level4?.value).toBe(0.6);
    expect(level4?.change).toBeCloseTo(-0.4);
    expect(row?.levels.map((entry) => entry.level)).toEqual([0, 2, 3, 4]);
    expect(row?.levels[0]?.change).toBe(0);
  });

  it("returns one row per effect", () => {
    expect(skillEffects(skill("Infantry.UnarmedSprintSpeed"))).toHaveLength(2);
    expect(skillEffects(skill("Driver.AutoRepair"))).toEqual([]);
  });

  it("falls back to the effect name when there is no attribute", () => {
    const [row] = skillEffects(skill("Infantry.SprintBreach"));
    expect(row?.label).toBe("GE_GrantSkill_DoorBreach");
    expect(row?.levels).toEqual([]);
  });

  it("uses a readable label for attributes outside the attribute table", () => {
    const [row] = skillEffects(skill("Driver.FuelUsageReduction"));
    expect(row?.label).toBe("Fuel usage reduction multiplier");
    expect(row?.unit).toBe("multiplier");
    expect(row?.trigger).toBe("Vehicle");
  });
});

describe("triggerLabel", () => {
  it("describes known triggers in plain words, case-insensitively", () => {
    expect(triggerLabel("Character")).toBe("Always");
    expect(triggerLabel("character.helditemupdated")).toBe("When you switch items");
    expect(triggerLabel("Item")).toBe("On your items");
  });

  it("shows other triggers raw", () => {
    expect(triggerLabel("Revive.Target")).toBe("Revive.Target");
  });
});
