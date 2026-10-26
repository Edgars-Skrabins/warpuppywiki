import type { Skill } from "@/core/data";
import { EmptyState, Panel, StatRow } from "@/ui";
import { skillEffects } from "../logic/skillEffects";
import { skillLabel } from "../logic/treeLayout";
import { EffectChart } from "./EffectChart";
import { EffectTable } from "./EffectTable";
import styles from "./SkillPanel.module.css";

export const NO_EFFECTS_NOTE = "This skill's effect isn't in the game files (it's handled by the server or by code).";

export interface SkillPanelProps {
  skill: Skill | null;
  roleLabel: string;
  chartWidth?: number;
}

export function SkillPanel({ skill, roleLabel, chartWidth }: SkillPanelProps) {
  if (skill === null) {
    return (
      <EmptyState title="No skill selected" text="Pick a skill in the tree or search for one to read its details." />
    );
  }
  const effects = skillEffects(skill);
  return (
    <Panel title={skillLabel(skill)} description={roleLabel}>
      <div className={styles.body}>
        {skill.description != null && <p className={styles.description}>{skill.description}</p>}
        {skill.layout == null ? (
          <StatRow label="Position" value="Not placed in the tree" />
        ) : (
          <div>
            <StatRow label="Ring" value={String(skill.layout.row + 1)} />
            <StatRow label="Position" value={String(skill.layout.column + 1)} />
          </div>
        )}
        {effects.length === 0 ? (
          <p className={styles.note}>{NO_EFFECTS_NOTE}</p>
        ) : (
          effects.map((effect) => (
            <section key={effect.key} className={styles.effect} aria-label={effect.label}>
              <header className={styles.effectHeader}>
                <h3 className={styles.effectTitle}>{effect.label}</h3>
                <span className={styles.trigger}>{effect.trigger}</span>
              </header>
              <EffectTable effect={effect} />
              <EffectChart effect={effect} width={chartWidth} />
            </section>
          ))
        )}
      </div>
    </Panel>
  );
}
