import type { Skill } from "@/core/data";

export const TREE_WIDTH = 1000;
export const TREE_PADDING = 64;

export interface PlacedSkill {
  skill: Skill;
  row: number;
  column: number;
  x: number;
  y: number;
}

export interface Ring {
  row: number;
  radius: number;
  path: string;
}

export interface TreeLayout {
  width: number;
  height: number;
  centre: { x: number; y: number };
  nodes: PlacedSkill[];
  rings: Ring[];
}

interface Point {
  x: number;
  y: number;
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function arcPath(centre: Point, radius: number): string {
  const left = centre.x - radius;
  const right = centre.x + radius;
  return `M ${left} ${centre.y} A ${radius} ${radius} 0 0 1 ${right} ${centre.y}`;
}

export function skillLabel(skill: Skill): string {
  return skill.name ?? skill.id;
}

export function shortLabel(skill: Skill): string {
  return skillLabel(skill).split(/\s+/).slice(0, 2).join(" ");
}

export function unplacedSkills(skills: readonly Skill[]): Skill[] {
  return skills.filter((skill) => skill.layout == null);
}

export function treeLayout(skills: readonly Skill[], width = TREE_WIDTH, padding = TREE_PADDING): TreeLayout {
  const source = skills.flatMap((skill) =>
    skill.layout == null
      ? []
      : [{ skill, row: skill.layout.row, column: skill.layout.column, x: skill.layout.x, y: skill.layout.y }],
  );
  source.sort((a, b) => a.row - b.row || a.column - b.column);
  if (source.length === 0) {
    return { width, height: 2 * padding, centre: { x: width / 2, y: padding }, nodes: [], rings: [] };
  }

  const centre = { x: mean(source.map((node) => node.x)), y: Math.max(...source.map((node) => node.y)) };
  const rows = [...new Set(source.map((node) => node.row))].sort((a, b) => a - b);
  const radii = rows.map((row) => ({
    row,
    radius: mean(
      source.filter((node) => node.row === row).map((node) => Math.hypot(node.x - centre.x, node.y - centre.y)),
    ),
  }));

  const xs = [
    ...source.map((node) => node.x),
    ...radii.flatMap(({ radius }) => [centre.x - radius, centre.x + radius]),
  ];
  const ys = [...source.map((node) => node.y), ...radii.map(({ radius }) => centre.y - radius)];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = (width - 2 * padding) / Math.max(maxX - minX, 1);
  const project = (point: Point): Point => ({
    x: padding + (point.x - minX) * scale,
    y: padding + (point.y - minY) * scale,
  });

  const fittedCentre = project(centre);
  return {
    width,
    height: 2 * padding + (maxY - minY) * scale,
    centre: fittedCentre,
    nodes: source.map((node) => ({ ...node, ...project(node) })),
    rings: radii.map(({ row, radius }) => ({
      row,
      radius: radius * scale,
      path: arcPath(fittedCentre, radius * scale),
    })),
  };
}
