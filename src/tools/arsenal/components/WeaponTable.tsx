import { useMemo } from "react";
import {
  DataTable,
  EMPTY_VALUE,
  formatCash,
  formatDistance,
  formatNumber,
  formatSeconds,
  ItemIcon,
  type Column,
} from "@/ui";
import type { WeaponRow } from "../logic/weaponRows";
import { formatList, formatUnlock } from "./formatValue";
import styles from "./WeaponTable.module.css";

export interface WeaponTableProps {
  rows: readonly WeaponRow[];
  onOpen: (row: WeaponRow) => void;
}

function speed(value: number | null): string {
  return value === null ? EMPTY_VALUE : `${formatNumber(value, { maxFractionDigits: 0 })} m/s`;
}

export function WeaponTable({ rows, onOpen }: WeaponTableProps) {
  const columns = useMemo<Column<WeaponRow>[]>(
    () => [
      {
        key: "name",
        header: "Weapon",
        value: (row) => row.name,
        render: (row) => (
          <span className={styles.name}>
            <ItemIcon icon={row.icon} name={row.name} size={24} shape="wide" />
            <span>{row.name}</span>
          </span>
        ),
        sortable: true,
      },
      { key: "archetype", header: "Class", value: (row) => row.archetypeLabel, sortable: true },
      {
        key: "caliber",
        header: "Caliber",
        value: (row) => formatList(row.calibers.map((caliber) => caliber.label)),
        sortable: true,
      },
      { key: "damage", header: "Damage", value: (row) => row.damage, sortable: true, betterWhen: "higher" },
      { key: "rpm", header: "RPM", value: (row) => row.rpm, sortable: true, betterWhen: "higher" },
      {
        key: "dps",
        header: "Raw DPS",
        value: (row) => row.dps,
        render: (row) => formatNumber(row.dps, { maxFractionDigits: 0 }),
        sortable: true,
        betterWhen: "higher",
      },
      {
        key: "velocity",
        header: "Velocity",
        value: (row) => row.muzzleVelocity,
        render: (row) => speed(row.muzzleVelocity),
        sortable: true,
      },
      {
        key: "effectiveRange",
        header: "Eff. range",
        value: (row) => row.effectiveRange,
        render: (row) => formatDistance(row.effectiveRange),
        sortable: true,
      },
      {
        key: "fullDamageRange",
        header: "Full dmg",
        value: (row) => row.fullDamageRange,
        render: (row) => formatDistance(row.fullDamageRange),
        sortable: true,
      },
      {
        key: "adsTime",
        header: "ADS",
        value: (row) => row.adsTime,
        render: (row) => formatSeconds(row.adsTime),
        sortable: true,
        betterWhen: "lower",
      },
      {
        key: "stk",
        header: <abbr title="Shots to kill at 50 m, upper chest, no armor, FMJ">STK 50 m</abbr>,
        value: (row) => row.stk,
        sortable: true,
        betterWhen: "lower",
      },
      {
        key: "price",
        header: "Price",
        value: (row) => row.price,
        render: (row) => formatCash(row.price),
        sortable: true,
      },
      {
        key: "unlock",
        header: "Unlock",
        value: (row) => row.unlock?.level ?? null,
        render: (row) => formatUnlock(row.unlock),
        align: "start",
        sortable: true,
      },
    ],
    [],
  );

  return (
    <DataTable
      aria-label="Weapons"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      onRowClick={onOpen}
      emptyText="No weapons match these filters"
    />
  );
}
