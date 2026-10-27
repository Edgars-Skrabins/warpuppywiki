import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { decodeState } from "@/core/state";
import europeMap from "./fixtures/europe.map.json";
import northAmericaMap from "./fixtures/north-america.map.json";
import { mapStateCodec } from "./state";
import Tool from "./Tool";

afterEach(() => {
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

async function layersPanel() {
  return within(await screen.findByRole("region", { name: "Layers" }));
}

function toggle(panel: Awaited<ReturnType<typeof layersPanel>>, label: string) {
  return panel.getByRole("checkbox", { name: new RegExp(`^${label}\\d*$`) });
}

describe("map layers", () => {
  it("writes layer toggles into the URL", async () => {
    const user = userEvent.setup();
    const router = renderTool();
    const panel = await layersPanel();
    await waitFor(() => expect(toggle(panel, "Buildings")).toBeEnabled());

    await user.click(toggle(panel, "Buildings"));
    await user.click(toggle(panel, "Control zones"));

    await waitFor(() => expect(urlState(router).layers).toMatchObject({ buildings: true, objectives: false }));
    await user.click(toggle(panel, "Garage"));
    await waitFor(() => expect(urlState(router).buildingKinds.garage).toBe(false));
  });

  it("labels each control zone placement with its chance", async () => {
    renderTool();
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("25%")).toHaveLength(2);
  });

  it("disables a layer with nothing on the current world", async () => {
    renderTool();
    const panel = await layersPanel();
    await waitFor(() => expect(toggle(panel, "Deployment boards")).toBeDisabled());
    expect(toggle(panel, "Fuel refills")).toBeDisabled();
    expect(toggle(panel, "Equipment vendors")).toBeEnabled();
    expect(panel.getAllByText("None on this map")).toHaveLength(2);
  });

  it("counts the buildings of each kind from the data", async () => {
    renderTool();
    const panel = await layersPanel();
    await waitFor(() => expect(toggle(panel, "Buildings")).toHaveAccessibleName("Buildings10"));
    expect(toggle(panel, "Bungalow")).toHaveAccessibleName("Bungalow5");
    expect(toggle(panel, "House")).toHaveAccessibleName("House3");
    expect(toggle(panel, "Garage")).toHaveAccessibleName("Garage2");
    expect(panel.queryByRole("checkbox", { name: /^Warehouse/ })).not.toBeInTheDocument();
  });
});
