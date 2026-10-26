import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import fixture from "./fixtures/skills.json";
import { NO_EFFECTS_NOTE } from "./components/SkillPanel";
import Tool from "./Tool";

function renderTool(search = "") {
  const router = createMemoryRouter([{ path: "/skills", element: <Tool /> }], {
    initialEntries: [`/skills${search}`],
  });
  renderWithData(<RouterProvider router={router} />, { fixtures: { "25937608/skills.json": fixture } });
  return router;
}

describe("Skill trees tool", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens on Assault and switches role with the tabs", async () => {
    const router = renderTool();
    const user = userEvent.setup();
    expect(await screen.findByRole("group", { name: "Assault skill tree" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Assault" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Driver" }));
    expect(await screen.findByRole("group", { name: "Driver skill tree" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Can autorepair/ })).toBeInTheDocument();
    expect(router.state.location.search).toContain("role=Driver");
  });

  it("opens a node's panel when it is clicked", async () => {
    const router = renderTool("?role=Driver");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Time-to-ADS speed improvement \(Mounted MG/ }));
    const panel = await screen.findByRole("region", { name: /^Time-to-ADS speed improvement \(Mounted/ });
    expect(within(panel).getByRole("heading", { name: "ADS time" })).toBeInTheDocument();
    expect(within(panel).getByText("On your items")).toBeInTheDocument();
    expect(router.state.location.search).toContain("skill=Driver.AimDownSightSpeed.MountedGun");
  });

  it("shows the server note for a skill without effects", async () => {
    renderTool("?role=Driver&skill=Driver.AutoRepair");
    expect(await screen.findByText(NO_EFFECTS_NOTE)).toBeInTheDocument();
  });

  it("lists unplaced skills under the tree", async () => {
    renderTool("?role=Medic");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Medkits have more uses" }));
    expect(await screen.findByRole("region", { name: "Medkits have more uses" })).toBeInTheDocument();
  });

  it("selects a skill on another role from the search", async () => {
    const router = renderTool();
    const user = userEvent.setup();
    await screen.findByRole("group", { name: "Assault skill tree" });
    await user.type(screen.getByRole("combobox", { name: "Search skills" }), "petrol");
    await user.click(await screen.findByRole("option", { name: /Can autorepair/ }));
    expect(await screen.findByRole("group", { name: "Driver skill tree" })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: /^Can autorepair/ })).toBeInTheDocument();
    expect(router.state.location.search).toContain("role=Driver");
  });

  it("shows the note about missing costs and prerequisites", async () => {
    renderTool();
    expect(await screen.findByText(/Skill point costs and prerequisites aren't in the game files/)).toBeInTheDocument();
  });
});
