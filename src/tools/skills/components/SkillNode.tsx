import type { KeyboardEvent } from "react";
import type { PlacedSkill } from "../logic/treeLayout";
import { shortLabel, skillLabel } from "../logic/treeLayout";
import { hasEffects } from "../logic/skillEffects";
import styles from "./SkillTree.module.css";

export const NODE_RADIUS = 14;

const LINE_HEIGHT = 15;

export interface SkillNodeProps {
  node: PlacedSkill;
  selected: boolean;
  onSelect: (node: PlacedSkill) => void;
}

export function SkillNode({ node, selected, onSelect }: SkillNodeProps) {
  const name = skillLabel(node.skill);
  const words = shortLabel(node.skill).split(" ");
  const filled = hasEffects(node.skill);

  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(node);
    }
  };

  return (
    <g
      className={styles.node}
      transform={`translate(${node.x} ${node.y})`}
      role="button"
      tabIndex={0}
      aria-label={name}
      aria-pressed={selected}
      data-selected={selected || undefined}
      data-filled={filled || undefined}
      onClick={() => onSelect(node)}
      onKeyDown={handleKeyDown}
    >
      <title>{name}</title>
      <circle className={styles.halo} r={NODE_RADIUS + 5} />
      <circle className={styles.dot} r={NODE_RADIUS} />
      <text className={styles.label} y={NODE_RADIUS + LINE_HEIGHT} aria-hidden="true">
        {words.map((word, index) => (
          <tspan key={index} x={0} dy={index === 0 ? 0 : LINE_HEIGHT}>
            {word}
          </tspan>
        ))}
      </text>
    </g>
  );
}
