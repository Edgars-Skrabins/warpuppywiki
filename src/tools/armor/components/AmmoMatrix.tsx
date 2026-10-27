import { useMemo } from "react";
import type { DamageFile } from "@/core/data";
import { AMMO_TYPE_LABELS, type AmmoTypeKey, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import { ComboBox, DataTable, formatMultiplier, formatNumber, formatPercent, Stack, type Column } from "@/ui";
import { ammoMatrix, bulletAmmo, type MatrixColumn, type MatrixRow } from "../logic/ammoMatrix";
import { ARMS_CLASSES, effectivenessRows, type EffectivenessRow } from "../logic/effectivenessText";
import { ModelNotes } from "./ModelNotes";
import styles from "./AmmoMatrix.module.css";

function ammoTypeLabel(ammoType: string): string {
  return AMMO_TYPE_LABELS[ammoType as AmmoTypeKey] ?? ammoType;
}

function matrixColumns(columns: readonly MatrixColumn[]): Column<MatrixRow>[] {
  return [
    { key: "ammo", header: "Ammo", value: (row) => row.label },
    ...columns.map((column, index): Column<MatrixRow> => ({
      key: column.key,
      header: column.label,
      value: (row) => row.cells[index]?.stk ?? null,
      render: (row) => {
        const cell = row.cells[index];
        return (
          <span className={styles.cell}>
            <span>{cell?.stk === null || cell === undefined ? "—" : `${formatNumber(cell.stk)} shots`}</span>
            {column.armor !== null && <span className={styles.reduction}>{formatPercent(cell?.reduction)} off</span>}
          </span>
        );
      },
    })),
  ];
}

const EFFECTIVENESS_COLUMNS: readonly Column<EffectivenessRow>[] = [
  { key: "ammo", header: "Ammo type", value: (row) => row.label },
  {
    key: "modifier",
    header: "Default",
    value: (row) => row.modifier,
    render: (row) => formatMultiplier(row.modifier),
  },
  ...ARMS_CLASSES.map((armsClass): Column<EffectivenessRow> => ({
    key: armsClass.key,
    header: armsClass.label,
    value: (row) => row.byArmsClass[armsClass.key] ?? null,
    render: (row) => formatMultiplier(row.byArmsClass[armsClass.key]),
  })),
  {
    key: "text",
    header: "What it means",
    value: (row) => row.lines.join(" "),
    render: (row) => (
      <span className={styles.lines}>
        {row.lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
    ),
  },
];

export interface AmmoMatrixProps {
  damage: DamageFile;
  index: WeaponIndex;
  weapons: readonly PlayerWeapon[];
  weapon: PlayerWeapon;
  onWeaponChange: (id: string) => void;
  columns: readonly MatrixColumn[];
  notes: readonly string[];
}

export function AmmoMatrix({ damage, index, weapons, weapon, onWeaponChange, columns, notes }: AmmoMatrixProps) {
  const rows = useMemo(
    () => ammoMatrix({ damage, weapon, ammoOptions: bulletAmmo(index, weapon), columns }),
    [damage, index, weapon, columns],
  );
  const effectiveness = useMemo(() => effectivenessRows(damage.ammoTypes, ammoTypeLabel), [damage]);
  const tableColumns = useMemo(() => matrixColumns(columns), [columns]);

  return (
    <Stack gap={4}>
      <ComboBox
        label="Reference weapon"
        items={weapons}
        getKey={(entry) => entry.id}
        getLabel={(entry) => entry.name}
        getGroup={(entry) => entry.archetype?.label ?? "Other"}
        selectedKey={weapon.id}
        onSelectionChange={(key) => key !== null && onWeaponChange(key)}
        description="Shots to kill at 50 m, upper chest, health 100, new armor."
        className={styles.picker}
      />
      <DataTable
        aria-label="Ammo against armor"
        columns={tableColumns}
        rows={rows}
        getRowKey={(row) => row.key}
        emptyText="This weapon has no bullet ammo"
      />
      <ModelNotes notes={notes} />
      <DataTable
        aria-label="Ammo-type armor effectiveness"
        columns={EFFECTIVENESS_COLUMNS}
        rows={effectiveness}
        getRowKey={(row) => row.ammoType}
        emptyText="No ammo-type effectiveness in this build"
      />
    </Stack>
  );
}
