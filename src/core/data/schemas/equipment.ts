import { z } from "zod";
import { BuildHeader, Modifier } from "./common";

export const Armor = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  slot: z.string(),
  damageContext: z.string(),
  coveredLocations: z.array(z.string()),
  durability: z.number().nullish(),
  stages: z.array(
    z.looseObject({
      damageReduction: z.number(),
      thickness: z.number(),
      density: z.number(),
    }),
  ),
  modifiers: z.array(Modifier),
});

export const WeightClass = z.looseObject({
  name: z.string(),
  minWeightKg: z.number(),
  modifiers: z.array(Modifier),
});

export const EquipmentFile = BuildHeader.extend({
  armor: z.array(Armor),
  weightClasses: z.array(WeightClass),
});
