import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import { buildablesFile, toolDamageRules, toolItems, toolProjectiles } from "./fixtures/testData";
import Tool from "./Tool";

const BUILD = "25937608";

function renderTool(path = "/buildables") {
  return renderWithData(
    <MemoryRouter initialEntries={[path]}>
      <Tool />
    </MemoryRouter>,
    {
      fixtures: {
        [`${BUILD}/buildables.json`]: buildablesFile,
        [`${BUILD}/damage.json`]: fixtureWith(`${BUILD}/damage.json`, "rules", toolDamageRules),
        [`${BUILD}/ammo.json`]: fixtureWith(`${BUILD}/ammo.json`, "projectiles", toolProjectiles),
        [`${BUILD}/items.json`]: fixtureWith(`${BUILD}/items.json`, "items", toolItems),
      },
    },
  );
}

function rowNames(): string[] {
  const table = screen.getByRole("grid", { name: "Buildables" });
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByRole("rowheader").lastElementChild?.lastElementChild?.textContent ?? "");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Buildables tool", () => {
  it("sorts buildables by health", async () => {
    const user = userEvent.setup();
    renderTool();

    await screen.findByText("Indirect Fire Shelter");
    await user.click(screen.getByRole("columnheader", { name: /^Health$/ }));

    expect(rowNames()).toEqual(["Sandbag Wall", "Indirect Fire Shelter"]);

    await user.click(screen.getByRole("columnheader", { name: /^Health$/ }));

    expect(rowNames()).toEqual(["Indirect Fire Shelter", "Sandbag Wall"]);
  });

  it("opens a drawer with stats and damage rules", async () => {
    const user = userEvent.setup();
    renderTool();

    await user.click(await screen.findByText("Indirect Fire Shelter"));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByText("7.5 × 7.5 × 4.6 m")).toBeInTheDocument();
    expect(within(dialog).getByText("25")).toBeInTheDocument();
    const rules = within(dialog).getByRole("grid", { name: "Indirect Fire Shelter damage rules" });
    expect(within(rules).getByRole("row", { name: /IEDs/ })).toHaveTextContent("+200%");
  });

  it("opens the drawer from the URL and shows hits for a picked rocket", async () => {
    const user = userEvent.setup();
    renderTool("/buildables?b=Id.Buildable.SandbagWall");

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByRole("combobox", { name: "Projectile" }), "84");
    await user.click(screen.getByRole("option", { name: "84mm" }));

    expect(within(dialog).getByText("1")).toBeInTheDocument();
    expect(within(dialog).getByText("hit")).toBeInTheDocument();
    const applied = within(dialog).getByRole("grid", { name: "Rules applied to 84mm against Sandbag Wall" });
    expect(within(applied).getByRole("row", { name: /Rockets/ })).toHaveTextContent("+650%");
    expect(within(dialog).getByText(/Direct-hit damage only/)).toBeInTheDocument();
  });
});
