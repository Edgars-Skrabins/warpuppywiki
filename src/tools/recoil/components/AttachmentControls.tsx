import type { CombineResult } from "@/core/modifiers";
import { sameId } from "@/core/catalog";
import type { EffectiveStats, PlayerWeapon, WeaponIndex } from "@/core/weapons";
import { Button, formatMultiplier, Select, Stack, Tooltip } from "@/ui";
import { recoilAttachmentOptions } from "../logic/recoilAttachments";
import { MAGAZINE_SLOT, selectedAttachmentId, type SlotSelections } from "../logic/weaponSetup";
import styles from "./AttachmentControls.module.css";

interface Choice {
  id: string;
  label: string;
}

const NONE: Choice = { id: "", label: "None" };

export interface AttachmentControlsProps {
  index: WeaponIndex;
  weapon: PlayerWeapon;
  selections: SlotSelections;
  stats: EffectiveStats;
  onSelectionChange: (slot: string, attachmentId: string | null) => void;
}

function Breakdown({ title, result }: { title: string; result: CombineResult }) {
  return (
    <div>
      <strong>
        {title} {formatMultiplier(result.value)}
      </strong>
      {result.steps.length === 0 ? (
        <div>No attachment changes it</div>
      ) : (
        <ul className={styles.steps}>
          {result.steps.map((step, position) => (
            <li key={`${step.source}-${position}`}>
              {step.source} → {formatMultiplier(step.after)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AttachmentControls({ index, weapon, selections, stats, onSelectionChange }: AttachmentControlsProps) {
  const magazines = index.magazineOptions(weapon).map((option) => ({
    id: option.attachment.id,
    label: option.attachment.name ?? option.item.name ?? option.attachment.id,
  }));
  const recoilSlots = weapon.visibleSlots
    .filter((slot) => !sameId(slot.slot, MAGAZINE_SLOT))
    .map((slot) => ({
      slot: slot.slot,
      options: recoilAttachmentOptions(index.slotOptions(weapon, slot.slot)).map((attachment) => ({
        id: attachment.id,
        label: attachment.name ?? attachment.id,
      })),
    }))
    .filter((slot) => slot.options.length > 0);
  const magazineId = selectedAttachmentId(weapon, MAGAZINE_SLOT, selections);

  return (
    <Stack gap={3}>
      {recoilSlots.map(({ slot, options }) => (
        <Select<Choice>
          key={slot}
          label={slot}
          items={[NONE, ...options]}
          getKey={(choice) => choice.id}
          getLabel={(choice) => choice.label}
          selectedKey={selectedAttachmentId(weapon, slot, selections) ?? NONE.id}
          onSelectionChange={(key) => onSelectionChange(slot, key === null || key === NONE.id ? null : key)}
        />
      ))}
      {magazines.length > 0 && (
        <Select<Choice>
          label="Magazine"
          items={magazines}
          getKey={(choice) => choice.id}
          getLabel={(choice) => choice.label}
          selectedKey={magazines.find((choice) => magazineId !== null && sameId(choice.id, magazineId))?.id ?? null}
          onSelectionChange={(key) => onSelectionChange(MAGAZINE_SLOT, key)}
        />
      )}
      <Tooltip
        content={
          <Stack gap={2}>
            <Breakdown title="Vertical" result={stats.verticalRecoil} />
            <Breakdown title="Horizontal" result={stats.horizontalRecoil} />
          </Stack>
        }
      >
        <Button variant="ghost" size="sm" className={styles.multipliers}>
          {`Vertical ${formatMultiplier(stats.verticalRecoil.value)}, Horizontal ${formatMultiplier(stats.horizontalRecoil.value)}`}
        </Button>
      </Tooltip>
    </Stack>
  );
}
