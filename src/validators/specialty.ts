import { z } from "zod";

export const specialtySchema = z.object({
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  details: z.string().optional().default(""),
  codeName: z.string().optional().default(""),
  // Coerce empty/undefined/NaN/negative/non-positive-int → undefined via
  // .catch(): the field is optional, so any unparseable input is treated as
  // "not set". Zod v4 .catch() runs when the pipeline throws — turns Add's
  // Number("") = 0 and Edit's NaN into undefined uniformly.
  year: z.coerce.number().int().positive().optional().catch(undefined),
  orderNumber: z.string().optional().default(""),
});
