import { normalizeId, sameId, type Catalog, type PriceInfo } from "@/core/catalog";
import type { Attachment, Item } from "@/core/data";
import { attributeInfo, type BetterWhen, type ModifierSource } from "@/core/modifiers";
import {
  AMMO_TYPE_LABELS,
  ammoTypeFromVariationSuffix,
  effectiveStats,
  type AmmoOption,
  type AmmoTypeKey,
  type EffectiveStats,
  type FittedAttachment,
  type MagazineOption,
  type PlayerWeapon,
  type WeaponIndex,
} from "@/core/weapons";
import { MAX_LOOSE_ROUNDS, setWeaponSetup, weaponSetupOf, WeaponSetup, type Loadout, type SlotId } from "./loadout";
import { SLOT_DEFINITIONS } from "./slots";

export const MAGAZINE_SLOT = "Magazine";
export const CHAMBER_SLOT = "Chamber";
export const DEFAULT_MAGAZINE_COUNT = 4;

const AMMO_TYPE_ORDER = Object.keys(AMMO_TYPE_LABELS) as AmmoTypeKey[];
const CHARACTER_ADS_TIME = "Character.AdsTimeMultiplier";
const AIM_SWAY = "Character.AimSwayScaleMultiplier";

export type SetupEntryKind = "attachment" | "magazine" | "ammo";

export interface SetupEntry {
  key: string;
  kind: SetupEntryKind;
  item: Item;
  priceTag: string;
  quantity: number;
}

export interface ValidatedSetup {
  setup: WeaponSetup;
  dropped: string[];
}

export interface AmmoLot {
  size: number;
  price: PriceInfo | null;
}

export type StatFormat = "seconds" | "multiplier" | "distance" | "number";

export interface StatRow {
  key: string;
  label: string;
  bare: number | null;
  fitted: number | null;
  betterWhen: BetterWhen;
  format: StatFormat;
}

export function ammoTypeLabel(ammoType: string): string {
  const key = AMMO_TYPE_ORDER.find((candidate) => sameId(candidate, ammoType));
  return key === undefined ? ammoType : AMMO_TYPE_LABELS[key];
}

export function loadedTypes(option: MagazineOption): AmmoTypeKey[] {
  return AMMO_TYPE_ORDER.filter((type) => option.loaded.some((loaded) => loaded.ammoType === type));
}

export function loadedVariation(
  catalog: Catalog,
  item: Item,
  ammoType: string,
): { tag: string; price: PriceInfo } | null {
  const prefix = `${normalizeId(item.id)}.`;
  return (
    catalog.variations(item).find((variation) => {
      const tag = normalizeId(variation.tag);
      const type = tag.startsWith(prefix) ? ammoTypeFromVariationSuffix(tag.slice(prefix.length)) : null;
      return type !== null && sameId(type, ammoType);
    }) ?? null
  );
}

export function ammoLot(catalog: Catalog, itemId: string): AmmoLot {
  const price = catalog.price(itemId);
  return { size: price !== null && price.amount >= 1 ? price.amount : 1, price };
}

export function lotsFor(rounds: number, lotSize: number): number {
  return Math.ceil(rounds / Math.max(1, lotSize));
}

export function snapRounds(rounds: number, lotSize: number): number {
  const size = Math.max(1, lotSize);
  const max = Math.floor(MAX_LOOSE_ROUNDS / size) * size;
  return Math.min(max, Math.max(0, Math.ceil(Math.round(rounds) / size) * size));
}

function findSlot(weapon: PlayerWeapon, slot: string) {
  return weapon.stats.slots.find((entry) => sameId(entry.slot, slot));
}

export function attachmentSlots(weapon: PlayerWeapon) {
  return weapon.visibleSlots.filter((slot) => !sameId(slot.slot, MAGAZINE_SLOT) && !sameId(slot.slot, CHAMBER_SLOT));
}

export function hasMagazines(weapon: PlayerWeapon, index: WeaponIndex): boolean {
  const slot = findSlot(weapon, MAGAZINE_SLOT);
  return slot !== undefined && !slot.hidden && index.magazineOptions(weapon).length > 0;
}

