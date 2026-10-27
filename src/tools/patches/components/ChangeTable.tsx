import { Badge, DataTable, EMPTY_VALUE, formatDelta, formatPercent, type BadgeTone, type Column } from "@/ui";
import {
  fieldLabel,
  formatFieldValue,
  groupChanges,
  isCashPath,
  isRecoilPatternChange,
  summarizeGroup,
  type ChangeGroup,
} from "../diff/summarize";
import type { EntityDiff, FieldChange, FieldValue } from "../diff/types";
import { classify, impactRule, impactText, type Impact } from "../impact/classify";

export interface ChangeTableProps {
  categoryId: string;
  entity: EntityDiff;
}

interface ChangeRow {
  id: string;
  field: string;
  before: string;
  after: string;
  difference: string;
  impact: Impact | null;
}

function badgeTone(impact: Impact): BadgeTone {
  return impact === "buff" ? "success" : impact === "nerf" ? "danger" : "neutral";
}

function ImpactBadge({ impact }: { impact: Impact | null }) {
  if (impact === null) {
    return EMPTY_VALUE;
  }
  return <Badge tone={badgeTone(impact)}>{impactText(impact) ?? "Neutral"}</Badge>;
}

function difference(change: FieldChange): string {
  const { before, after, path } = change;
  if (change.kind !== "changed" || typeof before !== "number" || typeof after !== "number") {
    return EMPTY_VALUE;
  }
  const delta = formatDelta(before, after, isCashPath(path) ? "cash" : "number").text;
  return before === 0 ? delta : `${delta} (${formatPercent((after - before) / Math.abs(before), { signed: true })})`;
}

function joinValues(path: string, values: readonly unknown[]): string {
  return values.length === 0 ? EMPTY_VALUE : values.map((value) => formatFieldValue(path, value)).join(", ");
}

function groupRow(categoryId: string, entity: EntityDiff, group: ChangeGroup, index: number): ChangeRow {
  if (group.setPath !== null) {
    const path = group.setPath;
    return {
      id: `${index}`,
      field: fieldLabel(path.slice(0, -2)),
      before: joinValues(
        path,
        group.changes.filter((change) => change.kind === "removed").map((c) => c.before),
      ),
      after: joinValues(
        path,
        group.changes.filter((change) => change.kind === "added").map((c) => c.after),
      ),
      difference: summarizeGroup(group),
      impact: null,
    };
  }
  const change = group.changes[0]!;
  const known = impactRule(categoryId, change.path, entity.key) !== null;
  return {
    id: `${index}`,
    field: fieldLabel(change.path),
    before: change.kind === "added" ? EMPTY_VALUE : formatFieldValue(change.path, change.before),
    after: change.kind === "removed" ? EMPTY_VALUE : formatFieldValue(change.path, change.after),
    difference: difference(change),
    impact: known ? classify(categoryId, change, entity.key) : null,
  };
}

const CHANGE_COLUMNS: readonly Column<ChangeRow>[] = [
  { key: "field", header: "Field", value: (row) => row.field },
  { key: "before", header: "Before", value: (row) => row.before, align: "end" },
  { key: "after", header: "After", value: (row) => row.after, align: "end" },
  { key: "difference", header: "Difference", value: (row) => row.difference, align: "end" },
  {
    key: "impact",
    header: "Impact",
    value: (row) => (row.impact === null ? null : impactText(row.impact)),
    render: (row) => <ImpactBadge impact={row.impact} />,
  },
];

function FieldTable({ entity, fields }: { entity: EntityDiff; fields: readonly FieldValue[] }) {
  const header = entity.status === "added" ? "Value (new)" : "Value (removed)";
  const columns: Column<FieldValue>[] = [
    { key: "field", header: "Field", value: (field) => fieldLabel(field.path) },
    {
      key: "value",
      header,
      value: (field) => formatFieldValue(field.path, field.value),
    },
  ];
  return (
    <DataTable
      aria-label={`Fields of ${entity.name}`}
      columns={columns}
      rows={fields}
      getRowKey={(field) => field.path}
      emptyText="No fields"
    />
  );
}

export function ChangeTable({ categoryId, entity }: ChangeTableProps) {
  if (entity.status !== "changed") {
    return <FieldTable entity={entity} fields={entity.fields ?? []} />;
  }
  const rows = groupChanges(entity.changes.filter((change) => !isRecoilPatternChange(change))).map((group, index) =>
    groupRow(categoryId, entity, group, index),
  );
  if (rows.length === 0) {
    return null;
  }
  return (
    <DataTable
      aria-label={`Changes to ${entity.name}`}
      columns={CHANGE_COLUMNS}
      rows={rows}
      getRowKey={(row) => row.id}
      emptyText="No changes"
    />
  );
}
