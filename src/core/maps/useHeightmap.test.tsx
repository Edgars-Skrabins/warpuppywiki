import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient, DataProvider, type World } from "@/core/data";
import { syntheticMeta, syntheticValues, u16Buffer } from "./fixtures/syntheticHeightmap";
import { useHeightmap } from "./useHeightmap";

afterEach(() => {
  vi.unstubAllGlobals();
});

const base = import.meta.env.BASE_URL;

function stubAssets(files: Record<string, BodyInit | object>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : input.toString();
      const body = files[url.slice(base.length)];
      if (body === undefined) {
        return Promise.resolve(new Response("Not found", { status: 404 }));
      }
      const isBinary = body instanceof ArrayBuffer;
      return Promise.resolve(
        new Response(isBinary ? body : JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": isBinary ? "application/octet-stream" : "application/json" },
        }),
      );
    }),
  );
}

const manifest = { schemaVersion: 1, build: "25937608", worlds: { kavkazi: { maxZoom: 6 } }, icons: true };

function Probe({ world }: { world: World }) {
  const state = useHeightmap(world);
  if (state.status !== "success") {
    return <p>{state.status === "error" ? `error ${state.error.kind}` : "loading"}</p>;
  }
  return <p>{state.data === null ? "none" : `height ${state.data.heightAt(115, 215)?.toFixed(2)}`}</p>;
}

function renderProbe(world: World) {
  render(
    <DataProvider client={createQueryClient()}>
      <Probe world={world} />
    </DataProvider>,
  );
}

describe("useHeightmap", () => {
  it("returns null when assets are not synced", async () => {
    stubAssets({});
    renderProbe("kavkazi");
    expect(await screen.findByText("none")).toBeInTheDocument();
  });

  it("returns null when the manifest lacks the world", async () => {
    stubAssets({ "assets/manifest.json": manifest });
    renderProbe("europe");
    expect(await screen.findByText("none")).toBeInTheDocument();
  });

  it("loads and parses the world's heightmap", async () => {
    stubAssets({
      "assets/manifest.json": manifest,
      "assets/maps/kavkazi/heightmap.json": syntheticMeta,
      "assets/maps/kavkazi/heightmap.u16": u16Buffer(syntheticValues),
    });
    renderProbe("kavkazi");
    expect(await screen.findByText("height -96.00")).toBeInTheDocument();
  });

  it("reports a missing heightmap file as an error", async () => {
    stubAssets({ "assets/manifest.json": manifest, "assets/maps/kavkazi/heightmap.json": syntheticMeta });
    renderProbe("kavkazi");
    expect(await screen.findByText("error missing")).toBeInTheDocument();
  });
});
