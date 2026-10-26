import { describe, expect, it } from "vitest";
import { namesIn, parse } from "./parse";
import { FormulaSyntaxError, tokenize } from "./tokenize";

describe("tokenize", () => {
  it("reads numbers, dotted names, operators, parens and commas with positions", () => {
    expect(tokenize("clamp(A.b_1, .5, 2) * 10")).toEqual([
      { kind: "name", value: "clamp", position: 0 },
      { kind: "lparen", position: 5 },
      { kind: "name", value: "A.b_1", position: 6 },
      { kind: "comma", position: 11 },
      { kind: "number", value: 0.5, position: 13 },
      { kind: "comma", position: 15 },
      { kind: "number", value: 2, position: 17 },
      { kind: "rparen", position: 18 },
      { kind: "operator", value: "*", position: 20 },
      { kind: "number", value: 10, position: 22 },
      { kind: "end", position: 24 },
    ]);
  });

  it("rejects unknown characters with their position", () => {
    expect(() => tokenize("A ^ 2")).toThrow(new FormulaSyntaxError('Unexpected character "^"', 2));
  });
});

describe("parse", () => {
  it("binds * and / tighter than + and -", () => {
    expect(parse("A + B * C")).toEqual({
      type: "Binary",
      op: "+",
      left: { type: "Name", name: "A" },
      right: {
        type: "Binary",
        op: "*",
        left: { type: "Name", name: "B" },
        right: { type: "Name", name: "C" },
      },
    });
  });

  it("is left-associative", () => {
    expect(parse("8 - 4 - 2")).toEqual({
      type: "Binary",
      op: "-",
      left: { type: "Binary", op: "-", left: { type: "Num", value: 8 }, right: { type: "Num", value: 4 } },
      right: { type: "Num", value: 2 },
    });
  });

  it("parses unary minus tighter than multiplication", () => {
    expect(parse("-A * 2")).toEqual({
      type: "Binary",
      op: "*",
      left: { type: "Unary", op: "-", operand: { type: "Name", name: "A" } },
      right: { type: "Num", value: 2 },
    });
    expect(parse("--3")).toEqual({
      type: "Unary",
      op: "-",
      operand: { type: "Unary", op: "-", operand: { type: "Num", value: 3 } },
    });
  });

  it("uses parentheses to group", () => {
    expect(parse("(A + B) * C")).toMatchObject({ type: "Binary", op: "*", left: { type: "Binary", op: "+" } });
  });

  it("parses nested calls with dotted names", () => {
    expect(parse("pow(Crew.Penalty, clamp(CrewCount - 1, 0, 5))")).toEqual({
      type: "Call",
      callee: "pow",
      args: [
        { type: "Name", name: "Crew.Penalty" },
        {
          type: "Call",
          callee: "clamp",
          args: [
            {
              type: "Binary",
              op: "-",
              left: { type: "Name", name: "CrewCount" },
              right: { type: "Num", value: 1 },
            },
            { type: "Num", value: 0 },
            { type: "Num", value: 5 },
          ],
        },
      ],
    });
  });

  it.each([
    ["A +", "Unexpected end of formula at position 3"],
    ["(A + B", 'Expected ")" but found end of formula at position 6'],
    ["A B", 'Unexpected name "B" at position 2'],
    ["clamp(A B)", 'Expected "," or ")" but found name "B" at position 8'],
    ["* A", 'Unexpected "*" at position 0'],
    ["A + )", 'Unexpected ")" at position 4'],
  ])("reports a syntax error for %s", (source, message) => {
    expect(() => parse(source)).toThrow(message);
  });

  it("lists every name once in order of appearance", () => {
    expect(namesIn(parse("A * clamp(B, 0, A) + C.D"))).toEqual(["A", "B", "C.D"]);
  });
});
