import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { compareCodec, DEFAULT_SHARED, type Setup } from "./state";
import Tool from "./Tool";

function setup(entry = "/ttk") {
  const router = createMemoryRouter([{ path: "/ttk", element: <Tool /> }], { initialEntries: [entry] });
  renderWithData(<RouterProvider router={router} />);
  return userEvent.setup();
}

const ak = (ammoType: string): Setup => ({ weaponId: "Id.Item.AK74M", ammoType, magazineId: null });

function compareEntry(...setups: Setup[]): string {
  return `/ttk?mode=compare&c=${encodeState(compareCodec, { shared: DEFAULT_SHARED, setups })}`;
}

async function setups(count: number) {
  await waitFor(() => expect(screen.getAllByRole("group", { name: /^Setup \d$/ })).toHaveLength(count));
  return screen.getAllByRole("group", { name: /^Setup \d$/ });
}

describe("TTK compare", () => {
  it("seeds the comparison from the single matchup", async () => {
    const user = setup();
    await screen.findByText("Shots to kill", { selector: "dt" });
    await user.click(screen.getByRole("tab", { name: "Compare" }));
    const [first, second] = await setups(2);
    expect(within(first!).getByRole("combobox", { name: "Weapon" })).toHaveValue("AK74");
    expect(within(second!).getByRole("combobox", { name: "Weapon" })).toHaveValue("AK74");
    expect(within(first!).getByRole("radio", { name: "FMJ" })).toBeChecked();
    expect(within(second!).getByRole("radio", { name: "FMJ" })).not.toBeChecked();
  });

  it("adds setups up to four and then disables adding", async () => {
    const user = setup(compareEntry(ak("FMJ")));
    await setups(1);
    const add = screen.getByRole("button", { name: "Add setup" });
    await user.click(add);
    await user.click(add);
    await user.click(add);
    const rows = await setups(4);
    expect(add).toBeDisabled();
    expect(within(rows[0]!).getByRole("button", { name: "Duplicate" })).toBeDisabled();
  });

  it("removes setups down to one and then disables removing", async () => {
    const user = setup(compareEntry(ak("FMJ"), ak("HollowPoint")));
    const [first] = await setups(2);
    await user.click(within(first!).getByRole("button", { name: "Remove" }));
    const [only] = await setups(1);
    expect(within(only!).getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(within(only!).getByRole("radio", { name: "HP" })).toBeChecked();
  });

  it("marks hollow point best against no armor", async () => {
    setup(compareEntry(ak("FMJ"), ak("HollowPoint")));
    const table = await screen.findByRole("grid", { name: "Comparison" });
    const [, fmjRow, hpRow] = within(table).getAllByRole("row");
    expect(fmjRow).toHaveTextContent("AK74 · FMJ");
    expect(within(fmjRow!).queryByText("Best")).not.toBeInTheDocument();
    expect(hpRow).toHaveTextContent("AK74 · HP");
    expect(within(hpRow!).getAllByText("Best")).toHaveLength(2);
  });

  it("restores the setups from a copied link", async () => {
    const user = setup(compareEntry(ak("FMJ"), ak("HollowPoint"), ak("ArmorPiercing")));
    await setups(3);
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    await screen.findByText("Link copied");
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain("#/ttk?mode=compare&c=1.");
    cleanup();
    setup(copied.slice(copied.indexOf("#") + 1));
    const rows = await setups(3);
    expect(within(rows[2]!).getByRole("radio", { name: "AP" })).toBeChecked();
  });
});
