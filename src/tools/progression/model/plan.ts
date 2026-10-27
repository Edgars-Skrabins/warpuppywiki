import { sameId, type Catalog } from "@/core/catalog";
import type { Role } from "@/core/data";
import { gatedItemMap, type GatedItem } from "./goals";
import type { ResolvedProgress } from "./progress";

export interface RolePlan {
  role: string;
  label: string;
  currentLevel: number;
  currentXp: number;
  targetLevel: number | null;
  targetXp: number | null;
  xpNeeded: number;
  matches: number | null;
}

export interface CareerPlan {
  currentLevel: number;
  requiredLevel: number | null;
  reached: boolean;
}

export interface CashPlan {
  unlockCost: number;
  purchaseCost: number;
  total: number;
  available: number;
  needed: number;
  matches: number | null;
}

export interface GoalStatus extends GatedItem {
  gate: "role" | "career";
  reached: boolean;
  unlocked: boolean;
  unlockCost: number;
}

export interface PlanSummary {
  roles: RolePlan[];
  career: CareerPlan;
  cash: CashPlan;
  goals: GoalStatus[];
}

export interface PlanOptions {
  includePurchase: boolean;
}

export function xpAtLevel(role: Role, level: number): number {
  let xp = 0;
  let best = -Infinity;
  for (const entry of role.levels) {
    if (entry.level <= level && entry.level > best) {
      best = entry.level;
      xp = entry.xp;
    }
  }
  return xp;
}

export function matchesFor(amount: number, perMatch: number | null): number | null {
  if (perMatch === null || perMatch <= 0) {
    return null;
  }
  return Math.ceil(amount / perMatch);
}

function findRole(roles: readonly Role[], id: string): Role | undefined {
  return roles.find((role) => sameId(role.id, id));
}

export function goalStatuses(
  progress: ResolvedProgress,
  gated: readonly GatedItem[],
  roles: readonly Role[],
): GoalStatus[] {
  const byId = gatedItemMap(gated);
  return progress.goals.flatMap((goal) => {
    const entry = byId.get(goal.itemId);
    if (entry === undefined) {
      return [];
    }
    const role = findRole(roles, entry.unlock.role);
    const current = role === undefined ? progress.careerLevel : (progress.roles[role.id] ?? 0);
    const reached = current >= entry.unlock.level;
    const unlocked = reached && goal.unlocked;
    return [
      {
        ...entry,
        gate: role === undefined ? "career" : "role",
        reached,
        unlocked,
        unlockCost: unlocked ? 0 : entry.unlock.cost,
      },
    ];
  });
}

export function planSummary(
  progress: ResolvedProgress,
  catalog: Catalog,
  roles: readonly Role[],
  gated: readonly GatedItem[],
  { includePurchase }: PlanOptions,
): PlanSummary {
  const goals = goalStatuses(progress, gated, roles);

  const rolePlans = roles.map((role): RolePlan => {
    const currentLevel = progress.roles[role.id] ?? 0;
    const currentXp = xpAtLevel(role, currentLevel);
    const levels = goals.filter((goal) => goal.gate === "role" && sameId(goal.unlock.role, role.id));
    const targetLevel = levels.length === 0 ? null : Math.max(...levels.map((goal) => goal.unlock.level));
    const targetXp = targetLevel === null ? null : xpAtLevel(role, targetLevel);
    const xpNeeded = targetXp === null ? 0 : Math.max(0, targetXp - currentXp);
    return {
      role: role.id,
      label: catalog.roleLabel(role.id),
      currentLevel,
      currentXp,
      targetLevel,
      targetXp,
      xpNeeded,
      matches: matchesFor(xpNeeded, progress.rates.xpPerMatch),
    };
  });

  const careerGoals = goals.filter((goal) => goal.gate === "career");
  const requiredLevel = careerGoals.length === 0 ? null : Math.max(...careerGoals.map((goal) => goal.unlock.level));

  const unlockCost = goals.reduce((sum, goal) => sum + goal.unlockCost, 0);
  const purchaseCost = includePurchase ? goals.reduce((sum, goal) => sum + (goal.price?.price ?? 0), 0) : 0;
  const total = unlockCost + purchaseCost;
  const needed = Math.max(0, total - progress.cash);

  return {
    roles: rolePlans,
    career: {
      currentLevel: progress.careerLevel,
      requiredLevel,
      reached: requiredLevel === null || progress.careerLevel >= requiredLevel,
    },
    cash: {
      unlockCost,
      purchaseCost,
      total,
      available: progress.cash,
      needed,
      matches: matchesFor(needed, progress.rates.cashPerMatch),
    },
    goals,
  };
}
