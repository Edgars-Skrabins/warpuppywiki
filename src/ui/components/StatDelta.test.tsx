import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatDelta, type BetterWhen } from "./StatDelta";

afterEach(() => {
  cleanup();
});

function renderDelta(from: number, to: number, betterWhen: BetterWhen) {
  render(<StatDelta from={from} to={to} betterWhen={betterWhen} format="seconds" />);
  return screen.getByText(/s$/).parentElement!;
}

describe("StatDelta", () => {
  it("marks a higher value as better when higher is better", () => {
    const delta = renderDelta(0.5, 0.6, "higher");
    expect(delta).toHaveAttribute("data-quality", "better");
    expect(delta).toHaveTextContent("▲+0.1 s(better)");
  });

  it("marks a lower value as worse when higher is better", () => {
    const delta = renderDelta(0.6, 0.5, "higher");
    expect(delta).toHaveAttribute("data-quality", "worse");
    expect(delta).toHaveTextContent("▼−0.1 s(worse)");
  });

  it("marks a lower value as better when lower is better", () => {
    const delta = renderDelta(0.6, 0.5, "lower");
    expect(delta).toHaveAttribute("data-quality", "better");
    expect(delta).toHaveTextContent("▼−0.1 s");
  });

  it("marks a higher value as worse when lower is better", () => {
    expect(renderDelta(0.5, 0.6, "lower")).toHaveAttribute("data-quality", "worse");
  });

  it("stays neutral for neutral stats", () => {
    const delta = renderDelta(0.5, 0.6, "neutral");
    expect(delta).toHaveAttribute("data-quality", "neutral");
    expect(delta).toHaveTextContent("▲+0.1 s");
  });

  it("stays neutral with no arrow when nothing changed", () => {
    const delta = renderDelta(0.5, 0.5, "lower");
    expect(delta).toHaveAttribute("data-quality", "neutral");
    expect(delta.textContent).toBe("0 s");
  });
});
