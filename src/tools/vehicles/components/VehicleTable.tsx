import { useMemo, useState } from "react";
import { sameId } from "@/core/catalog";
import {
  Button,
  Checkbox,
  DataTable,
  formatCash,
  formatNumber,
  formatWeight,
  ItemIcon,
  Stack,
  type Column,
} from "@/ui";
import { MAX_COMPARE } from "../logic/vehicleCompare";
import {
  filterByTypes,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  type VehicleRow,
  type VehicleType,
} from "../logic/vehicleRows";
import { formatCompareValue, formatList, formatUnlock } from "./formatValue";
import styles from "./VehicleTable.module.css";

export interface VehicleTableProps {
  rows: readonly VehicleRow[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
  onCompare: () => void;
  onOpen: (row: VehicleRow) => void;
}

function isSelected(selectedIds: readonly string[], id: string): boolean {
  return selectedIds.some((selected) => sameId(selected, id));
}

export function VehicleTable({ rows, selectedIds, onToggle, onCompare, onOpen }: VehicleTableProps) {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const visible = useMemo(() => filterByTypes(rows, types), [rows, types]);
  const full = selectedIds.length >= MAX_COMPARE;

  const columns = useMemo<Column<VehicleRow>[]>(
    () => [
      {
        key: "name",
        header: "Vehicle",
        value: (row) => row.name,
        render: (row) => (
          <span className={styles.name}>
            <ItemIcon icon={row.icon} name={row.name} size={28} shape="wide" />
            <span>{row.name}</span>
          </span>
        ),
        sortable: true,
      },
      {
        key: "type",
        header: "Type",
        value: (row) => (row.type ? VEHICLE_TYPE_LABELS[row.type] : null),
        sortable: true,
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
        value: (row) => row.unlock?.cost ?? null,
        render: (row) => formatUnlock(row.unlock),
        align: "start",
        sortable: true,
      },
      {
        key: "topSpeed",
        header: "Top speed",
        value: (row) => row.topSpeed,
        render: (row) => formatCompareValue(row.topSpeed, "speed"),
        sortable: true,
      },
      {
        key: "fuel",
        header: "Fuel",
        value: (row) => row.fuel,
        render: (row) => formatCompareValue(row.fuel, "liters"),
        sortable: true,
      },
      {
        key: "range",
        header: "Range",
        value: (row) => row.range,
        render: (row) => formatCompareValue(row.range, "km"),
        sortable: true,
      },
      { key: "seats", header: "Seats", value: (row) => row.seats, sortable: true },
      { key: "health", header: "Health", value: (row) => row.health, sortable: true },
      { key: "critical", header: "Critical", value: (row) => row.criticalThreshold, sortable: true },
      { key: "weapons", header: "Weapons", value: (row) => formatList(row.weapons), sortable: true },
      {
        key: "counterMeasures",
        header: "Countermeasures",
        value: (row) => formatList(row.counterMeasures),
        sortable: true,
      },
      {
        key: "mass",
        header: "Mass",
        value: (row) => row.mass,
        render: (row) => formatWeight(row.mass),
        sortable: true,
      },
      {
        key: "select",
        header: "Compare",
        value: () => null,
        render: (row) => {
          const selected = isSelected(selectedIds, row.id);
          return (
            <Checkbox
              aria-label={`Compare ${row.name}`}
              isSelected={selected}
              isDisabled={!selected && full}
              onChange={() => onToggle(row.id)}
            />
          );
        },
      },
    ],
    [selectedIds, full, onToggle],
  );

  const toggleType = (type: VehicleType) =>
    setTypes((current) => (current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type]));

  return (
    <Stack gap={3}>
      <div className={styles.toolbar}>
        <div role="group" aria-label="Vehicle type" className={styles.filters}>
          {VEHICLE_TYPES.map((type) => (
            <Checkbox key={type} isSelected={types.includes(type)} onChange={() => toggleType(type)}>
              {VEHICLE_TYPE_LABELS[type]}
            </Checkbox>
          ))}
        </div>
        <Button variant="primary" isDisabled={selectedIds.length === 0} onPress={onCompare}>
          Compare ({formatNumber(selectedIds.length)})
        </Button>
      </div>
      <DataTable
        aria-label="Vehicles"
        columns={columns}
        rows={visible}
        getRowKey={(row) => row.id}
        initialSort={{ column: "name", direction: "ascending" }}
        onRowClick={onOpen}
        emptyText="No vehicles match these filters."
      />
    </Stack>
  );
}
