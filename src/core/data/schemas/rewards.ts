import { z } from "zod";
import { BuildHeader } from "./common";

export const CashReward = z.looseObject({
  action: z.string(),
  context: z.string(),
  description: z.string().nullish(),
  resource: z.string(),
  base: z.number(),
  modifiers: z.record(z.string(), z.number()),
});

export const RewardsFile = BuildHeader.extend({
  rewards: z.array(CashReward),
});
