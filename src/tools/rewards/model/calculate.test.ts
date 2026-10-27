import { describe, expect, it } from "vitest";
import type { ChallengeReward, RewardCurve } from "@/core/data";
import fixture from "../fixtures/challenge-rewards.json";
import { calculateReward } from "./calculate";
import { curveLookup } from "./curves";
import type { Situation } from "./types";

const playerKill = fixture.rewards[0] as ChallengeReward;
const curves = curveLookup(fixture.curves as RewardCurve[]);

const tag = (name: string) => `Challenges.Context.${name}`;

function situation(overrides: Partial<Situation> = {}): Situation {
  return { tags: [], game: { KillStreak: 1, CrewCount: 1 }, scaling: { DistanceToTarget: 0 }, ...overrides };
}

function cash(input: Situation) {
  const result = calculateReward(playerKill, input, curves).find((entry) => entry.resource === "Currency.Cash");
  if (!result) {
    throw new Error("No cash resource");
  }
  return result;
}

function working(input: Situation, name: string) {
  return cash(input).working.find((entry) => entry.name === name);
}

describe("calculateReward on PlayerKill cash", () => {
  it("pays 300 × (0.5 + 0.5) with nothing checked", () => {
    const result = cash(situation());
    expect(result.error).toBeNull();
    expect(result.amount).toBe(300);
    expect(working(situation(), "BaseReward")).toMatchObject({
      variable: "DefaultReward",
      reason: "default",
      kind: "literal",
      value: 300,
    });
  });

  it("uses the headshot base of 350", () => {
    const input = situation({ tags: [tag("Headshot")] });
    expect(cash(input).amount).toBe(350);
    expect(working(input, "BaseReward")).toMatchObject({ variable: "HeadshotReward", value: 350 });
  });

  it("multiplies the instigator half by 10 in the hot zone", () => {
    expect(cash(situation({ tags: [tag("Instigator.InHotZone")] })).amount).toBe(300 * 0.5 * 10 + 300 * 0.5);
  });

  it("adds 50 per kill after the first in a streak", () => {
    expect(cash(situation({ game: { KillStreak: 3, CrewCount: 1 } })).amount).toBe(300 + 2 * 50);
    expect(working(situation({ game: { KillStreak: 3 } }), "KillStreak")).toMatchObject({ kind: "game", value: 3 });
  });

  it("scales a sniper kill at 350 m by the distance curve", () => {
    const input = situation({ tags: [tag("SniperKill")], scaling: { DistanceToTarget: 350 } });
    expect(cash(input).amount).toBe(300 * 1.5);
    expect(working(input, "DistanceToTarget")).toMatchObject({
      variable: "DistanceFactor",
      kind: "curve",
      value: 1.5,
      curve: { input: "DistanceToTarget", inputValue: 350, gameInput: 35_000 },
    });
  });

  it("applies the crew penalty of 0.8 per extra crew member", () => {
    const input = situation({ tags: [tag("CrewAssistPenalty")], game: { CrewCount: 2 } });
    expect(cash(input).amount).toBeCloseTo(300 * 0.8);
    expect(working(input, "CrewCount")).toMatchObject({ variable: "CrewCount", value: 2 });
  });

  it("resolves the XP resource's own variables", () => {
    const xp = calculateReward(playerKill, situation({ tags: [tag("Headshot")] }), curves).find(
      (entry) => entry.resource === "XP.Role",
    );
    expect(xp?.amount).toBe(275);
    expect(xp?.working.find((entry) => entry.name === "BaseReward")).toMatchObject({
      variable: "HeadshotReward",
      reason: "Headshot is on and Friendly kill is off",
      value: 275,
    });
  });
});

describe("calculateReward errors", () => {
  const base = playerKill.resources[1]!;

  it("reports unknown names and still lists what resolved", () => {
    const reward = { id: "Test", resources: [{ ...base, formula: "BaseReward * Missing" }] };
    const [result] = calculateReward(reward, situation(), curves);
    expect(result?.amount).toBeNull();
    expect(result?.error).toBe('Unknown name "Missing"');
    expect(result?.working.find((entry) => entry.name === "BaseReward")?.value).toBe(250);
  });

  it("reports syntax errors and lists the inputs", () => {
    const reward = { id: "Test", resources: [{ ...base, formula: "BaseReward *" }] };
    const [result] = calculateReward(reward, situation(), curves);
    expect(result?.error).toBe("Unexpected end of formula at position 12");
    expect(result?.working.map((entry) => entry.name)).toContain("BaseReward");
  });

  it("reports a missing curve", () => {
    const reward = { id: "Test", resources: [{ ...base, formula: "BaseReward" }] };
    const [result] = calculateReward(reward, situation(), () => undefined);
    expect(result?.amount).toBe(250);
    const scaling = {
      ...playerKill.resources[0]!,
      formula: "DistanceToTarget",
    };
    const [missing] = calculateReward(
      { id: "Test", resources: [scaling] },
      situation({ tags: [tag("SniperKill")] }),
      () => undefined,
    );
    expect(missing?.error).toBe('Unknown curve "LiveCurves.Challenges.SessionEvents.PlayerKill.DistanceScalar"');
  });
});
