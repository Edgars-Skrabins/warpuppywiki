import { describe, expect, it } from "vitest";
import { decodeState, encodeState, MAX_URL_STATE_LENGTH } from "@/core/state";
import { mapStateCodec, withPlan } from "../state";
import {
  addMeasurePoint,
  addPin,
  addRingSet,
  emptyPlan,
  isPlanEmpty,
  PLAN_LIMITS,
  removePin,
  removeRingSet,
  roundPosition,
  updatePin,
  type Plan,
} from "./plan";

function fullPlan(): Plan {
  let plan = emptyPlan();
  for (let index = 0; index < PLAN_LIMITS.pins; index++) {
    plan = addPin(plan, [-16000 + index * 517.37, -20000 + index * 611.13])!.plan;
  }
  for (let index = 0; index < PLAN_LIMITS.ringSets; index++) {
    plan = addRingSet(plan, [-9000.47 + index * 1234.5, -11000.21 - index * 777.7], [500, 1000, 2000, 3000])!;
  }
  return plan;
}

describe("plan limits", () => {
  it("fits a world plan with 30 pins and 5 ring sets in the URL", () => {
    const state = withPlan(mapStateCodec.defaults, "kavkazi", fullPlan);
    const text = encodeState(mapStateCodec, state);
    expect(text.length).toBeLessThanOrEqual(MAX_URL_STATE_LENGTH);
    expect(decodeState(mapStateCodec, text)).toEqual({ state, error: false });
  });

  it("refuses a 31st pin and a 6th ring set", () => {
    const plan = fullPlan();
    expect(addPin(plan, [0, 0])).toBeNull();
    expect(addRingSet(plan, [0, 0], [100])).toBeNull();
  });

  it("rejects a link whose plan breaks the limits", () => {
    const tooMany = { ...fullPlan(), pins: [...fullPlan().pins, { ...fullPlan().pins[0]!, id: 99 }] };
    const text = encodeState(
      mapStateCodec,
      withPlan(mapStateCodec.defaults, "kavkazi", () => tooMany),
    );
    expect(decodeState(mapStateCodec, text).error).toBe(true);
  });
});

describe("pins", () => {
  it("names new pins by number and rounds positions to 0.1 m", () => {
    const first = addPin(emptyPlan(), [-100.04, 250.06])!;
    expect(first.pin).toEqual({ id: 1, position: [-100, 250.1], label: "Pin 1", color: "yellow", icon: "flag" });
    expect(addPin(first.plan, [0, 0])!.pin.label).toBe("Pin 2");
  });

  it("edits, trims, moves and deletes a pin", () => {
    const { plan } = addPin(emptyPlan(), [0, 0])!;
    const edited = updatePin(plan, 1, { label: `  ${"x".repeat(50)} `, color: "teal", position: [5.55, 6.66] });
    expect(edited.pins[0]).toMatchObject({ label: "x".repeat(40), color: "teal", position: [5.6, 6.7] });
    expect(updatePin(plan, 1, { label: "   " }).pins[0]!.label).toBe("Pin 1");
    expect(removePin(edited, 1).pins).toEqual([]);
  });
});

describe("ring sets and measure points", () => {
  it("adds and removes ring sets", () => {
    const plan = addRingSet(emptyPlan(), [10.04, 20], [100, 200])!;
    expect(plan.rings).toEqual([{ id: 1, center: [10, 20], distances: [100, 200] }]);
    expect(isPlanEmpty(removeRingSet(plan, 1))).toBe(true);
  });

  it("skips a repeated point, as from a double-click, and stops at the limit", () => {
    const points = addMeasurePoint([[1, 2]], [1.01, 2.02]);
    expect(points).toBeNull();
    const full = Array.from({ length: PLAN_LIMITS.measurePoints }, (_, index) => roundPosition([index, 0]));
    expect(addMeasurePoint(full, [999, 999])).toBeNull();
  });
});
