import { IdMap, sameId } from "@/core/catalog";
import type { DamageRule } from "@/core/data";

export const GENERIC_VEHICLE_ENTITY = "Vehicle";

export const WHOLE_VEHICLE = "Whole vehicle";

export const SPECIAL_RULE = "Special rule (not shown as a number)";

export const SOURCE_LABELS: Record<string, string> = {
  Bullet: "Bullets",
  "Bullet.308Win": ".308 bullets",
  "AmmoModifier.ArmorPiercing": "armor-piercing",
  "AmmoModifier.HollowPoint": "hollow-point",
  Explosive: "Explosives",
  "Explosive.Rocket": "Rockets",
  "Explosive.Grenade": "Grenades",
  "Explosive.Utility": "Utility explosives",
  "Explosive.Utility.ATMine": "AT mines",
  "Explosive.Utility.C4": "C4",
  "Explosive.Utility.IED": "IEDs",
  "Explosive.Utility.Claymore": "Claymores",
  "Explosive.Drone": "Drones",
  Cannon: "Cannons",
  "Kinetic.Impact.Ricochet": "Ricochets",
  "Explosive.Radius.Inner": "(direct hit)",
};

const SOURCE_PATTERNS: readonly [RegExp, string][] = [
  [/^explosive\.rocket\.(.+)$/i, "rockets"],
  [/^explosive\.grenade\.(.+)$/i, "grenades"],
  [/^cannon\.(.+)$/i, "cannon"],
];

const SOURCE_PREFIXES = ["ammomodifier."];

const SOURCE_SUFFIXES = ["explosive.radius.inner"];

export const PART_LABELS: Record<string, string> = {
  Vehicle: WHOLE_VEHICLE,
  "Vehicle.MainBody": "Body",
  "Vehicle.FuelTank": "Fuel tank",
  "Vehicle.FuelTank.Destroyed": "Destroyed fuel tank",
  "Vehicle.MainRotor": "Main rotor",
  "Vehicle.TailRotor": "Tail rotor",
  "Vehicle.Tail": "Tail",
  "Vehicle.Skids": "Skids",
  "Vehicle.Engine": "Engine",
  "Vehicle.Turret": "Turret",
  "Vehicle.Radar": "Radar",
  "Vehicle.Wheel": "Wheels",
  "Attribute.Gameplay.Health": "Hull",
  "Attribute.Gameplay.Health.FuelTank": "Fuel tank",
  "Attribute.Gameplay.Health.Rotor.Main": "Main rotor",
  "Attribute.Gameplay.Health.Skids": "Skids",
  "Attribute.Gameplay.Health.Tail": "Tail",
};

const WHEEL = /^vehicle\.wheel\.(left|right)\.(front|middle|rear)$/i;

const TRACKS = /^vehicle\.tracks?(\..+)?$/i;

export type EffectKind = "percent" | "flat";

export interface VulnerabilityRow {
  key: string;
  source: string;
  part: string;
  wholeVehicle: boolean;
  amount: number;
  kind: EffectKind;
  special: boolean;
}

function labelMap(labels: Record<string, string>): IdMap<string> {
  const map = new IdMap<string>();
  for (const [tag, label] of Object.entries(labels)) map.set(tag, label);
  return map;
}

const sourceLabels = labelMap(SOURCE_LABELS);

const partLabels = labelMap(PART_LABELS);

function caliberText(caliber: string): string {
  return caliber.replace(/^(\d+(?:x\d+)?)mm$/i, "$1 mm");
}

