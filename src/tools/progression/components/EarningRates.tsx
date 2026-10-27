import { formatCash, formatNumber, NumberField, Panel } from "@/ui";
import type { KillHints } from "../model/killHints";
import type { EarningRates as Rates } from "../model/progress";
import styles from "./EarningRates.module.css";

export interface EarningRatesProps {
  rates: Rates;
  hints: KillHints | null;
  onChange: (rates: Rates) => void;
}

function rate(value: number): number | null {
  return Number.isNaN(value) || value <= 0 ? null : value;
}

export function EarningRates({ rates, hints, onChange }: EarningRatesProps) {
  return (
    <Panel title="Earning rates" description="Optional. Fill in what you usually earn to see match estimates.">
      <div className={styles.body}>
        <div className={styles.fields}>
          <NumberField
            label="Role XP per match"
            minValue={0}
            value={rates.xpPerMatch ?? NaN}
            onChange={(value) => onChange({ ...rates, xpPerMatch: rate(value) })}
            hideStepper
          />
          <NumberField
            label="Cash per match"
            minValue={0}
            value={rates.cashPerMatch ?? NaN}
            onChange={(value) => onChange({ ...rates, cashPerMatch: rate(value) })}
            formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            hideStepper
          />
        </div>
        {hints !== null && (
          <p className={styles.hint}>
            A player kill pays a base of {formatCash(hints.cash)} cash and {formatNumber(hints.xp)} role XP before
            modifiers.
          </p>
        )}
      </div>
    </Panel>
  );
}
