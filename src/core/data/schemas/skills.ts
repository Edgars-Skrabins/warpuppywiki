import { z } from "zod";
import { BuildHeader } from "./common";

export const SkillTree = z.looseObject({
  role: z.string(),
  rows: z.number(),
  columns: z.number(),
  shape: z.string(),
});

export const Skill = z.looseObject({
  id: z.string(),
  role: z.string(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  layout: z
    .looseObject({
      row: z.number(),
      column: z.number(),
      x: z.number(),
      y: z.number(),
    })
    .nullish(),
  effects: z.array(
    z.looseObject({
      trigger: z.string(),
      effect: z.string(),
      attribute: z.string().nullish(),
      curve: z.string().nullish(),
      levels: z
        .array(
          z.looseObject({
            level: z.number(),
            value: z.number(),
          }),
        )
        .nullish(),
    }),
  ),
});

export const SkillsFile = BuildHeader.extend({
  trees: z.array(SkillTree),
  skills: z.array(Skill),
});
