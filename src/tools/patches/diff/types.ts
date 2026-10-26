export type ChangeKind = "changed" | "added" | "removed";

export interface FieldChange {
  path: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
}

export type EntityStatus = "added" | "removed" | "changed";

export interface EntityDiff {
  key: string;
  name: string;
  status: EntityStatus;
  changes: FieldChange[];
}

export interface CategoryCounts {
  added: number;
  removed: number;
  changed: number;
}

export interface CategoryDiff {
  id: string;
  label: string;
  entities: EntityDiff[];
  counts: CategoryCounts;
  notes: string[];
}

export interface DiffOptions {
  ignore: string[];
  keyedArrays: Record<string, string>;
  setArrays: boolean;
  summarize: string[];
}

export type DiffRecord = Record<string, unknown>;
