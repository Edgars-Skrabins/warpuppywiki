import { z } from "zod";
import { BuildHeader } from "./common";

export const VehicleConfigsFile = BuildHeader.extend({
  configs: z.unknown(),
  assets: z.unknown(),
  skipped: z.array(
    z.looseObject({
      package: z.string(),
      types: z.array(z.string()),
    }),
  ),
  unresolved: z.array(z.string()),
});
