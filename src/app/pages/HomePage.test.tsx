import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { createQueryClient, DataProvider } from "@/core/data";
import { stubDataFetch } from "@/core/data/testing";
import type { ToolDefinition } from "@/core/tool";
import { buildRoutes } from "../router";
import { fakeTool, renderApp } from "../testing";

const manifest = { schemaVersion: 1, build: "25937608", worlds: {}, icons: true };

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

const featuredTools = [fakeTool({ id: "loadout", name: "Loadout builder", category: "combat" }), ...tools];

function renderAppWithAssets(appTools: readonly ToolDefinition[], assetsManifest: object = manifest) {
  stubDataFetch();
  const dataFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : input.toString();
      return url.endsWith("assets/manifest.json")
        ? Promise.resolve(
            new Response(JSON.stringify(assetsManifest), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          )
        : dataFetch(input);
    }),
  );
  const router = createMemoryRouter(buildRoutes(appTools), { initialEntries: ["/"] });
  render(
    <DataProvider client={createQueryClient()}>
      <RouterProvider router={router} />
    </DataProvider>,
  );
}

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

  it("loads the featured images eagerly with high priority on the first", async () => {
    renderAppWithAssets(featuredTools);

    const featured = screen.getByRole("region", { name: "Featured tools" });
    await waitFor(() => expect(featured.querySelectorAll("img")).toHaveLength(3));
    const images = Array.from(featured.querySelectorAll("img"));
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images[0]?.getAttribute("src")).toContain("T_UI_Vendor_WEPN_001v2.png");
    expect(images.slice(1).some((image) => image.hasAttribute("fetchpriority"))).toBe(false);
    expect(images.some((image) => image.getAttribute("loading") === "lazy")).toBe(false);
  });

  it("shows the fallback icons when no assets are synced", async () => {
    renderApp(featuredTools);

    expect(await screen.findByText("Game build 25937608, published 15 Oct 2026")).toBeInTheDocument();
    const featured = screen.getByRole("region", { name: "Featured tools" });
    expect(featured.querySelectorAll("img")).toHaveLength(0);
    expect(featured.querySelectorAll("svg")).toHaveLength(3);
  });

  it("requests the featured renders as webp when the assets manifest says so", async () => {
    renderAppWithAssets(featuredTools, { ...manifest, iconFormat: "webp" });

    const featured = screen.getByRole("region", { name: "Featured tools" });
    await waitFor(() => expect(featured.querySelectorAll("img")).toHaveLength(3));
    expect(Array.from(featured.querySelectorAll("img"), (image) => image.getAttribute("src"))).toEqual([
      `${import.meta.env.BASE_URL}assets/icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_001v2.webp`,
      `${import.meta.env.BASE_URL}assets/icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_008.webp`,
      `${import.meta.env.BASE_URL}assets/maps/kavkazi/tiles/2/1/2.webp`,
    ]);
  });

  it("keeps the stored png paths when the assets manifest has no icon format", async () => {
    renderAppWithAssets(featuredTools);

    const featured = screen.getByRole("region", { name: "Featured tools" });
    await waitFor(() => expect(featured.querySelectorAll("img")).toHaveLength(3));
    const sources = Array.from(featured.querySelectorAll("img"), (image) => image.getAttribute("src"));
    expect(sources[0]).toMatch(/T_UI_Vendor_WEPN_001v2\.png$/);
    expect(sources[1]).toMatch(/T_UI_Vendor_WEPN_008\.png$/);
  });
});
