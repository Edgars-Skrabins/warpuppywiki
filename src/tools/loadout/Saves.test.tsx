import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { encodeState } from "@/core/state";
import { loadoutFixtures } from "./fixtures/testData";
import { emptyLoadout, setSlotItem, type Loadout } from "./model/loadout";
import { readEntries, savedLoadoutsStore, type SavedLoadout } from "./saves/savedLoadouts";
import { loadoutCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

const kit: Loadout = { ...setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4"), name: "Assault kit" };

function encoded(loadout: Loadout): string {
  return encodeState(loadoutCodec(10_000), loadout);
}

function renderTool(search: string) {
  const router = createMemoryRouter([{ path: "/loadout", element: <Tool /> }], {
    initialEntries: [`/loadout${search}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: loadoutFixtures });
  return router;
}

function storedSaves(): SavedLoadout[] {
  return readEntries(savedLoadoutsStore.read()).flatMap((entry) => (entry.kind === "saved" ? [entry.saved] : []));
}

function store(saved: SavedLoadout[]) {
  savedLoadoutsStore.write(saved);
}

const savedKit: SavedLoadout = {
  id: "save-1",
  name: "Assault kit",
  loadout: kit,
  createdAt: "2026-10-27T10:00:00.000Z",
  updatedAt: "2026-10-27T10:00:00.000Z",
};

describe("Saved loadouts", () => {
  it("saves the loadout and attaches its id to the URL", async () => {
    const router = renderTool(`?l=${encoded(kit)}`);
    await userEvent.click(await screen.findByRole("button", { name: "Save (unsaved changes)" }));
    expect(await screen.findByRole("button", { name: "Saved ✓" })).toBeInTheDocument();
    const [saved] = storedSaves();
    expect(saved).toMatchObject({ name: "Assault kit", loadout: { name: "Assault kit" } });
    await waitFor(() => expect(router.state.location.search).toContain(`id=${saved?.id}`));
  });

  it("reopens a saved loadout from a URL with its id and shows edits as unsaved", async () => {
    store([savedKit]);
    renderTool(`?l=${encoded(kit)}&id=save-1`);
    expect(await screen.findByRole("button", { name: "Saved ✓" })).toBeInTheDocument();
    const name = screen.getByRole("textbox", { name: "Loadout name" });
    await userEvent.type(name, " v2");
    expect(await screen.findByRole("button", { name: "Save (unsaved changes)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save (unsaved changes)" }));
    await waitFor(() => expect(storedSaves()).toMatchObject([{ id: "save-1", name: "Assault kit v2" }]));
  });

  it("deletes a saved loadout after confirmation", async () => {
    store([savedKit]);
    renderTool("");
    await userEvent.click(await screen.findByRole("button", { name: "My loadouts" }));
    const library = await screen.findByRole("dialog", { name: "My loadouts" });
    expect(within(library).getByRole("listitem", { name: "Assault kit" })).toHaveTextContent("M4");
    await userEvent.click(within(library).getByRole("button", { name: "Delete Assault kit" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(confirm).toHaveTextContent("Delete 'Assault kit'? This can't be undone.");
    await userEvent.click(within(confirm).getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("No saved loadouts yet")).toBeInTheDocument();
    expect(storedSaves()).toEqual([]);
  });

  it("shows unreadable saves with only a delete action", async () => {
    store([{ id: "old", name: "Old kit" } as unknown as SavedLoadout]);
    renderTool("");
    await userEvent.click(await screen.findByRole("button", { name: "My loadouts" }));
    const row = await screen.findByRole("listitem", { name: "Old kit" });
    expect(row).toHaveTextContent("Can't open (from an older version)");
    expect(
      within(row)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Delete"]);
  });

  it("opens a shared link with a banner and saves it as a new entry", async () => {
    store([savedKit]);
    renderTool(`?l=${encoded(kit)}&shared=1`);
    expect(await screen.findByText("Shared loadout — Save to keep it")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save (unsaved changes)" }));
    await waitFor(() => expect(storedSaves()).toHaveLength(2));
    expect(screen.queryByText("Shared loadout — Save to keep it")).not.toBeInTheDocument();
  });

  it("copies a share link", async () => {
    const user = userEvent.setup();
    renderTool(`?l=${encoded(kit)}&id=save-1`);
    await user.click(await screen.findByRole("button", { name: "Share" }));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
    const copied = await navigator.clipboard.readText();
    expect(copied).toContain(`#/loadout?l=${encoded(kit)}&shared=1`);
    expect(copied).not.toContain("id=");
  });

  it("asks before discarding unsaved changes on New", async () => {
    renderTool(`?l=${encoded(kit)}`);
    await userEvent.click(await screen.findByRole("button", { name: "New" }));
    const confirm = await screen.findByRole("alertdialog", { name: "Discard unsaved changes?" });
    await userEvent.click(within(confirm).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Loadout name" })).toHaveValue(""));
    expect(await screen.findByRole("button", { name: "Choose Primary" })).toBeInTheDocument();
  });
});
