import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

afterEach(() => {
  cleanup();
});

describe("LoadingState", () => {
  it("announces loading with an accessible label", () => {
    render(<LoadingState label="Loading weapons" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading weapons");
  });
});

describe("EmptyState", () => {
  it("shows the title, text and action", () => {
    render(<EmptyState title="No results" text="Try another search." action={<Button>Clear filters</Button>} />);
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try another search.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("shows the title, text and details list", () => {
    render(
      <ErrorState
        title="Game data is invalid"
        text="Some files did not match the expected format."
        details={["items.json: expected number at [3].price", "tags.json: missing field id"]}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Game data is invalid")).toBeInTheDocument();
    expect(within(alert).getByText("Some files did not match the expected format.")).toBeInTheDocument();
    const items = within(alert).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "items.json: expected number at [3].price",
      "tags.json: missing field id",
    ]);
  });

  it("calls onRetry when the retry button is pressed", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState title="Could not load data" onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has no retry button or list without them", () => {
    render(<ErrorState title="Game data is missing" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
