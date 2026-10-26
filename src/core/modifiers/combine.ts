import type { ModifierOp, SourcedModifier } from "./types";

export interface CombineStep {
  source: string;
  op: ModifierOp;
  value: number;
  after: number;
  overridden: boolean;
}

export interface CombineResult {
  base: number;
  value: number;
  steps: CombineStep[];
  overridden: boolean;
}

function ofOp(sourced: readonly SourcedModifier[], op: ModifierOp): SourcedModifier[] {
  return sourced.filter((entry) => entry.modifier.op === op);
}

export function combine(base: number, sourced: readonly SourcedModifier[]): CombineResult {
  const steps: CombineStep[] = [];
  let value = base;

  const push = (entry: SourcedModifier, after: number) => {
    steps.push({ source: entry.source, op: entry.modifier.op, value: entry.modifier.value, after, overridden: false });
  };

  for (const entry of ofOp(sourced, "add")) {
    value += entry.modifier.value;
    push(entry, value);
  }

  const beforeMultiply = value;
  let multiplier = 1;
  for (const entry of ofOp(sourced, "multiply")) {
    multiplier += entry.modifier.value - 1;
    value = beforeMultiply * multiplier;
    push(entry, value);
  }

  for (const entry of ofOp(sourced, "multiplyCompound")) {
    value *= entry.modifier.value;
    push(entry, value);
  }

  const winner = ofOp(sourced, "override").at(-1);
  if (!winner) {
    return { base, value, steps, overridden: false };
  }

  for (const step of steps) {
    step.overridden = true;
  }
  push(winner, winner.modifier.value);
  return { base, value: winner.modifier.value, steps, overridden: true };
}
