import type { Expr } from "./parse";

export class FormulaEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaEvaluationError";
  }
}

const FUNCTIONS: Record<string, { arity: number; apply: (args: number[]) => number }> = {
  clamp: { arity: 3, apply: ([value = 0, min = 0, max = 0]) => Math.min(Math.max(value, min), max) },
  pow: { arity: 2, apply: ([base = 0, exponent = 0]) => Math.pow(base, exponent) },
  max: { arity: 2, apply: ([a = 0, b = 0]) => Math.max(a, b) },
  min: { arity: 2, apply: ([a = 0, b = 0]) => Math.min(a, b) },
};

export function evaluate(expr: Expr, resolve: (name: string) => number | undefined): number {
  switch (expr.type) {
    case "Num":
      return expr.value;
    case "Name": {
      const value = resolve(expr.name);
      if (value === undefined) {
        throw new FormulaEvaluationError(`Unknown name "${expr.name}"`);
      }
      return value;
    }
    case "Unary":
      return -evaluate(expr.operand, resolve);
    case "Binary": {
      const left = evaluate(expr.left, resolve);
      const right = evaluate(expr.right, resolve);
      switch (expr.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
      }
      break;
    }
    case "Call": {
      const fn = Object.hasOwn(FUNCTIONS, expr.callee) ? FUNCTIONS[expr.callee] : undefined;
      if (!fn) {
        throw new FormulaEvaluationError(`Unknown function "${expr.callee}"`);
      }
      if (expr.args.length !== fn.arity) {
        throw new FormulaEvaluationError(`${expr.callee} expects ${fn.arity} arguments but got ${expr.args.length}`);
      }
      return fn.apply(expr.args.map((arg) => evaluate(arg, resolve)));
    }
  }
}
