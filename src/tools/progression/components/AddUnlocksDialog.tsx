import { useMemo, useState } from "react";
import { sameId, type Catalog } from "@/core/catalog";
import type { Role } from "@/core/data";
import type { WeaponIndex } from "@/core/weapons";
import { Button, Checkbox, ComboBox, Dialog, ItemIcon, NumberField, OptionContent, Select } from "@/ui";
import { gateLabel, goalsForRoleUpTo, goalsForWeapon, isCareerGate, type GatedItem } from "../model/goals";
import { MAX_ROLE_LEVEL } from "../model/progress";
import styles from "./AddUnlocksDialog.module.css";
import { unlockText } from "./unlockText";

export interface AddUnlocksDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  gated: readonly GatedItem[];
  roles: readonly Role[];
  catalog: Catalog;
  weaponIndex: WeaponIndex;
  goalIds: readonly string[];
  onAdd: (itemIds: string[]) => void;
}

interface RoleGroup {
  key: string;
  label: string;
  career: boolean;
  entries: GatedItem[];
}

function groupByGate(gated: readonly GatedItem[], roles: readonly Role[]): RoleGroup[] {
  const groups: RoleGroup[] = roles.map((role) => ({ key: role.id, label: "", career: false, entries: [] }));
  for (const entry of gated) {
    let group = groups.find((candidate) => sameId(candidate.key, entry.unlock.role));
    if (group === undefined) {
      group = { key: entry.unlock.role, label: "", career: isCareerGate(entry.unlock, roles), entries: [] };
      groups.push(group);
    }
    group.label = gateLabel(entry.unlock, roles);
    group.entries.push(entry);
  }
  return groups.filter((group) => group.entries.length > 0);
}

function matchesSearch(entry: GatedItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  return query === "" || entry.item.name.toLowerCase().includes(query);
}

export function AddUnlocksDialog({
  isOpen,
  onOpenChange,
  gated,
  roles,
  catalog,
  weaponIndex,
  goalIds,
  onAdd,
}: AddUnlocksDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [shortcutRole, setShortcutRole] = useState<string | null>(roles[0]?.id ?? null);
  const [shortcutLevel, setShortcutLevel] = useState(10);
  const [weaponId, setWeaponId] = useState<string | null>(null);

  const groups = useMemo(() => groupByGate(gated, roles), [gated, roles]);
  const weapons = useMemo(
    () => [...weaponIndex.playerWeapons].sort((a, b) => a.name.localeCompare(b.name)),
    [weaponIndex],
  );

  const isGoal = (id: string) => goalIds.some((goalId) => sameId(goalId, id));
  const isSelected = (id: string) => selected.some((selectedId) => sameId(selectedId, id));

  function select(ids: readonly string[]) {
    setSelected((current) => [
      ...current,
      ...ids.filter((id) => !isGoal(id) && !current.some((selectedId) => sameId(selectedId, id))),
    ]);
  }

  function toggle(id: string, on: boolean) {
    if (on) {
      select([id]);
    } else {
      setSelected((current) => current.filter((selectedId) => !sameId(selectedId, id)));
    }
  }

  function close() {
    setSelected([]);
    setSearch("");
    onOpenChange(false);
  }

  const weapon = weaponId === null ? undefined : weaponIndex.weapon(weaponId);

  return (
    <Dialog
      title="Add unlocks"
      size="lg"
      isOpen={isOpen}
      onOpenChange={(open) => (open ? onOpenChange(true) : close())}
      actions={
        <>
          <Button variant="ghost" onPress={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isDisabled={selected.length === 0}
            onPress={() => {
              onAdd(selected);
              close();
            }}
          >
            {`Add ${selected.length} ${selected.length === 1 ? "unlock" : "unlocks"}`}
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <div className={styles.shortcuts}>
          <div className={styles.shortcut}>
            <Select
              label="Role"
              items={roles}
              getKey={(role) => role.id}
              getLabel={(role) => catalog.roleLabel(role.id)}
              selectedKey={shortcutRole}
              onSelectionChange={(key) => setShortcutRole(key)}
            />
            <NumberField
              label="Up to level"
              minValue={0}
              maxValue={MAX_ROLE_LEVEL}
              value={shortcutLevel}
              onChange={(value) => setShortcutLevel(Number.isNaN(value) ? 0 : value)}
            />
            <Button
              isDisabled={shortcutRole === null}
              onPress={() => shortcutRole !== null && select(goalsForRoleUpTo(gated, shortcutRole, shortcutLevel))}
            >
              {`Everything up to level ${shortcutLevel}`}
            </Button>
          </div>
          <div className={styles.shortcut}>
            <ComboBox
              label="Weapon"
              items={weapons}
              getKey={(entry) => entry.id}
              getLabel={(entry) => entry.name}
              getGroup={(entry) => entry.archetype?.label ?? "Other"}
              renderOption={(entry) => (
                <OptionContent
                  label={entry.name}
                  secondary={entry.unlock === null ? undefined : `${entry.unlock.roleLabel} ${entry.unlock.level}`}
                />
              )}
              selectedKey={weaponId}
              onSelectionChange={(key) => setWeaponId(key)}
              placeholder="Search weapons"
            />
            <Button
              isDisabled={weapon === undefined}
              onPress={() => weapon !== undefined && select(goalsForWeapon(weapon, weaponIndex, gated))}
            >
              Everything for this weapon
            </Button>
          </div>
        </div>
        <label className={styles.search}>
          <span className={styles.searchLabel}>Search unlocks</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Item name"
            className={styles.searchInput}
          />
        </label>
        <div className={styles.groups}>
          {groups.map((group) => {
            const entries = group.entries.filter((entry) => matchesSearch(entry, search));
            if (entries.length === 0) {
              return null;
            }
            return (
              <section key={group.key} className={styles.group} aria-label={group.label}>
                <h3 className={styles.groupTitle}>
                  {group.label}
                  {group.career && <span className={styles.groupNote}>career level</span>}
                </h3>
                <ul className={styles.list}>
                  {entries.map((entry) => {
                    const alreadyGoal = isGoal(entry.item.id);
                    return (
                      <li key={entry.item.id}>
                        <Checkbox
                          className={styles.option}
                          isSelected={alreadyGoal || isSelected(entry.item.id)}
                          isDisabled={alreadyGoal}
                          onChange={(on) => toggle(entry.item.id, on)}
                        >
                          <ItemIcon icon={entry.item.icon} name={entry.item.name} size={36} />
                          <span className={styles.optionText}>
                            <span className={styles.optionName}>{entry.item.name}</span>
                            <span className={styles.optionMeta}>
                              {alreadyGoal ? `${unlockText(entry)} · In goals` : unlockText(entry)}
                            </span>
                          </span>
                        </Checkbox>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
