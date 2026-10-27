import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { damageFile } from "../fixtures/gameData";
import { indexRules } from "../logic/ruleFilters";
import { ROW_HEIGHT, RulesTable } from "./RulesTable";

const rows = indexRules(damageFile.rules);
const fileOrder = { key: "file", descending: false } as const;

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole("row").slice(1);
}

describe("RulesTable", () => {
  it("renders only the rows in view plus a buffer", () => {
    render(<RulesTable rows={rows} sort={fileOrder} onSortChange={() => {}} applying={null} />);
    const rendered = bodyRows();
    expect(rendered.length).toBeLessThan(rows.length);
    expect(within(rendered[0]!).getAllByRole("cell")[0]).toHaveTextContent("0");
    expect(screen.getByRole("table")).toHaveAttribute("aria-rowcount", String(rows.length + 1));
  });

  it("moves the window when scrolled", () => {
    render(<RulesTable rows={rows} sort={fileOrder} onSortChange={() => {}} applying={null} />);
    const table = screen.getByRole("table");
    table.scrollTop = 60 * ROW_HEIGHT;
    fireEvent.scroll(table);
    const rendered = bodyRows();
    expect(within(rendered[0]!).getAllByRole("cell")[0]).toHaveTextContent("50");
    expect(rendered[0]).toHaveAttribute("aria-rowindex", "52");
  });

  it("toggles sorting from the column headers", () => {
    const onSortChange = vi.fn();
    render(
      <RulesTable
        rows={rows}
        sort={{ key: "amount", descending: false }}
        onSortChange={onSortChange}
        applying={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Amount/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "amount", descending: true });
    fireEvent.click(screen.getByRole("button", { name: /Entity/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "entity", descending: false });
  });

  it("marks rows when a hit is described", () => {
    render(<RulesTable rows={rows.slice(0, 3)} sort={fileOrder} onSortChange={() => {}} applying={new Set([1])} />);
    const [first, second] = bodyRows();
    expect(first).toHaveAttribute("data-applies", "false");
    expect(within(first!).getByText("No")).toBeInTheDocument();
    expect(second).toHaveAttribute("data-applies", "true");
    expect(within(second!).getByText("Applies")).toBeInTheDocument();
  });
});
