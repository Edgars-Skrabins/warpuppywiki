import { describe, expect, it } from "vitest";
import { columnName, gridLabels, gridLines, gridRef, type GridBounds } from "./grid";

const kavkazi: GridBounds = { min: [-16320, -20400], max: [0, -4080] };

describe("gridLines", () => {
  it("draws 1 km lines across the Kavkazi bounds, closing at the far edge", () => {
    const columns = gridLines(kavkazi).filter((line) => line.axis === "x");
    expect(columns).toHaveLength(18);
    expect(columns[0]).toEqual({ axis: "x", position: -16320, major: true });
    expect(columns[1]?.position).toBe(-15320);
    expect(columns.at(-2)?.position).toBe(-320);
    expect(columns.at(-1)?.position).toBe(0);
  });

  it("adds 100 m lines only when asked, without repeating the 1 km lines", () => {
    expect(gridLines(kavkazi).every((line) => line.major)).toBe(true);
    const minor = gridLines(kavkazi, { minor: true }).filter((line) => !line.major && line.axis === "y");
    expect(minor).toHaveLength(16 * 9 + 3);
    expect(minor[0]?.position).toBe(-20300);
    expect(minor.some((line) => line.position === -19400)).toBe(false);
    expect(minor.at(-1)?.position).toBe(-4100);
  });
});

describe("gridLabels", () => {
  it("labels 17 columns with letters and 17 rows with numbers from the minimum corner", () => {
    const labels = gridLabels(kavkazi);
    const columns = labels.filter((label) => label.axis === "x");
    const rows = labels.filter((label) => label.axis === "y");
    expect(columns).toHaveLength(17);
    expect(columns.map((label) => label.text).join("")).toBe("ABCDEFGHIJKLMNOPQ");
    expect(columns[0]).toEqual({ axis: "x", text: "A", start: -16320, end: -15320 });
    expect(columns.at(-1)).toEqual({ axis: "x", text: "Q", start: -320, end: 0 });
    expect(rows.map((label) => label.text)).toEqual(Array.from({ length: 17 }, (_, index) => String(index + 1)));
  });
});

describe("columnName", () => {
  it("continues past Z with two letters", () => {
    expect(columnName(25)).toBe("Z");
    expect(columnName(26)).toBe("AA");
    expect(columnName(27)).toBe("AB");
  });
});

describe("gridRef", () => {
  it("names the first square A1", () => {
    expect(gridRef(kavkazi, -16000, -20000)).toBe("A1");
  });

  it("counts columns along X and rows along Y", () => {
    expect(gridRef(kavkazi, -16320 + 5500, -20400 + 6200)).toBe("F7");
  });

  it("puts the far edge in the last, partial square", () => {
    expect(gridRef(kavkazi, 0, -4080)).toBe("Q17");
  });

  it("returns null outside the bounds", () => {
    expect(gridRef(kavkazi, 10, -10000)).toBeNull();
  });
});
