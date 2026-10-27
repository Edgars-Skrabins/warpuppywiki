import {
  DEFAULT_DIFF_OPTIONS,
  type BuildFiles,
  type CategoryDefinition,
  type CollectionDefinition,
  type DiffContext,
} from "./categories";
import { deepDiff } from "./deepDiff";
import { flattenRecord } from "./flatten";
import type { CategoryDiff, DiffOptions, DiffRecord, EntityDiff, EntityStatus, FieldChange, FieldValue } from "./types";

export interface DiffCategoryOptions {
  showAssets: boolean;
}

interface EntityEntry {
  key: string;
  name: string;
  inFrom: boolean;
  inTo: boolean;
  changes: FieldChange[];
  seen: Set<string>;
  fields: FieldValue[];
}

export function diffOptionsFor(collection: CollectionDefinition, showAssets: boolean): DiffOptions {
  const options = { ...DEFAULT_DIFF_OPTIONS, ...collection.options };
  return showAssets ? { ...options, ignore: options.ignore.filter((field) => field !== "asset") } : options;
}

function keyedRecords(
  collection: CollectionDefinition,
  files: BuildFiles,
  filter: ((record: DiffRecord) => boolean) | undefined,
): Map<string, DiffRecord> {
  const selected = collection.select(files[collection.file]).filter((record) => filter?.(record) ?? true);
  const keys = collection.key(selected);
  return new Map(selected.map((record, index) => [keys[index]!, record]));
}

function changeId(change: FieldChange): string {
  return JSON.stringify([change.path, change.kind, change.before, change.after]);
}

function addCollection(
  entries: Map<string, EntityEntry>,
  collection: CollectionDefinition,
  context: DiffContext,
  options: DiffCategoryOptions,
): void {
  const filter = collection.filter?.(context);
  const before = keyedRecords(collection, context.from, filter);
  const after = keyedRecords(collection, context.to, filter);
  const diffOptions = diffOptionsFor(collection, options.showAssets);
  const keys = [...before.keys(), ...[...after.keys()].filter((key) => !before.has(key))];
  for (const key of keys) {
    const from = before.get(key);
    const to = after.get(key);
    const entityKey = `${collection.group}:${key}`;
    let entry = entries.get(entityKey);
    if (!entry) {
      entry = {
        key: entityKey,
        name: collection.name((to ?? from)!),
        inFrom: false,
        inTo: false,
        changes: [],
        seen: new Set(),
        fields: [],
      };
      entries.set(entityKey, entry);
    }
    entry.inFrom ||= from !== undefined;
    entry.inTo ||= to !== undefined;
    if (!from || !to) {
      const known = new Set(entry.fields.map((field) => field.path));
      entry.fields.push(...flattenRecord((to ?? from)!, diffOptions).filter((field) => !known.has(field.path)));
    } else {
      for (const change of deepDiff(from, to, diffOptions)) {
        const id = changeId(change);
        if (!entry.seen.has(id)) {
          entry.seen.add(id);
          entry.changes.push(change);
        }
      }
    }
  }
}

function toEntity(entry: EntityEntry): EntityDiff {
  const status: EntityStatus = !entry.inFrom ? "added" : !entry.inTo ? "removed" : "changed";
  const entity = { key: entry.key, name: entry.name || entry.key, status };
  return status === "changed"
    ? { ...entity, changes: entry.changes }
    : { ...entity, changes: [], fields: entry.fields };
}

export function diffCategory(
  definition: CategoryDefinition,
  from: BuildFiles,
  to: BuildFiles,
  options: DiffCategoryOptions,
): CategoryDiff {
  const context: DiffContext = { from, to };
  const entries = new Map<string, EntityEntry>();
  for (const collection of definition.collections) {
    addCollection(entries, collection, context, options);
  }
  const entities = [...entries.values()]
    .map(toEntity)
    .filter((entity) => entity.status !== "changed" || entity.changes.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
  return {
    id: definition.id,
    label: definition.label,
    entities,
    counts: {
      added: entities.filter((entity) => entity.status === "added").length,
      removed: entities.filter((entity) => entity.status === "removed").length,
      changed: entities.filter((entity) => entity.status === "changed").length,
    },
    notes: definition.notes?.(context) ?? [],
  };
}
