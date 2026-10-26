import { normalizeId } from "@/core/catalog";

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

export function ammoTypeOf(item: { tags: readonly string[] }): AmmoTypeKey {
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

export function ammoTypeFromVariationSuffix(suffix: string): AmmoTypeKey | null {
  return VARIATION_TYPES[normalizeId(suffix)] ?? null;
}
