import { z } from "zod";
import { BuildHeader, Vec3 } from "./common";

export const Buildable = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  icon: z.string().nullish(),
  cost: z.number(),
  maxHealth: z.number(),
  repairSpeedMultiplier: z.number().nullish(),
  maxStack: z.number().nullish(),
  damageEntity: z.string().nullish(),
  size: Vec3.nullish(),
  tools: z.array(z.string()),
  placementRules: z.array(z.string()),
});

export const BuildablesFile = BuildHeader.extend({
  units: z.string(),
  buildables: z.array(Buildable),
});
