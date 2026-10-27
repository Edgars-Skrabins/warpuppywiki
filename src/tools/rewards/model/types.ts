import type { ChallengeReward, RewardCurve } from "@/core/data";

export type RewardResource = ChallengeReward["resources"][number];
export type RewardInput = RewardResource["inputs"][number];
export type RewardVariable = RewardResource["variables"][number];
export type Condition = RewardInput["options"][number]["when"];
export type ConditionGroup = NonNullable<Condition["of"]>[number];

export interface Situation {
  tags: string[];
  game: Record<string, number>;
  scaling: Record<string, number>;
}

export type CurveLookup = (id: string) => RewardCurve | undefined;
