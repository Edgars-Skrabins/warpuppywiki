import { useId } from "react";
import type { Skill } from "@/core/data";
import { Button } from "@/ui";
import { skillLabel } from "../logic/treeLayout";
import styles from "./UnplacedSkills.module.css";

export interface UnplacedSkillsProps {
  skills: readonly Skill[];
  selectedId: string | null;
  onSelect: (skill: Skill) => void;
}

export function UnplacedSkills({ skills, selectedId, onSelect }: UnplacedSkillsProps) {
  const headingId = useId();
  if (skills.length === 0) {
    return null;
  }
  return (
    <section className={styles.unplaced} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.heading}>
        Not placed in the tree
      </h3>
      <ul className={styles.list}>
        {skills.map((skill) => (
          <li key={skill.id}>
            <Button variant="ghost" size="sm" aria-pressed={skill.id === selectedId} onPress={() => onSelect(skill)}>
              {skillLabel(skill)}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
