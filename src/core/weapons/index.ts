export { AMMO_TYPE_LABELS, ammoTypeFromVariationSuffix, ammoTypeOf, type AmmoTypeKey } from "./ammoTypes";
export { damageClassOf, UNIVERSAL_DAMAGE_CLASS } from "./damageClass";
export { effectiveStats, type EffectiveStats, type FittedAttachment } from "./effectiveStats";
export { falloffAt, falloffSeries, type FalloffPoint } from "./falloff";
export { fitsSlot, itemsFittingSlot, type SlotCandidate, type WeaponSlot } from "./fitsSlot";
export { cumulativeRecoil, scaledRecoilPattern, type RecoilPoint } from "./recoil";
export { useWeaponIndex } from "./useWeaponIndex";
export {
  buildWeaponIndex,
  type AmmoOption,
  type LoadedMagazine,
  type MagazineOption,
  type PlayerWeapon,
  type WeaponIndex,
  type WeaponIndexInput,
} from "./weaponIndex";
