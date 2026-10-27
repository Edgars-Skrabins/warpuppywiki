import { sameId, type Catalog } from "@/core/catalog";
import type { Attachment } from "@/core/data";
import { Badge, formatCash, formatWeight, Select } from "@/ui";
import { modifierSummary } from "./modifierText";
import styles from "./SetupPickers.module.css";

const NONE_KEY = "none";

interface SlotChoice {
  key: string;
  label: string;
  attachment: Attachment | null;
  isDefault: boolean;
}

export interface AttachmentSlotPickerProps {
  slot: string;
  label: string;
  options: readonly Attachment[];
  defaultId: string | null;
  selectedId: string | null;
  catalog: Catalog;
  onChange: (attachmentId: string | null) => void;
}

export function AttachmentSlotPicker({
  slot,
  label,
  options,
  defaultId,
  selectedId,
  catalog,
  onChange,
}: AttachmentSlotPickerProps) {
  const defaultOption = defaultId === null ? undefined : options.find((option) => sameId(option.id, defaultId));
  const choices: SlotChoice[] = [
    ...(defaultOption === undefined ? [{ key: NONE_KEY, label: "None", attachment: null, isDefault: false }] : []),
    ...options.map((attachment) => ({
      key: attachment.id,
      label: catalog.item(attachment.id)?.name ?? attachment.name ?? attachment.id,
      attachment,
      isDefault: defaultOption !== undefined && sameId(attachment.id, defaultOption.id),
    })),
  ];
  const selected =
    choices.find((choice) => selectedId !== null && sameId(choice.key, selectedId)) ??
    choices.find((choice) => choice.isDefault) ??
    choices[0];

  return (
    <Select
      label={label}
      items={choices}
      getKey={(choice) => choice.key}
      getLabel={(choice) => (choice.isDefault ? `${choice.label} (Default)` : choice.label)}
      selectedKey={selected?.key ?? null}
      onSelectionChange={(_key, choice) => {
        if (choice === null) return;
        onChange(choice.attachment === null || choice.isDefault ? null : choice.attachment.id);
      }}
      renderOption={(choice) => {
        const item = choice.attachment === null ? undefined : catalog.item(choice.attachment.id);
        const price = item === undefined ? null : catalog.price(item.id);
        const effects = choice.attachment === null ? "" : modifierSummary(choice.attachment);
        return (
          <span className={styles.option} data-slot={slot}>
            <span className={styles.optionHead}>
              <span className={styles.optionName}>{choice.label}</span>
              {choice.isDefault && <Badge>Default</Badge>}
            </span>
            {choice.attachment !== null && (
              <span className={styles.optionFacts}>
                <span>{price === null ? "Not sold in shop" : formatCash(price.price)}</span>
                <span>{item?.weight == null ? "Weight unknown" : formatWeight(item.weight)}</span>
                {effects !== "" && <span className={styles.effects}>{effects}</span>}
              </span>
            )}
          </span>
        );
      }}
    />
  );
}