export function selectMagazine(
  option: MagazineOption,
  current: WeaponSetup["magazine"],
): NonNullable<WeaponSetup["magazine"]> {
  const types = loadedTypes(option);
  const keep = current !== null && types.some((type) => sameId(type, current.ammoType));
  return {
    id: option.attachment.id,
    ammoType: keep ? current.ammoType : (types[0] ?? current?.ammoType ?? ""),
    count: current?.count ?? DEFAULT_MAGAZINE_COUNT,
  };
}

export function preferredAmmo(options: readonly AmmoOption[]): AmmoOption | null {
  return (
    options.find((option) => option.ammoType === "FMJ" && option.price !== null) ??
    options.find((option) => option.price !== null) ??
    options[0] ??
    null
  );
}

export function defaultSetup(itemId: string, index: WeaponIndex, catalog: Catalog): WeaponSetup {
  const bare = WeaponSetup.parse({ itemId });
  const weapon = index.weapon(itemId);
  if (weapon === undefined) {
    return bare;
  }
  if (hasMagazines(weapon, index)) {
    const [first] = index.magazineOptions(weapon);
    return first === undefined ? bare : { ...bare, magazine: selectMagazine(first, null) };
  }
  const ammo = preferredAmmo(index.ammoOptions(weapon));
  if (ammo === null) {
    return bare;
  }
  return { ...bare, looseAmmo: { itemId: ammo.item.id, rounds: ammoLot(catalog, ammo.item.id).size } };
}

function nameOf(attachment: Attachment | undefined, id: string): string {
  return attachment?.name ?? id;
}

export function validateSetup(setup: WeaponSetup, index: WeaponIndex): ValidatedSetup {
  const dropped: string[] = [];
  const weapon = index.weapon(setup.itemId);
  const attachments: Record<string, string> = {};
  for (const [slotName, id] of Object.entries(setup.attachments)) {
    const slot =
      weapon === undefined ? undefined : attachmentSlots(weapon).find((entry) => sameId(entry.slot, slotName));
    const fits =
      weapon !== undefined &&
      slot !== undefined &&
      index.slotOptions(weapon, slot.slot).some((option) => sameId(option.id, id));
    if (!fits || slot === undefined) {
      dropped.push(nameOf(index.attachment(id), id));
    } else if (!slot.default || !sameId(slot.default, id)) {
      attachments[slot.slot] = id;
    }
  }
  let magazine = setup.magazine;
  if (magazine !== null) {
    const option =
      weapon !== undefined && hasMagazines(weapon, index)
        ? index.magazineOptions(weapon).find((candidate) => sameId(candidate.attachment.id, magazine?.id ?? ""))
        : undefined;
    if (option === undefined) {
      dropped.push(nameOf(index.attachment(magazine.id), magazine.id));
      magazine = null;
    } else {
      magazine = { ...selectMagazine(option, magazine), count: magazine.count };
    }
  }
  let looseAmmo = setup.looseAmmo;
  if (looseAmmo !== null) {
    const itemId = looseAmmo.itemId;
    const fits = weapon !== undefined && index.ammoOptions(weapon).some((option) => sameId(option.item.id, itemId));
    if (!fits) {
      dropped.push(itemId);
      looseAmmo = null;
    }
  }
  return { setup: { ...setup, attachments, magazine, looseAmmo }, dropped };
}

export function setupEntries(setup: WeaponSetup, catalog: Catalog, keyPrefix = ""): SetupEntry[] {
  const entries: SetupEntry[] = [];
  for (const [slot, id] of Object.entries(setup.attachments)) {
    const item = catalog.item(id);
    if (item !== undefined) {
      entries.push({ key: `${keyPrefix}attachment:${slot}`, kind: "attachment", item, priceTag: item.id, quantity: 1 });
    }
  }
  const { magazine, looseAmmo } = setup;
  const magazineItem = magazine === null ? undefined : catalog.item(magazine.id);
  if (magazine !== null && magazineItem !== undefined && magazine.count > 0) {
    entries.push({
      key: `${keyPrefix}magazine`,
      kind: "magazine",
      item: magazineItem,
      priceTag: loadedVariation(catalog, magazineItem, magazine.ammoType)?.tag ?? magazineItem.id,
      quantity: magazine.count,
    });
  }
  const ammoItem = looseAmmo === null ? undefined : catalog.item(looseAmmo.itemId);
  if (looseAmmo !== null && ammoItem !== undefined && looseAmmo.rounds > 0) {
    entries.push({
      key: `${keyPrefix}ammo`,
      kind: "ammo",
      item: ammoItem,
      priceTag: ammoItem.id,
      quantity: lotsFor(looseAmmo.rounds, ammoLot(catalog, ammoItem.id).size),
    });
  }
  return entries;
}

