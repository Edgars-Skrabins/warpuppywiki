import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { z } from "zod";
import { encodeState, defineUrlState } from "./urlCodec";
import { URL_STATE_DEBOUNCE_MS, useUrlState } from "./useUrlState";

const codec = defineUrlState({
  key: "l",
  version: 1,
  schema: z.object({ weapon: z.string() }),
  defaults: { weapon: "" },
});

const probe: { setState: (next: { weapon: string } | ((prev: { weapon: string }) => { weapon: string })) => void } = {
  setState: () => undefined,
};
const decodeErrors: boolean[] = [];
const rendered: string[] = [];

function Probe() {
  const [state, set, { decodeError }] = useUrlState(codec);
  useEffect(() => {
    probe.setState = set;
    decodeErrors.push(decodeError);
  });
  rendered.push(state.weapon);
  return <p>weapon:{state.weapon}</p>;
}

function setup(search = "") {
  const router = createMemoryRouter([{ path: "/loadout", element: <Probe /> }], {
    initialEntries: [`/loadout${search}`],
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("useUrlState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    decodeErrors.length = 0;
    rendered.length = 0;
  });

  it("never renders the previous state while the URL write is applied", async () => {
    const router = setup();
    act(() => probe.setState({ weapon: "WP_M4" }));
    await act(async () => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
      await Promise.resolve();
    });
    expect(router.state.location.search).toBe(`?l=${encodeState(codec, { weapon: "WP_M4" })}`);
    const firstNew = rendered.indexOf("WP_M4");
    expect(rendered.slice(firstNew)).not.toContain("");
    expect(screen.getByText("weapon:WP_M4")).toBeInTheDocument();
  });

  it("follows a URL change made outside the hook after a write", async () => {
    const router = setup();
    act(() => probe.setState({ weapon: "WP_M4" }));
    await act(async () => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
      await Promise.resolve();
    });
    await act(async () => {
      await router.navigate(`/loadout?l=${encodeState(codec, { weapon: "WP_AK74" })}`);
    });
    expect(screen.getByText("weapon:WP_AK74")).toBeInTheDocument();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("reads the initial state from the query string", () => {
    setup(`?l=${encodeState(codec, { weapon: "WP_AK74" })}`);
    expect(screen.getByText("weapon:WP_AK74")).toBeInTheDocument();
  });

  it("writes the encoded state after the debounce with replace navigation", () => {
    const router = setup();
    act(() => probe.setState({ weapon: "WP_M4" }));
    expect(screen.getByText("weapon:WP_M4")).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
    act(() => probe.setState((prev) => ({ weapon: `${prev.weapon}A1` })));
    act(() => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
    });
    expect(router.state.location.search).toBe(`?l=${encodeState(codec, { weapon: "WP_M4A1" })}`);
    expect(router.state.historyAction).toBe("REPLACE");
    expect(screen.getByText("weapon:WP_M4A1")).toBeInTheDocument();
  });

  it("removes the parameter when the state is set to the defaults", () => {
    const router = setup(`?l=${encodeState(codec, { weapon: "WP_AK74" })}&tab=stats`);
    act(() => probe.setState({ weapon: "" }));
    act(() => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
    });
    expect(router.state.location.search).toBe("?tab=stats");
  });

  it("does not navigate when the state already matches the URL", () => {
    const router = setup(`?l=${encodeState(codec, { weapon: "WP_AK74" })}`);
    const before = router.state.location.key;
    act(() => probe.setState({ weapon: "WP_AK74" }));
    act(() => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
    });
    expect(router.state.location.key).toBe(before);
  });

  it("falls back to the defaults and reports a decode error once for a corrupted parameter", () => {
    const router = setup("?l=1.corrupted");
    expect(screen.getByText("weapon:")).toBeInTheDocument();
    expect(decodeErrors.at(-1)).toBe(true);
    act(() => probe.setState({ weapon: "WP_M4" }));
    expect(decodeErrors.at(-1)).toBe(false);
    act(() => {
      vi.advanceTimersByTime(URL_STATE_DEBOUNCE_MS);
    });
    expect(router.state.location.search).toBe(`?l=${encodeState(codec, { weapon: "WP_M4" })}`);
    expect(decodeErrors.at(-1)).toBe(false);
  });

  it("follows the URL when it changes from outside", async () => {
    const router = setup();
    await act(() => router.navigate(`/loadout?l=${encodeState(codec, { weapon: "WP_SVD" })}`));
    expect(screen.getByText("weapon:WP_SVD")).toBeInTheDocument();
  });
});
