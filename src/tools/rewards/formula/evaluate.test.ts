import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { parse } from "./parse";

const names: Record<string, number> = { A: 2, B: 3, "Dotted.Name": 10 };

function run(source: string): number {
  return evaluate(parse(source), (name) => names[name]);
}

describe("evaluate", () => {
  it("does arithmetic with precedence, parentheses and unary minus", () => {
    expect(run("A + B * 4")).toBe(14);
    expect(run("(A + B) * 4")).toBe(20);
    expect(run("Dotted.Name / 4 - 1")).toBe(1.5);
    expect(run("-A * -B")).toBe(6);
  });

  it("clamps", () => {
    expect(run("clamp(7, 0, 5)")).toBe(5);
    expect(run("clamp(-1, 0, 5)")).toBe(0);
    expect(run("clamp(A, 0, 5)")).toBe(2);
  });

  it("raises to a power", () => {
    expect(run("pow(0.8, A)")).toBeCloseTo(0.64);
    expect(run("pow(0.8, 0)")).toBe(1);
  });

  it("takes max and min", () => {
    expect(run("max(A, B)")).toBe(3);
    expect(run("min(A, B)")).toBe(2);
  });

  it("rejects unknown functions", () => {
    expect(() => run("sqrt(A)")).toThrow('Unknown function "sqrt"');
    expect(() => run("constructor(A)")).toThrow('Unknown function "constructor"');
  });

  it("rejects calls with the wrong number of arguments", () => {
    expect(() => run("clamp(A, 0)")).toThrow("clamp expects 3 arguments but got 2");
    expect(() => run("pow(A)")).toThrow("pow expects 2 arguments but got 1");
  });

  it("rejects names the resolver does not know", () => {
    expect(() => run("A + Missing")).toThrow('Unknown name "Missing"');
  });
});
