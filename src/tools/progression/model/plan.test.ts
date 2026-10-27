import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/core/catalog";
import { ItemsFile } from "@/core/data/schemas/items";
import { MetaFile } from "@/core/data/schemas/meta";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import metaJson from "../fixtures/meta.json";
import { gatedItems } from "./goals";
import { planSummary, xpAtLevel, type PlanSummary } from "./plan";
import { addGoals, DEFAULT_PROGRESS, resolveProgress, setGoalUnlocked, type ProgressState } from "./progress";

const rolesFile = RolesFile.parse(rolesJson);
const roles = rolesFile.roles;
const meta = MetaFile.parse(metaJson);
const itemsFile = ItemsFile.parse(itemsJson);
const mosin = itemsFile.items.find((item) => item.id === "Id.Item.Mosin");
if (mosin === undefined) {
  throw new Error("No Mosin in fixtures");
}
const levelTwoItem = { ...mosin, id: "Id.Item.LevelTwo", unlock: { role: "Recon", level: 2, cost: 7500 } };
const catalog = buildCatalog({
  items: { ...itemsFile, items: [...itemsFile.items, levelTwoItem] },
  tags: TagsFile.parse(tagsJson),
  roles: rolesFile,
});
const gated = gatedItems(catalog);

function plan(progress: ProgressState, includePurchase = false): PlanSummary {
  return planSummary(resolveProgress(progress, roles, meta), catalog, roles, gated, { includePurchase });
}

function role(summary: PlanSummary, id: string) {
  const found = summary.roles.find((entry) => entry.role === id);
  if (found === undefined) {
    throw new Error(`No role ${id}`);
  }
  return found;
}

function roleTable(id: string) {
  const found = roles.find((entry) => entry.id === id);
  if (found === undefined) {
    throw new Error(`No role table ${id}`);
  }
  return found;
}

describe("xpAtLevel", () => {
  it("reads the total from the role table and clamps beyond the last level", () => {
    const infantry = roleTable("Infantry");
    expect(xpAtLevel(infantry, 2)).toBe(750);
    expect(xpAtLevel(infantry, 100)).toBe(5132500);
    expect(xpAtLevel(infantry, 140)).toBe(5132500);
  });
});

describe("planSummary", () => {
  it("needs the XP between the current and the highest goal level of each role", () => {
    const progress = {
      ...addGoals(DEFAULT_PROGRESS, ["Id.Item.M4", "Id.Item.AK74MExtendedMagazine"]),
      roles: { Infantry: 0 },
    };
    const infantry = role(plan(progress), "Infantry");
    expect(infantry.label).toBe("Assault");
    expect(infantry.targetLevel).toBe(28);
    expect(infantry.xpNeeded).toBe(xpAtLevel(roleTable("Infantry"), 28));
    expect(role(plan(progress), "Recon").targetLevel).toBeNull();
    expect(role(plan(progress), "Recon").xpNeeded).toBe(0);
  });

  it("needs 750 XP from level 0 to level 2, and none once the level is passed", () => {
    const progress = addGoals(DEFAULT_PROGRESS, ["Id.Item.LevelTwo"]);
    expect(role(plan(progress), "Recon").xpNeeded).toBe(750);
    expect(role(plan({ ...progress, roles: { Recon: 1 } }), "Recon").xpNeeded).toBe(550);
    expect(role(plan({ ...progress, roles: { Recon: 5 } }), "Recon").xpNeeded).toBe(0);
  });

  it("counts no unlock cost for reached goals marked unlocked", () => {
    const progress = { ...addGoals(DEFAULT_PROGRESS, ["Id.Item.M4", "Id.Item.SV98"]), cash: 0 };
    expect(plan(progress).cash.unlockCost).toBe(250000);
    const markedButNotReached = setGoalUnlocked(progress, "Id.Item.M4", true);
    expect(plan(markedButNotReached).cash.unlockCost).toBe(250000);
    const reachedAndMarked = { ...markedButNotReached, roles: { Infantry: 28 } };
    const summary = plan(reachedAndMarked);
    expect(summary.cash.unlockCost).toBe(100000);
    expect(summary.goals.find((goal) => goal.item.id === "Id.Item.M4")).toMatchObject({
      reached: true,
      unlocked: true,
      unlockCost: 0,
    });
  });

  it("adds shop prices when buying one of each, minus the cash on hand", () => {
    const progress = { ...addGoals(DEFAULT_PROGRESS, ["Id.Item.M4"]), cash: 50000 };
    const without = plan(progress).cash;
    expect(without).toMatchObject({ unlockCost: 150000, purchaseCost: 0, total: 150000, needed: 100000 });
    const withPurchase = plan(progress, true).cash;
    expect(withPurchase).toMatchObject({ purchaseCost: 2800, total: 152800, needed: 102800 });
    expect(plan({ ...progress, cash: 1000000 }).cash.needed).toBe(0);
  });

  it("rounds match estimates up and gives none without a rate", () => {
    const progress = { ...addGoals(DEFAULT_PROGRESS, ["Id.Item.M4"]), cash: 0 };
    expect(role(plan(progress), "Infantry").matches).toBeNull();
    expect(plan(progress).cash.matches).toBeNull();
    const rated = { ...progress, rates: { xpPerMatch: 1000, cashPerMatch: 40000 } };
    const summary = plan(rated);
    expect(role(summary, "Infantry").matches).toBe(Math.ceil(role(summary, "Infantry").xpNeeded / 1000));
    expect(summary.cash.matches).toBe(4);
    expect(plan({ ...rated, rates: { xpPerMatch: 0, cashPerMatch: null } }).cash.matches).toBeNull();
  });

  it("gates career items on the career level", () => {
    const progress = addGoals(DEFAULT_PROGRESS, ["Id.Item.3xScope", "Id.Item.LightArmor"]);
    expect(plan(progress).career).toEqual({ currentLevel: 0, requiredLevel: 31, reached: false });
    const summary = plan({ ...progress, careerLevel: 31 });
    expect(summary.career.reached).toBe(true);
    expect(summary.goals.every((goal) => goal.gate === "career" && goal.reached)).toBe(true);
    expect(summary.roles.every((entry) => entry.targetLevel === null)).toBe(true);
    expect(plan(DEFAULT_PROGRESS).career).toEqual({ currentLevel: 0, requiredLevel: null, reached: true });
  });
});
