import { defineUrlState } from "@/core/state";
import { z } from "zod";
import { ITEM_CATEGORIES, type ItemCategory } from "./logic/itemCategory";

const categoryIds = ITEM_CATEGORIES.map((category) => category.id) as [ItemCategory, ...ItemCategory[]];

const BrowserState = z.object({
  query: z.string(),
  category: z.enum(["all", ...categoryIds]),
  view: z.enum(["grid", "list"]),
});

export type BrowserState = z.infer<typeof BrowserState>;

export const ITEM_PARAM = "i";

export const browserState = defineUrlState<BrowserState>({
  key: "f",
  version: 1,
  schema: BrowserState,
  defaults: { query: "", category: "all", view: "grid" },
});
