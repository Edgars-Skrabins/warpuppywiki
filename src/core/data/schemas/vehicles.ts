import { z } from "zod";
import { BuildHeader } from "./common";

export const Vehicle = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  asset: z.string(),
  maxSpeed: z.number(),
  maxFuel: z.number(),
  fuelEconomy: z.number(),
  seats: z.number(),
  weapons: z.array(z.string()),
  weaponIcons: z.record(z.string(), z.string()).nullish(),
  counterMeasures: z.array(z.string()),
  damageEntity: z.string().nullish(),
  health: z
    .looseObject({
      initial: z.number(),
      criticalThreshold: z.number().nullish(),
      bleedOutTime: z.number().nullish(),
    })
    .nullish(),
  kmPerLiter: z.number().nullish(),
  destroyedExplosion: z
    .looseObject({
      radius: z.number().nullish(),
      effectiveRadius: z.number().nullish(),
      falloff: z.number().nullish(),
    })
    .nullish(),
  mass: z.number().nullish(),
  engine: z
    .looseObject({
      torqueCurve: z.array(
        z.looseObject({
          rpm: z.number(),
          torque: z.number(),
        }),
      ),
      torqueScale: z.number().nullish(),
      frictionTorque: z.number().nullish(),
      idleRpm: z.number().nullish(),
      limitRpm: z.number().nullish(),
      inertia: z.number().nullish(),
      boostScale: z.number().nullish(),
      extraPowerRatio: z.number().nullish(),
    })
    .nullish(),
  transmission: z
    .looseObject({
      gearRatios: z.array(z.number()),
      finalGearRatio: z.number().nullish(),
      changeTime: z.number().nullish(),
      clutchTime: z.number().nullish(),
      gearUpRatio: z.number().nullish(),
      gearDownRatio: z.number().nullish(),
    })
    .nullish(),
  tracks: z
    .looseObject({
      trackMass: z.number().nullish(),
      sprocketMass: z.number().nullish(),
    })
    .nullish(),
});

export const VehiclesFile = BuildHeader.extend({
  vehicles: z.array(Vehicle),
});
