import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { useCatalog } from "./useCatalog";

afterEach(() => {
  vi.unstubAllGlobals();
});

function M4Unlock() {
  const state = useCatalog();
  if (state.status !== "success") {
    return <p>{state.status}</p>;
  }
  const m4 = state.data.item("id.item.m4");
  const unlock = m4 ? state.data.unlock(m4) : null;
  return <p>{`${state.data.playerItems.length} ${unlock?.roleLabel ?? "none"} ${unlock?.level ?? 0}`}</p>;
}

describe("useCatalog", () => {
  it("builds the catalog from the latest build's items, tags and roles", async () => {
    renderWithData(<M4Unlock />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("34 Assault 28")).toBeInTheDocument();
  });

  it("reports a missing data file as an error", async () => {
    renderWithData(<M4Unlock />, { fixtures: { "25937608/roles.json": undefined } });
    expect(await screen.findByText("error")).toBeInTheDocument();
  });
});
