import { normalizeKey } from "./keys";
import type { DiffOptions, DiffRecord, FieldChange } from "./types";

const EPSILON = 1e-9;

export function isRecord(value: unknown): value is DiffRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizePath(path: string): string {
  return path.replace(/\[[^\]]*\]/g, "[]");
}

function fieldPath(path: string, field: string): string {
  return path === "" ? field : `${path}.${field}`;
}

export function valuesEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= EPSILON;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => valuesEqual(item, b[index]));
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((key) => Object.hasOwn(a, key) && Object.hasOwn(b, key) && valuesEqual(a[key], b[key]));
  }
  return a === b;
}

function keyedEntries(items: readonly unknown[], keyField: string): Map<string, { label: string; value: unknown }> {
  const entries = new Map<string, { label: string; value: unknown }>();
  for (const item of items) {
    const label = String((item as DiffRecord)[keyField]);
    let key = normalizeKey(label);
    let occurrence = 1;
    while (entries.has(key)) {
      occurrence += 1;
      key = `${normalizeKey(label)}#${occurrence}`;
    }
    entries.set(key, { label: occurrence === 1 ? label : `${label}#${occurrence}`, value: item });
  }
  return entries;
}

function withoutField(record: DiffRecord, field: string): DiffRecord {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== field));
}

function isKeyable(items: readonly unknown[], keyField: string): boolean {
  return items.every((item) => isRecord(item) && item[keyField] !== undefined && item[keyField] !== null);
}

function isStringArray(items: readonly unknown[]): items is string[] {
  return items.every((item) => typeof item === "string");
}

class Differ {
  readonly changes: FieldChange[] = [];

  constructor(private readonly options: DiffOptions) {}

  walk(a: unknown, b: unknown, path: string, field: string): void {
    if (Array.isArray(a) && Array.isArray(b)) {
      this.array(a, b, path, field);
    } else if (isRecord(a) && isRecord(b)) {
      this.record(a, b, path);
    } else if (!valuesEqual(a, b)) {
      this.changes.push({ path, kind: "changed", before: a, after: b });
    }
  }

  private ignored(field: string, path: string): boolean {
    return this.options.ignore.includes(field) || this.options.ignore.includes(normalizePath(path));
  }

  private record(a: DiffRecord, b: DiffRecord, path: string): void {
    const fields = [...Object.keys(a), ...Object.keys(b).filter((field) => !Object.hasOwn(a, field))];
    for (const field of fields) {
      const childPath = fieldPath(path, field);
      if (this.ignored(field, childPath)) {
        continue;
      }
      this.child(a, b, field, childPath, field);
    }
  }

  private child(a: DiffRecord, b: DiffRecord, key: string, childPath: string, field: string): void {
    if (!Object.hasOwn(a, key)) {
      this.changes.push({ path: childPath, kind: "added", after: b[key] });
    } else if (!Object.hasOwn(b, key)) {
      this.changes.push({ path: childPath, kind: "removed", before: a[key] });
    } else if (this.options.summarize.includes(normalizePath(childPath))) {
      if (!valuesEqual(a[key], b[key])) {
        this.changes.push({ path: childPath, kind: "changed", before: a[key], after: b[key] });
      }
    } else {
      this.walk(a[key], b[key], childPath, field);
    }
  }

  private array(a: unknown[], b: unknown[], path: string, field: string): void {
    const keyField = this.options.keyedArrays[field];
    if (keyField !== undefined && isKeyable(a, keyField) && isKeyable(b, keyField)) {
      this.keyed(a, b, path, field, keyField);
    } else if (this.options.setArrays && isStringArray(a) && isStringArray(b)) {
      this.set(a, b, path);
    } else {
      this.positional(a, b, path, field);
    }
  }

  private keyed(a: unknown[], b: unknown[], path: string, field: string, keyField: string): void {
    const before = keyedEntries(a, keyField);
    const after = keyedEntries(b, keyField);
    const keys = [...before.keys(), ...[...after.keys()].filter((key) => !before.has(key))];
    const labelled: DiffRecord = {};
    const left: DiffRecord = {};
    const right: DiffRecord = {};
    for (const key of keys) {
      const from = before.get(key);
      const to = after.get(key);
      labelled[key] = (to ?? from)!.label;
      if (from && to) {
        left[key] = withoutField(from.value as DiffRecord, keyField);
        right[key] = withoutField(to.value as DiffRecord, keyField);
      } else if (from) {
        left[key] = from.value;
      } else if (to) {
        right[key] = to.value;
      }
    }
    for (const key of keys) {
      this.child(left, right, key, `${path}[${labelled[key] as string}]`, field);
    }
  }

  private set(a: string[], b: string[], path: string): void {
    const before = new Set(a.map(normalizeKey));
    const after = new Set(b.map(normalizeKey));
    for (const value of a) {
      if (!after.has(normalizeKey(value))) {
        this.changes.push({ path: `${path}[]`, kind: "removed", before: value });
      }
    }
    for (const value of b) {
      if (!before.has(normalizeKey(value))) {
        this.changes.push({ path: `${path}[]`, kind: "added", after: value });
      }
    }
  }

  private positional(a: unknown[], b: unknown[], path: string, field: string): void {
    const length = Math.max(a.length, b.length);
    for (let index = 0; index < length; index += 1) {
      const childPath = `${path}[#${index}]`;
      if (index >= a.length) {
        this.changes.push({ path: childPath, kind: "added", after: b[index] });
      } else if (index >= b.length) {
        this.changes.push({ path: childPath, kind: "removed", before: a[index] });
      } else {
        this.walk(a[index], b[index], childPath, field);
      }
    }
  }
}

export function deepDiff(a: unknown, b: unknown, options: DiffOptions): FieldChange[] {
  const differ = new Differ(options);
  differ.walk(a, b, "", "");
  return differ.changes;
}
