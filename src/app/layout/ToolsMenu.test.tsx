import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeTool, renderApp } from "../testing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ToolsMenu", () => {
  it("opens without errors when a tool id matches its category id", async () => {
    const user = userEvent.setup();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderApp([
      fakeTool({ id: "map", name: "Map", category: "map" }),
      fakeTool({ id: "loadout", name: "Loadout Builder", category: "combat" }),
    ]);

    await user.click(screen.getByRole("button", { name: /Tools/ }));

    expect(await screen.findByRole("menuitem", { name: /Map/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Loadout Builder/ })).toBeInTheDocument();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });
});