export function entryTotal(entry: Pick<SetupEntry, "priceTag" | "quantity">, catalog: Catalog): number {
  return (catalog.price(entry.priceTag)?.price ?? 0) * entry.quantity;
}

export function setupCost(setup: WeaponSetup, catalog: Catalog): number {
  const weapon = catalog.price(setup.itemId)?.price ?? 0;
  return setupEntries(setup, catalog).reduce((sum, entry) => sum + entryTotal(entry, catalog), weapon);
}

export function setupWeight(setup: WeaponSetup, catalog: Catalog): number {
  const weapon = catalog.item(setup.itemId)?.weight ?? 0;
  const total = setupEntries(setup, catalog).reduce(
    (sum, entry) => sum + (entry.item.weight ?? 0) * entry.quantity,
    weapon,
  );
  return Math.round(total * 1000) / 1000;
}

export function setupSummaryText(setup: WeaponSetup, index: WeaponIndex, catalog: Catalog): string {
  const parts = Object.values(setup.attachments).map(
    (id) => catalog.item(id)?.name ?? nameOf(index.attachment(id), id),
  );
  const { magazine, looseAmmo } = setup;
  if (magazine !== null && magazine.count > 0) {
    const capacity = index.attachment(magazine.id)?.magazine?.capacity;
    const size = capacity === undefined ? "" : `${capacity} RND `;
    parts.push(`${magazine.count} × ${size}${ammoTypeLabel(magazine.ammoType)}`.trim());
  }
  if (looseAmmo !== null && looseAmmo.rounds > 0) {
    parts.push(`${looseAmmo.rounds} RND ${catalog.item(looseAmmo.itemId)?.name ?? looseAmmo.itemId}`);
  }
  return parts.length === 0 ? "Bare weapon" : parts.join(" · ");
}

function visibleDefault(weapon: PlayerWeapon, slotName: string, index: WeaponIndex): Attachment | undefined {
  const slot = findSlot(weapon, slotName);
  return slot === undefined || slot.hidden || !slot.default ? undefined : index.attachment(slot.default);
}

export function bareAttachments(weapon: PlayerWeapon, index: WeaponIndex): FittedAttachment[] {
  const visible = weapon.visibleSlots.flatMap((slot): FittedAttachment[] => {
    const attachment = visibleDefault(weapon, slot.slot, index);
    return attachment === undefined ? [] : [{ slot: slot.slot, attachment, hiddenDefault: false }];
  });
  return [...index.hiddenDefaults(weapon), ...visible];
}

export function fittedAttachments(weapon: PlayerWeapon, setup: WeaponSetup, index: WeaponIndex): FittedAttachment[] {
  const chosen = (slotName: string): Attachment | undefined => {
    if (sameId(slotName, MAGAZINE_SLOT)) {
      return setup.magazine === null ? undefined : index.attachment(setup.magazine.id);
    }
    const entry = Object.entries(setup.attachments).find(([slot]) => sameId(slot, slotName));
    return entry === undefined ? undefined : index.attachment(entry[1]);
  };
  const visible = weapon.visibleSlots.flatMap((slot): FittedAttachment[] => {
    const attachment = chosen(slot.slot) ?? visibleDefault(weapon, slot.slot, index);
    return attachment === undefined ? [] : [{ slot: slot.slot, attachment, hiddenDefault: false }];
  });
  return [...index.hiddenDefaults(weapon), ...visible];
}

export function builtInParts(weapon: PlayerWeapon, index: WeaponIndex): FittedAttachment[] {
  return index
    .hiddenDefaults(weapon)
    .filter((fitted) => fitted.attachment.modifiers.length + fitted.attachment.characterModifiers.length > 0);
}

export interface SetupStats {
  bare: EffectiveStats;
  fitted: EffectiveStats;
}

