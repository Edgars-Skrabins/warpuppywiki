import { useId } from "react";
import { Button, ComboBox, formatMultiplier } from "@/ui";
import type { EntityMultiplier, HitDescription } from "../logic/applies";
import type { TagSuggestions } from "../logic/tagSuggestions";
import { TagChips } from "./TagChips";
import styles from "./AppliesPanel.module.css";

export interface AppliesPanelProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  hit: HitDescription;
  onHitChange: (hit: HitDescription) => void;
  suggestions: TagSuggestions;
  multipliers: readonly EntityMultiplier[] | null;
}

const EMPTY_HIT: HitDescription = { source: [], target: [], attacker: [], location: null };

function identity(tag: string): string {
  return tag;
}

interface TagInputProps {
  label: string;
  tags: readonly string[];
  suggestions: readonly string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ label, tags, suggestions, onChange }: TagInputProps) {
  const available = suggestions.filter((tag) => !tags.includes(tag));
  return (
    <div className={styles.tagInput}>
      <ComboBox
        key={tags.join("|")}
        label={label}
        items={available}
        getKey={identity}
        getLabel={identity}
        selectedKey={null}
        onSelectionChange={(key) => {
          if (key !== null) onChange([...tags, key]);
        }}
        placeholder="Add a tag…"
      />
      {tags.length > 0 && (
        <ul className={styles.selected} aria-label={`${label} entered`}>
          {tags.map((tag) => (
            <li key={tag} className={styles.selectedTag}>
              <TagChips tags={[tag]} />
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(tags.filter((entry) => entry !== tag))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AppliesPanel({ isOpen, onOpenChange, hit, onHitChange, suggestions, multipliers }: AppliesPanelProps) {
  const bodyId = useId();
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!isOpen)}
        >
          <span aria-hidden="true" className={styles.chevron} data-open={isOpen || undefined}>
            ▸
          </span>
          Which rules apply?
        </button>
      </header>
      {isOpen && (
        <div id={bodyId} className={styles.body}>
          <p className={styles.hint}>
            Describe a hit. Rules whose listed tags all match are marked in the table; a sub-tag matches its parent
            (Bullet.545mm matches Bullet). Only plain percentage rules count, the same as the damage model: custom-code,
            friendly-fire and Add rules are never marked.
          </p>
          <div className={styles.inputs}>
            <TagInput
              label="Source tags"
              tags={hit.source}
              suggestions={suggestions.source}
              onChange={(source) => onHitChange({ ...hit, source })}
            />
            <TagInput
              label="Target tags"
              tags={hit.target}
              suggestions={suggestions.target}
              onChange={(target) => onHitChange({ ...hit, target })}
            />
            <TagInput
              label="Attacker tags"
              tags={hit.attacker}
              suggestions={suggestions.attacker}
              onChange={(attacker) => onHitChange({ ...hit, attacker })}
            />
            <div className={styles.tagInput}>
              <ComboBox
                label="Hit location"
                items={suggestions.location}
                getKey={identity}
                getLabel={identity}
                selectedKey={hit.location}
                onSelectionChange={(location) => onHitChange({ ...hit, location })}
                placeholder="Any location tag…"
              />
            </div>
          </div>
          <div className={styles.footer}>
            <Button variant="secondary" size="sm" onPress={() => onHitChange(EMPTY_HIT)}>
              Clear
            </Button>
          </div>
          {multipliers !== null && (
            <div className={styles.results}>
              <h3 className={styles.resultsTitle}>Combined multiplier per entity</h3>
              {multipliers.length === 0 ? (
                <p className={styles.hint}>No rule applies to this hit.</p>
              ) : (
                <ul className={styles.multipliers}>
                  {multipliers.map((entry) => (
                    <li key={entry.entity} className={styles.multiplier}>
                      <TagChips tags={[entry.entity]} />
                      <span className={styles.value}>{formatMultiplier(entry.multiplier)}</span>
                      <span className={styles.count}>
                        {entry.ruleCount} {entry.ruleCount === 1 ? "rule" : "rules"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
