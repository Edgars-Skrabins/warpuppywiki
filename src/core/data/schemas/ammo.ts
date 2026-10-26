import { z } from "zod";
import { BuildHeader } from "./common";

export const Projectile = z.looseObject({
  id: z.string(),
  asset: z.string(),
  damage: z.number(),
  damageType: z.string().nullish(),
  damageContext: z.array(z.string()),
  massKg: z.number().nullish(),
  diameterMm: z.number().nullish(),
  lengthMm: z.number().nullish(),
  drag: z
    .looseObject({
      coefficient: z.number().nullish(),
      model: z.string().nullish(),
    })
    .nullish(),
  typicalSpeed: z.number().nullish(),
  penetration: z
    .looseObject({
      penetrates: z.boolean().nullish(),
      penetratesThinSurfaces: z.boolean().nullish(),
      exitSpeedMultiplier: z.number().nullish(),
      effectivenessMultiplier: z.number().nullish(),
      ricochetMinAngle: z.number().nullish(),
    })
    .nullish(),
  explosive: z
    .looseObject({
      radius: z.number().nullish(),
      effectiveRadius: z.number().nullish(),
      falloff: z.number().nullish(),
      minimumDamage: z.number().nullish(),
      bluntDamage: z.number().nullish(),
    })
    .nullish(),
  suppression: z.number().nullish(),
  propulsion: z
    .looseObject({
      thrustSpeed: z.number().nullish(),
      fuel: z.number().nullish(),
      guided: z.boolean().nullish(),
    })
    .nullish(),
  items: z.array(z.string()),
});

export const AmmoFile = BuildHeader.extend({
  units: z.string(),
  projectiles: z.array(Projectile),
});
