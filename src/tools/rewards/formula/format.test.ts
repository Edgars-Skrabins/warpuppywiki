import { describe, expect, it } from "vitest";
import { formatFormula, formatInline } from "./format";
import { parse } from "./parse";

const PLAYER_KILL_CASH =
  "(1 - (clamp(LastVictimCount, 0, LastVictimCountMax) * LastVictimReductionModifier)) * ((((BaseReward + (clamp(KillStreak - 1, 0, KillStreakMax) * KillStreakValue)) * InstigatorZoneModifier * InstigatorWeight) + ((BaseReward + (clamp(KillStreak - 1, 0, KillStreakMax) * KillStreakValue)) * TargetZoneModifier * TargetWeight)) * DistanceToTarget * RevengeModifier * KillStreakStoppedModifier) * FriendlyModifier * pow(CrewPenaltyModifier, clamp(CrewCount - 1, 0, CrewCountMax))";

describe("formatFormula", () => {
  it("breaks the PlayerKill cash formula at its top-level multiplications", () => {
    expect(formatFormula(parse(PLAYER_KILL_CASH))).toBe(
      [
        "(1 - clamp(LastVictimCount, 0, LastVictimCountMax) * LastVictimReductionModifier)",
        "* (((BaseReward + clamp(KillStreak - 1, 0, KillStreakMax) * KillStreakValue) * InstigatorZoneModifier * InstigatorWeight + (BaseReward + clamp(KillStreak - 1, 0, KillStreakMax) * KillStreakValue) * TargetZoneModifier * TargetWeight) * DistanceToTarget * RevengeModifier * KillStreakStoppedModifier)",
        "* FriendlyModifier",
        "* pow(CrewPenaltyModifier, clamp(CrewCount - 1, 0, CrewCountMax))",
      ].join("\n"),
    );
  });

  it("breaks at top-level additions", () => {
    expect(formatFormula(parse("A * B + C - (D + E)"))).toBe(["A * B", "+ C", "- (D + E)"].join("\n"));
  });

  it("keeps a formula without a top-level operator on one line", () => {
    expect(formatFormula(parse("(BaseReward)"))).toBe("BaseReward");
  });

  it("keeps grouping that changes the result", () => {
    expect(formatInline(parse("A - (B - C)"))).toBe("A - (B - C)");
    expect(formatInline(parse("A / (B * C)"))).toBe("A / (B * C)");
    expect(formatInline(parse("-(A + B)"))).toBe("-(A + B)");
  });

  it("formats to text that parses back to the same tree", () => {
    const tree = parse(PLAYER_KILL_CASH);
    expect(parse(formatFormula(tree).replaceAll("\n", " "))).toEqual(tree);
  });
});
