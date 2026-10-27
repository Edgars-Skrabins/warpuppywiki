import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { loadoutFixtures } from "./fixtures/testData";
import { emptyLoadout, setSlotItem, type Loadout } from "./model/loadout";
import { loadoutCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderTool(search = "") {
  const router = createMemoryRouter([{ path: "/loadout", element: <Tool /> }], {
    initialEntries: [`/loadout${search}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: loadoutFixtures });
  return router;
}

function searchFor(loadout: Loadout): string {
  return `?l=${encodeState(loadoutCodec(10_000), loadout)}`;
}

function sheetValue(label: string): string {
  const row = screen.getByText(label, { selector: "dt" }).closest("div");
  return row?.querySelector("dd")?.textContent ?? "";
}

async function choosePrimary(name: string) {
  await userEvent.click(await screen.findByRole("button", { name: "Choose Primary" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(within(dialog).getByRole("option", { name: new RegExp(`^${name}`) }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

describe("Loadout builder", () => {
  it("fills a slot from the dialog and adds its price and starting ammo to the total", async () => {
    renderTool();
    await choosePrimary("M4");
    const primary = screen.getByRole("article", { name: "Primary" });
    expect(within(primary).getByText("M4", { selector: "p" })).toBeInTheDocument();
    expect(within(primary).getByText("Assault 28")).toBeInTheDocument();
    expect(within(primary).getByText("10 RND 5.56mm")).toBeInTheDocument();
    expect(sheetValue("Total cost")).toBe("$2,815");
    expect(sheetValue("Remaining")).toBe("$7,185");
  });

  it("searches the dialog", async () => {
    renderTool();
    await userEvent.click(await screen.findByRole("button", { name: "Choose Primary" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByRole("searchbox", { name: "Search" }), "sniper");
    expect(
      within(dialog)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([expect.stringContaining("Mosin Nagant"), expect.stringContaining("SV98")]);
  });

  it("shows how far a loadout is over budget", async () => {
    renderTool(searchFor(setSlotItem(emptyLoadout(1000), "primary", "Id.Item.M4")));
    expect(await screen.findByText("Over budget by $1,800")).toBeInTheDocument();
    expect(sheetValue("Remaining")).toBe("−$1,800");
  });

  it("updates the total and weight when gear is added", async () => {
    renderTool();
    await userEvent.click(await screen.findByRole("button", { name: "Add gear" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("option", { name: /^Bandage/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(sheetValue("Total cost")).toBe("$200");
    expect(sheetValue("Total weight")).toBe("0.08 kg");
    const row = screen.getByRole("listitem", { name: "Bandage" });
    await userEvent.click(within(row).getByRole("button", { name: "Increase Bandage quantity" }));
    await waitFor(() => expect(sheetValue("Total cost")).toBe("$400"));
    expect(sheetValue("Total weight")).toBe("0.16 kg");
  });

  it("clears the loadout after confirming", async () => {
    renderTool(searchFor(setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4")));
    await userEvent.click(await screen.findByRole("button", { name: "Clear loadout" }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Clear" }));
    const primary = screen.getByRole("article", { name: "Primary" });
    expect(within(primary).getByText("Empty")).toBeInTheDocument();
    expect(sheetValue("Total cost")).toBe("$0");
  });

  it("restores the loadout from the URL after a reload", async () => {
    const router = renderTool();
    await choosePrimary("SV98");
    await waitFor(() => expect(router.state.location.search).toMatch(/^\?l=1\./));
    const search = router.state.location.search;
    act(() => cleanup());
    renderTool(search);
    const primary = await screen.findByRole("article", { name: "Primary" });
    expect(within(primary).getByText("SV98", { selector: "p" })).toBeInTheDocument();
    expect(sheetValue("Total cost")).toBe("$5,230");
  });
});
