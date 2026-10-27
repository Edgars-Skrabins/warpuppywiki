import { hitLocationLabel, type HitLocation } from "@/core/damage";
import {
  Badge,
  DataTable,
  formatCash,
  formatNumber,
  formatPercent,
  formatWeight,
  ItemIcon,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  type Column,
} from "@/ui";
import type { ArmorKind, ArmorRow } from "../logic/armorRows";
import { BodyZones } from "./BodyZones";
import styles from "./ArmorTable.module.css";

const COLUMNS: readonly Column<ArmorRow>[] = [
  {
    key: "icon",
    header: "",
    value: () => null,
    render: (row) => <ItemIcon icon={row.icon} name={row.name} size={32} />,
    width: 48,
  },
  { key: "name", header: "Name", value: (row) => row.name, sortable: true },
  { key: "level", header: "Level", value: (row) => row.level, sortable: true },
  {
    key: "zones",
    header: "Covers",
    value: (row) => row.zones.length,
    align: "start",
    render: (row) =>
      row.zones.length === 0 ? (
        <span className={styles.muted}>Nothing</span>
      ) : (
        <span className={styles.chips}>
          {row.zones.map((zone) => (
            <Badge key={zone}>{hitLocationLabel(zone as HitLocation)}</Badge>
          ))}
        </span>
      ),
  },
  {
    key: "durability",
    header: "Durability",
    value: (row) => row.durability,
    sortable: true,
    betterWhen: "higher",
    render: (row) => formatNumber(row.durability),
  },
  {
    key: "reduction",
    header: "Reduction",
    value: (row) => row.reduction,
    sortable: true,
    betterWhen: "higher",
    render: (row) => formatPercent(row.reduction),
  },
  {
    key: "price",
    header: "Price",
    value: (row) => row.price?.price ?? null,
    sortable: true,
    render: (row) => formatCash(row.price?.price ?? null),
  },
  {
    key: "weight",
    header: "Weight",
    value: (row) => row.weight,
    sortable: true,
    betterWhen: "lower",
    render: (row) => formatWeight(row.weight),
  },
  {
    key: "unlock",
    header: "Unlock",
    value: (row) => (row.unlock ? `${row.unlock.roleLabel} ${row.unlock.level}` : null),
    sortable: true,
  },
  {
    key: "effects",
    header: "Side effects",
    value: (row) => (row.sideEffects.length === 0 ? null : row.sideEffects.join(", ")),
    render: (row) =>
      row.sideEffects.length === 0 ? "—" : <span className={styles.effects}>{row.sideEffects.join(", ")}</span>,
  },
];

const TABS: readonly { kind: ArmorKind; label: string }[] = [
  { kind: "body", label: "Body armor" },
  { kind: "helmet", label: "Helmets" },
];

export interface ArmorTableProps {
  rows: Readonly<Record<ArmorKind, readonly ArmorRow[]>>;
  tab: ArmorKind;
  onTabChange: (tab: ArmorKind) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ArmorTable({ rows, tab, onTabChange, selectedId, onSelect }: ArmorTableProps) {
  return (
    <Tabs selectedKey={tab} onSelectionChange={(key) => onTabChange(key as ArmorKind)}>
      <TabList aria-label="Armor type">
        {TABS.map(({ kind, label }) => (
          <Tab key={kind} id={kind}>
            {label}
          </Tab>
        ))}
      </TabList>
      {TABS.map(({ kind, label }) => {
        const selected = rows[kind].find((row) => row.id.toLowerCase() === selectedId?.toLowerCase()) ?? null;
        return (
          <TabPanel key={kind} id={kind}>
            <div className={styles.layout}>
              <DataTable
                aria-label={label}
                columns={COLUMNS}
                rows={rows[kind]}
                getRowKey={(row) => row.id}
                onRowClick={(row) => onSelect(row.id)}
                emptyText="No armor in this build"
              />
              <BodyZones
                covered={selected?.zones ?? []}
                label={selected ? selected.name : "Select a row to see what it covers"}
              />
            </div>
          </TabPanel>
        );
      })}
    </Tabs>
  );
}
