import { formatCash, formatNumber } from "@/ui";
import type { UnlockSummary as UnlockSummaryData } from "../model/totals";
import { SheetNote, SheetRow, SheetRows, SheetSection } from "./Sheet";
import styles from "./UnlockSummary.module.css";

export interface UnlockSummaryProps {
  unlocks: UnlockSummaryData;
}

export function UnlockSummary({ unlocks }: UnlockSummaryProps) {
  return (
    <SheetSection title="Unlocks needed">
      {unlocks.roles.length === 0 ? (
        <SheetNote>Nothing to unlock</SheetNote>
      ) : (
        <>
          {unlocks.roles.map((group) => (
            <div key={group.role} className={styles.role}>
              <p className={styles.roleHeader}>
                <span className={styles.roleName}>
                  {group.roleLabel} {group.highestLevel}
                </span>
                {group.xpRequired !== null && <span className={styles.xp}>{formatNumber(group.xpRequired)} XP</span>}
              </p>
              <SheetRows label={`${group.roleLabel} unlocks`}>
                {group.rows.map((row) => (
                  <SheetRow
                    key={row.item.id}
                    label={
                      <span>
                        {row.item.name} <span className={styles.level}>Lv {row.unlock.level}</span>
                      </span>
                    }
                    value={formatCash(row.unlock.cost)}
                  />
                ))}
              </SheetRows>
            </div>
          ))}
          <SheetRows label="Unlock total">
            <SheetRow label="Total unlock cash" value={formatCash(unlocks.totalCost)} total />
          </SheetRows>
          <SheetNote>Unlocks are paid once and are not part of the purchase total.</SheetNote>
        </>
      )}
    </SheetSection>
  );
}
