import { z } from "zod";
import { BuildHeader, Vec2 } from "./common";

export const Weapon = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  asset: z.string(),
  fireModes: z.array(z.string()),
  rpm: z.number().nullish(),
  roundsPerBurst: z.number().nullish(),
  calibers: z.array(z.string()),
  muzzleVelocity: z.number().nullish(),
  effectiveRange: z.number().nullish(),
  damageFalloff: z
    .array(
      z.looseObject({
        distance: z.number(),
        multiplier: z.number(),
        interpolation: z.enum(["Cubic", "Constant"]).nullish(),
      }),
    )
    .nullish(),
  accuracy: z.number().nullish(),
  randomDeviation: z.number().nullish(),
  adsTime: z.number().nullish(),
  zeroing: z
    .looseObject({
      min: z.number().nullish(),
      max: z.number().nullish(),
      step: z.number().nullish(),
    })
    .nullish(),
  meleeDamage: z.number().nullish(),
  suppressionMultiplier: z.number().nullish(),
  windupTime: z.number().nullish(),
  recoil: z
    .looseObject({
      pattern: z.array(
        z.looseObject({
          x: z.number(),
          y: z.number(),
        }),
      ),
      patternResetTime: z.number().nullish(),
      viewKickMultiplier: z.number().nullish(),
      afterPatternPitch: Vec2.nullish(),
      afterPatternYaw: Vec2.nullish(),
    })
    .nullish(),
  shotgun: z
    .looseObject({
      chokeFactor: z.number().nullish(),
      outerConeHalfAngle: z.number().nullish(),
      innerConeMultiplier: z.number().nullish(),
      randomConeHalfAngleRange: Vec2.nullish(),
    })
    .nullish(),
  slots: z.array(
    z.looseObject({
      slot: z.string(),
      items: z.array(z.string()),
      contexts: z.array(z.string()),
      filter: z.string(),
      blockedItems: z.array(z.string()),
      blockedContexts: z.array(z.string()),
      default: z.string().nullish(),
      hidden: z.boolean(),
    }),
  ),
});

export const WeaponsFile = BuildHeader.extend({
  units: z.string(),
  weapons: z.array(Weapon),
});
