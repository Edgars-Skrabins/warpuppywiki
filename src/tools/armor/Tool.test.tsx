import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import { toolArmor, toolItems } from "./fixtures/testData";
import Tool from "./Tool";

function renderTool() {
  const router = createMemoryRouter([{ path: "/armor", element: <Tool /> }], { initialEntries: ["/armor"] });
  renderWithData(<RouterProvider router={router} />, {
    fixtures: {
      "25937608/items.json": fixtureWith("25937608/items.json", "items", toolItems),
      "25937608/equipment.json": fixtureWith("25937608/equipment.json", "armor", toolArmor),
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Armor & Weight", () => {
  it("highlights the five zones Level 4 armor covers", async () => {
    renderTool();
    const user = userEvent.setup();
    const table = await screen.findByRole("grid", { name: "Body armor" });
    await user.click(within(table).getByText("Level 4 Armor"));
    const body = await screen.findByRole("img", { name: "Coverage: Level 4 Armor" });
    expect(body.querySelectorAll('[data-covered="true"]')).toHaveLength(5);
  });

  it("renders the ammo matrix for the M4", async () => {
    renderTool();
    const matrix = await screen.findByRole("grid", { name: "Ammo against armor" });
    expect(screen.getByRole("combobox", { name: "Reference weapon" })).toHaveValue("M4");
    expect(within(matrix).getAllByRole("row")).toHaveLength(7);
    expect(within(matrix).getByText("Level 3 Armor")).toBeInTheDocument();
  });

  it("highlights Medium for an 18 kg kit", async () => {
    renderTool();
    const user = userEvent.setup();
    const field = await screen.findByRole("textbox", { name: "Your kit weight" });
    await user.type(field, "18");
    await user.tab();
    expect(await screen.findByRole("status")).toHaveTextContent("Medium · 9 kg until Heavy");
    const current = within(screen.getByRole("table", { name: "Weight classes" }))
      .getAllByRole("row")
      .find((row) => row.getAttribute("aria-current") === "true");
    expect(current).toBeDefined();
    expect(within(current!).getByRole("rowheader")).toHaveTextContent("Medium");
  });
});
