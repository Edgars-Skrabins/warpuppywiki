import { useMemo, useState } from "react";
import { Input, Label, SearchField, TextField } from "react-aria-components";
import type { Catalog } from "@/core/catalog";
import type { EquipmentFile } from "@/core/data";
import { Button, Dialog, EmptyState, formatCash, SegmentedControl } from "@/ui";
import { slotItemId } from "../model/loadout";
import { costSummary, weightSummary } from "../model/totals";
import { relativeTime } from "../saves/relativeTime";
import { displayName, MAX_NAME_LENGTH, type SavedEntry, type SavedLoadout } from "../saves/savedLoadouts";
import styles from "./MyLoadoutsDialog.module.css";

type LibrarySort = "updated" | "name";

const SORT_OPTIONS: { id: LibrarySort; label: string }[] = [
  { id: "updated", label: "Last updated" },
  { id: "name", label: "Name" },
];

function entryLabel(entry: SavedEntry): string {
  return entry.kind === "saved" ? displayName(entry.saved.name) : displayName(entry.name ?? "");
}

function sortedEntries(entries: readonly SavedEntry[], sort: LibrarySort, search: string): SavedEntry[] {
  const query = search.trim().toLowerCase();
  const filtered = entries.filter((entry) => query === "" || entryLabel(entry).toLowerCase().includes(query));
  return [...filtered].sort((a, b) => {
    if (sort === "name") {
      return entryLabel(a).localeCompare(entryLabel(b), "en-US", { sensitivity: "base" });
    }
    const timeA = a.kind === "saved" ? a.saved.updatedAt : "";
    const timeB = b.kind === "saved" ? b.saved.updatedAt : "";
    return timeB.localeCompare(timeA);
  });
}

interface SavedRowProps {
  saved: SavedLoadout;
  catalog: Catalog;
  equipment: EquipmentFile;
  now: Date;
  isCurrent: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

function SavedRow({
  saved,
  catalog,
  equipment,
  now,
  isCurrent,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
}: SavedRowProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const name = displayName(saved.name);
  const total = costSummary(saved.loadout, catalog).total;
  const weightClass = weightSummary(saved.loadout, catalog, equipment).weightClass?.name ?? "—";
  const primaryId = slotItemId(saved.loadout, "primary");
  const primary = primaryId === null ? "No primary" : (catalog.item(primaryId)?.name ?? "—");
  const commitRename = () => {
    if (renaming !== null) onRename(renaming);
    setRenaming(null);
  };

  return (
    <li className={styles.row} aria-label={name} data-current={isCurrent || undefined}>
      <div className={styles.main}>
        {renaming === null ? (
          <p className={styles.name}>{name}</p>
        ) : (
          <TextField
            value={renaming}
            onChange={setRenaming}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            className={styles.renameField}
          >
            <Label className={styles.visuallyHidden}>New name for {name}</Label>
            <Input
              className={styles.input}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitRename();
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setRenaming(null);
                }
              }}
            />
          </TextField>
        )}
        <p className={styles.facts}>
          <span>{formatCash(total)}</span>
          <span>{weightClass}</span>
          <span>{primary}</span>
          <span>Updated {relativeTime(new Date(saved.updatedAt), now)}</span>
        </p>
      </div>
      <div className={styles.actions}>
        {renaming === null ? (
          <>
            <Button size="sm" variant="primary" onPress={onOpen} aria-label={`Open ${name}`}>
              Open
            </Button>
            <Button size="sm" onPress={onDuplicate} aria-label={`Duplicate ${name}`}>
              Duplicate
            </Button>
            <Button size="sm" onPress={() => setRenaming(saved.name)} aria-label={`Rename ${name}`}>
              Rename
            </Button>
            <Button size="sm" variant="ghost" onPress={onDelete} aria-label={`Delete ${name}`}>
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="primary" onPress={commitRename}>
              Save name
            </Button>
            <Button size="sm" variant="ghost" onPress={() => setRenaming(null)}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export interface MyLoadoutsDialogProps {
  entries: readonly SavedEntry[];
  catalog: Catalog;
  equipment: EquipmentFile;
  currentId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onOpenLoadout: (saved: SavedLoadout) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (key: string) => void;
}

export function MyLoadoutsDialog({
  entries,
  catalog,
  equipment,
  currentId,
  isOpen,
  onOpenChange,
  onOpenLoadout,
  onDuplicate,
  onRename,
  onDelete,
}: MyLoadoutsDialogProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<LibrarySort>("updated");
  const [deleting, setDeleting] = useState<SavedEntry | null>(null);
  const shown = useMemo(() => sortedEntries(entries, sort, search), [entries, sort, search]);
  const now = new Date();

  return (
    <>
      <Dialog title="My loadouts" size="lg" isOpen={isOpen} onOpenChange={onOpenChange}>
        {entries.length === 0 ? (
          <EmptyState title="No saved loadouts yet" text="Build one and press Save." />
        ) : (
          <>
            <div className={styles.controls}>
              <SearchField value={search} onChange={setSearch} className={styles.search}>
                <Label className={styles.label}>Search</Label>
                <Input className={styles.input} placeholder="Loadout name" />
              </SearchField>
              <div className={styles.sort}>
                <span className={styles.label} aria-hidden="true">
                  Sort by
                </span>
                <SegmentedControl
                  aria-label="Sort by"
                  size="sm"
                  options={SORT_OPTIONS}
                  value={sort}
                  onChange={setSort}
                />
              </div>
            </div>
            {shown.length === 0 ? (
              <p className={styles.muted}>No saved loadout matches</p>
            ) : (
              <ul className={styles.list} aria-label="Saved loadouts">
                {shown.map((entry) =>
                  entry.kind === "saved" ? (
                    <SavedRow
                      key={entry.key}
                      saved={entry.saved}
                      catalog={catalog}
                      equipment={equipment}
                      now={now}
                      isCurrent={entry.saved.id === currentId}
                      onOpen={() => onOpenLoadout(entry.saved)}
                      onDuplicate={() => onDuplicate(entry.saved.id)}
                      onRename={(name) => onRename(entry.saved.id, name)}
                      onDelete={() => setDeleting(entry)}
                    />
                  ) : (
                    <li key={entry.key} className={styles.row} aria-label={entryLabel(entry)}>
                      <div className={styles.main}>
                        <p className={styles.name}>{entryLabel(entry)}</p>
                        <p className={styles.facts}>Can&apos;t open (from an older version)</p>
                      </div>
                      <div className={styles.actions}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => setDeleting(entry)}
                          aria-label={`Delete ${entryLabel(entry)}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
          </>
        )}
        <p className={styles.footer}>Saved loadouts are kept in this browser only.</p>
      </Dialog>
      <Dialog
        title="Delete loadout?"
        role="alertdialog"
        size="sm"
        isOpen={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        actions={(close) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                if (deleting !== null) onDelete(deleting.key);
                close();
              }}
            >
              Delete
            </Button>
          </>
        )}
      >
        <p>{deleting === null ? "" : `Delete '${entryLabel(deleting)}'? This can't be undone.`}</p>
      </Dialog>
    </>
  );
}
