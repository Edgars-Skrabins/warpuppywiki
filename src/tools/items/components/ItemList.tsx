import { DataTable, EMPTY_VALUE, formatCash, formatNumber, formatWeight, ItemIcon, type Column } from "@/ui";
import { categoryLabel } from "../logic/itemCategory";
import { itemName, unitPriceOf, unlockText, type ItemEntry } from "../logic/itemEntries";
import styles from "./ItemList.module.css";

interface ItemListProps {
  entries: readonly ItemEntry[];
  onOpen: (id: string) => void;
}

function lotUnitPrice(entry: ItemEntry): number | null {
  return entry.price !== null && entry.price.amount > 1 ? unitPriceOf(entry.price) : null;
}

function gridSize(entry: ItemEntry): string {
  const [width, height] = entry.item.grid;
  return `${width} × ${height}`;
}

const COLUMNS: readonly Column<ItemEntry>[] = [
  {
    key: "name",
    header: "Name",
    value: (entry) => itemName(entry.item),
    render: (entry) => (
      <span className={styles.nameCell}>
        <ItemIcon icon={entry.item.icon} name={itemName(entry.item)} size={24} />
        <span className={styles.name}>{itemName(entry.item)}</span>
      </span>
    ),
    sortable: true,
  },
  { key: "category", header: "Category", value: (entry) => categoryLabel(entry.category), sortable: true },
  {
    key: "price",
    header: "Price",
    value: (entry) => entry.price?.price ?? null,
    render: (entry) => (entry.price ? formatCash(entry.price.price) : "Not sold"),
    align: "end",
    sortable: true,
  },
  {
    key: "unitPrice",
    header: "Unit price",
    value: lotUnitPrice,
    render: (entry) => {
      const unitPrice = lotUnitPrice(entry);
      return unitPrice === null ? EMPTY_VALUE : `${formatCash(unitPrice)} (${entry.price?.amount})`;
    },
    align: "end",
    sortable: true,
  },
  {
    key: "unlock",
    header: "Unlock",
    value: (entry) => (entry.unlock ? unlockText(entry.unlock) : null),
    sortable: true,
  },
  {
    key: "grid",
    header: "Size",
    value: (entry) => entry.item.grid[0] * entry.item.grid[1],
    render: gridSize,
    align: "end",
    sortable: true,
  },
  {
    key: "weight",
    header: "Weight",
    value: (entry) => entry.item.weight ?? null,
    render: (entry) => formatWeight(entry.item.weight),
    align: "end",
    sortable: true,
  },
  {
    key: "maxStack",
    header: "Max stack",
    value: (entry) => entry.item.maxStack,
    render: (entry) => formatNumber(entry.item.maxStack),
    align: "end",
    sortable: true,
  },
];

export function ItemList({ entries, onOpen }: ItemListProps) {
  return (
    <DataTable
      aria-label="Items"
      columns={COLUMNS}
      rows={entries}
      getRowKey={(entry) => entry.item.id}
      initialSort={{ column: "name", direction: "ascending" }}
      onRowClick={(entry) => onOpen(entry.item.id)}
      emptyText="No items match"
    />
  );
}
