import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureWith, renderWithData } from "@/core/data/testing";
import addedWeapon from "./fixtures/addedWeapon.json";
import oldItems from "./fixtures/oldItems.json";
import removedWeapon from "./fixtures/removedWeapon.json";
import Tool from "./Tool";

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

const fixtures = {
  "25677108/items.json": oldItems,
  "25677108/weapons.json": fixtureWith("25677108/weapons.json", "weapons", [removedWeapon]),
  "25937608/weapons.json": fixtureWith("25937608/weapons.json", "weapons", [addedWeapon]),
};

function renderTool(path = "/patches") {
  const router = createMemoryRouter([{ path: "/patches", element: <Tool /> }], { initialEntries: [path] });
  renderWithData(<RouterProvider router={router} />, { fixtures });
  return router;
}

function stubClipboard(clipboard: unknown) {
  Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
}

async function copyButton(scope: HTMLElement = document.body) {
  const button = await within(scope).findByRole("button", { name: "Copy as Markdown" });
  await vi.waitFor(() => expect(button).not.toBeDisabled(), { timeout: 5000 });
  return button;
}

describe("Patch Diff details", () => {
  it("opens an entity's change table with impact badges", async () => {
    const router = renderTool("/patches?c=weapons");
    const list = await screen.findByRole("list", { name: "Weapons" });
    await userEvent.click(within(list).getByText("M4"));
    const table = await screen.findByRole("grid", { name: "Changes to M4" });
    const row = within(table).getByRole("row", { name: /Unlock level/ });
    expect(within(row).getByText("20")).toBeInTheDocument();
    expect(within(row).getByText("28")).toBeInTheDocument();
    expect(within(row).getByText("Nerf")).toBeInTheDocument();
    expect(router.state.location.search).toContain("e=weapon%3Aid.item.m4");
  });

  it("shows every field of an added entity", async () => {
    renderTool("/patches?c=weapons&e=weapon%3Aid.item.wepn_031");
    const table = await screen.findByRole("grid", { name: "Fields of PP-19 Bizon" });
    expect(within(table).getByRole("row", { name: /RPM/ })).toHaveTextContent("700");
  });

  it("lists a labelled change in the notable card and links to its detail", async () => {
    const router = renderTool();
    const card = await screen.findByRole("list", { name: "Notable changes" }, { timeout: 5000 });
    const line = within(card).getByRole("link", { name: "M4: Unlock level 20 → 28 (Nerf)" });
    await userEvent.click(line);
    expect(await screen.findByRole("grid", { name: "Changes to M4" })).toBeInTheDocument();
    expect(router.state.location.search).toContain("c=weapons");
  });

  it("copies the changes as Markdown", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard({ writeText });
    renderTool();
    await userEvent.click(await copyButton());
    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0]![0]).toMatch(/^## Wardogs data changes: build 25677108 → 25937608/);
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("opens a dialog with the text when the clipboard is unavailable", async () => {
    stubClipboard(undefined);
    renderTool("/patches?c=weapons");
    const panel = await screen.findByRole("region", { name: "Weapons" });
    await userEvent.click(await copyButton(panel));
    const dialog = await screen.findByRole("dialog", { name: "Copy as Markdown" });
    const text = within(dialog).getByRole("textbox", { name: "Markdown" });
    expect(text).toHaveAttribute("readonly");
    expect((text as HTMLTextAreaElement).value).toMatch(/^## Wardogs data changes[^\n]*\n\n### Weapons/);
  });
});
