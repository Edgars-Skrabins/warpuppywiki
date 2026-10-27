import { formatCash, NumberField } from "@/ui";
import { MAX_BUDGET } from "../model/loadout";
import type { CostSummary } from "../model/totals";
import { SheetNote, SheetRow, SheetRows, SheetSection } from "./Sheet";
import styles from "./BudgetSummary.module.css";

const CASH_FORMAT: Intl.NumberFormatOptions = { style: "currency", currency: "USD", maximumFractionDigits: 0 };

export interface BudgetSummaryProps {
  cost: CostSummary;
  onBudgetChange: (budget: number) => void;
}

export function BudgetSummary({ cost, onBudgetChange }: BudgetSummaryProps) {
  const over = cost.overBudgetBy > 0;
  return (
    <SheetSection title="Cost">
      <NumberField
        label="Budget"
        value={cost.budget}
        minValue={0}
        maxValue={MAX_BUDGET}
        step={500}
        formatOptions={CASH_FORMAT}
        onChange={(value) => {
          if (!Number.isNaN(value)) onBudgetChange(value);
        }}
        className={styles.budget}
      />
      <SheetRows label="Cost breakdown">
        {cost.sections.map((section) => (
          <SheetRow key={section.id} label={section.label} value={formatCash(section.total)} />
        ))}
        <SheetRow label="Total cost" value={formatCash(cost.total)} total />
        <SheetRow label="Remaining" value={formatCash(cost.remaining)} tone={over ? "worse" : "default"} />
      </SheetRows>
      {over && (
        <p role="status" className={styles.over}>
          Over budget by {formatCash(cost.overBudgetBy)}
        </p>
      )}
      {cost.notSold.length > 0 && (
        <SheetNote>Not sold in shop, counted as $0: {cost.notSold.map((line) => line.item.name).join(", ")}</SheetNote>
      )}
    </SheetSection>
  );
}
