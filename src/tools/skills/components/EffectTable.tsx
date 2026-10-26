import { DataTable, StatDelta, type Column } from "@/ui";
import type { EffectLevel, EffectRow } from "../logic/skillEffects";
import { formatEffectChange, formatEffectValue } from "./effectFormat";

export interface EffectTableProps {
  effect: EffectRow;
}

export function EffectTable({ effect }: EffectTableProps) {
  const columns: Column<EffectLevel>[] = [
    { key: "level", header: "Level", value: (row) => row.level, align: "end" },
    {
      key: "value",
      header: "Value",
      value: (row) => row.value,
      render: (row) => formatEffectValue(row.value, effect.unit),
      align: "end",
    },
    {
      key: "change",
      header: "Change from level 0",
      value: (row) => row.change,
      render: (row) =>
        row.change === null ? (
          "—"
        ) : (
          <StatDelta
            from={0}
            to={row.change}
            betterWhen={effect.betterWhen}
            format={(magnitude) => formatEffectChange(magnitude, effect.unit)}
          />
        ),
      align: "end",
    },
  ];
  return (
    <DataTable
      aria-label={`${effect.label} by level`}
      columns={columns}
      rows={effect.levels}
      getRowKey={(row) => String(row.level)}
      emptyText="No values by level in the game files."
    />
  );
}
