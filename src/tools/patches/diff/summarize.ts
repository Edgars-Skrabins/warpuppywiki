import { EMPTY_VALUE, formatCash, formatNumber, formatPercent } from "@/ui";
import { isRecord, normalizePath, valuesEqual } from "./deepDiff";
import type { FieldChange } from "./types";

export const FIELD_LABELS: Readonly<Record<string, string>> = {
  name: "Name",
  asset: "File path",
  rpm: "RPM",
  muzzleVelocity: "Muzzle velocity",
  effectiveRange: "Effective range",
  damage: "Damage",
  adsTime: "ADS time",
  accuracy: "Accuracy",
  randomDeviation: "Random deviation",
  meleeDamage: "Melee damage",
  suppressionMultiplier: "Suppression multiplier",
  suppression: "Suppression",
  fireModes: "Fire modes",
  calibers: "Calibers",
  tags: "Tags",
  weight: "Weight",
  maxStack: "Max stack",
  durability: "Durability",
  unlock: "Unlock",
  "unlock.level": "Unlock level",
  "unlock.cost": "Unlock cost",
  "unlock.role": "Unlock role",
  vendor: "Vendor",
  "vendor[]": "Vendor entry",
  "vendor[].price": "Price",
  "vendor[].amount": "Vendor amount",
  "damageFalloff[]": "Falloff point",
  "damageFalloff[].multiplier": "Falloff",
  "damageFalloff[].interpolation": "Falloff interpolation",
  "recoil.pattern": "Recoil pattern",
  "recoil.patternResetTime": "Recoil reset time",
  "recoil.viewKickMultiplier": "View kick",
  "recoil.afterPatternPitch[]": "Pitch after pattern",
  windupTime: "Windup time",
  roundsPerBurst: "Rounds per burst",
  "penetration.effectivenessMultiplier": "Penetration effectiveness",
  "explosive.radius": "Explosion radius",
  "explosive.effectiveRadius": "Explosion effective radius",
  "explosive.minimumDamage": "Explosion minimum damage",
  "magazine.capacity": "Magazine capacity",
  "stages[].damageReduction": "Damage reduction",
  fuelEconomy: "Fuel economy",
  seats: "Seats",
  minWeightKg: "Minimum weight",
  "slots[]": "Slot",
  "slots[].items": "Items",
  "slots[].contexts": "Contexts",
  "slots[].blockedItems": "Blocked items",
  "slots[].blockedContexts": "Blocked contexts",
  "slots[].hidden": "Slot hidden",
  contexts: "Contexts",
  typicalSpeed: "Typical speed",
  massKg: "Mass",
  mass: "Mass",
  maxSpeed: "Max speed",
  maxFuel: "Max fuel",
  "health.initial": "Health",
  cost: "Cost",
  maxHealth: "Max health",
  amount: "Amount",
  "levels[]": "Level",
  "levels[].xp": "XP",
  "levels[].value": "Value",
  spawnChance: "Spawn chance",
  respawnTime: "Respawn time",
  "items[]": "Entry",
  "items[].weight": "Weight",
  "items[].amount": "Amount",
  text: "Text",
  goldBars: "Gold bars",
  source: "Sources",
  target: "Targets",
  instigator: "Instigators",
  hitLocations: "Hit locations",
  coveredLocations: "Covered locations",
};

const CASH_PATHS = new Set(["vendor[].price", "unlock.cost"]);

export const FIELD_UNITS: Readonly<Record<string, string>> = {
  muzzleVelocity: "m/s",
  effectiveRange: "m",
  "explosive.radius": "m",
  "explosive.effectiveRadius": "m",
  massKg: "kg",
  minWeightKg: "kg",
};

const HIDDEN_KEY_ARRAYS = new Set(["vendor"]);

export const SUMMARIZED_PATTERN = "recoil.pattern";

const MINUS = "−";

function keysIn(path: string): string[] {
  return [...path.matchAll(/(\w+)\[([^\]]+)\]/g)]
    .filter((match) => !HIDDEN_KEY_ARRAYS.has(match[1]!))
    .map((match) => (match[2]!.startsWith("#") ? `#${Number(match[2]!.slice(1)) + 1}` : match[2]!));
}

function withKeys(label: string, path: string): string {
  const keys = keysIn(path);
  return keys.length > 0 ? `${label} (${keys.join(", ")})` : label;
}

export function fieldLabel(path: string): string {
  const label = FIELD_LABELS[normalizePath(path)];
  return label === undefined ? path : withKeys(label, path);
}

export function isScalar(value: unknown): boolean {
  return value === null || value === undefined || typeof value !== "object";
}

