import { z } from "zod";
import { BuildHeader } from "./common";

export const TagText = z.looseObject({
  tag: z.string(),
  text: z.string(),
  source: z.string(),
});

export const TagsFile = BuildHeader.extend({
  tags: z.array(TagText),
});