function fallbackLabel(tag: string): string {
  return tag.replaceAll(".", " ");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function lowerWord(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

export function sourceTagLabel(tag: string): string {
  const label = sourceLabels.get(tag);
  if (label !== undefined) return label;
  for (const [pattern, noun] of SOURCE_PATTERNS) {
    const match = pattern.exec(tag);
    if (match?.[1]) return `${caliberText(match[1])} ${noun}`;
  }
  return fallbackLabel(tag);
}

export function sourceLabel(tags: readonly string[]): string {
  const lower = (tag: string) => tag.toLowerCase();
  const prefixes = tags.filter((tag) => SOURCE_PREFIXES.some((prefix) => lower(tag).startsWith(prefix)));
  const suffixes = tags.filter((tag) => SOURCE_SUFFIXES.includes(lower(tag)));
  const bases = tags.filter((tag) => !prefixes.includes(tag) && !suffixes.includes(tag));
  const labels = [...prefixes, ...bases, ...suffixes].map((tag, index) =>
    index === 0 ? sourceTagLabel(tag) : lowerWord(sourceTagLabel(tag)),
  );
  const prefixText = labels.slice(0, prefixes.length);
  const baseText = labels.slice(prefixes.length, prefixes.length + bases.length).join(" and ");
  const suffixText = labels.slice(prefixes.length + bases.length);
  return capitalize([...prefixText, baseText, ...suffixText].filter((word) => word !== "").join(" "));
}

function wheelLabels(hitLocations: readonly string[]): { labels: string[]; rest: string[] } {
  const wheels = new Map<string, Set<string>>();
  const rest: string[] = [];
  for (const location of hitLocations) {
    const match = WHEEL.exec(location);
    if (match?.[1] && match[2]) {
      const position = capitalize(match[2].toLowerCase());
      const sides = wheels.get(position) ?? new Set<string>();
      sides.add(capitalize(match[1].toLowerCase()));
      wheels.set(position, sides);
    } else {
      rest.push(location);
    }
  }
  const labels = ["Front", "Middle", "Rear"].flatMap((position) => {
    const sides = wheels.get(position);
    if (!sides) return [];
    if (sides.size === 2) return [`${position} wheels`];
    return [...sides].map((side) => `${side} ${position.toLowerCase()} wheel`);
  });
  return { labels, rest };
}

export function partTagLabel(tag: string): string {
  const label = partLabels.get(tag);
  if (label !== undefined) return label;
  if (TRACKS.test(tag)) return "Tracks";
  return fallbackLabel(tag);
}

export function partLabel(hitLocations: readonly string[]): string {
  if (hitLocations.length === 0) return WHOLE_VEHICLE;
  const { labels, rest } = wheelLabels(hitLocations);
  const all = [...labels, ...rest.map(partTagLabel)];
  return [...new Set(all)].join(", ");
}

function isWholeVehicle(hitLocations: readonly string[]): boolean {
  return hitLocations.length === 0 || hitLocations.every((location) => sameId(location, GENERIC_VEHICLE_ENTITY));
}

export function rulesForVehicle(rules: readonly DamageRule[], damageEntity: string | null | undefined): DamageRule[] {
  return rules.filter(
    (rule) =>
      sameId(rule.entity, GENERIC_VEHICLE_ENTITY) ||
      (damageEntity !== null && damageEntity !== undefined && sameId(rule.entity, damageEntity)),
  );
}

export function vulnerabilityRow(rule: DamageRule, index: number): VulnerabilityRow {
  return {
    key: `${rule.entity}#${index}`,
    source: sourceLabel(rule.source),
    part: partLabel(rule.hitLocations),
    wholeVehicle: isWholeVehicle(rule.hitLocations),
    amount: rule.amount,
    kind: rule.operation.toLowerCase().startsWith("percentage") ? "percent" : "flat",
    special: rule.custom !== null && rule.custom !== undefined && rule.custom !== "",
  };
}

export function vulnerabilities(
  rules: readonly DamageRule[],
  damageEntity: string | null | undefined,
): VulnerabilityRow[] {
  return rulesForVehicle(rules, damageEntity)
    .map(vulnerabilityRow)
    .sort((a, b) => {
      if (a.special !== b.special) return a.special ? 1 : -1;
      return b.amount - a.amount;
    });
}
