import { describe, expect, it } from "vitest";
import { sameId } from "@/core/catalog";
import type { Attachment } from "@/core/data";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import { changesRecoil, recoilAttachmentOptions } from "./recoilAttachments";

const attachments = AttachmentsFile.parse(attachmentsJson).attachments;

function attachment(id: string): Attachment {
  return attachments.find((candidate) => sameId(candidate.id, id))!;
}

describe("recoil attachments", () => {
  it("offers the 60-round AK magazine and not the 3x scope", () => {
    const options = recoilAttachmentOptions([
      attachment("Id.Item.3xScope"),
      attachment("Id.Item.AK74MMagazine"),
      attachment("Id.Item.AK74MExtendedMagazine"),
    ]);
    expect(options.map((option) => option.id)).toEqual(["Id.Item.AK74MExtendedMagazine"]);
  });

  it("matches recoil attributes case-insensitively", () => {
    const modifier = { attribute: "weapon.horizontalrecoilmultiplier", op: "multiply" as const, value: 0.9 };
    expect(changesRecoil({ ...attachment("Id.Item.3xScope"), modifiers: [modifier] })).toBe(true);
  });
});
