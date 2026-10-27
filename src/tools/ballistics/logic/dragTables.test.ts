import { describe, expect, it } from "vitest";
import { G1_TABLE, G7_TABLE, dragCoefficient, dragModelOf } from "./dragTables";

describe("dragCoefficient", () => {
  it("returns the table values at Mach 0 and 3", () => {
    expect(dragCoefficient("G7", 0)).toBe(0.1198);
    expect(dragCoefficient("G7", 3)).toBe(0.2424);
    expect(dragCoefficient("G1", 0)).toBe(0.2629);
    expect(dragCoefficient("G1", 3)).toBe(0.5133);
  });

  it("interpolates linearly between two points", () => {
    const [m0, c0] = G7_TABLE[40]!;
    const [m1, c1] = G7_TABLE[41]!;
    expect(dragCoefficient("G7", m0 + (m1 - m0) * 0.25)).toBeCloseTo(c0 + (c1 - c0) * 0.25, 12);
  });

  it("holds the end values outside the table", () => {
    expect(dragCoefficient("G1", -1)).toBe(G1_TABLE[0]![1]);
    expect(dragCoefficient("G1", 9)).toBe(G1_TABLE[G1_TABLE.length - 1]![1]);
  });

  it("covers Mach 0 to 5 in ascending order", () => {
    for (const table of [G1_TABLE, G7_TABLE]) {
      expect(table[0]![0]).toBe(0);
      expect(table[table.length - 1]![0]).toBe(5);
      expect(table.every((point, i) => i === 0 || point[0] > table[i - 1]![0])).toBe(true);
    }
  });
});

describe("dragModelOf", () => {
  it("uses G1 only for G1 models and G7 otherwise", () => {
    expect(dragModelOf("G1 (Flat Bottom)")).toBe("G1");
    expect(dragModelOf("G7 (Boat Tail)")).toBe("G7");
    expect(dragModelOf("GA (Pellet)")).toBe("G7");
    expect(dragModelOf(null)).toBe("G7");
  });
});
