import { z } from "zod";
import { BuildHeader } from "./common";

export const Stance = z.looseObject({
  name: z.string(),
  capsuleHalfHeight: z.number(),
  capsuleRadius: z.number(),
  eyeHeight: z.number(),
  staminaCost: z.number(),
  maxSpeedMultiplier: z.number().nullish(),
});

export const MovementFile = BuildHeader.extend({
  units: z.string(),
  stances: z.array(Stance),
  stanceTransitions: z.unknown(),
  ground: z.looseObject({
    minSpeed: z.number().nullish(),
    backMaxSpeedScale: z.number().nullish(),
    strafeMaxSpeedScale: z.number().nullish(),
    forwardStrafeScale: z.number().nullish(),
    forwardStrafeScaleSprinting: z.number().nullish(),
    slowWalk: z.record(z.string(), z.number()),
    leanTime: z.number().nullish(),
    unleanTime: z.number().nullish(),
    blockSprintTime: z.number().nullish(),
    blockTacticalSprintTime: z.number().nullish(),
    minStartTacticalSprint: z.number().nullish(),
  }),
  jump: z.looseObject({
    velocity: z.number().nullish(),
    maxStamina: z.number().nullish(),
    staminaCost: z.number().nullish(),
    staminaRegenPerSecond: z.number().nullish(),
    cooldown: z.number().nullish(),
  }),
  falling: z.looseObject({
    maxSpeed: z.number().nullish(),
    airControl: z.number().nullish(),
    terminalSpeed: z.number().nullish(),
    landingDamage: z.array(
      z.looseObject({
        speed: z.number(),
        damage: z.number(),
      }),
    ),
  }),
  ladder: z.unknown(),
  bodyDragging: z.unknown(),
  stamina: z.looseObject({
    regenPerSecond: z.number().nullish(),
    regenDelay: z.number().nullish(),
    depletedRegenDelay: z.number().nullish(),
    stanceRegenPerSecond: z.number().nullish(),
    stanceRegenDelay: z.number().nullish(),
    stanceCooldown: z.number().nullish(),
  }),
  slopes: z.unknown(),
  friction: z.unknown(),
  swimming: z.unknown(),
  vaulting: z.unknown(),
  mantling: z.unknown(),
  climbing: z.unknown(),
  parachute: z.unknown(),
});
