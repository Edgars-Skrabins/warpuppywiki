import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Map as LeafletMap } from "leaflet";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { decodeState } from "@/core/state";
import europeMap from "./fixtures/europe.map.json";
import northAmericaMap from "./fixtures/north-america.map.json";
import { worldToLatLng } from "./leaflet/projection";
import mapJson from "@/test/fixtures/data/25937608/maps/kavkazi/map.json";
import type { MapFile } from "@/core/data";
import { mapStateCodec } from "./state";
import Tool from "./Tool";

const maps: LeafletMap[] = [];

beforeAll(() => {
  LeafletMap.addInitHook(function (this: LeafletMap) {
    maps.push(this);
  });
});

afterEach(() => {
  maps.length = 0;
  vi.unstubAllGlobals();
});

function renderTool(path = "/map") {
  const router = createMemoryRouter([{ path: "/map", element: <Tool /> }], { initialEntries: [path] });
  renderWithData(<RouterProvider router={router} />, {
    fixtures: {
      "25937608/maps/europe/map.json": europeMap,
      "25937608/maps/north-america/map.json": northAmericaMap,
    },
  });
  return router;
}

function urlState(router: ReturnType<typeof renderTool>) {
  return decodeState(mapStateCodec, new URLSearchParams(router.state.location.search).get(mapStateCodec.key)).state;
}

describe("map tool", () => {
  it("names the world tabs from each map.json and switches the world in the URL", async () => {
    const user = userEvent.setup();
    const router = renderTool();
    expect(await screen.findByRole("tab", { name: "Bakurani", selected: true })).toBeInTheDocument();
    const ozeti = await screen.findByRole("tab", { name: "Ozeti" }, { timeout: 3000 });
    expect(screen.getByRole("tab", { name: "Zestafona" })).toBeInTheDocument();

    await user.click(ozeti);

    expect(await screen.findByRole("tab", { name: "Ozeti", selected: true })).toBeInTheDocument();
    await waitFor(() => expect(urlState(router).world).toBe("europe"));
  });

  it("says the imagery isn't installed when assets are not synced", async () => {
    renderTool();
    expect(await screen.findByText("Map imagery isn't installed")).toBeInTheDocument();
  });

  it("reads out the grid square and world position under the cursor", async () => {
    renderTool();
    await screen.findByText("Map imagery isn't installed");
    await waitFor(() => expect(maps).toHaveLength(1));
    const leafletMap = maps[0]!;

    act(() => {
      leafletMap.fire("mousemove", { latlng: worldToLatLng(mapJson as MapFile, -10820.4, -14199.6, leafletMap) });
    });

    const readout = screen.getByLabelText("Cursor position");
    expect(readout).toHaveTextContent("GridF7");
    expect(readout).toHaveTextContent("X−10,820 m");
    expect(readout).toHaveTextContent("Y−14,200 m");
    expect(readout).toHaveTextContent("Height—");

    act(() => {
      leafletMap.fire("mouseout");
    });
    expect(readout).toHaveTextContent("Grid—");
  });
});
