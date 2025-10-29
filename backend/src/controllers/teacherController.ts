import { Hono, Context } from "hono";
import AuthService, { ROLES } from "../services/authService.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { generateEmail } from "../utils/emailGenerator.js";
import type { Env } from "../types/env.js";
import { getPrismaClient } from "../utils/prismaClient.js";

const teachers = new Hono<{ Bindings: Env }>();

teachers.post("/register", async (c: Context<{ Bindings: Env }>) => {
  try {
    const {
      firstName,
      lastName,
      middleName,
      position,
      gender,
      employmentYear,
    } = await c.req.json();

    if (!firstName || !lastName || !middleName) {
      return c.json(
        {
          success: false,
          message: "First name, last name, and middle name are required",
        },
        400
      );
    }

    const email = await generateEmail(firstName, lastName, c.env);
    const password = generatePassword(2);

    const authService = new AuthService(c);
    const result = await authService.register({
      firstName,
      lastName,
      middleName,
      email,
      password,
    });

    if (!result.success || !result.user) {
      return c.json(
        {
          success: false,
          message: result.message || "Failed to create teacher user",
        },
        400
      );
    }

    const prisma = getPrismaClient(c.env);
    await prisma.userRole.create({
      data: {
        userId: result.user.id,
        role: ROLES.TEACHER,
      },
    });

    return c.json({
      success: true,
      email,
      password,
      teacherId: result.user.id,
    });
  } catch (error) {
    console.error("Teacher registration error:", error);
    return c.json(
      {
        success: false,
        message: "An error occurred while creating teacher account",
      },
      500
    );
  }
});

export default teachers;
