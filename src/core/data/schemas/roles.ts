import { z } from "zod";
import { BuildHeader } from "./common";

export const Role = z.looseObject({
  id: z.string(),
  xpResource: z.string(),
  levels: z.array(
    z.looseObject({
      level: z.number(),
      xp: z.number(),
    }),
  ),
});

export const RolesFile = BuildHeader.extend({
  roles: z.array(Role),
});
