import type { Catalog, PriceInfo } from "@/core/catalog";
import {
  Badge,
  DataTable,
  Dialog,
  EMPTY_VALUE,
  formatCash,
  formatNumber,
  formatWeight,
  ItemIcon,
  Panel,
  StatRow,
  type Column,
} from "@/ui";
import { Link } from "react-router";
import { categoryLabel } from "../logic/itemCategory";
import { itemName, NON_PLAYER_LABELS, unitPriceOf, type ItemEntry } from "../logic/itemEntries";
import { toolLinkFor } from "../logic/toolLinks";
import { variationLabel } from "../logic/variationLabel";
import { TagChips } from "./TagChips";
import styles from "./ItemDrawer.module.css";

interface ItemDrawerProps {
  entry: ItemEntry;
  catalog: Catalog;
  onClose: () => void;
}

interface VariationRow {
  tag: string;
  label: string;
  price: PriceInfo;
}

const VARIATION_COLUMNS: readonly Column<VariationRow>[] = [
  { key: "label", header: "Variation", value: (row) => row.label },
  { key: "price", header: "Price", value: (row) => row.price.price, render: (row) => formatCash(row.price.price) },
  { key: "amount", header: "Lot", value: (row) => row.price.amount },
  {
    key: "unitPrice",
    header: "Unit price",
    value: (row) => unitPriceOf(row.price),
    render: (row) => formatCash(unitPriceOf(row.price)),
  },
];

function shopRows({ item, price }: ItemEntry, catalog: Catalog): VariationRow[] {
  const sold = catalog.variations(item);
  const rows = sold.length > 0 || price === null ? sold : [{ tag: item.id, price }];
  return rows.map((row) => ({ ...row, label: variationLabel(row.tag, catalog.item(row.price.soldWith) ?? item) }));
}

export function ItemDrawer({ entry, catalog, onClose }: ItemDrawerProps) {
  const { item, category, unlock, nonPlayer } = entry;
  const variations = shopRows(entry, catalog);
  const link = toolLinkFor(item, category);
  const [width, height] = item.grid;

  return (
    <Dialog title={itemName(item)} size="lg" isOpen onOpenChange={(open) => !open && onClose()}>
      <div className={styles.drawer}>
        <div className={styles.hero}>
          <ItemIcon icon={item.icon} name={itemName(item)} size={160} shape="wide" className={styles.icon} />
        </div>
        <div className={styles.heading}>
          {item.subtitle && <p className={styles.subtitle}>{item.subtitle}</p>}
          <div className={styles.badges}>
            <Badge>{categoryLabel(category)}</Badge>
            {nonPlayer && <Badge tone="warning">{NON_PLAYER_LABELS[nonPlayer]}</Badge>}
          </div>
        </div>
        {item.description && <p className={styles.description}>{item.description}</p>}
        {link && (
          <Link to={link.to} className={styles.link}>
            {link.label}
          </Link>
        )}

        <Panel title="Shop" headingLevel={3}>
          {variations.length > 0 ? (
            <DataTable
              aria-label="Shop variations"
              columns={VARIATION_COLUMNS}
              rows={variations}
              getRowKey={(row) => row.tag}
              emptyText="Not sold in shop"
              maxHeight="none"
            />
          ) : (
            <p className={styles.muted}>Not sold in shop</p>
          )}
        </Panel>

        <div className={styles.columns}>
          <Panel title="Unlock" headingLevel={3}>
            {unlock ? (
              <>
                <StatRow label="Role" value={unlock.roleLabel} />
                <StatRow label="Level" value={formatNumber(unlock.level)} />
                <StatRow label="Cost" value={formatCash(unlock.cost, { zeroAsFree: true })} />
                <StatRow
                  label="XP"
                  value={unlock.xpRequired === null ? EMPTY_VALUE : formatNumber(unlock.xpRequired)}
                />
              </>
            ) : (
              <p className={styles.muted}>No unlock required</p>
            )}
          </Panel>
          <Panel title="Details" headingLevel={3}>
            <StatRow label="Grid size" value={`${width} × ${height}`} unit="cells" />
            <StatRow label="Max stack" value={formatNumber(item.maxStack)} />
            <StatRow label="Weight" value={formatWeight(item.weight)} />
            <StatRow label="Durability" value={formatNumber(item.durability)} />
          </Panel>
        </div>

        {item.tags.length > 0 && (
          <Panel title="Tags" headingLevel={3}>
            <TagChips tags={item.tags} catalog={catalog} />
          </Panel>
        )}
        <p className={styles.id}>{item.id}</p>
      </div>
    </Dialog>
  );
}
