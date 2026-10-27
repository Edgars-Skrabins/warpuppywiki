import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeTool, renderApp } from "../testing";

const tools = [
  fakeTool({ id: "patch-diff", name: "Patch diff", category: "updates", summary: "What changed between builds" }),
  fakeTool({
    id: "ttk",
    name: "TTK calculator",
    category: "combat",
    summary: "Time to kill per weapon",
    status: "beta",
  }),
  fakeTool({ id: "map", name: "Map", category: "map", summary: "Interactive world map" }),
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("shows the app name, the build, featured tools and the remaining tools", async () => {
    renderApp(tools);

    expect(screen.getByRole("heading", { level: 1, name: "warpuppywiki" })).toBeInTheDocument();
    expect(await screen.findByText("Game build 25937608, published 15 Oct 2026")).toBeInTheDocument();
    const featured = screen.getByRole("region", { name: "Featured tools" });
    expect(within(featured).getByRole("link", { name: /TTK calculator/ })).toHaveAttribute("href", "/ttk");
    expect(within(featured).getByRole("link", { name: /Map/ })).toHaveAttribute("href", "/map");
    const more = screen.getByRole("region", { name: "More tools" });
    expect(within(more).getByRole("link", { name: /Patch diff/ })).toHaveAttribute("href", "/patch-diff");
  });

  it("filters cards by name and summary", async () => {
    renderApp(tools);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search tools" }), "between builds");

    expect(screen.getByRole("link", { name: /Patch diff/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /TTK calculator/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Combat" })).not.toBeInTheDocument();
  });

  it("says when no tool matches the search", async () => {
    renderApp(tools);

    await userEvent.type(screen.getByRole("searchbox", { name: "Search tools" }), "zzz");

    expect(screen.getByText("No tool matches")).toBeInTheDocument();
  });

  it("shows a beta badge only on beta tools", () => {
    renderApp(tools);

    expect(within(screen.getByRole("link", { name: /TTK calculator/ })).getByText("Beta")).toBeInTheDocument();
    expect(within(screen.getByRole("link", { name: /Map/ })).queryByText("Beta")).not.toBeInTheDocument();
  });

  it("shows a message when there are no tools", () => {
    renderApp([]);

    expect(screen.getByText("No tools yet")).toBeInTheDocument();
  });
});
