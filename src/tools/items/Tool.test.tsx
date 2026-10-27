import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import { extraItems, ITEMS_FIXTURE_PATH } from "./fixtures/gameData";
import Tool from "./Tool";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(search = "") {
  const router = createMemoryRouter(
    [
      { path: "/items", element: <Tool /> },
      { path: "/arsenal", element: <p>Arsenal page</p> },
    ],
    { initialEntries: [`/items${search}`] },
  );
  renderWithData(<RouterProvider router={router} />, {
    fixtures: { [ITEMS_FIXTURE_PATH]: fixtureWith(ITEMS_FIXTURE_PATH, "items", extraItems) },
  });
  return router;
}

const LOAD_TIMEOUT = { timeout: 10000 };

function searchField() {
  return screen.findByLabelText("Search items", {}, LOAD_TIMEOUT);
}

async function cardNames() {
  const grid = await screen.findByRole("list", { name: "Items" });
  return within(grid)
    .getAllByRole("button")
    .map((card) => card.getAttribute("aria-label"));
}

describe("Item Browser", { timeout: 20000 }, () => {
  it("finds the Bandage by searching", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(await searchField(), "bandage");
    expect(await cardNames()).toEqual(["Bandage"]);
  });

  it("shows only ammo when the Ammo chip is selected", async () => {
    const user = userEvent.setup();
    setup();
    await searchField();
    await user.click(screen.getByRole("radio", { name: "Ammo" }));
    const names = await cardNames();
    expect(names).toContain("5.45mm HP");
    expect(names).not.toContain("AK74");
    expect(names).not.toContain("Bandage");
  });

  it("reveals non-player items with their reason when the toggle is on", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(await searchField(), "artillery");
    expect(await screen.findByText("No items match")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Show non-player items" }));
    const card = await screen.findByRole("button", { name: "Artillery Barrel Test" });
    expect(within(card).getByText("Developer")).toBeInTheDocument();
  });

  it("opens an item with its shop variations and keeps it in the URL", async () => {
    const user = userEvent.setup();
    const router = setup();
    await searchField();
    await user.click(screen.getByRole("button", { name: "5.45mm" }));
    const dialog = await screen.findByRole("dialog");
    const table = within(dialog).getByRole("grid", { name: "Shop variations" });
    for (const label of ["Standard", "AP", "AP (T)", "HP", "HP (T)", "Tracer"]) {
      expect(within(table).getByRole("rowheader", { name: label })).toBeInTheDocument();
    }
    expect(router.state.location.search).toContain("i=Id.Item.545mm");
  });

  it("opens the item named in the URL and links weapons to the Arsenal", async () => {
    const user = userEvent.setup();
    const router = setup("?i=id.item.m4");
    const dialog = await screen.findByRole("dialog", { name: "M4" }, LOAD_TIMEOUT);
    expect(within(dialog).getByText("Assault")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("link", { name: "Open in Arsenal" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/arsenal"));
    expect(router.state.location.search).toBe("?w=Id.Item.M4");
  });
});
