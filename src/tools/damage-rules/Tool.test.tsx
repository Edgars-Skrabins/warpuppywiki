import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { damageFixture, vehiclesFixture } from "./fixtures/gameData";
import { damageRulesState } from "./state";
import DamageRulesTool from "./Tool";

const fixtures = {
  "25937608/damage.json": damageFixture,
  "25937608/vehicles.json": vehiclesFixture,
};

function renderTool(search = "") {
  return renderWithData(
    <MemoryRouter initialEntries={[`/damage-rules${search}`]}>
      <DamageRulesTool />
    </MemoryRouter>,
    { fixtures },
  );
}

function ruleRows(): HTMLElement[] {
  return within(screen.getByRole("table", { name: "Damage rules" }))
    .getAllByRole("row")
    .slice(1);
}

function ruleIndex(row: HTMLElement): string {
  return within(row).getAllByRole("cell")[0]?.textContent ?? "";
}

describe("Damage rules tool", () => {
  it("hides zero and friendly-fire rules by default", async () => {
    renderTool();
    await screen.findByRole("table", { name: "Damage rules" });
    const indexes = ruleRows().map(ruleIndex);
    expect(indexes).not.toContain("5");
    expect(indexes).not.toContain("20");
    expect(indexes).toContain("25");
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
  });

  it("shows the hollow point rules when searching for HollowPoint", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.click(await screen.findByRole("searchbox", { name: "Source tag" }));
    await user.paste("HollowPoint");
    await waitFor(() => {
      expect(ruleRows().map(ruleIndex)).toEqual(["0", "9", "25", "27", "28", "92", "93"]);
      expect(within(ruleRows()[2]!).getByText("+100%")).toBeInTheDocument();
    });
  });

  it("marks the rules that apply to a described hit", async () => {
    const hit = {
      source: ["Bullet.762mm", "AmmoModifier.HollowPoint"],
      target: ["Armor.Heavy"],
      attacker: [],
      location: "Infantry.Torso.Upper",
    };
    renderTool(`?rules=${encodeState(damageRulesState, { ...damageRulesState.defaults, group: "infantry", hit })}`);
    await screen.findByRole("table", { name: "Damage rules" });
    const byIndex = new Map(ruleRows().map((row) => [ruleIndex(row), row]));
    expect(byIndex.get("25")).toHaveAttribute("data-applies", "true");
    expect(byIndex.get("28")).toHaveAttribute("data-applies", "true");
    expect(byIndex.get("27")).toHaveAttribute("data-applies", "false");
    expect(screen.getByRole("button", { name: "Which rules apply?" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("×0.54")).toBeInTheDocument();
  });

  it("shows the sniper head multiplier in the heat map", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.click(await screen.findByRole("tab", { name: "Body-part multipliers" }));
    const heatmap = await screen.findByRole("table", { name: "Body-part multipliers" });
    const sniper = within(heatmap)
      .getAllByRole("row")
      .find((row) => within(row).queryByRole("rowheader")?.textContent === "Weapon.Sniper");
    expect(within(sniper!).getByTitle("Weapon.Sniper, Head: ×4.2667")).toHaveTextContent("4.2667");
    expect(within(heatmap).getAllByRole("row")[1]).toHaveTextContent("Universal");
  });
});
