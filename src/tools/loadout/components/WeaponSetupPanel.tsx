import { useMemo, useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { sameId, type Catalog } from "@/core/catalog";
import type { ModifierSource } from "@/core/modifiers";
import type { PlayerWeapon, WeaponIndex } from "@/core/weapons";
import { Button, formatCash, Panel } from "@/ui";
import { WeaponSetup } from "../model/loadout";
import { attachmentSlots, builtInParts, hasMagazines, setupCost, setupStats, statRows } from "../model/weaponSetup";
import { AttachmentSlotPicker } from "./AttachmentSlotPicker";
import { LooseAmmoPicker } from "./LooseAmmoPicker";
import { MagazinePicker } from "./MagazinePicker";
import { modifierSummary } from "./modifierText";
import { SheetRow, SheetRows } from "./Sheet";
import { WeaponStatsTable } from "./WeaponStatsTable";
import styles from "./WeaponSetupPanel.module.css";

export interface WeaponSetupPanelProps {
  slotLabel: string;
  weapon: PlayerWeapon;
  setup: WeaponSetup;
  index: WeaponIndex;
  catalog: Catalog;
  kitSources: readonly ModifierSource[];
  onChange: (setup: WeaponSetup) => void;
  onClose: () => void;
}

function withAttachment(setup: WeaponSetup, slot: string, attachmentId: string | null): WeaponSetup {
  const attachments = Object.fromEntries(Object.entries(setup.attachments).filter(([key]) => !sameId(key, slot)));
  return { ...setup, attachments: attachmentId === null ? attachments : { ...attachments, [slot]: attachmentId } };
}

export function WeaponSetupPanel({
  slotLabel,
  weapon,
  setup,
  index,
  catalog,
  kitSources,
  onChange,
  onClose,
}: WeaponSetupPanelProps) {
  const [includeEffects, setIncludeEffects] = useState(true);
  const rows = useMemo(
    () => statRows(setupStats(weapon, setup, index, includeEffects ? kitSources : [])),
    [weapon, setup, index, includeEffects, kitSources],
  );
  const builtIn = builtInParts(weapon, index);
  const slots = attachmentSlots(weapon);
  const magazineFed = hasMagazines(weapon, index);

  return (
    <ModalOverlay
      isOpen
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className={styles.overlay}
    >
      <Modal className={styles.panel}>
        <Dialog className={styles.dialog} aria-label={`Customize ${weapon.name}`}>
          <header className={styles.header}>
            <div className={styles.heading}>
              <span className={styles.slot}>{slotLabel}</span>
              <Heading slot="title" className={styles.title}>
                {weapon.name}
              </Heading>
            </div>
            <Button size="sm" variant="ghost" onPress={onClose}>
              Close
            </Button>
          </header>
          <div className={styles.body}>
            <Panel title="Attachments" headingLevel={3}>
              <div className={styles.stack}>
                {slots.length === 0 ? (
                  <p className={styles.note}>This weapon has no attachment slots.</p>
                ) : (
                  slots.map((slot) => (
                    <AttachmentSlotPicker
                      key={slot.slot}
                      slot={slot.slot}
                      label={slot.slot}
                      options={index.slotOptions(weapon, slot.slot)}
                      defaultId={slot.default ?? null}
                      selectedId={
                        Object.entries(setup.attachments).find(([key]) => sameId(key, slot.slot))?.[1] ?? null
                      }
                      catalog={catalog}
                      onChange={(attachmentId) => onChange(withAttachment(setup, slot.slot, attachmentId))}
                    />
                  ))
                )}
                {builtIn.length > 0 && (
                  <div className={styles.builtIn}>
                    <h4 className={styles.subTitle}>Built in</h4>
                    <ul className={styles.builtInList}>
                      {builtIn.map((part) => (
                        <li key={part.slot} className={styles.builtInItem}>
                          <span className={styles.builtInName}>
                            {catalog.item(part.attachment.id)?.name ?? part.attachment.name ?? part.attachment.id}
                          </span>
                          <span className={styles.note}>{modifierSummary(part.attachment)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Panel>
            {magazineFed && (
              <Panel title="Magazines" headingLevel={3}>
                <div className={styles.stack}>
                  <MagazinePicker
                    options={index.magazineOptions(weapon)}
                    value={setup.magazine}
                    catalog={catalog}
                    onChange={(magazine) => onChange({ ...setup, magazine })}
                  />
                </div>
              </Panel>
            )}
            <Panel title={magazineFed ? "Loose ammo" : "Ammunition"} headingLevel={3}>
              <div className={styles.stack}>
                <LooseAmmoPicker
                  options={index.ammoOptions(weapon)}
                  value={setup.looseAmmo}
                  catalog={catalog}
                  onChange={(looseAmmo) => onChange({ ...setup, looseAmmo })}
                />
              </div>
            </Panel>
            <Panel title="Stats" headingLevel={3}>
              <div className={styles.stack}>
                <WeaponStatsTable
                  rows={rows}
                  includeEffects={includeEffects}
                  onIncludeEffectsChange={setIncludeEffects}
                  effectSources={kitSources.map((source) => source.label)}
                />
              </div>
            </Panel>
          </div>
          <footer className={styles.footer}>
            <SheetRows label="Setup cost">
              <SheetRow label="Weapon and setup" value={formatCash(setupCost(setup, catalog))} total />
            </SheetRows>
            <Button variant="ghost" onPress={() => onChange(WeaponSetup.parse({ itemId: setup.itemId }))}>
              Reset to bare
            </Button>
          </footer>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
