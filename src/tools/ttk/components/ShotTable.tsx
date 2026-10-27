import { hitLocationLabel, type ShotResult } from "@/core/damage";
import { DataTable, formatNumber, type Column } from "@/ui";

export interface ShotTableProps {
  shots: readonly ShotResult[];
}

function healthDamage(shot: ShotResult): number {
  return shot.hits.reduce((sum, hit) => sum + hit.healthDamage, 0);
}

const COLUMNS: readonly Column<ShotResult>[] = [
  { key: "shot", header: "Shot", value: (shot) => shot.shot, align: "end", sortable: true },
  { key: "zone", header: "Zone", value: (shot) => hitLocationLabel(shot.location), sortable: true },
  {
    key: "damage",
    header: "Damage",
    value: healthDamage,
    render: (shot) => formatNumber(healthDamage(shot), { maxFractionDigits: 1 }),
    align: "end",
    sortable: true,
  },
  {
    key: "health",
    header: "Health left",
    value: (shot) => shot.healthAfter,
    render: (shot) => formatNumber(shot.healthAfter, { maxFractionDigits: 1 }),
    align: "end",
  },
  {
    key: "body",
    header: "Body armor left",
    value: (shot) => shot.bodyDurabilityAfter,
    render: (shot) => formatNumber(shot.bodyDurabilityAfter, { maxFractionDigits: 1 }),
    align: "end",
  },
  {
    key: "helmet",
    header: "Helmet left",
    value: (shot) => shot.helmetDurabilityAfter,
    render: (shot) => formatNumber(shot.helmetDurabilityAfter, { maxFractionDigits: 1 }),
    align: "end",
  },
];

export function ShotTable({ shots }: ShotTableProps) {
  return (
    <DataTable
      aria-label="Shot by shot"
      columns={COLUMNS}
      rows={shots}
      getRowKey={(shot) => `${shot.shot}`}
      emptyText="No shots"
      maxHeight={360}
    />
  );
}
