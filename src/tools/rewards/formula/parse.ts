import { FormulaSyntaxError, tokenize, type Operator, type Token } from "./tokenize";

export type Expr =
  | { type: "Num"; value: number }
  | { type: "Name"; name: string }
  | { type: "Unary"; op: "-"; operand: Expr }
  | { type: "Binary"; op: Operator; left: Expr; right: Expr }
  | { type: "Call"; callee: string; args: Expr[] };

export const PRECEDENCE: Record<Operator, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

const UNARY_PRECEDENCE = 3;

function describe(token: Token): string {
  switch (token.kind) {
    case "number":
      return `number ${token.value}`;
    case "name":
      return `name "${token.value}"`;
    case "operator":
      return `"${token.value}"`;
    case "lparen":
      return `"("`;
    case "rparen":
      return `")"`;
    case "comma":
      return `","`;
    case "end":
      return "end of formula";
  }
}

export function parse(source: string): Expr {
  const tokens = tokenize(source);
  let index = 0;

  const peek = (): Token => tokens[index] ?? tokens[tokens.length - 1]!;
  const next = (): Token => {
    const token = peek();
    index += 1;
    return token;
  };
  const unexpected = (token: Token) => new FormulaSyntaxError(`Unexpected ${describe(token)}`, token.position);
  const expect = (kind: Token["kind"], text: string) => {
    const token = next();
    if (token.kind !== kind) {
      throw new FormulaSyntaxError(`Expected ${text} but found ${describe(token)}`, token.position);
    }
  };

  const parseCall = (callee: string): Expr => {
    const args: Expr[] = [];
    if (peek().kind === "rparen") {
      next();
      return { type: "Call", callee, args };
    }
    for (;;) {
      args.push(parseExpression(0));
      const token = next();
      if (token.kind === "rparen") {
        return { type: "Call", callee, args };
      }
      if (token.kind !== "comma") {
        throw new FormulaSyntaxError(`Expected "," or ")" but found ${describe(token)}`, token.position);
      }
    }
  };

  const parsePrefix = (): Expr => {
    const token = next();
    switch (token.kind) {
      case "number":
        return { type: "Num", value: token.value };
      case "name":
        if (peek().kind === "lparen") {
          next();
          return parseCall(token.value);
        }
        return { type: "Name", name: token.value };
      case "lparen": {
        const inner = parseExpression(0);
        expect("rparen", `")"`);
        return inner;
      }
      case "operator":
        if (token.value === "-") {
          return { type: "Unary", op: "-", operand: parseExpression(UNARY_PRECEDENCE) };
        }
        throw unexpected(token);
      default:
        throw unexpected(token);
    }
  };

  function parseExpression(minPrecedence: number): Expr {
    let left = parsePrefix();
    for (;;) {
      const token = peek();
      if (token.kind !== "operator" || PRECEDENCE[token.value] <= minPrecedence) {
        return left;
      }
      next();
      const right = parseExpression(PRECEDENCE[token.value]);
      left = { type: "Binary", op: token.value, left, right };
    }
  }

  const expr = parseExpression(0);
  const trailing = peek();
  if (trailing.kind !== "end") {
    throw unexpected(trailing);
  }
  return expr;
}

export function namesIn(expr: Expr): string[] {
  const names: string[] = [];
  const visit = (node: Expr) => {
    switch (node.type) {
      case "Name":
        if (!names.includes(node.name)) {
          names.push(node.name);
        }
        return;
      case "Unary":
        visit(node.operand);
        return;
      case "Binary":
        visit(node.left);
        visit(node.right);
        return;
      case "Call":
        node.args.forEach(visit);
        return;
      case "Num":
        return;
    }
  };
  visit(expr);
  return names;
}
