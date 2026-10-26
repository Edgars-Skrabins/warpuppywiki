import type { WeightClass } from "@/core/data";
import { formatWeight, StatBar } from "@/ui";
import type { WeightSummary as WeightSummaryData } from "../model/totals";
import { EffectsList } from "./EffectsList";
import { SheetNote, SheetRow, SheetRows, SheetSection } from "./Sheet";
import styles from "./WeightSummary.module.css";

const SCALE_HEADROOM = 1.25;

function scaleMax(classes: readonly WeightClass[], totalKg: number): number {
  const top = Math.max(0, ...classes.map((weightClass) => weightClass.minWeightKg));
  return Math.max(top * SCALE_HEADROOM, totalKg, 1);
}

export interface WeightSummaryProps {
  weight: WeightSummaryData;
  classes: readonly WeightClass[];
}

export function WeightSummary({ weight, classes }: WeightSummaryProps) {
  const max = scaleMax(classes, weight.totalKg);
  const className = weight.weightClass?.name ?? "—";
  return (
    <SheetSection title="Weight">
      <SheetRows label="Weight">
        <SheetRow label="Total weight" value={formatWeight(weight.totalKg)} total />
        <SheetRow label="Weight class" value={className} />
      </SheetRows>
      <div className={styles.scale}>
        <StatBar label="Weight on the class scale" value={weight.totalKg} max={max} format={formatWeight} />
        <ol className={styles.ticks} aria-label="Weight class thresholds">
          {classes.map((weightClass) => (
            <li
              key={weightClass.name}
              className={styles.tick}
              data-active={weightClass.name === weight.weightClass?.name || undefined}
              style={{ left: `${(weightClass.minWeightKg / max) * 100}%` }}
            >
              <span className={styles.tickName}>{weightClass.name}</span>
              <span className={styles.tickKg}>{weightClass.minWeightKg}</span>
            </li>
          ))}
        </ol>
      </div>
      <SheetNote>
        {weight.nextClass === null || weight.kgToNext === null
          ? "Heaviest weight class"
          : `${formatWeight(weight.kgToNext)} until ${weight.nextClass.name}`}
      </SheetNote>
      {weight.effects.length > 0 ? (
        <EffectsList effects={weight.effects} label={`${className} effects`} />
      ) : (
        <SheetNote>No weight penalties</SheetNote>
      )}
      {weight.unknownWeight.length > 0 && (
        <SheetNote>Weight unknown for: {weight.unknownWeight.map((item) => item.name).join(", ")}</SheetNote>
      )}
    </SheetSection>
  );
}
