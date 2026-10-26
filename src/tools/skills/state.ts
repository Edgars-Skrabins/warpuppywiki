import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { sameId } from "@/core/catalog";
import type { Skill, SkillTree } from "@/core/data";

export const ROLE_ORDER = ["Infantry", "Support", "Medic", "Recon", "Pilot", "Driver"] as const;

export const DEFAULT_ROLE = "Infantry";

export function orderedRoles(trees: readonly SkillTree[], skills: readonly Skill[]): string[] {
  const rank = (role: string) => {
    const index = ROLE_ORDER.findIndex((known) => sameId(known, role));
    return index === -1 ? ROLE_ORDER.length : index;
  };
  const roles: string[] = [];
  for (const role of [...trees.map((tree) => tree.role), ...skills.map((skill) => skill.role)]) {
    if (!roles.some((known) => sameId(known, role))) {
      roles.push(role);
    }
  }
  return roles.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export interface SkillsSelection {
  role: string;
  skillId: string | null;
  selectRole: (role: string) => void;
  selectSkill: (skill: Skill) => void;
}

export function useSkillsSelection(): SkillsSelection {
  const [params, setParams] = useSearchParams();
  const role = params.get("role") ?? DEFAULT_ROLE;
  const skillId = params.get("skill");

  const update = useCallback(
    (next: { role: string; skill: string | null }) => {
      setParams(
        (prev) => {
          const result = new URLSearchParams(prev);
          result.set("role", next.role);
          if (next.skill === null) {
            result.delete("skill");
          } else {
            result.set("skill", next.skill);
          }
          return result;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const selectRole = useCallback((next: string) => update({ role: next, skill: null }), [update]);
  const selectSkill = useCallback((skill: Skill) => update({ role: skill.role, skill: skill.id }), [update]);

  return { role, skillId, selectRole, selectSkill };
}
