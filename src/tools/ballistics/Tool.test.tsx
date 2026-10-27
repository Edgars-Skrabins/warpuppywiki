import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import Tool from "./Tool";

const AMMO_FIXTURE_PATH = "25937608/ammo.json";
const LOAD_TIMEOUT = { timeout: 10000 };

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(fixtures: Record<string, unknown> = {}) {
  const router = createMemoryRouter([{ path: "/ballistics", element: <Tool /> }], {
    initialEntries: ["/ballistics"],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures });
}

function rangeCard() {
  return screen.findByRole("grid", { name: "Range card" }, LOAD_TIMEOUT);
}

describe("Ballistics", { timeout: 20000 }, () => {
  it("shows a range card for the default weapon", async () => {
    setup();
    const table = await rangeCard();
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(10);
    expect(within(table).getByRole("columnheader", { name: /Hold above bore/ })).toBeTruthy();
  });

  it("has no sight or zero controls and no sight height in the notes", async () => {
    setup();
    await rangeCard();
    expect(screen.queryByRole("button", { name: /Sight A/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Zero A/ })).toBeNull();
    const notes = screen.getByRole("heading", { name: "How this is calculated" }).closest("section");
    expect(notes?.textContent).not.toMatch(/sight|zero/i);
  });

  it("shows the lead column only after a target speed is typed", async () => {
    const user = userEvent.setup();
    setup();
    const table = await rangeCard();
    expect(within(table).queryByRole("columnheader", { name: /Lead/ })).toBeNull();
    await user.type(screen.getByRole("textbox", { name: "Target speed (m/s)" }), "7");
    await user.tab();
    await waitFor(() => expect(within(table).getByRole("columnheader", { name: "Lead at 7 m/s" })).toBeTruthy());
  });

  it("explains when the projectile has no drag data", async () => {
    setup({
      [AMMO_FIXTURE_PATH]: {
        ...ammoJson,
        projectiles: ammoJson.projectiles.map((projectile) => ({ ...projectile, drag: null })),
      },
    });
    expect(await screen.findByText("Not enough ballistic data for this projectile", {}, LOAD_TIMEOUT)).toBeTruthy();
    expect(screen.queryByRole("grid", { name: "Range card" })).toBeNull();
  });

  it("adds paired drop and flight time columns for a comparison", async () => {
    const user = userEvent.setup();
    setup();
    await rangeCard();
    await user.click(screen.getByRole("button", { name: "Add comparison" }));
    const table = await rangeCard();
    await waitFor(() => expect(within(table).getByRole("columnheader", { name: /Drop B/ })).toBeTruthy());
    for (const header of [/Drop A/, /Flight time A/, /Flight time B/]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeTruthy();
    }
  });
});
