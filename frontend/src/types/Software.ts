/** @format */

import { z } from "zod";

/* ---------------- Schema y tipos ---------------- */
export const softwareSchema = z.object({
  id_software: z.string(),
  id_asset: z.string(),
  software_name: z.string(),
  version: z.string(),
  vendor: z.string().optional(),
  os_host: z.string(),
});
export type Software = z.infer<typeof softwareSchema>;
