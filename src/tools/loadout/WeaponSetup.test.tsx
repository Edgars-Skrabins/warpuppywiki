import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { catalog, loadoutFixtures, weaponIndex } from "./fixtures/testData";
import { emptyLoadout, setWeaponSetup, WeaponSetup, type Loadout } from "./model/loadout";
import { defaultSetup } from "./model/weaponSetup";
import { loadoutCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function withPrimary(setup: WeaponSetup): Loadout {
  return setWeaponSetup(emptyLoadout(10_000), "primary", setup);
}

function renderTool(loadout: Loadout) {
  const router = createMemoryRouter([{ path: "/loadout", element: <Tool /> }], {
    initialEntries: [`/loadout?l=${encodeState(loadoutCodec(10_000), loadout)}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: loadoutFixtures });
  return router;
}

function sheetValue(label: string): string {
  const row = screen.getByText(label, { selector: "dt" }).closest("div");
  return row?.querySelector("dd")?.textContent ?? "";
}

function statCells(panel: HTMLElement, label: string): string[] {
  const table = within(panel).getByRole("grid", { name: "Weapon stats" });
  const row = within(table).getByText(label).closest('[role="row"]');
  return [...(row?.querySelectorAll('[role="gridcell"], [role="rowheader"]') ?? [])].map(
    (cell) => cell.textContent ?? "",
  );
}

async function openCustomize(): Promise<HTMLElement> {
  await userEvent.click(await screen.findByRole("button", { name: "Customize Primary" }));
  return screen.findByRole("dialog", { name: "Customize AK74" });
}

async function pick(panel: HTMLElement, field: RegExp, option: RegExp) {
  await userEvent.click(within(panel).getByRole("button", { name: field }));
  const listbox = await screen.findByRole("listbox");
  await userEvent.click(within(listbox).getByRole("option", { name: option }));
  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
}

const ak74 = defaultSetup("Id.Item.AK74M", weaponIndex, catalog);

describe("Weapon setup", () => {
  it("fitting the 3x scope changes the zoom and ADS rows", async () => {
    renderTool(withPrimary(ak74));
    const panel = await openCustomize();
    expect(statCells(panel, "Zoom").slice(1, 3)).toEqual(["×1", "×1"]);
    await pick(panel, /Sight$/, /^Spitfire 3X/);
    await waitFor(() => expect(statCells(panel, "Zoom").slice(1, 3)).toEqual(["×1", "×3"]));
    const [, bareAds, fittedAds, change] = statCells(panel, "ADS time");
    expect(Number.parseFloat(fittedAds ?? "") / Number.parseFloat(bareAds ?? "")).toBeCloseTo(1.1, 1);
    expect(change).toContain("+");
    await userEvent.click(within(panel).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const card = screen.getByRole("article", { name: "Primary" });
    expect(within(card).getByText(/^Spitfire 3X · 4 × 30 RND FMJ$/)).toBeInTheDocument();
  });

  it("switching to the 60-round magazine changes the capacity and recoil rows", async () => {
    renderTool(withPrimary(ak74));
    const panel = await openCustomize();
    await pick(panel, /Magazine type$/, /^AK74 60 RND Magazine/);
    await waitFor(() => expect(statCells(panel, "Magazine capacity").slice(1, 3)).toEqual(["30", "60"]));
    expect(statCells(panel, "Vertical recoil").slice(1, 3)).toEqual(["×1", "×1.19"]);
    expect(statCells(panel, "Horizontal recoil").slice(1, 3)).toEqual(["×1", "×1.21"]);
  });

  it("magazine count changes the loadout total", async () => {
    renderTool(withPrimary(ak74));
    expect(await screen.findByText("4 × 30 RND FMJ")).toBeInTheDocument();
    expect(sheetValue("Ammunition and magazines")).toBe("$320");
    const panel = await openCustomize();
    const count = within(panel).getByRole("textbox", { name: "Magazines" });
    await userEvent.clear(count);
    await userEvent.type(count, "6");
    await userEvent.tab();
    await waitFor(() => expect(sheetValue("Ammunition and magazines")).toBe("$480"));
    expect(sheetValue("Total cost")).toBe("$480");
  });

  it("changing the primary weapon clears its setup", async () => {
    renderTool(withPrimary({ ...ak74, attachments: { Sight: "Id.Item.3xScope" } }));
    const card = await screen.findByRole("article", { name: "Primary" });
    expect(within(card).getByText(/^Spitfire 3X/)).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "Change Primary" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("option", { name: /^M4/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(card).queryByText(/Spitfire 3X/)).not.toBeInTheDocument();
    expect(within(card).getByText("10 RND 5.56mm")).toBeInTheDocument();
  });

  it("shows the notice once for a link with parts that no longer fit", async () => {
    const stale = { ...ak74, attachments: { Underbarrel: "Id.Item.3xScope" } };
    renderTool(withPrimary(stale));
    const card = await screen.findByRole("article", { name: "Primary" });
    expect(within(card).getAllByText("Some parts of this setup no longer fit and were removed")).toHaveLength(1);
    expect(within(card).getByText("4 × 30 RND FMJ")).toBeInTheDocument();
    expect(sheetValue("Attachments")).toBe("$0");
    const panel = await openCustomize();
    const count = within(panel).getByRole("textbox", { name: "Magazines" });
    await userEvent.clear(count);
    await userEvent.type(count, "5");
    await userEvent.tab();
    await waitFor(() => expect(within(card).getByText("5 × 30 RND FMJ")).toBeInTheDocument());
    expect(within(card).queryByText("Some parts of this setup no longer fit and were removed")).not.toBeInTheDocument();
  });
});
