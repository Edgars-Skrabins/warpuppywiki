import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeTool, renderApp } from "../testing";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ToolPage", () => {
  it("renders the heading, summary and tool, and sets the document title", async () => {
    renderApp([fakeTool({ id: "map", name: "Map", category: "map", status: "beta" })], "/map");

    expect(screen.getByRole("heading", { level: 1, name: "Map" })).toBeInTheDocument();
    expect(screen.getByText("Map summary")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(await screen.findByText("Map content")).toBeInTheDocument();
    expect(document.title).toBe("Map · warpuppywiki");
  });

  it("marks an unreleased tool and explains it", async () => {
    renderApp(
      [fakeTool({ id: "skills", name: "Skill Trees", category: "progression", status: "unreleased" })],
      "/skills",
    );

    expect(screen.getByText("Not in game yet")).toBeInTheDocument();
    expect(screen.getByText(/isn't released in Wardogs yet/)).toBeInTheDocument();
    expect(await screen.findByText("Skill Trees content")).toBeInTheDocument();
  });

  it("contains a crashing tool and reloads it on request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let shouldThrow = true;
    function Crashing() {
      if (shouldThrow) {
        throw new Error("Weapon table exploded");
      }
      return <p>Recovered</p>;
    }
    renderApp([fakeTool({ id: "ttk", name: "TTK", category: "combat" }, Crashing)], "/ttk");

    expect(await screen.findByText("This tool hit an error")).toBeInTheDocument();
    expect(screen.getByText("Weapon table exploded")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "warpuppywiki home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tools/ })).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: "Reload tool" }));

    expect(await screen.findByText("Recovered")).toBeInTheDocument();
  });
});
