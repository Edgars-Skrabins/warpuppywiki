import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { renderWithData } from "@/core/data/testing";
import challengeRewards from "./fixtures/challenge-rewards.json";
import rewards from "./fixtures/rewards.json";
import Tool from "./Tool";

function setup() {
  const router = createMemoryRouter([{ path: "/rewards", element: <Tool /> }], { initialEntries: ["/rewards"] });
  renderWithData(<RouterProvider router={router} />, {
    fixtures: {
      "25937608/challenge-rewards.json": challengeRewards,
      "25937608/rewards.json": rewards,
    },
  });
  return { user: userEvent.setup(), router };
}

async function checkHeadshot({ user, router }: ReturnType<typeof setup>) {
  await user.click(await screen.findByRole("checkbox", { name: "Headshot" }));
  await waitFor(() => expect(router.state.location.search).toContain("rewards="));
  await waitFor(() => expect(screen.getByLabelText("Cash amount")).toHaveTextContent("$350"));
}

describe("Reward calculator", { timeout: 15_000 }, () => {
  it("shows the default PlayerKill cash of 300", async () => {
    setup();
    expect(await screen.findByLabelText("Cash amount")).toHaveTextContent("$300");
  });

  it("pays the headshot base when Headshot is checked", async () => {
    await checkHeadshot(setup());
    expect(screen.getByRole("checkbox", { name: "Headshot" })).toBeChecked();
  });

  it("shows the headshot variable in the working", async () => {
    const context = setup();
    await checkHeadshot(context);
    const { user } = context;
    const [showCashWorking] = screen.getAllByRole("button", { name: "Show working" });
    await user.click(showCashWorking!);
    const table = screen.getByRole("grid", { name: "Cash working" });
    expect(within(table).getByText("BaseReward → HeadshotReward")).toBeInTheDocument();
  });

  it("explains the second reward table on the Cash table tab", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("tab", { name: "Cash table" }));
    expect(screen.getByText(/two reward tables that disagree/)).toBeInTheDocument();
  });
});
