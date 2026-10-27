import { defineUrlState } from "@/core/state";
import { z } from "zod";

export const tableState = defineUrlState({
  key: "t",
  version: 1,
  schema: z.string(),
  defaults: "",
});
