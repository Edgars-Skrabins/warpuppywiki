import { describe, expect, it } from "vitest";
import type { ChallengeReward } from "@/core/data";
import fixture from "../fixtures/challenge-rewards.json";
import { inputLabel, resourceLabel, situationFields, tagLabel, toGameUnits } from "./contextTags";

const playerKill = fixture.rewards[0] as ChallengeReward;

describe("tagLabel", () => {
  it.each([
    ["Challenges.Context.Instigator.InHotZone", "Instigator in hot zone"],
    ["Challenges.Context.Target.InControlZone", "Target in control zone"],
    ["Challenges.Context.Headshot", "Headshot"],
    ["Challenges.Context.FriendlyKill", "Friendly kill"],
    ["Challenges.Context.PrecisionArtilleryStrikeKill", "Precision artillery strike kill"],
    ["Id.Item.IED.Explosive", "Id item IED explosive"],
    ["Buildables.SV_Shelter", "Buildables SV shelter"],
  ])("labels %s as %s", (tag, label) => {
    expect(tagLabel(tag)).toBe(label);
  });
});

describe("inputLabel", () => {
  it("labels game and scaling inputs, with meters for distances", () => {
    expect(inputLabel("KillStreak")).toBe("Kill streak");
    expect(inputLabel("LastVictimCount")).toBe("Last victim count");
    expect(inputLabel("DistanceToTarget")).toBe("Distance to target (m)");
  });

  it("converts distances from meters to centimeters only", () => {
    expect(toGameUnits("DistanceToTarget", 350)).toBe(35_000);
    expect(toGameUnits("KillStreak", 3)).toBe(3);
  });
});

describe("situationFields", () => {
  it("collects the PlayerKill tags, game inputs and scaling inputs once each", () => {
    const fields = situationFields(playerKill);
    expect(fields.tags.map((field) => field.label)).toEqual(
      expect.arrayContaining(["Headshot", "Instigator in hot zone", "Target in control zone", "Friendly kill"]),
    );
    expect(new Set(fields.tags.map((field) => field.tag.toLowerCase())).size).toBe(fields.tags.length);
    expect(fields.game).toEqual([
      { name: "LastVictimCount", label: "Last victim count", defaultValue: 0 },
      { name: "KillStreak", label: "Kill streak", defaultValue: 0 },
      { name: "CrewCount", label: "Crew count", defaultValue: 1 },
    ]);
    expect(fields.scaling).toEqual([{ name: "DistanceToTarget", label: "Distance to target (m)", defaultValue: 0 }]);
  });
});

describe("resourceLabel", () => {
  it.each([
    ["Currency.Cash", "Cash"],
    ["XP.Role", "Role XP"],
    ["XP.Role.Medic", "Medic XP"],
    ["Challenges.Rewards.TeamOffence.Punish.Kill", "Challenges rewards team offence punish kill"],
  ])("labels %s as %s", (resource, label) => {
    expect(resourceLabel(resource)).toBe(label);
  });
});
