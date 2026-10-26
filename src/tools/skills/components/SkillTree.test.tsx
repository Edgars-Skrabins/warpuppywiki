import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SkillsFile } from "@/core/data";
import fixture from "../fixtures/skills.json";
import { treeLayout } from "../logic/treeLayout";
import { SkillTree } from "./SkillTree";

const file = fixture as SkillsFile;
const infantry = file.skills.filter((skill) => skill.role === "Infantry");

function renderTree(onSelect = vi.fn(), selectedId: string | null = null) {
  render(
    <SkillTree layout={treeLayout(infantry)} label="Assault skill tree" selectedId={selectedId} onSelect={onSelect} />,
  );
  return onSelect;
}

describe("SkillTree", () => {
  it("focuses nodes in ring and then column order", async () => {
    renderTree();
    const user = userEvent.setup();
    const names: string[] = [];
    for (let index = 0; index < infantry.length; index++) {
      await user.tab();
      names.push(document.activeElement?.getAttribute("aria-label") ?? "");
    }
    const expected = [...infantry]
      .sort((a, b) => a.layout!.row - b.layout!.row || a.layout!.column - b.layout!.column)
      .map((skill) => skill.name);
    expect(names).toEqual(expected);
  });

  it("selects a node with Enter and with a click", async () => {
    const onSelect = renderTree();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("Infantry.UnarmedSprintSpeed");
    await user.click(screen.getByRole("button", { name: /Sprint-breach/ }));
    expect(onSelect).toHaveBeenLastCalledWith("Infantry.SprintBreach");
  });

  it("shows a short label and the full name as a tooltip", () => {
    renderTree();
    const node = screen.getByRole("button", { name: /Time-to-ADS speed improvement/ });
    expect(node.querySelector("title")?.textContent).toBe("Time-to-ADS speed improvement (Assault Archetype)");
    expect(node.querySelector("text")?.textContent).toBe("Time-to-ADSspeed");
  });

  it("fills nodes with effect data and outlines the others", () => {
    renderTree(vi.fn(), "Infantry.MeleeDamage");
    const melee = screen.getByRole("button", { name: /Melee damage/ });
    expect(melee).not.toHaveAttribute("data-filled");
    expect(melee).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Sprint-breach/ })).toHaveAttribute("data-filled", "true");
  });

  it("draws one arc per ring", () => {
    const { container } = render(
      <SkillTree layout={treeLayout(infantry)} label="Assault skill tree" selectedId={null} onSelect={vi.fn()} />,
    );
    const rows = new Set(infantry.map((skill) => skill.layout!.row));
    expect(container.querySelectorAll("path")).toHaveLength(rows.size);
  });
});
