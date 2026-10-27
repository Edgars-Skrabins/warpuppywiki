import type { CSSProperties } from "react";
import type { HitLocationMultipliers } from "@/core/data";
import { formatNumber } from "@/ui";
import { TagChips } from "./TagChips";
import styles from "./MultiplierHeatmap.module.css";

export interface MultiplierHeatmapProps {
  rows: readonly HitLocationMultipliers[];
}

const UNIVERSAL = "Universal";
const MAX_HEAT = 55;
const LEGEND_STEPS = [0, 0.25, 0.5, 0.75, 1];

function heatStyle(fraction: number): CSSProperties {
  return { "--heat": `${Math.round(fraction * MAX_HEAT)}%` } as CSSProperties;
}

function heatFraction(value: number, min: number, max: number): number {
  return max === min ? 0 : (value - min) / (max - min);
}

export function MultiplierHeatmap({ rows }: MultiplierHeatmapProps) {
  const ordered = [
    ...rows.filter((row) => row.weaponClass === UNIVERSAL),
    ...rows.filter((row) => row.weaponClass !== UNIVERSAL),
  ];
  const locations = [...new Set(ordered.flatMap((row) => Object.keys(row.multipliers)))];
  const values = ordered.flatMap((row) => Object.values(row.multipliers));
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className={styles.wrap}>
      <table className={styles.table} aria-label="Body-part multipliers">
        <thead>
          <tr>
            <th scope="col" className={styles.corner}>
              Weapon class
            </th>
            {locations.map((location) => (
              <th key={location} scope="col" className={styles.location}>
                {location}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => (
            <tr key={row.weaponClass}>
              <th scope="row" className={styles.weaponClass}>
                <TagChips tags={[row.weaponClass]} />
              </th>
              {locations.map((location) => {
                const value = row.multipliers[location];
                return (
                  <td
                    key={location}
                    className={styles.cell}
                    title={value === undefined ? undefined : `${row.weaponClass}, ${location}: ×${value}`}
                    style={value === undefined ? undefined : heatStyle(heatFraction(value, min, max))}
                  >
                    {value === undefined ? "—" : formatNumber(value, { maxFractionDigits: 4 })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.legend} aria-hidden="true">
        <span>{formatNumber(min, { maxFractionDigits: 4 })}</span>
        {LEGEND_STEPS.map((step) => (
          <span key={step} className={styles.swatch} style={heatStyle(step)} />
        ))}
        <span>{formatNumber(max, { maxFractionDigits: 4 })}</span>
      </div>
    </div>
  );
}
