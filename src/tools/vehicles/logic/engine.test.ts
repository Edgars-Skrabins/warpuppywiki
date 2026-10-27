import { describe, expect, it } from "vitest";
import { fixtureVehicle } from "../fixtures/testData";
import { gearCount, peakTorque, torqueCurve } from "./engine";

describe("peakTorque", () => {
  it("finds the Humvee's peak torque and its RPM", () => {
    expect(peakTorque(fixtureVehicle("Humvee").engine)).toEqual({ rpm: 2500, torque: 1450 });
  });

  it("applies the torque scale", () => {
    const engine = {
      torqueCurve: [
        { rpm: 1000, torque: 300 },
        { rpm: 2000, torque: 500 },
      ],
      torqueScale: 0.5,
    };
    expect(peakTorque(engine)).toEqual({ rpm: 2000, torque: 250 });
    expect(torqueCurve(engine)).toEqual([
      { rpm: 1000, torque: 150 },
      { rpm: 2000, torque: 250 },
    ]);
  });

  it("is null without an engine", () => {
    expect(peakTorque(fixtureVehicle("Havoc").engine)).toBeNull();
  });
});

describe("gearCount", () => {
  it("excludes the reverse gear, which is the last ratio", () => {
    expect(gearCount(fixtureVehicle("Humvee").transmission)).toBe(5);
  });

  it("does not count neutral ratios of zero", () => {
    expect(gearCount(fixtureVehicle("T-72B3").transmission)).toBe(8);
  });

  it("is null without a transmission", () => {
    expect(gearCount(fixtureVehicle("Havoc").transmission)).toBeNull();
  });
});
