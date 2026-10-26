import { z } from "zod";
import { BuildHeader } from "./common";

export const DamageRule = z.looseObject({
  entity: z.string(),
  source: z.array(z.string()),
  target: z.array(z.string()),
  instigator: z.array(z.string()),
  hitLocations: z.array(z.string()),
  alignment: z.string().nullish(),
  category: z.string(),
  operation: z.string(),
  amount: z.number(),
  custom: z.string().nullish(),
});

export const HitLocationMultipliers = z.looseObject({
  weaponClass: z.string(),
  multipliers: z.record(z.string(), z.number()),
});

export const AmmoTypeEffect = z.looseObject({
  ammoType: z.string(),
  modifier: z.number(),
  byArmsClass: z.record(z.string(), z.number()),
});

export const VehicleSeatDamage = z.looseObject({
  vehicle: z.string(),
  rules: z.array(
    z.looseObject({
      damageSources: z.array(z.string()),
      reduction: z.number(),
    }),
  ),
});

export const DamageFile = BuildHeader.extend({
  rules: z.array(DamageRule),
  hitLocationMultipliers: z.array(HitLocationMultipliers),
  ammoTypes: z.array(AmmoTypeEffect),
  vehicleSeats: z.array(VehicleSeatDamage),
});
