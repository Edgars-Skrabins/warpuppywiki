import { describe, expect, it } from "vitest";
import type { SkillsFile } from "@/core/data";
import fixture from "../fixtures/skills.json";
import { searchEntries } from "./skillSearch";

const file = fixture as SkillsFile;
const labels: Record<string, string> = { Infantry: "Assault", Medic: "Medic", Driver: "Driver" };
const entries = searchEntries(file.skills, ["Infantry", "Medic", "Driver"], (role) => labels[role] ?? role);

describe("searchEntries", () => {
  it("covers every role, ordered by role and then name", () => {
    expect(entries).toHaveLength(file.skills.length);
    const roles = entries.map((entry) => entry.roleLabel);
    expect(roles.indexOf("Medic")).toBeGreaterThan(roles.lastIndexOf("Assault"));
    expect(roles.indexOf("Driver")).toBeGreaterThan(roles.lastIndexOf("Medic"));
    const driverNames = entries.filter((entry) => entry.roleLabel === "Driver").map((entry) => entry.skill.name ?? "");
    expect(driverNames).toEqual([...driverNames].sort((a, b) => a.localeCompare(b)));
  });

  it("searches the name and the description", () => {
    const entry = entries.find((candidate) => candidate.skill.id === "Driver.AutoRepair");
    expect(entry?.text).toContain("Can autorepair at petrol stations");
    expect(entry?.text).toContain("Unlocks the ability to auto repair");
  });

  it("labels each entry with its role and puts unknown roles last", () => {
    const withUnknown = searchEntries(
      [...file.skills, { id: "Tanker.Armour", role: "Tanker", name: "Armour", effects: [] }],
      ["Infantry", "Medic", "Driver"],
      (role) => labels[role] ?? role,
    );
    expect(withUnknown.at(-1)?.roleLabel).toBe("Tanker");
    expect(entries[0]?.roleLabel).toBe("Assault");
  });
});
