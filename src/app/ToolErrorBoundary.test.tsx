import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToolErrorBoundary } from "./ToolErrorBoundary";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ToolErrorBoundary", () => {
  it("renders the fallback with the error and renders the children again after reset", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) {
        throw new Error("boom");
      }
      return <p>tool content</p>;
    }

    render(
      <ToolErrorBoundary
        fallback={(error, reset) => (
          <button type="button" onClick={reset}>
            reset {error.message}
          </button>
        )}
      >
        <Flaky />
      </ToolErrorBoundary>,
    );

    expect(screen.queryByText("tool content")).not.toBeInTheDocument();
    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: "reset boom" }));

    expect(screen.getByText("tool content")).toBeInTheDocument();
  });

  it("wraps thrown non-errors", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const thrown: unknown = "plain string";
    function Throws(): never {
      throw thrown;
    }

    render(
      <ToolErrorBoundary fallback={(error) => <p>{error.message}</p>}>
        <Throws />
      </ToolErrorBoundary>,
    );

    expect(screen.getByText("plain string")).toBeInTheDocument();
  });
});
