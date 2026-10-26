import { afterEach, describe, expect, it, vi } from "vitest";
import { DataMissingError, DataNetworkError, DataValidationError, fetchJson } from "./fetchJson";

const URL = "/data/25937608/items.json";

function stubFetch(implementation: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(implementation));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns parsed JSON", async () => {
    stubFetch(() => Promise.resolve(new Response('{"items":[]}', { status: 200 })));
    await expect(fetchJson(URL)).resolves.toEqual({ items: [] });
  });

  it("throws DataMissingError on 404", async () => {
    stubFetch(() => Promise.resolve(new Response("Not found", { status: 404 })));
    const error = await fetchJson(URL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataMissingError);
    expect(error).toMatchObject({ kind: "missing", url: URL });
  });

  it("throws DataMissingError when a dev server answers with its HTML fallback", async () => {
    stubFetch(() =>
      Promise.resolve(new Response("<!doctype html>", { status: 200, headers: { "Content-Type": "text/html" } })),
    );
    const error = await fetchJson(URL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataMissingError);
  });

  it("throws DataNetworkError with the status on 500", async () => {
    stubFetch(() => Promise.resolve(new Response("Server error", { status: 500 })));
    const error = await fetchJson(URL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataNetworkError);
    expect(error).toMatchObject({ kind: "network", url: URL, status: 500 });
  });

  it("throws DataNetworkError without a status when fetch throws", async () => {
    stubFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    const error = await fetchJson(URL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataNetworkError);
    expect(error).toMatchObject({ kind: "network", url: URL, status: undefined });
  });

  it("throws DataValidationError on invalid JSON", async () => {
    stubFetch(() => Promise.resolve(new Response("<!doctype html>", { status: 200 })));
    const error = await fetchJson(URL).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataValidationError);
    expect(error).toMatchObject({ kind: "validation", url: URL, issues: ["not valid JSON"] });
  });
});
