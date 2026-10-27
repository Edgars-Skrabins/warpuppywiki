export type Operator = "+" | "-" | "*" | "/";

export type Token =
  | { kind: "number"; value: number; position: number }
  | { kind: "name"; value: string; position: number }
  | { kind: "operator"; value: Operator; position: number }
  | { kind: "lparen" | "rparen" | "comma" | "end"; position: number };

export class FormulaSyntaxError extends Error {
  readonly position: number;

  constructor(message: string, position: number) {
    super(`${message} at position ${position}`);
    this.name = "FormulaSyntaxError";
    this.position = position;
  }
}

const NUMBER = /^(?:\d+(?:\.\d*)?|\.\d+)/;
const NAME = /^[A-Za-z_][A-Za-z0-9_.]*/;
const OPERATORS = new Set<string>(["+", "-", "*", "/"]);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  while (position < source.length) {
    const char = source.charAt(position);
    if (/\s/.test(char)) {
      position += 1;
      continue;
    }
    const rest = source.slice(position);
    const number = NUMBER.exec(rest);
    if (number) {
      tokens.push({ kind: "number", value: Number(number[0]), position });
      position += number[0].length;
      continue;
    }
    const name = NAME.exec(rest);
    if (name) {
      tokens.push({ kind: "name", value: name[0], position });
      position += name[0].length;
      continue;
    }
    if (OPERATORS.has(char)) {
      tokens.push({ kind: "operator", value: char as Operator, position });
    } else if (char === "(") {
      tokens.push({ kind: "lparen", position });
    } else if (char === ")") {
      tokens.push({ kind: "rparen", position });
    } else if (char === ",") {
      tokens.push({ kind: "comma", position });
    } else {
      throw new FormulaSyntaxError(`Unexpected character "${char}"`, position);
    }
    position += 1;
  }
  tokens.push({ kind: "end", position });
  return tokens;
}
