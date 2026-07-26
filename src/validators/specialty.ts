import { z } from "zod";

export const specialtySchema = z.object({
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  details: z.string().optional().default(""),
  codeName: z.string().optional().default(""),
  year: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().optional()),
  orderNumber: z.string().optional().default(""),
});
