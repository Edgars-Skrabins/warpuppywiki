import { z } from "zod";
import { defineUrlState } from "@/core/state";

export const DEFAULT_EVENT = "PlayerKill";

const RewardsState = z.object({
  event: z.string(),
  tags: z.array(z.string()),
  game: z.record(z.string(), z.number()),
  scaling: z.record(z.string(), z.number()),
});

export type RewardsState = z.infer<typeof RewardsState>;

export const rewardsState = defineUrlState<RewardsState>({
  key: "rewards",
  version: 1,
  schema: RewardsState,
  defaults: { event: DEFAULT_EVENT, tags: [], game: {}, scaling: {} },
});
