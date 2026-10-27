import type { Vehicle, VehicleSeatDamage } from "@/core/data";
import { DataTable, formatPercent, type Column } from "@/ui";
import { ARMS_CLASSES, vehicleSeatRows, type VehicleSeatRow } from "../logic/vehicleSeatRows";
import styles from "./ReferenceTable.module.css";

export interface VehicleSeatsTableProps {
  seats: readonly VehicleSeatDamage[];
  vehicles: readonly Vehicle[];
}

const columns: readonly Column<VehicleSeatRow>[] = [
  { key: "name", header: "Vehicle", value: (row) => row.name, sortable: true },
  ...ARMS_CLASSES.map<Column<VehicleSeatRow>>((armsClass) => ({
    key: armsClass,
    header: armsClass,
    value: (row) => row.reductions[armsClass],
    render: (row) => {
      const reduction = row.reductions[armsClass];
      return reduction === null ? "—" : formatPercent(reduction / 100, { signed: true });
    },
    align: "end",
    sortable: true,
  })),
];

export function VehicleSeatsTable({ seats, vehicles }: VehicleSeatsTableProps) {
  return (
    <div className={styles.section}>
      <p className={styles.note}>
        Damage to occupants of these vehicles is reduced by the attacking weapon's arms class. Vehicles not listed give
        no seat protection.
      </p>
      <DataTable
        aria-label="Vehicle seat protection"
        columns={columns}
        rows={vehicleSeatRows(seats, vehicles)}
        getRowKey={(row) => row.vehicle}
        emptyText="No vehicle seat rules in this build."
      />
    </div>
  );
}
