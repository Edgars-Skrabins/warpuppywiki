import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayback } from "./usePlayback";

function mockReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
}

describe("usePlayback", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the whole path until played", () => {
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 1 }));
    expect(result.current.shown).toBe(30);
    expect(result.current.playing).toBe(false);
  });

  it("advances one shot every 60 / rpm seconds and stops at the end", () => {
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 1 }));
    act(() => {
      result.current.play();
    });
    expect(result.current.playing).toBe(true);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.shown).toBe(1);
    act(() => {
      vi.advanceTimersByTime(110);
    });
    expect(result.current.shown).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.shown).toBe(12);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.shown).toBe(30);
    expect(result.current.playing).toBe(false);
  });

  it("slows down with the speed factor", () => {
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 0.25 }));
    act(() => {
      result.current.play();
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.shown).toBe(3);
  });

  it("pauses and resumes where it stopped", () => {
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 1 }));
    act(() => {
      result.current.play();
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => {
      result.current.pause();
    });
    const paused = result.current.shown;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.shown).toBe(paused);
    act(() => {
      result.current.play();
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.shown).toBe(paused + 1);
  });

  it("restarts from the first shot", () => {
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 1 }));
    act(() => {
      result.current.restart();
    });
    expect(result.current.shown).toBe(0);
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.shown).toBe(1);
  });

  it("shows the full path at once with reduced motion", () => {
    mockReducedMotion(true);
    const { result } = renderHook(() => usePlayback({ shots: 30, rpm: 600, speed: 1 }));
    act(() => {
      result.current.restart();
    });
    expect(result.current.shown).toBe(30);
    expect(result.current.playing).toBe(false);
  });
});
