import { PRECEDENCE, type Expr } from "./parse";
import type { Operator } from "./tokenize";

function precedenceOf(expr: Expr): number {
  return expr.type === "Binary" ? PRECEDENCE[expr.op] : Infinity;
}

export function formatInline(expr: Expr): string {
  switch (expr.type) {
    case "Num":
      return String(expr.value);
    case "Name":
      return expr.name;
    case "Unary": {
      const operand = formatInline(expr.operand);
      return expr.operand.type === "Binary" ? `-(${operand})` : `-${operand}`;
    }
    case "Call":
      return `${expr.callee}(${expr.args.map(formatInline).join(", ")})`;
    case "Binary": {
      const precedence = PRECEDENCE[expr.op];
      const left = formatInline(expr.left);
      const right = formatInline(expr.right);
      const wrappedLeft = precedenceOf(expr.left) < precedence ? `(${left})` : left;
      const wrappedRight = precedenceOf(expr.right) <= precedence ? `(${right})` : right;
      return `${wrappedLeft} ${expr.op} ${wrappedRight}`;
    }
  }
}

function topLevelTerms(expr: Expr, precedence: number): { op: Operator | null; expr: Expr }[] {
  if (expr.type === "Binary" && PRECEDENCE[expr.op] === precedence) {
    return [...topLevelTerms(expr.left, precedence), { op: expr.op, expr: expr.right }];
  }
  return [{ op: null, expr }];
}

export function formatFormula(expr: Expr): string {
  if (expr.type !== "Binary") {
    return formatInline(expr);
  }
  const precedence = PRECEDENCE[expr.op];
  return topLevelTerms(expr, precedence)
    .map(({ op, expr: term }) => {
      const text = formatInline(term);
      const wrapped =
        precedenceOf(term) < precedence || (op !== null && precedenceOf(term) === precedence) ? `(${text})` : text;
      return op === null ? wrapped : `${op} ${wrapped}`;
    })
    .join("\n");
}
