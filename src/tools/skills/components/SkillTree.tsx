import type { TreeLayout } from "../logic/treeLayout";
import { SkillNode } from "./SkillNode";
import styles from "./SkillTree.module.css";

export interface SkillTreeProps {
  layout: TreeLayout;
  label: string;
  selectedId: string | null;
  onSelect: (skillId: string) => void;
}

export function SkillTree({ layout, label, selectedId, onSelect }: SkillTreeProps) {
  return (
    <figure className={styles.figure}>
      <svg className={styles.tree} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={label}>
        <g aria-hidden="true">
          {layout.rings.map((ring) => (
            <path key={ring.row} className={styles.ring} d={ring.path} />
          ))}
          <line
            className={styles.base}
            x1={layout.centre.x - (layout.rings.at(-1)?.radius ?? 0)}
            x2={layout.centre.x + (layout.rings.at(-1)?.radius ?? 0)}
            y1={layout.centre.y}
            y2={layout.centre.y}
          />
        </g>
        {layout.nodes.map((node) => (
          <SkillNode
            key={node.skill.id}
            node={node}
            selected={selectedId !== null && node.skill.id === selectedId}
            onSelect={() => onSelect(node.skill.id)}
          />
        ))}
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchFilled}`} aria-hidden="true" />
          Effect values in the game files
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} aria-hidden="true" />
          No effect values in the game files
        </span>
      </figcaption>
    </figure>
  );
}
