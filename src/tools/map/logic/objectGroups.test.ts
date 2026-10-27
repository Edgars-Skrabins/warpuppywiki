import { describe, expect, it } from "vitest";
import type { MapObject, ObjectsFile } from "@/core/data";
import objectsJson from "@/test/fixtures/data/25937608/maps/kavkazi/objects.json";
import { factionKey, factionLabel, groupObjects, headingDegrees } from "./objectGroups";

const objects = (objectsJson as ObjectsFile).objects;

function ids(list: readonly MapObject[] | undefined): string[] {
  return (list ?? []).map((object) => object.kind);
}

describe("groupObjects", () => {
  it("puts each Kavkazi object under its layer", () => {
    const groups = groupObjects(objects);
    expect(ids(groups.equipmentVendors)).toEqual(["equipment-vendor"]);
    expect(ids(groups.vehicleVendors)).toEqual(["vehicle-vendor"]);
    expect(ids(groups.garageVendors)).toEqual(["garage-vendor"]);
    expect(ids(groups.spawns)).toEqual(["safe-zone"]);
    expect(ids(groups.spawnVolumes)).toEqual(["spawn-volume"]);
  });

  it("leaves layers with nothing on the map empty and drops kinds no layer shows", () => {
    const camera = { ...objects[0]!, kind: "safe-zone-camera" } as MapObject;
    const groups = groupObjects([camera]);
    expect(groups.deploymentBoards).toEqual([]);
    expect(groups.fuelRefills).toEqual([]);
    expect(Object.values(groups).flat()).toEqual([]);
    expect(groups.objectives).toBeUndefined();
  });
});

describe("factionKey", () => {
  it("matches faction ids ignoring case and treats a missing faction as neutral", () => {
    expect(factionKey("Charlie")).toBe("charlie");
    expect(factionKey("ALPHA")).toBe("alpha");
    expect(factionKey(null)).toBe("neutral");
    expect(factionKey(undefined)).toBe("neutral");
  });

  it("colors an unknown faction as neutral but keeps its name as the label", () => {
    expect(factionKey("Delta")).toBe("neutral");
    expect(factionLabel("Delta")).toBe("Delta");
    expect(factionLabel("bravo")).toBe("Bravo");
    expect(factionLabel(null)).toBe("Neutral");
  });
});

describe("headingDegrees", () => {
  it("wraps yaw into 0–360 degrees", () => {
    expect(headingDegrees(-282.85)).toBeCloseTo(77.15);
    expect(headingDegrees(303.81)).toBeCloseTo(303.81);
    expect(headingDegrees(null)).toBeNull();
  });
});
