import { isRecord, normalizePath } from "./deepDiff";
import { text } from "./keys";
import type { DiffOptions, DiffRecord, FieldValue } from "./types";

function fieldPath(path: string, field: string): string {
  return path === "" ? field : `${path}.${field}`;
}

function isScalarList(value: unknown[]): boolean {
  return value.every((item) => item === null || typeof item !== "object");
}

function walk(value: unknown, path: string, field: string, options: DiffOptions, out: FieldValue[]): void {
  if (Array.isArray(value)) {
    if (isScalarList(value) || options.summarize.includes(normalizePath(path))) {
      out.push({ path, value });
      return;
    }
    const keyField = options.keyedArrays[field];
    value.forEach((item, index) => {
      const label = keyField !== undefined && isRecord(item) ? text(item[keyField]) : "";
      const key = label === "" ? `#${index}` : label;
      walk(item, `${path}[${key}]`, field, options, out);
    });
    return;
  }
  if (isRecord(value)) {
    for (const [child, childValue] of Object.entries(value)) {
      const childPath = fieldPath(path, child);
      if (!options.ignore.includes(child) && !options.ignore.includes(normalizePath(childPath))) {
        walk(childValue, childPath, child, options, out);
      }
    }
    return;
  }
  out.push({ path, value });
}

export function flattenRecord(record: DiffRecord, options: DiffOptions): FieldValue[] {
  const out: FieldValue[] = [];
  walk(record, "", "", options, out);
  return out;
}
