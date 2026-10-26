import { describe, expect, it } from "vitest";
import { fixtureDamage, fixtureVehicle, testCatalog } from "../fixtures/testData";
import { bestMarkers, compareSections, protectionText, seatRulesFor, type CompareRow } from "./vehicleCompare";
import { vehicleRow } from "./vehicleRows";

const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}%`;

function row(key: string): CompareRow {
  const vehicles = ["Havoc", "T-72B3", "Humvee"].map((name) => vehicleRow(fixtureVehicle(name), testCatalog));
  const found = compareSections(vehicles, fixtureDamage.vehicleSeats)
    .flatMap((section) => section.rows)
    .find((candidate) => candidate.key === key);
  if (!found) throw new Error(`No row ${key}`);
  return found;
}

describe("bestMarkers", () => {
  it("marks the highest or lowest value, including ties", () => {
    expect(bestMarkers([400, 60, 113], "higher")).toEqual([true, false, false]);
    expect(bestMarkers([28000, 16000, 3000], "lower")).toEqual([false, false, true]);
    expect(bestMarkers([800, 800, 500], "higher")).toEqual([true, true, false]);
  });

  it("marks nothing when values are equal, missing or not ranked", () => {
    expect(bestMarkers([3, 3], "higher")).toEqual([false, false]);
    expect(bestMarkers([null, 5], "higher")).toEqual([false, false]);
    expect(bestMarkers([1, 2], undefined)).toEqual([false, false]);
  });
});

describe("compareSections", () => {
  it("marks the best numeric values per row", () => {
    expect(row("price")).toMatchObject({ values: [28000, 16000, 3000], best: [false, false, true] });
    expect(row("topSpeed")).toMatchObject({ best: [true, false, false] });
    expect(row("seats")).toMatchObject({ values: [2, 3, 4], best: [false, false, true] });
    expect(row("health")).toMatchObject({ values: [800, 800, 500], best: [true, true, false] });
    expect(row("criticalThreshold")).toMatchObject({ best: [false, false, false] });
  });

  it("includes engine, gearbox and explosion rows", () => {
    expect(row("peakTorque")).toMatchObject({ values: [null, 1800, 1450] });
    expect(row("gears")).toMatchObject({ values: [null, 8, 5] });
    expect(row("explosionRadius")).toMatchObject({ values: [13, 12, 10] });
  });
});

describe("protectionText", () => {
  it("describes occupant protection or says there is no data", () => {
    const havoc = seatRulesFor(fixtureDamage.vehicleSeats, "Vehicle.Variant.Air.Rotary.Havoc.Default");
    expect(protectionText(havoc, signed)).toBe("Small and medium arms −90%, high −50%, special −60%");
    expect(
      protectionText(seatRulesFor(fixtureDamage.vehicleSeats, "Vehicle.Variant.Land.Tracked.TNK_04.Default"), signed),
    ).toBe("No data");
  });
});
