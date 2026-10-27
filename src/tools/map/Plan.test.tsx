import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Map as LeafletMap } from "leaflet";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { MapFile } from "@/core/data";
import { renderWithData } from "@/core/data/testing";
import { decodeState } from "@/core/state";
import mapJson from "@/test/fixtures/data/25937608/maps/kavkazi/map.json";
import europeMap from "./fixtures/europe.map.json";
import northAmericaMap from "./fixtures/north-america.map.json";
import { PlanPanel, TOO_LARGE } from "./components/PlanPanel";
import { worldToLatLng } from "./leaflet/projection";
import { measurePath } from "./plan/measure";
import { emptyPlan } from "./plan/plan";
import { mapStateCodec } from "./state";
import Tool from "./Tool";

const kavkazi = mapJson as MapFile;
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

function renderTool() {
  const router = createMemoryRouter([{ path: "/map", element: <Tool /> }], { initialEntries: ["/map"] });
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

describe("map plan", () => {
  it("places a pin in Pin mode, opens its form and saves it to the URL", async () => {
    const user = userEvent.setup();
    const router = renderTool();
    const leafletMap = await readyMap();

    await user.click(screen.getByRole("radio", { name: "Pin" }));
    clickMap(leafletMap, -10000, -12000);

    expect(await screen.findByRole("form", { name: "Edit Pin 1" })).toBeInTheDocument();
    await waitFor(() =>
      expect(urlState(router).plans.kavkazi.pins).toEqual([
        { id: 1, position: [-10000, -12000], label: "Pin 1", color: "yellow", icon: "flag" },
      ]),
    );
  });

  it("measures a three-point path with a label per segment and a total", async () => {
    const user = userEvent.setup();
    renderTool();
    const leafletMap = await readyMap();

    await user.click(screen.getByRole("radio", { name: "Measure" }));
    expect(screen.getByText("Click to add points. Double-click or Enter to finish.")).toBeInTheDocument();
    clickMap(leafletMap, -10000, -12000);
    clickMap(leafletMap, -10000, -12300);
    clickMap(leafletMap, -9600, -12300);

    expect(await screen.findByText("300 m · 000°")).toBeInTheDocument();
    expect(screen.getByText("400 m · 090°")).toBeInTheDocument();
    const plan = within(screen.getByRole("region", { name: "Plan" }));
    expect(plan.getByText("700 m")).toBeInTheDocument();
    expect(plan.getByText("500 m")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("radio", { name: "Pan" })).toBeChecked();
  });

  it("keeps each world's plan separate", async () => {
    const user = userEvent.setup();
    const router = renderTool();
    const leafletMap = await readyMap();

    await user.click(screen.getByRole("radio", { name: "Range rings" }));
    clickMap(leafletMap, -10000, -12000);
    await waitFor(() => expect(urlState(router).plans.kavkazi.rings).toHaveLength(1));

    await user.click(await screen.findByRole("tab", { name: "Ozeti" }));
    await waitFor(() => expect(urlState(router).world).toBe("europe"));
    expect(urlState(router).plans.europe.rings).toEqual([]);
    expect(urlState(router).plans.kavkazi.rings[0]!.distances).toEqual([100, 200, 300, 500]);
    const plan = within(await screen.findByRole("region", { name: "Plan" }));
    expect(plan.getAllByText("None yet.")).toHaveLength(2);
  });

  it("asks before clearing the plan", async () => {
    const user = userEvent.setup();
    const router = renderTool();
    const leafletMap = await readyMap();
    await user.click(screen.getByRole("radio", { name: "Range rings" }));
    clickMap(leafletMap, -10000, -12000);
    await waitFor(() => expect(urlState(router).plans.kavkazi.rings).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Clear plan" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Clear plan?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(urlState(router).plans.kavkazi.rings).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear plan" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Clear plan" }));
    await waitFor(() => expect(urlState(router).plans.kavkazi.rings).toEqual([]));
  });
});

describe("PlanPanel", () => {
  it("disables Copy link when the plan is too large for a link", () => {
    const noop = () => undefined;
    render(
      <PlanPanel
        plan={emptyPlan()}
        measurement={measurePath([])}
        threeD={false}
        threeDAvailable={false}
        onThreeDChange={noop}
        onClearMeasure={noop}
        onRemoveRingSet={noop}
        onEditPin={noop}
        onRemovePin={noop}
        onClearPlan={noop}
        shareUrl={null}
      />,
    );
    expect(screen.getByRole("button", { name: TOO_LARGE })).toBeDisabled();
  });
});
