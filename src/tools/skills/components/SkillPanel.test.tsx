import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SkillsFile } from "@/core/data";
import fixture from "../fixtures/skills.json";
import { NO_EFFECTS_NOTE, SkillPanel } from "./SkillPanel";

const file = fixture as SkillsFile;
const skill = (id: string) => file.skills.find((entry) => entry.id === id)!;

describe("SkillPanel", () => {
  it("shows the effect with its trigger, values by level and change from level 0", () => {
    render(<SkillPanel skill={skill("Driver.AimDownSightSpeed.MountedGun")} roleLabel="Driver" chartWidth={400} />);
    const effect = screen.getByRole("region", { name: "ADS time" });
    expect(within(effect).getByText("On your items")).toBeInTheDocument();
    const rows = within(effect).getAllByRole("row");
    const level4 = rows.find((row) => within(row).queryByText("4"));
    expect(level4).toHaveTextContent("×0.6");
    expect(level4).toHaveTextContent("−40%");
    expect(within(effect).getByText("ADS time by level")).toBeInTheDocument();
    expect(screen.getByText("Ring")).toBeInTheDocument();
  });

  it("explains when a skill has no effect data", () => {
    render(<SkillPanel skill={skill("Driver.AutoRepair")} roleLabel="Driver" />);
    expect(screen.getByText(NO_EFFECTS_NOTE)).toBeInTheDocument();
  });

  it("skips the chart when fewer than three levels are stored", () => {
    render(<SkillPanel skill={skill("Infantry.SprintBreach")} roleLabel="Assault" />);
    expect(screen.queryByText(/by level$/)).toBeNull();
    expect(screen.getByText("Always")).toBeInTheDocument();
  });

  it("says when a skill is not placed in the tree", () => {
    render(<SkillPanel skill={skill("Medic.MedkitUsage")} roleLabel="Medic" />);
    expect(screen.getByText("Not placed in the tree")).toBeInTheDocument();
  });
});
