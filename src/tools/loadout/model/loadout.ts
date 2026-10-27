import { z } from "zod";
import { sameId } from "@/core/catalog";
import type { MetaFile } from "@/core/data";
import { slotDefinition } from "./slots";

export const MAX_GEAR_QUANTITY = 20;
export const MAX_GEAR_ROWS = 30;
export const MAX_BUDGET = 10_000_000;
export const FALLBACK_BUDGET = 10_000;

export const SlotId = z.enum(["primary", "sidearm", "specialist", "armor", "helmet", "vest", "backpack"]);

export const MAX_MAGAZINES = 12;
export const MAX_LOOSE_ROUNDS = 500;

export const WeaponSetup = z.object({
  itemId: z.string(),
  attachments: z.record(z.string(), z.string()).default({}),
  magazine: z
    .object({
      id: z.string(),
      ammoType: z.string(),
      count: z.number().int().min(0).max(MAX_MAGAZINES),
    })
    .nullable()
    .default(null),
  looseAmmo: z
    .object({
      itemId: z.string(),
      rounds: z.number().int().min(0).max(MAX_LOOSE_ROUNDS),
    })
    .nullable()
    .default(null),
});

export const GearEntry = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1).max(MAX_GEAR_QUANTITY),
});

export const ARMOR_LEVELS = [0, 1, 2, 3, 4] as const;

const ArmorLevel = z.number().int().min(0).max(4);

export const LethalityView = z.object({
  tab: z.enum(["weapons", "armor"]).default("weapons"),
  targetArmor: ArmorLevel.default(2),
  targetHelmet: ArmorLevel.default(1),
  placement: z.enum(["upper-chest", "head", "mixed"]).default("upper-chest"),
  threatWeaponId: z.string().default("Id.Item.M4"),
  threatAmmoType: z.string().nullable().default(null),
  threatPlacement: z.enum(["upper-chest", "head"]).default("upper-chest"),
});

export const LoadoutView = z.object({
  lethality: LethalityView.default(LethalityView.parse({})),
});

export const Loadout = z.object({
  version: z.literal(1),
  name: z.string().max(60).default(""),
  budget: z.number().min(0).max(MAX_BUDGET),
  slots: z.object({
    primary: WeaponSetup.nullable(),
    sidearm: WeaponSetup.nullable(),
    specialist: WeaponSetup.nullable(),
    armor: z.string().nullable(),
    helmet: z.string().nullable(),
    vest: z.string().nullable(),
    backpack: z.string().nullable(),
  }),
  gear: z.array(GearEntry).max(MAX_GEAR_ROWS),
  view: LoadoutView.default(LoadoutView.parse({})),
});

export type SlotId = z.infer<typeof SlotId>;
export type WeaponSetup = z.infer<typeof WeaponSetup>;
export type GearEntry = z.infer<typeof GearEntry>;
export type LethalityView = z.infer<typeof LethalityView>;
export type LoadoutView = z.infer<typeof LoadoutView>;
export type Loadout = z.infer<typeof Loadout>;

export function emptyLoadout(budget: number): Loadout {
  return {
    version: 1,
    name: "",
    budget,
    slots: {
      primary: null,
      sidearm: null,
      specialist: null,
      armor: null,
      helmet: null,
      vest: null,
      backpack: null,
    },
    gear: [],
    view: LoadoutView.parse({}),
  };
}

export function setLethalityView(loadout: Loadout, changes: Partial<LethalityView>): Loadout {
  return { ...loadout, view: { ...loadout.view, lethality: { ...loadout.view.lethality, ...changes } } };
}

export function startingBudget(meta: MetaFile): number {
  return meta.currencies.find((currency) => sameId(currency.id, "Cash"))?.initialBalance ?? FALLBACK_BUDGET;
}

export function slotItemId(loadout: Loadout, slot: SlotId): string | null {
  const value = loadout.slots[slot];
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : value.itemId;
}

export function setSlotItem(loadout: Loadout, slot: SlotId, itemId: string | null): Loadout {
  const value =
    itemId === null ? null : slotDefinition(slot).kind === "weapon" ? WeaponSetup.parse({ itemId }) : itemId;
  return { ...loadout, slots: { ...loadout.slots, [slot]: value } };
}

export function setGearQuantity(loadout: Loadout, itemId: string, quantity: number): Loadout {
  const clamped = Math.min(MAX_GEAR_QUANTITY, Math.max(0, Math.round(quantity)));
  const exists = loadout.gear.some((entry) => sameId(entry.itemId, itemId));
  if (clamped === 0) {
    return { ...loadout, gear: loadout.gear.filter((entry) => !sameId(entry.itemId, itemId)) };
  }
  if (exists) {
    return {
      ...loadout,
      gear: loadout.gear.map((entry) => (sameId(entry.itemId, itemId) ? { ...entry, quantity: clamped } : entry)),
    };
  }
  if (loadout.gear.length >= MAX_GEAR_ROWS) {
    return loadout;
  }
  return { ...loadout, gear: [...loadout.gear, { itemId, quantity: clamped }] };
}

export function weaponSetupOf(loadout: Loadout, slot: SlotId): WeaponSetup | null {
  const value = loadout.slots[slot];
  return value === null || typeof value === "string" ? null : value;
}

export function setWeaponSetup(loadout: Loadout, slot: SlotId, setup: WeaponSetup | null): Loadout {
  if (slotDefinition(slot).kind !== "weapon") {
    return loadout;
  }
  return { ...loadout, slots: { ...loadout.slots, [slot]: setup } };
}
