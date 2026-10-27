import { useMemo } from "react";
import type { Catalog } from "@/core/catalog";
import type { EquipmentFile } from "@/core/data";
import type { Loadout } from "../model/loadout";
import { armorEffects, costSummary, unlockSummary, weightSummary } from "../model/totals";
import { BudgetSummary } from "./BudgetSummary";
import { EffectsList } from "./EffectsList";
import { SheetNote, SheetSection } from "./Sheet";
import { UnlockSummary } from "./UnlockSummary";
import { WeightSummary } from "./WeightSummary";
import styles from "./SummaryPanel.module.css";

export interface SummaryPanelProps {
  loadout: Loadout;
  catalog: Catalog;
  equipment: EquipmentFile;
  onBudgetChange: (budget: number) => void;
}

export function SummaryPanel({ loadout, catalog, equipment, onBudgetChange }: SummaryPanelProps) {
  const cost = useMemo(() => costSummary(loadout, catalog), [loadout, catalog]);
  const weight = useMemo(() => weightSummary(loadout, catalog, equipment), [loadout, catalog, equipment]);
  const armor = useMemo(() => armorEffects(loadout, catalog, equipment), [loadout, catalog, equipment]);
  const unlocks = useMemo(() => unlockSummary(loadout, catalog), [loadout, catalog]);

  return (
    <aside className={styles.sheet} aria-label="Loadout summary">
      <header className={styles.header}>
        <h2 className={styles.title}>Requisition</h2>
        <span className={styles.count}>
          {cost.lines.length} {cost.lines.length === 1 ? "line" : "lines"}
        </span>
      </header>
      <BudgetSummary cost={cost} onBudgetChange={onBudgetChange} />
      <WeightSummary weight={weight} classes={equipment.weightClasses} />
      <SheetSection title="Armor effects">
        {armor.length === 0 ? (
          <SheetNote>No armor or helmet effects</SheetNote>
        ) : (
          armor.map((entry) => (
            <div key={entry.item.id} className={styles.armor}>
              <p className={styles.source}>{entry.source}</p>
              <EffectsList effects={entry.effects} label={`${entry.source} effects`} />
            </div>
          ))
        )}
      </SheetSection>
      <UnlockSummary unlocks={unlocks} />
    </aside>
  );
}
