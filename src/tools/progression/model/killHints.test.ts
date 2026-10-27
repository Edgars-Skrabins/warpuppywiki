import { describe, expect, it } from "vitest";
import { ChallengeRewardsFile } from "@/core/data/schemas/challengeRewards";
import challengeRewardsJson from "../fixtures/challenge-rewards.json";
import { killHints } from "./killHints";

const file = ChallengeRewardsFile.parse(challengeRewardsJson);

describe("killHints", () => {
  it("reads the base cash and role XP of a player kill", () => {
    expect(killHints(file)).toEqual({ cash: 300, xp: 250 });
  });

  it("returns null when the reward or one of its resources is missing", () => {
    expect(killHints({ ...file, rewards: [] })).toBeNull();
    const reward = file.rewards[0];
    if (reward === undefined) {
      throw new Error("No reward in fixture");
    }
    const cashOnly = { ...reward, resources: reward.resources.filter((entry) => entry.resource === "Currency.Cash") };
    expect(killHints({ ...file, rewards: [cashOnly] })).toBeNull();
  });
});
