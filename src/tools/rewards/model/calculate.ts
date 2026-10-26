import type { ChallengeReward } from "@/core/data";
import { evaluate, FormulaEvaluationError } from "../formula/evaluate";
import { namesIn, parse, type Expr } from "../formula/parse";
import { resolveNames, type ResolvedName } from "./resolveNames";
import type { CurveLookup, RewardResource, Situation } from "./types";

export interface ResourceResult {
  resource: string;
  formula: string;
  expr: Expr | null;
  amount: number | null;
  error: string | null;
  working: ResolvedName[];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function calculateResource(resource: RewardResource, situation: Situation, curves: CurveLookup): ResourceResult {
  let expr: Expr;
  try {
    expr = parse(resource.formula);
  } catch (error) {
    const names = resource.inputs.map((input) => input.name);
    return {
      resource: resource.resource,
      formula: resource.formula,
      expr: null,
      amount: null,
      error: errorMessage(error),
      working: [...resolveNames(resource, names, situation, curves).values()],
    };
  }
  const resolved = resolveNames(resource, namesIn(expr), situation, curves);
  const working = [...resolved.values()];
  try {
    const amount = evaluate(expr, (name) => {
      const entry = resolved.get(name);
      if (entry?.error) {
        throw new FormulaEvaluationError(entry.error);
      }
      return entry?.value ?? undefined;
    });
    return { resource: resource.resource, formula: resource.formula, expr, amount, error: null, working };
  } catch (error) {
    return {
      resource: resource.resource,
      formula: resource.formula,
      expr,
      amount: null,
      error: errorMessage(error),
      working,
    };
  }
}

export function calculateReward(reward: ChallengeReward, situation: Situation, curves: CurveLookup): ResourceResult[] {
  return reward.resources.map((resource) => calculateResource(resource, situation, curves));
}
