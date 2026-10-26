import { Checkbox, NumberField } from "@/ui";
import type { SituationFields } from "../model/contextTags";
import type { Situation } from "../model/types";
import styles from "./SituationPanel.module.css";

interface SituationPanelProps {
  fields: SituationFields;
  situation: Situation;
  onChange: (next: Situation) => void;
}

function hasTag(tags: readonly string[], tag: string): boolean {
  return tags.some((entry) => entry.toLowerCase() === tag.toLowerCase());
}

export function SituationPanel({ fields, situation, onChange }: SituationPanelProps) {
  const setTag = (tag: string, on: boolean) => {
    const others = situation.tags.filter((entry) => entry.toLowerCase() !== tag.toLowerCase());
    onChange({ ...situation, tags: on ? [...others, tag] : others });
  };
  const numberFields = [
    ...fields.game.map((field) => ({ ...field, group: "game" as const })),
    ...fields.scaling.map((field) => ({ ...field, group: "scaling" as const })),
  ];

  return (
    <div className={styles.situation}>
      {fields.tags.length > 0 && (
        <fieldset className={styles.tags}>
          <legend className={styles.legend}>Context</legend>
          {fields.tags.map((field) => (
            <Checkbox
              key={field.tag}
              isSelected={hasTag(situation.tags, field.tag)}
              onChange={(on) => setTag(field.tag, on)}
            >
              {field.label}
            </Checkbox>
          ))}
        </fieldset>
      )}
      {numberFields.length > 0 && (
        <div className={styles.numbers}>
          {numberFields.map((field) => (
            <NumberField
              key={`${field.group}:${field.name}`}
              label={field.label}
              minValue={0}
              value={situation[field.group][field.name] ?? field.defaultValue}
              onChange={(value) =>
                onChange({
                  ...situation,
                  [field.group]: { ...situation[field.group], [field.name]: Number.isNaN(value) ? 0 : value },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
