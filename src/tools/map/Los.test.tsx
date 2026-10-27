import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Map as LeafletMap } from "leaflet";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createQueryClient, DataProvider, type MapFile } from "@/core/data";
import { renderWithData, stubDataFetch } from "@/core/data/testing";
import mapJson from "@/test/fixtures/data/25937608/maps/kavkazi/map.json";
import europeMap from "./fixtures/europe.map.json";
import movementJson from "./fixtures/movement.json";
import northAmericaMap from "./fixtures/north-america.map.json";
import { worldToLatLng } from "./leaflet/projection";
import Tool from "./Tool";

const kavkazi = mapJson as MapFile;
const maps: LeafletMap[] = [];

const fixtures = {
  "25937608/maps/europe/map.json": europeMap,
  "25937608/maps/north-america/map.json": northAmericaMap,
  "25937608/movement.json": movementJson,
};

const manifest = { schemaVersion: 1, build: "25937608", worlds: { kavkazi: { maxZoom: 6 } }, icons: false };
const heightmapMeta = {
  width: 4,
  height: 4,
  metersPerPixel: 4080,
  bounds: { min: [-16320, -20400], max: [0, -4080] },
  zRange: { min: -1000, max: 100 },
};

beforeAll(() => {
  LeafletMap.addInitHook(function (this: LeafletMap) {
    maps.push(this);
  });
});

afterEach(() => {
  maps.length = 0;
  vi.unstubAllGlobals();
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

function router() {
  return createMemoryRouter([{ path: "/map", element: <Tool /> }], { initialEntries: ["/map"] });
}

function renderWithTerrain() {
  stubDataFetch({ fixtures });
  const dataFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : input.toString();
      if (url.endsWith("assets/manifest.json")) return Promise.resolve(json(manifest));
      if (url.endsWith("heightmap.json")) return Promise.resolve(json(heightmapMeta));
      if (url.endsWith("heightmap.u16")) {
        return Promise.resolve(new Response(new Uint16Array(16).fill(30000).buffer, { status: 200 }));
      }
      return dataFetch(input);
    }),
  );
  render(
    <DataProvider client={createQueryClient()}>
      <RouterProvider router={router()} />
    </DataProvider>,
  );
}

async function readyMap() {
  await screen.findByRole("region", { name: "Plan" });
  await waitFor(() => expect(maps.length).toBeGreaterThan(0));
  return maps.at(-1)!;
}

function clickMap(leafletMap: LeafletMap, x: number, y: number) {
  act(() => {
    leafletMap.fire("click", { latlng: worldToLatLng(kavkazi, x, y, leafletMap) });
  });
}

describe("line of sight", () => {
  it("is disabled when terrain data isn't installed", async () => {
    renderWithData(<RouterProvider router={router()} />, { fixtures });
    await readyMap();
    expect(await screen.findByText("Line of sight: Terrain data isn't installed.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Line of sight" })).toBeDisabled();
  });

  it("shows a result after an observer and a target are clicked", async () => {
    const user = userEvent.setup();
    renderWithTerrain();
    const leafletMap = await readyMap();
    const losMode = screen.getByRole("radio", { name: "Line of sight" });
    await waitFor(() => expect(losMode).toBeEnabled());

    await user.click(losMode);
    expect(screen.getByText("Click to set the observer.")).toBeInTheDocument();
    clickMap(leafletMap, -10000, -12000);
    expect(screen.getByText("Click to set the target.")).toBeInTheDocument();
    clickMap(leafletMap, -10000, -12500);

    const panel = within(screen.getByRole("region", { name: "Line of sight" }));
    expect(await panel.findByText("500 m · Clear")).toBeInTheDocument();
  });

  it("changes the observer height shown when the stance changes", async () => {
    const user = userEvent.setup();
    renderWithTerrain();
    const leafletMap = await readyMap();
    const losMode = screen.getByRole("radio", { name: "Line of sight" });
    await waitFor(() => expect(losMode).toBeEnabled());
    await user.click(losMode);
    clickMap(leafletMap, -10000, -12000);

    const panel = within(screen.getByRole("region", { name: "Line of sight" }));
    const observerHeight = () => panel.getByText("Observer height").nextElementSibling?.textContent;
    await waitFor(() => expect(panel.getByText("Eye height").nextElementSibling).toHaveTextContent("1.68 m"));
    const standing = observerHeight();

    await user.click(panel.getByRole("button", { name: /Observer stance/ }));
    await user.click(await screen.findByRole("option", { name: "Prone (0.36 m)" }));

    await waitFor(() => expect(panel.getByText("Eye height").nextElementSibling).toHaveTextContent("0.36 m"));
    expect(observerHeight()).not.toBe(standing);
    expect(observerHeight()).toMatch(/ m$/);
  });
});
