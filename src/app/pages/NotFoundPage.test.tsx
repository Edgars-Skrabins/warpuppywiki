import { render, screen } from "@testing-library/react";
import { createHashRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient, DataProvider } from "@/core/data";
import { stubDataFetch } from "@/core/data/testing";
import { buildRoutes } from "../router";

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = "";
});

describe("NotFoundPage", () => {
  it("renders for an unknown hash path with a link home", () => {
    window.location.hash = "#/no-such-tool";
    stubDataFetch();

    render(
      <DataProvider client={createQueryClient()}>
        <RouterProvider router={createHashRouter(buildRoutes([]))} />
      </DataProvider>,
    );

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to all tools" })).toHaveAttribute("href", "#/");
  });
});
