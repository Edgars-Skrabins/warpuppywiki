import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import challengeRewardsJson from "./fixtures/challenge-rewards.json";
import metaJson from "./fixtures/meta.json";
import Tool from "./Tool";

const fixtures = {
  "25937608/meta.json": metaJson,
  "25937608/challenge-rewards.json": challengeRewardsJson,
};

function renderTool() {
  return renderWithData(<Tool />, { fixtures });
}

async function addM4() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Add unlocks" }));
  const dialog = await screen.findByRole("dialog", { name: "Add unlocks" });
  await user.type(within(dialog).getByRole("searchbox", { name: "Search unlocks" }), "M4");
  await user.click(within(dialog).getByRole("checkbox", { name: /M4/ }));
  await user.click(within(dialog).getByRole("button", { name: "Add 1 unlock" }));
  return user;
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Progression planner", () => {
  it("shows the Assault XP and unlock cost the M4 needs, then reached at level 28", async () => {
    renderTool();
    expect(await screen.findByText("Add the unlocks you want to see what they take.")).toBeInTheDocument();
    const user = await addM4();

    const plan = screen.getByRole("region", { name: "Plan" });
    expect(within(plan).getByText("266,950 XP needed")).toBeInTheDocument();
    expect(within(plan).getAllByText("$150,000").length).toBeGreaterThan(0);
    expect(within(plan).getByText("$140,000")).toBeInTheDocument();

    const assault = screen.getByRole("textbox", { name: "Assault level" });
    await user.clear(assault);
    await user.type(assault, "28");
    await user.tab();

    expect(within(plan).getAllByText("Reached").length).toBeGreaterThan(0);
    const goals = screen.getByRole("region", { name: "Goals" });
    expect(within(goals).getByText("Reached")).toBeInTheDocument();
  });

  it("estimates matches from the earning rate", async () => {
    renderTool();
    const user = await addM4();
    expect(screen.getByText(/A player kill pays a base of \$300 cash and 250 role XP/)).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Role XP per match" }), "1000");
    await user.tab();

    expect(screen.getByText("≈ 267 matches")).toBeInTheDocument();
  });

  it("keeps progress after a reload", async () => {
    const first = renderTool();
    const user = await addM4();
    const career = screen.getByRole("textbox", { name: "Career level" });
    await user.clear(career);
    await user.type(career, "12");
    await user.tab();
    first.unmount();
    cleanup();

    renderTool();
    const goals = await screen.findByRole("region", { name: "Goals" });
    expect(within(goals).getByRole("button", { name: "Remove M4" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Career level" })).toHaveValue("12");
  });
});
