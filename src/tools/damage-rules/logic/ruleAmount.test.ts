import { describe, expect, it } from "vitest";
import type { DamageRule } from "@/core/data";
import { operationLabel, ruleAmountText } from "./ruleAmount";

function rule(operation: string, amount: number): DamageRule {
  return {
    entity: "Infantry",
    source: [],
    target: [],
    instigator: [],
    hitLocations: [],
    category: "None",
    operation,
    amount,
  };
}

describe("ruleAmountText", () => {
  it("shows percentage rules as signed percentages", () => {
    expect(ruleAmountText(rule("Percentage_Ongoing", 30))).toBe("+30%");
    expect(ruleAmountText(rule("Percentage_Ongoing", 100))).toBe("+100%");
    expect(ruleAmountText(rule("Percentage_Ongoing", -55))).toBe("−55%");
    expect(ruleAmountText(rule("Percentage_Ongoing", 0))).toBe("0%");
  });

  it("shows Add rules as flat damage", () => {
    expect(ruleAmountText(rule("Add", 1000))).toBe("+1,000 damage");
    expect(ruleAmountText(rule("Add", -20))).toBe("−20 damage");
  });
});

describe("operationLabel", () => {
  it("names the operations in plain words", () => {
    expect(operationLabel(rule("Percentage_Ongoing", 30))).toBe("Percentage");
    expect(operationLabel(rule("Add", 30))).toBe("Add");
  });
});
