import { EMPTY_VALUE, formatCash, formatNumber, formatPercent } from "@/ui";
import { normalizePath, valuesEqual } from "./deepDiff";
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

const HIDDEN_KEY_ARRAYS = new Set(["vendor"]);

const SUMMARIZED_PATTERN = "recoil.pattern";

const MINUS = "−";

function keysIn(path: string): string[] {
  return [...path.matchAll(/(\w+)\[([^\]#][^\]]*)\]/g)]
    .filter((match) => !HIDDEN_KEY_ARRAYS.has(match[1]!))
    .map((match) => match[2]!);
}

function withKeys(label: string, path: string): string {
  const keys = keysIn(path);
  return keys.length > 0 ? `${label} (${keys.join(", ")})` : label;
}

export function fieldLabel(path: string): string {
  const label = FIELD_LABELS[normalizePath(path)];
  return label === undefined ? path : withKeys(label, path);
}

function isScalar(value: unknown): boolean {
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

export function summarizeChanges(changes: readonly FieldChange[]): string[] {
  const groups = new Map<string, FieldChange[]>();
  changes.forEach((change, index) => {
    const id = change.path.endsWith("[]") ? change.path : `#${index}`;
    groups.set(id, [...(groups.get(id) ?? []), change]);
  });
  return [...groups.entries()].map(([id, group]) =>
    id.startsWith("#") ? summarizeChange(group[0]!) : summarizeSet(id, group),
  );
}
