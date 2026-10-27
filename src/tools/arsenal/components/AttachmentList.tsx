import { Badge, formatCash, ItemIcon } from "@/ui";
import type { AttachmentSlot, BuiltInPart } from "../logic/weaponDetail";
import { formatModifiers, summarizeModifiers } from "./formatValue";
import styles from "./WeaponDetail.module.css";

export interface AttachmentListProps {
  slots: readonly AttachmentSlot[];
  builtIns: readonly BuiltInPart[];
}

export function AttachmentList({ slots, builtIns }: AttachmentListProps) {
  return (
    <div className={styles.attachments}>
      {slots.map((slot) => (
        <section key={slot.slot} aria-label={`${slot.slot} slot`} className={styles.slot}>
          <h4 className={styles.slotName}>{slot.slot}</h4>
          {slot.attachments.length === 0 ? (
            <p className={styles.muted}>Nothing fits this slot</p>
          ) : (
            <ul className={styles.attachmentList}>
              {slot.attachments.map((attachment) => (
                <li key={attachment.id} className={styles.attachment}>
                  <ItemIcon icon={attachment.icon} name={attachment.name} size={32} />
                  <span className={styles.attachmentText}>
                    <span className={styles.attachmentName}>
                      {attachment.name}
                      {attachment.isDefault && <Badge>Default</Badge>}
                    </span>
                    <span className={styles.muted} title={formatModifiers(attachment.modifiers)}>
                      {summarizeModifiers(attachment.modifiers)}
                    </span>
                  </span>
                  <span className={styles.price}>{formatCash(attachment.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {builtIns.length > 0 && (
        <section aria-label="Built-in parts" className={styles.slot}>
          <h4 className={styles.slotName}>Built-in parts</h4>
          <ul className={styles.attachmentList}>
            {builtIns.map((part) => (
              <li key={`${part.slot}-${part.id}`} className={styles.builtIn}>
                <span className={styles.attachmentText}>
                  <span className={styles.attachmentName}>
                    {part.name} <span className={styles.muted}>({part.slot})</span>
                  </span>
                  <span className={styles.muted} title={formatModifiers(part.modifiers)}>
                    {summarizeModifiers(part.modifiers)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