export function setupStats(
  weapon: PlayerWeapon,
  setup: WeaponSetup,
  index: WeaponIndex,
  extraSources: readonly ModifierSource[],
): SetupStats {
  return {
    bare: effectiveStats(weapon.stats, bareAttachments(weapon, index), extraSources),
    fitted: effectiveStats(weapon.stats, fittedAttachments(weapon, setup, index), extraSources),
  };
}

function characterValue(stats: EffectiveStats, attribute: string): number {
  const entry = Object.entries(stats.character).find(([key]) => sameId(key, attribute));
  return entry === undefined ? 1 : entry[1].value;
}

export function statRows({ bare, fitted }: SetupStats): StatRow[] {
  const rows: StatRow[] = [
    {
      key: "adsTime",
      label: "ADS time",
      bare: bare.adsTime?.value ?? null,
      fitted: fitted.adsTime?.value ?? null,
      betterWhen: "lower",
      format: "seconds",
    },
    {
      key: "verticalRecoil",
      label: "Vertical recoil",
      bare: bare.verticalRecoil.value,
      fitted: fitted.verticalRecoil.value,
      betterWhen: "lower",
      format: "multiplier",
    },
    {
      key: "horizontalRecoil",
      label: "Horizontal recoil",
      bare: bare.horizontalRecoil.value,
      fitted: fitted.horizontalRecoil.value,
      betterWhen: "lower",
      format: "multiplier",
    },
    {
      key: "spread",
      label: "Spread",
      bare: bare.spread.value,
      fitted: fitted.spread.value,
      betterWhen: "lower",
      format: "multiplier",
    },
    {
      key: "equipSpeed",
      label: "Equip speed",
      bare: bare.equipSpeed.value,
      fitted: fitted.equipSpeed.value,
      betterWhen: "higher",
      format: "multiplier",
    },
    {
      key: "zoom",
      label: "Zoom",
      bare: bare.zoom.value,
      fitted: fitted.zoom.value,
      betterWhen: "neutral",
      format: "multiplier",
    },
    {
      key: "zeroingMin",
      label: "Min zeroing",
      bare: bare.zeroingMin?.value ?? null,
      fitted: fitted.zeroingMin?.value ?? null,
      betterWhen: "neutral",
      format: "distance",
    },
    {
      key: "zeroingMax",
      label: "Max zeroing",
      bare: bare.zeroingMax?.value ?? null,
      fitted: fitted.zeroingMax?.value ?? null,
      betterWhen: "neutral",
      format: "distance",
    },
    {
      key: "magazineCapacity",
      label: "Magazine capacity",
      bare: bare.magazineCapacity,
      fitted: fitted.magazineCapacity,
      betterWhen: "higher",
      format: "number",
    },
  ];
  const attributes = [AIM_SWAY];
  for (const key of [...Object.keys(bare.character), ...Object.keys(fitted.character)]) {
    if (!sameId(key, CHARACTER_ADS_TIME) && !attributes.some((attribute) => sameId(attribute, key))) {
      attributes.push(key);
    }
  }
  for (const attribute of attributes) {
    const bareValue = characterValue(bare, attribute);
    const fittedValue = characterValue(fitted, attribute);
    const info = attributeInfo(attribute);
    if (info.unit === "multiplier" && (sameId(attribute, AIM_SWAY) || bareValue !== 1 || fittedValue !== 1)) {
      rows.push({
        key: attribute,
        label: info.label,
        bare: bareValue,
        fitted: fittedValue,
        betterWhen: info.betterWhen,
        format: "multiplier",
      });
    }
  }
  return rows;
}

export interface ValidatedLoadout {
  loadout: Loadout;
  droppedSlots: SlotId[];
}

export function validateLoadout(loadout: Loadout, index: WeaponIndex): ValidatedLoadout {
  let validated = loadout;
  const droppedSlots: SlotId[] = [];
  for (const slot of SLOT_DEFINITIONS) {
    const setup = weaponSetupOf(loadout, slot.id);
    if (setup !== null) {
      const result = validateSetup(setup, index);
      if (result.dropped.length > 0) {
        validated = setWeaponSetup(validated, slot.id, result.setup);
        droppedSlots.push(slot.id);
      }
    }
  }
  return { loadout: validated, droppedSlots };
}
