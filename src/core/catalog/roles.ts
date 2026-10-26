import type { Role } from "@/core/data";
import { sameId, type IdMap } from "./ids";

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function roleLabel(tagTexts: IdMap<string>, role: string): string {
  const text = tagTexts.get(`Attribute.Meta.XP.Role.${role}`);
  return text === undefined ? role : titleCase(text);
}

function findRole(roles: readonly Role[], role: string): Role | undefined {
  return roles.find((candidate) => sameId(candidate.id, role));
}

export function xpForLevel(roles: readonly Role[], role: string, level: number): number | null {
  return findRole(roles, role)?.levels.find((entry) => entry.level === level)?.xp ?? null;
}

export function levelForXp(roles: readonly Role[], role: string, xp: number): number | null {
  const levels = findRole(roles, role)?.levels;
  if (levels === undefined) {
    return null;
  }
  let reached: number | null = null;
  for (const entry of levels) {
    if (entry.xp <= xp && (reached === null || entry.level > reached)) {
      reached = entry.level;
    }
  }
  return reached;
}
