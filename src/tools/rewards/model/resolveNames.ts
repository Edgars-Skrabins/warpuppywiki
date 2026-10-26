import type { RewardCurve } from "@/core/data";
import { conditionHolds, describeCondition } from "./conditions";
import { defaultGameValue, toGameUnits } from "./contextTags";
import { curveValue } from "./curves";
import type { CurveLookup, RewardResource, RewardVariable, Situation } from "./types";

export type NameKind = "literal" | "game" | "curve";

export interface CurveUse {
  curve: RewardCurve;
  input: string;
  inputValue: number;
  gameInput: number;
}

export interface ResolvedName {
  name: string;
  variable: string | null;
  reason: string | null;
  kind: NameKind | null;
  value: number | null;
  curve: CurveUse | null;
  error: string | null;
}

function chooseVariable(resource: RewardResource, name: string, tags: readonly string[]) {
  const input = resource.inputs.find((entry) => entry.name === name);
  if (!input) {
    return { variable: name, reason: null, isInput: false };
  }
  const option = input.options.find((entry) => conditionHolds(entry.when, tags));
  return option
    ? { variable: option.use, reason: describeCondition(option.when), isInput: true }
    : { variable: input.default, reason: "default", isInput: true };
}

function valueOf(
  variable: RewardVariable,
  situation: Situation,
  curves: CurveLookup,
): Pick<ResolvedName, "kind" | "value" | "curve" | "error"> {
  switch (variable.type) {
    case "literal":
      return { kind: "literal", value: variable.value, curve: null, error: null };
    case "game":
      return {
        kind: "game",
        value: situation.game[variable.game] ?? defaultGameValue(variable.game),
        curve: null,
        error: null,
      };
    case "scaling": {
      const curve = curves(variable.curve);
      if (!curve) {
        return { kind: "curve", value: null, curve: null, error: `Unknown curve "${variable.curve}"` };
      }
      const inputValue = situation.scaling[variable.input] ?? 0;
      const gameInput = toGameUnits(variable.input, inputValue);
      return {
        kind: "curve",
        value: curveValue(curve, gameInput),
        curve: { curve, input: variable.input, inputValue, gameInput },
        error: null,
      };
    }
  }
}

export function resolveNames(
  resource: RewardResource,
  names: readonly string[],
  situation: Situation,
  curves: CurveLookup,
): Map<string, ResolvedName> {
  const resolved = new Map<string, ResolvedName>();
  for (const name of names) {
    const choice = chooseVariable(resource, name, situation.tags);
    const variable = resource.variables.find((entry) => entry.name === choice.variable);
    if (!variable) {
      resolved.set(name, {
        name,
        variable: choice.isInput ? choice.variable : null,
        reason: choice.reason,
        kind: null,
        value: null,
        curve: null,
        error: choice.isInput ? `Input "${name}" uses unknown variable "${choice.variable}"` : `Unknown name "${name}"`,
      });
      continue;
    }
    resolved.set(name, {
      name,
      variable: variable.name,
      reason: choice.reason,
      ...valueOf(variable, situation, curves),
    });
  }
  return resolved;
}
