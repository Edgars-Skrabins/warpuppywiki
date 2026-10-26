import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBuilds, useGameData } from "@/core/data";
import { renderWithData } from "@/core/data/testing";
import { DataStateView } from "./DataStateView";

function Builds({ emptyWhen }: { emptyWhen?: (latest: string) => boolean }) {
  const builds = useBuilds();
  const latest = builds.status === "success" ? { status: "success" as const, data: builds.data.latest } : builds;
  return (
    <DataStateView state={latest} emptyWhen={emptyWhen}>
      {(build) => <p>latest {build}</p>}
    </DataStateView>
  );
}

function Items() {
  const items = useGameData("items");
  return <DataStateView state={items}>{(data) => <p>{data.items.length} items</p>}</DataStateView>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DataStateView", () => {
  it("shows the loading state, then the children with the data", async () => {
    renderWithData(<Builds />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByText("latest 25937608")).toBeInTheDocument();
  });

  it("shows the empty state when emptyWhen matches", async () => {
    renderWithData(<Builds emptyWhen={() => true} />);

    expect(await screen.findByText("Nothing to show")).toBeInTheDocument();
  });

  it("shows the data-missing state with the sync hint in development", async () => {
    renderWithData(<Builds />, { fixtures: { "builds.json": undefined } });

    expect(await screen.findByText("Game data is missing")).toBeInTheDocument();
    expect(screen.getByText("pnpm data:sync")).toBeInTheDocument();
  });

  it("lists validation issues", async () => {
    renderWithData(<Builds />, { fixtures: { "builds.json": { schemaVersion: 1, builds: [] } } });

    expect(await screen.findByText("Game data has an unexpected format")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("retries a network error", async () => {
    renderWithData(<Items />);
    const working = globalThis.fetch;
    let failing = true;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = input instanceof Request ? input.url : input.toString();
        return failing && url.endsWith("items.json")
          ? Promise.resolve(new Response("Server error", { status: 500 }))
          : working(input);
      }),
    );

    expect(await screen.findByText("Could not load game data", {}, { timeout: 5000 })).toBeInTheDocument();
    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByText(/\d+ items/)).toBeInTheDocument());
  });
});
