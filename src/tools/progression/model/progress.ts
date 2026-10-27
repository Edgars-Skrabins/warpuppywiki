import { z } from "zod";
import { sameId } from "@/core/catalog";
import type { MetaFile, Role } from "@/core/data";
import { createStore } from "@/core/state";

export const MAX_ROLE_LEVEL = 100;
export const MAX_CAREER_LEVEL = 150;

export const Goal = z.object({
  itemId: z.string(),
  unlocked: z.boolean(),
});

export const EarningRates = z.object({
  xpPerMatch: z.number().nullable(),
  cashPerMatch: z.number().nullable(),
});

export const ProgressState = z.object({
  roles: z.record(z.string(), z.number()),
  careerLevel: z.number(),
  cash: z.number().nullable(),
  goals: z.array(Goal),
  rates: EarningRates,
});

export type Goal = z.infer<typeof Goal>;
export type EarningRates = z.infer<typeof EarningRates>;
export type ProgressState = z.infer<typeof ProgressState>;

export interface ResolvedProgress {
  roles: Record<string, number>;
  careerLevel: number;
  cash: number;
  goals: readonly Goal[];
  rates: EarningRates;
}

export const DEFAULT_PROGRESS: ProgressState = {
  roles: {},
  careerLevel: 0,
  cash: null,
  goals: [],
  rates: { xpPerMatch: null, cashPerMatch: null },
};

export const progressStore = createStore({
  key: "progression",
  version: 1,
  schema: ProgressState,
  defaults: DEFAULT_PROGRESS,
});

export function initialCash(meta: MetaFile): number {
  return meta.currencies.find((currency) => sameId(currency.id, "Cash"))?.initialBalance ?? 0;
}

export function roleLevel(progress: ProgressState, role: string): number {
  const entry = Object.entries(progress.roles).find(([id]) => sameId(id, role));
  return entry?.[1] ?? 0;
}

export function resolveProgress(progress: ProgressState, roles: readonly Role[], meta: MetaFile): ResolvedProgress {
  return {
    roles: Object.fromEntries(roles.map((role) => [role.id, roleLevel(progress, role.id)])),
    careerLevel: progress.careerLevel,
    cash: progress.cash ?? initialCash(meta),
    goals: progress.goals,
    rates: progress.rates,
  };
}

export function withRoleLevel(progress: ProgressState, role: string, level: number): ProgressState {
  const roles = Object.fromEntries(Object.entries(progress.roles).filter(([id]) => !sameId(id, role)));
  return { ...progress, roles: { ...roles, [role]: level } };
}

export function addGoals(progress: ProgressState, itemIds: readonly string[]): ProgressState {
  const added = itemIds
    .filter((id, index) => itemIds.findIndex((other) => sameId(other, id)) === index)
    .filter((id) => !progress.goals.some((goal) => sameId(goal.itemId, id)))
    .map((itemId) => ({ itemId, unlocked: false }));
  return added.length === 0 ? progress : { ...progress, goals: [...progress.goals, ...added] };
}

export function removeGoal(progress: ProgressState, itemId: string): ProgressState {
  return { ...progress, goals: progress.goals.filter((goal) => !sameId(goal.itemId, itemId)) };
}

export function setGoalUnlocked(progress: ProgressState, itemId: string, unlocked: boolean): ProgressState {
  return {
    ...progress,
    goals: progress.goals.map((goal) => (sameId(goal.itemId, itemId) ? { ...goal, unlocked } : goal)),
  };
}
