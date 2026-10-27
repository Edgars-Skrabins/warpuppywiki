import { sameId } from "@/core/catalog";
import type { ChallengeReward, ChallengeRewardsFile } from "@/core/data";

export interface KillHints {
  cash: number;
  xp: number;
}

function defaultReward(reward: ChallengeReward, resource: string): number | null {
  const variable = reward.resources
    .find((entry) => sameId(entry.resource, resource))
    ?.variables.find((entry) => entry.name === "DefaultReward");
  return variable?.type === "literal" ? variable.value : null;
}

export function killHints(file: ChallengeRewardsFile): KillHints | null {
  const reward = file.rewards.find((entry) => sameId(entry.id, "PlayerKill"));
  if (reward === undefined) {
    return null;
  }
  const cash = defaultReward(reward, "Currency.Cash");
  const xp = defaultReward(reward, "XP.Role");
  return cash === null || xp === null ? null : { cash, xp };
}
