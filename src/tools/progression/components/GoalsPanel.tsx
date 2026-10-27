import { useState } from "react";
import type { Catalog } from "@/core/catalog";
import type { Role } from "@/core/data";
import type { WeaponIndex } from "@/core/weapons";
import { Badge, Button, Checkbox, EmptyState, ItemIcon, Panel } from "@/ui";
import { gateLabel, type GatedItem } from "../model/goals";
import type { GoalStatus } from "../model/plan";
import { AddUnlocksDialog } from "./AddUnlocksDialog";
import styles from "./GoalsPanel.module.css";
import { unlockText } from "./unlockText";

export interface GoalsPanelProps {
  goals: readonly GoalStatus[];
  gated: readonly GatedItem[];
  roles: readonly Role[];
  catalog: Catalog;
  weaponIndex: WeaponIndex;
  onAdd: (itemIds: string[]) => void;
  onRemove: (itemId: string) => void;
  onUnlockedChange: (itemId: string, unlocked: boolean) => void;
  onClear: () => void;
}

export function GoalsPanel({
  goals,
  gated,
  roles,
  catalog,
  weaponIndex,
  onAdd,
  onRemove,
  onUnlockedChange,
  onClear,
}: GoalsPanelProps) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <Panel
      title="Goals"
      actions={
        <>
          <Button variant="primary" size="sm" onPress={() => setIsAdding(true)}>
            Add unlocks
          </Button>
          <Button variant="ghost" size="sm" isDisabled={goals.length === 0} onPress={onClear}>
            Clear goals
          </Button>
        </>
      }
    >
      {goals.length === 0 ? (
        <EmptyState title="No goals yet" text="Add the unlocks you want to see what they take." />
      ) : (
        <ul className={styles.list}>
          {goals.map((goal) => (
            <li key={goal.item.id} className={styles.goal}>
              <ItemIcon icon={goal.item.icon} name={goal.item.name} size={40} />
              <div className={styles.text}>
                <span className={styles.name}>{goal.item.name}</span>
                <span className={styles.meta}>
                  {gateLabel(goal.unlock, roles)} · {unlockText(goal)}
                </span>
              </div>
              <Badge tone={goal.reached ? "success" : "neutral"}>{goal.reached ? "Reached" : "Not reached"}</Badge>
              <Checkbox
                isSelected={goal.unlocked}
                isDisabled={!goal.reached}
                onChange={(unlocked) => onUnlockedChange(goal.item.id, unlocked)}
              >
                Unlocked
              </Checkbox>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${goal.item.name}`}
                onPress={() => onRemove(goal.item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AddUnlocksDialog
        isOpen={isAdding}
        onOpenChange={setIsAdding}
        gated={gated}
        roles={roles}
        catalog={catalog}
        weaponIndex={weaponIndex}
        goalIds={goals.map((goal) => goal.item.id)}
        onAdd={onAdd}
      />
    </Panel>
  );
}
