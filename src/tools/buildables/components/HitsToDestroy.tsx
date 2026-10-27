import { useMemo, useState } from "react";
import type { DamageRule } from "@/core/data";
import { ComboBox, EMPTY_VALUE, formatMultiplier, formatNumber, Panel, Stack, StatRow } from "@/ui";
import { hitsToDestroy, PROJECTILE_GROUP_LABELS, type ProjectileOption } from "../logic/hitsToDestroy";
import { RulesTable } from "./RulesTable";
import styles from "./HitsToDestroy.module.css";

export const DIRECT_HIT_NOTE = "Direct-hit damage only; blast radius and blunt damage are not modeled.";

export interface HitsToDestroyProps {
  buildableName: string;
  maxHealth: number;
  options: readonly ProjectileOption[];
  rules: readonly DamageRule[];
}

export function HitsToDestroy({ buildableName, maxHealth, options, rules }: HitsToDestroyProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = options.find((option) => option.key === selectedKey) ?? null;
  const result = useMemo(
    () => (selected ? hitsToDestroy(maxHealth, selected, rules) : null),
    [selected, maxHealth, rules],
  );

  return (
    <Panel title="Hits to destroy" headingLevel={3}>
      <Stack gap={3}>
        <ComboBox
          label="Projectile"
          items={options}
          getKey={(option) => option.key}
          getLabel={(option) => option.label}
          getGroup={(option) => PROJECTILE_GROUP_LABELS[option.group]}
          selectedKey={selectedKey}
          onSelectionChange={(key) => setSelectedKey(key)}
          placeholder="Pick a bullet, rocket, grenade or explosive"
        />
        {selected && result && (
          <>
            <div className={styles.result} aria-live="polite">
              {result.hits === null ? (
                <span className={styles.hits}>{result.damage > 0 ? EMPTY_VALUE : "No damage"}</span>
              ) : (
                <>
                  <span className={styles.hits}>{formatNumber(result.hits)}</span>
                  <span className={styles.unit}>{result.hits === 1 ? "hit" : "hits"}</span>
                </>
              )}
            </div>
            <div>
              <StatRow label="Direct damage" value={formatNumber(selected.projectile.damage)} />
              <StatRow label="Rule factor" value={formatMultiplier(result.factor)} />
              <StatRow label="Damage per hit" value={formatNumber(result.damage, { maxFractionDigits: 1 })} />
            </div>
            <RulesTable
              label={`Rules applied to ${selected.label} against ${buildableName}`}
              rows={result.applied}
              emptyText="No rules apply; full damage."
            />
            {result.notApplied.length > 0 && (
              <RulesTable label={`Rules listed but not applied for ${selected.label}`} rows={result.notApplied} />
            )}
          </>
        )}
        <p className={styles.note}>{DIRECT_HIT_NOTE}</p>
      </Stack>
    </Panel>
  );
}
