import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQueryClient, DataProvider, queryKeys } from "@/core/data";
import { ItemIcon } from "./ItemIcon";

const manifest = { schemaVersion: 1, build: "25937608", worlds: {}, icons: true };

function renderIcon(body: unknown): QueryClient {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        body === null
          ? new Response("Not found", { status: 404 })
          : new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    ),
  );
  const client = createQueryClient();
  render(
    <DataProvider client={client}>
      <ItemIcon icon="Weapons/AK74M.png" name="Field Dressing" />
    </DataProvider>,
  );
  return client;
}

function image(): HTMLImageElement | null {
  return document.querySelector("img");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ItemIcon", () => {
  it("shows the initials placeholder when assets are not synced", async () => {
    const client = renderIcon(null);

    await waitFor(() => expect(client.getQueryState(queryKeys.assetsManifest())?.status).toBe("success"));
    expect(screen.getByRole("img", { name: "Field Dressing" })).toHaveTextContent("FD");
    expect(image()).toBeNull();
  });

  it("shows the image when the assets manifest is present", async () => {
    renderIcon(manifest);

    await waitFor(() => expect(image()).not.toBeNull());
    expect(image()).toHaveAttribute("src", `${import.meta.env.BASE_URL}assets/icons/Weapons/AK74M.png`);
    expect(image()).toHaveAttribute("alt", "Field Dressing");
  });

  it("requests the WebP file when the manifest says the icons are WebP", async () => {
    renderIcon({ ...manifest, iconFormat: "webp" });

    await waitFor(() => expect(image()).not.toBeNull());
    expect(image()).toHaveAttribute("src", `${import.meta.env.BASE_URL}assets/icons/Weapons/AK74M.webp`);
  });

  it("requests the path as given when the manifest says the icons are PNG", async () => {
    renderIcon({ ...manifest, iconFormat: "png" });

    await waitFor(() => expect(image()).not.toBeNull());
    expect(image()).toHaveAttribute("src", `${import.meta.env.BASE_URL}assets/icons/Weapons/AK74M.png`);
  });

  it("falls back to the placeholder when the image fails to load", async () => {
    renderIcon(manifest);

    await waitFor(() => expect(image()).not.toBeNull());
    fireEvent.error(image() as HTMLImageElement);

    expect(image()).toBeNull();
    expect(screen.getByRole("img", { name: "Field Dressing" })).toHaveTextContent("FD");
  });
});
