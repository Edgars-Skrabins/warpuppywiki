import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { loadoutFixtures } from "./fixtures/testData";
import { emptyLoadout, setSlotItem, type Loadout } from "./model/loadout";
import { savedLoadoutsStore, type SavedLoadout } from "./saves/savedLoadouts";
import { loadoutCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const working: Loadout = { ...setSlotItem(emptyLoadout(10_000), "armor", "Id.Item.HeavyArmor"), name: "Heavy kit" };
const cheap: Loadout = { ...setSlotItem(emptyLoadout(10_000), "armor", "Id.Item.LightArmor"), name: "Light kit" };

const savedCheap: SavedLoadout = {
  id: "save-1",
  name: "Light kit",
  loadout: cheap,
  createdAt: "2026-10-27T10:00:00.000Z",
  updatedAt: "2026-10-27T10:00:00.000Z",
};

function renderTool(search: string) {
  const router = createMemoryRouter([{ path: "/loadout", element: <Tool /> }], {
    initialEntries: [`/loadout${search}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: loadoutFixtures });
  return router;
}

function costCells(label: string): string[] {
  const table = screen.getByRole("grid", { name: "Cost" });
  const row = within(table).getByText(label).closest('[role="row"]');
  return [...(row?.querySelectorAll('[role="gridcell"], [role="rowheader"]') ?? [])].map(
    (cell) => cell.textContent ?? "",
  );
}

async function pickSide(side: "A" | "B", option: RegExp) {
  const picker = screen.getByRole("region", { name: `Side ${side}` });
  await userEvent.click(within(picker).getByRole("button", { name: new RegExp(`Loadout ${side}$`) }));
  const listbox = await screen.findByRole("listbox");
  await userEvent.click(within(listbox).getByRole("option", { name: option }));
  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
}

describe("Compare loadouts", () => {
  it("compares the working loadout with a saved one and swaps sides", async () => {
    savedLoadoutsStore.write([savedCheap]);
    const router = renderTool(`?l=${encodeState(loadoutCodec(10_000), working)}`);
    await userEvent.click(await screen.findByRole("button", { name: "Compare" }));
    expect(await screen.findByRole("heading", { name: "Compare loadouts" })).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toContain("view=compare"));
    expect(costCells("Total cost").slice(1, 3)).toEqual(["$2,500", "$0"]);

    await pickSide("B", /^Light kit/);
    await waitFor(() => expect(costCells("Total cost").slice(1, 3)).toEqual(["$2,500", "$400"]));
    expect(costCells("Total cost")[3]).toContain("$2,100");
    expect(costCells("Total cost")[3]).toContain("(better)");
    expect(router.state.location.search).toContain("b=saved%3Asave-1");

    await userEvent.click(screen.getByRole("button", { name: "Swap sides" }));
    await waitFor(() => expect(costCells("Total cost").slice(1, 3)).toEqual(["$400", "$2,500"]));
    expect(costCells("Total cost")[3]).toContain("(worse)");
  });

  it("shows every row as equal when both sides are the same loadout", async () => {
    renderTool(`?l=${encodeState(loadoutCodec(10_000), working)}&view=compare&a=current&b=current`);
    await screen.findByRole("heading", { name: "Compare loadouts" });
    expect(screen.queryByText("(better)")).not.toBeInTheDocument();
    expect(screen.queryByText("(worse)")).not.toBeInTheDocument();
    expect(screen.queryByText("Different")).not.toBeInTheDocument();
  });

  it("explains an invalid pasted link", async () => {
    renderTool(`?view=compare`);
    await screen.findByRole("heading", { name: "Compare loadouts" });
    await pickSide("B", /^Paste link/);
    await userEvent.type(screen.getByRole("textbox", { name: "Loadout link B" }), "https://example.test/#/ttk?m=1.abc");
    await userEvent.click(screen.getByRole("button", { name: "Use link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That link isn't a loadout link");
  });

  it("reads a valid pasted link", async () => {
    renderTool(`?l=${encodeState(loadoutCodec(10_000), working)}&view=compare`);
    await screen.findByRole("heading", { name: "Compare loadouts" });
    await pickSide("B", /^Paste link/);
    const link = `https://example.test/#/loadout?l=${encodeState(loadoutCodec(10_000), cheap)}&shared=1`;
    await userEvent.click(screen.getByRole("textbox", { name: "Loadout link B" }));
    await userEvent.paste(link);
    await userEvent.click(screen.getByRole("button", { name: "Use link" }));
    await waitFor(() => expect(costCells("Total cost").slice(1, 3)).toEqual(["$2,500", "$400"]));
    expect(within(screen.getByRole("region", { name: "Side B" })).getByText("Light kit (link)")).toBeInTheDocument();
  });

  it("goes back to the builder", async () => {
    renderTool(`?l=${encodeState(loadoutCodec(10_000), working)}&view=compare`);
    await userEvent.click(await screen.findByRole("button", { name: "Back to builder" }));
    expect(await screen.findByRole("button", { name: "Compare" })).toBeInTheDocument();
  });
});
