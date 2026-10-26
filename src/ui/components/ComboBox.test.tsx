import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { ComboBox, OptionContent } from "./ComboBox";

interface Weapon {
  id: string;
  name: string;
  category: string;
  caliber: string;
}

const weapons: Weapon[] = [
  { id: "ak74", name: "AK-74", category: "Assault rifles", caliber: "5.45x39" },
  { id: "m4a1", name: "M4A1", category: "Assault rifles", caliber: "5.56x45" },
  { id: "mp5", name: "MP5", category: "SMGs", caliber: "9x19" },
  { id: "pkm", name: "PKM", category: "Machine guns", caliber: "7.62x54R" },
];

function Picker({
  onSelectionChange,
  grouped = false,
  searchCaliber = false,
}: {
  onSelectionChange?: (key: string | null) => void;
  grouped?: boolean;
  searchCaliber?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <ComboBox
      label="Weapon"
      items={weapons}
      getKey={(weapon) => weapon.id}
      getLabel={(weapon) => weapon.name}
      getSearchText={searchCaliber ? (weapon) => `${weapon.name} ${weapon.caliber}` : undefined}
      getGroup={grouped ? (weapon) => weapon.category : undefined}
      renderOption={(weapon) => <OptionContent label={weapon.name} secondary={weapon.caliber} />}
      selectedKey={selected}
      onSelectionChange={(key) => {
        setSelected(key);
        onSelectionChange?.(key);
      }}
      placeholder="Search weapons"
    />
  );
}

afterEach(() => {
  cleanup();
});

function optionNames(): string[] {
  return within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

describe("ComboBox", () => {
  it("filters options by a case-insensitive substring", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.type(screen.getByRole("combobox", { name: "Weapon" }), "m");
    expect(optionNames()).toEqual(["M4A15.56x45", "MP59x19", "PKM7.62x54R"]);
    await user.type(screen.getByRole("combobox"), "P");
    expect(optionNames()).toEqual(["MP59x19"]);
  });

  it("searches the custom search text", async () => {
    const user = userEvent.setup();
    render(<Picker searchCaliber />);
    await user.type(screen.getByRole("combobox"), "x39");
    expect(optionNames()).toEqual(["AK-745.45x39"]);
  });

  it("shows the empty text when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("selects an option with the keyboard", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<Picker onSelectionChange={onSelectionChange} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "mp");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelectionChange).toHaveBeenCalledWith("mp5");
    expect(input).toHaveValue("MP5");
  });

  it("shows every option again when reopened from the button after a selection", async () => {
    const user = userEvent.setup();
    render(<Picker />);
    await user.type(screen.getByRole("combobox"), "pkm");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.click(screen.getByRole("button"));
    expect(optionNames()).toHaveLength(weapons.length);
  });

  it("renders group headers", async () => {
    const user = userEvent.setup();
    render(<Picker grouped />);
    await user.click(screen.getByRole("button"));
    const groups = within(screen.getByRole("listbox")).getAllByRole("group");
    expect(groups).toHaveLength(3);
    expect(screen.getByText("Assault rifles")).toBeInTheDocument();
    expect(screen.getByText("SMGs")).toBeInTheDocument();
    expect(screen.getByText("Machine guns")).toBeInTheDocument();
    expect(within(groups[0]!).getAllByRole("option")).toHaveLength(2);
  });

  it("hides groups without matches", async () => {
    const user = userEvent.setup();
    render(<Picker grouped />);
    await user.type(screen.getByRole("combobox"), "pkm");
    expect(within(screen.getByRole("listbox")).getAllByRole("group")).toHaveLength(1);
    expect(screen.getByText("Machine guns")).toBeInTheDocument();
  });
});
