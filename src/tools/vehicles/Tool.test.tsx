import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import { fixtureDamage, toolItems, vehiclesFile } from "./fixtures/testData";
import Tool from "./Tool";

const HAVOC = "Vehicle.Variant.Air.Rotary.Havoc.Default";
const HUMVEE = "Vehicle.Variant.Land.Wheeled.Humvee.Default";

function renderTool(search = "") {
  const router = createMemoryRouter([{ path: "/vehicles", element: <Tool /> }], {
    initialEntries: [`/vehicles${search}`],
  });
  renderWithData(<RouterProvider router={router} />, {
    fixtures: {
      "25937608/vehicles.json": vehiclesFile,
      "25937608/items.json": fixtureWith("25937608/items.json", "items", toolItems),
      "25937608/damage.json": fixtureDamage,
    },
  });
  return router;
}

describe("Vehicles tool", () => {
  it("filters the table by type", async () => {
    renderTool();
    const table = await screen.findByRole("grid", { name: "Vehicles" });
    expect(within(table).getByText("Humvee")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Air" }));

    expect(within(table).getByText("Havoc")).toBeInTheDocument();
    expect(within(table).getByText("AH-6M [Miniguns]")).toBeInTheDocument();
    expect(within(table).queryByText("Humvee")).not.toBeInTheDocument();
  });

  it("allows at most three vehicles to be selected for comparison", async () => {
    renderTool();
    await screen.findByRole("grid", { name: "Vehicles" });

    await userEvent.click(screen.getByRole("checkbox", { name: "Compare Havoc" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Compare T-72B3" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Compare Humvee" }));

    expect(screen.getByRole("checkbox", { name: "Compare AH-6M [Miniguns]" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Compare Humvee" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Compare (3)" })).toBeEnabled();
  });

  it("compares the selected vehicles and marks the best values", async () => {
    renderTool(`?view=compare&compare=${HAVOC},${HUMVEE}`);

    const table = await screen.findByRole("table");
    const price = within(table).getByRole("row", { name: /^Price/ });
    expect(within(price).getByText("$3,000")).toBeInTheDocument();
    expect(within(price).getByText("Best")).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /^Top speed/ })).toHaveTextContent("400 km/hBest");
    expect(within(table).getByRole("row", { name: /^Damage to occupants/ })).toHaveTextContent(
      "Small and medium arms −90%, high −50%, special −60%",
    );
    expect(screen.getByRole("heading", { name: "Humvee vulnerabilities" })).toBeInTheDocument();
  });

  it("asks for vehicles when nothing is selected for comparison", async () => {
    renderTool("?view=compare");
    expect(await screen.findByText("Pick up to three vehicles in the table to compare them.")).toBeInTheDocument();
  });

  it("opens a vehicle's vulnerabilities from the table", async () => {
    renderTool();
    const table = await screen.findByRole("grid", { name: "Vehicles" });

    await userEvent.click(within(table).getByText("Humvee"));

    const dialog = await screen.findByRole("dialog", { name: "Humvee vulnerabilities" });
    const rules = within(dialog).getByRole("grid", { name: "Humvee damage rules" });
    const texts = within(rules)
      .getAllByRole("row")
      .map((row) => row.textContent);
    expect(texts).toContain("BulletsFuel tank+400%");
    expect(texts).toContain("Rockets (direct hit)Whole vehicle+200%");
  });
});
