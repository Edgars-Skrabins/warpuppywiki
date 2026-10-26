import { describe, expect, it } from "vitest";
import { parseCompareIds, parseView, toggleCompareId } from "./state";

const HAVOC = "Vehicle.Variant.Air.Rotary.Havoc.Default";
const HUMVEE = "Vehicle.Variant.Land.Wheeled.Humvee.Default";
const T72 = "Vehicle.Variant.Land.Tracked.TNK_04.Default";
const MH6 = "Vehicle.Variant.Air.Rotary.Littlebird.Default";

describe("parseCompareIds", () => {
  it("reads up to three distinct ids", () => {
    expect(parseCompareIds(null)).toEqual([]);
    expect(parseCompareIds(`${HAVOC}, ${HAVOC.toUpperCase()},,${HUMVEE}`)).toEqual([HAVOC, HUMVEE]);
    expect(parseCompareIds([HAVOC, HUMVEE, T72, MH6].join(","))).toEqual([HAVOC, HUMVEE, T72]);
  });
});

describe("toggleCompareId", () => {
  it("adds and removes ids, never above three", () => {
    expect(toggleCompareId([HAVOC], HUMVEE)).toEqual([HAVOC, HUMVEE]);
    expect(toggleCompareId([HAVOC, HUMVEE], HAVOC.toLowerCase())).toEqual([HUMVEE]);
    expect(toggleCompareId([HAVOC, HUMVEE, T72], MH6)).toEqual([HAVOC, HUMVEE, T72]);
  });
});

describe("parseView", () => {
  it("defaults to the table", () => {
    expect(parseView("compare")).toBe("compare");
    expect(parseView(null)).toBe("table");
    expect(parseView("other")).toBe("table");
  });
});
