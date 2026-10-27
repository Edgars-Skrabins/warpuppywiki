import { afterEach, describe, expect, it } from "vitest";
import { MetaFile } from "@/core/data/schemas/meta";
import { RolesFile } from "@/core/data/schemas/roles";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import metaJson from "../fixtures/meta.json";
import {
  addGoals,
  DEFAULT_PROGRESS,
  initialCash,
  progressStore,
  removeGoal,
  resolveProgress,
  setGoalUnlocked,
  withRoleLevel,
} from "./progress";

const roles = RolesFile.parse(rolesJson).roles;
const meta = MetaFile.parse(metaJson);

afterEach(() => {
  localStorage.clear();
});

describe("progress", () => {
  it("defaults to level 0 in every role, career 0 and the initial cash balance", () => {
    const resolved = resolveProgress(progressStore.read(), roles, meta);
    expect(resolved.roles).toEqual({ Driver: 0, Infantry: 0, Medic: 0, Pilot: 0, Recon: 0, Support: 0 });
    expect(resolved.careerLevel).toBe(0);
    expect(resolved.cash).toBe(10000);
    expect(resolved.goals).toEqual([]);
  });

  it("reads the initial balance of the Cash currency", () => {
    expect(initialCash(meta)).toBe(10000);
    expect(initialCash({ ...meta, currencies: [] })).toBe(0);
  });

  it("keeps entered cash and levels, matching roles case-insensitively", () => {
    const progress = withRoleLevel(withRoleLevel({ ...DEFAULT_PROGRESS, cash: 0 }, "infantry", 12), "Infantry", 28);
    const resolved = resolveProgress(progress, roles, meta);
    expect(resolved.roles.Infantry).toBe(28);
    expect(Object.keys(progress.roles)).toEqual(["Infantry"]);
    expect(resolved.cash).toBe(0);
  });

  it("round-trips through local storage under wpw.progression version 1", () => {
    const progress = addGoals(withRoleLevel(DEFAULT_PROGRESS, "Recon", 18), ["Id.Item.SV98"]);
    progressStore.write(progress);
    expect(JSON.parse(localStorage.getItem("wpw.progression") ?? "null")).toEqual({ version: 1, value: progress });
    expect(progressStore.read()).toEqual(progress);
  });

  it("adds goals once, removes them and marks them unlocked", () => {
    let progress = addGoals(DEFAULT_PROGRESS, ["Id.Item.M4", "id.item.m4", "Id.Item.SV98"]);
    progress = addGoals(progress, ["ID.ITEM.SV98"]);
    expect(progress.goals.map((goal) => goal.itemId)).toEqual(["Id.Item.M4", "Id.Item.SV98"]);
    progress = setGoalUnlocked(progress, "id.item.m4", true);
    expect(progress.goals[0]).toEqual({ itemId: "Id.Item.M4", unlocked: true });
    expect(removeGoal(progress, "Id.Item.SV98").goals).toHaveLength(1);
  });
});
