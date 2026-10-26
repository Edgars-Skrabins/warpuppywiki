import type { Attachment, Weapon } from "@/core/data";
import { collect, combine, type CombineResult, type ModifierSource } from "@/core/modifiers";
import { normalizeId } from "@/core/catalog";

export interface FittedAttachment {
  slot: string;
  attachment: Attachment;
  hiddenDefault: boolean;
}

export interface EffectiveStats {
  adsTime: CombineResult | null;
  verticalRecoil: CombineResult;
  horizontalRecoil: CombineResult;
  spread: CombineResult;
  randomDeviation: number | null;
  equipSpeed: CombineResult;
  zoom: CombineResult;
  zeroingMin: CombineResult | null;
  zeroingMax: CombineResult | null;
  magazineCapacity: number | null;
  character: Record<string, CombineResult>;
}

const CHARACTER_PREFIX = "character.";
const CHARACTER_ADS_TIME = "Character.AdsTimeMultiplier";

function attachmentSource(fitted: FittedAttachment): ModifierSource {
  const { attachment } = fitted;
  return {
    label: attachment.name ?? attachment.id,
    modifiers: [...attachment.modifiers, ...attachment.characterModifiers],
  };
}

function adsTimeOf(weapon: Weapon, sources: readonly ModifierSource[]): CombineResult | null {
  if (weapon.adsTime == null) {
    return null;
  }
  const aim = combine(weapon.adsTime, collect(sources, "Weapon.AimTime"));
  const character = combine(1, collect(sources, CHARACTER_ADS_TIME));
  return {
    ...aim,
    value: aim.value * character.value,
    steps: [...aim.steps, ...character.steps.map((step) => ({ ...step, after: aim.value * step.after }))],
  };
}

function zeroingOf(base: number | null | undefined, sources: readonly ModifierSource[], attribute: string) {
  const sourced = collect(sources, attribute);
  if (base == null && !sourced.some((entry) => entry.modifier.op === "override")) {
    return null;
  }
  return combine(base ?? 0, sourced);
}

function characterStats(sources: readonly ModifierSource[]): Record<string, CombineResult> {
  const attributes = new Map<string, string>();
  for (const source of sources) {
    for (const modifier of source.modifiers) {
      const key = normalizeId(modifier.attribute);
      if (key.startsWith(CHARACTER_PREFIX) && !attributes.has(key)) {
        attributes.set(key, modifier.attribute);
      }
    }
  }
  return Object.fromEntries(
    [...attributes.values()].map((attribute) => [attribute, combine(1, collect(sources, attribute))]),
  );
}

export function effectiveStats(
  weapon: Weapon,
  fitted: readonly FittedAttachment[],
  extraSources: readonly ModifierSource[] = [],
): EffectiveStats {
  const sources = [...fitted.map(attachmentSource), ...extraSources];
  const spread = combine(1, collect(sources, "Weapon.SpreadMultiplier"));
  const magazine = fitted.findLast((entry) => entry.attachment.magazine)?.attachment.magazine;
  return {
    adsTime: adsTimeOf(weapon, sources),
    verticalRecoil: combine(1, collect(sources, "Weapon.VerticalRecoilMultiplier")),
    horizontalRecoil: combine(1, collect(sources, "Weapon.HorizontalRecoilMultiplier")),
    spread,
    randomDeviation: weapon.randomDeviation == null ? null : weapon.randomDeviation * spread.value,
    equipSpeed: combine(1, collect(sources, "Weapon.EquipSpeedMultiplier")),
    zoom: combine(1, collect(sources, "Weapon.AdsZoomMultiplier")),
    zeroingMin: zeroingOf(weapon.zeroing?.min, sources, "Weapon.MinZeroingRange"),
    zeroingMax: zeroingOf(weapon.zeroing?.max, sources, "Weapon.MaxZeroingRange"),
    magazineCapacity: magazine?.capacity ?? null,
    character: characterStats(sources),
  };
}
