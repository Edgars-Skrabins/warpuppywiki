import { z } from "zod";
import { BuildHeader } from "./common";

export const ChallengeEvent = z.looseObject({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});

export const ChallengeReward = z.looseObject({
  id: z.string(),
  resources: z.array(
    z.looseObject({
      resource: z.string(),
      formula: z.string(),
      inputs: z.array(
        z.looseObject({
          name: z.string(),
          default: z.string(),
          options: z.array(
            z.looseObject({
              when: z.looseObject({
                match: z.enum(["all", "any", "none"]),
                tags: z.array(z.string()).nullish(),
                of: z
                  .array(
                    z.looseObject({
                      match: z.enum(["all", "any", "none"]),
                      tags: z.array(z.string()),
                    }),
                  )
                  .nullish(),
              }),
              use: z.string(),
            }),
          ),
        }),
      ),
      variables: z.array(
        z.union([
          z.looseObject({
            name: z.string(),
            type: z.literal("literal"),
            value: z.number(),
          }),
          z.looseObject({
            name: z.string(),
            type: z.literal("game"),
            game: z.string(),
          }),
          z.looseObject({
            name: z.string(),
            type: z.literal("scaling"),
            input: z.string(),
            curve: z.string(),
          }),
        ]),
      ),
    }),
  ),
});

export const RewardCurve = z.looseObject({
  id: z.string(),
  points: z.array(
    z.looseObject({
      input: z.number(),
      value: z.number(),
      interpolation: z.enum(["constant", "linear", "cubic"]),
    }),
  ),
});

export const ChallengeRewardsFile = BuildHeader.extend({
  events: z.array(ChallengeEvent),
  rewards: z.array(ChallengeReward),
  curves: z.array(RewardCurve),
});