function formatValue(value: unknown, cash: boolean): string {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }
  if (typeof value === "number") {
    return cash ? formatCash(value) : formatNumber(value, { maxFractionDigits: 4 });
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function isRecoilPatternChange(change: FieldChange): boolean {
  return normalizePath(change.path) === SUMMARIZED_PATTERN && change.kind === "changed";
}

export function isCashPath(path: string): boolean {
  return CASH_PATHS.has(normalizePath(path));
}

export function formatFieldValue(path: string, value: unknown): string {
  if (normalizePath(path) === SUMMARIZED_PATTERN && Array.isArray(value)) {
    return `${formatNumber(value.length)} ${value.length === 1 ? "shot" : "shots"}`;
  }
  if (Array.isArray(value) && value.every(isScalar)) {
    return value.length === 0 ? EMPTY_VALUE : value.map((entry) => formatValue(entry, isCashPath(path))).join(", ");
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([field, entry]) => `${field} ${formatValue(entry, false)}`)
      .join(", ");
  }
  return formatValue(value, isCashPath(path));
}

export function valueChange(path: string, before: unknown, after: unknown): string {
  const unit = FIELD_UNITS[normalizePath(path)];
  const text = `${formatFieldValue(path, before)} → ${formatFieldValue(path, after)}`;
  return unit === undefined ? text : `${text} ${unit}`;
}

function differingShots(before: unknown, after: unknown): number {
  const a = Array.isArray(before) ? before : [];
  const b = Array.isArray(after) ? after : [];
  let count = 0;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if (index >= a.length || index >= b.length || !valuesEqual(a[index], b[index])) {
      count += 1;
    }
  }
  return count;
}

function numberChange(label: string, before: number, after: number, cash: boolean): string {
  const text = `${label} ${formatValue(before, cash)} → ${formatValue(after, cash)}`;
  if (cash || before === 0) {
    return text;
  }
  return `${text} (${formatPercent((after - before) / Math.abs(before), { signed: true })})`;
}

export function summarizeChange(change: FieldChange): string {
  const label = fieldLabel(change.path);
  const cash = CASH_PATHS.has(normalizePath(change.path));
  if (normalizePath(change.path) === SUMMARIZED_PATTERN) {
    const shots = differingShots(change.before, change.after);
    return `Recoil pattern changed: ${shots} ${shots === 1 ? "shot differs" : "shots differ"}`;
  }
  if (change.kind === "added") {
    return isScalar(change.after) ? `${label} added: ${formatValue(change.after, cash)}` : `${label} added`;
  }
  if (change.kind === "removed") {
    return isScalar(change.before) ? `${label} removed (was ${formatValue(change.before, cash)})` : `${label} removed`;
  }
  if (typeof change.before === "number" && typeof change.after === "number") {
    return numberChange(label, change.before, change.after, cash);
  }
  if (isScalar(change.before) && isScalar(change.after)) {
    return `${label} ${formatValue(change.before, cash)} → ${formatValue(change.after, cash)}`;
  }
  if (change.before === null || change.before === undefined) {
    return `${label} added`;
  }
  if (change.after === null || change.after === undefined) {
    return `${label} removed`;
  }
  return `${label} changed`;
}

function noun(label: string, count: number): string {
  const word = label.toLowerCase();
  return count === 1 && word.endsWith("s") ? word.slice(0, -1) : word;
}

function summarizeSet(path: string, changes: readonly FieldChange[]): string {
  const arrayPath = path.slice(0, -2);
  const label = FIELD_LABELS[normalizePath(arrayPath)];
  const added = changes.filter((change) => change.kind === "added").length;
  const removed = changes.filter((change) => change.kind === "removed").length;
  const word = (count: number) => (label === undefined ? arrayPath : noun(label, count));
  const parts = [
    ...(added > 0 ? [`+${added} ${word(added)}`] : []),
    ...(removed > 0 ? [`${MINUS}${removed} ${word(removed)}`] : []),
  ];
  const keys = label === undefined ? [] : keysIn(arrayPath);
  return keys.length > 0 ? `${parts.join(", ")} (${keys.join(", ")})` : parts.join(", ");
}

export interface ChangeGroup {
  setPath: string | null;
  changes: FieldChange[];
}

export function groupChanges(changes: readonly FieldChange[]): ChangeGroup[] {
  const groups = new Map<string, FieldChange[]>();
  changes.forEach((change, index) => {
    const id = change.path.endsWith("[]") ? change.path : `#${index}`;
    groups.set(id, [...(groups.get(id) ?? []), change]);
  });
  return [...groups.entries()].map(([id, group]) => ({ setPath: id.startsWith("#") ? null : id, changes: group }));
}

export function summarizeGroup(group: ChangeGroup): string {
  return group.setPath === null ? summarizeChange(group.changes[0]!) : summarizeSet(group.setPath, group.changes);
}

export function summarizeChanges(changes: readonly FieldChange[]): string[] {
  return groupChanges(changes).map(summarizeGroup);
}
