import { normalizePath } from "../diff/deepDiff";
import { fieldLabel, valueChange } from "../diff/summarize";
import type { CategoryDiff, EntityDiff, EntityStatus } from "../diff/types";
import { classify, impactText } from "./classify";
import { IMPACT_RULES, ITEM_RULES_CATEGORY } from "./impactRules";

export const NOTABLE_LIMIT = 12;

export interface NotableLine {
  text: string;
  categoryId: string;
  entityKey: string | null;
  filter: Exclude<EntityStatus, "changed"> | null;
}

const CATEGORY_ORDER: readonly string[] = ["weapons", "ammo", "armor", "attachments", "vehicles"];

const PRICES_GROUP = CATEGORY_ORDER.length;

const LISTED_ENTITIES: Readonly<Record<string, { group: string; one: string; many: string }>> = {
  weapons: { group: "weapon", one: "weapon", many: "weapons" },
  armor: { group: "armor", one: "armor", many: "armor" },
  vehicles: { group: "vehicle", one: "vehicle", many: "vehicles" },
};

interface RankedLine {
  group: number;
  line: NotableLine;
}

function isPriceOrUnlock(path: string): boolean {
  return Object.hasOwn(IMPACT_RULES[ITEM_RULES_CATEGORY] ?? {}, normalizePath(path));
}

function statusLine(diff: CategoryDiff, status: "added" | "removed"): NotableLine | null {
  const listed = LISTED_ENTITIES[diff.id];
  if (!listed) {
    return null;
  }
  const names = diff.entities
    .filter((entity) => entity.status === status && entity.key.startsWith(`${listed.group}:`))
    .map((entity) => entity.name);
  if (names.length === 0) {
    return null;
  }
  const noun = names.length === 1 ? listed.one : listed.many;
  const word = status === "added" ? "new" : "removed";
  return {
    text: `${names.length} ${word} ${noun}: ${names.join(", ")}`,
    categoryId: diff.id,
    entityKey: null,
    filter: status,
  };
}

function changeLines(diff: CategoryDiff, entity: EntityDiff, group: number): RankedLine[] {
  return entity.changes.flatMap((change) => {
    const impact = classify(diff.id, change, entity.key);
    if (impact !== "buff" && impact !== "nerf") {
      return [];
    }
    const values = valueChange(change.path, change.before, change.after);
    const text = `${entity.name}: ${fieldLabel(change.path)} ${values} (${impactText(impact)})`;
    return [
      {
        group: isPriceOrUnlock(change.path) ? PRICES_GROUP : group,
        line: { text, categoryId: diff.id, entityKey: entity.key, filter: null },
      },
    ];
  });
}

export function notableChanges(categoryDiffs: readonly CategoryDiff[], limit = NOTABLE_LIMIT): NotableLine[] {
  const ranked: RankedLine[] = [];
  for (const diff of categoryDiffs) {
    const index = CATEGORY_ORDER.indexOf(diff.id);
    const group = index === -1 ? PRICES_GROUP : index;
    for (const status of ["added", "removed"] as const) {
      const line = statusLine(diff, status);
      if (line) {
        ranked.push({ group, line });
      }
    }
    for (const entity of diff.entities) {
      ranked.push(...changeLines(diff, entity, group));
    }
  }
  return ranked
    .map((entry, order) => ({ ...entry, order }))
    .sort((a, b) => a.group - b.group || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.line);
}
