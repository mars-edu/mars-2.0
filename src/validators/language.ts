import { z } from "zod";

export const languageSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите полное название"),
  shortName: z.string().min(1, "Пожалуйста, введите краткое название"),
});
