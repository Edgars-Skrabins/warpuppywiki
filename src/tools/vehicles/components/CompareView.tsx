import { Fragment, useMemo } from "react";
import type { DamageFile } from "@/core/data";
import { Badge, Button, EmptyState, Grid, ItemIcon, Panel, Stack } from "@/ui";
import { compareSections, protectionText, type CompareRow } from "../logic/vehicleCompare";
import type { VehicleRow } from "../logic/vehicleRows";
import { vulnerabilities } from "../logic/vulnerabilities";
import { formatCompareValue, formatList, formatSignedPercent, formatUnlock } from "./formatValue";
import { TorqueChart } from "./TorqueChart";
import { VulnerabilityChart } from "./VulnerabilityChart";
import { VulnerabilityTable } from "./VulnerabilityTable";
import styles from "./CompareView.module.css";

export interface CompareViewProps {
  vehicles: readonly VehicleRow[];
  damage: DamageFile;
  onRemove: (id: string) => void;
}

function cellText(row: CompareRow, index: number): string {
  switch (row.kind) {
    case "number":
      return formatCompareValue(row.values[index] ?? null, row.format);
    case "text":
      return formatList(row.values[index] ?? []);
    case "unlock":
      return formatUnlock(row.values[index] ?? null);
    case "protection":
      return protectionText(row.values[index] ?? null, formatSignedPercent);
  }
}

export function CompareView({ vehicles, damage, onRemove }: CompareViewProps) {
  const sections = useMemo(() => compareSections(vehicles, damage.vehicleSeats), [vehicles, damage]);

  if (vehicles.length === 0) {
    return <EmptyState title="Nothing to compare" text="Pick up to three vehicles in the table to compare them." />;
  }

  return (
    <Stack gap={6}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className={styles.visuallyHidden}>Stat</span>
              </th>
              {vehicles.map((vehicle) => (
                <th key={vehicle.id} scope="col" className={styles.vehicle}>
                  <ItemIcon icon={vehicle.icon} name={vehicle.name} size={56} shape="wide" />
                  <span className={styles.vehicleName}>{vehicle.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => onRemove(vehicle.id)}
                    aria-label={`Remove ${vehicle.name}`}
                  >
                    Remove
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.key}>
                <tr>
                  <th scope="colgroup" colSpan={vehicles.length + 1} className={styles.section}>
                    {section.label}
                  </th>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.key} className={styles.row}>
                    <th scope="row" className={styles.label}>
                      {row.label}
                    </th>
                    {vehicles.map((vehicle, index) => {
                      const best = row.kind === "number" && row.best[index] === true;
                      return (
                        <td
                          key={vehicle.id}
                          className={row.kind === "number" ? styles.number : styles.text}
                          data-best={best || undefined}
                        >
                          {cellText(row, index)}
                          {best && (
                            <Badge tone="tag" className={styles.best}>
                              Best
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <TorqueChart vehicles={vehicles} />
      <Grid minColumnWidth={360} gap={4}>
        {vehicles.map((vehicle) => {
          const rows = vulnerabilities(damage.rules, vehicle.vehicle.damageEntity);
          return (
            <Panel key={vehicle.id} title={`${vehicle.name} vulnerabilities`} headingLevel={3}>
              <Stack gap={4}>
                <VulnerabilityChart rows={rows} />
                <VulnerabilityTable vehicleName={vehicle.name} rows={rows} />
              </Stack>
            </Panel>
          );
        })}
      </Grid>
    </Stack>
  );
}
