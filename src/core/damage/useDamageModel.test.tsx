import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { simulateKill } from "./simulate";
import { useDamageModel } from "./useDamageModel";

afterEach(() => {
  vi.unstubAllGlobals();
});

function Ak74Stk() {
  const state = useDamageModel();
  if (state.status !== "success") {
    return <p>{state.status}</p>;
  }
  const { damage, equipment, weapons } = state.data;
  const weapon = weapons.weapon("Id.Item.AK74M");
  const ammo = weapon ? weapons.ammoOptions(weapon).find((option) => option.ammoType === "FMJ") : undefined;
  if (!weapon || !ammo) {
    return <p>missing</p>;
  }
  const result = simulateKill({
    damage,
    weapon,
    ammo,
    distance: 50,
    pattern: ["Torso.Upper"],
    target: { health: 100, body: null, helmet: null, extras: [] },
  });
  return <p>{`${equipment.armor.length} armor, STK ${result.supported ? String(result.stk) : "none"}`}</p>;
}

describe("useDamageModel", () => {
  it("loads damage, equipment and the weapon index", async () => {
    renderWithData(<Ak74Stk />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("8 armor, STK 5")).toBeInTheDocument();
  });

  it("reports a missing damage file as an error", async () => {
    renderWithData(<Ak74Stk />, { fixtures: { "25937608/damage.json": undefined } });
    expect(await screen.findByText("error")).toBeInTheDocument();
  });
});
