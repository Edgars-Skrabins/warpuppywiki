import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithData } from "@/core/data/testing";
import Tool from "./Tool";

function setup() {
  const router = createMemoryRouter([{ path: "/ttk", element: <Tool /> }], { initialEntries: ["/ttk"] });
  renderWithData(<RouterProvider router={router} />);
  return userEvent.setup();
}

async function headline(label: string): Promise<string> {
  const term = await screen.findByText(label, { selector: "dt" });
  return term.nextElementSibling?.textContent ?? "";
}

async function choose(user: ReturnType<typeof userEvent.setup>, field: string, option: string) {
  await user.click(await screen.findByRole("button", { name: new RegExp(field) }));
  await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: option }));
}

describe("TTK calculator", { timeout: 30000 }, () => {
  it("shows 5 shots to kill for the AK74 with FMJ at the upper chest against no armor", async () => {
    setup();
    expect(await headline("Shots to kill")).toBe("5");
    expect(screen.getByRole("combobox", { name: "Weapon" })).toHaveValue("AK74");
  });

  it("needs more shots against Level 3 body armor", async () => {
    const user = setup();
    const unarmored = Number(await headline("Shots to kill"));
    await choose(user, "Body armor", "Level 3 Armor");
    await waitFor(async () => expect(Number(await headline("Shots to kill"))).toBeGreaterThan(unarmored), {
      timeout: 5000,
    });
  });

  it("asks for the pellet count when a shotgun is chosen", async () => {
    const user = setup();
    expect(screen.queryByRole("textbox", { name: /Pellets that hit per shot/ })).not.toBeInTheDocument();
    const weapon = await screen.findByRole("combobox", { name: "Weapon" });
    await user.clear(weapon);
    await user.type(weapon, "M500");
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: /M500/ }));
    expect(await screen.findByRole("textbox", { name: /Pellets that hit per shot/ })).toHaveValue("6");
    expect(screen.getByText("Pellet count is not in the game files.")).toBeInTheDocument();
  });

  it("shows the hint instead of results for a custom placement without zones", async () => {
    const user = setup();
    await choose(user, "Shot placement", "Custom");
    expect(await screen.findAllByText("Pick at least one hit zone")).not.toHaveLength(0);
    expect(screen.queryByText("Shots to kill", { selector: "dt" })).not.toBeInTheDocument();
  });

  it("copies a link with the encoded matchup", async () => {
    const user = setup();
    await headline("Shots to kill");
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toContain("#/ttk?m=1.");
  });
});
