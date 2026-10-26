import { describe, expect, it } from "vitest";
import { columnName, gridLabels, gridLines, gridRef, visibleLabels, type GridBounds } from "./grid";

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
    expect(columns[0]).toEqual({ axis: "x", index: 0, text: "A", start: -16320, end: -15320 });
    expect(columns.at(-1)).toEqual({ axis: "x", index: 16, text: "Q", start: -320, end: 0 });
    expect(rows.map((label) => label.text)).toEqual(Array.from({ length: 17 }, (_, index) => String(index + 1)));
  });
});

describe("visibleLabels", () => {
  const labels = gridLabels(kavkazi);
  const place = (pixelsPerMeter: number, min = kavkazi.min, max = kavkazi.max) =>
    visibleLabels(labels, { pixelsPerMeter, min, max });
  const texts = (placed: ReturnType<typeof place>) => placed.map(({ label }) => label.text);

  it("shows every label in the middle of its square when squares are wide enough", () => {
    const placed = place(0.1);
    expect(placed).toHaveLength(34);
    expect(placed.find(({ label }) => label.text === "B")?.along).toBe(-14820);
  });

  it("thins labels out so they stay readable when zoomed out", () => {
    expect(texts(place(0.01))).toEqual(["D", "G", "J", "M", "4", "7", "10", "13"]);
  });

  it("keeps labels clear of the view's edges", () => {
    const first = place(0.05).find(({ label }) => label.text === "A");
    expect(first?.along).toBeCloseTo(-16320 + 32 / 0.05);
  });

  it("moves a label to the start of the visible part of its square when the middle is off screen", () => {
    const placed = place(4, [-12600, -16000], [-12350, -15950]);
    expect(texts(placed)).toEqual(["D", "5"]);
    expect(placed[0]?.along).toBe(-12600 + 8);
    expect(placed[1]?.along).toBe(-16000 + 8);
  });

  it("keeps the last label inside its square, clear of the far edge", () => {
    const last = place(0.03).find(({ label }) => label.text === "P");
    expect(last?.along).toBeCloseTo(-32 / 0.03);
  });

  it("drops labels of squares outside the view", () => {
    expect(texts(place(0.2, [-10000, -12000], [-9500, -11500]))).toEqual(["G", "9"]);
  });

  it("shows nothing for an unusable scale", () => {
    expect(place(0)).toEqual([]);
  });
});

describe("columnName", () => {
  it("continues past Z with two letters", () => {
    expect(columnName(25)).toBe("Z");
    expect(columnName(26)).toBe("AA");
    expect(columnName(27)).toBe("AB");
  });
});

describe("unusable bounds", () => {
  it("draws no grid for empty, inverted or non-finite bounds", () => {
    const broken: GridBounds[] = [
      { min: [0, 0], max: [0, 0] },
      { min: [100, 100], max: [-100, -100] },
      { min: [Number.NaN, 0], max: [1000, 1000] },
    ];
    for (const bounds of broken) {
      expect(gridLines(bounds, { minor: true }).filter((line) => line.axis === "x")).toEqual([]);
      expect(gridLabels(bounds).filter((label) => label.axis === "x")).toEqual([]);
      expect(gridRef(bounds, 0, 0)).toBeNull();
    }
  });

  it("skips 100 m lines when they would be too dense to draw", () => {
    const huge: GridBounds = { min: [0, 0], max: [500_000, 500_000] };
    const lines = gridLines(huge, { minor: true });
    expect(lines.some((line) => !line.major)).toBe(false);
    expect(lines.filter((line) => line.axis === "x")).toHaveLength(501);
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
