import { hasTag, stripPrefix, tagMatches, type Catalog } from "@/core/catalog";
import type { DamageRule, Item, Projectile } from "@/core/data";
import { AMMO_TYPE_LABELS, ammoTypeOf, type AmmoTypeKey } from "@/core/weapons";
import { isPercentRule, ruleRow, type RuleRow } from "./buildableRules";

export type ProjectileGroup = "bullets" | "rockets" | "grenades" | "explosives";

export const PROJECTILE_GROUPS: readonly ProjectileGroup[] = ["bullets", "rockets", "grenades", "explosives"];

export const PROJECTILE_GROUP_LABELS: Record<ProjectileGroup, string> = {
  bullets: "Bullets",
  rockets: "Rockets",
  grenades: "Grenades",
  explosives: "Explosives",
};

export const DIRECT_HIT_TAG = "Explosive.Radius.Inner";

const AMMO_MODIFIER_TAGS: Partial<Record<AmmoTypeKey, string>> = {
  ArmorPiercing: "AmmoModifier.ArmorPiercing",
  "ArmorPiercing.Tracer": "AmmoModifier.ArmorPiercing",
  HollowPoint: "AmmoModifier.HollowPoint",
  "HollowPoint.Tracer": "AmmoModifier.HollowPoint",
};

export type ProjectileCatalog = Pick<Catalog, "item" | "isPlayerItem">;

export interface ProjectileOption {
  key: string;
  label: string;
  group: ProjectileGroup;
  projectile: Projectile;
  tags: string[];
}

export interface HitsResult {
  damage: number;
  factor: number;
  hits: number | null;
  applied: RuleRow[];
  notApplied: RuleRow[];
}

function damageTypeTag(projectile: Projectile): string | null {
  return projectile.damageType ? stripPrefix(projectile.damageType, "Meta.Damage") : null;
}

export function projectileGroup(projectile: Projectile): ProjectileGroup {
  const tag = damageTypeTag(projectile);
  if (tag !== null && tagMatches(tag, "Bullet")) return "bullets";
  if (tag !== null && tagMatches(tag, "Explosive.Rocket")) return "rockets";
  if (tag !== null && tagMatches(tag, "Explosive.Grenade")) return "grenades";
  return "explosives";
}

export function projectileTags(projectile: Projectile, item: Item): string[] {
  const tags: string[] = [];
  const damageType = damageTypeTag(projectile);
  if (damageType !== null) tags.push(damageType);
  if (projectile.explosive) tags.push(DIRECT_HIT_TAG);
  if (projectileGroup(projectile) === "bullets") {
    const modifier = AMMO_MODIFIER_TAGS[ammoTypeOf(item)];
    if (modifier) tags.push(modifier);
  }
  return tags;
}

function optionLabel(item: Item): string {
  return item.name ?? item.id;
}

function disambiguate(options: ProjectileOption[], items: ReadonlyMap<string, Item>): ProjectileOption[] {
  const counts = new Map<string, number>();
  for (const option of options) counts.set(option.label, (counts.get(option.label) ?? 0) + 1);
  return options.map((option) => {
    const item = items.get(option.key);
    if ((counts.get(option.label) ?? 0) < 2 || option.group !== "bullets" || !item) return option;
    return { ...option, label: `${option.label} · ${AMMO_TYPE_LABELS[ammoTypeOf(item)]}` };
  });
}

export function projectileOptions(projectiles: readonly Projectile[], catalog: ProjectileCatalog): ProjectileOption[] {
  const options: ProjectileOption[] = [];
  const items = new Map<string, Item>();
  const seen = new Set<string>();
  for (const projectile of projectiles) {
    for (const itemId of projectile.items) {
      const item = catalog.item(itemId);
      if (!item || !catalog.isPlayerItem(item)) continue;
      const tags = projectileTags(projectile, item);
      const label = optionLabel(item);
      const identity = [label, projectile.damage, ...tags].join("|").toLowerCase();
      if (seen.has(identity)) continue;
      seen.add(identity);
      items.set(item.id, item);
      options.push({ key: item.id, label, group: projectileGroup(projectile), projectile, tags });
    }
  }
  return disambiguate(options, items).sort(
    (a, b) =>
      PROJECTILE_GROUPS.indexOf(a.group) - PROJECTILE_GROUPS.indexOf(b.group) ||
      a.label.localeCompare(b.label, "en", { numeric: true }),
  );
}

export function ruleApplies(rule: DamageRule, tags: readonly string[]): boolean {
  return rule.source.length > 0 && rule.source.every((source) => hasTag(tags, source));
}

export function hitsToDestroy(
  maxHealth: number,
  option: Pick<ProjectileOption, "projectile" | "tags">,
  entityRules: readonly DamageRule[],
): HitsResult {
  const matching = entityRules
    .map((rule, index) => ({ rule, index }))
    .filter(({ rule }) => ruleApplies(rule, option.tags));
  const applied = matching.filter(({ rule }) => isPercentRule(rule));
  const notApplied = matching.filter(({ rule }) => !isPercentRule(rule));
  const factor = Math.max(
    0,
    applied.reduce((product, { rule }) => product * (1 + rule.amount / 100), 1),
  );
  const damage = option.projectile.damage * factor;
  return {
    damage,
    factor,
    hits:
      damage > 0 && Number.isFinite(damage) && maxHealth > 0 && Number.isFinite(maxHealth)
        ? Math.max(1, Math.ceil(maxHealth / damage - 1e-9))
        : null,
    applied: applied.map(({ rule, index }) => ruleRow(rule, index)),
    notApplied: notApplied.map(({ rule, index }) => ruleRow(rule, index)),
  };
}
