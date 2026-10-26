import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

interface Weapon {
  id: string;
  name: string;
  rpm: number | null;
}

const weapons: Weapon[] = [
  { id: "mp5", name: "MP5", rpm: 800 },
  { id: "bow", name: "Bow", rpm: null },
  { id: "ak74", name: "AK-74", rpm: 650 },
  { id: "pkm", name: "PKM", rpm: 700 },
];

const columns: Column<Weapon>[] = [
  { key: "name", header: "Name", value: (weapon) => weapon.name, sortable: true },
  { key: "rpm", header: "RPM", value: (weapon) => weapon.rpm, sortable: true, betterWhen: "higher" },
];

afterEach(() => {
  cleanup();
});

function firstColumn(): string[] {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByRole("rowheader").textContent ?? "");
}

function renderTable(props: Partial<Parameters<typeof DataTable<Weapon>>[0]> = {}) {
  return render(
    <DataTable
      aria-label="Weapons"
      columns={columns}
      rows={weapons}
      getRowKey={(weapon) => weapon.id}
      emptyText="No weapons"
      {...props}
    />,
  );
}

describe("DataTable", () => {
  it("keeps the given order without a sort", () => {
    renderTable();
    expect(firstColumn()).toEqual(["MP5", "Bow", "AK-74", "PKM"]);
  });

  it("sorts ascending then descending when a sortable header is clicked", async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));
    expect(firstColumn()).toEqual(["AK-74", "Bow", "MP5", "PKM"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));
    expect(firstColumn()).toEqual(["PKM", "MP5", "Bow", "AK-74"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "descending");
  });

  it("sorts null values last in both directions", async () => {
    const user = userEvent.setup();
    renderTable();
    await user.click(screen.getByRole("columnheader", { name: /RPM/ }));
    expect(firstColumn()).toEqual(["AK-74", "PKM", "MP5", "Bow"]);
    await user.click(screen.getByRole("columnheader", { name: /RPM/ }));
    expect(firstColumn()).toEqual(["MP5", "PKM", "AK-74", "Bow"]);
  });

  it("applies the initial sort", () => {
    renderTable({ initialSort: { column: "rpm", direction: "descending" } });
    expect(firstColumn()).toEqual(["MP5", "PKM", "AK-74", "Bow"]);
  });

  it("shows a dash for null values and right-aligns numbers", () => {
    renderTable();
    const bowRow = screen.getByRole("row", { name: /Bow/ });
    const rpmCell = within(bowRow).getByRole("gridcell");
    expect(rpmCell).toHaveTextContent("—");
    expect(within(screen.getByRole("row", { name: /MP5/ })).getByRole("gridcell")).toHaveTextContent("800");
  });

  it("shows the empty text when there are no rows", () => {
    renderTable({ rows: [] });
    expect(screen.getByText("No weapons")).toBeInTheDocument();
  });

  it("calls onRowClick with the clicked row", async () => {
    const onRowClick = vi.fn();
    const user = userEvent.setup();
    renderTable({ onRowClick });
    await user.click(screen.getByText("PKM"));
    expect(onRowClick).toHaveBeenCalledWith(weapons[3]);
  });
});
