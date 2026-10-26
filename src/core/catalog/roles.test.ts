import { describe, expect, it } from "vitest";
import { rolesFile, tagsFile } from "./fixtures/gameData";
import { IdMap } from "./ids";
import { levelForXp, roleLabel, xpForLevel } from "./roles";

const tagTexts = new IdMap<string>();
for (const entry of tagsFile.tags) {
  tagTexts.set(entry.tag, entry.text);
}
const roles = rolesFile.roles;

describe("roleLabel", () => {
  it("uses the game's role name in title case", () => {
    expect(roleLabel(tagTexts, "Infantry")).toBe("Assault");
  });

  it("shows Wardog as Wardog", () => {
    expect(roleLabel(tagTexts, "Wardog")).toBe("Wardog");
  });

  it("falls back to the role id", () => {
    expect(roleLabel(tagTexts, "Chef")).toBe("Chef");
  });
});

describe("xpForLevel", () => {
  it("returns the total XP for a level", () => {
    expect(xpForLevel(roles, "Infantry", 0)).toBe(0);
    expect(xpForLevel(roles, "infantry", 2)).toBe(750);
  });

  it("returns null for roles without an XP table", () => {
    expect(xpForLevel(roles, "Wardog", 10)).toBeNull();
  });
});

describe("levelForXp", () => {
  it("returns the highest level whose total XP is reached", () => {
    expect(levelForXp(roles, "Infantry", 0)).toBe(0);
    expect(levelForXp(roles, "Infantry", 749)).toBe(1);
    expect(levelForXp(roles, "Infantry", 750)).toBe(2);
    expect(levelForXp(roles, "Infantry", 10_000_000)).toBe(100);
  });

  it("returns null for unknown roles", () => {
    expect(levelForXp(roles, "Wardog", 100)).toBeNull();
  });
});
