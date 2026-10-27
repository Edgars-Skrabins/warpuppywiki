import { describe, expect, it } from "vitest";
import type { Skill, SkillsFile } from "@/core/data";
import fixture from "../fixtures/skills.json";
import { shortLabel, treeLayout, TREE_PADDING, TREE_WIDTH, unplacedSkills } from "./treeLayout";

const file = fixture as SkillsFile;
const roleSkills = (role: string): Skill[] => file.skills.filter((skill) => skill.role === role);

describe("treeLayout", () => {
  const layout = treeLayout([...roleSkills("Infantry"), ...roleSkills("Driver")]);

  it("fits every node inside the viewBox with padding", () => {
    expect(layout.width).toBe(TREE_WIDTH);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(TREE_PADDING - 1e-9);
      expect(node.x).toBeLessThanOrEqual(layout.width - TREE_PADDING + 1e-9);
      expect(node.y).toBeGreaterThanOrEqual(TREE_PADDING - 1e-9);
      expect(node.y).toBeLessThanOrEqual(layout.height - TREE_PADDING + 1e-9);
    }
  });

  it("keeps the rings inside the viewBox", () => {
    for (const ring of layout.rings) {
      expect(layout.centre.x - ring.radius).toBeGreaterThanOrEqual(TREE_PADDING - 1e-9);
      expect(layout.centre.x + ring.radius).toBeLessThanOrEqual(layout.width - TREE_PADDING + 1e-9);
      expect(layout.centre.y - ring.radius).toBeGreaterThanOrEqual(TREE_PADDING - 1e-9);
    }
  });

  it("gives larger radii to outer rows", () => {
    const radii = layout.rings.map((ring) => ring.radius);
    expect(layout.rings.map((ring) => ring.row)).toEqual([0, 1, 2, 3]);
    expect(radii).toEqual([...radii].sort((a, b) => a - b));
    expect(new Set(radii).size).toBe(radii.length);
  });

  it("orders nodes by ring and then column", () => {
    const order = layout.nodes.map((node) => [node.row, node.column]);
    expect(order).toEqual([...order].sort((a, b) => a[0]! - b[0]! || a[1]! - b[1]!));
  });

  it("keeps the stored proportions of the canvas", () => {
    const [a, b] = treeLayout(roleSkills("Driver")).nodes;
    const source = roleSkills("Driver").filter((skill) => skill.layout);
    expect(a, "first node").toBeDefined();
    expect(b, "second node").toBeDefined();
    const ratio = (b!.x - a!.x) / (b!.y - a!.y);
    const [sa, sb] = [source.find((s) => s.id === a!.skill.id)!, source.find((s) => s.id === b!.skill.id)!];
    expect(ratio).toBeCloseTo((sb.layout!.x - sa.layout!.x) / (sb.layout!.y - sa.layout!.y));
  });

  it("handles a role with no placed skills", () => {
    const empty = treeLayout(roleSkills("Medic"));
    expect(empty.nodes).toEqual([]);
    expect(empty.rings).toEqual([]);
  });
});

describe("node labels", () => {
  it("uses the first two words of the name", () => {
    const skill = file.skills.find((entry) => entry.id === "Driver.AimDownSightSpeed.MountedGun")!;
    expect(shortLabel(skill)).toBe("Time-to-ADS speed");
  });

  it("lists skills without a layout as unplaced", () => {
    expect(unplacedSkills(file.skills).map((skill) => skill.id)).toEqual(["Medic.MedkitUsage"]);
  });
});
