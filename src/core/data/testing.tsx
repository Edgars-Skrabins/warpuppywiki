import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { dataRoot } from "./builds";
import { DataProvider } from "./DataProvider";
import { createQueryClient } from "./queryClient";

const FIXTURE_PREFIX = "/src/test/fixtures/data/";

const sharedFixtures: Record<string, unknown> = Object.fromEntries(
  Object.entries(import.meta.glob("/src/test/fixtures/data/**/*.json", { eager: true, import: "default" })).map(
    ([file, value]) => [file.slice(FIXTURE_PREFIX.length), value],
  ),
);

type RenderWithDataOptions = {
  fixtures?: Record<string, unknown>;
  build?: string;
};

function sharedFixture(path: string): Record<string, unknown> {
  const file = sharedFixtures[path];
  if (file === undefined) {
    throw new Error(`No shared fixture at ${path}`);
  }
  return file as Record<string, unknown>;
}

export function fixtureWith(path: string, collection: string, extraRecords: unknown[]): Record<string, unknown> {
  const file = sharedFixture(path);
  const records = file[collection];
  if (!Array.isArray(records)) {
    throw new Error(`Fixture ${path} has no array at ${collection}`);
  }
  return { ...file, [collection]: [...(records as unknown[]), ...extraRecords] };
}

export function stubDataFetch({ fixtures = {}, build }: RenderWithDataOptions = {}): void {
  const files: Record<string, unknown> = { ...sharedFixtures, ...fixtures };
  if (build !== undefined) {
    files["builds.json"] = { ...sharedFixture("builds.json"), latest: build };
  }
  const root = dataRoot();
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : input.toString();
      const path = url.startsWith(root) ? url.slice(root.length) : undefined;
      const body = path === undefined ? undefined : files[path];
      return Promise.resolve(
        body === undefined
          ? new Response("Not found", { status: 404 })
          : new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
      );
    }),
  );
}

export function renderWithData(ui: ReactElement, options: RenderWithDataOptions = {}): RenderResult {
  stubDataFetch(options);
  return render(<DataProvider client={createQueryClient()}>{ui}</DataProvider>);
}
