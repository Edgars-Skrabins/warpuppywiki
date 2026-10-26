import { z } from "zod";
import { BuildHeader } from "./common";

export const Item = z.looseObject({
  id: z.string(),
  kind: z.enum(["item", "vehicle"]),
  asset: z.string(),
  name: z.string(),
  subtitle: z.string().nullish(),
  description: z.string().nullish(),
  icon: z.string().nullish(),
  developer: z.boolean().nullish(),
  tags: z.array(z.string()),
  grid: z.tuple([z.number(), z.number()]),
  maxStack: z.number(),
  weight: z.number().nullish(),
  durability: z.number().nullish(),
  unlock: z
    .looseObject({
      role: z.string(),
      level: z.number(),
      cost: z.number(),
    })
    .nullable(),
  vendor: z.array(
    z.looseObject({
      tag: z.string(),
      price: z.number(),
      amount: z.number(),
      categories: z.array(z.string()),
    }),
  ),
});

export const ItemsFile = BuildHeader.extend({
  items: z.array(Item),
});
