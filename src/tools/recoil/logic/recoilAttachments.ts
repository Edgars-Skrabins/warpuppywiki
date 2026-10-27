import type { Attachment } from "@/core/data";
import { sameId } from "@/core/catalog";

export const RECOIL_ATTRIBUTES = ["Weapon.VerticalRecoilMultiplier", "Weapon.HorizontalRecoilMultiplier"] as const;

export function changesRecoil(attachment: Attachment): boolean {
  return attachment.modifiers.some((modifier) =>
    RECOIL_ATTRIBUTES.some((attribute) => sameId(modifier.attribute, attribute)),
  );
}

export function recoilAttachmentOptions(options: readonly Attachment[]): Attachment[] {
  return options.filter(changesRecoil);
}
