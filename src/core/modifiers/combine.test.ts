import { describe, expect, it } from "vitest";
import { combine } from "./combine";
import type { ModifierOp, SourcedModifier } from "./types";

function mod(source: string, op: ModifierOp, value: number): SourcedModifier {
  return { source, modifier: { attribute: "Weapon.AimTime", op, value } };
}

describe("combine", () => {
  it("returns the base when there are no modifiers", () => {
    expect(combine(0.4, [])).toEqual({ base: 0.4, value: 0.4, steps: [], overridden: false });
  });

  it("stacks compound multipliers multiplicatively", () => {
    const result = combine(1, [mod("A", "multiplyCompound", 1.1), mod("B", "multiplyCompound", 1.1)]);
    expect(result.value).toBeCloseTo(1.21);
    expect(result.steps.map((step) => step.after)).toEqual([expect.closeTo(1.1), expect.closeTo(1.21)]);
  });

  it("stacks plain multipliers additively", () => {
    const result = combine(1, [mod("A", "multiply", 1.1), mod("B", "multiply", 1.1)]);
    expect(result.value).toBeCloseTo(1.2);
    expect(result.steps.map((step) => step.after)).toEqual([expect.closeTo(1.1), expect.closeTo(1.2)]);
  });

  it("applies adds, then multiplies, then compounds whatever the source order", () => {
    const result = combine(10, [
      mod("Compound", "multiplyCompound", 0.5),
      mod("Multiply A", "multiply", 1.2),
      mod("Add", "add", 2),
      mod("Multiply B", "multiply", 0.9),
    ]);
    expect(result.value).toBeCloseTo((10 + 2) * (1 + 0.2 - 0.1) * 0.5);
    expect(result.overridden).toBe(false);
    expect(result.steps.map(({ source, op, value, overridden }) => ({ source, op, value, overridden }))).toEqual([
      { source: "Add", op: "add", value: 2, overridden: false },
      { source: "Multiply A", op: "multiply", value: 1.2, overridden: false },
      { source: "Multiply B", op: "multiply", value: 0.9, overridden: false },
      { source: "Compound", op: "multiplyCompound", value: 0.5, overridden: false },
    ]);
    const afters = result.steps.map((step) => step.after);
    [12, 14.4, 13.2, 6.6].forEach((expected, index) => expect(afters[index]).toBeCloseTo(expected));
  });

  it("lets an override win over everything and marks earlier steps overridden", () => {
    const result = combine(1, [
      mod("Add", "add", 1),
      mod("Override", "override", 0.75),
      mod("Multiply", "multiply", 2),
      mod("Compound", "multiplyCompound", 3),
    ]);
    expect(result.value).toBe(0.75);
    expect(result.overridden).toBe(true);
    expect(result.steps.map((step) => [step.source, step.overridden])).toEqual([
      ["Add", true],
      ["Multiply", true],
      ["Compound", true],
      ["Override", false],
    ]);
    expect(result.steps.at(-1)?.after).toBe(0.75);
  });

  it("uses the last override in source order", () => {
    const result = combine(1, [mod("First", "override", 0.5), mod("Second", "override", 0.8)]);
    expect(result.value).toBe(0.8);
    expect(result.steps).toEqual([{ source: "Second", op: "override", value: 0.8, after: 0.8, overridden: false }]);
  });
});
