import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeTool, renderApp } from "../testing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AppLayout", () => {
  it("shows the footer disclaimer, data link and build", async () => {
    renderApp([]);

    expect(screen.getByText(/Not affiliated with Bulkhead or Team17/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "warpuppies/wardogs-data" })).toHaveAttribute(
      "href",
      "https://github.com/warpuppies/wardogs-data",
    );
    expect(await screen.findByText("Game build 25937608")).toBeInTheDocument();
  });

  it("shows the data-missing state instead of the page when builds.json is missing", async () => {
    renderApp([fakeTool({ id: "map", name: "Map", category: "map" })], "/map", { "builds.json": undefined });

    expect(await screen.findByText("Game data is missing")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Map" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "warpuppywiki home" })).toBeInTheDocument();
  });
});
