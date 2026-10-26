import { fixtureWith, renderWithData } from "@/core/data/testing";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import items from "./fixtures/items.json";
import loot from "./fixtures/loot.json";
import Tool from "./Tool";

function renderTool() {
  const router = createMemoryRouter([{ path: "/loot", element: <Tool /> }], { initialEntries: ["/loot"] });
  return renderWithData(<RouterProvider router={router} />, {
    fixtures: {
      "25937608/loot.json": loot,
      "25937608/items.json": fixtureWith("25937608/items.json", "items", items),
    },
  });
}

describe("Loot Tables", () => {
  it("shows the rules and entries of the selected table", async () => {
    const user = userEvent.setup();
    renderTool();
    const nav = await screen.findByRole("navigation", { name: "Loot tables" });
    await user.click(within(nav).getByRole("button", { name: /Bow/ }));
    expect(await screen.findByRole("heading", { name: "Bow" })).toBeInTheDocument();

    await user.click(within(nav).getByRole("button", { name: /Abandoned Tower/ }));
    expect(await screen.findByRole("heading", { name: "Abandoned Tower" })).toBeInTheDocument();
    const rules = screen.getByRole("list", { name: "Spawn rules" });
    expect(within(rules).getByText("Spawns 50% of the time")).toBeInTheDocument();
    expect(within(rules).getByText("Paced by spawn points (starts with 10)")).toBeInTheDocument();
    expect(within(rules).getByText("Respawns after 300 s")).toBeInTheDocument();

    const entries = screen.getByRole("grid", { name: "Entries" });
    expect(within(entries).getAllByText("25%")).toHaveLength(4);
    expect(within(entries).getByText("2 × M67 Frag Grenade, always")).toBeInTheDocument();
  });

  it("finds every table that drops a grenade", async () => {
    const user = userEvent.setup();
    renderTool();
    await user.type(await screen.findByLabelText("Find an item"), "grenade");
    const results = await screen.findByRole("grid", { name: "Tables that drop the item" });
    expect(within(results).getAllByText("Abandoned Tower")).toHaveLength(2);
    expect(within(results).getByText("M67 Frag Grenade")).toBeInTheDocument();
    expect(within(results).queryByText("Bow")).not.toBeInTheDocument();
  });
});
