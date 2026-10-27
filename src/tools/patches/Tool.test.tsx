import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import addedWeapon from "./fixtures/addedWeapon.json";
import oldItems from "./fixtures/oldItems.json";
import removedWeapon from "./fixtures/removedWeapon.json";
import Tool from "./Tool";

afterEach(() => {
  vi.unstubAllGlobals();
});

const fixtures = {
  "25677108/items.json": oldItems,
  "25677108/weapons.json": fixtureWith("25677108/weapons.json", "weapons", [removedWeapon]),
  "25937608/weapons.json": fixtureWith("25937608/weapons.json", "weapons", [addedWeapon]),
};

function renderTool(path = "/patches", extra: Record<string, unknown> = {}) {
  const router = createMemoryRouter([{ path: "/patches", element: <Tool /> }], { initialEntries: [path] });
  renderWithData(<RouterProvider router={router} />, { fixtures: { ...fixtures, ...extra } });
  return router;
}

async function weaponsCard() {
  return screen.findByRole("button", { name: /^Weapons Added/ });
}

function count(card: HTMLElement, label: string): string | null {
  return within(card).getByText(label).nextElementSibling?.textContent ?? null;
}

describe("Patch Diff", () => {
  it("compares the second-newest build with the newest by default", async () => {
    renderTool();
    await weaponsCard();
    expect(screen.getByRole("button", { name: /From/ })).toHaveTextContent("25677108");
    expect(screen.getByRole("button", { name: /To$/ })).toHaveTextContent("25937608");
  });

  it("shows the Weapons counts", async () => {
    renderTool();
    const card = await weaponsCard();
    expect(count(card, "Added")).toBe("1");
    expect(count(card, "Removed")).toBe("1");
    expect(count(card, "Changed")).toBe("5");
  });

  it("lists the AK74 as changed with its summary when Weapons is opened", async () => {
    const router = renderTool();
    await userEvent.click(await weaponsCard());
    const list = await screen.findByRole("list", { name: "Weapons" });
    const row = within(list).getByText("AK74").closest("li") as HTMLElement;
    expect(within(row).getByText("Changed")).toBeInTheDocument();
    expect(within(row).getByText("Suppression multiplier added: 1.05")).toBeInTheDocument();
    await vi.waitFor(() => expect(router.state.location.search).toContain("c=weapons"));
  });

  it("shows the nothing-to-compare state with one build", async () => {
    renderTool("/patches", {
      "builds.json": {
        schemaVersion: 1,
        latest: "25937608",
        builds: [{ build: "25937608", publishedAt: "2026-10-15T19:57:06Z", name: "Game build 25937608" }],
      },
    });
    expect(
      await screen.findByText("Only one game build is available, so there is nothing to compare yet."),
    ).toBeInTheDocument();
  });

  it("swaps added and removed when the builds are swapped", async () => {
    renderTool("/patches?c=weapons");
    const list = await screen.findByRole("list", { name: "Weapons" });
    expect(within(list).getByText("PP-19 Bizon").closest("li")).toHaveTextContent("Added");
    await userEvent.click(screen.getByRole("button", { name: "Swap" }));
    await vi.waitFor(() =>
      expect(
        within(screen.getByRole("list", { name: "Weapons" }))
          .getByText("PP-19 Bizon")
          .closest("li"),
      ).toHaveTextContent("Removed"),
    );
    expect(screen.getByRole("button", { name: /From/ })).toHaveTextContent("25937608");
  });

  it("shows a per-file error inline while other categories still work", async () => {
    renderTool();
    await weaponsCard();
    expect(await screen.findByText("Couldn't load vehicles.json for build 25677108")).toBeInTheDocument();
  });
});
