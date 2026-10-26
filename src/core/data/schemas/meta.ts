import { z } from "zod";
import { BuildHeader } from "./common";

export const Currency = z.looseObject({
  id: z.string(),
  name: z.string(),
  initialBalance: z.number(),
});

export const GoldMarketOffer = z.looseObject({
  id: z.string(),
  category: z.string(),
  entity: z.string(),
  goldBars: z.number(),
  gridIndex: z.number(),
  tile: z.string(),
  expiration: z.string(),
  expirationTime: z.string().nullish(),
});

export const PassiveMission = z.looseObject({
  id: z.string(),
  difficultyWeight: z.number(),
  challenges: z.array(
    z.looseObject({
      id: z.string(),
      name: z.string(),
      description: z.string().nullish(),
      objective: z.string(),
      target: z.number(),
      reward: z.looseObject({
        currency: z.string(),
        amount: z.number(),
      }),
    }),
  ),
});

export const Achievement = z.looseObject({
  id: z.string(),
  steamId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  thresholds: z.record(z.string(), z.number()).nullish(),
});

export const MetaFile = BuildHeader.extend({
  currencies: z.array(Currency),
  currentSeason: z.number(),
  goldMarket: z.array(GoldMarketOffer),
  passiveMissions: z.array(PassiveMission),
  achievements: z.array(Achievement),
});
