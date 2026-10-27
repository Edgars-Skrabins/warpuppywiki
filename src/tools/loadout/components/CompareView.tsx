import { useMemo, useState } from "react";
import type { UrlStateCodec } from "@/core/state";
import { Button, ComboBox, SegmentedControl, Select } from "@/ui";
import { compareLoadouts, type CompareModel, type CompareTarget, type CompareThreat } from "../compare/compareModel";
import { parseSideParam, resolveSide, sideParam, type SideContext, type SideSource } from "../compare/sideSource";
import { LethalityView, type Loadout } from "../model/loadout";
import { armorLevelChoices, bulletWeapons, isModeled, threatAmmo } from "../model/lethality";
import { ammoTypeLabel } from "../model/weaponSetup";
import type { SavedEntry, StoredEntries } from "../saves/savedLoadouts";
import type { CompareLink } from "../state";
import { CompareSection } from "./CompareSection";
import { CompareSidePicker } from "./CompareSidePicker";
import styles from "./Compare.module.css";

const DEFAULTS = LethalityView.parse({});

const TARGET_PLACEMENTS: { id: CompareTarget["placement"]; label: string }[] = [
  { id: "upper-chest", label: "Upper chest" },
  { id: "head", label: "Head" },
  { id: "mixed", label: "Mixed" },
];

const THREAT_PLACEMENTS: { id: CompareThreat["placement"]; label: string }[] = [
  { id: "upper-chest", label: "Upper chest" },
  { id: "head", label: "Head" },
];

export interface CompareViewProps {
  link: CompareLink;
  current: Loadout;
  stored: StoredEntries;
  entries: readonly SavedEntry[];
  model: CompareModel;
  codec: UrlStateCodec<Loadout>;
  defaultBudget: number;
  onLinkChange: (link: CompareLink) => void;
  onEdit: (source: SideSource) => void;
  onClose: () => void;
}

export function CompareView({
  link,
  current,
  stored,
  entries,
  model,
  codec,
  defaultBudget,
  onLinkChange,
  onEdit,
  onClose,
}: CompareViewProps) {
  const [target, setTarget] = useState<CompareTarget>({
    targetArmor: DEFAULTS.targetArmor,
    targetHelmet: DEFAULTS.targetHelmet,
    placement: DEFAULTS.placement,
  });
  const [threat, setThreat] = useState<CompareThreat>({
    weaponId: DEFAULTS.threatWeaponId,
    ammoType: DEFAULTS.threatAmmoType,
    placement: DEFAULTS.threatPlacement,
  });
  const keyA = sideParam(link.a);
  const keyB = sideParam(link.b);
  const [sideA, sideB] = useMemo(() => {
    const context: SideContext = { current, saved: stored, codec, defaultBudget };
    return [
      resolveSide(parseSideParam(keyA, { kind: "current" }), context),
      resolveSide(parseSideParam(keyB, { kind: "empty" }), context),
    ];
  }, [keyA, keyB, current, stored, codec, defaultBudget]);
  const loadoutA = sideA.ok ? sideA.loadout : null;
  const loadoutB = sideB.ok ? sideB.loadout : null;
  const sections = useMemo(
    () => (loadoutA === null || loadoutB === null ? [] : compareLoadouts(loadoutA, loadoutB, model, target, threat)),
    [loadoutA, loadoutB, model, target, threat],
  );
  const weapons = useMemo(() => bulletWeapons(model.index), [model]);
  const threatWeapon = model.index.weapon(threat.weaponId) ?? weapons[0];
  const ammoChoices = threatWeapon === undefined ? [] : model.index.ammoOptions(threatWeapon).filter(isModeled);
  const uniqueAmmo = ammoChoices.filter(
    (option, position) => ammoChoices.findIndex((other) => other.ammoType === option.ammoType) === position,
  );
  const selectedAmmo = threatWeapon === undefined ? null : threatAmmo(threatWeapon, model.index, threat.ammoType);

  return (
    <div className={styles.view}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>Compare loadouts</h2>
        <div className={styles.topActions}>
          <Button onPress={() => onLinkChange({ a: link.b, b: link.a })}>Swap sides</Button>
          <Button variant="ghost" onPress={onClose}>
            Back to builder
          </Button>
        </div>
      </div>
      <div className={styles.sides}>
        <CompareSidePicker
          side="A"
          source={link.a}
          resolved={sideA}
          entries={entries}
          codec={codec}
          onChange={(a) => onLinkChange({ ...link, a })}
          onEdit={() => onEdit(link.a)}
        />
        <CompareSidePicker
          side="B"
          source={link.b}
          resolved={sideB}
          entries={entries}
          codec={codec}
          onChange={(b) => onLinkChange({ ...link, b })}
          onEdit={() => onEdit(link.b)}
        />
      </div>
      <div className={styles.controls} aria-label="Lethality settings" role="group">
        <Select
          label="Target body armor"
          items={armorLevelChoices(model.equipment, "Armor")}
          getKey={(choice) => choice.key}
          getLabel={(choice) => choice.label}
          selectedKey={String(target.targetArmor)}
          onSelectionChange={(_key, choice) => {
            if (choice !== null) setTarget({ ...target, targetArmor: choice.level });
          }}
          className={styles.control}
        />
        <Select
          label="Target helmet"
          items={armorLevelChoices(model.equipment, "Helmet")}
          getKey={(choice) => choice.key}
          getLabel={(choice) => choice.label}
          selectedKey={String(target.targetHelmet)}
          onSelectionChange={(_key, choice) => {
            if (choice !== null) setTarget({ ...target, targetHelmet: choice.level });
          }}
          className={styles.control}
        />
        <div className={styles.field}>
          <span className={styles.label} aria-hidden="true">
            Shot placement
          </span>
          <SegmentedControl
            aria-label="Shot placement"
            size="sm"
            options={TARGET_PLACEMENTS}
            value={target.placement}
            onChange={(placement) => setTarget({ ...target, placement })}
          />
        </div>
        <ComboBox
          label="Threat weapon"
          items={weapons}
          getKey={(weapon) => weapon.id}
          getLabel={(weapon) => weapon.name}
          getGroup={(weapon) => weapon.archetype?.label ?? "Other"}
          selectedKey={threatWeapon?.id ?? null}
          onSelectionChange={(key) => {
            if (key !== null) setThreat({ ...threat, weaponId: key, ammoType: null });
          }}
          className={styles.wideControl}
        />
        <Select
          label="Threat ammo"
          items={uniqueAmmo}
          getKey={(option) => option.ammoType}
          getLabel={(option) => ammoTypeLabel(option.ammoType)}
          selectedKey={selectedAmmo?.ammoType ?? null}
          onSelectionChange={(key) => {
            if (key !== null) setThreat({ ...threat, ammoType: key });
          }}
          className={styles.control}
        />
        <div className={styles.field}>
          <span className={styles.label} aria-hidden="true">
            Threat placement
          </span>
          <SegmentedControl
            aria-label="Threat shot placement"
            size="sm"
            options={THREAT_PLACEMENTS}
            value={threat.placement}
            onChange={(placement) => setThreat({ ...threat, placement })}
          />
        </div>
      </div>
      {sections.length === 0 ? (
        <p className={styles.muted}>Pick two loadouts that can be opened to compare them.</p>
      ) : (
        sections.map((section) => <CompareSection key={section.id} section={section} />)
      )}
    </div>
  );
}
