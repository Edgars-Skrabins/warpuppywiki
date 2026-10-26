import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithData } from "@/core/data/testing";
import { useWeaponIndex } from "./useWeaponIndex";

afterEach(() => {
  vi.unstubAllGlobals();
});

function Ak74Summary() {
  const state = useWeaponIndex();
  if (state.status !== "success") {
    return <p>{state.status}</p>;
  }
  const ak74 = state.data.weapon("Id.Item.AK74M");
  const ammo = ak74 ? state.data.ammoOptions(ak74).length : 0;
  return <p>{`${ak74?.damageClass ?? "none"} ${ammo}`}</p>;
}

describe("useWeaponIndex", () => {
  it("builds the index from the latest build's data", async () => {
    renderWithData(<Ak74Summary />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("Weapon.AR 6")).toBeInTheDocument();
  });

  it("reports a missing weapons file as an error", async () => {
    renderWithData(<Ak74Summary />, { fixtures: { "25937608/weapons.json": undefined } });
    expect(await screen.findByText("error")).toBeInTheDocument();
  });

  it("reports a missing catalog file as an error", async () => {
    renderWithData(<Ak74Summary />, { fixtures: { "25937608/items.json": undefined } });
    expect(await screen.findByText("error")).toBeInTheDocument();
  });
});
