import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient, DataProvider } from "./DataProvider";
import {
  useAssetsManifest,
  useGameData,
  useGameDataMany,
  useRawGameDataMany,
  useRawWorldDataMany,
  useWorldData,
  type DataState,
} from "./hooks";
import { renderWithData, stubDataFetch } from "./testing";

afterEach(() => {
  vi.unstubAllGlobals();
});

function describeState<T>(state: DataState<T>, show: (data: T) => string): string {
  if (state.status === "success") {
    return `success ${show(state.data)}`;
  }
  if (state.status === "error") {
    return `error ${state.error.kind}`;
  }
  return "loading";
}

function Weapons({ build }: { build?: string }) {
  const state = useGameData("weapons", { build });
  return <p>{describeState(state, (data) => `${data.gameBuild} ${data.weapons.length}`)}</p>;
}

function Vehicles() {
  const state = useGameData("vehicles");
  return <p>{describeState(state, (data) => String(data.vehicles.length))}</p>;
}

function ItemsAndWeapons() {
  const state = useGameDataMany(["items", "weapons"]);
  return <p>{describeState(state, (data) => `${data.items.items.length} ${data.weapons.weapons.length}`)}</p>;
}

function ItemsAndVehicles() {
  const state = useGameDataMany(["items", "vehicles"]);
  return <p>{describeState(state, (data) => `${data.items.items.length} ${data.vehicles.vehicles.length}`)}</p>;
}

function KavkaziObjects() {
  const state = useWorldData("kavkazi", "objects");
  return <p>{describeState(state, (data) => String(data.objects.length))}</p>;
}

function RawFiles({ build }: { build: string }) {
  const states = useRawGameDataMany(["weapons", "vehicles"], { build });
  return (
    <p>{states.map((state) => describeState(state, (data) => (data as { gameBuild: string }).gameBuild)).join(", ")}</p>
  );
}

function RawWorldFiles() {
  const states = useRawWorldDataMany(
    [
      { world: "kavkazi", key: "objects" },
      { world: "europe", key: "objects" },
    ],
    { build: "25937608" },
  );
  return <p>{states.map((state) => describeState(state, (data) => (data as { world: string }).world)).join(", ")}</p>;
}

function Manifest() {
  const state = useAssetsManifest();
  return <p>{describeState(state, (data) => (data === null ? "none" : data.build))}</p>;
}

describe("useGameData", () => {
  it("is loading first, then returns the latest build's data", async () => {
    renderWithData(<Weapons />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(await screen.findByText("success 25937608 6")).toBeInTheDocument();
  });

  it("returns DataMissingError when the file is missing", async () => {
    renderWithData(<Vehicles />);
    expect(await screen.findByText("error missing")).toBeInTheDocument();
  });

  it("loads an explicit build", async () => {
    renderWithData(<Weapons build="25677108" />);
    expect(await screen.findByText("success 25677108 6")).toBeInTheDocument();
  });
});

describe("useGameDataMany", () => {
  it("stays loading until every file has loaded", async () => {
    stubDataFetch();
    const serve = globalThis.fetch;
    let releaseWeapons = () => {};
    const weaponsGate = new Promise<void>((resolve) => {
      releaseWeapons = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        if (input.toString().endsWith("/weapons.json")) {
          await weaponsGate;
        }
        return serve(input);
      }),
    );
    render(
      <DataProvider client={createQueryClient()}>
        <ItemsAndWeapons />
      </DataProvider>,
    );
    await vi.waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/items\.json$/));
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    expect(screen.getByText("loading")).toBeInTheDocument();
    act(() => {
      releaseWeapons();
    });
    expect(await screen.findByText("success 35 6")).toBeInTheDocument();
  });

  it("returns the error when one file fails", async () => {
    renderWithData(<ItemsAndVehicles />);
    expect(await screen.findByText("error missing")).toBeInTheDocument();
  });
});

describe("useWorldData", () => {
  it("returns a world file of the latest build", async () => {
    renderWithData(<KavkaziObjects />);
    expect(await screen.findByText("success 5")).toBeInTheDocument();
  });
});

describe("useRawGameDataMany", () => {
  it("returns one state per file without schema validation", async () => {
    renderWithData(<RawFiles build="25677108" />, {
      fixtures: { "25677108/weapons.json": { gameBuild: "25677108", weapons: "not an array" } },
    });
    expect(await screen.findByText("success 25677108, error missing")).toBeInTheDocument();
  });
});

describe("useRawWorldDataMany", () => {
  it("returns one state per world file", async () => {
    renderWithData(<RawWorldFiles />);
    expect(await screen.findByText("success Kavkazi, error missing")).toBeInTheDocument();
  });
});

describe("useAssetsManifest", () => {
  it("returns null when the manifest is missing", async () => {
    renderWithData(<Manifest />);
    expect(await screen.findByText("success none")).toBeInTheDocument();
  });
});
