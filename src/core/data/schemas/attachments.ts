import { z } from "zod";
import { BuildHeader, Modifier } from "./common";

export const Attachment = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  type: z.string(),
  contexts: z.array(z.string()),
  modifiers: z.array(Modifier),
  characterModifiers: z.array(Modifier),
  magazine: z
    .looseObject({
      capacity: z.number(),
      calibers: z.array(z.string()),
    })
    .nullish(),
});

export const AttachmentsFile = BuildHeader.extend({
  attachments: z.array(Attachment),
});
