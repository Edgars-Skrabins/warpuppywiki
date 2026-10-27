import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import Tool from "./Tool";

const AMMO_FIXTURE_PATH = "25937608/ammo.json";
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
  return screen.findByRole("grid", { name: "Range card" });
}

async function dropAt(distance: string) {
  const table = await rangeCard();
  const row = within(table).getByRole("rowheader", { name: distance }).closest("[role=row]");
  if (!(row instanceof HTMLElement)) throw new Error(`No row at ${distance}`);
  return within(row).getAllByRole("gridcell")[0]?.textContent;
}

describe("Ballistics", () => {
  it("shows a range card for the default weapon", async () => {
    setup();
    const table = await rangeCard();
    expect(within(table).getAllByRole("row").length).toBeGreaterThan(10);
    expect(within(table).getByRole("columnheader", { name: /Holdover/ })).toBeTruthy();
  });

  it("changes the drop at 300 m when the zero changes", async () => {
    const user = userEvent.setup();
    setup();
    const before = await dropAt("300 m");
    await user.click(screen.getByRole("button", { name: /Zero A/ }));
    await user.click(await screen.findByRole("option", { name: "300 m" }));
    await waitFor(async () => expect(await dropAt("300 m")).not.toBe(before));
    expect(await dropAt("300 m")).toBe("0 cm");
  });

  it("explains when the projectile has no drag data", async () => {
    setup({
      [AMMO_FIXTURE_PATH]: {
        ...ammoJson,
        projectiles: ammoJson.projectiles.map((projectile) => ({ ...projectile, drag: null })),
      },
    });
    expect(await screen.findByText("Not enough ballistic data for this projectile")).toBeTruthy();
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
