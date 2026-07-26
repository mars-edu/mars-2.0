import { z } from "zod";

export const moduleTemplateSchema = z.object({
  fields: z
    .array(z.string())
    .refine(
      (fields) => fields.some((field) => field.trim() !== ""),
      "Пожалуйста, заполните хотя бы одно поле"
    ),
});
