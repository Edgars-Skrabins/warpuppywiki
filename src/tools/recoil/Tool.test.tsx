import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import Tool from "./Tool";

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(search = "") {
  const router = createMemoryRouter([{ path: "/recoil", element: <Tool /> }], {
    initialEntries: [`/recoil${search}`],
  });
  const view = renderWithData(<RouterProvider router={router} />);
  return view.container;
}

const LOAD_TIMEOUT = { timeout: 10000 };

function multipliers() {
  return screen.findByRole("button", { name: /^Vertical ×/ }, LOAD_TIMEOUT);
}

describe("Recoil Viewer", { timeout: 20000 }, () => {
  it("preselects the weapon from ?w= and draws its 30-shot path", async () => {
    const container = setup("?w=Id.Item.AK74M");
    expect(await screen.findByRole("img", { name: /AK74/ }, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Weapon" })).toHaveValue("AK74");
    expect(container.querySelectorAll('[data-testid="recoil-path"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="recoil-cone"]')).toBeNull();
  });

  it("switching to the 60-round magazine changes the multipliers and draws a cone", async () => {
    const user = userEvent.setup();
    const container = setup("?w=Id.Item.AK74M");
    expect(await multipliers()).toHaveTextContent("Vertical ×1, Horizontal ×1");
    await user.click(screen.getByRole("button", { name: /Magazine/ }));
    await user.click(await screen.findByRole("option", { name: "AK74 60 RND Magazine" }, LOAD_TIMEOUT));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^Vertical ×/ })).toHaveTextContent("Vertical ×1.19, Horizontal ×1.21"),
    );
    expect(container.querySelector('[data-testid="recoil-cone"]')).toHaveTextContent("Random after shot 30");
  });

  it("adding a comparison draws two paths with a legend", async () => {
    const user = userEvent.setup();
    const container = setup("?w=Id.Item.AK74M");
    await multipliers();
    await user.click(screen.getByRole("button", { name: "Add comparison" }));
    await user.type(screen.getByRole("combobox", { name: "Comparison weapon" }), "M4");
    await user.click(await screen.findByRole("option", { name: "M4" }, LOAD_TIMEOUT));
    await waitFor(() => expect(container.querySelectorAll('[data-testid="recoil-path"]')).toHaveLength(2));
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("AK74");
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("M4");
    expect(screen.getByRole("switch", { name: "Lock scale" })).toBeDisabled();
  });

  it("shows the note for a weapon without a pattern", async () => {
    const container = setup("?w=Id.Item.Mosin");
    expect(await screen.findByText("No pattern", {}, LOAD_TIMEOUT)).toBeInTheDocument();
    expect(container.querySelector('[data-testid="recoil-path"]')).toBeNull();
  });
});
