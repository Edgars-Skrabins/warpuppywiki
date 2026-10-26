import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { createStore } from "./storage";
import { useStoredState } from "./useStoredState";

const store = createStore({ key: "lastWeapon", version: 1, schema: z.string(), defaults: "none" });

function Probe() {
  const [weapon, setWeapon] = useStoredState(store);
  return <button onClick={() => setWeapon((prev) => `${prev}!`)}>weapon:{weapon}</button>;
}

describe("useStoredState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(cleanup);

  it("updates when another tab changes the stored value", () => {
    render(<Probe />);
    expect(screen.getByText("weapon:none")).toBeInTheDocument();
    act(() => {
      localStorage.setItem(store.storageKey, JSON.stringify({ version: 1, value: "WP_AK74" }));
      window.dispatchEvent(new StorageEvent("storage", { key: store.storageKey }));
    });
    expect(screen.getByText("weapon:WP_AK74")).toBeInTheDocument();
  });

  it("writes through the setter and re-renders", () => {
    render(<Probe />);
    act(() => screen.getByRole("button").click());
    expect(screen.getByText("weapon:none!")).toBeInTheDocument();
  });
});
