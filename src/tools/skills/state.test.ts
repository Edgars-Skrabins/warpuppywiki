import { describe, expect, it } from "vitest";
import { orderedRoles } from "./state";

const tree = (role: string) => ({ role, rows: 4, columns: 9, shape: "Circle" });
const skill = (role: string) => ({ id: `${role}.Skill`, role, effects: [] });

describe("orderedRoles", () => {
  it("orders roles as in game: Assault, Support, Medic, Recon, Pilot, Driver", () => {
    const trees = ["Driver", "Infantry", "Medic", "Pilot", "Recon", "Support"].map(tree);
    expect(orderedRoles(trees, [])).toEqual(["Infantry", "Support", "Medic", "Recon", "Pilot", "Driver"]);
  });

  it("adds roles that have skills but no tree, once, after the known roles", () => {
    expect(orderedRoles([tree("Driver")], [skill("Tanker"), skill("driver"), skill("Tanker")])).toEqual([
      "Driver",
      "Tanker",
    ]);
  });
});
