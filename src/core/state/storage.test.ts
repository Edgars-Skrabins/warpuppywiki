import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createStore } from "./storage";

const options = {
  key: "loadouts",
  version: 2,
  schema: z.array(z.object({ name: z.string() })),
  defaults: [] as { name: string }[],
};

describe("createStore", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the defaults when storage is empty", () => {
    expect(createStore(options).read()).toBe(options.defaults);
  });

  it("writes under the wpw. prefix and reads the value back", () => {
    const store = createStore(options);
    store.write([{ name: "Sniper" }]);
    expect(store.read()).toEqual([{ name: "Sniper" }]);
    expect(store.read()).toBe(store.read());
    expect(JSON.parse(localStorage.getItem("wpw.loadouts") ?? "")).toEqual({ version: 2, value: [{ name: "Sniper" }] });
  });

  it("clears the stored value", () => {
    const store = createStore(options);
    store.write([{ name: "Sniper" }]);
    store.clear();
    expect(localStorage.getItem("wpw.loadouts")).toBeNull();
    expect(store.read()).toBe(options.defaults);
  });

  it("reads the defaults for corrupted JSON and warns once", () => {
    localStorage.setItem("wpw.loadouts", "{not json");
    const store = createStore(options);
    expect(store.read()).toBe(options.defaults);
    localStorage.setItem("wpw.loadouts", "{still not json");
    expect(store.read()).toBe(options.defaults);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("reads the defaults when the stored value fails the schema", () => {
    localStorage.setItem("wpw.loadouts", JSON.stringify({ version: 2, value: [{ name: 1 }] }));
    expect(createStore(options).read()).toBe(options.defaults);
  });

  it("reads the defaults for a different version", () => {
    localStorage.setItem("wpw.loadouts", JSON.stringify({ version: 1, value: [{ name: "Sniper" }] }));
    expect(createStore(options).read()).toBe(options.defaults);
  });

  it("behaves like empty storage when localStorage throws", () => {
    const failing = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.stubGlobal("localStorage", { getItem: failing, setItem: failing, removeItem: failing });
    const store = createStore(options);
    expect(store.read()).toBe(options.defaults);
    expect(() => store.write([{ name: "Sniper" }])).not.toThrow();
    expect(() => store.clear()).not.toThrow();
    expect(store.read()).toBe(options.defaults);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("notifies subscribers on write and clear until they unsubscribe", () => {
    const store = createStore(options);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.write([{ name: "Sniper" }]);
    store.clear();
    unsubscribe();
    store.write([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
