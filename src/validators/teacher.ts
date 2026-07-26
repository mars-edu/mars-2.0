import { z } from "zod";

export const teacherSchema = z.object({
  surname: z.string().min(1, "Пожалуйста, введите фамилию преподавателя"),
  firstName: z.string().min(1, "Пожалуйста, введите имя преподавателя"),
  patronymic: z.string().min(1, "Пожалуйста, введите отчество преподавателя"),
  position: z.string().min(1, "Пожалуйста, введите должность"),
  employmentYear: z.string().min(1, "Пожалуйста, выберите год поступления"),
  gender: z.enum(["male", "female"], {
    message: "Пожалуйста, выберите пол",
  }),
});
