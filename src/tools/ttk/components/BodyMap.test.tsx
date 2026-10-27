import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { HitLocation } from "@/core/damage";
import { BodyMap } from "./BodyMap";

function Harness({ covered = new Set<HitLocation>() }: { covered?: ReadonlySet<HitLocation> }) {
  const [sequence, setSequence] = useState<HitLocation[]>([]);
  return <BodyMap sequence={sequence} covered={covered} maxZones={20} onChange={setSequence} />;
}

function chips(): string[] {
  return within(screen.getByRole("list", { name: "Shot sequence" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "");
}

describe("BodyMap", () => {
  it("adds clicked zones as chips in order and clears them", () => {
    render(<Harness />);
    expect(screen.getByText("Pick at least one hit zone")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Head" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Upper chest" }));
    expect(chips()).toEqual(["1Head×", "2Upper chest×"]);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByRole("list", { name: "Shot sequence" })).not.toBeInTheDocument();
    expect(screen.getByText("Pick at least one hit zone")).toBeInTheDocument();
  });

  it("adds zones from the keyboard and removes a single chip", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Thigh" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Add Head" }), { key: " " });
    expect(chips()).toEqual(["1Thigh×", "2Head×"]);

    fireEvent.click(screen.getByRole("button", { name: "Remove shot 1, Thigh" }));
    expect(chips()).toEqual(["1Head×"]);
  });

  it("tints the zones covered by armor", () => {
    render(<Harness covered={new Set<HitLocation>(["Torso.Upper", "Head"])} />);
    expect(screen.getByRole("button", { name: "Add Upper chest" })).toHaveAttribute("data-covered", "true");
    expect(screen.getByRole("button", { name: "Add Head" })).toHaveAttribute("data-covered", "true");
    expect(screen.getByRole("button", { name: "Add Stomach" })).toHaveAttribute("data-covered", "false");
  });
});
