import { z } from "zod";

export const Vec2 = z.tuple([z.number(), z.number()]);
export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const Modifier = z.looseObject({
  attribute: z.string(),
  op: z.enum(["multiplyCompound", "multiply", "add", "override"]),
  value: z.number(),
});

export const Bounds = z.looseObject({
  min: Vec2,
  max: Vec2,
});

export const BuildHeader = z.looseObject({
  schemaVersion: z.literal(1),
  gameBuild: z.string(),
});
