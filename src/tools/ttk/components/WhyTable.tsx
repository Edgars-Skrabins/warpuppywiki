import type { HitResult, Step } from "@/core/damage";
import type { DamageRule } from "@/core/data";
import { DataTable, formatMultiplier, formatNumber, formatPercent, type Column } from "@/ui";
import { describeRuleSubject, type RuleContext } from "../logic/describeRule";

export interface WhyTableProps {
  hit: HitResult;
  rules: readonly DamageRule[];
  context: RuleContext;
}

interface WhyRow {
  key: string;
  step: string;
  effect: string;
  after: number;
}

function ruleOf(step: Step, rules: readonly DamageRule[]): DamageRule | undefined {
  return step.ruleIndex === undefined ? undefined : rules[step.ruleIndex];
}

function toRow(step: Step, index: number, rules: readonly DamageRule[], context: RuleContext): WhyRow {
  const rule = ruleOf(step, rules);
  const isRule = step.kind === "rule" && rule !== undefined;
  return {
    key: `${index}`,
    step: isRule ? describeRuleSubject(rule, context) : step.label,
    effect:
      step.factor === null || step.kind === "base"
        ? "—"
        : isRule
          ? formatPercent(step.factor - 1, { signed: true })
          : formatMultiplier(step.factor),
    after: step.after,
  };
}

const COLUMNS: readonly Column<WhyRow>[] = [
  { key: "step", header: "Step", value: (row) => row.step },
  { key: "effect", header: "Effect", value: (row) => row.effect, align: "end" },
  {
    key: "after",
    header: "Damage",
    value: (row) => row.after,
    render: (row) => formatNumber(row.after),
    align: "end",
  },
];

export function WhyTable({ hit, rules, context }: WhyTableProps) {
  return (
    <DataTable
      aria-label="Why this damage"
      columns={COLUMNS}
      rows={hit.steps.map((step, index) => toRow(step, index, rules, context))}
      getRowKey={(row) => row.key}
      emptyText="No steps"
    />
  );
}
