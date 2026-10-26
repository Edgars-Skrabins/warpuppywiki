import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function loadTheme() {
  vi.resetModules();
  return import("./theme");
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applyTheme", () => {
  it("sets data-theme for dark and light", async () => {
    const { applyTheme } = await loadTheme();
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("removes data-theme for system", async () => {
    const { applyTheme } = await loadTheme();
    applyTheme("dark");
    applyTheme("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});

describe("useTheme", () => {
  it("defaults to system when nothing is stored", async () => {
    const { useTheme } = await loadTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("persists the preference and applies it", async () => {
    const { useTheme, THEME_STORAGE_KEY } = await loadTheme();
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]("light"));
    expect(result.current[0]).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("restores the stored preference on load", async () => {
    window.localStorage.setItem("wpw.theme", "dark");
    const { useTheme } = await loadTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ignores an invalid stored value", async () => {
    window.localStorage.setItem("wpw.theme", "purple");
    const { useTheme } = await loadTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
  });

  it("keeps working when local storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { useTheme } = await loadTheme();
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("system");
    act(() => result.current[1]("dark"));
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("keeps every hook instance in sync", async () => {
    const { useTheme } = await loadTheme();
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());
    act(() => first.result.current[1]("light"));
    expect(second.result.current[0]).toBe("light");
  });
});
