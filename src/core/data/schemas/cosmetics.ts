import { z } from "zod";
import { BuildHeader } from "./common";

export const CosmeticSet = z.looseObject({
  id: z.string(),
  name: z.string(),
  sortIndex: z.number(),
  hidden: z.boolean(),
});

export const Cosmetic = z.looseObject({
  id: z.string(),
  item: z.string(),
  set: z.string(),
  archetype: z.string().nullish(),
  source: z.string(),
});

export const CosmeticsFile = BuildHeader.extend({
  sets: z.array(CosmeticSet),
  cosmetics: z.array(Cosmetic),
});
