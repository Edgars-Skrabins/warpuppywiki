import { useMemo, useState } from "react";
import { sameId, type Catalog } from "@/core/catalog";
import type { Role } from "@/core/data";
import {
  Badge,
  Button,
  DataTable,
  formatCash,
  formatNumber,
  ItemIcon,
  LineChartCard,
  Panel,
  Select,
  type Column,
} from "@/ui";
import { ladderFor, type GatedItem } from "../model/goals";
import { xpAtLevel } from "../model/plan";
import styles from "./RoleLadder.module.css";

export interface RoleLadderProps {
  gated: readonly GatedItem[];
  roles: readonly Role[];
  catalog: Catalog;
  levels: Record<string, number>;
  goalIds: readonly string[];
  onAddGoal: (itemId: string) => void;
}

export function RoleLadder({ gated, roles, catalog, levels, goalIds, onAddGoal }: RoleLadderProps) {
  const [roleId, setRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const role = roles.find((candidate) => roleId !== null && sameId(candidate.id, roleId));
  const rows = useMemo(() => (role === undefined ? [] : ladderFor(gated, role.id)), [gated, role]);
  const current = role === undefined ? 0 : (levels[role.id] ?? 0);
  const label = role === undefined ? "" : catalog.roleLabel(role.id);

  const columns: Column<GatedItem>[] = [
    {
      key: "item",
      header: "Item",
      value: (row) => row.item.name,
      render: (row) => (
        <span className={styles.item}>
          <ItemIcon icon={row.item.icon} name={row.item.name} size={32} />
          {row.item.name}
        </span>
      ),
      sortable: true,
    },
    { key: "level", header: "Level", value: (row) => row.unlock.level, align: "end", sortable: true },
    {
      key: "xp",
      header: "XP for level",
      value: (row) => (role === undefined ? null : xpAtLevel(role, row.unlock.level)),
      render: (row) => (role === undefined ? "—" : formatNumber(xpAtLevel(role, row.unlock.level))),
      align: "end",
      sortable: true,
    },
    {
      key: "cost",
      header: "Unlock cost",
      value: (row) => row.unlock.cost,
      render: (row) => formatCash(row.unlock.cost, { zeroAsFree: true }),
      align: "end",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      value: (row) => (current >= row.unlock.level ? 1 : 0),
      render: (row) =>
        current >= row.unlock.level ? <Badge tone="success">Reached</Badge> : <Badge>Not reached</Badge>,
    },
    {
      key: "goal",
      header: "Goal",
      value: () => null,
      render: (row) => {
        const isGoal = goalIds.some((id) => sameId(id, row.item.id));
        return (
          <Button
            size="sm"
            variant="ghost"
            isDisabled={isGoal}
            aria-label={isGoal ? `${row.item.name} is a goal` : `Add ${row.item.name} as goal`}
            onPress={() => onAddGoal(row.item.id)}
          >
            {isGoal ? "In goals" : "Add as goal"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className={styles.ladder}>
      <Panel title="Role ladder">
        <div className={styles.body}>
          <Select
            label="Role"
            items={roles}
            getKey={(entry) => entry.id}
            getLabel={(entry) => catalog.roleLabel(entry.id)}
            selectedKey={role?.id ?? null}
            onSelectionChange={(key) => setRoleId(key)}
            className={styles.picker}
          />
          <DataTable
            aria-label={`${label} unlocks`}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.item.id}
            initialSort={{ column: "level", direction: "ascending" }}
            emptyText="This role unlocks nothing."
          />
        </div>
      </Panel>
      {role !== undefined && (
        <LineChartCard
          title={`${label} total XP by level`}
          series={[
            {
              key: role.id,
              label: `${label} XP`,
              points: role.levels.map((entry) => ({ x: entry.level, y: entry.xp })),
            },
          ]}
          xLabel="Level"
          yLabel="Total XP"
          formatY={(value) => formatNumber(value)}
          referenceLines={[{ axis: "x", value: current, label: "You" }]}
        />
      )}
    </div>
  );
}
