import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { catalog, loadoutFixtures, weaponIndex } from "./fixtures/testData";
import { emptyLoadout, setSlotItem, setWeaponSetup, type Loadout } from "./model/loadout";
import { defaultSetup } from "./model/weaponSetup";
import { loadoutCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderTool(loadout: Loadout) {
  const router = createMemoryRouter([{ path: "/loadout", element: <Tool /> }], {
    initialEntries: [`/loadout?l=${encodeState(loadoutCodec(10_000), loadout)}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: loadoutFixtures });
  return router;
}

const withAk74 = setWeaponSetup(emptyLoadout(10_000), "primary", defaultSetup("Id.Item.AK74M", weaponIndex, catalog));

async function weaponRow(name: string): Promise<HTMLElement> {
  const table = await screen.findByRole("grid", { name: "Your weapons" });
  const row = within(table).getByText(name).closest('[role="row"]');
  if (!(row instanceof HTMLElement)) {
    throw new Error(`No row for ${name}`);
  }
  return row;
}

function cells(row: HTMLElement): string[] {
  return [...row.querySelectorAll('[role="gridcell"], [role="rowheader"]')].map((cell) => cell.textContent ?? "");
}

describe("Lethality panel", () => {
  it("shows shots and time to kill for the primary at three distances", async () => {
    renderTool(withAk74);
    const row = await weaponRow("AK74");
    const [, ammo, close, mid, far] = cells(row);
    expect(ammo).toBe("5.45mm");
    for (const cell of [close, mid, far]) {
      expect(cell).toMatch(/^\d+ · \d+(\.\d+)? s$/);
    }
    expect(screen.getByText("Health 100 (assumed)")).toBeInTheDocument();
  });

  it("needs more shots when the target wears heavier armor", async () => {
    renderTool(withAk74);
    const before = cells(await weaponRow("AK74"))[3] ?? "";
    await userEvent.click(screen.getByRole("button", { name: /Target body armor$/ }));
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(within(listbox).getByRole("option", { name: "Level 4 Armor" }));
    await waitFor(async () => {
      const after = cells(await weaponRow("AK74"))[3] ?? "";
      expect(Number.parseInt(after, 10)).toBeGreaterThan(Number.parseInt(before, 10));
    });
  });

  it("links each weapon into the TTK calculator", async () => {
    renderTool(withAk74);
    const link = within(await weaponRow("AK74")).getByRole("link", { name: "Open AK74 in TTK Calculator" });
    expect(link.getAttribute("href")).toMatch(/^\/#\/ttk\?m=1\./);
  });

  it("compares your armor with none against the threat weapon", async () => {
    renderTool(setSlotItem(withAk74, "armor", "Id.Item.HeavyArmor"));
    await userEvent.click(await screen.findByRole("tab", { name: "Your armor" }));
    const table = await screen.findByRole("grid", { name: "Your armor" });
    expect(screen.getByText("You wear Level 3 Armor.")).toBeInTheDocument();
    const row = within(table).getByText("100 m").closest('[role="row"]');
    expect(row?.textContent).toMatch(/\+\d+ shots?/);
  });

  it("notes when no ammo was bought", async () => {
    renderTool(setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.AK74M"));
    const row = await weaponRow("AK74");
    expect(within(row).getByText("No ammo bought, assuming FMJ")).toBeInTheDocument();
  });
});
