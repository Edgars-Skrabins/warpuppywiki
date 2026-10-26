import { sameId } from "@/core/catalog";
import type { Skill } from "@/core/data";
import { skillLabel } from "./treeLayout";

export interface SearchEntry {
  skill: Skill;
  roleLabel: string;
  text: string;
}

export function searchEntries(
  skills: readonly Skill[],
  roles: readonly string[],
  roleLabel: (role: string) => string,
): SearchEntry[] {
  const rank = (skill: Skill) => {
    const index = roles.findIndex((role) => sameId(role, skill.role));
    return index === -1 ? roles.length : index;
  };
  return [...skills]
    .sort((a, b) => rank(a) - rank(b) || skillLabel(a).localeCompare(skillLabel(b)))
    .map((skill) => ({
      skill,
      roleLabel: roleLabel(skill.role),
      text: [skillLabel(skill), skill.description ?? ""].join(" "),
    }));
}
