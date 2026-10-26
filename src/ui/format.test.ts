import { describe, expect, it } from "vitest";
import {
  formatCash,
  formatDelta,
  formatDistance,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatSeconds,
  formatWeight,
} from "./format";

describe("formatNumber", () => {
  it("groups thousands and limits fraction digits", () => {
    expect(formatNumber(1234.5)).toBe("1,234.5");
    expect(formatNumber(1.23456)).toBe("1.23");
    expect(formatNumber(1.23456, { maxFractionDigits: 0 })).toBe("1");
  });

  it("uses a minus sign for negatives", () => {
    expect(formatNumber(-3)).toBe("−3");
  });

  it("returns a dash for missing input", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
  });
});

describe("formatCash", () => {
  it("formats dollars without cents", () => {
    expect(formatCash(1250)).toBe("$1,250");
  });

  it("shows zero as $0 unless asked for Free", () => {
    expect(formatCash(0)).toBe("$0");
    expect(formatCash(0, { zeroAsFree: true })).toBe("Free");
    expect(formatCash(5, { zeroAsFree: true })).toBe("$5");
  });

  it("returns a dash for missing input", () => {
    expect(formatCash(null)).toBe("—");
  });
});

describe("formatDistance", () => {
  it("uses meters below 1000 m and kilometers from 1000 m", () => {
    expect(formatDistance(350)).toBe("350 m");
    expect(formatDistance(999)).toBe("999 m");
    expect(formatDistance(1000)).toBe("1 km");
    expect(formatDistance(1200)).toBe("1.2 km");
  });

  it("returns a dash for missing input", () => {
    expect(formatDistance(undefined)).toBe("—");
  });
});

describe("formatSeconds", () => {
  it("formats seconds", () => {
    expect(formatSeconds(0.85)).toBe("0.85 s");
    expect(formatSeconds(2)).toBe("2 s");
  });

  it("uses milliseconds below one second when asked", () => {
    expect(formatSeconds(0.85, { ms: true })).toBe("850 ms");
    expect(formatSeconds(1.5, { ms: true })).toBe("1.5 s");
  });

  it("returns a dash for missing input", () => {
    expect(formatSeconds(null, { ms: true })).toBe("—");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a percentage", () => {
    expect(formatPercent(0.12)).toBe("12%");
    expect(formatPercent(0.125)).toBe("12.5%");
  });

  it("adds a sign when signed", () => {
    expect(formatPercent(0.12, { signed: true })).toBe("+12%");
    expect(formatPercent(-0.12, { signed: true })).toBe("−12%");
    expect(formatPercent(0, { signed: true })).toBe("0%");
  });

  it("returns a dash for missing input", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatMultiplier", () => {
  it("prefixes a multiplication sign", () => {
    expect(formatMultiplier(1.19)).toBe("×1.19");
  });

  it("returns a dash for missing input", () => {
    expect(formatMultiplier(null)).toBe("—");
  });
});

describe("formatWeight", () => {
  it("formats kilograms", () => {
    expect(formatWeight(3.17)).toBe("3.17 kg");
  });

  it("returns a dash for missing input", () => {
    expect(formatWeight(undefined)).toBe("—");
  });
});

describe("formatDelta", () => {
  it("reports an increase", () => {
    expect(formatDelta(0.5, 0.6, "seconds")).toEqual({ text: "+0.1 s", direction: "up" });
  });

  it("reports a decrease with a minus sign", () => {
    expect(formatDelta(0.6, 0.5, "seconds")).toEqual({ text: "−0.1 s", direction: "down" });
    expect(formatDelta(1500, 1250, "cash")).toEqual({ text: "−$250", direction: "down" });
  });

  it("reports no change", () => {
    expect(formatDelta(3, 3, "number")).toEqual({ text: "0", direction: "none" });
    expect(formatDelta(0.1 + 0.2, 0.3, "number")).toEqual({ text: "0", direction: "none" });
  });

  it("formats the change with the given kind", () => {
    expect(formatDelta(0.1, 0.22, "percent")).toEqual({ text: "+12%", direction: "up" });
    expect(formatDelta(0.9, 0.2, "milliseconds")).toEqual({ text: "−700 ms", direction: "down" });
    expect(formatDelta(300, 1500, "distance")).toEqual({ text: "+1.2 km", direction: "up" });
    expect(formatDelta(1, 4, (magnitude) => `${magnitude} hits`)).toEqual({ text: "+3 hits", direction: "up" });
  });

  it("returns a dash when either side is missing", () => {
    expect(formatDelta(null, 1, "number")).toEqual({ text: "—", direction: "none" });
    expect(formatDelta(1, undefined, "number")).toEqual({ text: "—", direction: "none" });
  });
});
