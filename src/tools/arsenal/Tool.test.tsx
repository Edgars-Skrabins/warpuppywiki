import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import Tool from "./Tool";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(search = "") {
  const router = createMemoryRouter(
    [
      { path: "/arsenal", element: <Tool /> },
      { path: "/ttk", element: <p>TTK page</p> },
      { path: "/recoil", element: <p>Recoil page</p> },
    ],
    { initialEntries: [`/arsenal${search}`] },
  );
  renderWithData(<RouterProvider router={router} />);
  return router;
}

async function weaponTable() {
  return screen.findByRole("grid", { name: "Weapons" });
}

async function weaponNames() {
  const table = await weaponTable();
  return within(table)
    .getAllByRole("rowheader")
    .map((cell) => [...cell.querySelectorAll("span")].at(-1)?.textContent ?? "");
}

function chip(name: string) {
  return screen.getByRole("button", { name });
}

describe("Arsenal", () => {
  it("lists the fixture weapons by class, then name", async () => {
    setup();
    expect(await weaponNames()).toEqual(["AK74", "M4", "MP5", "Mosin Nagant", "SV98", "M500"]);
    expect(screen.getByText("6 weapons")).toBeInTheDocument();
  });

  it("filters to SMGs", async () => {
    const user = userEvent.setup();
    setup();
    await weaponTable();
    await user.click(chip("SMG"));
    expect(await weaponNames()).toEqual(["MP5"]);
    await user.click(chip("All"));
    expect(await weaponNames()).toHaveLength(6);
  });

  it("sorts by RPM", async () => {
    const user = userEvent.setup();
    setup();
    const table = await weaponTable();
    await user.click(within(table).getByRole("columnheader", { name: /RPM/ }));
    expect(await weaponNames()).toEqual(["Mosin Nagant", "SV98", "M500", "AK74", "M4", "MP5"]);
  });

  it("opens a weapon and goes back with the filters kept", async () => {
    const user = userEvent.setup();
    const router = setup();
    await weaponTable();
    await user.type(screen.getByLabelText("Search weapons"), "545");
    await waitFor(async () => expect(await weaponNames()).toEqual(["AK74"]));
    await waitFor(() => expect(router.state.location.search).toContain("f="));

    await user.click(screen.getByRole("rowheader", { name: /AK74/ }));
    const detail = await screen.findByRole("article", { name: "AK74" });
    expect(router.state.location.search).toContain("w=Id.Item.AK74M");
    expect(within(detail).getByRole("heading", { name: "AK74" })).toBeInTheDocument();
    expect(within(detail).getByRole("grid", { name: "Ammo" })).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: "Open in Recoil Viewer" })).toHaveAttribute(
      "href",
      "/recoil?w=Id.Item.AK74M",
    );

    await user.click(within(detail).getByRole("link", { name: /All weapons/ }));
    await waitFor(() => expect(screen.queryByRole("article")).not.toBeInTheDocument());
    expect(router.state.location.search).not.toContain("w=");
    expect(screen.getByLabelText("Search weapons")).toHaveValue("545");
    expect(await weaponNames()).toEqual(["AK74"]);
  });

  it("shows the empty state and clears the filters", async () => {
    const user = userEvent.setup();
    setup();
    await weaponTable();
    await user.click(chip("Sidearm"));
    expect(await screen.findByText("No weapons match these filters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await weaponNames()).toHaveLength(6);
  });
});
