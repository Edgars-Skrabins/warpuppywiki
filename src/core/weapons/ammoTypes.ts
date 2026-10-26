import { normalizeId, stripPrefix, tagsUnder } from "@/core/catalog";

export type AmmoTypeKey =
  | "FMJ"
  | "Tracer"
  | "HollowPoint"
  | "HollowPoint.Tracer"
  | "ArmorPiercing"
  | "ArmorPiercing.Tracer"
  | "Buckshot"
  | "Slug";

export const AMMO_TYPE_LABELS: Record<AmmoTypeKey, string> = {
  FMJ: "FMJ",
  Tracer: "FMJ (T)",
  HollowPoint: "HP",
  "HollowPoint.Tracer": "HP (T)",
  ArmorPiercing: "AP",
  "ArmorPiercing.Tracer": "AP (T)",
  Buckshot: "Buckshot",
  Slug: "Slug",
};

const AMMO_TYPE_PREFIX = "Item.Ammo.Type.";
const CALIBER_PREFIX = "Item.Caliber";
const ITEM_ID_PREFIX = "Id.Item.";

const ID_SUFFIX_TYPES: Record<string, AmmoTypeKey> = {
  "": "FMJ",
  tracer: "Tracer",
  hollowpoint: "HollowPoint",
  "hollowpoint.tracer": "HollowPoint.Tracer",
  armorpiercing: "ArmorPiercing",
  "armorpiercing.tracer": "ArmorPiercing.Tracer",
};

const TAG_TYPES: Record<string, AmmoTypeKey> = {
  fmj: "FMJ",
  "fmj.tracer": "Tracer",
  hollowpoint: "HollowPoint",
  "hollowpoint.tracer": "HollowPoint.Tracer",
  armorpiercing: "ArmorPiercing",
  "armorpiercing.tracer": "ArmorPiercing.Tracer",
  buckshot: "Buckshot",
  slug: "Slug",
};

const VARIATION_TYPES: Record<string, AmmoTypeKey> = {
  fmj: "FMJ",
  fmjtracer: "Tracer",
  hollowpoint: "HollowPoint",
  hollowpointtracer: "HollowPoint.Tracer",
  armorpiercing: "ArmorPiercing",
  armorpiercingtracer: "ArmorPiercing.Tracer",
};

function ammoTypeFromId(item: { id: string; tags: readonly string[] }): AmmoTypeKey | null {
  const id = normalizeId(item.id);
  for (const tag of tagsUnder(item.tags, CALIBER_PREFIX)) {
    const base = normalizeId(`${ITEM_ID_PREFIX}${stripPrefix(tag, CALIBER_PREFIX)}`);
    if (id === base) {
      return "FMJ";
    }
    const type = id.startsWith(`${base}.`) ? ID_SUFFIX_TYPES[id.slice(base.length + 1)] : undefined;
    if (type) {
      return type;
    }
  }
  return null;
}

function ammoTypeFromTag(item: { tags: readonly string[] }): AmmoTypeKey {
  const prefix = normalizeId(AMMO_TYPE_PREFIX);
  for (const tag of item.tags) {
    const normalized = normalizeId(tag);
    if (normalized.startsWith(prefix)) {
      const type = TAG_TYPES[normalized.slice(prefix.length)];
      if (type) {
        return type;
      }
    }
  }
  return "FMJ";
}

export function ammoTypeOf(item: { id: string; tags: readonly string[] }): AmmoTypeKey {
  return ammoTypeFromId(item) ?? ammoTypeFromTag(item);
}

export function ammoTypeFromVariationSuffix(suffix: string): AmmoTypeKey | null {
  return VARIATION_TYPES[normalizeId(suffix)] ?? null;
}
