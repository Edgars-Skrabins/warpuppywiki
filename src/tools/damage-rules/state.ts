import { z } from "zod";
import { defineUrlState } from "@/core/state";

export const TABS = ["rules", "multipliers", "ammo", "seats"] as const;

export type DamageRulesTab = (typeof TABS)[number];

const DamageRulesState = z.object({
  tab: z.enum(TABS),
  group: z.enum(["infantry", "armor", "vehicles", "buildables", "other"]).nullable(),
  entity: z.string().nullable(),
  categories: z.array(z.string()).readonly(),
  source: z.string(),
  nonZero: z.boolean(),
  hideFriendly: z.boolean(),
  sort: z.object({ key: z.enum(["file", "amount", "entity"]), descending: z.boolean() }),
  hit: z.object({
    source: z.array(z.string()).readonly(),
    target: z.array(z.string()).readonly(),
    attacker: z.array(z.string()).readonly(),
    location: z.string().nullable(),
  }),
});

export type DamageRulesState = z.infer<typeof DamageRulesState>;

export const damageRulesState = defineUrlState<DamageRulesState>({
  key: "rules",
  version: 1,
  schema: DamageRulesState,
  defaults: {
    tab: "rules",
    group: null,
    entity: null,
    categories: [],
    source: "",
    nonZero: true,
    hideFriendly: true,
    sort: { key: "file", descending: false },
    hit: { source: [], target: [], attacker: [], location: null },
  },
});
