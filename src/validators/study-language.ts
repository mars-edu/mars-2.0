import { z } from "zod";

export const studyLanguageSchema = z.object({
  code: z
    .string()
    .min(1, "Пожалуйста, введите код языка")
    .regex(/^[a-z]{2,5}$/, "Код языка должен состоять из 2-5 строчных латинских букв"),
  name: z.string().min(1, "Пожалуйста, введите название языка"),
  shortName: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  color: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  isDefault: z.boolean(),
  order: z.coerce.number().int().optional(),
});
