import type { DamageRule } from "@/core/data";
import { formatNumber, formatPercent } from "@/ui";

const ADD_OPERATION = "Add";

export function isAddRule(rule: DamageRule): boolean {
  return rule.operation === ADD_OPERATION;
}

export function ruleAmountText(rule: DamageRule): string {
  if (isAddRule(rule)) {
    return `${rule.amount > 0 ? "+" : ""}${formatNumber(rule.amount)} damage`;
  }
  return formatPercent(rule.amount / 100, { signed: true });
}

export function operationLabel(rule: DamageRule): string {
  return isAddRule(rule) ? "Add" : rule.operation.replace(/_Ongoing$/, "").replace(/_/g, " ");
}
